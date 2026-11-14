import { createClient } from "@neondatabase/neon-js";

const authUrl = process.env.ISOKO_TEST_AUTH_URL;
const dataApiUrl = process.env.ISOKO_TEST_DATA_API_URL;
const functionUrl = process.env.ISOKO_TEST_FUNCTION_URL;
const expectedBranch = process.env.ISOKO_EXPECTED_NEON_BRANCH || "isoko-setup";

for (const [name, value] of Object.entries({ authUrl, dataApiUrl, functionUrl })) {
  if (!value) throw new Error(`Missing ${name}`);
}

const neon = createClient({
  auth: { url: authUrl, allowAnonymous: true },
  dataApi: { url: dataApiUrl },
});

const healthResponse = await fetch(new URL("health", functionUrl), {
  signal: AbortSignal.timeout(20_000),
});
if (!healthResponse.ok) {
  throw new Error(`Neon Function health returned HTTP ${healthResponse.status}`);
}
const health = await healthResponse.json();
if (health.status !== "healthy" || health.branch !== expectedBranch) {
  throw new Error(`Unexpected Neon Function health payload: ${JSON.stringify(health)}`);
}

const { data, error } = await neon
  .from("v_public_bootstrap")
  .select("payload")
  .limit(1)
  .single();

if (error) {
  throw new Error(`Anonymous Data API bootstrap failed: ${error.message}`);
}

const payload = data?.payload;
if (!payload) throw new Error("Bootstrap view returned no payload");

// Public shop cards must expose the separate identity-verification state.
// This catches accidental "verified" labels being inferred from an active account.
const { data: publicShops, error: publicShopError } = await neon
  .from("v_public_shops")
  .select("id,identity_status,seller_name,seller_avatar_path,social_links")
  .limit(10);
if (publicShopError) {
  throw new Error(`Public identity-status read failed: ${publicShopError.message}`);
}
for (const shop of publicShops ?? []) {
  if (!["unverified", "pending", "verified", "rejected"].includes(shop.identity_status)) {
    throw new Error(`Unexpected public identity status: ${shop.identity_status}`);
  }
}
if (payload.categories?.length !== 34) {
  throw new Error(`Expected 34 visible categories, got ${payload.categories?.length ?? 0}`);
}
if (payload.areas?.length !== 65) {
  throw new Error(`Expected 65 areas, got ${payload.areas?.length ?? 0}`);
}
if (!Array.isArray(payload.shops) || !Array.isArray(payload.products)) {
  throw new Error("Public shop and product collections must remain readable after launch");
}
if (Number(payload.settings?.DEFAULT_PRODUCT_LIMIT) !== 500) {
  throw new Error("Default seller product capacity must be 500");
}
if (payload.settings?.ADS_ENABLED !== false) {
  throw new Error("Ads must remain disabled until explicitly configured");
}

console.log(JSON.stringify({
  status: "success",
  branch: health.branch,
  categories: payload.categories.length,
  areas: payload.areas.length,
  shops: payload.shops.length,
  products: payload.products.length,
  adsEnabled: payload.settings.ADS_ENABLED,
  identityStatusField: true,
}));
