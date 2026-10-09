import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Users from "../../../database/models/Users";
import {
  getInvalidTokenError,
  getNoAuthHeaderError,
} from "../../../data/errorObjects/authErrors";
import { getUserDisabledError } from "../../../data/errorObjects/userErrors";
import TokenPayload from "../../../types/authTypes/TokenPayload";

const tokenValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const headerAuth = req.header("Authorization"); // Grab the request Authorization header

  // If no Authorization header is found, write an error and go next.
  if (!headerAuth) {
    const noAuthHeaderError = getNoAuthHeaderError();
    next(noAuthHeaderError);
    return;
  }

  // Grab the actual token from the header
  const token = headerAuth.replace("Bearer ", "");

  let realTokenPayload: TokenPayload;

  try {
    const tokenPayload = jwt.verify(token, process.env.TOKEN_SECRET); // Verify the token
    realTokenPayload = tokenPayload as TokenPayload; // Extract the token payload
  } catch (error) {
    // If the validation does not pass write the error and go next.
    const invalidTokenError = getInvalidTokenError();
    next(invalidTokenError);
    return;
  }

  try {
    // A valid signature isn't enough on its own: the session must also still be current for the user.
    const foundUser = await Users.findById(realTokenPayload.id).select(
      "tokenVersion isDisabled"
    );

    // If the user no longer exists, or the token was issued before the user's sessions were
    // revoked (eg. a password reset), the token is no longer valid.
    if (!foundUser || foundUser.tokenVersion !== realTokenPayload.tokenVersion) {
      const invalidTokenError = getInvalidTokenError();
      next(invalidTokenError);
      return;
    }

    // If the user has been disabled since the token was issued write the error and go next.
    if (foundUser.isDisabled) {
      const userDisabledError = getUserDisabledError(foundUser.id);
      next(userDisabledError);
      return;
    }

    // Add the userId and tokenVersion to the res.locals object (sendToken uses both on refresh).
    res.locals.userId = foundUser.id;
    res.locals.tokenVersion = foundUser.tokenVersion;

    next(); // go next.
  } catch (error) {
    next(error);
  }
};

export default tokenValidator;
