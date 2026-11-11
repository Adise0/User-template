import { timingSafeEqual } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { getInvalidTokenError, getNoAuthHeaderError } from "../../../data/errorObjects/authErrors";
import { metricsRegistry } from "../../utils/metrics";

const isSameSecret = (received: string, expected: string): boolean => {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
};

// For Prometheus (or anything that reads its format). Only registered when METRICS_TOKEN is set,
// and the scraper has to send it as "Authorization: Bearer <METRICS_TOKEN>": route names, error
// rates and memory use are nobody else's business.
const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
  const headerAuth = req.header("Authorization");

  if (!headerAuth) {
    next(getNoAuthHeaderError());
    return;
  }

  if (!isSameSecret(headerAuth.replace("Bearer ", ""), process.env.METRICS_TOKEN ?? "")) {
    next(getInvalidTokenError());
    return;
  }

  try {
    res.set("Content-Type", metricsRegistry.contentType);
    res.send(await metricsRegistry.metrics());
  } catch (error) {
    next(error);
  }
};

export default getMetrics;
