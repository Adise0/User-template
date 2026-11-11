import { NextFunction, Request, Response } from "express";
import sendSecurityNotice from "../../utils/email/sendSecurityNotice";
import logAdminAction from "../../utils/logAdminAction";
import clearTwoFactor from "../../utils/twoFactor/clearTwoFactor";

// For a user who lost both their authenticator and their backup codes: turns their 2FA off, so
// they can log in with the password alone and set it up again. Check who's asking before using it,
// it's exactly what someone taking over an account would ask support for.
const resetTwoFactor = async (req: Request, res: Response, next: NextFunction) => {
  const { targetUser } = res.locals; // Grab the user left by the manageableUserValidator.

  try {
    await clearTwoFactor(targetUser._id);

    logAdminAction(req, res, "resetTwoFactor");

    sendSecurityNotice(
      targetUser.credentials.email,
      "Two-factor authentication was turned off",
      "An administrator turned off two-factor authentication on your account. Set it up again from your settings. If you didn't ask for this, contact support right away.",
    );

    res.status(200).json({
      message: "Two-factor authentication reset",
    });
  } catch (error) {
    next(error);
  }
};

export default resetTwoFactor;
