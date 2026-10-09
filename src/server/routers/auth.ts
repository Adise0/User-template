import express from "express";
import login from "../middlewares/auth/login";
import sendToken from "../controllers/auth/sendToken";
import tokenValidator from "../middlewares/auth/tokenValidator";
import loginDataValidator from "../middlewares/requestPayloadValidators/loginDataValidator";
import { endpoints } from "../../data/serverConfig/endpoints";
import registrationDataValidator from "../middlewares/requestPayloadValidators/registrationDataValidator";
import registerUser from "../controllers/auth/registerUser";
import createUser from "../middlewares/auth/userCreator";
import duplicateKeyChecker from "../middlewares/auth/duplicateKeyChecker";
import resolveRegistrationConflict from "../middlewares/auth/resolveRegistrationConflict";
import keyCheckerDataValidator from "../middlewares/requestPayloadValidators/keyCheckerDataValidator";
import signedTokenDataValidator from "../middlewares/requestPayloadValidators/signedTokenDataValidator";
import signedIdTokenValidator from "../middlewares/auth/signedIdTokenValidator";
import tokenParamToBody from "../middlewares/auth/tokenParamToBody";
import activateUser from "../controllers/auth/activateUser";
import cancelRegistration from "../controllers/auth/cancelRegistration";
import resendActivation from "../controllers/auth/resendActivation";
import emailOrUsernameDataValidator from "../middlewares/requestPayloadValidators/emailOrUsernameDataValidator";
import requestOtp from "../controllers/auth/requestOtp";
import revokeOtp from "../controllers/auth/revokeOtp";
import method, { Methods } from "../middlewares/method";

// Router creation
const authRouter = express.Router();

// "routerEndpoints" is used here for clarity, you can also directly import "authEndpoints".
const routerEndpoints = endpoints.auth;

// Router endpoint chain
//
// Every route is registered with .all() (exact path, any method) with the method() guard
// placed first - so hitting a real endpoint with the wrong verb returns a clear 405 "this
// endpoint only accepts X" instead of Express falling through to the generic 404 handler.
// (.use() was considered, but it does PREFIX matching - "/activate" would also swallow
// "/activate/:token" below - so .all() is the right primitive here, not .use().)

authRouter.all(
  routerEndpoints.login,
  method(Methods.POST),
  loginDataValidator,
  login,
  sendToken
);

authRouter.all(
  routerEndpoints.refreshToken,
  method(Methods.GET),
  tokenValidator,
  sendToken
);

authRouter.all(
  routerEndpoints.register,
  method(Methods.POST),
  registrationDataValidator,
  createUser,
  resolveRegistrationConflict,
  registerUser
);

authRouter.all(
  routerEndpoints.checkKeys,
  method(Methods.POST),
  keyCheckerDataValidator,
  duplicateKeyChecker
);

authRouter.all(
  routerEndpoints.activate,
  method(Methods.POST),
  signedTokenDataValidator,
  signedIdTokenValidator,
  activateUser,
  sendToken
);

authRouter.all(
  routerEndpoints.cancelRegistration,
  method(Methods.POST),
  signedTokenDataValidator,
  signedIdTokenValidator,
  cancelRegistration
);

// DEBUG: lets the email links hit these directly via a plain GET, with no frontend page in
// between. Remove once a real frontend takes over calling the POST routes above.
authRouter.all(
  `${routerEndpoints.activate}/:token`,
  method(Methods.GET),
  tokenParamToBody,
  signedTokenDataValidator,
  signedIdTokenValidator,
  activateUser,
  sendToken
);

authRouter.all(
  `${routerEndpoints.cancelRegistration}/:token`,
  method(Methods.GET),
  tokenParamToBody,
  signedTokenDataValidator,
  signedIdTokenValidator,
  cancelRegistration
);

authRouter.all(
  routerEndpoints.resendActivation,
  method(Methods.POST),
  emailOrUsernameDataValidator,
  resendActivation
);

authRouter.all(
  routerEndpoints.requestOtp,
  method(Methods.POST),
  emailOrUsernameDataValidator,
  requestOtp
);

authRouter.all(
  routerEndpoints.revokeOtp,
  method(Methods.POST),
  signedTokenDataValidator,
  signedIdTokenValidator,
  revokeOtp
);

// DEBUG: see note above - plain GET variant for the email link until a frontend exists.
authRouter.all(
  `${routerEndpoints.revokeOtp}/:token`,
  method(Methods.GET),
  tokenParamToBody,
  signedTokenDataValidator,
  signedIdTokenValidator,
  revokeOtp
);

export default authRouter;
