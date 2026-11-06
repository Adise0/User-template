import { NextFunction, Request, Response } from "express";
import sendSecurityNotice from "../../utils/email/sendSecurityNotice";
import logAdminAction from "../../utils/logAdminAction";

const disableUser = async (req: Request, res: Response, next: NextFunction) => {
  const { targetUser } = res.locals; // Grab the user left by the manageableUserValidator.

  try {
    if (!targetUser.isDisabled) {
      // Sessions are ended too, so enabling the account later doesn't bring them back.
      targetUser.isDisabled = true;
      targetUser.tokenVersion += 1;
      await targetUser.save();

      logAdminAction(req, res, "disableUser");

      sendSecurityNotice(
        targetUser.credentials.email,
        "Your account was disabled",
        "An administrator disabled your account. If you think this is a mistake, contact support.",
      );
    }

    res.status(200).json({
      message: "User disabled",
    });
  } catch (error) {
    next(error);
  }
};

export default disableUser;
