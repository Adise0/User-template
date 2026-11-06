import Users from "../src/database/models/Users";
import {
  call,
  createUser,
  getMe,
  login,
  otpFromEmail,
  secondsAgo,
  settle,
  tokenFromLink,
  useApi,
  waitForEmail,
} from "./helpers/api";
import { mailbox } from "./helpers/fakeNodemailer";

useApi();

const otpLogin = (email: string, password: string) =>
  call("POST", "/auth/login", { body: { email, password, withOtp: true } });

const requestOtp = async (email: string) => {
  await call("POST", "/auth/requestOtp", { body: { email } });
  return waitForEmail(email, "one-time");
};

describe("password login", () => {
  test("works with the email or username, in any casing", async () => {
    const { credentials } = await createUser();

    expect(await login(credentials.email.toUpperCase())).toEqual(expect.any(String));
    expect(await login(credentials.username.toUpperCase())).toEqual(expect.any(String));
  });

  test("an unknown user and a wrong password look the same", async () => {
    const { credentials } = await createUser();
    const unknown = await call("POST", "/auth/login", { body: { email: "no", password: "x" } });
    const wrong = await call("POST", "/auth/login", {
      body: { email: credentials.email, password: "wrong" },
    });

    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.json).toEqual(wrong.json);
  });

  test("a disabled user can't log in", async () => {
    const { credentials } = await createUser({ isDisabled: true });
    const { status, json } = await call("POST", "/auth/login", {
      body: { email: credentials.email, password: "password123" },
    });

    expect(status).toBe(403);
    expect(json.code).toBe("USER_DISABLED");
  });
});

describe("OTP login", () => {
  test("the code is 8 characters of the safe alphabet", async () => {
    const { credentials } = await createUser();
    const email = await requestOtp(credentials.email);

    expect(otpFromEmail(email.html)).toMatch(/^[2-9A-HJ-NP-Z]{8}$/);
  });

  test("logs in once, and accepts lowercase", async () => {
    const { credentials } = await createUser();
    const otp = otpFromEmail((await requestOtp(credentials.email)).html);

    expect((await otpLogin(credentials.email, otp.toLowerCase())).status).toBe(200);
    expect((await otpLogin(credentials.email, otp)).status).toBe(401);
  });

  test("too many wrong guesses wipe it, and don't skip the cooldown", async () => {
    const user = await createUser();
    const { email } = user.credentials;
    await requestOtp(email);

    for (let guess = 0; guess < 6; guess += 1) {
      await otpLogin(email, "00000000");
    }

    const wiped = await Users.findById(user.id);
    expect(wiped?.credentials.otpPassword).toBeUndefined();
    expect(wiped?.credentials.otpLastSentAt).toBeInstanceOf(Date);

    const emailsBefore = mailbox.sent.length;
    await call("POST", "/auth/requestOtp", { body: { email } });
    await settle();
    expect(mailbox.sent).toHaveLength(emailsBefore);

    await Users.updateOne({ _id: user._id }, { "credentials.otpLastSentAt": secondsAgo(61) });
    await call("POST", "/auth/requestOtp", { body: { email } });
    await settle();
    expect(mailbox.sent).toHaveLength(emailsBefore + 1);
  });

  test("the revoke link works once, and not after the code was used", async () => {
    const user = await createUser();
    const { email } = user.credentials;
    const firstEmail = await requestOtp(email);
    const token = tokenFromLink(firstEmail.html, "/auth/revokeOtp/");

    await settle();
    expect((await call("POST", "/auth/revokeOtp", { body: { token } })).status).toBe(200);
    expect((await otpLogin(email, otpFromEmail(firstEmail.html))).status).toBe(401);
    expect((await call("POST", "/auth/revokeOtp", { body: { token } })).status).toBe(401);
  });

  test("parallel requests send a single email", async () => {
    const { credentials } = await createUser();
    const { email } = credentials;

    await Promise.all(
      Array.from({ length: 5 }, () => call("POST", "/auth/requestOtp", { body: { email } })),
    );
    await settle();

    expect(mailbox.sent).toHaveLength(1);
  });

  test("the session works", async () => {
    const { credentials } = await createUser();
    const otp = otpFromEmail((await requestOtp(credentials.email)).html);
    const { json } = await otpLogin(credentials.email, otp);

    expect((await getMe(json.token)).status).toBe(200);
  });
});
