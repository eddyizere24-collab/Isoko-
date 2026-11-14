import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const PUBLIC_BUCKET = "isoko-public-assets";
const PRIVATE_BUCKET = "isoko-private-kyc";
const MAX_IMAGE_BYTES = 500 * 1024;
const ALLOWED_MIME = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function json(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      ...headers,
    },
  });
}

function allowedOrigin(origin) {
  if (!origin) return false;
  if (origin === "http://localhost:5173" || origin === "http://127.0.0.1:5173") return true;
  if (origin.endsWith(".pages.dev")) return true;
  const configured = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return configured.includes(origin);
}

function corsHeaders(request) {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigin(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "authorization,content-type",
    "access-control-max-age": "86400",
    "vary": "Origin",
  };
}

function bytesFromDataUrl(value) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(value ?? ""));
  if (!match) throw new Error("IMAGE_TYPE_NOT_ALLOWED");
  const mime = match[1];
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error("IMAGE_SIZE_INVALID");
  const valid =
    (mime === "image/jpeg" && bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (mime === "image/png" && bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (mime === "image/webp" && bytes.length >= 12 &&
      bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP");
  if (!valid) throw new Error("IMAGE_SIGNATURE_INVALID");
  return { mime, bytes };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key, value, encoding) {
  const result = createHmac("sha256", key).update(value).digest();
  return encoding === "hex" ? result.toString("hex") : result;
}

function awsEncode(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    "%" + char.charCodeAt(0).toString(16).toUpperCase()
  );
}

function getStorageConfig() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION;
  if (!endpoint || !accessKey || !secretKey || !region) {
    throw new Error("OBJECT_STORAGE_NOT_CONFIGURED");
  }
  const parsed = new URL(endpoint);
  return { endpoint: parsed, accessKey, secretKey, region };
}

function signingKey(secretKey, dateStamp, region) {
  const kDate = hmac("AWS4" + secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

async function putObject(bucket, key, body, contentType) {
  const config = getStorageConfig();
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(body);
  const encodedKey = key.split("/").map(awsEncode).join("/");
  const canonicalUri = config.endpoint.pathname.replace(/\/$/, "") +
    "/" + bucket + "/" + encodedKey;
  const host = config.endpoint.host;
  const canonicalHeaders =
    "content-type:" + contentType + "\n" +
    "host:" + host + "\n" +
    "x-amz-content-sha256:" + payloadHash + "\n" +
    "x-amz-date:" + amzDate + "\n";
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT", canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash,
  ].join("\n");
  const scope = dateStamp + "/" + config.region + "/s3/aws4_request";
  const stringToSign = [
    "AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest),
  ].join("\n");
  const signature = hmac(signingKey(config.secretKey, dateStamp, config.region), stringToSign, "hex");
  const authorization =
    "AWS4-HMAC-SHA256 Credential=" + config.accessKey + "/" + scope +
    ", SignedHeaders=" + signedHeaders + ", Signature=" + signature;

  const response = await fetch(config.endpoint.origin + canonicalUri, {
    method: "PUT",
    headers: {
      "content-type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      authorization,
    },
    body,
  });
  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new Error("OBJECT_STORAGE_UPLOAD_FAILED_" + response.status + "_" + responseText.slice(0, 120));
  }
  return {
    key,
    url: config.endpoint.origin + canonicalUri,
    bytes: body.length,
  };
}

async function presignGet(bucket, key, expiresSeconds = 300) {
  const config = getStorageConfig();
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const scope = dateStamp + "/" + config.region + "/s3/aws4_request";
  const credential = config.accessKey + "/" + scope;
  const encodedKey = key.split("/").map(awsEncode).join("/");
  const canonicalUri = config.endpoint.pathname.replace(/\/$/, "") +
    "/" + bucket + "/" + encodedKey;
  const params = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresSeconds),
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalQuery = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => awsEncode(name) + "=" + awsEncode(value))
    .join("&");
  const canonicalHeaders = "host:" + config.endpoint.host + "\n";
  const canonicalRequest = [
    "GET", canonicalUri, canonicalQuery, canonicalHeaders, "host", "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest),
  ].join("\n");
  const signature = hmac(signingKey(config.secretKey, dateStamp, config.region), stringToSign, "hex");
  return config.endpoint.origin + canonicalUri + "?" + canonicalQuery +
    "&X-Amz-Signature=" + signature;
}

