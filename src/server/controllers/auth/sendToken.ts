import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import TokenPayload, { TokenPurpose } from "../../../types/authTypes/TokenPayload";
import {
  userSessionDurationInHours,
  userSessionRefreshInHours,
} from "../../../data/serverConfig/server-config";
import getTokenSecret from "../../utils/auth/getTokenSecret";

const sendToken = (req: Request, res: Response, next: NextFunction) => {
  const { userId, tokenVersion, authTime, sessionId } = res.locals; // Grab the session data from the res.locals object

  // Create the new token payload. authTime and sessionId are only left in res.locals by the
  // tokenValidator (refresh, change password), which keeps them - after a real login they're
  // missing, so this is a new session starting now.
  const tokenData: TokenPayload = {
    purpose: TokenPurpose.session,
    id: userId,
    tokenVersion,
    sessionId: sessionId ?? randomUUID(),
    authTime: authTime ?? Math.floor(Date.now() / 1000),
    tokenRefreshTime: userSessionRefreshInHours,
  };

  try {
    // Create the token with the created payload
    const newToken = jwt.sign(tokenData, getTokenSecret(), {
      expiresIn: `${userSessionDurationInHours}h`,
    });

    res.json({ token: newToken }); // send the token as the response
  } catch (error) {
    next(error); // If the jwt.sign breaks call next
  }
};

export default sendToken;
