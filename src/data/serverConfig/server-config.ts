// This file contains the basic configuration parameters of the server

// USER SETTINGS

// Session settings
export const userSessionDurationInHours = 2; // Duration of the user session
export const userSessionRefreshInHours = 1; // Time before the front should refresh the token

// Password settings
export const charactersOTP = "0123456789";
export const lengthOTP = 6;
export const saltRounds = 10;

// User creation
export const userActivationExpirationInMinutes = 20;

// If a registration is retried with the same email/username while the previous attempt is
// still pending (unactivated), block it unless at least this long has passed since that
// attempt's activation email went out - guards against double-submits/spam while still letting
// a genuine retry (eg. the email never arrived) go through quickly.
export const registrationRetryCooldownInSeconds = 60;

// OTP revoke link ("wasn't you?") expiration
export const otpRevokeExpirationInHours = 1;
