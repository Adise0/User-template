import { NextFunction, Request, Response } from "express";
import { getDuplicateKeyRegistrationError } from "../../../data/errorObjects/userErrors";
import getRegistrationConflict from "../../utils/auth/getRegistrationConflict";

// Tells if /register would accept these keys, without changing anything. A cooldown isn't a
// conflict, so it's left for /register to report.
const duplicateKeyChecker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, username } = res.locals; // Get the keys from the res.locals

    const { hasDuplicates, duplicatedKeys } = await getRegistrationConflict(email, username);

    if (hasDuplicates) {
      next(getDuplicateKeyRegistrationError(duplicatedKeys));
      return;
    }

    res.json({
      message: "No conflicts",
    });
  } catch (error) {
    next(error);
  }
};

export default duplicateKeyChecker;
