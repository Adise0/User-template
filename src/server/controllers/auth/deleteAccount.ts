import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import { getUserNotFoundForIdError } from "../../../data/errorObjects/userErrors";

// Permanently deletes the logged in user's account. Only reachable through a fresh session
// (tokenValidator + freshAuthValidator). Every session dies with it, since tokenValidator rejects
// tokens whose user no longer exists.
const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals; // Grab the userId left by the tokenValidator.

  try {
    const deletedUser = await Users.findByIdAndDelete(userId);

    // If no user matches the token's id write the error and go next.
    if (!deletedUser) {
      const notFoundForIdError = getUserNotFoundForIdError(userId);
      next(notFoundForIdError);
      return;
    }

    res.status(200).json({
      message: "Account deleted",
    });
  } catch (error) {
    next(error);
  }
};

export default deleteAccount;
