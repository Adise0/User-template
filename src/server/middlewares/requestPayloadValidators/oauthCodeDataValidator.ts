import { NextFunction, Request, Response } from "express";
import { getValidationError } from "../../../data/errorObjects/dataValidationErrors";
import joiValidationOptions from "../../../data/joiObjects/joiValidationOptions";
import { oauthCodeData } from "../../../data/joiObjects/oauthData";
import { OAuthProvider } from "../../utils/oauth/types";

// Validates the body sent once the provider has sent the user back with a code. Goes after
// oauthProviderValidator, which says whether the PKCE verifier is required.
const oauthCodeDataValidator = (req: Request, res: Response, next: NextFunction) => {
  const provider: OAuthProvider = res.locals.oauthProvider;

  const { error, value } = oauthCodeData.validate(req.body, {
    ...joiValidationOptions,
    context: { pkce: provider.supportsPkce },
  });

  if (error) {
    next(getValidationError(error, "OAuth code"));
    return;
  }

  req.body = value;
  next();
};

export default oauthCodeDataValidator;
