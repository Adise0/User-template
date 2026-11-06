import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Users from "../../../database/models/Users";
import { SignedIdTokenPayload, TokenPurpose } from "../../../types/authTypes/TokenPayload";
import {
  emailChangeExpirationInMinutes,
  emailChangeRetryCooldownInSeconds,
} from "../../../data/serverConfig/server-config";
import { getTooManyRequestsError } from "../../../data/errorObjects/authErrors";
import {
  getDuplicateKeyRegistrationError,
  getEmailChangeEmailFailedError,
  getUserNotFoundForIdError,
} from "../../../data/errorObjects/userErrors";
import claimEmailSlot from "../../utils/auth/claimEmailSlot";
import getSecondsSince from "../../utils/auth/getSecondsSince";
import getTokenSecret from "../../utils/auth/getTokenSecret";
import hashToken from "../../utils/auth/hashToken";
import sendEmail from "../../utils/email";
import getEmailChangeEmail from "../../utils/email/emailBuilders/emailChangeEmail";
import sendSecurityNotice from "../../utils/email/sendSecurityNotice";

// Starts an email change for the logged in user. Nothing changes until the link sent to the NEW
// address is used, which proves the user owns it. Only reachable through a fresh session.
const requestEmailChange = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals; // Grab the userId left by the tokenValidator.
  const { email } = req.body; // Grab the new email left in the body by the request validator.

  try {
    const foundUser = await Users.findById(userId);

    // If no user matches the token's id write the error and go next.
    if (!foundUser) {
      next(getUserNotFoundForIdError(userId));
      return;
    }

    // This also covers asking for the email the user already has.
    const isEmailTaken = await Users.exists({ "credentials.email": email });

    if (isEmailTaken) {
      next(getDuplicateKeyRegistrationError({ email: true, username: false }));
      return;
    }

    const isSlotClaimed = await claimEmailSlot(
      foundUser._id,
      "emailChangeLastSentAt",
      emailChangeRetryCooldownInSeconds,
    );

    if (!isSlotClaimed) {
      const secondsSinceSent = getSecondsSince(foundUser.emailChangeLastSentAt);
      next(getTooManyRequestsError(emailChangeRetryCooldownInSeconds - secondsSinceSent));
      return;
    }

    // Create the token Payload.
    const tokenData: SignedIdTokenPayload = {
      purpose: TokenPurpose.emailChange,
      id: foundUser.id,
    };

    // Create the token with the created payload.
    const emailChangeToken = jwt.sign(tokenData, getTokenSecret(), {
      expiresIn: `${emailChangeExpirationInMinutes}m`,
    });

    try {
      await sendEmail({
        html: getEmailChangeEmail(emailChangeToken),
        internalEmailName: "Email change email",
        subject: "Confirm your new email",
        to: email,
      });
    } catch {
      next(getEmailChangeEmailFailedError());
      return;
    }

    // The email went out - store the token (which also invalidates any previously issued links).
    foundUser.pendingEmail = email;
    foundUser.emailChangeToken = hashToken(emailChangeToken);
    await foundUser.save();

    // The current address hears about it too, in case this isn't really the account owner.
    sendSecurityNotice(
      foundUser.credentials.email,
      "Someone asked to change your email",
      "A change of the email on your account was requested. It only goes through once the new address is confirmed. If this wasn't you, reset your password now.",
    );

    res.status(202).json({
      message: "Check your new inbox to confirm the change.",
    });
  } catch (error) {
    next(error);
  }
};

export default requestEmailChange;
