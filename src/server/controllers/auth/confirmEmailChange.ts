import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import { getInvalidOrExpiredTokenError } from "../../../data/errorObjects/authErrors";
import {
  getUserDisabledError,
  getUserNotFoundForIdError,
} from "../../../data/errorObjects/userErrors";
import clearOtp from "../../utils/auth/clearOtp";
import hashToken from "../../utils/auth/hashToken";
import {
  getDuplicateKeyErrorFromMongoError,
  isDuplicateKeyMongoError,
} from "../../utils/duplicateKeyMongoError";
import sendSecurityNotice from "../../utils/email/sendSecurityNotice";

// Handles the link sent to the new address: proves the user owns it and applies the change.
const confirmEmailChange = async (req: Request, res: Response, next: NextFunction) => {
  const { userId, token } = res.locals; // Grab the userId and raw token left by the signedIdTokenValidator.

  try {
    const foundUser = await Users.findById(userId);

    // If no user matches the token's id write the error and go next.
    if (!foundUser) {
      next(getUserNotFoundForIdError(userId));
      return;
    }

    // If the user is disabled write the error and go next.
    if (foundUser.isDisabled) {
      next(getUserDisabledError(foundUser.id));
      return;
    }

    const { pendingEmail, emailChangeToken } = foundUser;

    // If there's no pending change, or the token doesn't match the one on record (stale/already
    // used), treat it the same way: the link is no longer valid.
    if (!pendingEmail || !emailChangeToken || emailChangeToken !== hashToken(token)) {
      next(getInvalidOrExpiredTokenError());
      return;
    }

    const previousEmail = foundUser.credentials.email;

    foundUser.credentials.email = pendingEmail;
    foundUser.information.email = pendingEmail;
    foundUser.pendingEmail = undefined;
    foundUser.emailChangeToken = undefined;

    // Anything that went to the old address is dropped: a pending reset link and a pending OTP.
    foundUser.resetPasswordToken = undefined;
    clearOtp(foundUser);

    await foundUser.save();

    sendSecurityNotice(
      previousEmail,
      "Your email was changed",
      "The email on your account was just changed, so this address can no longer be used to sign in. If this wasn't you, contact support right away.",
    );

    res.status(200).json({
      message: "Email changed",
    });
  } catch (error) {
    // Someone may have taken the address since the change was requested.
    if (isDuplicateKeyMongoError(error)) {
      next(getDuplicateKeyErrorFromMongoError(error));
      return;
    }

    next(error);
  }
};

export default confirmEmailChange;
