/* eslint-disable import-x/first */
/* eslint-disable import-x/newline-after-import */

import dotenv from "dotenv";
dotenv.config();

import startServer from "./server/startServer";
import app from "./server";
import connectToDB from "./database";
import validateEnv from "./data/serverConfig/validateEnv";
import setupGracefulShutdown from "./server/setupGracefulShutdown";
import logger from "./server/utils/logger";

// Environment variable grab
const port = process.env.PORT || "4000";
const connectionString = process.env.CONN_STRING;

// Services initialization
(async () => {
  try {
    validateEnv(); // Stop right here if the configuration is broken
    logger.info("Starting server...");
    await connectToDB(connectionString); // Connect first, a server without its DB can't answer anything
    const server = await startServer(port, app); // Start the server
    setupGracefulShutdown(server);
  } catch (error) {
    // Straight to the console, so it's shown whatever the log level, and the process goes down
    // instead of staying up broken.
    // eslint-disable-next-line no-console
    console.error(`Startup failed: ${(error as Error).message}`);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }
})();
