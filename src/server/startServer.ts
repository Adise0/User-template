import { Server } from "node:http";
import { Application } from "express";
import logger from "./utils/logger";

// This promise resolves with the server when it correctly starts and rejects if there is an error
const startServer = (port: string, app: Application): Promise<Server> =>
  new Promise((resolve, reject) => {
    const newPort = +port;
    const server = app.listen(newPort, () => {
      const portString: string = newPort === 80 ? "" : `:${newPort}`;
      logger.info(`Server listening on http://localhost${portString}`);
      resolve(server); // Resolve on correct server startup
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      const messageString = error.code === "EADDRINUSE" ? ` Port ${port} in use` : error.message; // Handle the common EADDRINUSE error with a more readable message or leave the default error message

      const errorMessage = `Couldn't start the server. ${messageString}`;
      reject(new Error(errorMessage)); // Reject with an error on server startup failure
    });
  });

export default startServer;
