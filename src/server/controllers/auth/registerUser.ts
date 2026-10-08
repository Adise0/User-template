import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Users from "../../../database/models/Users";
import { CreatedUserData } from "../../../types/userTypes/UserData";
import sendEmail from "../../utils/email";
import EmailData from "../../utils/email/types";
import { ActivationTokenPayload } from "../../../types/authTypes/TokenPayload";
import { userActivationExpirationInHours } from "../../../data/serverConfig/server-config";
import getUserActivationEmail from "../../utils/email/emailBuilders/userActivationEmail";

const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newUser: CreatedUserData = req.body; // Get the user data from the req.body

    const createdUser = await Users.create(newUser); // Create the user in the Database.

    // Create the activationToken Payload.
    const tokenData: ActivationTokenPayload = {
      id: createdUser.id,
    };

    // Create the token with the created payload.
    const verificationToken = jwt.sign(tokenData, process.env.TOKEN_SECRET, {
      expiresIn: `${userActivationExpirationInHours}h`,
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

      // eslint-disable-next-line no-empty
    } catch (e) {
      // TODO: ADD SOME SORT OF BACKLOG FOR EMAIL RE-TRY
    }

    // Add the verificationToken to the created user and save it.
    createdUser.verificationToken = verificationToken;
    createdUser.save();

    // If everything is correct send a correct response.
    res.status(201).json({
      message: "User registered sucessfully",
    });
  } catch (error) {
    // If that's not the error simply go next
    next(error);
  }
};

export default registerUser;
