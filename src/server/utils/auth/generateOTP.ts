import {
  charactersOTP,
  lengthOTP,
} from "../../../data/serverConfig/server-config";

// This function creates a One Time Password based of the characters in the "charactersOTP" string and length found in server-config.
const generateOTP = (): string => {
  let otp: string = "";

  for (let i = 0; i < lengthOTP; i++) {
    otp += charactersOTP.charAt(
      Math.floor(Math.random() * charactersOTP.length)
    );
  }

  return otp;
};

export default generateOTP;
