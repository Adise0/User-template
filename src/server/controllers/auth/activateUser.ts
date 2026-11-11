import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import { getInvalidOrExpiredTokenError } from "../../../data/errorObjects/authErrors";
import {
  getAccountAlreadyActivatedError,
  getUserDisabledError,
  getUserNotFoundForIdError,
} from "../../../data/errorObjects/userErrors";
import hashToken from "../../utils/auth/hashToken";

const activateUser = async (req: Request, res: Response, next: NextFunction) => {
  const { userId, token } = res.locals; // Grab the userId and raw token left by the signedIdTokenValidator.

  try {
    const foundUser = await Users.findById(userId);

    // If no user matches the token's id write the error and go next.
    if (!foundUser) {
      const notFoundForIdError = getUserNotFoundForIdError(userId);
      next(notFoundForIdError);
      return;
    }

    // An admin can disable a pending account: activating it must not hand out a session.
    if (foundUser.isDisabled) {
      next(getUserDisabledError(foundUser.id));
      return;
    }

    if (foundUser.activatedAt) {
      const alreadyActivatedError = getAccountAlreadyActivatedError(userId);
      next(alreadyActivatedError);
      return;
    }

    // If the token does not match the one on record it's stale (eg. a newer activation email was sent since).
    if (foundUser.verificationToken !== hashToken(token)) {
      const invalidOrExpiredTokenError = getInvalidOrExpiredTokenError();
      next(invalidOrExpiredTokenError);
      return;
    }

    // Activate the account, clear what was only needed while pending, and save the user back to the DB.
    // pendingExpiresAt has to go too, or MongoDB would still delete the account when it passes.
    foundUser.activatedAt = new Date();
    foundUser.verificationToken = undefined;
    foundUser.activationLastSentAt = undefined;
    foundUser.pendingExpiresAt = undefined;
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
