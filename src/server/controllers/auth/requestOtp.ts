import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { SignedIdTokenPayload, TokenPurpose } from "../../../types/authTypes/TokenPayload";
import generateOTP from "../../utils/auth/generateOTP";
import hashPassword from "../../utils/auth/hashPassword";
import sendEmail from "../../utils/email";
import EmailData from "../../utils/email/types";
import getOtpEmail from "../../utils/email/emailBuilders/otpEmail";
import {
  otpExpirationInMinutes,
  otpRetryCooldownInSeconds,
} from "../../../data/serverConfig/server-config";
import claimEmailSlot from "../../utils/auth/claimEmailSlot";
import getTokenSecret from "../../utils/auth/getTokenSecret";
import hashToken from "../../utils/auth/hashToken";
import findUserByEmailOrUsername from "../../utils/auth/findUserByEmailOrUsername";
import {
  logEmailRequestError,
  respondEmailRequestAccepted,
} from "../../utils/respondEmailRequestAccepted";

const requestOtp = async (req: Request, res: Response) => {
  const { email } = req.body; // Grab the email (or username) left in the body by the request validator.

  // Answer right away with the same response whatever happens below (see respondEmailRequestAccepted).
  respondEmailRequestAccepted(res);

  try {
    const foundUser = await findUserByEmailOrUsername(email); // Get the user from the database by email or username.

    // Silently do nothing if no user matches, it's disabled, or it's still pending activation
    // (login would refuse it anyway).
    if (!foundUser || foundUser.isDisabled || !foundUser.activatedAt) {
      return;
    }

    // Throttle repeated OTP requests for the same account.
    const isSlotClaimed = await claimEmailSlot(
      foundUser._id,
      "credentials.otpLastSentAt",
      otpRetryCooldownInSeconds,
    );

    if (!isSlotClaimed) {
      return;
    }

    const otp = generateOTP(); // Generate the plaintext OTP.
    const hashedOtp = await hashPassword(otp); // Hash it the same way passwords are hashed.

    // Create the "wasn't you?" revoke token Payload.
    const revokeTokenData: SignedIdTokenPayload = {
      purpose: TokenPurpose.otpRevoke,
      id: foundUser.id,
    };

    // Create the revoke token with the created payload. It expires together with the OTP, after
    // that there's nothing left to revoke.
    const otpRevokeToken = jwt.sign(revokeTokenData, getTokenSecret(), {
      expiresIn: `${otpExpirationInMinutes}m`,
    });

    // Create the emailData object for the mail function.
    const emailData: EmailData = {
      html: getOtpEmail(otp, otpRevokeToken),
      internalEmailName: "OTP email",
      subject: "Your one-time password",
      to: foundUser.credentials.email,
    };

    // Send the email with the plaintext OTP BEFORE storing it: if it fails (it throws), a
    // previously sent OTP stays usable instead of being replaced by one nobody received.
    await sendEmail(emailData);

    // Store the hashed OTP, its expiration, a fresh attempt counter and the hashed revoke token, and save the user back to the DB.
    foundUser.credentials.otpPassword = hashedOtp;
    foundUser.credentials.otpExpiresAt = new Date(Date.now() + otpExpirationInMinutes * 60 * 1000);
    foundUser.credentials.otpAttempts = 0;
    foundUser.otpRevokeToken = hashToken(otpRevokeToken);
    await foundUser.save();
  } catch (error) {
    logEmailRequestError("OTP request", error);
  }
};

export default requestOtp;
