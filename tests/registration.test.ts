import Users from "../src/database/models/Users";
import {
  call,
  createUser,
  login,
  newIp,
  register,
  registration,
  secondsAgo,
  settle,
  tokenFromLink,
  useApi,
  wait,
  waitForEmail,
} from "./helpers/api";

useApi();

const findAlice = () => Users.findOne({ "credentials.email": "alice@x.com" });
const checkKeys = (body: unknown, ip?: string) => call("POST", "/auth/checkKeys", { body, ip });
const activationToken = async (to = "alice@x.com") =>
  tokenFromLink((await waitForEmail(to, "Activate")).html, "/auth/activate/");

describe("register", () => {
  test("creates a pending account and hashes its token", async () => {
    const { status } = await register();
    const user = await findAlice();
    const token = await activationToken();

    expect(status).toBe(201);
    expect(user?.credentials.username).toBe("alice_1");
    expect(user?.information.username).toBe("Alice_1");
    expect(user?.verificationToken).toMatch(/^[0-9a-f]{64}$/);
    expect(user?.verificationToken).not.toBe(token);
    expect(user?.activatedAt).toBeUndefined();
    expect(Math.abs((user?.pendingExpiresAt?.getTime() ?? 0) - Date.now() - 864e5)).toBeLessThan(
      6e4,
    );
  });

  test("a pending account can't log in", async () => {
    await register();
    const { status, json } = await call("POST", "/auth/login", {
      body: { email: "alice@x.com", password: "password123" },
    });

    expect(status).toBe(403);
    expect(json.code).toBe("ACCOUNT_NOT_ACTIVATED");
  });

  test("no activatedAt means pending, even without a token", async () => {
    const user = await createUser({ activatedAt: undefined });
    const { json } = await call("POST", "/auth/login", {
      body: { email: user.credentials.email, password: "password123" },
    });

    expect(json.code).toBe("ACCOUNT_NOT_ACTIVATED");
  });

  test("an active account blocks its keys", async () => {
    const user = await createUser();
    const { status, json } = await register({ email: user.credentials.email, username: "other" });

    expect(status).toBe(409);
    expect(json.fields).toEqual({ email: "TAKEN" });
  });

  test("usernames clash regardless of casing", async () => {
    const user = await createUser();
    const { json } = await register({ username: user.credentials.username.toUpperCase() });

    expect(json.fields).toEqual({ username: "TAKEN" });
  });

  // The losers get a 409 if they raced the winner's insert, or the retry cooldown's 429 if the
  // winner's pending account was already there. Which one depends on timing, a 500 never happens.
  test("parallel registrations: one wins, the rest are refused, never a 500", async () => {
    const results = await Promise.all([register(), register(), register(), register()]);
    const statuses = results.map(({ status }) => status);

    expect(statuses.filter((status) => status === 201)).toHaveLength(1);
    expect(statuses.filter((status) => status !== 201).every((s) => [409, 429].includes(s))).toBe(
      true,
    );
    expect(await Users.countDocuments()).toBe(1);
  });

  test.each([
    ["too short username", { username: "ab" }, "username", "TOO_SHORT"],
    ["too long username", { username: "x".repeat(25) }, "username", "TOO_LONG"],
    ["email shaped username", { username: "victim@gmail.com" }, "username", "INVALID_FORMAT"],
    ["username with spaces", { username: "  admin  " }, "username", "INVALID_FORMAT"],
    ["blank first name", { firstName: "   " }, "firstName", "REQUIRED"],
    ["too long last name", { lastName: "x".repeat(51) }, "lastName", "TOO_LONG"],
  ])("rejects a %s", async (_name, overrides, field, code) => {
    const { status, json } = await register(overrides);

    expect(status).toBe(400);
    expect(json.fields[field]).toBe(code);
  });
});

describe("retrying a pending signup", () => {
  test("same email inside the cooldown is told to wait", async () => {
    await register();
    const { status, json } = await register();

    expect(status).toBe(429);
    expect(json.code).toBe("REGISTRATION_COOLDOWN");
  });

  test("same email after the cooldown replaces the pending account", async () => {
    await register();
    const first = await findAlice();
    await Users.updateOne({ _id: first?._id }, { activationLastSentAt: secondsAgo(61) });

    expect((await register({ username: "Alice_2" })).status).toBe(201);
    expect(await Users.findById(first?.id)).toBeNull();
  });

  test("a stranger can't take a pending username while its link is alive", async () => {
    await register();
    const first = await findAlice();
    await Users.updateOne({ _id: first?._id }, { activationLastSentAt: secondsAgo(61) });

    const { status, json } = await register({ email: "stranger@x.com", username: "ALICE_1" });

    expect(status).toBe(409);
    expect(json.fields).toEqual({ username: "TAKEN" });
    expect(await Users.findById(first?.id)).not.toBeNull();
  });

  test("a stranger can take the username once the link expired", async () => {
    await register();
    await Users.updateOne({}, { activationLastSentAt: secondsAgo(21 * 60) });

    expect((await register({ email: "late@x.com" })).status).toBe(201);
  });

  test("two replaceable pending accounts are both replaced", async () => {
    await register({ username: "first_one" });
    await register({ email: "other@x.com", username: "second_one" });
    await Users.updateMany({}, { activationLastSentAt: secondsAgo(21 * 60) });

    expect((await register({ username: "second_one" })).status).toBe(201);
    expect(await Users.countDocuments()).toBe(1);
  });
});

