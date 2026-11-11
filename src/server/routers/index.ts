import express from "express";
import { endpoints } from "../../data/serverConfig/endpoints";
import { twoFactorAuthEnabled } from "../../data/serverConfig/server-config";
import getHealth from "../controllers/health/getHealth";
import getMetrics from "../controllers/health/getMetrics";
import method, { Methods } from "../middlewares/method";
import adminRouter from "./admin";
import authRouter from "./auth";
import oauthRouter from "./oauth";
import twoFactorRouter from "./twoFactor";
import usersRouter from "./users";

const mainRouter = express.Router();

mainRouter.all(endpoints.health.path, method(Methods.GET), getHealth);

// Without a METRICS_TOKEN the endpoint doesn't exist at all (404), so nothing is exposed by default.
if (process.env.METRICS_TOKEN) {
  mainRouter.all(endpoints.metrics.path, method(Methods.GET), getMetrics);
}

// The more specific /auth/... routers go first, so their paths never reach the auth router.
mainRouter.use(endpoints.oauth.path, oauthRouter);

// With 2FA switched off in the config the endpoints don't exist (404).
if (twoFactorAuthEnabled) {
  mainRouter.use(endpoints.twoFactor.path, twoFactorRouter);
}

mainRouter.use(endpoints.auth.path, authRouter);
mainRouter.use(endpoints.users.path, usersRouter);
mainRouter.use(endpoints.admin.path, adminRouter);

export default mainRouter;
