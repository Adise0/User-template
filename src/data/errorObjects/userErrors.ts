import { ErrorSeverety } from "../../types/errorTypes/ServerError";
import { ErrorCode, FieldErrorCode, FieldErrors } from "../../types/errorTypes/ErrorCode";
import ControledError from "./ControledError";

// Shares its code and message with getInvalidPasswordError on purpose: "no such account" and
// "wrong password" must look exactly the same from the outside.
export const getUserNotFoundForUsernameOrEmailError = (email: string): ControledError =>
  new ControledError({
    code: ErrorCode.INVALID_CREDENTIALS,
    message: "User not found",
    statusCode: 401,
    messageToSend: "Incorrect email or password",
    severety: ErrorSeverety.low,
    extraData: {
      email,
    },
  });

export const getUserNotFoundForIdError = (userId: string): ControledError =>
  new ControledError({
    code: ErrorCode.USER_NOT_FOUND,
    message: "User not found for Id",
    statusCode: 404,
    messageToSend: "User not found",
    severety: ErrorSeverety.low,
    extraData: {
      userId,
    },
  });

export const getUserDisabledError = (userId: string): ControledError =>
  new ControledError({
    code: ErrorCode.USER_DISABLED,
    message: "User disabled",
    statusCode: 403,
    messageToSend: "This user is currently disabled",
    severety: ErrorSeverety.low,
    extraData: {
      userId,
    },
  });

export const getNotYetActivatedError = (userId: string): ControledError =>
  new ControledError({
    code: ErrorCode.ACCOUNT_NOT_ACTIVATED,
    message: "User not active",
    statusCode: 403,
    messageToSend: "This user is not activated yet!",
    severety: ErrorSeverety.low,
    extraData: {
      userId,
    },
  });

export const getInvalidPasswordError = (userId: string): ControledError =>
  new ControledError({
    code: ErrorCode.INVALID_CREDENTIALS,
    message: "Password is not valid",
    statusCode: 401,
    messageToSend: "Incorrect email or password",
    severety: ErrorSeverety.low,
    extraData: {
      userId,
    },
  });

export const getActivationEmailFailedError = (): ControledError =>
  new ControledError({
    code: ErrorCode.ACTIVATION_EMAIL_FAILED,
    message: "Failed to send the activation email",
    statusCode: 500,
    messageToSend: "We couldn't send your activation email. Please try registering again.",
    severety: ErrorSeverety.high,
  });

export const getAccountAlreadyActivatedError = (userId: string): ControledError =>
  new ControledError({
    code: ErrorCode.ACCOUNT_ALREADY_ACTIVATED,
    message: "Account already activated",
    statusCode: 409,
    messageToSend: "This account has already been activated",
    severety: ErrorSeverety.low,
    extraData: {
      userId,
    },
  });

export const getPendingRegistrationCooldownError = (secondsRemaining: number): ControledError =>
  new ControledError({
    code: ErrorCode.REGISTRATION_COOLDOWN,
    message: "Registration retried too soon after a pending attempt",
    statusCode: 429,
    messageToSend: `An activation email was already sent. Check your inbox, or try again in ${secondsRemaining}s.`,
    severety: ErrorSeverety.low,
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
): ControledError => {
  const duplicateKeyNames = getDuplicateKeyNames(duplicatedKeys);

  // Mark every duplicated key as TAKEN, keyed by the same field name the request used.
  const fields: FieldErrors = Object.fromEntries(
    duplicateKeyNames.map((key) => [key, FieldErrorCode.TAKEN]),
  );

  return new ControledError({
    code: ErrorCode.DUPLICATE_KEY,
    message: `Duplicate key/s: ${duplicateKeyNames.join(", ")}`,
    severety: ErrorSeverety.low,
    statusCode: 409,
    messageToSend: `Already in use: ${duplicateKeyNames.join(", ")}`,
    fields,
  });
};
