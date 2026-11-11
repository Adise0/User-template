import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getInvalidOrExpiredTokenError } from "../../../data/errorObjects/authErrors";
import {
  getOAuthAlreadyLinkedError,
  getOAuthEmailInUseError,
} from "../../../data/errorObjects/oauthErrors";
import { getDuplicateKeyRegistrationError } from "../../../data/errorObjects/userErrors";
import Users from "../../../database/models/Users";
import { OAuthSignupTokenPayload, TokenPurpose } from "../../../types/authTypes/TokenPayload";
import getRegistrationConflict from "../../utils/auth/getRegistrationConflict";
import getTokenSecret, { tokenAlgorithm } from "../../utils/auth/getTokenSecret";
import {
  getDuplicateKeyErrorFromMongoError,
  isDuplicateKeyMongoError,
} from "../../utils/duplicateKeyMongoError";

// Creates the account of a first-time OAuth user once they've picked a username, and logs them in.
// The account is active straight away: the provider already verified the email.
const completeOAuthSignup = async (req: Request, res: Response, next: NextFunction) => {
  const { token, username, firstName, lastName } = req.body;

  let signup: OAuthSignupTokenPayload;

  try {
    signup = jwt.verify(token, getTokenSecret(), {
      algorithms: [tokenAlgorithm],
    }) as OAuthSignupTokenPayload;
  } catch {
    next(getInvalidOrExpiredTokenError());
    return;
  }

  if (signup.purpose !== TokenPurpose.oauthSignup) {
    next(getInvalidOrExpiredTokenError());
    return;
  }

  try {
    const normalizedUsername = username.toLowerCase();
    const { duplicatedKeys, replaceableUsers } = await getRegistrationConflict(
      signup.email,
      normalizedUsername,
    );

    // The email got an active account since the signup token was issued.
    if (duplicatedKeys.email) {
      next(getOAuthEmailInUseError(signup.provider));
      return;
    }

    if (duplicatedKeys.username) {
      next(getDuplicateKeyRegistrationError({ email: false, username: true }));
      return;
    }

    // Pending signups in the way go, like on /register. No cooldown here: the email is proven.
    await Users.deleteMany({ _id: { $in: replaceableUsers.map((user) => user._id) } });

    const createdUser = await Users.create({
      information: {
        email: signup.email,
        username,
        firstName: firstName ?? signup.firstName,
        lastName: lastName ?? signup.lastName,
      },
      credentials: {
        email: signup.email,
        username: normalizedUsername,
      },
      activatedAt: new Date(),
      oauthAccounts: [
        {
          provider: signup.provider,
          providerId: signup.providerId,
          email: signup.email,
          linkedAt: new Date(),
        },
      ],
    });

    res.locals.userId = createdUser.id;
    res.locals.tokenVersion = createdUser.tokenVersion;

    next();
  } catch (error) {
    // Racing another request: the unique indexes have the last word.
    if (isDuplicateKeyMongoError(error)) {
      const isProviderTaken = Boolean(error.keyPattern?.["oauthAccounts.providerId"]);

      next(
        isProviderTaken
          ? getOAuthAlreadyLinkedError(signup.provider)
          : getDuplicateKeyErrorFromMongoError(error),
      );
      return;
    }

    next(error);
  }
};

export default completeOAuthSignup;
