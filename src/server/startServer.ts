import debug from "debug";
import { Application } from "express";
import ServerError from "../types/errorTypes/ServerError";

const debugInConsole = debug("podrida:server"); // Debug section setup

// This promise resolved when the server correctly starts and rejects if there is an error
const startServer = (port: string, app: Application): Promise<void> =>
  new Promise((resolve, reject) => {
    const newPort = +port;
    const server = app.listen(newPort, () => {
      const portString: string = newPort === 80 ? "" : `:${newPort}`;
      debugInConsole(`Server listening on http://localhost${portString}`);
      resolve(); // Resolve on correct server startup
    });

    server.on("error", (error: ServerError) => {
      const messageString =
        error.code === "EADDRINUSE" ? ` Port ${port} in use` : error.message; // Handle the common EADDRINUSE error wit h a more readable message or leave the default error message

      const errorMessage = `Couldn't start the server. ${messageString}`;
      reject(new Error(errorMessage)); // Reject with an error on server startup failiure
    });
  });

export default startServer;
