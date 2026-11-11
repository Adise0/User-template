import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";

// Stands in for Google's and Apple's servers: the token endpoints and the signing keys (JWKS) are
// answered here, everything else goes through to the real fetch (the tests' own API calls).
//
// The authorization code a test sends is just the ID token claims it wants back, encoded, so each
// test says exactly who the provider vouches for: oauthCode({ sub: "1", email: "a@x.com", nonce }).

const keyId = "fake-provider-key";
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: keyId, alg: "RS256", use: "sig" };

const issuers: Record<string, string> = {
  "https://oauth2.googleapis.com/token": "https://accounts.google.com",
  "https://appleid.apple.com/auth/token": "https://appleid.apple.com",
};

export const fakeProvider = {
  refuseCodes: false, // The token endpoint answers 400, like for an expired or reused code.
  signingKey: privateKey, // Swap for another key to send a token with a forged signature.
  lastTokenRequest: {} as Record<string, string>,
};

export const resetFakeProvider = () => {
  fakeProvider.refuseCodes = false;
  fakeProvider.signingKey = privateKey;
  fakeProvider.lastTokenRequest = {};
};

export const oauthCode = (claims: Record<string, unknown>) =>
  Buffer.from(JSON.stringify(claims)).toString("base64url");

export const installFakeOAuthProvider = () => {
  const realFetch = global.fetch;

  jest.spyOn(global, "fetch").mockImplementation(async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);

    if (url.endsWith("/oauth2/v3/certs") || url.endsWith("/auth/keys")) {
      return Response.json({ keys: [jwk] });
    }

    const issuer = issuers[url];

    if (!issuer) {
      return realFetch(input, init);
    }

    const body = Object.fromEntries(new URLSearchParams(String(init?.body)));
    fakeProvider.lastTokenRequest = body;

    if (fakeProvider.refuseCodes) {
      return Response.json({ error: "invalid_grant" }, { status: 400 });
    }

    const claims = JSON.parse(Buffer.from(body.code, "base64url").toString());
    const idToken = jwt.sign(
      { iss: issuer, aud: body.client_id, email_verified: true, ...claims },
      fakeProvider.signingKey,
      // A test can set its own exp (eg. an expired token), jsonwebtoken refuses both at once.
      { algorithm: "RS256", keyid: keyId, ...(claims.exp === undefined && { expiresIn: "5m" }) },
    );

    return Response.json({ access_token: "unused", id_token: idToken });
  });
};
