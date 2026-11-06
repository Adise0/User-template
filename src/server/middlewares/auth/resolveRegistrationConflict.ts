import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import {
  getDuplicateKeyRegistrationError,
  getPendingRegistrationCooldownError,
} from "../../../data/errorObjects/userErrors";
import getRegistrationConflict from "../../utils/auth/getRegistrationConflict";

// Runs only in the register chain, it's the part of the check that changes data: any pending
// account in the way is dropped so the new registration can take its place.
const resolveRegistrationConflict = async (req: Request, res: Response, next: NextFunction) => {
  const { email, username } = res.locals; // Get the keys from the res.locals

  try {
    const { hasDuplicates, duplicatedKeys, replaceableUsers, cooldownSecondsRemaining } =
      await getRegistrationConflict(email, username);

    if (hasDuplicates) {
      next(getDuplicateKeyRegistrationError(duplicatedKeys));
      return;
    }

    if (cooldownSecondsRemaining > 0) {
      next(getPendingRegistrationCooldownError(cooldownSecondsRemaining));
      return;
    }

    await Users.deleteMany({ _id: { $in: replaceableUsers.map((userFound) => userFound._id) } });
    next();
  } catch (error) {
    next(error);
  }
};

export default resolveRegistrationConflict;
