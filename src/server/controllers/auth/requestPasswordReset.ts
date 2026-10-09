import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Users from "../../../database/models/Users";
import DatabaseUserData from "../../../types/userTypes/DatabaseUserData";
import { SignedIdTokenPayload } from "../../../types/authTypes/TokenPayload";
import {
  getNotYetActivatedError,
  getPasswordResetCooldownError,
  getPasswordResetEmailFailedError,
  getUserDisabledError,
  getUserNotFoundForUsernameOrEmailError,
} from "../../../data/errorObjects/userErrors";
import sendEmail from "../../utils/email";
import EmailData from "../../utils/email/types";
import getPasswordResetEmail from "../../utils/email/emailBuilders/passwordResetEmail";
import {
  passwordResetExpirationInMinutes,
  passwordResetRetryCooldownInSeconds,
} from "../../../data/serverConfig/server-config";
import getTokenAgeInSeconds from "../../utils/auth/getTokenAgeInSeconds";

const requestPasswordReset = async (
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

    // A pending (unactivated) account has to go through activation first, not a password reset.
    if (foundUser.verificationToken) {
      const notActiveError = getNotYetActivatedError(foundUser.id);
      next(notActiveError);
      return;
    }

    // Throttle repeated reset requests for the same account.
    if (foundUser.resetPasswordToken) {
      const secondsSinceLastSend = getTokenAgeInSeconds(
        foundUser.resetPasswordToken
      );
      if (secondsSinceLastSend < passwordResetRetryCooldownInSeconds) {
        const secondsRemaining =
          passwordResetRetryCooldownInSeconds - secondsSinceLastSend;
        next(getPasswordResetCooldownError(secondsRemaining));
        return;
      }
    }

    // Create the reset token Payload.
    const tokenData: SignedIdTokenPayload = {
      id: foundUser.id,
    };

    // Create the token with the created payload. The same token backs both the reset link and
    // the "wasn't you?" cancel link, the endpoint it's sent to decides the action.
    const resetPasswordToken = jwt.sign(tokenData, process.env.TOKEN_SECRET, {
      expiresIn: `${passwordResetExpirationInMinutes}m`,
    });

    // Create the emailData object for the mail function.
    const emailData: EmailData = {
      html: getPasswordResetEmail(resetPasswordToken),
      internalEmailName: "Password reset email",
      subject: `Hey ${foundUser.information.username}! Reset your password`,
      to: foundUser.credentials.email,
    };

    try {
      // Send the email BEFORE overwriting the stored token: if it fails, a previously sent (still
      // valid) link stays intact instead of being replaced by one nobody received.
      await sendEmail(emailData);
    } catch {
      next(getPasswordResetEmailFailedError());
      return;
    }

    // The email went out - store the token (which also invalidates any previously issued reset links).
    foundUser.resetPasswordToken = resetPasswordToken;
    await foundUser.save();

    res.status(200).json({
      message: "Password reset email sent",
    });
  } catch (error) {
    next(error);
  }
};

export default requestPasswordReset;
