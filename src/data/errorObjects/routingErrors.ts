/* eslint-disable import-x/prefer-default-export */

import { ErrorSeverity } from "../../types/errorTypes/ServerError";
import { ErrorCode } from "../../types/errorTypes/ErrorCode";
import ControlledError from "./ControlledError";

export const getMethodNotAllowedError = (
  allowedMethods: string[],
  requestedMethod: string,
): ControlledError =>
  new ControlledError({
    code: ErrorCode.METHOD_NOT_ALLOWED,
    message: `Method ${requestedMethod} not allowed, expected one of: ${allowedMethods.join(", ")}`,
    statusCode: 405,
    messageToSend: `This endpoint only accepts: ${allowedMethods.join(", ")}`,
    severity: ErrorSeverity.low,
    details: {
      allowedMethods,
    },
  });
