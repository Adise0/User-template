import { ErrorSeverity } from "../../types/errorTypes/ServerError";
import { ErrorCode } from "../../types/errorTypes/ErrorCode";
import ControlledError from "./ControlledError";

export const getTwoFactorInvalidCodeError = (userId: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.TWO_FACTOR_INVALID_CODE,
    message: "Wrong or reused two-factor code",
    statusCode: 401,
    messageToSend: "That code isn't valid",
    severity: ErrorSeverity.low,
    extraData: { userId },
  });

export const getTwoFactorAlreadyEnabledError = (userId: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.TWO_FACTOR_ALREADY_ENABLED,
    message: "Two-factor authentication already enabled",
    statusCode: 409,
    messageToSend: "Two-factor authentication is already on",
    severity: ErrorSeverity.low,
    extraData: { userId },
  });

export const getTwoFactorNotEnabledError = (userId: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.TWO_FACTOR_NOT_ENABLED,
    message: "Two-factor authentication not enabled",
    statusCode: 409,
    messageToSend: "Two-factor authentication is off",
    severity: ErrorSeverity.low,
    extraData: { userId },
  });

export const getTwoFactorSetupNotStartedError = (userId: string): ControlledError =>
  new ControlledError({
    code: ErrorCode.TWO_FACTOR_SETUP_NOT_STARTED,
    message: "Two-factor enable attempted without a setup",
    statusCode: 409,
    messageToSend: "Start the two-factor setup first",
    severity: ErrorSeverity.low,
    extraData: { userId },
  });
