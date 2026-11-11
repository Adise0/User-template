import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Users from "../../../database/models/Users";
import { getInvalidTokenError, getNoAuthHeaderError } from "../../../data/errorObjects/authErrors";
import { getUserDisabledError } from "../../../data/errorObjects/userErrors";
import TokenPayload, { TokenPurpose } from "../../../types/authTypes/TokenPayload";
import { userSessionMaxAgeInHours } from "../../../data/serverConfig/server-config";
import getTokenSecret, { tokenAlgorithm } from "../../utils/auth/getTokenSecret";

const tokenValidator = async (req: Request, res: Response, next: NextFunction) => {
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
    const tokenPayload = jwt.verify(token, getTokenSecret(), { algorithms: [tokenAlgorithm] }); // Verify the token
    realTokenPayload = tokenPayload as TokenPayload; // Extract the token payload
  } catch {
    // If the validation does not pass write the error and go next.
    const invalidTokenError = getInvalidTokenError();
    next(invalidTokenError);
    return;
  }

  // Only session tokens open a session - email link tokens are signed with the same secret but
  // are never valid here.
  if (realTokenPayload.purpose !== TokenPurpose.session) {
    const invalidTokenError = getInvalidTokenError();
    next(invalidTokenError);
    return;
  }

  // If there's an overall session limit, refreshing can't keep a session alive past it.
  if (userSessionMaxAgeInHours !== null) {
    const secondsSinceAuth = Math.floor(Date.now() / 1000) - realTokenPayload.authTime;

    if (!realTokenPayload.authTime || secondsSinceAuth > userSessionMaxAgeInHours * 60 * 60) {
      const invalidTokenError = getInvalidTokenError();
      next(invalidTokenError);
      return;
    }
  }

  try {
    // A valid signature isn't enough on its own: the session must also still be current for the user.
    const foundUser = await Users.findById(realTokenPayload.id).select(
      "tokenVersion isDisabled role revokedSessions",
    );

    // If the user no longer exists, or the token was issued before the user's sessions were
    // revoked (eg. a password reset), the token is no longer valid.
    if (!foundUser || foundUser.tokenVersion !== realTokenPayload.tokenVersion) {
      const invalidTokenError = getInvalidTokenError();
      next(invalidTokenError);
      return;
    }

    // If this session was signed out on its own (or it's from before sessions had an id), the
    // token is no longer valid either.
    const isSessionRevoked = foundUser.revokedSessions.some(
      ({ sessionId }) => sessionId === realTokenPayload.sessionId,
    );

    if (!realTokenPayload.sessionId || isSessionRevoked) {
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

    // Add what comes with the session to the res.locals object (sendToken carries it over on
    // refresh, freshAuthValidator reads the authTime, roleValidator the role).
    res.locals.userId = foundUser.id;
    res.locals.tokenVersion = foundUser.tokenVersion;
    res.locals.authTime = realTokenPayload.authTime;
    res.locals.sessionId = realTokenPayload.sessionId;
    res.locals.role = foundUser.role;

    next(); // go next.
  } catch (error) {
    next(error);
  }
};

export default tokenValidator;
