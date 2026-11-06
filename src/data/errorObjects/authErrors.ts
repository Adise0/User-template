import { ErrorSeverity } from "../../types/errorTypes/ServerError";
import { ErrorCode } from "../../types/errorTypes/ErrorCode";
import ControlledError from "./ControlledError";

export const getNoAuthHeaderError = (): ControlledError =>
  new ControlledError({
    code: ErrorCode.MISSING_AUTH,
    message: "Missing authorization header",
    statusCode: 401,
    messageToSend: "No auth provided",
    severity: ErrorSeverity.low,
  });

export const getInvalidTokenError = (): ControlledError =>
  new ControlledError({
    code: ErrorCode.INVALID_TOKEN,
    message: "Invalid Token",
    statusCode: 401,
    messageToSend: "Invalid token",
    severity: ErrorSeverity.low,
  });

export const getReauthRequiredError = (userId: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.REAUTH_REQUIRED,
    message: "Sensitive action attempted with a session that isn't fresh",
    statusCode: 403,
    messageToSend: "Please log in again to confirm it's you",
    severity: ErrorSeverity.low,
    extraData: {
      userId,
    },
  });

export const getForbiddenError = (userId: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.FORBIDDEN,
    message: "Action not allowed for the user's role",
    statusCode: 403,
    messageToSend: "You don't have permission to do this",
    severity: ErrorSeverity.low,
    extraData: {
      userId,
    },
  });

export const getTooManyRequestsError = (retryAfterSeconds: number): ControlledError =>
  new ControlledError({
    code: ErrorCode.TOO_MANY_REQUESTS,
    message: "Rate limit reached",
    statusCode: 429,
    messageToSend: "Too many attempts. Please wait a few minutes and try again.",
    severity: ErrorSeverity.low,
    details: {
      retryAfterSeconds,
    },
  });

export const getInvalidOrExpiredTokenError = (): ControlledError =>
  new ControlledError({
    code: ErrorCode.INVALID_OR_EXPIRED_LINK,
    message: "Invalid or expired link token",
    statusCode: 401,
    messageToSend: "This link is invalid or has expired",
    severity: ErrorSeverity.low,
  });
