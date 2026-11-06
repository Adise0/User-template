import jwt from "jsonwebtoken";
import { SignedIdTokenPayload, TokenPurpose } from "../../../types/authTypes/TokenPayload";
import { UserDocument } from "../../../types/userTypes/DatabaseUserData";
import { passwordResetExpirationInMinutes } from "../../../data/serverConfig/server-config";
import sendEmail from "../email";
import EmailData from "../email/types";
import getPasswordResetEmail from "../email/emailBuilders/passwordResetEmail";
import getTokenSecret from "./getTokenSecret";
import hashToken from "./hashToken";

// Emails a password reset link and stores its token, for both a user asking for one and an admin
// forcing it. Throws if the email fails.
const sendPasswordResetEmail = async (user: UserDocument) => {
  // Create the reset token Payload.
  const tokenData: SignedIdTokenPayload = {
    purpose: TokenPurpose.passwordReset,
    id: user.id,
  };

  // Create the token with the created payload. The same token backs both the reset link and
  // the "wasn't you?" cancel link, the endpoint it's sent to decides the action.
  const resetPasswordToken = jwt.sign(tokenData, getTokenSecret(), {
    expiresIn: `${passwordResetExpirationInMinutes}m`,
  });

  // Create the emailData object for the mail function.
  const emailData: EmailData = {
    html: getPasswordResetEmail(resetPasswordToken),
    internalEmailName: "Password reset email",
    subject: `Hey ${user.information.username}! Reset your password`,
    to: user.credentials.email,
  };

  // Send the email BEFORE overwriting the stored token: if it fails (it throws), a previously
  // sent (still valid) link stays intact instead of being replaced by one nobody received.
  await sendEmail(emailData);

  // The email went out - store the token (which also invalidates any previously issued reset links).
  user.set("resetPasswordToken", hashToken(resetPasswordToken));
  await user.save();
};

export default sendPasswordResetEmail;
