import express from "express";
import { endpoints } from "../../data/serverConfig/endpoints";
import sendToken from "../controllers/auth/sendToken";
import disableTwoFactor from "../controllers/twoFactor/disableTwoFactor";
import enableTwoFactor from "../controllers/twoFactor/enableTwoFactor";
import regenerateBackupCodes from "../controllers/twoFactor/regenerateBackupCodes";
import setupTwoFactor from "../controllers/twoFactor/setupTwoFactor";
import verifyTwoFactor from "../controllers/twoFactor/verifyTwoFactor";
import freshAuthValidator from "../middlewares/auth/freshAuthValidator";
import tokenValidator from "../middlewares/auth/tokenValidator";
import method, { Methods } from "../middlewares/method";
import { loginRateLimiter } from "../middlewares/rateLimiters";
import {
  twoFactorCodeDataValidator,
  twoFactorVerifyDataValidator,
} from "../middlewares/requestPayloadValidators/bodyValidators";

// Only mounted when twoFactorAuthEnabled is on (see routers/index.ts).
//
// Turning it on: POST /setup (shows the QR code), then POST /enable with a code from the app.
// Logging in: the login answers { twoFactorRequired, twoFactorToken } instead of a session, and
// POST /verify trades that token plus a code for it.
const twoFactorRouter = express.Router();

const routerEndpoints = endpoints.twoFactor;

// Anything that changes the second factor needs a session from a recent login.
const sensitive = [tokenValidator, freshAuthValidator];

twoFactorRouter.all(routerEndpoints.setup, method(Methods.POST), ...sensitive, setupTwoFactor);

twoFactorRouter.all(
  routerEndpoints.enable,
  method(Methods.POST),
  ...sensitive,
  twoFactorCodeDataValidator,
  enableTwoFactor,
);

twoFactorRouter.all(
  routerEndpoints.disable,
  method(Methods.POST),
  ...sensitive,
  twoFactorCodeDataValidator,
  disableTwoFactor,
);

twoFactorRouter.all(
  routerEndpoints.backupCodes,
  method(Methods.POST),
  ...sensitive,
  twoFactorCodeDataValidator,
  regenerateBackupCodes,
);

twoFactorRouter.all(
  routerEndpoints.verify,
  method(Methods.POST),
  loginRateLimiter,
  twoFactorVerifyDataValidator,
  verifyTwoFactor,
  sendToken,
);

export default twoFactorRouter;
