/* eslint-disable n/prefer-promises/dns */

import { setServers } from "node:dns";
import os from "node:os";
import mongoose from "mongoose";
import logger from "../server/utils/logger";

// This promise resolved when the DB connection starts correctly and rejects if there is an error
const connectToDB = (connectionString: string | undefined): Promise<void> =>
  new Promise((resolve, reject) => {
    if (!connectionString) {
      reject(new Error("Missing CONN_STRING environment variable"));
      return;
    }

    // Only when configured, otherwise the system's DNS is used.
    const dnsServers = process.env.DNS_SERVERS;

    if (dnsServers) {
      setServers(dnsServers.split(",").map((server) => server.trim()));
    }

    logger.info("Connecting to database...");
    mongoose
      // Handing the driver "os" saves it a dynamic import(), which fails silently where it isn't
      // supported (Jest, some bundlers) and leaves the handshake without the metadata MongoDB requires.
      .connect(connectionString, { runtimeAdapters: { os } })
      .then(() => {
        logger.info("Connected to database");
        resolve(); // Resolve on correct connection
      })
      .catch((error) => {
        const newError = {
          ...error,
          message: `Database error: ${error.message}`,
        };
        reject(newError); // Reject with an error on failure
      });
  });

// These are global mongoose settings on JSON convert
mongoose.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    const json: Record<string, unknown> = ret;

    delete json._id;
    delete json.__v;
  },
});

export default connectToDB;
