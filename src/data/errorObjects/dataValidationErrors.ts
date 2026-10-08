import { ErrorSeverety } from "../../types/errorTypes/ServerError";
import ControledError from "./ControledError";

export const getInvalidRegistrationDataError = (
  messages: string[]
): ControledError =>
  new ControledError({
    name: "INVALIDREGISTRATIONDATA",
    message: "Invalid registration payload",
    statusCode: 400,
    messageToSend: `Invalid data: ${messages.join(", ")}`,
    severety: ErrorSeverety.low,
    extraData: {
      errors: messages.join(", "),
    },
  });

export const getInvalidLoginDataError = (messages: string[]): ControledError =>
  new ControledError({
    name: "INVALIDLOGINDATA",
    message: "Invalid account creation payload",
    statusCode: 400,
    messageToSend: `Invalid data: ${messages.join(", ")}`,
    severety: ErrorSeverety.low,
    extraData: {
      errors: messages.join(", "),
    },
  });

export const getInvalidGetUserDataError = (
  messages: string[]
): ControledError =>
  new ControledError({
    name: "INVALIDGETUSERDATA",
    message: "Invalid get user data payload",
    statusCode: 400,
    messageToSend: `Invalid data: ${messages.join(", ")}`,
    severety: ErrorSeverety.low,
    extraData: {
      errors: messages.join(", "),
    },
  });

export const getInvalidKeyCheckData = (messages: string[]): ControledError =>
  new ControledError({
    name: "INVALIDKEYCHECKDATA",
    message: "Invalid key check data",
    statusCode: 400,
    messageToSend: `Invalid data: ${messages.join(", ")}`,
    severety: ErrorSeverety.low,
    extraData: {
      errors: messages.join(", "),
    },
  });

export const getInvalidTokenBodyError = (messages: string[]): ControledError =>
  new ControledError({
    name: "INVALIDTOKENBODY",
    message: "Invalid token payload",
    statusCode: 400,
    messageToSend: `Invalid data: ${messages.join(", ")}`,
    severety: ErrorSeverety.low,
    extraData: {
      errors: messages.join(", "),
    },
  });

export const getInvalidEmailOrUsernameDataError = (
  messages: string[]
): ControledError =>
  new ControledError({
    name: "INVALIDEMAILORUSERNAMEDATA",
    message: "Invalid email/username payload",
    statusCode: 400,
    messageToSend: `Invalid data: ${messages.join(", ")}`,
    severety: ErrorSeverety.low,
    extraData: {
      errors: messages.join(", "),
    },
  });
