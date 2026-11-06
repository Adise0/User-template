import { NextFunction, Request, Response } from "express";
import logAdminAction from "../../utils/logAdminAction";

const changeUserRole = async (req: Request, res: Response, next: NextFunction) => {
  const { targetUser } = res.locals; // Grab the user left by the manageableUserValidator.
  const { role } = req.body; // Grab the role left in the body by the request validator.

  try {
    const previousRole = targetUser.role;

    targetUser.role = role;
    await targetUser.save();

    logAdminAction(req, res, "changeUserRole", { previousRole, role });

    res.status(200).json({
      message: "Role changed",
    });
  } catch (error) {
    next(error);
  }
};

export default changeUserRole;
