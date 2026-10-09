import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import { getInvalidOrExpiredTokenError } from "../../../data/errorObjects/authErrors";
import { getUserNotFoundForIdError } from "../../../data/errorObjects/userErrors";

// Handles the "wasn't you?" link on the password reset email: invalidates a reset request that
// wasn't made by the account owner. Uses the same token/field as resetPassword, just a different
// action, and leaves the current password untouched.
const cancelPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId, token } = res.locals; // Grab the userId and raw token left by the signedIdTokenValidator.

  try {
    const foundUser = await Users.findById(userId);

    // If no user matches the token's id write the error and go next.
    if (!foundUser) {
      const notFoundForIdError = getUserNotFoundForIdError(userId);
      next(notFoundForIdError);
      return;
    }

    // If there's no pending reset, or the token doesn't match the one on record (stale/already
    // used/already cancelled), treat it the same way: nothing left to cancel.
    if (
      !foundUser.resetPasswordToken ||
      foundUser.resetPasswordToken !== token
    ) {
      const invalidOrExpiredTokenError = getInvalidOrExpiredTokenError();
      next(invalidOrExpiredTokenError);
      return;
    }

    // Drop the reset token so the link in the email can no longer be used.
    foundUser.resetPasswordToken = undefined;
    await foundUser.save();

    res.status(200).json({
      message: "Password reset cancelled. You can close this window now.",
    });
  } catch (error) {
    next(error);
  }
};

export default cancelPasswordReset;
