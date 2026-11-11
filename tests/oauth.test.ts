import { generateKeyPairSync, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import Users from "../src/database/models/Users";
import {
  call,
  createUser,
  getMe,
  loginAs,
  postForm,
  staleSession,
  useApi,
  waitForEmail,
} from "./helpers/api";
import {
  fakeProvider,
  installFakeOAuthProvider,
  oauthCode,
  resetFakeProvider,
} from "./helpers/fakeOAuthProvider";

useApi();

beforeAll(installFakeOAuthProvider);
beforeEach(resetFakeProvider);

const nonce = "nonce-nonce-nonce-nonce";
const codeVerifier = "v".repeat(43);

// What the frontend sends once Google sends the user back. sub is Google's id for the user.
const googleLogin = (claims: Record<string, unknown>, overrides: Record<string, unknown> = {}) =>
  call("POST", "/auth/oauth/google/login", {
    body: { code: oauthCode({ nonce, ...claims }), nonce, codeVerifier, ...overrides },
  });

const completeSignup = (token: string, username = "OAuth_User") =>
  call("POST", "/auth/oauth/completeSignup", { body: { token, username } });

// A first Google sign-in all the way to a session.
const signUpWithGoogle = async (sub: string, email: string, username = "OAuth_User") => {
  const { json } = await googleLogin({ sub, email, given_name: "Ann", family_name: "Smith" });
  return completeSignup(json.signupToken, username);
};

describe("providers", () => {
  test("lists the configured ones", async () => {
    const { json } = await call("GET", "/auth/oauth/providers");

    expect(json.providers).toEqual([
      { name: "google", supportsPkce: true },
      { name: "apple", supportsPkce: false },
    ]);
  });

  test("an unknown provider is a 404", async () => {
    const { status, json } = await call("POST", "/auth/oauth/github/login", { body: {} });

    expect(status).toBe(404);
    expect(json.code).toBe("OAUTH_PROVIDER_UNAVAILABLE");
  });
});

describe("authorization URL", () => {
  const query = `state=${"s".repeat(20)}&nonce=${nonce}`;
  const challenge = "c".repeat(43);

  test("Google's carries the client, the state, the nonce and the PKCE challenge", async () => {
    const { status, json } = await call(
      "GET",
      `/auth/oauth/google/authorizationUrl?${query}&codeChallenge=${challenge}`,
    );
    const url = new URL(json.url);

    expect(status).toBe(200);
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("client_id")).toBe("google-client-id");
    expect(url.searchParams.get("redirect_uri")).toBe("http://front/auth/oauth/google/callback");
    expect(url.searchParams.get("nonce")).toBe(nonce);
    expect(url.searchParams.get("code_challenge")).toBe(challenge);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  test("Google needs a PKCE challenge, Apple doesn't", async () => {
    const google = await call("GET", `/auth/oauth/google/authorizationUrl?${query}`);
    const apple = await call("GET", `/auth/oauth/apple/authorizationUrl?${query}`);

    expect(google.status).toBe(400);
    expect(google.json.fields).toEqual({ codeChallenge: "REQUIRED" });
    expect(apple.status).toBe(200);
    expect(new URL(apple.json.url).searchParams.get("response_mode")).toBe("form_post");
  });

  test("a short state is refused", async () => {
    const { status } = await call(
      "GET",
      `/auth/oauth/google/authorizationUrl?state=short&nonce=${nonce}&codeChallenge=${challenge}`,
    );

    expect(status).toBe(400);
  });
});

describe("first sign-in", () => {
  test("answers a signup token, then completeSignup creates an active account", async () => {
    const first = await googleLogin({
      sub: "g-1",
      email: "Ann@Gmail.com",
      given_name: "Ann",
      family_name: "Smith",
    });

    expect(first.status).toBe(200);
    expect(first.json).toMatchObject({
      signupRequired: true,
      email: "ann@gmail.com",
      firstName: "Ann",
      lastName: "Smith",
    });
    expect(first.json.token).toBeUndefined();
    expect(await Users.countDocuments()).toBe(0);

    const { status, json } = await completeSignup(first.json.signupToken);

    expect(status).toBe(200);
    const me = await getMe(json.token);
    expect(me.json).toMatchObject({
      information: { username: "OAuth_User", email: "ann@gmail.com", firstName: "Ann" },
      hasPassword: false,
      linkedProviders: [{ provider: "google", email: "ann@gmail.com" }],
      twoFactorEnabled: false,
    });
    expect((await Users.findOne())?.activatedAt).toBeInstanceOf(Date);
  });

  test("the PKCE verifier and the client secret reach Google", async () => {
    await googleLogin({ sub: "g-1", email: "a@gmail.com" });

    expect(fakeProvider.lastTokenRequest).toMatchObject({
      code_verifier: codeVerifier,
      client_secret: "google-client-secret",
      redirect_uri: "http://front/auth/oauth/google/callback",
    });
  });

  test("Google needs the PKCE verifier", async () => {
    const { status, json } = await googleLogin({ sub: "g-1" }, { codeVerifier: undefined });

    expect(status).toBe(400);
    expect(json.fields).toEqual({ codeVerifier: "REQUIRED" });
  });

  test("a taken username is a 409, and the token can be used again with another", async () => {
    const other = await createUser();
    const { json } = await googleLogin({ sub: "g-1", email: "a@gmail.com" });

    const taken = await completeSignup(json.signupToken, other.credentials.username.toUpperCase());
    expect(taken.status).toBe(409);
    expect(taken.json.fields).toEqual({ username: "TAKEN" });

    expect((await completeSignup(json.signupToken, "free_name")).status).toBe(200);
  });

  test("a signup token can't create a second account for the same provider account", async () => {
    const { json } = await googleLogin({ sub: "g-1", email: "a@gmail.com" });
    await completeSignup(json.signupToken, "first_one");

    const { status, json: second } = await completeSignup(json.signupToken, "second_one");

    expect(status).toBe(409);
    expect(second.code).toBe("OAUTH_EMAIL_IN_USE");
    expect(await Users.countDocuments()).toBe(1);
  });

  test("a pending registration with the email is replaced", async () => {
    await createUser({
      information: { email: "a@gmail.com", username: "pending" },
      credentials: { email: "a@gmail.com", username: "pending" },
      activatedAt: undefined,
    });

    expect((await signUpWithGoogle("g-1", "a@gmail.com")).status).toBe(200);
    expect(await Users.countDocuments()).toBe(1);
    expect((await Users.findOne())?.oauthAccounts).toHaveLength(1);
  });

  test("a forged or wrong-purpose signup token is refused", async () => {
    const forged = jwt.sign({ purpose: "OAUTHSIGNUP", provider: "google" }, "not-the-secret");
    const session = staleSession({ id: "507f1f77bcf86cd799439011", tokenVersion: 0 });

    expect((await completeSignup(forged)).status).toBe(401);
    expect((await completeSignup(session)).status).toBe(401);
  });
});

describe("signing in", () => {
  test("a linked provider account logs straight in", async () => {
    await signUpWithGoogle("g-1", "a@gmail.com");
    const { status, json } = await googleLogin({ sub: "g-1", email: "changed@gmail.com" });

    expect(status).toBe(200);
    expect((await getMe(json.token)).status).toBe(200);
  });

  test("an email with an active account is refused, not linked", async () => {
    const user = await createUser();
    const { status, json } = await googleLogin({ sub: "g-1", email: user.credentials.email });

    expect(status).toBe(409);
    expect(json.code).toBe("OAUTH_EMAIL_IN_USE");
    expect((await Users.findById(user.id))?.oauthAccounts).toHaveLength(0);
  });

  test("an unverified email is refused", async () => {
    const { status, json } = await googleLogin({
      sub: "g-1",
      email: "a@gmail.com",
      email_verified: false,
    });

    expect(status).toBe(403);
    expect(json.code).toBe("OAUTH_EMAIL_NOT_VERIFIED");
  });

  test("a disabled account can't sign in", async () => {
    await signUpWithGoogle("g-1", "a@gmail.com");
    await Users.updateOne({}, { isDisabled: true });

    expect((await googleLogin({ sub: "g-1", email: "a@gmail.com" })).status).toBe(403);
  });

  test.each([
    [
      "a refused code",
      () => {
        fakeProvider.refuseCodes = true;
        return {};
      },
    ],
    ["a token from another sign-in (wrong nonce)", () => ({ nonce: "another-nonce-another" })],
    ["a token for another app", () => ({ aud: "someone-else" })],
    ["a token from another issuer", () => ({ iss: "https://evil.example.com" })],
    ["an expired token", () => ({ exp: Math.floor(Date.now() / 1000) - 60 })],
    [
      "a forged signature",
      () => {
        fakeProvider.signingKey = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
        return {};
      },
    ],
  ])("%s is refused", async (_name, setUp) => {
    const claims = setUp();
    const { status, json } = await googleLogin({ sub: "g-1", email: "a@gmail.com", ...claims });

    expect(status).toBe(401);
    expect(json.code).toBe("OAUTH_FAILED");
  });
});

describe("Apple", () => {
  test("the form post callback is passed on to the frontend", async () => {
    const user = JSON.stringify({ name: { firstName: "Bea", lastName: "Jones" } });
    const response = await postForm("/auth/oauth/apple/callback", {
      code: "the-code",
      state: "the-state",
      user,
      ignored: "x",
    });
    const location = new URL(response.headers.get("location") ?? "");

    expect(response.status).toBe(303);
    expect(location.origin + location.pathname).toBe("http://front/auth/oauth/apple/callback");
    expect(Object.fromEntries(location.searchParams)).toEqual({
      code: "the-code",
      state: "the-state",
      user,
    });
  });

  test("only form-post providers have a callback, and nothing else takes forms", async () => {
    expect((await postForm("/auth/oauth/google/callback", { code: "x" })).status).toBe(404);

    // A cross-site form post can't reach the JSON endpoints: the body just isn't read.
    const login = await postForm("/auth/login", { email: "a@x.com", password: "password123" });
    expect(login.status).toBe(400);
  });

  test("signs up with a client secret signed by the app's key, and takes the forwarded name", async () => {
    const { json } = await call("POST", "/auth/oauth/apple/login", {
      body: {
        code: oauthCode({
          nonce,
          sub: "apple-1",
          email: "x@privaterelay.appleid.com",
          email_verified: "true",
        }),
        nonce,
        firstName: "Bea",
        lastName: "Jones",
      },
    });

    expect(json).toMatchObject({ signupRequired: true, firstName: "Bea", lastName: "Jones" });

    const clientSecret = jwt.decode(fakeProvider.lastTokenRequest.client_secret, {
      complete: true,
    });
    expect(clientSecret?.header).toMatchObject({ alg: "ES256", kid: "apple-key-id" });
    expect(clientSecret?.payload).toMatchObject({
      iss: "apple-team-id",
      sub: "apple-client-id",
      aud: "https://appleid.apple.com",
    });
  });
});

describe("linking", () => {
  const link = (token: string, claims: Record<string, unknown>) =>
    call("POST", "/auth/oauth/google/link", {
      token,
      body: { code: oauthCode({ nonce, ...claims }), nonce, codeVerifier },
    });

  test("a logged in user links Google, then signs in with it", async () => {
    const { user, token } = await loginAs();

    // The Google account's email doesn't have to match.
    expect((await link(token, { sub: "g-9", email: "other@gmail.com" })).status).toBe(200);
    await waitForEmail(user.credentials.email, "linked");

    const { json } = await googleLogin({ sub: "g-9", email: "other@gmail.com" });
    expect((await getMe(json.token)).json.information.username).toBe(user.information.username);
  });

  test("needs a fresh session", async () => {
    const user = await createUser();

    expect((await link(staleSession(user), { sub: "g-9" })).status).toBe(403);
  });

  test("a provider account linked to someone else, or a second one, is a 409", async () => {
    await signUpWithGoogle("g-1", "a@gmail.com");
    const { token } = await loginAs();

    expect((await link(token, { sub: "g-1" })).json.code).toBe("OAUTH_ALREADY_LINKED");

    await link(token, { sub: "g-2" });
    expect((await link(token, { sub: "g-3" })).json.code).toBe("OAUTH_ALREADY_LINKED");
  });

  test("unlinking stops it signing in", async () => {
    const { token } = await loginAs();
    await link(token, { sub: "g-9", email: "other@gmail.com" });

    expect((await call("DELETE", "/auth/oauth/google/link", { token })).status).toBe(200);
    expect((await call("DELETE", "/auth/oauth/google/link", { token })).status).toBe(404);

    // The provider account is free again, so it goes back to being a first sign-in.
    const { json } = await googleLogin({ sub: "g-9", email: "other@gmail.com" });
    expect(json.signupRequired).toBe(true);
  });
});

describe("unique provider accounts", () => {
  test("the database refuses the same provider account on two users", async () => {
    const linked = { provider: "google", providerId: randomUUID(), linkedAt: new Date() };
    await createUser({ oauthAccounts: [linked] });

    await expect(createUser({ oauthAccounts: [linked] })).rejects.toThrow(/duplicate key/);
  });
});
