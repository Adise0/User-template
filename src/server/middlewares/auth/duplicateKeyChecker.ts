import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import {
  DuplicatedKeys,
  getDuplicateKeyRegistrationError,
} from "../../../data/errorObjects/userErrors";

const duplicateKeyChecker = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, username, goNext } = res.locals; // Get the keys from the res.locals

    const usersWithKeysFound = await Users.find({
      $or: [
        { "information.email": email || "" },
        { "information.username": username || "" },
      ],
    });

    if (usersWithKeysFound.length) {
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

      const duplicatedKeysError =
        getDuplicateKeyRegistrationError(duplicatedKeys);
      next(duplicatedKeysError);
      return;
    }
    if (goNext) {
      next();
      return;
    }

    res.json({
      message: "No conflicts",
    });
  } catch (error) {
    // If that's not the error simply go next
    next(error);
  }
};

export default duplicateKeyChecker;
