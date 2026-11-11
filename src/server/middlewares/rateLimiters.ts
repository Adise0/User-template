import { NextFunction, Request, Response } from "express";
import { rateLimit, RateLimitInfo } from "express-rate-limit";
import { getTooManyRequestsError } from "../../data/errorObjects/authErrors";
import {
  accountLoginFailureLimitMax,
  authRateLimitWindowInMinutes,
  emailRateLimitMax,
  keyCheckRateLimitMax,
  loginRateLimitMax,
} from "../../data/serverConfig/server-config";

// Route the rejection through our own error handler so it looks like every other error, and tell
// the frontend how long until the window resets.
const rateLimitHandler = (req: Request, _res: Response, next: NextFunction) => {
  const { resetTime } = (req as Request & { rateLimit?: RateLimitInfo }).rateLimit ?? {};
  const retryAfterSeconds = resetTime
    ? Math.max(0, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
    : authRateLimitWindowInMinutes * 60;

  next(getTooManyRequestsError(retryAfterSeconds));
};

// Per-IP limiters. They key on req.ip, so if the server runs behind a proxy/load balancer,
// app.set("trust proxy", ...) has to be configured or every client will share the proxy's IP.
// The counts live in memory, see SECURITY_SETTINGS.md for running more than one instance.
const buildRateLimiter = (limit: number) =>
  rateLimit({
    windowMs: authRateLimitWindowInMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: rateLimitHandler,
  });

// Guards password/OTP guessing.
export const loginRateLimiter = buildRateLimiter(loginRateLimitMax);

// Guards password guessing spread over many IPs, which the per-IP limiter can't see. Keyed on the
// identifier sent (so it goes after loginDataValidator) and only failed logins count, so the owner
// logging in normally never uses it up. No RateLimit headers: they'd only help an attacker pace
// themselves. Trade-off in SECURITY_SETTINGS.md.
export const accountLoginRateLimiter = rateLimit({
  windowMs: authRateLimitWindowInMinutes * 60 * 1000,
  limit: accountLoginFailureLimitMax,
  standardHeaders: false,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => `account:${String(req.body.email).toLowerCase()}`,
  handler: rateLimitHandler,
});

// Guards every endpoint that sends an email, so they can't be used to flood an inbox.
export const emailRateLimiter = buildRateLimiter(emailRateLimitMax);

// Guards checkKeys, which would otherwise allow testing which emails and usernames are registered.
export const keyCheckRateLimiter = buildRateLimiter(keyCheckRateLimitMax);
