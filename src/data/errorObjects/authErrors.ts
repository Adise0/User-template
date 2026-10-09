import { ErrorSeverety } from "../../types/errorTypes/ServerError";
import { ErrorCode } from "../../types/errorTypes/ErrorCode";
import ControledError from "./ControledError";

export const getNoAuthHeaderError = (): ControledError =>
  new ControledError({
    code: ErrorCode.MISSING_AUTH,
    message: "Missing authorization header",
    statusCode: 401,
    messageToSend: "No auth provided",
    severety: ErrorSeverety.low,
  });

export const getInvalidTokenError = (): ControledError =>
  new ControledError({
    code: ErrorCode.INVALID_TOKEN,
    message: "Invalid Token",
    statusCode: 401,
    messageToSend: "Invalid token",
    severety: ErrorSeverety.low,
  });

export const getReauthRequiredError = (userId: string): ControledError =>
  new ControledError({
    code: ErrorCode.REAUTH_REQUIRED,
    message: "Sensitive action attempted with a session that isn't fresh",
    statusCode: 403,
    messageToSend: "Please log in again to confirm it's you",
    severety: ErrorSeverety.low,
    extraData: {
      userId,
    },
  });

export const getTooManyRequestsError = (retryAfterSeconds: number): ControledError =>
  new ControledError({
    code: ErrorCode.TOO_MANY_REQUESTS,
    message: "Rate limit reached",
    statusCode: 429,
    messageToSend: "Too many attempts. Please wait a few minutes and try again.",
    severety: ErrorSeverety.low,
    details: {
      retryAfterSeconds,
    },
  });

export const getInvalidOrExpiredTokenError = (): ControledError =>
  new ControledError({
    code: ErrorCode.INVALID_OR_EXPIRED_LINK,
    message: "Invalid or expired link token",
    statusCode: 401,
    messageToSend: "This link is invalid or has expired",
    severety: ErrorSeverety.low,
  });
