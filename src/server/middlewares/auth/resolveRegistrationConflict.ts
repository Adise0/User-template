import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import {
  DuplicatedKeys,
  getDuplicateKeyRegistrationError,
  getPendingRegistrationCooldownError,
} from "../../../data/errorObjects/userErrors";
import { registrationRetryCooldownInSeconds } from "../../../data/serverConfig/server-config";
import getTokenAgeInSeconds from "../../utils/auth/getTokenAgeInSeconds";

// Runs only in the register chain (checkKeys keeps using the plain duplicateKeyChecker, which
// never mutates anything). If the only account blocking this registration is a single, still-
// pending (unactivated) one, treat this as the same person retrying an abandoned signup: once
// the cooldown has passed since that pending account's activation email went out, silently drop
// it and let the new registration through. Anything else (an already-active account, or two
// different accounts each holding one of the requested keys) is a genuine conflict and still
// hard-fails.
const resolveRegistrationConflict = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, username } = res.locals; // Get the keys from the res.locals

  try {
    const usersWithKeysFound = await Users.find({
      $or: [
        { "information.email": email || "" },
        { "information.username": username || "" },
      ],
    });

    if (!usersWithKeysFound.length) {
      next();
      return;
    }

    const [firstMatch] = usersWithKeysFound;
    const isSingleAccount = usersWithKeysFound.every(
      (userFound) => userFound.id === firstMatch.id
    );

    if (isSingleAccount && firstMatch.verificationToken) {
      const secondsSincePending = getTokenAgeInSeconds(
        firstMatch.verificationToken
      );

      if (secondsSincePending < registrationRetryCooldownInSeconds) {
        const secondsRemaining =
          registrationRetryCooldownInSeconds - secondsSincePending;
        next(getPendingRegistrationCooldownError(secondsRemaining));
        return;
      }

      // Enough time has passed (or the old token is already expired) - drop the stale pending
      // account and let the new registration take its place.
      await firstMatch.deleteOne();
      next();
      return;
    }

    // Genuine conflict: either multiple distinct accounts matched, or the matched account is
    // already active.
    const duplicatedKeys: DuplicatedKeys = {
      email: false,
      username: false,
    };

    usersWithKeysFound.forEach((userFound) => {
      if (userFound.information.email === email) {
        duplicatedKeys.email = true;
      }
      if (userFound.information.username === username) {
        duplicatedKeys.username = true;
      }
    });

    next(getDuplicateKeyRegistrationError(duplicatedKeys));
  } catch (error) {
    next(error);
  }
};

export default resolveRegistrationConflict;
