import { NextFunction, Request, Response } from "express";
import { getNotYetActivatedError } from "../../../data/errorObjects/userErrors";
import clearOtp from "../../utils/auth/clearOtp";
import sendPasswordResetEmail from "../../utils/auth/sendPasswordResetEmail";
import sendSecurityNotice from "../../utils/email/sendSecurityNotice";
import logAdminAction from "../../utils/logAdminAction";
import { logEmailRequestError } from "../../utils/respondEmailRequestAccepted";

// For an account that may be compromised: ends every session and stops the password from working,
// so the only way back in is the link sent to the account's email. If this email fails the user
// can still ask for a new one through requestPasswordReset.
const forcePasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  const { targetUser } = res.locals; // Grab the user left by the manageableUserValidator.

  try {
    // A pending account has no password worth resetting, it has to go through activation.
    if (!targetUser.activatedAt) {
      next(getNotYetActivatedError(targetUser.id));
      return;
    }

    targetUser.resetPasswordOnLogin = true;
    targetUser.tokenVersion += 1;
    clearOtp(targetUser);
    await targetUser.save();

    logAdminAction(req, res, "forcePasswordReset");

    sendSecurityNotice(
      targetUser.credentials.email,
      "You need to reset your password",
      "An administrator asked you to reset your password, and you've been signed out. Use the link in the password reset email to get back in.",
    );

    sendPasswordResetEmail(targetUser).catch((error) =>
      logEmailRequestError("forced password reset", error),
    );

    res.status(200).json({
      message: "Password reset forced",
    });
  } catch (error) {
    next(error);
  }
};

export default forcePasswordReset;
