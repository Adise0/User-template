import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import { getInvalidOrExpiredTokenError } from "../../../data/errorObjects/authErrors";
import {
  getAccountAlreadyActivatedError,
  getUserNotFoundForIdError,
} from "../../../data/errorObjects/userErrors";

// Handles the "wasn't you?" link on the activation email: deletes a pending (not yet
// activated) account. Uses the same token/field as activateUser, just a different action.
const cancelRegistration = async (
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

    // An already-active account can't be cancelled through this link - it has nothing to do with a pending registration anymore.
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

    // The account was never activated, so there's nothing to keep - remove it entirely.
    await foundUser.deleteOne();

    res.status(200).json({
      message: "Registration cancelled",
    });
  } catch (error) {
    next(error);
  }
};

export default cancelRegistration;