describe("activation", () => {
  test("resend replaces the link, and only the new one activates", async () => {
    await register();
    const oldToken = await activationToken();
    await Users.updateOne({}, { activationLastSentAt: secondsAgo(61) });
    await wait(1100); // Tokens are stamped by the second, so they'd be identical otherwise.

    const { status } = await call("POST", "/auth/resendActivation", { body: { email: "ALICE_1" } });
    await settle();
    const newToken = await activationToken();

    expect(status).toBe(202);
    expect(newToken).not.toBe(oldToken);
    expect((await call("POST", "/auth/activate", { body: { token: oldToken } })).status).toBe(401);

    const activated = await call("POST", "/auth/activate", { body: { token: newToken } });
    const user = await Users.findOne({}).lean();

    expect(activated.status).toBe(200);
    expect(activated.json.token).toEqual(expect.any(String));
    expect(user?.activatedAt).toBeInstanceOf(Date);
    expect(user?.pendingExpiresAt).toBeUndefined();
    expect(user?.verificationToken).toBeUndefined();
  });

  test("an account activated while a resend is going out stays active", async () => {
    const pending = await createUser({ activatedAt: undefined, verificationToken: "old-hash" });
    const { mailbox } = jest.requireActual("./helpers/fakeNodemailer");
    mailbox.delayInMs = 200;

    await call("POST", "/auth/resendActivation", { body: { email: pending.credentials.email } });
    await wait(60);
    await Users.updateOne(
      { _id: pending._id },
      { $set: { activatedAt: new Date() }, $unset: { verificationToken: 1 } },
    );
    await wait(300);

    const user = await Users.findById(pending.id).lean();

    expect(user?.verificationToken).toBeUndefined();
    expect(user?.pendingExpiresAt).toBeUndefined();
  });

  test("the link cancels a pending account", async () => {
    await register();
    const token = await activationToken();

    expect((await call("POST", "/auth/cancelRegistration", { body: { token } })).status).toBe(200);
    expect(await Users.countDocuments()).toBe(0);
  });

  test("activating twice is refused", async () => {
    await register();
    const token = await activationToken();
    await call("POST", "/auth/activate", { body: { token } });

    const { status, json } = await call("POST", "/auth/activate", { body: { token } });

    expect(status).toBe(409);
    expect(json.code).toBe("ACCOUNT_ALREADY_ACTIVATED");
  });

  test("the registered password works after activating", async () => {
    await register();
    await call("POST", "/auth/activate", { body: { token: await activationToken() } });

    expect(await login("ALICE_1")).toEqual(expect.any(String));
  });
});

describe("checkKeys agrees with register", () => {
  test("needs at least one key", async () => {
    expect((await checkKeys({})).status).toBe(400);
  });

  test("free keys are available", async () => {
    expect((await checkKeys({ email: "free@x.com", username: "free_name" })).status).toBe(200);
  });

  test("an active account's keys are taken, regardless of casing", async () => {
    const { credentials } = await createUser();
    const { status, json } = await checkKeys({ username: credentials.username.toUpperCase() });

    expect(status).toBe(409);
    expect(json.fields).toEqual({ username: "TAKEN" });
  });

  test("a pending email is available, so a retry is never blocked", async () => {
    await register();

    expect((await checkKeys({ email: "alice@x.com" })).status).toBe(200);
    expect((await checkKeys({ email: "alice@x.com", username: "alice_1" })).status).toBe(200);
  });

  test("a pending username is taken for anyone else while its link is alive", async () => {
    await register();
    const { status, json } = await checkKeys({ email: "other@x.com", username: "alice_1" });

    expect(status).toBe(409);
    expect(json.fields).toEqual({ username: "TAKEN" });
    expect((await checkKeys({ username: "alice_1" })).status).toBe(409);
  });

  test("a pending username is available once its link expired", async () => {
    await register();
    await Users.updateOne({}, { activationLastSentAt: secondsAgo(21 * 60) });

    expect((await checkKeys({ username: "alice_1" })).status).toBe(200);
  });

  test("never changes anything", async () => {
    await register();
    await Users.updateOne({}, { activationLastSentAt: secondsAgo(21 * 60) });
    await checkKeys(registration());

    expect(await Users.countDocuments()).toBe(1);
  });

  test("is rate limited", async () => {
    const ip = newIp();
    const statuses: number[] = [];

    for (let i = 0; i < 12; i += 1) {
      statuses.push((await checkKeys({ username: `free${i}` }, ip)).status);
    }

    expect(statuses.filter((status) => status === 200)).toHaveLength(10);
    expect(statuses.filter((status) => status === 429)).toHaveLength(2);
  });
});
