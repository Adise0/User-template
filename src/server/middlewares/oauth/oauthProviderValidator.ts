import { NextFunction, Request, Response } from "express";
import { getOAuthProviderUnavailableError } from "../../../data/errorObjects/oauthErrors";
import { getConfiguredOAuthProvider } from "../../utils/oauth/providers";

// Resolves the :provider param of every OAuth route. Unknown and unconfigured providers answer the
// same 404, so the response doesn't tell which providers the code knows about.
const oauthProviderValidator = (req: Request, res: Response, next: NextFunction) => {
  const providerName = String(req.params.provider);
  const provider = getConfiguredOAuthProvider(providerName);

  if (!provider) {
    next(getOAuthProviderUnavailableError(providerName));
    return;
  }

  res.locals.oauthProvider = provider;
  next();
};

export default oauthProviderValidator;
