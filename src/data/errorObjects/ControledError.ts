import ServerError, { ErrorSeverety } from "../../types/errorTypes/ServerError";

/* eslint-disable lines-between-class-members */

// This class adds the controlled check and allows you to add any error fields you want AS A SEPERATE OBJECT!
class ControledError {
  name: string;
  message: string;
  statusCode: number;
  messageToSend: string;
  severety: ErrorSeverety;
  extraData?: { [key: string]: any };
  controled: boolean = true;

  constructor(serverError: ServerError) {
    this.name = serverError.name;
    this.message = serverError.message;
    this.statusCode = serverError.statusCode;
    this.messageToSend = serverError.messageToSend;
    this.severety = serverError.severety;
    this.extraData = serverError.extraData;
  }
}

export default ControledError;
