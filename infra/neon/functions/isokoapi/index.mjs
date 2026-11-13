/**
 * ISOKO Neon Function smoke test.
 *
 * This first deployment deliberately exposes no marketplace data and performs
 * no database writes. It proves the Node.js 24 Fetch handler can run on the
 * isolated isoko-setup branch before the full API is migrated from Express.
 *
 * Next implementation stage: connect PostgreSQL via the Neon serverless
 * driver, then add authenticated API routes and private/public object storage.
 */
export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method !== "GET" || (url.pathname !== "/" && url.pathname !== "/health")) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(
      {
        service: "ISOKO API",
        phase: "setup-smoke-test",
        status: "healthy",
        database: "not queried by this smoke test",
        storage: "not accessed by this smoke test",
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      },
    );
  },
};
