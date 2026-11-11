import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  twoFactorAuthEnabled,
  twoFactorChallengeExpirationInMinutes,
} from "../../../data/serverConfig/server-config";
import Users from "../../../database/models/Users";
import {
  TokenPurpose,
  TwoFactorChallengeTokenPayload,
} from "../../../types/authTypes/TokenPayload";
import getTokenSecret from "../../utils/auth/getTokenSecret";

// Goes right before sendToken on every route that logs a user in (password, OTP, OAuth). Users
// without 2FA go straight on to their session. Users with it get a short-lived challenge token
// instead, which POST /auth/twoFactor/verify trades, with a code, for the session.
const twoFactorChallenge = async (req: Request, res: Response, next: NextFunction) => {
  if (!twoFactorAuthEnabled) {
    next();
    return;
  }

  const { userId } = res.locals; // Left by whatever proved the credentials.

  try {
    const challengeId = randomUUID();

    // Starting a challenge also resets the attempt counter, and makes any older challenge useless.
    const userWithTwoFactor = await Users.findOneAndUpdate(
      { _id: userId, "twoFactor.enabledAt": { $ne: null } },
      { $set: { "twoFactor.challengeId": challengeId, "twoFactor.challengeAttempts": 0 } },
    );

    if (!userWithTwoFactor) {
      next();
      return;
    }

    const challengeTokenData: TwoFactorChallengeTokenPayload = {
      purpose: TokenPurpose.twoFactorChallenge,
      id: userWithTwoFactor.id,
      challengeId,
    };

    const twoFactorToken = jwt.sign(challengeTokenData, getTokenSecret(), {
      expiresIn: `${twoFactorChallengeExpirationInMinutes}m`,
    });

    res.status(200).json({
      twoFactorRequired: true,
      twoFactorToken,
    });
  } catch (error) {
    next(error);
  }
};

export default twoFactorChallenge;
