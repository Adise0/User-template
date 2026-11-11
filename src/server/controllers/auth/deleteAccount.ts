import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import { getUserNotFoundForIdError } from "../../../data/errorObjects/userErrors";
import { accountDeletionGraceInDays } from "../../../data/serverConfig/server-config";
import sendSecurityNotice from "../../utils/email/sendSecurityNotice";

// Deletes the logged in user's account. Only reachable through a fresh session (tokenValidator +
// freshAuthValidator). With a grace period (accountDeletionGraceInDays) the account is only
// scheduled for deletion: every session is ended, logging back in before the date cancels it, and
// MongoDB removes the account once the date passes. Without one it's deleted right away.
const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals; // Grab the userId left by the tokenValidator.

  try {
    if (accountDeletionGraceInDays === null) {
      const deletedUser = await Users.findByIdAndDelete(userId);

      // If no user matches the token's id write the error and go next.
      if (!deletedUser) {
        next(getUserNotFoundForIdError(userId));
        return;
      }

      sendSecurityNotice(
        deletedUser.credentials.email,
        "Your account was deleted",
        "Your account and its data were permanently deleted. If this wasn't you, contact support right away.",
      );

      res.status(200).json({
        message: "Account deleted",
      });
      return;
    }

    const scheduledDeletionAt = new Date(
      Date.now() + accountDeletionGraceInDays * 24 * 60 * 60 * 1000,
    );

    // Bumping the tokenVersion signs out every session, this one included. A pending email change is
    // dropped too, it would make no sense to confirm it on an account that's going away.
    const scheduledUser = await Users.findByIdAndUpdate(userId, {
      $set: { scheduledDeletionAt },
      $inc: { tokenVersion: 1 },
      $unset: { pendingEmail: "", emailChangeToken: "" },
    });

    // If no user matches the token's id write the error and go next.
    if (!scheduledUser) {
      next(getUserNotFoundForIdError(userId));
      return;
    }

    sendSecurityNotice(
      scheduledUser.credentials.email,
      "Your account will be deleted",
      `Your account will be permanently deleted on ${scheduledDeletionAt.toUTCString()}, and you've been signed out everywhere. Changed your mind? Log in before then and the deletion is cancelled. If this wasn't you, log in and reset your password right away.`,
    );

    res.status(200).json({
      message: "Account scheduled for deletion",
      scheduledDeletionAt,
    });
  } catch (error) {
    next(error);
  }
};

export default deleteAccount;
