import ServerError, { ErrorSeverety } from "../../types/errorTypes/ServerError";
import { ErrorCode, FieldErrors } from "../../types/errorTypes/ErrorCode";

// This class adds the controlled check and allows you to add any error fields you want AS A SEPERATE OBJECT!
// Extends the real Error class (rather than just structurally matching ServerError) so instances
// can be safely thrown (eg. to abort a transaction) and still get a proper stack trace.
class ControledError extends Error {
  code: ErrorCode;

  statusCode: number;

  messageToSend: string;

  severety: ErrorSeverety;

  fields?: FieldErrors;

  details?: Record<string, unknown>;

  extraData?: Record<string, unknown>;

  controled = true;

  constructor(serverError: ServerError) {
    super(serverError.message);
    this.name = serverError.code;
    this.code = serverError.code;
    this.statusCode = serverError.statusCode;
    this.messageToSend = serverError.messageToSend;
    this.severety = serverError.severety;
    this.fields = serverError.fields;
    this.details = serverError.details;
    this.extraData = serverError.extraData;
  }
}

export default ControledError;
