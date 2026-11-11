import { NextFunction, Request, Response } from "express";
import { getOAuthNotLinkedError } from "../../../data/errorObjects/oauthErrors";
import Users from "../../../database/models/Users";
import sendSecurityNotice from "../../utils/email/sendSecurityNotice";
import { OAuthProvider } from "../../utils/oauth/types";

// Unlinks a provider from the logged in user (fresh session only). Always allowed, even from an
// account that has no password: the email still works for signing in (OTP) and for setting a
// password (password reset), so nobody can lock themselves out this way.
const unlinkOAuthProvider = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals; // Grab the userId left by the tokenValidator.
  const provider: OAuthProvider = res.locals.oauthProvider;

  try {
    const updatedUser = await Users.findOneAndUpdate(
      { _id: userId, "oauthAccounts.provider": provider.name },
      { $pull: { oauthAccounts: { provider: provider.name } } },
    );

    if (!updatedUser) {
      next(getOAuthNotLinkedError(provider.name));
      return;
    }

    sendSecurityNotice(
      updatedUser.credentials.email,
      "A sign-in method was unlinked",
      `Your ${provider.name} account can no longer be used to sign in. If this wasn't you, reset your password right away.`,
    );

    res.status(200).json({
      message: "Sign-in method unlinked",
    });
  } catch (error) {
    next(error);
  }
};

export default unlinkOAuthProvider;
