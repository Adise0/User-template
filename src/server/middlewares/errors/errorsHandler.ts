import chalk from "chalk";
import debug from "debug";
import { NextFunction, Request, Response } from "express";

import { buiildResponseError } from "../../../data/errorObjects/responseErrors";
import ControledError from "../../../data/errorObjects/ControledError";

const debugToConsole = debug("podrida:errorHandler"); // Debug section setup

const errorsHandler = (
  err: ControledError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  // Grab the controled error code and message or add the Internal server one in case of uncontroled error
  const code = err.statusCode || 500;
  const message = err.messageToSend || "Internal server error";

  const errorToSend = buiildResponseError(code, message); // Build the response error with the wanted info

  // If the error is uncontroled show in console -> Recommended to change to an acual logger
  if (!err.controled) {
    debugToConsole(
      chalk.redBright(`Unhandled error found!: \n ${err.message}`)
    );
  }

  if (process.env.DEBUG_VERBOSE === "true") {
    debugToConsole(
      " \n",
      chalk.redBright(`\n Error: `),
      chalk.whiteBright(err.name),
      chalk.redBright(`\n Message: `),
      chalk.whiteBright(err.message),
      chalk.redBright(`\n Sent message:`),
      chalk.whiteBright(err.messageToSend),
      chalk.redBright(`\n Code:`),
      chalk.whiteBright(err.statusCode),
      chalk.redBright(`\n Data: ${err.extraData ? "\n" : ""}`),
      chalk.whiteBright(
        err.extraData
          ? Object.entries(err.extraData)
              .map((entry) => `  ${entry[0]}: ${entry[1]} \n`)
              .join("")
          : "No Data"
      )
    );
  }

  res.status(code).json(errorToSend); // Send the response with the error and code
};

export default errorsHandler;
