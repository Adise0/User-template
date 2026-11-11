import { passwordResetExpirationInMinutes } from "../../../../data/serverConfig/server-config";
import getBaseEmail, { button, debugLink, notYou, paragraph, smallText } from "./baseEmail";

// The reset and the "wasn't you?" cancel link share the same token: the endpoint decides.
const getPasswordResetEmail = (resetPasswordToken: string) =>
  getBaseEmail(
    "Reset your password",
    `${paragraph("We got a request to reset your password. Choose a new one with the button below.")}
    ${button(`${process.env.FRONTEND_URL}/auth/resetPassword/${resetPasswordToken}`, "Reset my password")}
    ${smallText(`This link works once and expires in ${passwordResetExpirationInMinutes} minutes.`)}
    ${notYou(
      "Your password hasn't changed. Cancel the request and this link stops working.",
      `${process.env.FRONTEND_URL}/auth/cancelPasswordReset/${resetPasswordToken}`,
      "Cancel this password reset",
    )}
    ${debugLink(`${process.env.BACKEND_URL}/auth/cancelPasswordReset/${resetPasswordToken}`)}`,
  );

export default getPasswordResetEmail;
