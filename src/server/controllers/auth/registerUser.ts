import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Users from "../../../database/models/Users";
import { CreatedUserData } from "../../../types/userTypes/UserData";
import sendEmail from "../../utils/email";
import EmailData from "../../utils/email/types";
import { SignedIdTokenPayload } from "../../../types/authTypes/TokenPayload";
import { userActivationExpirationInMinutes } from "../../../data/serverConfig/server-config";
import getUserActivationEmail from "../../utils/email/emailBuilders/userActivationEmail";
import { getActivationEmailFailedError } from "../../../data/errorObjects/userErrors";

const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const newUser: CreatedUserData = req.body; // Get the user data from the req.body
  const session = await mongoose.startSession();

  try {
    // Wrap the user creation and the verification email in the same transaction:
    // if the email never goes out, the user is never left behind in the DB either.
    await session.withTransaction(async () => {
      const [createdUser] = await Users.create([newUser], { session }); // Create the user in the Database.

      // Create the activationToken Payload.
      const tokenData: SignedIdTokenPayload = {
        id: createdUser.id,
      };

      // Create the token with the created payload.
      const verificationToken = jwt.sign(tokenData, process.env.TOKEN_SECRET, {
        expiresIn: `${userActivationExpirationInMinutes}m`,
      });

      // Create the emailData object for the mail function.
      const emailData: EmailData = {
        html: getUserActivationEmail(verificationToken),
        internalEmailName: "User Activation email",
        subject: `Hey ${createdUser.information.username}! Activate your account!`,
        to: createdUser.information.email,
      };

      try {
        // Send the email.
        await sendEmail(emailData);
      } catch {
        // Throwing here aborts the transaction, rolling back the user creation.
        throw getActivationEmailFailedError();
      }

      // Add the verificationToken to the created user and save it.
      createdUser.verificationToken = verificationToken;
      await createdUser.save({ session });
    });

    // If everything is correct send a correct response.
    res.status(201).json({
      message: "User registered sucessfully",
    });
  } catch (error) {
    // If that's not the error simply go next
    next(error);
  } finally {
    await session.endSession();
  }
};

export default registerUser;
