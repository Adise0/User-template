import Users from "../src/database/models/Users";
import {
  call,
  createUser,
  getMe,
  login,
  loginAs,
  settle,
  staleSession,
  testPassword,
  tokenFromLink,
  useApi,
  waitForEmail,
} from "./helpers/api";
import { mailbox } from "./helpers/fakeNodemailer";

useApi();

const loginAdmin = () => loginAs({ role: "ADMIN" });
const loginSuperuser = () => loginAs({ role: "SUPERUSER" });
const userUrl = (id: string, action = "") => `/admin/users/${id}${action}`;

// Every row needs all 4 values: with fewer, Jest takes the test function's last parameter for a
// done() callback and waits for it until the test times out.
const actions: [string, string, string, unknown][] = [
  ["disable", "POST", "/disable", undefined],
  ["enable", "POST", "/enable", undefined],
  ["sign out", "POST", "/signOut", undefined],
  ["force a reset", "POST", "/forcePasswordReset", undefined],
  ["edit", "PATCH", "", { firstName: "Changed" }],
  ["delete", "DELETE", "", undefined],
];

describe("access", () => {
  test("no token is a 401", async () => {
    expect((await call("GET", "/admin/users")).status).toBe(401);
  });

  test("a regular user gets a 403 everywhere", async () => {
    const { token } = await loginAs();
    const target = await createUser();

    const list = await call("GET", "/admin/users", { token });
    expect(list.status).toBe(403);
    expect(list.json.code).toBe("FORBIDDEN");
    expect((await call("GET", userUrl(target.id), { token })).status).toBe(403);
    expect((await call("POST", userUrl(target.id, "/disable"), { token })).status).toBe(403);
  });

  test("the old public getUser route is gone", async () => {
    const { user, token } = await loginAdmin();

    expect((await call("GET", `/users/user/${user.id}`, { token })).status).toBe(404);
  });

  test("a wrong verb is a 405", async () => {
    const { user, token } = await loginAdmin();

    expect((await call("PUT", userUrl(user.id), { token })).status).toBe(405);
    expect((await call("GET", userUrl(user.id, "/disable"), { token })).status).toBe(405);
  });

  test("an invalid id is a 400, an unknown one a 404", async () => {
    const { token } = await loginAdmin();

    expect((await call("GET", userUrl("not-an-id"), { token })).status).toBe(400);
    expect((await call("GET", userUrl("507f1f77bcf86cd799439011"), { token })).status).toBe(404);
    expect(
      (await call("POST", userUrl("507f1f77bcf86cd799439011", "/disable"), { token })).status,
    ).toBe(404);
  });
});

describe("who can act on whom", () => {
  test.each(actions)("nobody can %s themselves", async (_name, method, action, body) => {
    const { user, token } = await loginSuperuser();

    expect((await call(method, userUrl(user.id, action), { token, body })).status).toBe(403);
  });

  test.each(actions)("an admin can't %s another admin", async (_name, method, action, body) => {
    const { token } = await loginAdmin();
    const target = await createUser({ role: "ADMIN" });

    expect((await call(method, userUrl(target.id, action), { token, body })).status).toBe(403);
  });

  test.each(actions)("a superuser can't be targeted: %s", async (_name, method, action, body) => {
    const { token } = await loginSuperuser();
    const target = await createUser({ role: "SUPERUSER" });

    expect((await call(method, userUrl(target.id, action), { token, body })).status).toBe(403);
  });

  test("a superuser can act on an admin", async () => {
    const { token } = await loginSuperuser();
    const target = await createUser({ role: "ADMIN" });

    expect((await call("POST", userUrl(target.id, "/disable"), { token })).status).toBe(200);
  });

  test("an admin can view anyone", async () => {
    const { token } = await loginAdmin();
    const target = await createUser({ role: "SUPERUSER" });

    expect((await call("GET", userUrl(target.id), { token })).status).toBe(200);
  });
});

