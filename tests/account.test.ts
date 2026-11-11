import jwt from "jsonwebtoken";
import Users from "../src/database/models/Users";
import {
  call,
  createUser,
  getMe,
  login,
  loginAs,
  secondsAgo,
  settle,
  staleSession,
  testPassword,
  tokenFromLink,
  useApi,
  waitForEmail,
} from "./helpers/api";
import { mailbox } from "./helpers/fakeNodemailer";

useApi();

const requestReset = async (email: string) => {
  await call("POST", "/auth/requestPasswordReset", { body: { email } });
  return waitForEmail(email, "Reset your password");
};

describe("password reset", () => {
  test("the link is hashed, one-time, and ends every session", async () => {
    const { user, token: session } = await loginAs();
    const { email } = user.credentials;
    const resetEmail = await requestReset(email);
    const token = tokenFromLink(resetEmail.html, "/auth/resetPassword/");

    await settle();
    expect((await Users.findById(user.id))?.resetPasswordToken).toMatch(/^[0-9a-f]{64}$/);

    const body = { token, password: "brandnew123" };
    expect((await call("POST", "/auth/resetPassword", { body })).status).toBe(200);
    expect((await call("POST", "/auth/resetPassword", { body })).status).toBe(401);
    expect((await getMe(session)).status).toBe(401);
    expect(await login(email, "brandnew123")).toEqual(expect.any(String));
    expect((await waitForEmail(email, "password was changed")).to).toBe(email);
  });

  test("the cancel link stops the reset link", async () => {
    const { credentials } = await createUser();
    const resetEmail = await requestReset(credentials.email);
    const token = tokenFromLink(resetEmail.html, "/auth/cancelPasswordReset/");

    await settle();
    expect((await call("POST", "/auth/cancelPasswordReset", { body: { token } })).status).toBe(200);

    const body = { token, password: "brandnew123" };
    expect((await call("POST", "/auth/resetPassword", { body })).status).toBe(401);
  });

  test("parallel requests send a single email", async () => {
    const { credentials } = await createUser();
    const { email } = credentials;

    await Promise.all(
      Array.from({ length: 5 }, () =>
        call("POST", "/auth/requestPasswordReset", { body: { email } }),
      ),
    );
    await settle();

    expect(mailbox.sent).toHaveLength(1);
  });

  test("answers the same for an unknown account", async () => {
    const { status, json } = await call("POST", "/auth/requestPasswordReset", {
      body: { email: "nobody" },
    });

    expect(status).toBe(202);
    expect(json.message).toBe("If an account matches, an email is on its way.");
    await settle();
    expect(mailbox.sent).toHaveLength(0);
  });
});

describe("change password", () => {
  test("signs out other sessions by default and keeps this one", async () => {
    const { user, token } = await loginAs();
    const otherSession = await login(user.credentials.email);

    const { status, json } = await call("POST", "/auth/changePassword", {
      token,
      body: { password: "brandnew123" },
    });

    expect(status).toBe(200);
    expect((await getMe(otherSession)).status).toBe(401);
    expect((await getMe(json.token)).status).toBe(200);
    expect((await waitForEmail(user.credentials.email, "password was changed")).to).toBeTruthy();
  });

  test("signOutOtherSessions false keeps them", async () => {
    const { user, token } = await loginAs();
    const otherSession = await login(user.credentials.email);

    await call("POST", "/auth/changePassword", {
      token,
      body: { password: "brandnew123", signOutOtherSessions: false },
    });

    expect((await getMe(otherSession)).status).toBe(200);
  });

  test("needs a fresh session", async () => {
    const user = await createUser();
    const { status, json } = await call("POST", "/auth/changePassword", {
      token: staleSession(user),
      body: { password: "brandnew123" },
    });

    expect(status).toBe(403);
    expect(json.code).toBe("REAUTH_REQUIRED");
  });
});

