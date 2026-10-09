import { NextFunction, Request, Response } from "express";
import { rateLimit, RateLimitInfo } from "express-rate-limit";
import { getTooManyRequestsError } from "../../data/errorObjects/authErrors";
import {
  authRateLimitWindowInMinutes,
  emailRateLimitMax,
  loginRateLimitMax,
} from "../../data/serverConfig/server-config";

// Per-IP limiters. They key on req.ip, so if the server runs behind a proxy/load balancer,
// app.set("trust proxy", ...) has to be configured or every client will share the proxy's IP.
const buildRateLimiter = (limit: number) =>
  rateLimit({
    windowMs: authRateLimitWindowInMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    // Route the rejection through our own error handler so it looks like every other error, and
    // tell the frontend how long until this IP's window resets.
    handler: (req: Request, _res: Response, next: NextFunction) => {
      const { resetTime } = (req as Request & { rateLimit?: RateLimitInfo }).rateLimit ?? {};
      const retryAfterSeconds = resetTime
        ? Math.max(0, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
        : authRateLimitWindowInMinutes * 60;

      next(getTooManyRequestsError(retryAfterSeconds));
    },
  });

// Guards password/OTP guessing.
export const loginRateLimiter = buildRateLimiter(loginRateLimitMax);

// Guards every endpoint that sends an email, so they can't be used to flood an inbox.
export const emailRateLimiter = buildRateLimiter(emailRateLimitMax);
