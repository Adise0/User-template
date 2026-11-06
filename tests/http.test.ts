import Users from "../src/database/models/Users";
import { maskTokensInUrl } from "../src/server/utils/logger";
import { call, createUser, loginAs, useApi } from "./helpers/api";

useApi();

describe("errors", () => {
  test("a malformed URL param is a 400", async () => {
    const { status, json } = await call("GET", "/auth/activate/%E0%A4%A");

    expect(status).toBe(400);
    expect(json.code).toBe("BAD_REQUEST");
  });

  test("broken JSON is a 400", async () => {
    const { status } = await call("POST", "/auth/login", {
      headers: { "content-type": "application/json" },
      body: undefined,
    });

    expect(status).toBe(400);
  });

  test("an unknown path is a 404", async () => {
    const { status, json } = await call("GET", "/nope");

    expect(status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
  });

  test("a wrong verb is a 405 that lists what's allowed", async () => {
    const { token } = await loginAs();
    const { status, json } = await call("DELETE", "/users/myUser", { token });

    expect(status).toBe(405);
    expect(json.details.allowedMethods).toEqual(["GET", "PATCH", "HEAD"]);
  });

  test("HEAD works on GET routes", async () => {
    const { token } = await loginAs();

    expect((await call("HEAD", "/users/myUser", { token })).status).toBe(200);
  });
});

describe("request ids", () => {
  test("one is generated for every request", async () => {
    const { headers } = await call("GET", "/health");

    expect(headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("a valid incoming one is kept, anything else replaced", async () => {
    const kept = await call("GET", "/health", { headers: { "x-request-id": "abc-123" } });
    const replaced = await call("GET", "/health", { headers: { "x-request-id": "x".repeat(65) } });

    expect(kept.headers.get("x-request-id")).toBe("abc-123");
    expect(replaced.headers.get("x-request-id")).toHaveLength(36);
  });
});

describe("logging", () => {
  test("tokens in URLs are masked", () => {
    expect(maskTokensInUrl("/auth/activate/eyJabc.def-1.g_h")).toBe("/auth/activate/[token]");
  });
});

describe("health", () => {
  test("is up while connected, and only answers GET", async () => {
    const { status, json } = await call("GET", "/health");

    expect(status).toBe(200);
    expect(json).toEqual({ status: "ok", database: "connected" });
    expect((await call("POST", "/health")).status).toBe(405);
  });
});

describe("the database", () => {
  test("has unique indexes on credentials only, and a TTL on pending accounts", async () => {
    const indexes = await Users.collection.indexes();
    const byName = Object.fromEntries(indexes.map((index) => [index.name, index]));

    expect(byName["credentials.email_1"].unique).toBe(true);
    expect(byName["credentials.username_1"].unique).toBe(true);
    expect(byName["information.email_1"]).toBeUndefined();
    expect(byName["information.username_1"]).toBeUndefined();
    expect(byName.pendingExpiresAt_1.expireAfterSeconds).toBe(0);
  });

  test("users get timestamps and a default role, and toJSON hides secrets", async () => {
    const user = await createUser({ verificationToken: "hash", resetPasswordToken: "hash" });
    const json = user.toJSON() as unknown as Record<string, unknown>;

    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.role).toBe("USER");
    expect(json.verificationToken).toBeUndefined();
    expect(json.resetPasswordToken).toBeUndefined();
    expect(json.credentials).toBeUndefined();
  });
});
