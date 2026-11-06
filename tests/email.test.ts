import Users from "../src/database/models/Users";
import { call, createUser, loginAs, register, settle, useApi, wait } from "./helpers/api";
import { mailbox } from "./helpers/fakeNodemailer";

// Short retries, or every failure here would take seconds.
jest.mock("../src/data/serverConfig/server-config", () => ({
  ...jest.requireActual("../src/data/serverConfig/server-config"),
  emailRetryDelayInSeconds: 0.01,
}));

useApi();

describe("retries", () => {
  test("a failing email is retried until it goes out", async () => {
    const { user } = await loginAs();
    mailbox.failuresLeft = 2;

    await call("POST", "/auth/requestPasswordReset", { body: { email: user.credentials.email } });
    await wait(300);

    expect(mailbox.attempts).toBe(3);
    expect(mailbox.sent).toHaveLength(1);
    expect((await Users.findById(user.id))?.resetPasswordToken).toMatch(/^[0-9a-f]{64}$/);
  });

  test("a permanent rejection isn't retried", async () => {
    const user = await createUser();
    mailbox.failuresLeft = 1;
    mailbox.failureCode = 550;

    await call("POST", "/auth/requestPasswordReset", { body: { email: user.credentials.email } });
    await settle();

    expect(mailbox.attempts).toBe(1);
  });

  test("it gives up after 3 attempts", async () => {
    const user = await createUser();
    mailbox.failuresLeft = 10;

    await call("POST", "/auth/requestPasswordReset", { body: { email: user.credentials.email } });
    await wait(300);

    expect(mailbox.attempts).toBe(3);
    expect((await Users.findById(user.id))?.resetPasswordToken).toBeUndefined();
  });
});

describe("when the email fails for good", () => {
  test("a registration leaves nothing behind, and can be retried at once", async () => {
    mailbox.failuresLeft = 3;

    const { status, json } = await register();

    expect(status).toBe(500);
    expect(json.code).toBe("ACTIVATION_EMAIL_FAILED");
    expect(await Users.countDocuments()).toBe(0);
    expect((await register()).status).toBe(201);
  });

  test("an email change leaves nothing pending", async () => {
    const { user, token } = await loginAs();
    mailbox.failuresLeft = 3;

    const { status, json } = await call("POST", "/auth/requestEmailChange", {
      token,
      body: { email: "new@x.com" },
    });

    expect(status).toBe(500);
    expect(json.code).toBe("EMAIL_CHANGE_EMAIL_FAILED");
    expect((await Users.findById(user.id))?.pendingEmail).toBeUndefined();
  });
});
