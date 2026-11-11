import { NextFunction, Request, Response } from "express";
import { getReauthRequiredError } from "../../../data/errorObjects/authErrors";
import { freshAuthMaxAgeInMinutes } from "../../../data/serverConfig/server-config";

// Goes right after tokenValidator on sensitive actions (change password, delete account). A valid
// session isn't enough there: the user must have actually logged in recently. authTime is carried
// over unchanged on refresh, so a session kept alive by refreshing alone doesn't count as fresh -
// the frontend has to send the user through the login again.
const freshAuthValidator = (req: Request, res: Response, next: NextFunction) => {
  const { userId, authTime } = res.locals; // Grab what the tokenValidator left from the token.

  const secondsSinceAuth = Math.floor(Date.now() / 1000) - authTime;

  if (!authTime || secondsSinceAuth > freshAuthMaxAgeInMinutes * 60) {
    const reauthRequiredError = getReauthRequiredError(userId);
    next(reauthRequiredError);
    return;
  }

  next();
};

export default freshAuthValidator;
