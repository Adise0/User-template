import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import logAdminAction from "../../utils/logAdminAction";

const signOutUser = async (req: Request, res: Response, next: NextFunction) => {
  const { targetUser } = res.locals; // Grab the user left by the manageableUserValidator.

  try {
    await Users.updateOne({ _id: targetUser._id }, { $inc: { tokenVersion: 1 } });

    logAdminAction(req, res, "signOutUser");

    res.status(200).json({
      message: "User signed out of every session",
    });
  } catch (error) {
    next(error);
  }
};

export default signOutUser;
