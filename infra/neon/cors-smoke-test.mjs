const functionUrl = process.env.ISOKO_TEST_FUNCTION_URL;
const expectedOrigin = process.env.ISOKO_EXPECTED_WEB_ORIGIN;

if (!functionUrl || !expectedOrigin) {
  throw new Error("Missing ISOKO_TEST_FUNCTION_URL or ISOKO_EXPECTED_WEB_ORIGIN");
}

const preflightUrl = new URL("api/upload", functionUrl);
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
if (response.status !== 204) problems.push(`expected HTTP 204, received ${response.status}`);
if (allowOrigin !== expectedOrigin) problems.push("Access-Control-Allow-Origin does not match the deployed site origin");
if (!allowMethods.has("POST")) problems.push("POST is not allowed by CORS");
if (!allowHeaders.has("authorization")) problems.push("Authorization header is not allowed by CORS");
if (!allowHeaders.has("content-type")) problems.push("Content-Type header is not allowed by CORS");

if (problems.length) {
  throw new Error(
    `Seller upload preflight failed for ${expectedOrigin}: ${problems.join("; ")}`,
  );
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
