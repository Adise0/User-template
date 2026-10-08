import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getInvalidOrExpiredTokenError } from "../../../data/errorObjects/authErrors";
import { SignedIdTokenPayload } from "../../../types/authTypes/TokenPayload";

// Shared by every endpoint that takes a single signed link token in the body
// (activate, cancelRegistration, revokeOtp, ...). It only verifies the JWT signature and
// extracts the user id - it has no opinion on what the token authorizes. Callers are
// responsible for comparing the raw token against whichever stored value protects their
// specific action (eg. verificationToken, otpRevokeToken).
const signedIdTokenValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { token } = req.body; // Grab the token left in the body by the request validator.

  try {
    const tokenPayload = jwt.verify(token, process.env.TOKEN_SECRET); // Verify the token
    const realTokenPayload = tokenPayload as SignedIdTokenPayload; // Extract the token payload

    // Add the userId from the payload and the raw token to the res.locals object
    res.locals.userId = realTokenPayload.id;
    res.locals.token = token;

    next(); // go next.
  } catch (error) {
    // If the validation does not pass write the error and go next.
    const invalidOrExpiredTokenError = getInvalidOrExpiredTokenError();
    next(invalidOrExpiredTokenError);
  }
};

export default signedIdTokenValidator;
