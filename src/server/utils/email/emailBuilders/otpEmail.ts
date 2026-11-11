import {
  otpExpirationInMinutes,
  otpMaxAttempts,
} from "../../../../data/serverConfig/server-config";
import getBaseEmail, { code, debugLink, notYou, paragraph, smallText } from "./baseEmail";

const getOtpEmail = (otp: string, otpRevokeToken: string) =>
  getBaseEmail(
    "Your one-time code",
    `${paragraph("Use this code to log in:")}
    ${code(otp)}
    ${smallText(
      `It works once, expires in ${otpExpirationInMinutes} minutes and stops working after ${otpMaxAttempts} wrong tries.`,
    )}
    ${notYou(
      "Someone may be trying to get into your account. Revoke the code so it can't be used.",
      `${process.env.FRONTEND_URL}/auth/revokeOtp/${otpRevokeToken}`,
      "Revoke this code",
    )}
    ${debugLink(`${process.env.BACKEND_URL}/auth/revokeOtp/${otpRevokeToken}`)}`,
  );

export default getOtpEmail;
