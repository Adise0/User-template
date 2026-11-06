import { NextFunction, Request, Response } from "express";
import sendSecurityNotice from "../../utils/email/sendSecurityNotice";
import logAdminAction from "../../utils/logAdminAction";

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  const { targetUser } = res.locals; // Grab the user left by the manageableUserValidator.

  try {
    await targetUser.deleteOne();

    logAdminAction(req, res, "deleteUser");

    sendSecurityNotice(
      targetUser.credentials.email,
      "Your account was deleted",
      "An administrator deleted your account. If you think this is a mistake, contact support.",
    );

    res.status(200).json({
      message: "User deleted",
    });
  } catch (error) {
    next(error);
  }
};

export default deleteUser;
