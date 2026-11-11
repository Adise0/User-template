import Users from "../src/database/models/Users";
import { getCurrentTotpStep, getTotpCode } from "../src/server/utils/twoFactor/totp";
import {
  call,
  createUser,
  getMe,
  login,
  loginAs,
  staleSession,
  testPassword,
  useApi,
  waitForEmail,
} from "./helpers/api";
import { installFakeOAuthProvider, oauthCode } from "./helpers/fakeOAuthProvider";

useApi();

beforeAll(installFakeOAuthProvider);

// The authenticator app's code. The API accepts one step either way, so tests that need two
// different valid codes in a row use the current step and the next one.
const codeFor = (secret: string, stepOffset = 0) =>
  getTotpCode(secret, getCurrentTotpStep() + stepOffset);

// Turns 2FA on for a fresh user, the way the frontend would.
const enableTwoFactor = async () => {
  const { user, token } = await loginAs();
  const setup = await call("POST", "/auth/twoFactor/setup", { token });
  const { secret } = setup.json;
  const enable = await call("POST", "/auth/twoFactor/enable", {
    token,
    body: { code: codeFor(secret) },
  });

  return { user, token, secret, backupCodes: enable.json.backupCodes as string[] };
};

const passwordLogin = (email: string) =>
  call("POST", "/auth/login", { body: { email, password: testPassword } });

const verify = (token: string, code: string) =>
  call("POST", "/auth/twoFactor/verify", { body: { token, code } });

describe("turning it on", () => {
  test("setup answers a secret and its QR content, enable checks a code", async () => {
    const { user, token } = await loginAs();
    const { status, json } = await call("POST", "/auth/twoFactor/setup", { token });

    expect(status).toBe(200);
    expect(json.secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(json.otpauthUrl).toContain(`secret=${json.secret}`);

    // Nothing changes until it's enabled.
    expect(await login(user.credentials.email)).toEqual(expect.any(String));

    const wrong = await call("POST", "/auth/twoFactor/enable", { token, body: { code: "000000" } });
    expect(wrong.json.code).toBe("TWO_FACTOR_INVALID_CODE");

    const enabled = await call("POST", "/auth/twoFactor/enable", {
      token,
      body: { code: codeFor(json.secret) },
    });

    expect(enabled.status).toBe(200);
    expect(enabled.json.backupCodes).toHaveLength(10);
    expect((await getMe(token)).json.twoFactorEnabled).toBe(true);
    await waitForEmail(user.credentials.email, "Two-factor authentication is on");
  });

  test("the secret is stored encrypted, and backup codes only as hashes", async () => {
    const { user, secret, backupCodes } = await enableTwoFactor();
    const stored = await Users.findById(user.id);

    expect(stored?.twoFactor.secret).not.toContain(secret);
    expect(stored?.twoFactor.backupCodes).not.toContain(backupCodes[0]);
    expect(JSON.stringify(await getMe(await login(user.credentials.email)))).not.toContain(secret);
  });

  test("enable without setup, or twice, is refused", async () => {
    const { token } = await loginAs();
    const noSetup = await call("POST", "/auth/twoFactor/enable", {
      token,
      body: { code: "123456" },
    });
    expect(noSetup.json.code).toBe("TWO_FACTOR_SETUP_NOT_STARTED");

    const enabled = await enableTwoFactor();
    const again = await call("POST", "/auth/twoFactor/setup", { token: enabled.token });
    expect(again.json.code).toBe("TWO_FACTOR_ALREADY_ENABLED");
  });

  test("needs a fresh session", async () => {
    const user = await createUser();

    expect(
      (await call("POST", "/auth/twoFactor/setup", { token: staleSession(user) })).status,
    ).toBe(403);
  });
});

describe("logging in", () => {
  test("the password answers a challenge, the code turns it into a session", async () => {
    const { user, secret } = await enableTwoFactor();
    const first = await passwordLogin(user.credentials.email);

    expect(first.json.twoFactorRequired).toBe(true);
    expect(first.json.token).toBeUndefined();

    const { status, json } = await verify(first.json.twoFactorToken, codeFor(secret, 1));

    expect(status).toBe(200);
    expect((await getMe(json.token)).status).toBe(200);
  });

  test("the challenge token isn't a session", async () => {
    const { user } = await enableTwoFactor();
    const { json } = await passwordLogin(user.credentials.email);

    expect((await getMe(json.twoFactorToken)).status).toBe(401);
  });

  test("a code can't be used twice", async () => {
    const { user, secret } = await enableTwoFactor();
    const code = codeFor(secret, 1);

    const first = await passwordLogin(user.credentials.email);
    expect((await verify(first.json.twoFactorToken, code)).status).toBe(200);

    const second = await passwordLogin(user.credentials.email);
    expect((await verify(second.json.twoFactorToken, code)).json.code).toBe(
      "TWO_FACTOR_INVALID_CODE",
    );
  });

  test("a backup code works once, and the owner is told", async () => {
    const { user, backupCodes } = await enableTwoFactor();
    const first = await passwordLogin(user.credentials.email);

    // Typed the way people do: lowercase, with a dash.
    const typed = `${backupCodes[0].slice(0, 5)}-${backupCodes[0].slice(5)}`.toLowerCase();
    expect((await verify(first.json.twoFactorToken, typed)).status).toBe(200);
    await waitForEmail(user.credentials.email, "backup code");

    const second = await passwordLogin(user.credentials.email);
    expect((await verify(second.json.twoFactorToken, backupCodes[0])).status).toBe(401);
  });

  test("too many wrong codes kill the challenge", async () => {
    const { user, secret } = await enableTwoFactor();
    const { json } = await passwordLogin(user.credentials.email);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await verify(json.twoFactorToken, "000000");
    }

    const { status, json: last } = await verify(json.twoFactorToken, codeFor(secret, 1));
    expect(status).toBe(401);
    expect(last.code).toBe("INVALID_TOKEN");
  });

  test("a newer login makes the older challenge useless", async () => {
    const { user, secret } = await enableTwoFactor();
    const older = await passwordLogin(user.credentials.email);
    await passwordLogin(user.credentials.email);

    expect((await verify(older.json.twoFactorToken, codeFor(secret, 1))).json.code).toBe(
      "INVALID_TOKEN",
    );
  });

  test("OTP and OAuth logins ask for it too", async () => {
    const { user } = await enableTwoFactor();
    await Users.updateOne(
      { _id: user._id },
      {
        $push: { oauthAccounts: { provider: "google", providerId: "g-2fa", linkedAt: new Date() } },
      },
    );

    const nonce = "nonce-nonce-nonce-nonce";
    const { json } = await call("POST", "/auth/oauth/google/login", {
      body: { code: oauthCode({ nonce, sub: "g-2fa" }), nonce, codeVerifier: "v".repeat(43) },
    });

    expect(json.twoFactorRequired).toBe(true);
  });

  test("a user disabled since the password was checked doesn't get a session", async () => {
    const { user, secret } = await enableTwoFactor();
    const { json } = await passwordLogin(user.credentials.email);
    await Users.updateOne({ _id: user._id }, { isDisabled: true });

    expect((await verify(json.twoFactorToken, codeFor(secret, 1))).status).toBe(403);
  });
});

