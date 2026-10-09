// Every error the API can answer with carries one of these codes. They're the contract with the
// frontend: it switches on the code (never on the message, which is only a human-readable fallback),
// so once a code is in use NEVER rename or reuse it - add a new one instead.
// This file has no dependencies on purpose, so it can be copied as-is into the frontend.

export enum ErrorCode {
  // Generic
  INTERNAL_ERROR = "INTERNAL_ERROR",
  BAD_REQUEST = "BAD_REQUEST", // Malformed request the API couldn't even read (eg. broken JSON).
  NOT_FOUND = "NOT_FOUND", // No such endpoint.
  METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED",
  VALIDATION_FAILED = "VALIDATION_FAILED", // See "fields" for what's wrong with each field.
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS", // See "details.retryAfterSeconds".

  // Session
  MISSING_AUTH = "MISSING_AUTH", // No Authorization header.
  INVALID_TOKEN = "INVALID_TOKEN", // Session expired or revoked: log the user out.
  REAUTH_REQUIRED = "REAUTH_REQUIRED", // Sensitive action: send the user through the login again.

  // Email links (activation, cancel registration, revoke OTP, reset password...)
  INVALID_OR_EXPIRED_LINK = "INVALID_OR_EXPIRED_LINK",

  // Login. Deliberately one code for "no such account" and "wrong password", so the response
  // never tells which accounts exist.
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",

  // Account state
  USER_NOT_FOUND = "USER_NOT_FOUND",
  USER_DISABLED = "USER_DISABLED",
  ACCOUNT_NOT_ACTIVATED = "ACCOUNT_NOT_ACTIVATED",
  ACCOUNT_ALREADY_ACTIVATED = "ACCOUNT_ALREADY_ACTIVATED",

  // Registration
  DUPLICATE_KEY = "DUPLICATE_KEY", // See "fields" for which of email/username is TAKEN.
  REGISTRATION_COOLDOWN = "REGISTRATION_COOLDOWN", // See "details.retryAfterSeconds".
  ACTIVATION_EMAIL_FAILED = "ACTIVATION_EMAIL_FAILED",
}

// What's wrong with a single field, used in the "fields" object of an error response
// (eg. { "email": "TAKEN", "password": "TOO_SHORT" }).
export enum FieldErrorCode {
  REQUIRED = "REQUIRED",
  INVALID_TYPE = "INVALID_TYPE", // Eg. a number where a string was expected.
  INVALID_FORMAT = "INVALID_FORMAT", // Eg. not an email.
  TOO_SHORT = "TOO_SHORT",
  TOO_LONG = "TOO_LONG",
  TAKEN = "TAKEN", // Email/username already in use.
  INVALID = "INVALID", // Anything not covered above.
}

export type FieldErrors = Record<string, FieldErrorCode>;
