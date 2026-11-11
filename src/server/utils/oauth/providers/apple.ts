import jwt from "jsonwebtoken";
import { OAuthProvider } from "../types";
import { exchangeCodeForIdToken, verifyIdToken } from "../openIdConnect";

const appleIssuer = "https://appleid.apple.com";

// Apple has no fixed client secret: it's a short JWT signed with the app's private key, made fresh
// for every code exchange.
const getClientSecret = () =>
  jwt.sign({}, (process.env.APPLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"), {
    algorithm: "ES256",
    keyid: process.env.APPLE_KEY_ID,
    issuer: process.env.APPLE_TEAM_ID,
    audience: appleIssuer,
    subject: process.env.APPLE_CLIENT_ID,
    expiresIn: "5m",
  });

// Sign in with Apple. Needs APPLE_CLIENT_ID (the Services ID), APPLE_TEAM_ID, APPLE_KEY_ID and
// APPLE_PRIVATE_KEY (the .p8 key's contents), with the redirect URI below set as the Services ID's
// "Return URL".
//
// Two Apple quirks:
//  - Asking for the name and email makes Apple POST the callback as a form, which a frontend page
//    can't read. So the return URL points at the backend, which passes it on to the frontend.
//  - The name is only sent on the very first sign-in, outside the ID token, in a "user" field the
//    frontend forwards (it's only used to pre-fill the signup, so it doesn't need to be trusted).
//    The email may be a private relay address (...@privaterelay.appleid.com), which works fine.
const apple: OAuthProvider = {
  name: "apple",
  supportsPkce: false,
  usesFormPostCallback: true,

  isConfigured: () =>
    Boolean(
      process.env.APPLE_CLIENT_ID &&
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_KEY_ID &&
      process.env.APPLE_PRIVATE_KEY,
    ),

  getRedirectUri: () => `${process.env.BACKEND_URL}/auth/oauth/apple/callback`,

  getAuthorizationUrl: ({ state, nonce }) => {
    const params = new URLSearchParams({
      client_id: process.env.APPLE_CLIENT_ID ?? "",
      redirect_uri: apple.getRedirectUri(),
      response_type: "code",
      response_mode: "form_post",
      scope: "name email",
      state,
      nonce,
    });

    return `${appleIssuer}/auth/authorize?${params}`;
  },

  getIdentity: async ({ code, nonce }) => {
    const clientId = process.env.APPLE_CLIENT_ID ?? "";

    const idToken = await exchangeCodeForIdToken({
      tokenEndpoint: `${appleIssuer}/auth/token`,
      code,
      redirectUri: apple.getRedirectUri(),
      clientId,
      clientSecret: getClientSecret(),
    });

    const payload = await verifyIdToken(idToken, {
      jwksUri: `${appleIssuer}/auth/keys`,
      issuers: [appleIssuer],
      clientId,
      nonce,
    });

    return {
      provider: apple.name,
      providerId: payload.sub as string,
      email: String(payload.email ?? "").toLowerCase(),
      // Apple sends it as a boolean or as the string "true", depending on the day.
      emailVerified: payload.email_verified === true || payload.email_verified === "true",
    };
  },
};

export default apple;
