import { emailChangeExpirationInMinutes } from "../../../../data/serverConfig/server-config";
import getBaseEmail, { button, paragraph, smallText } from "./baseEmail";

// Sent to the NEW address: following the link proves the user owns it.
const getEmailChangeEmail = (emailChangeToken: string) =>
  getBaseEmail(
    "Confirm your new email",
    `${paragraph("Confirm this address to start using it on your account.")}
    ${button(`${process.env.FRONTEND_URL}/auth/confirmEmailChange/${emailChangeToken}`, "Confirm my new email")}
    ${smallText(
      `This link expires in ${emailChangeExpirationInMinutes} minutes. If you didn't ask for this, ignore this email and nothing changes.`,
    )}`,
  );

export default getEmailChangeEmail;
