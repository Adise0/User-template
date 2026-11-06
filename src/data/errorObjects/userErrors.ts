import { ErrorSeverity } from "../../types/errorTypes/ServerError";
import { ErrorCode, FieldErrorCode, FieldErrors } from "../../types/errorTypes/ErrorCode";
import ControlledError from "./ControlledError";

// Shares its code and message with getInvalidPasswordError on purpose: "no such account" and
// "wrong password" must look exactly the same from the outside.
export const getUserNotFoundForUsernameOrEmailError = (email: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.INVALID_CREDENTIALS,
    message: "User not found",
    statusCode: 401,
    messageToSend: "Incorrect email or password",
    severity: ErrorSeverity.low,
    extraData: {
      email,
    },
  });

export const getUserNotFoundForIdError = (userId: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.USER_NOT_FOUND,
    message: "User not found for Id",
    statusCode: 404,
    messageToSend: "User not found",
    severity: ErrorSeverity.low,
    extraData: {
      userId,
    },
  });

export const getUserDisabledError = (userId: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.USER_DISABLED,
    message: "User disabled",
    statusCode: 403,
    messageToSend: "This user is currently disabled",
    severity: ErrorSeverity.low,
    extraData: {
      userId,
    },
  });

export const getNotYetActivatedError = (userId: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.ACCOUNT_NOT_ACTIVATED,
    message: "User not active",
    statusCode: 403,
    messageToSend: "This user is not activated yet!",
    severity: ErrorSeverity.low,
    extraData: {
      userId,
    },
  });

export const getPasswordResetRequiredError = (userId: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.PASSWORD_RESET_REQUIRED,
    message: "Login attempted on an account with a forced password reset",
    statusCode: 403,
    messageToSend: "You need to reset your password. Check your email for the link.",
    severity: ErrorSeverity.low,
    extraData: {
      userId,
    },
  });

export const getInvalidPasswordError = (userId: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.INVALID_CREDENTIALS,
    message: "Password is not valid",
    statusCode: 401,
    messageToSend: "Incorrect email or password",
    severity: ErrorSeverity.low,
    extraData: {
      userId,
    },
  });

export const getActivationEmailFailedError = (): ControlledError =>
  new ControlledError({
    code: ErrorCode.ACTIVATION_EMAIL_FAILED,
    message: "Failed to send the activation email",
    statusCode: 500,
    messageToSend: "We couldn't send your activation email. Please try registering again.",
    severity: ErrorSeverity.high,
  });

export const getEmailChangeEmailFailedError = (): ControlledError =>
  new ControlledError({
    code: ErrorCode.EMAIL_CHANGE_EMAIL_FAILED,
    message: "Failed to send the email change confirmation",
    statusCode: 500,
    messageToSend: "We couldn't send the confirmation email. Please try again.",
    severity: ErrorSeverity.high,
  });

export const getAccountAlreadyActivatedError = (userId: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.ACCOUNT_ALREADY_ACTIVATED,
    message: "Account already activated",
    statusCode: 409,
    messageToSend: "This account has already been activated",
    severity: ErrorSeverity.low,
    extraData: {
      userId,
    },
  });

export const getPendingRegistrationCooldownError = (secondsRemaining: number): ControlledError =>
  new ControlledError({
    code: ErrorCode.REGISTRATION_COOLDOWN,
    message: "Registration retried too soon after a pending attempt",
    statusCode: 429,
    messageToSend: `An activation email was already sent. Check your inbox, or try again in ${secondsRemaining}s.`,
    severity: ErrorSeverity.low,
    details: {
      retryAfterSeconds: secondsRemaining,
    },
  });

export interface DuplicatedKeys {
  email: boolean;
  username: boolean;
}

const getDuplicateKeyNames = (duplicatedKeys: DuplicatedKeys): string[] =>
  Object.entries(duplicatedKeys)
    .filter(([, value]) => value)
    .map(([key]) => key);

export const getDuplicateKeyRegistrationError = (
  duplicatedKeys: DuplicatedKeys,
): ControlledError => {
  const duplicateKeyNames = getDuplicateKeyNames(duplicatedKeys);

  // Mark every duplicated key as TAKEN, keyed by the same field name the request used.
  const fields: FieldErrors = Object.fromEntries(
    duplicateKeyNames.map((key) => [key, FieldErrorCode.TAKEN]),
  );

  return new ControlledError({
    code: ErrorCode.DUPLICATE_KEY,
    message: `Duplicate key/s: ${duplicateKeyNames.join(", ")}`,
    severity: ErrorSeverity.low,
    statusCode: 409,
    messageToSend: `Already in use: ${duplicateKeyNames.join(", ")}`,
    fields,
  });
};
