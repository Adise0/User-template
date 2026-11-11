import { NextFunction, Request, Response } from "express";
import { getForbiddenError } from "../../../data/errorObjects/authErrors";
import UserRole from "../../../types/userTypes/UserRole";

// Goes right after tokenValidator on anything limited to certain roles, eg.
// router.all(path, method(Methods.GET), tokenValidator, roleValidator(UserRole.admin), controller)
const roleValidator =
  (...allowedRoles: UserRole[]) =>
  (_req: Request, res: Response, next: NextFunction) => {
    const { userId, role } = res.locals; // Grab what the tokenValidator left.

    if (!allowedRoles.includes(role)) {
      next(getForbiddenError(userId));
      return;
    }

    next();
  };

export default roleValidator;
