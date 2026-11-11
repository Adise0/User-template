import { NextFunction, Request, Response } from "express";
import {
  getTwoFactorInvalidCodeError,
  getTwoFactorNotEnabledError,
} from "../../../data/errorObjects/twoFactorErrors";
import { getUserNotFoundForIdError } from "../../../data/errorObjects/userErrors";
import Users from "../../../database/models/Users";
import generateBackupCodes from "../../utils/twoFactor/backupCodes";
import consumeTwoFactorCode from "../../utils/twoFactor/consumeTwoFactorCode";

// Replaces every backup code with a fresh set (fresh session and a code only), eg. once most are
// used up or the old ones may have been seen. The new codes are shown this one time only.
const regenerateBackupCodes = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals; // Grab the userId left by the tokenValidator.
  const { code } = req.body; // Grab the code left in the body by the request validator.

  try {
    const foundUser = await Users.findById(userId);

    if (!foundUser) {
      next(getUserNotFoundForIdError(userId));
      return;
    }

    if (!foundUser.twoFactor.enabledAt) {
      next(getTwoFactorNotEnabledError(userId));
      return;
    }

    if (!(await consumeTwoFactorCode(foundUser, code))) {
      next(getTwoFactorInvalidCodeError(userId));
      return;
    }

    const { codes, hashes } = generateBackupCodes();
    await Users.updateOne({ _id: foundUser._id }, { $set: { "twoFactor.backupCodes": hashes } });

    res.status(200).json({
      backupCodes: codes,
    });
  } catch (error) {
    next(error);
  }
};

export default regenerateBackupCodes;
