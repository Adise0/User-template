import chalk from "chalk";
import debug from "debug";
import { Response } from "express";

const debugToConsole = debug("user-template:emailRequests");

// Shared by every endpoint that emails an account looked up by email or username (requestOtp,
// resendActivation, requestPasswordReset). They answer with this, straight away and before
// touching the DB, whatever happens next: whether the account exists, is disabled, is on cooldown
// or the email fails must not be readable from the response or from how long it took.
export const respondEmailRequestAccepted = (res: Response) => {
  res.status(202).json({
    message: "If an account matches, an email is on its way.",
  });
};

// Since the response is already gone by the time the work runs, failures can only be logged.
export const logEmailRequestError = (requestName: string, error: unknown) => {
  debugToConsole(
    chalk.redBright(`Error while processing ${requestName}: \n`),
    chalk.whiteBright(error instanceof Error ? error.message : String(error)),
  );
};
