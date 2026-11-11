import { NextFunction, Request, Response } from "express";
import { getOAuthFailedError } from "../../../data/errorObjects/oauthErrors";
import { OAuthIdentity, OAuthProvider } from "../../utils/oauth/types";

// Trades the code the provider sent back for the user's identity, and leaves it in
// res.locals.oauthIdentity. Goes after oauthProviderValidator and oauthCodeDataValidator.
const oauthIdentityResolver = async (req: Request, res: Response, next: NextFunction) => {
  const provider: OAuthProvider = res.locals.oauthProvider;
  const { code, nonce, codeVerifier, firstName, lastName } = req.body;

  try {
    const identity: OAuthIdentity = await provider.getIdentity({ code, nonce, codeVerifier });

    // A name the frontend forwards (Apple's first sign-in) only fills in what the token didn't say.
    res.locals.oauthIdentity = {
      ...identity,
      firstName: identity.firstName ?? firstName,
      lastName: identity.lastName ?? lastName,
    };

    next();
  } catch (error) {
    // Whatever went wrong with the provider, the user's answer is the same: start over.
    next(getOAuthFailedError((error as Error).message, provider.name));
  }
};

export default oauthIdentityResolver;