async function getOwnProfile(token) {
  const dataApiUrl = process.env.NEON_DATA_API_URL;
  if (!dataApiUrl) throw new Error("DATA_API_NOT_CONFIGURED");
  const response = await fetch(dataApiUrl.replace(/\/$/, "") +
    "/profiles?select=id,role,status,full_name&limit=1", {
    headers: {
      authorization: "Bearer " + token,
      accept: "application/json",
    },
  });
  if (!response.ok) throw new Error("AUTHENTICATION_FAILED");
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error("PROFILE_NOT_FOUND");
  return rows[0];
}

async function getOwnRegistrationDraft(token) {
  const dataApiUrl = process.env.NEON_DATA_API_URL;
  if (!dataApiUrl) throw new Error("DATA_API_NOT_CONFIGURED");
  const response = await fetch(dataApiUrl.replace(/\/$/, "") +
    "/rpc/get_own_seller_registration_draft_v1", {
    method: "POST",
    headers: {
      authorization: "Bearer " + token,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: "{}",
  });
  if (!response.ok) throw new Error("REGISTRATION_DRAFT_NOT_FOUND");
  const draft = await response.json();
  if (!draft?.draft_id || !draft?.expires_at) {
    throw new Error("REGISTRATION_DRAFT_NOT_FOUND");
  }
  return draft;
}

async function getKycForSeller(sellerId, token) {
  const dataApiUrl = process.env.NEON_DATA_API_URL;
  if (!dataApiUrl) throw new Error("DATA_API_NOT_CONFIGURED");
  const response = await fetch(dataApiUrl.replace(/\/$/, "") +
    "/rpc/admin_get_kyc_private_v1", {
    method: "POST",
    headers: {
      authorization: "Bearer " + token,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ p_seller_id: sellerId }),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("KYC_ACCESS_DENIED");
    throw new Error("KYC_RECORD_NOT_FOUND");
  }
  const kyc = await response.json();
  if (!kyc?.seller_id || kyc.seller_id !== sellerId) {
    throw new Error("KYC_RECORD_NOT_FOUND");
  }
  return kyc;
}

export default {
  async fetch(request) {
    const cors = corsHeaders(request);
    const origin = request.headers.get("origin");
    if (origin && !allowedOrigin(origin)) {
      return json({ error: "Origin not allowed" }, 403);
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";

    if (request.method === "GET" && (path === "/" || path === "/health")) {
      return json({
        service: "ISOKO API",
        status: "healthy",
        function: "neon-nodejs24",
        branch: process.env.NEON_BRANCH ?? "unknown",
        databaseApi: Boolean(process.env.NEON_DATA_API_URL),
        objectStorage: Boolean(process.env.AWS_ENDPOINT_URL_S3),
      }, 200, cors);
    }

    const authorization = request.headers.get("authorization") ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) return json({ error: "Ugomba kwinjira mbere yo gukomeza." }, 401, cors);

    try {
      let profile = null;
      let registrationDraft = null;
      if (request.method === "POST" && path === "/api/upload") {
        const body = await request.json();
        const kind = String(body.kind ?? "full");

        try {
          profile = await getOwnProfile(token);
        } catch (error) {
          if (kind !== "kyc" || !(error instanceof Error) || error.message !== "PROFILE_NOT_FOUND") {
            throw error;
          }
          registrationDraft = await getOwnRegistrationDraft(token);
        }

        if (profile && (!["seller", "admin"].includes(profile.role) ||
            ["rejected", "suspended"].includes(profile.status))) {
          return json({ error: "Konti yawe ntiyemerewe kohereza amafoto." }, 403, cors);
        }
        if (!profile && kind !== "kyc") {
          return json({ error: "Banza wuzuze kwiyandikisha mbere yo kohereza iri foto." }, 403, cors);
        }

        const { mime, bytes } = bytesFromDataUrl(body.dataUrl);
        const extension = ALLOWED_MIME.get(mime);
        const bucket = kind === "kyc" ? PRIVATE_BUCKET : PUBLIC_BUCKET;
        const ownerKey = profile?.id ?? ("draft-" + registrationDraft.draft_id);
        const prefix = kind === "kyc"
          ? "kyc/" + ownerKey
          : kind === "campaign"
            ? "campaigns/" + ownerKey
            : kind === "profile"
              ? "profiles/" + ownerKey
              : kind === "shop"
                ? "shops/" + ownerKey
                : "products/" + ownerKey;
        if (kind === "campaign" && profile?.role !== "admin") {
          return json({ error: "Admin gusa ni we wohereza amafoto ya campaigns." }, 403, cors);
        }
        if (!["kyc", "campaign", "profile", "shop", "full", "thumb"].includes(kind)) {
          return json({ error: "Ubwoko bw’ifoto ntibwemewe." }, 400, cors);
        }
        const key = prefix + "/" + new Date().toISOString().slice(0, 10) +
          "/" + randomUUID() + "." + extension;
        const uploaded = await putObject(bucket, key, bytes, mime);
        return json({
          key: uploaded.key,
          url: kind === "kyc" ? null : uploaded.url,
          bytes: uploaded.bytes,
        }, 201, cors);
      }

      if (!profile) profile = await getOwnProfile(token);
      const kycMatch = path.match(/^\/api\/admin\/kyc\/([^/]+)$/);
      if (request.method === "GET" && kycMatch) {
        if (profile.role !== "admin" || profile.status !== "approved") {
          return json({ error: "Admin gusa ni we ureba KYC." }, 403, cors);
        }
        const sellerId = decodeURIComponent(kycMatch[1]);
        const kyc = await getKycForSeller(sellerId, token);
        const entries = [
          ["idFrontUrl", kyc.id_front_key],
          ["idBackUrl", kyc.id_back_key],
          ["selfieUrl", kyc.selfie_key],
          ["shopPhotoUrl", kyc.shop_photo_key],
        ];
        const urls = {};
        for (const [name, key] of entries) {
          if (key) urls[name] = await presignGet(PRIVATE_BUCKET, key, 300);
        }
        return json({
          kyc: {
            seller_id: kyc.seller_id,
            full_name_on_id: kyc.full_name_on_id,
            business_type: kyc.business_type,
            idFrontUrl: urls.idFrontUrl ?? null,
            idBackUrl: urls.idBackUrl ?? null,
            selfieUrl: urls.selfieUrl ?? null,
            shopPhotoUrl: urls.shopPhotoUrl ?? null,
            submitted_at: kyc.submitted_at,
          },
          signedUrlExpiresIn: 300,
        }, 200, cors);
      }

      return json({ error: "Not found" }, 404, cors);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      if (message === "AUTHENTICATION_FAILED" || message === "PROFILE_NOT_FOUND" ||
          message === "REGISTRATION_DRAFT_NOT_FOUND") {
        return json({ error: "Konti ntiyemejwe cyangwa ntabwo winjiye." }, 401, cors);
      }
      if (message.startsWith("IMAGE_")) {
        return json({ error: "Ifoto ntiyemewe. Koresha JPEG, PNG cyangwa WebP iri munsi ya 500 KB." }, 400, cors);
      }
      console.error("ISOKO API request failed", { path, message });
      return json({ error: "Habaye ikibazo mu kubika amakuru. Ongera ugerageze." }, 503, cors);
    }
  },
};
