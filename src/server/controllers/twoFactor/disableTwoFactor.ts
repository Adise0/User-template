import { NextFunction, Request, Response } from "express";
import {
  getTwoFactorInvalidCodeError,
  getTwoFactorNotEnabledError,
} from "../../../data/errorObjects/twoFactorErrors";
import { getUserNotFoundForIdError } from "../../../data/errorObjects/userErrors";
import Users from "../../../database/models/Users";
import sendSecurityNotice from "../../utils/email/sendSecurityNotice";
import clearTwoFactor from "../../utils/twoFactor/clearTwoFactor";
import consumeTwoFactorCode from "../../utils/twoFactor/consumeTwoFactorCode";

// Turns 2FA off (fresh session only). Asks for a code too (authenticator or backup), so a stolen
// session alone can't take the second factor away.
const disableTwoFactor = async (req: Request, res: Response, next: NextFunction) => {
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

    await clearTwoFactor(foundUser._id);

    sendSecurityNotice(
      foundUser.credentials.email,
      "Two-factor authentication is off",
      "Logging in to your account no longer asks for a code from your authenticator app. If this wasn't you, reset your password and turn it back on right away.",
    );

    res.status(200).json({
      message: "Two-factor authentication disabled",
    });
  } catch (error) {
    next(error);
  }
};

export default disableTwoFactor;
