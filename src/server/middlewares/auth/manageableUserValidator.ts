import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import { getForbiddenError } from "../../../data/errorObjects/authErrors";
import { getUserNotFoundForIdError } from "../../../data/errorObjects/userErrors";
import UserRole from "../../../types/userTypes/UserRole";

// Goes in front of every admin action that changes a user. Nobody can act on themselves, admins can
// only act on regular users, superusers on regular users and admins, and a superuser can't be
// touched through the API at all. Leaves the user in res.locals.targetUser.
const manageableUserValidator = async (_req: Request, res: Response, next: NextFunction) => {
  const { userId, role, requestedUserId } = res.locals;

  try {
    const targetUser = await Users.findById(requestedUserId);

    if (!targetUser) {
      next(getUserNotFoundForIdError(requestedUserId));
      return;
    }

    const isSelf = targetUser.id === userId;
    const isSuperuser = targetUser.role === UserRole.superuser;
    const isProtectedAdmin = targetUser.role === UserRole.admin && role !== UserRole.superuser;

    if (isSelf || isSuperuser || isProtectedAdmin) {
      next(getForbiddenError(userId));
      return;
    }

    res.locals.targetUser = targetUser;
    next();
  } catch (error) {
    next(error);
  }
};

export default manageableUserValidator;
