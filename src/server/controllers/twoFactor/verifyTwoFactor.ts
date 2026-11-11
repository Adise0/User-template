import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getInvalidTokenError } from "../../../data/errorObjects/authErrors";
import { getTwoFactorInvalidCodeError } from "../../../data/errorObjects/twoFactorErrors";
import { twoFactorMaxAttempts } from "../../../data/serverConfig/server-config";
import Users from "../../../database/models/Users";
import {
  TokenPurpose,
  TwoFactorChallengeTokenPayload,
} from "../../../types/authTypes/TokenPayload";
import admitToLogin from "../../utils/auth/admitToLogin";
import getTokenSecret, { tokenAlgorithm } from "../../utils/auth/getTokenSecret";
import sendSecurityNotice from "../../utils/email/sendSecurityNotice";
import consumeTwoFactorCode from "../../utils/twoFactor/consumeTwoFactorCode";

// The second half of a login with 2FA: trades the challenge token the login answered, plus a code
// (authenticator or backup), for the session. Wrong codes are counted per challenge: past the
// limit, or once a newer login started another challenge, it answers INVALID_TOKEN and the user
// has to log in again.
const verifyTwoFactor = async (req: Request, res: Response, next: NextFunction) => {
  const { token, code } = req.body; // Grab what the request validator left in the body.

  let challenge: TwoFactorChallengeTokenPayload;

  try {
    challenge = jwt.verify(token, getTokenSecret(), {
      algorithms: [tokenAlgorithm],
    }) as TwoFactorChallengeTokenPayload;
  } catch {
    next(getInvalidTokenError());
    return;
  }

  if (challenge.purpose !== TokenPurpose.twoFactorChallenge) {
    next(getInvalidTokenError());
    return;
  }

  try {
    // Reserve one attempt atomically BEFORE checking the code, like the OTP login does.
    const foundUser = await Users.findOneAndUpdate(
      {
        _id: challenge.id,
        "twoFactor.challengeId": challenge.challengeId,
        "twoFactor.challengeAttempts": { $lt: twoFactorMaxAttempts },
      },
      { $inc: { "twoFactor.challengeAttempts": 1 } },
    );

    if (!foundUser) {
      next(getInvalidTokenError());
      return;
    }

    const codeKind = await consumeTwoFactorCode(foundUser, code);

    if (!codeKind) {
      next(getTwoFactorInvalidCodeError(foundUser.id));
      return;
    }

    // The challenge is done with, it can't be used for a second session.
    await Users.updateOne(
      { _id: foundUser._id },
      { $unset: { "twoFactor.challengeId": "" }, $set: { "twoFactor.challengeAttempts": 0 } },
    );

    if (codeKind === "backup") {
      const backupCodesLeft = foundUser.twoFactor.backupCodes.length - 1;

      sendSecurityNotice(
        foundUser.credentials.email,
        "A backup code was used",
        `A backup code was used to log in to your account, ${backupCodesLeft} left. If this wasn't you, reset your password and get new backup codes right away.`,
      );
    }

    // The account may have changed in the minutes since the password was checked (eg. disabled).
    const loginError = await admitToLogin(foundUser, res);

    if (loginError) {
      next(loginError);
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default verifyTwoFactor;
