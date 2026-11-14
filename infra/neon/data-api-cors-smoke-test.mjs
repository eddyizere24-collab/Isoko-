const dataApiUrl = process.env.ISOKO_TEST_DATA_API_URL;
const expectedOrigin = process.env.ISOKO_EXPECTED_WEB_ORIGIN;

if (!dataApiUrl || !expectedOrigin) {
  throw new Error("Missing ISOKO_TEST_DATA_API_URL or ISOKO_EXPECTED_WEB_ORIGIN");
}

const preflightUrl = new URL("rpc/start_seller_registration_v1", dataApiUrl.endsWith("/") ? dataApiUrl : dataApiUrl + "/");
const response = await fetch(preflightUrl, {
  method: "OPTIONS",
  headers: {
    Origin: expectedOrigin,
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "authorization,content-type",
  },
  signal: AbortSignal.timeout(20_000),
});

const allowOrigin = response.headers.get("access-control-allow-origin");
const allowMethods = new Set(
  (response.headers.get("access-control-allow-methods") ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean),
);
const allowHeaders = new Set(
  (response.headers.get("access-control-allow-headers") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

const problems = [];
if (![200, 204].includes(response.status)) problems.push(`expected HTTP 200 or 204, received ${response.status}`);
if (allowOrigin !== expectedOrigin) problems.push("Access-Control-Allow-Origin does not match the browser origin");
if (!allowMethods.has("POST")) problems.push("POST is not allowed by CORS");
if (!allowHeaders.has("authorization")) problems.push("Authorization header is not allowed by CORS");
if (!allowHeaders.has("content-type")) problems.push("Content-Type header is not allowed by CORS");

if (problems.length) {
  throw new Error(`Neon Data API preflight failed for ${expectedOrigin}: ${problems.join("; ")}; allow-origin=${allowOrigin ?? "missing"}; allow-methods=${response.headers.get("access-control-allow-methods") ?? "missing"}; allow-headers=${response.headers.get("access-control-allow-headers") ?? "missing"}`);
}

console.log(JSON.stringify({
  status: "success",
  endpoint: preflightUrl.origin,
  origin: expectedOrigin,
  httpStatus: response.status,
  postAllowed: allowMethods.has("POST"),
  authorizationAllowed: allowHeaders.has("authorization"),
  contentTypeAllowed: allowHeaders.has("content-type"),
}));
