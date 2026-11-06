import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import Users from "../../../database/models/Users";
import { CreatedUserData } from "../../../types/userTypes/UserData";
import sendEmail from "../../utils/email";
import EmailData from "../../utils/email/types";
import { SignedIdTokenPayload, TokenPurpose } from "../../../types/authTypes/TokenPayload";
import {
  pendingAccountRetentionInHours,
  userActivationExpirationInMinutes,
} from "../../../data/serverConfig/server-config";
import getUserActivationEmail from "../../utils/email/emailBuilders/userActivationEmail";
import { getActivationEmailFailedError } from "../../../data/errorObjects/userErrors";
import getTokenSecret from "../../utils/auth/getTokenSecret";
import hashToken from "../../utils/auth/hashToken";
import {
  getDuplicateKeyErrorFromMongoError,
  isDuplicateKeyMongoError,
} from "../../utils/duplicateKeyMongoError";

const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  const newUser: CreatedUserData = req.body; // Get the user data from the req.body

  try {
    // The id is generated up front so the token can be signed before the user exists, which lets
    // the user and its token go into the database in one single (atomic) write.
    const userId = new Types.ObjectId();

    // Create the activationToken Payload.
    const tokenData: SignedIdTokenPayload = {
      purpose: TokenPurpose.activation,
      id: userId.toString(),
    };

    // Create the token with the created payload.
    const verificationToken = jwt.sign(tokenData, getTokenSecret(), {
      expiresIn: `${userActivationExpirationInMinutes}m`,
    });

    // Create the user in the Database.
    const createdUser = await Users.create({
      ...newUser,
      _id: userId,
      verificationToken: hashToken(verificationToken),
      activationLastSentAt: new Date(),
      pendingExpiresAt: new Date(Date.now() + pendingAccountRetentionInHours * 60 * 60 * 1000),
    });

    // Create the emailData object for the mail function.
    const emailData: EmailData = {
      html: getUserActivationEmail(verificationToken),
      internalEmailName: "User Activation email",
      subject: `Hey ${createdUser.information.username}! Activate your account!`,
      to: createdUser.credentials.email,
    };

    try {
      // Send the email.
      await sendEmail(emailData);
    } catch {
      // If the email never goes out, the user isn't left behind in the DB either. Should this
      // delete never run (eg. a crash), a retry with the same email replaces the pending account,
      // and pendingExpiresAt cleans it up otherwise - so an email can't get locked out.
      await Users.deleteOne({ _id: userId });
      next(getActivationEmailFailedError());
      return;
    }

    // If everything is correct send a correct response.
    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    // Two registrations racing for the same keys both pass the conflict check, the unique index
    // is what stops the second one.
    if (isDuplicateKeyMongoError(error)) {
      next(getDuplicateKeyErrorFromMongoError(error));
      return;
    }

    // If that's not the error simply go next
    next(error);
  }
};

export default registerUser;