describe("listing users", () => {
  test("paginates, newest first, and shows no secrets", async () => {
    const { token } = await loginAdmin();
    await createUser();
    await createUser();

    const { status, json } = await call("GET", "/admin/users?limit=2&page=1", { token });

    expect(status).toBe(200);
    expect(json).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });
    expect(json.users).toHaveLength(2);
    expect(json.users[0].credentials).toBeUndefined();
    expect(json.users[0].revokedSessions).toBeUndefined();
    expect(json.users[0].isDisabled).toBe(false);

    const secondPage = await call("GET", "/admin/users?limit=2&page=2", { token });
    expect(secondPage.json.users).toHaveLength(1);
  });

  test("searches the start of the email or username, in any casing", async () => {
    const { token } = await loginAdmin();
    await createUser({
      information: { email: "findme@x.com", username: "zed" },
      credentials: { email: "findme@x.com", username: "zed", password: testPassword },
    });

    const byEmail = await call("GET", "/admin/users?search=FINDME", { token });
    const byUsername = await call("GET", "/admin/users?search=zed", { token });
    const notAtTheStart = await call("GET", "/admin/users?search=indme", { token });

    expect(byEmail.json.total).toBe(1);
    expect(byUsername.json.total).toBe(1);
    expect(notAtTheStart.json.total).toBe(0);
  });

  test("a search is treated as plain text, not as a regex", async () => {
    const { token } = await loginAdmin();
    await createUser();

    const { status, json } = await call("GET", `/admin/users?search=${encodeURIComponent(".*")}`, {
      token,
    });

    expect(status).toBe(200);
    expect(json.total).toBe(0);
  });

  test("filters by role, disabled and activated", async () => {
    const { token } = await loginAdmin();
    await createUser({ isDisabled: true });
    await createUser({ activatedAt: undefined });

    const total = async (query: string) =>
      (await call("GET", `/admin/users?${query}`, { token })).json.total;

    expect(await total("role=ADMIN")).toBe(1);
    expect(await total("isDisabled=true")).toBe(1);
    expect(await total("isActivated=false")).toBe(1);
    expect(await total("isActivated=true")).toBe(2);
  });

  test.each(["limit=101", "page=0", "role=KING", "isDisabled=maybe"])(
    "%s is a 400",
    async (query) => {
      const { token } = await loginAdmin();

      expect((await call("GET", `/admin/users?${query}`, { token })).status).toBe(400);
    },
  );
});

describe("viewing a user", () => {
  test("shows the status and no secrets", async () => {
    const { token } = await loginAdmin();
    const target = await createUser({ resetPasswordToken: "secret-hash" });

    const { json } = await call("GET", userUrl(target.id), { token });

    expect(json).toMatchObject({ id: target.id, role: "USER", isDisabled: false });
    expect(json.information.username).toBe(target.information.username);
    expect(json.createdAt).toEqual(expect.any(String));
    expect(json.resetPasswordToken).toBeUndefined();
    expect(json.credentials).toBeUndefined();
  });
});

describe("disabling and enabling", () => {
  test("disabling ends sessions and blocks login, and they don't return on enable", async () => {
    const { token } = await loginAdmin();
    const { user, token: session } = await loginAs();
    const { email } = user.credentials;

    expect((await call("POST", userUrl(user.id, "/disable"), { token })).status).toBe(200);
    expect((await getMe(session)).status).toBe(401);
    expect(await login(email)).toBeUndefined();
    await waitForEmail(email, "Your account was disabled");

    expect((await call("POST", userUrl(user.id, "/enable"), { token })).status).toBe(200);
    expect((await getMe(session)).status).toBe(401);
    expect(await login(email)).toEqual(expect.any(String));
    await waitForEmail(email, "Your account was enabled");
  });

  test("repeating it changes nothing and sends no second email", async () => {
    const { token } = await loginAdmin();
    const target = await createUser();

    await call("POST", userUrl(target.id, "/disable"), { token });
    await call("POST", userUrl(target.id, "/disable"), { token });
    await settle();

    expect(mailbox.sent).toHaveLength(1);
    expect((await Users.findById(target.id))?.tokenVersion).toBe(1);
  });
});

describe("signing a user out", () => {
  test("ends the sessions but they can log back in", async () => {
    const { token } = await loginAdmin();
    const { user, token: session } = await loginAs();

    expect((await call("POST", userUrl(user.id, "/signOut"), { token })).status).toBe(200);
    expect((await getMe(session)).status).toBe(401);
    expect(await login(user.credentials.email)).toEqual(expect.any(String));
    await settle();
    expect(mailbox.sent).toHaveLength(0);
  });
});