describe("sessions", () => {
  test("logout ends this session only", async () => {
    const { user, token } = await loginAs();
    const otherSession = await login(user.credentials.email);

    expect((await call("POST", "/auth/logout", { token })).status).toBe(200);
    expect((await getMe(token)).status).toBe(401);
    expect((await call("GET", "/auth/refreshToken", { token })).status).toBe(401);
    expect((await getMe(otherSession)).status).toBe(200);
  });

  test("a refreshed token stays in the same session", async () => {
    const { token } = await loginAs();
    const { json } = await call("GET", "/auth/refreshToken", { token });
    const sessionIdOf = (session: string) => (jwt.decode(session) as jwt.JwtPayload).sessionId;

    expect(sessionIdOf(json.token)).toBe(sessionIdOf(token));

    await call("POST", "/auth/logout", { token: json.token });

    expect((await getMe(token)).status).toBe(401);
  });

  test("expired revoked sessions are cleaned up", async () => {
    const { user, token } = await loginAs();
    await Users.updateOne(
      { _id: user._id },
      { $set: { revokedSessions: [{ sessionId: "gone", expiresAt: secondsAgo(10) }] } },
    );

    await call("POST", "/auth/logout", { token });

    const { revokedSessions } = (await Users.findById(user.id).lean()) ?? {};
    expect(revokedSessions).toHaveLength(1);
    expect(revokedSessions?.[0].sessionId).not.toBe("gone");
  });

  test("a token without a sessionId is rejected", async () => {
    const user = await createUser();
    const token = jwt.sign(
      { purpose: "SESSION", id: user.id, tokenVersion: 0, authTime: 1 },
      process.env.TOKEN_SECRET as string,
    );

    expect((await getMe(token)).status).toBe(401);
  });

  test("a link token can't be used as a session", async () => {
    const user = await createUser();
    const token = jwt.sign(
      { purpose: "PASSWORDRESET", id: user.id },
      process.env.TOKEN_SECRET as string,
    );

    expect((await getMe(token)).status).toBe(401);
  });

  test("signing out everywhere ends every session", async () => {
    const { user, token } = await loginAs();
    const otherSession = await login(user.credentials.email);

    await call("POST", "/auth/signOutEverywhere", { token });

    expect((await getMe(token)).status).toBe(401);
    expect((await getMe(otherSession)).status).toBe(401);
  });
});

describe("profile", () => {
  test("only the fields sent change, trimmed", async () => {
    const { token } = await loginAs();
    const { status, json } = await call("PATCH", "/users/myUser", {
      token,
      body: { firstName: "  Bea " },
    });

    expect(status).toBe(200);
    expect(json.information.firstName).toBe("Bea");
    expect(json.information.lastName).toBe("Smith");
    expect(json.credentials).toBeUndefined();
  });

  test("a new username updates the login too", async () => {
    const { user, token } = await loginAs();
    await call("PATCH", "/users/myUser", { token, body: { username: "New_Name" } });

    const updated = await Users.findById(user.id);

    expect(updated?.information.username).toBe("New_Name");
    expect(updated?.credentials.username).toBe("new_name");
    expect(await login("NEW_NAME")).toEqual(expect.any(String));
  });

  test("a taken username is a 409", async () => {
    const { token } = await loginAs();
    const other = await createUser();
    const { status, json } = await call("PATCH", "/users/myUser", {
      token,
      body: { username: other.credentials.username.toUpperCase() },
    });

    expect(status).toBe(409);
    expect(json.fields).toEqual({ username: "TAKEN" });
  });

  test.each([
    ["nothing", {}],
    ["only an email", { email: "evil@x.com" }],
    ["only an unknown field", { picture: "https://a.com/x.png" }],
  ])("sending %s is a 400", async (_name, body) => {
    const { token } = await loginAs();

    expect((await call("PATCH", "/users/myUser", { token, body })).status).toBe(400);
  });

  test("GET returns the role and no secrets", async () => {
    const { token } = await loginAs();
    const { json } = await getMe(token);

    expect(json.role).toBe("USER");
    expect(json.credentials).toBeUndefined();
    expect(json.tokenVersion).toBeUndefined();
  });
});

