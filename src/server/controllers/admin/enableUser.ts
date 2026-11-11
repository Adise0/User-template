import { NextFunction, Request, Response } from "express";
import sendSecurityNotice from "../../utils/email/sendSecurityNotice";
import logAdminAction from "../../utils/logAdminAction";

const enableUser = async (req: Request, res: Response, next: NextFunction) => {
  const { targetUser } = res.locals; // Grab the user left by the manageableUserValidator.

  try {
    if (targetUser.isDisabled) {
      targetUser.isDisabled = false;
      await targetUser.save();

      logAdminAction(req, res, "enableUser");

      sendSecurityNotice(
        targetUser.credentials.email,
        "Your account was enabled",
        "An administrator enabled your account, so you can sign in again.",
      );
    }

    res.status(200).json({
      message: "User enabled",
    });
  } catch (error) {
    next(error);
  }
};

export default enableUser;
