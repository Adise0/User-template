/* eslint-disable no-param-reassign */
/* eslint-disable import-x/no-extraneous-dependencies */
/* eslint-disable n/prefer-promises/dns */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable n/global-require */

import mongoose from "mongoose";
import debug from "debug";
import chalk from "chalk";

const debugInConsole = debug("user-template:database"); // Debug section setup

// This promise resolved when the DB connection starts correctly and rejects if there is an error
const connectToDB = (connectionString: string | undefined): Promise<void> =>
  new Promise((resolve, reject) => {
        require('node:dns').setServers(['8.8.8.8', '1.1.1.1']);
    debugInConsole(chalk.whiteBright("Connecting to database..."));
    mongoose
      .connect(connectionString)
      .then(() => {
        debugInConsole(
          chalk.whiteBright("Connection to database ") +
            chalk.greenBright("SUCCESSFULL")
        );
        resolve(); // Resolve on correct connection
      })
      .catch((error) => {
        const newError = {
          ...error,
          message: `Database error: ${error.message}`,
        };
        reject(newError); // Reject with an error on failiure
      });
  });

// These are global mongoose settings on JSON convert
mongoose.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
  },
});

export default connectToDB;
