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
