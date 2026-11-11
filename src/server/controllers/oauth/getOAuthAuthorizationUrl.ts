import { Request, Response } from "express";
import { OAuthProvider } from "../../utils/oauth/types";

// Builds the provider's sign-in URL from the state, nonce and PKCE challenge the frontend generated,
// so the client ids and scopes stay in one place (here). The frontend keeps state, nonce and the
// PKCE verifier (eg. in sessionStorage), redirects to the URL and, once the user is sent back,
// checks the state matches before sending the code to POST /auth/oauth/:provider/login.
const getOAuthAuthorizationUrl = (_req: Request, res: Response) => {
  const provider: OAuthProvider = res.locals.oauthProvider;
  const { state, nonce, codeChallenge } = res.locals.authorizationUrlParams;

  res.json({ url: provider.getAuthorizationUrl({ state, nonce, codeChallenge }) });
};

export default getOAuthAuthorizationUrl;
