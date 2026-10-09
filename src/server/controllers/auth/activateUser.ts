import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import { getInvalidOrExpiredTokenError } from "../../../data/errorObjects/authErrors";
import {
  getAccountAlreadyActivatedError,
  getUserNotFoundForIdError,
} from "../../../data/errorObjects/userErrors";

const activateUser = async (
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

    // If the user has no pending verificationToken it's already active.
    if (!foundUser.verificationToken) {
      const alreadyActivatedError = getAccountAlreadyActivatedError(userId);
      next(alreadyActivatedError);
      return;
    }

    // If the token does not match the one on record it's stale (eg. a newer activation email was sent since).
    if (foundUser.verificationToken !== token) {
      const invalidOrExpiredTokenError = getInvalidOrExpiredTokenError();
      next(invalidOrExpiredTokenError);
      return;
    }

    // Clear the verificationToken, activating the account, and save the user back to the DB.
    foundUser.verificationToken = undefined;
    await foundUser.save();

    // Keep the userId and tokenVersion in res.locals so the chained sendToken middleware can log the user in.
    res.locals.userId = foundUser.id;
    res.locals.tokenVersion = foundUser.tokenVersion;

    next();
  } catch (error) {
    next(error);
  }
};

export default activateUser;
