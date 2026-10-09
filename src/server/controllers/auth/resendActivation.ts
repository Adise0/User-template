import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { SignedIdTokenPayload, TokenPurpose } from "../../../types/authTypes/TokenPayload";
import sendEmail from "../../utils/email";
import EmailData from "../../utils/email/types";
import getUserActivationEmail from "../../utils/email/emailBuilders/userActivationEmail";
import {
  registrationRetryCooldownInSeconds,
  userActivationExpirationInMinutes,
} from "../../../data/serverConfig/server-config";
import getTokenAgeInSeconds from "../../utils/auth/getTokenAgeInSeconds";
import findUserByEmailOrUsername from "../../utils/auth/findUserByEmailOrUsername";
import {
  logEmailRequestError,
  respondEmailRequestAccepted,
} from "../../utils/respondEmailRequestAccepted";

const resendActivation = async (req: Request, res: Response) => {
  const { email } = req.body; // Grab the email (or username) left in the body by the request validator.

  // Answer right away with the same response whatever happens below (see respondEmailRequestAccepted).
  respondEmailRequestAccepted(res);

  try {
    const foundUser = await findUserByEmailOrUsername(email); // Get the user from the database by email or username.

    // Silently do nothing if no user matches, it's disabled, or there's no pending
    // verificationToken (the account is already active - nothing to resend).
    if (!foundUser || foundUser.isDisabled || !foundUser.verificationToken) {
      return;
    }

    // Throttle repeated resends of the same pending signup.
    if (getTokenAgeInSeconds(foundUser.verificationToken) < registrationRetryCooldownInSeconds) {
      return;
    }

    // Create a fresh activationToken Payload.
    const tokenData: SignedIdTokenPayload = {
      purpose: TokenPurpose.activation,
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

    // Send the email BEFORE overwriting the stored token: if it fails (it throws), the old (still
    // valid) link stays intact instead of being replaced by one nobody received.
    await sendEmail(emailData);

    // The new email went out - now it's safe to replace the old token (which also invalidates
    // any previously issued activation/cancel links for this account).
    foundUser.verificationToken = verificationToken;
    await foundUser.save();
  } catch (error) {
    logEmailRequestError("activation resend", error);
  }
};

export default resendActivation;
