import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  getInvalidTokenError,
  getNoAuthHeaderError,
} from "../../../data/errorObjects/authErrors";
import TokenPayload from "../../../types/authTypes/TokenPayload";

const tokenValidator = (req: Request, res: Response, next: NextFunction) => {
  const headerAuth = req.header("Authorization"); // Grab the request Authorization header

  // If no Authorization header is found, write an error and go next.
  if (!headerAuth) {
    const noAuthHeaderError = getNoAuthHeaderError();
    next(noAuthHeaderError);
    return;
  }

  // Grab the actual token from the header
  const token = headerAuth.replace("Bearer ", "");

  try {
    const tokenPayload = jwt.verify(token, process.env.TOKEN_SECRET); // Verify the token
    const realTokenPayload = tokenPayload as TokenPayload; // Extract the token payload

    res.locals.userId = realTokenPayload.id; // Add the userId from the payload to the res.locals object

    next(); // go next.
  } catch (error) {
    // If the validation does not pass write the error and go next.
    const invalidTokenError = getInvalidTokenError();
    next(invalidTokenError);
  }
};

export default tokenValidator;
