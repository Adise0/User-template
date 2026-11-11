import { NextFunction, Request, Response } from "express";
import { getOAuthProviderUnavailableError } from "../../../data/errorObjects/oauthErrors";
import { OAuthProvider } from "../../utils/oauth/types";

// Only for providers that POST their callback as a form (Apple): a frontend page can't read a form
// post, so it lands here and is passed on, unchanged, to the frontend's callback page as a normal
// redirect. Nothing is checked or stored here, the frontend checks the state and then sends the
// code to POST /auth/oauth/:provider/login like for any other provider.
const relayOAuthCallback = (req: Request, res: Response, next: NextFunction) => {
  const provider: OAuthProvider = res.locals.oauthProvider;

  if (!provider.usesFormPostCallback) {
    next(getOAuthProviderUnavailableError(provider.name));
    return;
  }

  const params = new URLSearchParams();

  // Only what the frontend needs: the code (or the error, eg. the user cancelled), the state to
  // check, and the name Apple sends on the first sign-in.
  ["code", "state", "error", "user"].forEach((field) => {
    const value = req.body?.[field];

    if (typeof value === "string" && value.length <= 4096) {
      params.set(field, value);
    }
  });

  res.redirect(303, `${process.env.FRONTEND_URL}/auth/oauth/${provider.name}/callback?${params}`);
};

export default relayOAuthCallback;
