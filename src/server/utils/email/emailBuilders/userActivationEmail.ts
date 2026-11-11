import {
  appName,
  userActivationExpirationInMinutes,
} from "../../../../data/serverConfig/server-config";
import getBaseEmail, { button, debugLink, notYou, paragraph, smallText } from "./baseEmail";

// The activation and the "wasn't you?" cancel link share the same token: the endpoint decides.
const getUserActivationEmail = (activationToken: string) =>
  getBaseEmail(
    `Activate your ${appName} account`,
    `${paragraph("Thanks for signing up. Confirm this is your email address to activate your account.")}
    ${button(`${process.env.FRONTEND_URL}/auth/activate/${activationToken}`, "Activate my account")}
    ${smallText(`This link expires in ${userActivationExpirationInMinutes} minutes.`)}
    ${debugLink(`${process.env.BACKEND_URL}/auth/activate/${activationToken}`)}
    ${notYou(
      "Someone may have signed up with your email by mistake. Cancel the registration and nothing is kept.",
      `${process.env.FRONTEND_URL}/auth/cancelRegistration/${activationToken}`,
      "Cancel this registration",
    )}
    ${debugLink(`${process.env.BACKEND_URL}/auth/cancelRegistration/${activationToken}`)}`,
  );

export default getUserActivationEmail;
