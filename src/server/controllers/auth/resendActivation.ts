import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Users from "../../../database/models/Users";
import DatabaseUserData from "../../../types/userTypes/DatabaseUserData";
import { SignedIdTokenPayload } from "../../../types/authTypes/TokenPayload";
import {
  getAccountAlreadyActivatedError,
  getActivationEmailFailedError,
  getPendingRegistrationCooldownError,
  getUserDisabledError,
  getUserNotFoundForUsernameOrEmailError,
} from "../../../data/errorObjects/userErrors";
import sendEmail from "../../utils/email";
import EmailData from "../../utils/email/types";
import getUserActivationEmail from "../../utils/email/emailBuilders/userActivationEmail";
import {
  registrationRetryCooldownInSeconds,
  userActivationExpirationInMinutes,
} from "../../../data/serverConfig/server-config";
import getTokenAgeInSeconds from "../../utils/auth/getTokenAgeInSeconds";

const resendActivation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body; // Grab the email (or username) left in the body by the request validator.

  try {
    let foundUser: DatabaseUserData | null = null;

    foundUser = await Users.findOne({ "credentials.email": email }); // Get the user from the database by email.

    // If no user matches the email check if one matches the username
    if (!foundUser) {
      foundUser = await Users.findOne({ "credentials.username": email });
    }

    // If no user matches the email or username write the error and go next.
    if (!foundUser) {
      const userNotFoundError = getUserNotFoundForUsernameOrEmailError(email);
      next(userNotFoundError);
      return;
    }

    // If the user is disabled write the error and go next.
    if (foundUser.isDisabled) {
      const userDisabledError = getUserDisabledError(foundUser.id);
      next(userDisabledError);
      return;
    }

    // If there's no pending verificationToken the account is already active - nothing to resend.
    if (!foundUser.verificationToken) {
      const alreadyActivatedError = getAccountAlreadyActivatedError(
        foundUser.id
      );
      next(alreadyActivatedError);
      return;
    }

    // Throttle repeated resends of the same pending signup.
    const secondsSinceLastSend = getTokenAgeInSeconds(
      foundUser.verificationToken
    );
    if (secondsSinceLastSend < registrationRetryCooldownInSeconds) {
      const secondsRemaining =
        registrationRetryCooldownInSeconds - secondsSinceLastSend;
      next(getPendingRegistrationCooldownError(secondsRemaining));
      return;
    }

    // Create a fresh activationToken Payload.
    const tokenData: SignedIdTokenPayload = {
      id: foundUser.id,
    };

    // Create the token with the created payload.
    const verificationToken = jwt.sign(tokenData, process.env.TOKEN_SECRET, {
      expiresIn: `${userActivationExpirationInMinutes}m`,
    });

    // Create the emailData object for the mail function.
    const emailData: EmailData = {
      html: getUserActivationEmail(verificationToken),
      internalEmailName: "User Activation email",
      subject: `Hey ${foundUser.information.username}! Activate your account!`,
      to: foundUser.information.email,
    };

    try {
      // Send the email BEFORE overwriting the stored token: if it fails, the old (still valid)
      // link stays intact instead of being replaced by one nobody received.
      await sendEmail(emailData);
    } catch {
      next(getActivationEmailFailedError());
      return;
    }

    // The new email went out - now it's safe to replace the old token (which also invalidates
    // any previously issued activation/cancel links for this account).
    foundUser.verificationToken = verificationToken;
    await foundUser.save();

    res.status(200).json({
      message: "Activation email resent",
    });
  } catch (error) {
    next(error);
  }
};

export default resendActivation;
