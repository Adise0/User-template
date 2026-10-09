import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import TokenPayload from "../../../types/authTypes/TokenPayload";
import {
  userSessionDurationInHours,
  userSessionRefreshInHours,
} from "../../../data/serverConfig/server-config";

const sendToken = (req: Request, res: Response, next: NextFunction) => {
  const { userId, tokenVersion } = res.locals; // Grab the userId and tokenVersion from the res.locals object

  // Create the new token payload
  const tokenData: TokenPayload = {
    id: userId,
    tokenVersion,
    tokenRefreshTime: userSessionRefreshInHours,
  };

  try {
    // Create the token with the created payload
    // const newToken = jwt.sign(tokenData, process.env.TOKEN_SECRET);
    const newToken = jwt.sign(tokenData, process.env.TOKEN_SECRET, {
      expiresIn: `${userSessionDurationInHours}h`,
    });


    res.json({ token: newToken }); // send the token as the response
  } catch (error) {
    next(error); // If the jwt.sing breaks call next
  }
};

export default sendToken;
