import { NextFunction, Request, Response } from "express";
import {
  getTwoFactorAlreadyEnabledError,
  getTwoFactorInvalidCodeError,
  getTwoFactorSetupNotStartedError,
} from "../../../data/errorObjects/twoFactorErrors";
import { getUserNotFoundForIdError } from "../../../data/errorObjects/userErrors";
import Users from "../../../database/models/Users";
import sendSecurityNotice from "../../utils/email/sendSecurityNotice";
import generateBackupCodes from "../../utils/twoFactor/backupCodes";
import { findTotpStep } from "../../utils/twoFactor/totp";
import { decryptTwoFactorSecret } from "../../utils/twoFactor/twoFactorSecret";

// Step 2 of turning 2FA on (fresh session only): a code from the app proves it was set up with the
// secret from step 1. From now on every login asks for a code. Answers the backup codes, which are
// shown this one time only.
const enableTwoFactor = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals; // Grab the userId left by the tokenValidator.
  const { code } = req.body; // Grab the code left in the body by the request validator.

  try {
    const foundUser = await Users.findById(userId);

    if (!foundUser) {
      next(getUserNotFoundForIdError(userId));
      return;
    }

    if (foundUser.twoFactor.enabledAt) {
      next(getTwoFactorAlreadyEnabledError(userId));
      return;
    }

    const { pendingSecret } = foundUser.twoFactor;

    if (!pendingSecret) {
      next(getTwoFactorSetupNotStartedError(userId));
      return;
    }

    const step = findTotpStep(decryptTwoFactorSecret(pendingSecret), code);

    if (step === null) {
      next(getTwoFactorInvalidCodeError(userId));
      return;
    }

    const { codes, hashes } = generateBackupCodes();

    foundUser.set({
      "twoFactor.secret": pendingSecret,
      "twoFactor.pendingSecret": undefined,
      "twoFactor.enabledAt": new Date(),
      "twoFactor.backupCodes": hashes,
      "twoFactor.lastUsedStep": step, // The code just used can't log anyone in.
    });
    await foundUser.save();

    sendSecurityNotice(
      foundUser.credentials.email,
      "Two-factor authentication is on",
      "Logging in to your account now also asks for a code from your authenticator app. If this wasn't you, contact support right away.",
    );

    res.status(200).json({
      message: "Two-factor authentication enabled",
      backupCodes: codes,
    });
  } catch (error) {
    next(error);
  }
};

export default enableTwoFactor;
