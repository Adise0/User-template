import { NextFunction, Request, Response } from "express";
import {
  getDuplicateKeyErrorFromMongoError,
  isDuplicateKeyMongoError,
} from "../../utils/duplicateKeyMongoError";
import logAdminAction from "../../utils/logAdminAction";
import applyProfileChanges from "../../utils/users/applyProfileChanges";

const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  const { targetUser } = res.locals; // Grab the user left by the manageableUserValidator.

  try {
    applyProfileChanges(targetUser, req.body);
    await targetUser.save();

    logAdminAction(req, res, "updateUser", { fields: Object.keys(req.body) });

    res.json({ id: targetUser.id, information: targetUser.information });
  } catch (error) {
    // The unique index is what catches a username that's already taken.
    if (isDuplicateKeyMongoError(error)) {
      next(getDuplicateKeyErrorFromMongoError(error));
      return;
    }

    next(error);
  }
};

export default updateUser;
