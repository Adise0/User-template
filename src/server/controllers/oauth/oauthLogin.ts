import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  getOAuthEmailInUseError,
  getOAuthEmailNotVerifiedError,
} from "../../../data/errorObjects/oauthErrors";
import { oauthSignupExpirationInMinutes } from "../../../data/serverConfig/server-config";
import Users from "../../../database/models/Users";
import { OAuthSignupTokenPayload, TokenPurpose } from "../../../types/authTypes/TokenPayload";
import admitToLogin from "../../utils/auth/admitToLogin";
import getTokenSecret from "../../utils/auth/getTokenSecret";
import { OAuthIdentity } from "../../utils/oauth/types";

// Signs in with a provider account. Three outcomes:
//  - It's linked to a user: that user goes on to the session (or the 2FA challenge), as a login.
//  - It isn't, and nobody has the email: answers a signup token. The frontend asks for a username
//    and sends both to POST /auth/oauth/completeSignup.
//  - It isn't, but an account has the email: refused. Linking it automatically would hand the
//    account to whoever controls that email at the provider, so the owner has to log in and link
//    the provider from their settings.
const oauthLogin = async (req: Request, res: Response, next: NextFunction) => {
  const identity: OAuthIdentity = res.locals.oauthIdentity;

  try {
    const linkedUser = await Users.findOne({
      oauthAccounts: {
        $elemMatch: { provider: identity.provider, providerId: identity.providerId },
      },
    });

    if (linkedUser) {
      const loginError = await admitToLogin(linkedUser, res);

      if (loginError) {
        next(loginError);
        return;
      }

      next();
      return;
    }

    // From here on the email is what the account would be created with, so it has to be proven.
    if (!identity.email || !identity.emailVerified) {
      next(getOAuthEmailNotVerifiedError(identity.provider));
      return;
    }

    // A pending (never activated) account with the email doesn't count: whoever started it never
    // proved the email, the provider just did. completeSignup replaces it.
    const isEmailInUse = await Users.exists({
      "credentials.email": identity.email,
      activatedAt: { $ne: null },
    });

    if (isEmailInUse) {
      next(getOAuthEmailInUseError(identity.provider));
      return;
    }

    const signupTokenData: OAuthSignupTokenPayload = {
      purpose: TokenPurpose.oauthSignup,
      provider: identity.provider,
      providerId: identity.providerId,
      email: identity.email,
      firstName: identity.firstName,
      lastName: identity.lastName,
    };

    const signupToken = jwt.sign(signupTokenData, getTokenSecret(), {
      expiresIn: `${oauthSignupExpirationInMinutes}m`,
    });

    // What the provider said, so the frontend can pre-fill the signup form.
    res.status(200).json({
      signupRequired: true,
      signupToken,
      email: identity.email,
      firstName: identity.firstName,
      lastName: identity.lastName,
    });
  } catch (error) {
    next(error);
  }
};

export default oauthLogin;
