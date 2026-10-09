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

// OTP settings. The "wasn't you?" revoke link expires together with the OTP it protects.
export const otpExpirationInMinutes = 10;
export const otpMaxAttempts = 5; // Wrong guesses allowed before the OTP is wiped.
export const otpRetryCooldownInSeconds = 60; // Minimum time between two OTP emails for the same account.

// Password reset link expiration (the "wasn't you?" cancel link shares the same token).
export const passwordResetExpirationInMinutes = 30;

// Minimum time between two password reset emails for the same account, so the endpoint can't
// be used to flood someone's inbox.
export const passwordResetRetryCooldownInSeconds = 60;

// Sensitive actions (change password, delete account) need a session whose last real login
// (credentials or activation link, NOT a token refresh) happened at most this long ago.
export const freshAuthMaxAgeInMinutes = 5;

// RATE LIMITING (per IP)
export const authRateLimitWindowInMinutes = 15;
export const loginRateLimitMax = 10; // Login attempts per window.
export const emailRateLimitMax = 5; // Requests that send an email (register, OTP, reset...) per window.
