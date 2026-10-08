import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import Users from "../../../database/models/Users";
import LoginData from "../../../types/authTypes/loginData";
import {
  getInvalidPasswordError,
  getNotYetActivatedError,
  getUserDisabledError,
  getUserNotFoundForUsernameOrEmailError,
} from "../../../data/errorObjects/userErrors";

import DatabaseUserData from "../../../types/userTypes/DatabaseUserData";

const login = async (req: Request, res: Response, next: NextFunction) => {
  const loginData: LoginData = req.body; // Grab the login data left in the body by the request validator.

  try {
    let foundUser: DatabaseUserData | null = null;

    foundUser = await Users.findOne({
      "credentials.email": loginData.email,
    }); // Get the user from the database by email.

    // If no user matches the email check if one matches the username
    if (!foundUser) {
      foundUser = await Users.findOne({
        "credentials.username": loginData.email,
      }); // Get the user from the database by email.
    }

    // If no user matches the email or username write the error and go next.
    if (!foundUser) {
      const userNotFoundForEmailError = getUserNotFoundForUsernameOrEmailError(
        loginData.email
      );
      next(userNotFoundForEmailError);
      return;
    }

    // If the user is disabled write the error and go next.
    if (foundUser.isDisabled) {
      const userDisabledError = getUserDisabledError(foundUser.id);
      next(userDisabledError);
      return;
    }

    const invalidPasswordError = getInvalidPasswordError(foundUser.id); // Write the invalid password error.

    if (loginData.withOtp) {
      // If the request is made with OTP and the DB user does not have one go next with the invalid password error written previously.
      if (!foundUser.credentials.otpPassword) {
        next(invalidPasswordError);
        return;
      }

      // Check if the OTP is valid.
      const isPasswordValid = await bcrypt.compare(
        loginData.password,
        foundUser.credentials.otpPassword
      );

      // If the password is invalid go next with the invalid password error written previously.
      if (!isPasswordValid) {
        next(invalidPasswordError);
        return;
      }

      // If the password is valid erase the OTP (since it's, well, One time) and save the user back to the DB with the erases OTP.
      foundUser.credentials.otpPassword = "";
      foundUser.save();
    } else {
      // If the  DB user does not have a password go next with the invalid password error written previously.
      if (!foundUser.credentials.password) {
        next(invalidPasswordError);
        return;
      }

      // Check if the password is valid.
      const isPasswordValid = await bcrypt.compare(
        loginData.password.toString(),
        foundUser.credentials.password
      );

      // If the  DB user does not have a password go next with the invalid password error written previously.
      if (!isPasswordValid) {
        next(invalidPasswordError);
        return;
      }
    }

    // If the login is correct but the user is not yet activated write the error and go next
    if (foundUser.verificationToken) {
      const notActiveError = getNotYetActivatedError(foundUser.id);
      next(notActiveError);
      return;
    }

    // If every check has passed write the user id in the res.locals object and go next.
    res.locals.userId = foundUser.id;

    next();
  } catch (error) {
    next(error); // If anything throws and error, pass it on to the next function.
  }
};

export default login;