describe("turning it off", () => {
  test("needs a code, then logins stop asking", async () => {
    const { user, secret, backupCodes } = await enableTwoFactor();
    const { json: challenge } = await passwordLogin(user.credentials.email);
    const { json: session } = await verify(challenge.twoFactorToken, codeFor(secret, 1));
    const { token } = session;

    const wrong = await call("POST", "/auth/twoFactor/disable", {
      token,
      body: { code: "000000" },
    });
    expect(wrong.status).toBe(401);

    // An authenticator code older than the last one used would be a replay, so a backup code here.
    const off = await call("POST", "/auth/twoFactor/disable", {
      token,
      body: { code: backupCodes[0] },
    });
    expect(off.status).toBe(200);
    expect(await login(user.credentials.email)).toEqual(expect.any(String));
  });

  test("an admin can reset it for a user who lost everything", async () => {
    const { user } = await enableTwoFactor();
    const admin = await loginAs({ role: "ADMIN" });

    const { status } = await call("POST", `/admin/users/${user.id}/resetTwoFactor`, {
      token: admin.token,
    });

    expect(status).toBe(200);
    expect(await login(user.credentials.email)).toEqual(expect.any(String));
    await waitForEmail(user.credentials.email, "was turned off");
  });

  test("new backup codes replace the old ones", async () => {
    const { token, secret, backupCodes } = await enableTwoFactor();
    const { json } = await call("POST", "/auth/twoFactor/backupCodes", {
      token,
      body: { code: codeFor(secret, 1) },
    });

    expect(json.backupCodes).toHaveLength(10);
    expect(json.backupCodes).not.toContain(backupCodes[0]);
  });
});
