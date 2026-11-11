import { ErrorSeverity } from "../../types/errorTypes/ServerError";
import { ErrorCode } from "../../types/errorTypes/ErrorCode";
import ControlledError from "./ControlledError";

export const getOAuthProviderUnavailableError = (provider: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.OAUTH_PROVIDER_UNAVAILABLE,
    message: "OAuth provider unknown or not configured",
    statusCode: 404,
    messageToSend: "This sign-in method isn't available",
    severity: ErrorSeverity.low,
    extraData: { provider },
  });

// The internal message says what failed, the response never does: it's the same "start over" for
// a refused code, a bad signature or a wrong nonce.
export const getOAuthFailedError = (reason: string, provider: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.OAUTH_FAILED,
    message: `OAuth failed: ${reason}`,
    statusCode: 401,
    messageToSend: "Signing in didn't work. Please try again.",
    severity: ErrorSeverity.low,
    extraData: { provider },
  });

export const getOAuthEmailNotVerifiedError = (provider: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.OAUTH_EMAIL_NOT_VERIFIED,
    message: "OAuth account with an unverified email",
    statusCode: 403,
    messageToSend: "Verify your email with the provider first, then try again.",
    severity: ErrorSeverity.low,
    extraData: { provider },
  });

export const getOAuthEmailInUseError = (provider: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.OAUTH_EMAIL_IN_USE,
    message: "OAuth sign-in for an email that already has an account",
    statusCode: 409,
    messageToSend:
      "An account with this email already exists. Log in to it, then link this sign-in method from your settings.",
    severity: ErrorSeverity.low,
    extraData: { provider },
  });

export const getOAuthAlreadyLinkedError = (provider: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.OAUTH_ALREADY_LINKED,
    message: "OAuth account already linked",
    statusCode: 409,
    messageToSend: "This sign-in method is already linked to an account.",
    severity: ErrorSeverity.low,
    extraData: { provider },
  });

export const getOAuthNotLinkedError = (provider: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.OAUTH_NOT_LINKED,
    message: "OAuth provider not linked to this account",
    statusCode: 404,
    messageToSend: "This sign-in method isn't linked to your account.",
    severity: ErrorSeverity.low,
    extraData: { provider },
  });
