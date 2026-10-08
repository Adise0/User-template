import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Users from "../../../database/models/Users";
import DatabaseUserData from "../../../types/userTypes/DatabaseUserData";
import { SignedIdTokenPayload } from "../../../types/authTypes/TokenPayload";
import {
  getUserDisabledError,
  getUserNotFoundForUsernameOrEmailError,
} from "../../../data/errorObjects/userErrors";
import generateOTP from "../../utils/auth/generateOTP";
import hashPassword from "../../utils/auth/hashPassword";
import sendEmail from "../../utils/email";
import EmailData from "../../utils/email/types";
import getOtpEmail from "../../utils/email/emailBuilders/otpEmail";
import { otpRevokeExpirationInHours } from "../../../data/serverConfig/server-config";

const requestOtp = async (req: Request, res: Response, next: NextFunction) => {
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
      const userNotFoundError =
        getUserNotFoundForUsernameOrEmailError(email);
      next(userNotFoundError);
      return;
    }

    // If the user is disabled write the error and go next.
    if (foundUser.isDisabled) {
      const userDisabledError = getUserDisabledError(foundUser.id);
      next(userDisabledError);
      return;
    }

    const otp = generateOTP(); // Generate the plaintext OTP.
    const hashedOtp = await hashPassword(otp); // Hash it the same way passwords are hashed.

    // Create the "wasn't you?" revoke token Payload.
    const revokeTokenData: SignedIdTokenPayload = {
      id: foundUser.id,
    };

    // Create the revoke token with the created payload.
    const otpRevokeToken = jwt.sign(revokeTokenData, process.env.TOKEN_SECRET, {
      expiresIn: `${otpRevokeExpirationInHours}h`,
    });

    // Create the emailData object for the mail function.
    const emailData: EmailData = {
      html: getOtpEmail(otp, otpRevokeToken),
      internalEmailName: "OTP email",
      subject: "Your one-time password",
      to: foundUser.credentials.email,
    };

    try {
      // Send the email with the plaintext OTP.
      await sendEmail(emailData);
    } catch {
      // TODO: ADD SOME SORT OF BACKLOG FOR EMAIL RE-TRY
    }

    // Store the hashed OTP and the raw revoke token, and save the user back to the DB.
    foundUser.credentials.otpPassword = hashedOtp;
    foundUser.otpRevokeToken = otpRevokeToken;
    await foundUser.save();

    res.status(200).json({
      message: "OTP sent",
    });
  } catch (error) {
    next(error);
  }
};

export default requestOtp;
