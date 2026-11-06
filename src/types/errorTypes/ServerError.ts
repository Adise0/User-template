import { ErrorCode, FieldErrors } from "./ErrorCode";

export enum ErrorSeverity {
  high = "HIGH",
  medium = "MEDIUM",
  low = "LOW",
}

interface ServerError {
  code: ErrorCode; // Sent to the client: what the frontend switches on.
  message: string; // Internal message, only logged.
  messageToSend: string; // Sent to the client: human-readable fallback.
  statusCode: number;
  severity: ErrorSeverity;
  fields?: FieldErrors; // Sent to the client: per-field problems, for forms.
  details?: Record<string, unknown>; // Sent to the client: extra public data (eg. retryAfterSeconds).
  extraData?: Record<string, unknown>; // NEVER sent to the client, only logged (ids, emails...).
}

export default ServerError;
