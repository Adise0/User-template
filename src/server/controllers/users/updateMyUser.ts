import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import { getUserNotFoundForIdError } from "../../../data/errorObjects/userErrors";
import {
  getDuplicateKeyErrorFromMongoError,
  isDuplicateKeyMongoError,
} from "../../utils/duplicateKeyMongoError";
import applyProfileChanges from "../../utils/users/applyProfileChanges";

// Edits the logged in user's profile. Email isn't here on purpose, it has to go through the email
// change flow, which verifies the new address.
const updateMyUser = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals; // Grab the userId left by the tokenValidator.

  try {
    const foundUser = await Users.findById(userId);

    // If no user matches the token's id write the error and go next.
    if (!foundUser) {
      next(getUserNotFoundForIdError(userId));
      return;
    }

    applyProfileChanges(foundUser, req.body);
    await foundUser.save();

    res.json({ id: foundUser.id, information: foundUser.information });
  } catch (error) {
    // The unique index is what catches a username that's already taken.
    if (isDuplicateKeyMongoError(error)) {
      next(getDuplicateKeyErrorFromMongoError(error));
      return;
    }

    next(error);
  }
};

export default updateMyUser;
