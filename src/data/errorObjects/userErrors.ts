/* eslint-disable import/prefer-default-export */

import { ErrorSeverety } from "../../types/errorTypes/ServerError";
import ControledError from "./ControledError";

export const getUserNotFoundForUsernameOrEmailError = (
  email: string
): ControledError =>
  new ControledError({
    name: "MISSINGUSER",
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
    name: "MISSINGUSER",
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
    name: "DISABLEDUSER",
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
    name: "INACTIVEUSER",
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
    name: "BADAUTH",
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
    name: "ACTIVATIONEMAILFAILED",
    message: "Failed to send the activation email",
    statusCode: 500,
    messageToSend:
      "We couldn't send your activation email. Please try registering again.",
    severety: ErrorSeverety.high,
  });

export const getAccountAlreadyActivatedError = (
  userId: string
): ControledError =>
  new ControledError({
    name: "ALREADYACTIVE",
    message: "Account already activated",
    statusCode: 409,
    messageToSend: "This account has already been activated",
    severety: ErrorSeverety.low,
    extraData: {
      userId,
    },
  });

export const getPendingRegistrationCooldownError = (
  secondsRemaining: number
): ControledError =>
  new ControledError({
    name: "PENDINGREGISTRATIONCOOLDOWN",
    message: "Registration retried too soon after a pending attempt",
    statusCode: 429,
    messageToSend: `An activation email was already sent. Check your inbox, or try again in ${secondsRemaining}s.`,
    severety: ErrorSeverety.low,
    extraData: {
      secondsRemaining,
    },
  });

export const getPasswordResetEmailFailedError = (): ControledError =>
  new ControledError({
    name: "PASSWORDRESETEMAILFAILED",
    message: "Failed to send the password reset email",
    statusCode: 500,
    messageToSend:
      "We couldn't send your password reset email. Please try again.",
    severety: ErrorSeverety.high,
  });

export const getPasswordResetCooldownError = (
  secondsRemaining: number
): ControledError =>
  new ControledError({
    name: "PASSWORDRESETCOOLDOWN",
    message: "Password reset requested too soon after a previous one",
    statusCode: 429,
    messageToSend: `A password reset email was already sent. Check your inbox, or try again in ${secondsRemaining}s.`,
    severety: ErrorSeverety.low,
    extraData: {
      secondsRemaining,
    },
  });

export interface DuplicatedKeys {
  email: boolean;
  username: boolean;
}

const getDuplicateKeyNames = (duplicatedKeys: DuplicatedKeys): string[] =>
  Object.entries(duplicatedKeys)
    .filter(([, value]) => value)
    .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));

export const getDuplicateKeyRegistrationError = (
  duplicatedKeys: DuplicatedKeys
): ControledError =>
  new ControledError({
    name: "DUPLICATEKEY",
    message: `Duplicate key/s: ${getDuplicateKeyNames(duplicatedKeys).join(
      ", "
    )}`,
    severety: ErrorSeverety.low,
    statusCode: 409,
    messageToSend: `Duplicated keys: ${getDuplicateKeyNames(
      duplicatedKeys
    ).join(", ")}`,
    extraData: {
      keys: getDuplicateKeyNames(duplicatedKeys),
    },
  });
