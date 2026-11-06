import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import { getInvalidOrExpiredTokenError } from "../../../data/errorObjects/authErrors";
import {
  getUserDisabledError,
  getUserNotFoundForIdError,
} from "../../../data/errorObjects/userErrors";
import hashPassword from "../../utils/auth/hashPassword";
import clearOtp from "../../utils/auth/clearOtp";
import sendSecurityNotice from "../../utils/email/sendSecurityNotice";
import hashToken from "../../utils/auth/hashToken";

const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const { userId, token } = res.locals; // Grab the userId and raw token left by the signedIdTokenValidator.
  const { password } = req.body; // Grab the new password left in the body by the request validator.

  try {
    const foundUser = await Users.findById(userId);

    // If no user matches the token's id write the error and go next.
    if (!foundUser) {
      const notFoundForIdError = getUserNotFoundForIdError(userId);
      next(notFoundForIdError);
      return;
    }

    // If the user is disabled write the error and go next.
    if (foundUser.isDisabled) {
      const userDisabledError = getUserDisabledError(foundUser.id);
      next(userDisabledError);
      return;
    }

    // If there's no pending reset, or the token doesn't match the one on record (stale/already
    // used/cancelled), treat it the same way: the link is no longer valid.
    if (!foundUser.resetPasswordToken || foundUser.resetPasswordToken !== hashToken(token)) {
      const invalidOrExpiredTokenError = getInvalidOrExpiredTokenError();
      next(invalidOrExpiredTokenError);
      return;
    }

    // Set the new password and consume the reset token (it's one-time).
    foundUser.credentials.password = await hashPassword(password);
    foundUser.resetPasswordToken = undefined;
    foundUser.resetPasswordOnLogin = false;

    // The password changed, so any pending OTP issued under the old one is dropped as well.
    clearOtp(foundUser);

    // Sign out of every session: bumping the version invalidates all previously issued auth tokens.
    foundUser.tokenVersion += 1;

    await foundUser.save();

    sendSecurityNotice(
      foundUser.credentials.email,
      "Your password was changed",
      "The password on your account was just reset, and every session was signed out. If this wasn't you, reset your password now.",
    );

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

export default resetPassword;
