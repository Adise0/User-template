import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getInvalidOrExpiredTokenError } from "../../../data/errorObjects/authErrors";
import { SignedIdTokenPayload } from "../../../types/authTypes/TokenPayload";
import getTokenSecret, { tokenAlgorithm } from "../../utils/auth/getTokenSecret";

// Shared by every endpoint that takes a single signed link token in the body
// (activate, cancelRegistration, revokeOtp, ...). It verifies the JWT signature, checks the token
// was issued for the expected purpose and extracts the user id. Callers are still responsible for
// comparing the hashed token against whichever stored value protects their specific action
// (eg. verificationToken, otpRevokeToken).
const signedIdTokenValidator =
  (purpose: SignedIdTokenPayload["purpose"]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.body; // Grab the token left in the body by the request validator.

    try {
      const tokenPayload = jwt.verify(token, getTokenSecret(), { algorithms: [tokenAlgorithm] }); // Verify the token
      const realTokenPayload = tokenPayload as SignedIdTokenPayload; // Extract the token payload

      // A token issued for something else (another kind of link, or a session) is not valid here.
      if (realTokenPayload.purpose !== purpose) {
        const invalidOrExpiredTokenError = getInvalidOrExpiredTokenError();
        next(invalidOrExpiredTokenError);
        return;
      }

      // Add the userId from the payload and the raw token to the res.locals object
      res.locals.userId = realTokenPayload.id;
      res.locals.token = token;

      next(); // go next.
    } catch {
      // If the validation does not pass write the error and go next.
      const invalidOrExpiredTokenError = getInvalidOrExpiredTokenError();
      next(invalidOrExpiredTokenError);
    }
  };

export default signedIdTokenValidator;
