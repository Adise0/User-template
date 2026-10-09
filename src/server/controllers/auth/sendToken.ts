import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import TokenPayload, { TokenPurpose } from "../../../types/authTypes/TokenPayload";
import {
  userSessionDurationInHours,
  userSessionRefreshInHours,
} from "../../../data/serverConfig/server-config";

const sendToken = (req: Request, res: Response, next: NextFunction) => {
  const { userId, tokenVersion, authTime } = res.locals; // Grab the userId, tokenVersion and authTime from the res.locals object

  // Create the new token payload. authTime is only left in res.locals by the tokenValidator (refresh,
  // change password), which keeps the original login time - after a real login it's missing, so it's now.
  const tokenData: TokenPayload = {
    purpose: TokenPurpose.session,
    id: userId,
    tokenVersion,
    authTime: authTime ?? Math.floor(Date.now() / 1000),
    tokenRefreshTime: userSessionRefreshInHours,
  };

  try {
    // Create the token with the created payload
    const newToken = jwt.sign(tokenData, process.env.TOKEN_SECRET, {
      expiresIn: `${userSessionDurationInHours}h`,
    });

    res.json({ token: newToken }); // send the token as the response
  } catch (error) {
    next(error); // If the jwt.sing breaks call next
  }
};

export default sendToken;
