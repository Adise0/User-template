import { OAuthProvider } from "../types";
import { exchangeCodeForIdToken, verifyIdToken } from "../openIdConnect";

// Sign in with Google. Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (a "Web application" OAuth
// client in Google Cloud), with the redirect URI below added to its "Authorized redirect URIs".
const google: OAuthProvider = {
  name: "google",
  supportsPkce: true,
  usesFormPostCallback: false,

  isConfigured: () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),

  getRedirectUri: () => `${process.env.FRONTEND_URL}/auth/oauth/google/callback`,

  getAuthorizationUrl: ({ state, nonce, codeChallenge }) => {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      redirect_uri: google.getRedirectUri(),
      response_type: "code",
      scope: "openid email profile",
      state,
      nonce,
      ...(codeChallenge && { code_challenge: codeChallenge, code_challenge_method: "S256" }),
      prompt: "select_account",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },

  getIdentity: async ({ code, nonce, codeVerifier }) => {
    const clientId = process.env.GOOGLE_CLIENT_ID ?? "";

    const idToken = await exchangeCodeForIdToken({
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      code,
      codeVerifier,
      redirectUri: google.getRedirectUri(),
      clientId,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    });

    const payload = await verifyIdToken(idToken, {
      jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
      issuers: ["https://accounts.google.com", "accounts.google.com"],
      clientId,
      nonce,
    });

    return {
      provider: google.name,
      providerId: payload.sub as string,
      email: String(payload.email ?? "").toLowerCase(),
      emailVerified: payload.email_verified === true,
      firstName: payload.given_name,
      lastName: payload.family_name,
    };
  },
};

export default google;
