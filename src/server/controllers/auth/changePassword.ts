import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import { getUserNotFoundForIdError } from "../../../data/errorObjects/userErrors";
import hashPassword from "../../utils/auth/hashPassword";
import clearOtp from "../../utils/auth/clearOtp";

// Changes the password of the logged in user. The current password isn't asked for: the chain in
// front of this (tokenValidator + freshAuthValidator) already demands a session from a recent login.
const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals; // Grab the userId left by the tokenValidator.
  const { password, signOutOtherSessions } = req.body; // Grab the data left in the body by the request validator.

  try {
    const foundUser = await Users.findById(userId);

    // If no user matches the token's id write the error and go next.
    if (!foundUser) {
      const notFoundForIdError = getUserNotFoundForIdError(userId);
      next(notFoundForIdError);
      return;
    }

    // Set the new password.
    foundUser.credentials.password = await hashPassword(password);
    foundUser.resetPasswordOnLogin = false;

    // Anything issued under the old password goes too: a pending reset link and a pending OTP.
    foundUser.resetPasswordToken = undefined;
    clearOtp(foundUser);

    // Optionally sign out of every other session by invalidating all previously issued auth tokens.
    if (signOutOtherSessions) {
      foundUser.tokenVersion += 1;
    }

    await foundUser.save();

    // Leave the (possibly bumped) tokenVersion for the chained sendToken, which hands this session
    // a new token so it stays logged in either way.
    res.locals.tokenVersion = foundUser.tokenVersion;

    next();
  } catch (error) {
    next(error);
  }
};

export default changePassword;
