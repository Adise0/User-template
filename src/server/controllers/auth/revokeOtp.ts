import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import { getInvalidOrExpiredTokenError } from "../../../data/errorObjects/authErrors";
import { getUserNotFoundForIdError } from "../../../data/errorObjects/userErrors";

// Handles the "wasn't you?" link on the OTP email: invalidates a one-time password that
// wasn't requested by the account owner. Leaves the account itself untouched.
const revokeOtp = async (req: Request, res: Response, next: NextFunction) => {
  const { userId, token } = res.locals; // Grab the userId and raw token left by the signedIdTokenValidator.

  try {
    const foundUser = await Users.findById(userId);

    // If no user matches the token's id write the error and go next.
    if (!foundUser) {
      const notFoundForIdError = getUserNotFoundForIdError(userId);
      next(notFoundForIdError);
      return;
    }

    // If there's no pending OTP, or the token doesn't match the one on record (stale/already
    // consumed/already revoked), treat it the same way: nothing left to revoke.
    if (
      !foundUser.credentials.otpPassword ||
      !foundUser.otpRevokeToken ||
      foundUser.otpRevokeToken !== token
    ) {
      const invalidOrExpiredTokenError = getInvalidOrExpiredTokenError();
      next(invalidOrExpiredTokenError);
      return;
    }

    // Invalidate the OTP and the revoke token itself (it's one-time, same as the OTP it protects).
    foundUser.credentials.otpPassword = "";
    foundUser.otpRevokeToken = undefined;
    await foundUser.save();

    res.status(200).json({
      message: "OTP revoked. You can close this window now.",
    });
  } catch (error) {
    next(error);
  }
};

export default revokeOtp;
