import { Request, Response } from "express";
import { passwordResetRetryCooldownInSeconds } from "../../../data/serverConfig/server-config";
import claimEmailSlot from "../../utils/auth/claimEmailSlot";
import findUserByEmailOrUsername from "../../utils/auth/findUserByEmailOrUsername";
import sendPasswordResetEmail from "../../utils/auth/sendPasswordResetEmail";
import {
  logEmailRequestError,
  respondEmailRequestAccepted,
} from "../../utils/respondEmailRequestAccepted";

const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body; // Grab the email (or username) left in the body by the request validator.

  // Answer right away with the same response whatever happens below (see respondEmailRequestAccepted).
  respondEmailRequestAccepted(res);

  try {
    const foundUser = await findUserByEmailOrUsername(email); // Get the user from the database by email or username.

    // Silently do nothing if no user matches, it's disabled, or it's still pending activation
    // (that account has to go through activation first, not a password reset).
    if (!foundUser || foundUser.isDisabled || !foundUser.activatedAt) {
      return;
    }

    // Throttle repeated reset requests for the same account.
    const isSlotClaimed = await claimEmailSlot(
      foundUser._id,
      "resetPasswordLastSentAt",
      passwordResetRetryCooldownInSeconds,
    );

    if (!isSlotClaimed) {
      return;
    }

    await sendPasswordResetEmail(foundUser);
  } catch (error) {
    logEmailRequestError("password reset request", error);
  }
};

export default requestPasswordReset;
