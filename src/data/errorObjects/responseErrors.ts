import ResponseError from "../../types/errorTypes/ResponseError";
import { ErrorCode } from "../../types/errorTypes/ErrorCode";
import ControlledError from "./ControlledError";

// Not found error builder
export const getNotFoundError = (): ResponseError => ({
  error: true,
  status: 404,
  code: ErrorCode.NOT_FOUND,
  message: "Resource not found",
});

// Response error builder: only the public parts of the error make it into the response.
export const buildResponseError = (error: ControlledError): ResponseError => ({
  error: true,
  status: error.statusCode,
  code: error.code,
  message: error.messageToSend,
  ...(error.fields && { fields: error.fields }),
  ...(error.details && { details: error.details }),
});
