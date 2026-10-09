import chalk from "chalk";
import debug from "debug";
import { NextFunction, Request, Response } from "express";

import { buildResponseError } from "../../../data/errorObjects/responseErrors";
import ControledError from "../../../data/errorObjects/ControledError";
import { ErrorSeverety } from "../../../types/errorTypes/ServerError";
import { ErrorCode } from "../../../types/errorTypes/ErrorCode";

const debugToConsole = debug("user-template:errorHandler"); // Debug section setup

// Errors thrown by Express itself or its body parser (eg. broken JSON) carry their own 4xx status.
type UncontroledError = Error & { statusCode?: number };

// Turns anything that wasn't built as a ControledError into one, so every response has the same shape.
const toControledError = (err: UncontroledError): ControledError => {
  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
    return new ControledError({
      code: ErrorCode.BAD_REQUEST,
      message: err.message,
      statusCode: err.statusCode,
      messageToSend: "Bad request",
      severety: ErrorSeverety.low,
    });
  }

  return new ControledError({
    code: ErrorCode.INTERNAL_ERROR,
    message: err.message,
    statusCode: 500,
    messageToSend: "Internal server error",
    severety: ErrorSeverety.high,
  });
};

const errorsHandler = (
  err: ControledError | UncontroledError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const isControled = err instanceof ControledError;

  // If the error is uncontroled show in console -> Recommended to change to an acual logger
  if (!isControled) {
    debugToConsole(chalk.redBright(`Unhandled error found!: \n ${err.message}`));
  }

  const error = isControled ? err : toControledError(err);

  if (process.env.DEBUG_VERBOSE === "true") {
    debugToConsole(
      " \n",
      chalk.redBright(`\n Error: `),
      chalk.whiteBright(error.code),
      chalk.redBright(`\n Message: `),
      chalk.whiteBright(error.message),
      chalk.redBright(`\n Sent message:`),
      chalk.whiteBright(error.messageToSend),
      chalk.redBright(`\n Code:`),
      chalk.whiteBright(error.statusCode),
      chalk.redBright(`\n Data: ${error.extraData ? "\n" : ""}`),
      chalk.whiteBright(
        error.extraData
          ? Object.entries(error.extraData)
              .map((entry) => `  ${entry[0]}: ${entry[1]} \n`)
              .join("")
          : "No Data",
      ),
    );
  }

  res.status(error.statusCode).json(buildResponseError(error)); // Send only the public parts of the error.
};

export default errorsHandler;
