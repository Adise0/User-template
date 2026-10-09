import { randomInt } from "node:crypto";
import { charactersOTP, lengthOTP } from "../../../data/serverConfig/server-config";

// This function creates a One Time Password based of the characters in the "charactersOTP" string and length found in server-config.
// Uses crypto.randomInt (cryptographically secure) since the OTP is a credential, Math.random is predictable.
const generateOTP = (): string => {
  let otp = "";

  for (let i = 0; i < lengthOTP; i++) {
    otp += charactersOTP.charAt(randomInt(charactersOTP.length));
  }

  return otp;
};

export default generateOTP;
