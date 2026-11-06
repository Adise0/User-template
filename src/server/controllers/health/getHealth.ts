import { Request, Response } from "express";
import mongoose from "mongoose";

// For uptime monitors and load balancers: 200 while the API can really serve requests, 503 if it
// has lost the database.
const getHealth = (_req: Request, res: Response) => {
  const isDatabaseConnected =
    mongoose.connection.readyState === mongoose.ConnectionStates.connected;

  res.status(isDatabaseConnected ? 200 : 503).json({
    status: isDatabaseConnected ? "ok" : "unavailable",
    database: isDatabaseConnected ? "connected" : "disconnected",
  });
};

export default getHealth;
