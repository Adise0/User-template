import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import Users from "../../../database/models/Users";
import LoginData from "../../../types/authTypes/loginData";
import {
  getInvalidPasswordError,
  getUserNotFoundForUsernameOrEmailError,
} from "../../../data/errorObjects/userErrors";
import { otpMaxAttempts, saltRounds } from "../../../data/serverConfig/server-config";
import findUserByEmailOrUsername from "../../utils/auth/findUserByEmailOrUsername";
import clearOtp from "../../utils/auth/clearOtp";
import admitToLogin from "../../utils/auth/admitToLogin";

// Hash of a random string nobody knows. When there's no real hash to compare against (unknown
// user, no password set), the password is still compared against this one so the response takes
// as long as a real check - otherwise the timing alone would tell which accounts exist.
// It's generated at startup so it always has the same cost as the real hashes.
// eslint-disable-next-line n/no-sync
const dummyPasswordHash = bcrypt.hashSync(randomUUID(), saltRounds);

const login = async (req: Request, res: Response, next: NextFunction) => {
  const loginData: LoginData = req.body; // Grab the login data left in the body by the request validator.

  try {
    const foundUser = await findUserByEmailOrUsername(loginData.email); // Get the user from the database by email or username.

    // If no user matches the email or username burn the same time a real check would, write the error and go next.
    if (!foundUser) {
      await bcrypt.compare(loginData.password, dummyPasswordHash);
      const userNotFoundForEmailError = getUserNotFoundForUsernameOrEmailError(loginData.email);
      next(userNotFoundForEmailError);
      return;
    }

    const invalidPasswordError = getInvalidPasswordError(foundUser.id); // Write the invalid password error.

    if (loginData.withOtp) {
      const { otpPassword, otpExpiresAt } = foundUser.credentials;

      // If the DB user has no OTP, or it has expired, go next with the invalid password error written previously.
      if (!otpPassword || !otpExpiresAt || otpExpiresAt.getTime() < Date.now()) {
        await bcrypt.compare(loginData.password, dummyPasswordHash);
        next(invalidPasswordError);
        return;
      }

      // Atomically reserve one attempt BEFORE checking the code, so a burst of parallel guesses
      // can't all slip in before the counter catches up.
      const reservedAttempt = await Users.findOneAndUpdate(
        {
          _id: foundUser.id,
          "credentials.otpAttempts": { $lt: otpMaxAttempts },
        },
        { $inc: { "credentials.otpAttempts": 1 } },
      );

      // Out of attempts: wipe the OTP so it can't be guessed any further, the user has to request a new one.
      if (!reservedAttempt) {
        clearOtp(foundUser);
        await foundUser.save();
        next(invalidPasswordError);
        return;
      }

      // Check if the OTP is valid.
      const isPasswordValid = await bcrypt.compare(loginData.password.toUpperCase(), otpPassword);

      // If the password is invalid go next with the invalid password error written previously.
      if (!isPasswordValid) {
        next(invalidPasswordError);
        return;
      }

      // Consume the OTP in one atomic step that only matches while it's still stored: if two
      // requests with the right code race, only the first one gets a session.
      const consumedOtp = await Users.updateOne(
        { _id: foundUser._id, "credentials.otpPassword": otpPassword },
        {
          $unset: {
            "credentials.otpPassword": "",
            "credentials.otpExpiresAt": "",
            otpRevokeToken: "",
          },
          $set: { "credentials.otpAttempts": 0 },
        },
      );

      if (consumedOtp.modifiedCount === 0) {
        next(invalidPasswordError);
        return;
      }
    } else {
      // Check if the password is valid (against the dummy hash if the DB user has none, to keep the timing the same).
      const isPasswordValid = await bcrypt.compare(
        loginData.password.toString(),
        foundUser.credentials.password || dummyPasswordHash,
      );

      // If the password is invalid (or the DB user doesn't have one) go next with the invalid password error written previously.
      if (!foundUser.credentials.password || !isPasswordValid) {
        next(invalidPasswordError);
        return;
      }
    }

    // Only once the credentials are proven is it safe to reveal anything about the account's state.
    const loginError = await admitToLogin(foundUser, res);

    if (loginError) {
      next(loginError);
      return;
    }

    next();
  } catch (error) {
    next(error); // If anything throws and error, pass it on to the next function.
  }
};

export default login;
