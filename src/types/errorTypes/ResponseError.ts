import { ErrorCode, FieldErrors } from "./ErrorCode";

// The body of every error response the API sends.
interface ResponseError {
  error: true;
  status: number; // Same as the HTTP status code.
  code: ErrorCode;
  message: string;
  fields?: FieldErrors;
  details?: Record<string, unknown>;
}

export default ResponseError;
