import Users from "../src/database/models/Users";
import {
  call,
  createUser,
  loginAs,
  newIp,
  otpFromEmail,
  register,
  testPassword,
  tokenFromLink,
  useApi,
  waitForEmail,
} from "./helpers/api";

useApi();

describe("per-account login limit", () => {
  test("20 failures from different IPs lock the account's password login", async () => {
    const { credentials } = await createUser();
    const wrongLogin = () =>
      call("POST", "/auth/login", { body: { email: credentials.email, password: "wrong-pass" } });

    for (let attempt = 0; attempt < 20; attempt += 1) {
      expect((await wrongLogin()).status).toBe(401); // Every call comes from a new IP.
    }

    const blocked = await call("POST", "/auth/login", {
      body: { email: credentials.email, password: testPassword },
    });

    expect(blocked.status).toBe(429);
    expect(blocked.json.code).toBe("TOO_MANY_REQUESTS");
    // The per-IP limit has headers, the per-account one doesn't: they'd tell an attacker the pace.
    expect(blocked.headers.get("ratelimit") ?? "").not.toContain("20-in");
  });

  test("successful logins don't count", async () => {
    const { credentials } = await createUser();

    for (let attempt = 0; attempt < 25; attempt += 1) {
      const { status } = await call("POST", "/auth/login", {
        body: { email: credentials.email, password: testPassword },
      });
      expect(status).toBe(200);
    }
  });
});

describe("OTP login race", () => {
  test("two requests with the right code get one session", async () => {
    const { credentials } = await createUser();
    await call("POST", "/auth/requestOtp", { body: { email: credentials.email } });
    const otp = otpFromEmail((await waitForEmail(credentials.email, "one-time")).html);

    const results = await Promise.all(
      [1, 2].map(() =>
        call("POST", "/auth/login", {
          body: { email: credentials.email, password: otp, withOtp: true },
        }),
      ),
    );

    expect(results.map(({ status }) => status).sort()).toEqual([200, 401]);
  });
});

describe("activation", () => {
  test("a pending account disabled by an admin can't activate into a session", async () => {
    await register();
    const link = tokenFromLink(
      (await waitForEmail("alice@x.com", "Activate")).html,
      "/auth/activate/",
    );
    await Users.updateOne({ "credentials.email": "alice@x.com" }, { isDisabled: true });

    const { status, json } = await call("POST", "/auth/activate", { body: { token: link } });

    expect(status).toBe(403);
    expect(json.code).toBe("USER_DISABLED");
    expect(json.token).toBeUndefined();
  });
});

describe("CORS", () => {
  const preflight = (origin: string) =>
    call("OPTIONS", "/auth/login", {
      headers: { origin, "access-control-request-method": "POST" },
    });

  test("the frontend's origin is allowed", async () => {
    const { headers } = await preflight("http://front");

    expect(headers.get("access-control-allow-origin")).toBe("http://front");
  });

  test("any other origin isn't", async () => {
    const { headers } = await preflight("https://evil.example.com");

    expect(headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("plain-text emails", () => {
  test("every email has a text part with working links and no markup", async () => {
    const { credentials } = await createUser();
    await call("POST", "/auth/requestPasswordReset", { body: { email: credentials.email } });
    const { text } = await waitForEmail(credentials.email, "Reset");

    expect(text).toMatch(/Reset my password: http:\/\/front\/auth\/resetPassword\/eyJ/);
    expect(text).not.toMatch(/<|&[a-z]+;/);
  });
});

describe("metrics", () => {
  const metrics = (token?: string) => call("GET", "/metrics", { token, ip: newIp() });

  test("need the metrics token", async () => {
    expect((await metrics()).status).toBe(401);
    expect((await metrics("wrong")).status).toBe(401);
  });

  test("count requests by route pattern, never by real URL", async () => {
    const user = await createUser();
    const admin = await loginAs({ role: "ADMIN" });
    await call("GET", `/admin/users/${user.id}`, { token: admin.token });

    const { status, text } = await metrics(process.env.METRICS_TOKEN);

    expect(status).toBe(200);
    expect(text).toMatch(
      /http_request_duration_seconds_count\{[^}]*route="\/admin\/users\/:userId"/,
    );
    expect(text).not.toContain(user.id);
    expect(text).toContain("process_cpu_seconds_total");
  });

  test("count emails by result", async () => {
    const { credentials } = await createUser();
    await call("POST", "/auth/requestPasswordReset", { body: { email: credentials.email } });
    await waitForEmail(credentials.email, "Reset");

    const { text } = await metrics(process.env.METRICS_TOKEN);

    expect(text).toMatch(/emails_sent_total\{result="sent"\} [1-9]/);
  });
});
