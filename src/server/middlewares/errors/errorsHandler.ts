import { NextFunction, Request, Response } from "express";

import { buildResponseError } from "../../../data/errorObjects/responseErrors";
import ControlledError from "../../../data/errorObjects/ControlledError";
import { ErrorSeverity } from "../../../types/errorTypes/ServerError";
import { ErrorCode } from "../../../types/errorTypes/ErrorCode";

// Errors thrown by Express itself or its body parser (eg. broken JSON) carry their own 4xx status,
// some of them as statusCode and some as status (eg. an undecodable URL param).
type UncontrolledError = Error & { statusCode?: number; status?: number };

const logLevelBySeverity = {
  [ErrorSeverity.high]: "error",
  [ErrorSeverity.medium]: "warn",
  [ErrorSeverity.low]: "debug",
} as const;

// Turns anything that wasn't built as a ControlledError into one, so every response has the same shape.
const toControlledError = (err: UncontrolledError): ControlledError => {
  const statusCode = err.statusCode ?? err.status;

  if (statusCode && statusCode >= 400 && statusCode < 500) {
    return new ControlledError({
      code: ErrorCode.BAD_REQUEST,
      message: err.message,
      statusCode,
      messageToSend: "Bad request",
      severity: ErrorSeverity.low,
    });
  }

  return new ControlledError({
    code: ErrorCode.INTERNAL_ERROR,
    message: err.message,
    statusCode: 500,
    messageToSend: "Internal server error",
    severity: ErrorSeverity.high,
  });
};

const errorsHandler = (
  err: ControlledError | UncontrolledError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const isControlled = err instanceof ControlledError;
  const error = isControlled ? err : toControlledError(err);

  // The original error goes in the log, so an unexpected one keeps its stack trace.
  req.log[logLevelBySeverity[error.severity]](
    { err, code: error.code, statusCode: error.statusCode, extraData: error.extraData },
    error.message,
  );

  res.status(error.statusCode).json(buildResponseError(error)); // Send only the public parts of the error.
};

export default errorsHandler;