describe("forcing a password reset", () => {
  const passwordLogin = (email: string) =>
    call("POST", "/auth/login", { body: { email, password: testPassword } });

  test("the old password stops working until the emailed link is used", async () => {
    const { token } = await loginAdmin();
    const { user, token: session } = await loginAs();
    const { email } = user.credentials;

    const { status } = await call("POST", userUrl(user.id, "/forcePasswordReset"), { token });

    expect(status).toBe(200);
    expect((await getMe(session)).status).toBe(401);

    const blocked = await passwordLogin(email);
    expect(blocked.status).toBe(403);
    expect(blocked.json.code).toBe("PASSWORD_RESET_REQUIRED");
    expect(blocked.json.token).toBeUndefined();

    await waitForEmail(email, "You need to reset your password");
    const resetEmail = await waitForEmail(email, "Reset your password");
    const link = tokenFromLink(resetEmail.html, "/auth/resetPassword/");
    await settle();

    const body = { token: link, password: "brandnew123" };
    expect((await call("POST", "/auth/resetPassword", { body })).status).toBe(200);
    expect(await login(email, "brandnew123")).toEqual(expect.any(String));
  });

  test("a wrong password still looks like a wrong password", async () => {
    const { token } = await loginAdmin();
    const user = await createUser();
    await call("POST", userUrl(user.id, "/forcePasswordReset"), { token });

    const { json } = await call("POST", "/auth/login", {
      body: { email: user.credentials.email, password: "wrong" },
    });

    expect(json.code).toBe("INVALID_CREDENTIALS");
  });

  test("a pending account is refused", async () => {
    const { token } = await loginAdmin();
    const pending = await createUser({ activatedAt: undefined });

    const { status, json } = await call("POST", userUrl(pending.id, "/forcePasswordReset"), {
      token,
    });

    expect(status).toBe(403);
    expect(json.code).toBe("ACCOUNT_NOT_ACTIVATED");
  });
});

describe("editing a user", () => {
  test("changes the profile and login username", async () => {
    const { token } = await loginAdmin();
    const target = await createUser();

    const { status, json } = await call("PATCH", userUrl(target.id), {
      token,
      body: { username: "Clean_Name" },
    });
    const updated = await Users.findById(target.id);

    expect(status).toBe(200);
    expect(json.information.username).toBe("Clean_Name");
    expect(updated?.credentials.username).toBe("clean_name");
  });

  test("a taken username is a 409, and an email can't be set", async () => {
    const { token } = await loginAdmin();
    const target = await createUser();
    const other = await createUser();

    const taken = await call("PATCH", userUrl(target.id), {
      token,
      body: { username: other.credentials.username },
    });
    const email = await call("PATCH", userUrl(target.id), {
      token,
      body: { email: "new@x.com" },
    });

    expect(taken.status).toBe(409);
    expect(email.status).toBe(400);
  });
});

describe("deleting a user", () => {
  test("needs a fresh session", async () => {
    const { user: admin } = await loginAdmin();
    const target = await createUser();

    const { status, json } = await call("DELETE", userUrl(target.id), {
      token: staleSession(admin),
    });

    expect(status).toBe(403);
    expect(json.code).toBe("REAUTH_REQUIRED");
    expect(await Users.findById(target.id)).not.toBeNull();
  });

  test("removes the user and tells them", async () => {
    const { token } = await loginAdmin();
    const { user, token: session } = await loginAs();

    expect((await call("DELETE", userUrl(user.id), { token })).status).toBe(200);
    expect(await Users.findById(user.id)).toBeNull();
    expect((await getMe(session)).status).toBe(401);
    await waitForEmail(user.credentials.email, "Your account was deleted");
  });
});

describe("changing a role", () => {
  const setRole = (token: string, id: string, role?: string) =>
    call("PATCH", userUrl(id, "/role"), { token, body: { role } });

  test("a superuser can promote and demote", async () => {
    const { token } = await loginSuperuser();
    const { user, token: session } = await loginAs();

    expect((await setRole(token, user.id, "ADMIN")).status).toBe(200);
    expect((await call("GET", "/admin/users", { token: session })).status).toBe(200);

    expect((await setRole(token, user.id, "USER")).status).toBe(200);
    expect((await call("GET", "/admin/users", { token: session })).status).toBe(403);
  });

  test("an admin can't", async () => {
    const { token } = await loginAdmin();
    const target = await createUser();

    expect((await setRole(token, target.id, "ADMIN")).status).toBe(403);
    expect((await Users.findById(target.id))?.role).toBe("USER");
  });

  test("SUPERUSER can't be granted through the API", async () => {
    const { token } = await loginSuperuser();
    const target = await createUser();

    expect((await setRole(token, target.id, "SUPERUSER")).status).toBe(400);
    expect((await Users.findById(target.id))?.role).toBe("USER");
  });

  test("a missing role is a 400", async () => {
    const { token } = await loginSuperuser();
    const target = await createUser();

    expect((await setRole(token, target.id)).status).toBe(400);
  });

  test("needs a fresh session", async () => {
    const superuser = await createUser({ role: "SUPERUSER" });
    const target = await createUser();

    const { json } = await setRole(staleSession(superuser), target.id, "ADMIN");

    expect(json.code).toBe("REAUTH_REQUIRED");
  });
});
