// This file contains the basic configuration parameters of the server

// The product's name, as users see it: in every email, and next to the code in authenticator apps.
export const appName = "user-template";

// USER SETTINGS

// Session settings
export const userSessionDurationInHours = 2; // Duration of the user session
export const userSessionRefreshInHours = 1; // Time before the front should refresh the token

// Hard limit on a session's total life, counted from the last real login (refreshing doesn't reset
// it). Past this the user has to log in again. null means unlimited.
export const userSessionMaxAgeInHours: number | null = null;

// Password settings
// No 0/O or 1/I, they're easy to mix up. Uppercase only, the login uppercases what the user types.
export const charactersOTP = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const lengthOTP = 8;
export const saltRounds = 12;

// User creation
export const userActivationExpirationInMinutes = 20;
export const usernameMinLength = 3;
export const usernameMaxLength = 24;
export const nameMaxLength = 50; // First and last name.

// How long a never-activated account is kept before MongoDB deletes it. Longer than the activation
// link on purpose, so the user can still ask for a new link once the first one expires.
export const pendingAccountRetentionInHours = 24;

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

// Email change link expiration, and minimum time between two of those emails for the same account.
export const emailChangeExpirationInMinutes = 30;
export const emailChangeRetryCooldownInSeconds = 60;

// Sensitive actions (change password, change email, delete account) need a session whose last real login
// (credentials or activation link, NOT a token refresh) happened at most this long ago.
export const freshAuthMaxAgeInMinutes = 5;

// Account deletion (by the user). The account is signed out and kept for this long, logging back in
// cancels the deletion, and MongoDB removes it once the time is up. null deletes it right away.
export const accountDeletionGraceInDays: number | null = 14;

// OAUTH (providers are switched on by their variables in the .env, see .env.example)
// How long a first-time OAuth user has to pick a username before signing in again.
export const oauthSignupExpirationInMinutes = 15;

// TWO-FACTOR AUTHENTICATION (authenticator apps)
// false removes the 2FA endpoints (404) and login never asks for a code, whatever the users had set.
export const twoFactorAuthEnabled = true;
export const twoFactorIssuer = appName; // The name authenticator apps show next to the code.
export const twoFactorChallengeExpirationInMinutes = 5; // Time to type the code after the password.
export const twoFactorMaxAttempts = 5; // Wrong codes per login before it has to start over.
export const twoFactorBackupCodeCount = 10;

// EMAIL DELIVERY
export const emailMaxAttempts = 3; // Tries per email before giving up.
export const emailRetryDelayInSeconds = 2; // Grows with each attempt: 2s, then 4s...
export const emailTimeoutInSeconds = 10; // How long a stuck SMTP server is waited for.

// SERVER
export const shutdownTimeoutInSeconds = 10; // Time given to running requests on shutdown.

// ADMIN
export const adminUserListMaxLimit = 100; // Most users a single page of the admin list can return.

// RATE LIMITING (per IP)
export const authRateLimitWindowInMinutes = 15;
export const loginRateLimitMax = 10; // Login attempts per window.
// Failed logins per account (whatever the IP) per window. Looser than the per-IP limit on purpose:
// anyone who knows a username can burn it, locking the owner out of password login until the
// window ends (OTP and password reset still work). See SECURITY_SETTINGS.md.
export const accountLoginFailureLimitMax = 20;
export const emailRateLimitMax = 5; // Requests that send an email (register, OTP, reset...) per window.
export const keyCheckRateLimitMax = 10; // Email/username availability checks per window.
