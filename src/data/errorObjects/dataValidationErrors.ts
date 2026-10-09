/* eslint-disable import-x/prefer-default-export */

import { ValidationError } from "joi";
import { ErrorSeverety } from "../../types/errorTypes/ServerError";
import { ErrorCode, FieldErrorCode, FieldErrors } from "../../types/errorTypes/ErrorCode";
import ControledError from "./ControledError";

// Translates Joi's own error types (eg. "string.min") into our stable field codes, so the
// frontend never depends on which validation library the backend happens to use.
const joiTypeToFieldErrorCode: Record<string, FieldErrorCode> = {
  "any.required": FieldErrorCode.REQUIRED,
  "string.empty": FieldErrorCode.REQUIRED,
  "string.base": FieldErrorCode.INVALID_TYPE,
  "number.base": FieldErrorCode.INVALID_TYPE,
  "boolean.base": FieldErrorCode.INVALID_TYPE,
  "string.email": FieldErrorCode.INVALID_FORMAT,
  "string.alphanum": FieldErrorCode.INVALID_FORMAT,
  "string.length": FieldErrorCode.INVALID_FORMAT,
  "string.min": FieldErrorCode.TOO_SHORT,
  "string.max": FieldErrorCode.TOO_LONG,
};

// Shared by every request payload validator: turns a failed Joi validation into a single
// VALIDATION_FAILED error with one field code per offending field.
export const getValidationError = (
  validationError: ValidationError,
  payloadName: string,
): ControledError => {
  const fields: FieldErrors = {};

  validationError.details.forEach((detail) => {
    const field = detail.path.join(".");

    // Keep only the first problem per field (eg. REQUIRED wins over anything after it), and skip
    // problems with the payload as a whole (empty path), which the message still covers.
    if (field && !fields[field]) {
      fields[field] = joiTypeToFieldErrorCode[detail.type] ?? FieldErrorCode.INVALID;
    }
  });

  const messages = validationError.details.map((detail) => detail.message);

  return new ControledError({
    code: ErrorCode.VALIDATION_FAILED,
    message: `Invalid ${payloadName} payload`,
    statusCode: 400,
    messageToSend: `Invalid data: ${messages.join(", ")}`,
    severety: ErrorSeverety.low,
    fields,
  });
};
