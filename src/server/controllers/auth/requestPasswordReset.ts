import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { SignedIdTokenPayload, TokenPurpose } from "../../../types/authTypes/TokenPayload";
import sendEmail from "../../utils/email";
import EmailData from "../../utils/email/types";
import getPasswordResetEmail from "../../utils/email/emailBuilders/passwordResetEmail";
import {
  passwordResetExpirationInMinutes,
  passwordResetRetryCooldownInSeconds,
} from "../../../data/serverConfig/server-config";
import getTokenAgeInSeconds from "../../utils/auth/getTokenAgeInSeconds";
import findUserByEmailOrUsername from "../../utils/auth/findUserByEmailOrUsername";
import {
  logEmailRequestError,
  respondEmailRequestAccepted,
} from "../../utils/respondEmailRequestAccepted";

const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body; // Grab the email (or username) left in the body by the request validator.

  // Answer right away with the same response whatever happens below (see respondEmailRequestAccepted).
  respondEmailRequestAccepted(res);

  try {
    const foundUser = await findUserByEmailOrUsername(email); // Get the user from the database by email or username.

    // Silently do nothing if no user matches, it's disabled, or it's still pending activation
    // (that account has to go through activation first, not a password reset).
    if (!foundUser || foundUser.isDisabled || foundUser.verificationToken) {
      return;
    }

    // Throttle repeated reset requests for the same account.
    if (
      foundUser.resetPasswordToken &&
      getTokenAgeInSeconds(foundUser.resetPasswordToken) < passwordResetRetryCooldownInSeconds
    ) {
      return;
    }

    // Create the reset token Payload.
    const tokenData: SignedIdTokenPayload = {
      purpose: TokenPurpose.passwordReset,
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

    // Send the email BEFORE overwriting the stored token: if it fails (it throws), a previously
    // sent (still valid) link stays intact instead of being replaced by one nobody received.
    await sendEmail(emailData);

    // The email went out - store the token (which also invalidates any previously issued reset links).
    foundUser.resetPasswordToken = resetPasswordToken;
    await foundUser.save();
  } catch (error) {
    logEmailRequestError("password reset request", error);
  }
};

export default requestPasswordReset;
