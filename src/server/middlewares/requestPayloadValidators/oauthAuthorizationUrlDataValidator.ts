import { NextFunction, Request, Response } from "express";
import { getValidationError } from "../../../data/errorObjects/dataValidationErrors";
import joiValidationOptions from "../../../data/joiObjects/joiValidationOptions";
import { oauthAuthorizationUrlData } from "../../../data/joiObjects/oauthData";
import { OAuthProvider } from "../../utils/oauth/types";

// Validates the query of GET /auth/oauth/:provider/authorizationUrl and leaves it in res.locals.
// Goes after oauthProviderValidator, which says whether the PKCE challenge is required.
const oauthAuthorizationUrlDataValidator = (req: Request, res: Response, next: NextFunction) => {
  const provider: OAuthProvider = res.locals.oauthProvider;

  const { error, value } = oauthAuthorizationUrlData.validate(req.query, {
    ...joiValidationOptions,
    context: { pkce: provider.supportsPkce },
  });

  if (error) {
    next(getValidationError(error, "OAuth authorization URL"));
    return;
  }

  res.locals.authorizationUrlParams = value;
  next();
};

export default oauthAuthorizationUrlDataValidator;
