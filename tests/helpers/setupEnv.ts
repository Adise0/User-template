import { generateKeyPairSync } from "node:crypto";

// Runs before anything else in each test file. Nothing here is real, and the .env is never loaded.
process.env.NODE_ENV = "production"; // Plain logs: no pretty-printing worker inside Jest.
process.env.LOG_LEVEL = "silent";
process.env.TOKEN_SECRET = "test-only-secret-test-only-secret-1234";
process.env.FRONTEND_URL = "http://front";
process.env.BACKEND_URL = "http://back";
process.env.METRICS_TOKEN = "test-only-metrics-token-test-only-metrics";

// Both OAuth providers on, talking to the fake provider in fakeOAuthProvider.ts.
process.env.GOOGLE_CLIENT_ID = "google-client-id";
process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";
process.env.APPLE_CLIENT_ID = "apple-client-id";
process.env.APPLE_TEAM_ID = "apple-team-id";
process.env.APPLE_KEY_ID = "apple-key-id";
process.env.APPLE_PRIVATE_KEY = generateKeyPairSync("ec", { namedCurve: "prime256v1" })
  .privateKey.export({ format: "pem", type: "pkcs8" })
  .toString();
