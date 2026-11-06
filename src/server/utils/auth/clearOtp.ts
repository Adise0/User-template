import { Document } from "mongoose";

// Wipes the user's pending OTP along with everything tied to it (expiration, attempt counter and
// the "wasn't you?" revoke token). otpLastSentAt stays on purpose: wiping an OTP must not skip the
// cooldown. Only mutates the document, the caller is responsible for saving it.
const clearOtp = (user: Document) => {
  user.set({
    "credentials.otpPassword": undefined,
    "credentials.otpExpiresAt": undefined,
    "credentials.otpAttempts": 0,
    otpRevokeToken: undefined,
  });
};

export default clearOtp;
