import { NextFunction, Request, Response } from "express";
import { httpRequestDuration } from "../utils/metrics";

// Times every request and records it once the response is sent. The route label is left in
// res.locals.metricsRoute by the method() guard every route starts with, anything that never
// reached a route (404s, broken JSON...) is counted as "unmatched".
const metrics = (req: Request, res: Response, next: NextFunction) => {
  const endTimer = httpRequestDuration.startTimer();

  res.on("finish", () => {
    endTimer({
      method: req.method,
      route: res.locals.metricsRoute ?? "unmatched",
      status_code: String(res.statusCode),
    });
  });

  next();
};

export default metrics;
