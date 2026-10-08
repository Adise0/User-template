import ServerError, { ErrorSeverety } from "../../types/errorTypes/ServerError";

/* eslint-disable lines-between-class-members */

// This class adds the controlled check and allows you to add any error fields you want AS A SEPERATE OBJECT!
// Extends the real Error class (rather than just structurally matching ServerError) so instances
// can be safely thrown (eg. to abort a transaction) and still get a proper stack trace.
class ControledError extends Error {
  statusCode: number;
  messageToSend: string;
  severety: ErrorSeverety;
  extraData?: { [key: string]: any };
  controled: boolean = true;

  constructor(serverError: ServerError) {
    super(serverError.message);
    this.name = serverError.name;
    this.statusCode = serverError.statusCode;
    this.messageToSend = serverError.messageToSend;
    this.severety = serverError.severety;
    this.extraData = serverError.extraData;
  }
}

export default ControledError;
