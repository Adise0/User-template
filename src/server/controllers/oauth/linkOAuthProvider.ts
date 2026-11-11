import { NextFunction, Request, Response } from "express";
import { getOAuthAlreadyLinkedError } from "../../../data/errorObjects/oauthErrors";
import { getUserNotFoundForIdError } from "../../../data/errorObjects/userErrors";
import Users from "../../../database/models/Users";
import { isDuplicateKeyMongoError } from "../../utils/duplicateKeyMongoError";
import sendSecurityNotice from "../../utils/email/sendSecurityNotice";
import { OAuthIdentity } from "../../utils/oauth/types";

// Links a provider account to the logged in user (fresh session only), so they can sign in with it
// from now on. The provider's email doesn't have to match the account's: signing in with the
// provider account just proved the user owns it. One account per provider.
const linkOAuthProvider = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals; // Grab the userId left by the tokenValidator.
  const identity: OAuthIdentity = res.locals.oauthIdentity;

  try {
    const foundUser = await Users.findById(userId);

    if (!foundUser) {
      next(getUserNotFoundForIdError(userId));
      return;
    }

    const hasThisProvider = foundUser.oauthAccounts.some(
      ({ provider }) => provider === identity.provider,
    );

    const isLinkedElsewhere = await Users.exists({
      oauthAccounts: {
        $elemMatch: { provider: identity.provider, providerId: identity.providerId },
      },
    });

    if (hasThisProvider || isLinkedElsewhere) {
      next(getOAuthAlreadyLinkedError(identity.provider));
      return;
    }

    foundUser.oauthAccounts.push({
      provider: identity.provider,
      providerId: identity.providerId,
      email: identity.email || undefined,
      linkedAt: new Date(),
    });
    await foundUser.save();

    sendSecurityNotice(
      foundUser.credentials.email,
      "A sign-in method was linked",
      `A ${identity.provider} account was linked to your account, so it can be used to sign in. If this wasn't you, reset your password and unlink it right away.`,
    );

    res.status(200).json({
      message: "Sign-in method linked",
    });
  } catch (error) {
    // Racing another request linking the same provider account.
    if (isDuplicateKeyMongoError(error)) {
      next(getOAuthAlreadyLinkedError(identity.provider));
      return;
    }

    next(error);
  }
};

export default linkOAuthProvider;
