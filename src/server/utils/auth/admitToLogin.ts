import { Response } from "express";
import ControlledError from "../../../data/errorObjects/ControlledError";
import {
  getNotYetActivatedError,
  getPasswordResetRequiredError,
  getUserDisabledError,
} from "../../../data/errorObjects/userErrors";
import Users from "../../../database/models/Users";
import { UserDocument } from "../../../types/userTypes/DatabaseUserData";
import sendSecurityNotice from "../email/sendSecurityNotice";

// The last step of every way of logging in (password, OTP, OAuth), once the user has proven who
// they are. Returns the error to answer with if the account can't log in right now. Otherwise it
// leaves the user in res.locals for the rest of the chain (2FA challenge, then sendToken) and
// returns null.
const admitToLogin = async (user: UserDocument, res: Response): Promise<ControlledError | null> => {
  if (user.isDisabled) {
    return getUserDisabledError(user.id);
  }

  if (!user.activatedAt) {
    return getNotYetActivatedError(user.id);
  }

  // An admin forced a password reset, so the account may be compromised: the only way back in is
  // the link sent to the account's email, which clears this.
  if (user.resetPasswordOnLogin) {
    return getPasswordResetRequiredError(user.id);
  }

  // The owner deleted the account but is back within the grace period: logging in cancels it.
  if (user.scheduledDeletionAt) {
    await Users.updateOne({ _id: user._id }, { $unset: { scheduledDeletionAt: "" } });

    sendSecurityNotice(
      user.credentials.email,
      "Your account deletion was cancelled",
      "You logged in, so your account won't be deleted. If this wasn't you, reset your password right away.",
    );
  }

  res.locals.userId = user.id;
  res.locals.tokenVersion = user.tokenVersion;

  return null;
};

export default admitToLogin;