describe("email change", () => {
  const requestChange = (token: string, email: string) =>
    call("POST", "/auth/requestEmailChange", { token, body: { email } });

  const changeToken = async (to: string) =>
    tokenFromLink((await waitForEmail(to, "Confirm")).html, "/auth/confirmEmailChange/");

  const confirm = (token: string) => call("POST", "/auth/confirmEmailChange", { body: { token } });

  test("applies only once the new address is confirmed", async () => {
    const { user, token } = await loginAs();
    const { email } = user.credentials;

    expect((await requestChange(token, "New@x.com")).status).toBe(202);

    const link = await changeToken("new@x.com");
    await waitForEmail(email, "Someone asked to change your email");
    const pending = await Users.findById(user.id);

    expect(pending?.credentials.email).toBe(email);
    expect(pending?.pendingEmail).toBe("new@x.com");
    expect(pending?.emailChangeToken).toMatch(/^[0-9a-f]{64}$/);

    expect((await confirm(link)).status).toBe(200);

    const changed = await Users.findById(user.id);

    expect(changed?.credentials.email).toBe("new@x.com");
    expect(changed?.information.email).toBe("new@x.com");
    expect(changed?.pendingEmail).toBeUndefined();
    expect(await login("new@x.com")).toEqual(expect.any(String));
    expect(await login(email)).toBeUndefined();
    expect((await getMe(token)).status).toBe(200);
    expect((await waitForEmail(email, "Your email was changed")).to).toBe(email);
    expect((await confirm(link)).status).toBe(401);
  });

  test("drops a pending password reset", async () => {
    const { user, token } = await loginAs();
    await requestReset(user.credentials.email);
    await settle();
    await requestChange(token, "new@x.com");
    await settle();

    await confirm(await changeToken("new@x.com"));

    expect((await Users.findById(user.id))?.resetPasswordToken).toBeUndefined();
  });

  test("needs a fresh session", async () => {
    const user = await createUser();
    const { status, json } = await requestChange(staleSession(user), "new@x.com");

    expect(status).toBe(403);
    expect(json.code).toBe("REAUTH_REQUIRED");
  });

  test("a taken or identical email is a 409", async () => {
    const { user, token } = await loginAs();
    const other = await createUser();

    expect((await requestChange(token, other.credentials.email)).status).toBe(409);
    expect((await requestChange(token, user.credentials.email.toUpperCase())).status).toBe(409);
  });

  test("has a cooldown", async () => {
    const { token } = await loginAs();
    await requestChange(token, "new@x.com");
    const { status, json } = await requestChange(token, "other@x.com");

    expect(status).toBe(429);
    expect(json.details.retryAfterSeconds).toBeGreaterThan(0);
  });

  test("a session token can't confirm it", async () => {
    const { token } = await loginAs();

    expect((await confirm(token)).status).toBe(401);
  });

  test("an address taken in the meantime is a 409", async () => {
    const { token } = await loginAs();
    await requestChange(token, "gone@x.com");
    const link = await changeToken("gone@x.com");
    await settle();
    await createUser({
      information: { email: "gone@x.com", username: "thief" },
      credentials: { email: "gone@x.com", username: "thief", password: testPassword },
    });

    const { status, json } = await confirm(link);

    expect(status).toBe(409);
    expect(json.fields).toEqual({ email: "TAKEN" });
  });
});

describe("delete account", () => {
  test("needs a fresh session, then schedules the deletion and signs out", async () => {
    const { user, token } = await loginAs();

    const stale = await call("DELETE", "/auth/deleteAccount", { token: staleSession(user) });
    expect(stale.status).toBe(403);

    const { status, json } = await call("DELETE", "/auth/deleteAccount", { token });

    expect(status).toBe(200);
    expect(json.scheduledDeletionAt).toEqual(expect.any(String));
    expect((await Users.findById(user.id))?.scheduledDeletionAt).toBeInstanceOf(Date);
    expect((await getMe(token)).status).toBe(401);
    await waitForEmail(user.credentials.email, "will be deleted");
  });

  test("logging back in cancels the deletion", async () => {
    const { user, token } = await loginAs();
    await call("DELETE", "/auth/deleteAccount", { token });

    expect(await login(user.credentials.email)).toEqual(expect.any(String));
    expect((await Users.findById(user.id))?.scheduledDeletionAt).toBeUndefined();
    await waitForEmail(user.credentials.email, "deletion was cancelled");
  });
});
