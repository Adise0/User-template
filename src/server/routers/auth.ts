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
import requestPasswordReset from "../controllers/auth/requestPasswordReset";
import resetPassword from "../controllers/auth/resetPassword";
import cancelPasswordReset from "../controllers/auth/cancelPasswordReset";
import resetPasswordDataValidator from "../middlewares/requestPayloadValidators/resetPasswordDataValidator";
import changePasswordDataValidator from "../middlewares/requestPayloadValidators/changePasswordDataValidator";
import freshAuthValidator from "../middlewares/auth/freshAuthValidator";
import changePassword from "../controllers/auth/changePassword";
import signOutEverywhere from "../controllers/auth/signOutEverywhere";
import deleteAccount from "../controllers/auth/deleteAccount";
import { emailRateLimiter, loginRateLimiter } from "../middlewares/rateLimiters";
import { TokenPurpose } from "../../types/authTypes/TokenPayload";

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
  loginRateLimiter,
  loginDataValidator,
  login,
  sendToken,
);

authRouter.all(routerEndpoints.refreshToken, method(Methods.GET), tokenValidator, sendToken);

authRouter.all(
  routerEndpoints.register,
  method(Methods.POST),
  emailRateLimiter,
  registrationDataValidator,
  createUser,
  resolveRegistrationConflict,
  registerUser,
);

authRouter.all(
  routerEndpoints.checkKeys,
  method(Methods.POST),
  keyCheckerDataValidator,
  duplicateKeyChecker,
);

authRouter.all(
  routerEndpoints.activate,
  method(Methods.POST),
  signedTokenDataValidator,
  signedIdTokenValidator(TokenPurpose.activation),
  activateUser,
  sendToken,
);

authRouter.all(
  routerEndpoints.cancelRegistration,
  method(Methods.POST),
  signedTokenDataValidator,
  signedIdTokenValidator(TokenPurpose.activation),
  cancelRegistration,
);

// DEBUG: lets the email links hit these directly via a plain GET, with no frontend page in
// between. Remove once a real frontend takes over calling the POST routes above.
authRouter.all(
  `${routerEndpoints.activate}/:token`,
  method(Methods.GET),
  tokenParamToBody,
  signedTokenDataValidator,
  signedIdTokenValidator(TokenPurpose.activation),
  activateUser,
  sendToken,
);

authRouter.all(
  `${routerEndpoints.cancelRegistration}/:token`,
  method(Methods.GET),
  tokenParamToBody,
  signedTokenDataValidator,
  signedIdTokenValidator(TokenPurpose.activation),
  cancelRegistration,
);

authRouter.all(
  routerEndpoints.resendActivation,
  method(Methods.POST),
  emailRateLimiter,
  emailOrUsernameDataValidator,
  resendActivation,
);

authRouter.all(
  routerEndpoints.requestOtp,
  method(Methods.POST),
  emailRateLimiter,
  emailOrUsernameDataValidator,
  requestOtp,
);

authRouter.all(
  routerEndpoints.revokeOtp,
  method(Methods.POST),
  signedTokenDataValidator,
  signedIdTokenValidator(TokenPurpose.otpRevoke),
  revokeOtp,
);

// DEBUG: see note above - plain GET variant for the email link until a frontend exists.
authRouter.all(
  `${routerEndpoints.revokeOtp}/:token`,
  method(Methods.GET),
  tokenParamToBody,
  signedTokenDataValidator,
  signedIdTokenValidator(TokenPurpose.otpRevoke),
  revokeOtp,
);

authRouter.all(
  routerEndpoints.requestPasswordReset,
  method(Methods.POST),
  emailRateLimiter,
  emailOrUsernameDataValidator,
  requestPasswordReset,
);

authRouter.all(
  routerEndpoints.resetPassword,
  method(Methods.POST),
  resetPasswordDataValidator,
  signedIdTokenValidator(TokenPurpose.passwordReset),
  resetPassword,
);

authRouter.all(
  routerEndpoints.cancelPasswordReset,
  method(Methods.POST),
  signedTokenDataValidator,
  signedIdTokenValidator(TokenPurpose.passwordReset),
  cancelPasswordReset,
);

// DEBUG: see note above - plain GET variant for the email link until a frontend exists.
// (No GET variant for resetPassword itself, since it needs the new password in the body.)
authRouter.all(
  `${routerEndpoints.cancelPasswordReset}/:token`,
  method(Methods.GET),
  tokenParamToBody,
  signedTokenDataValidator,
  signedIdTokenValidator(TokenPurpose.passwordReset),
  cancelPasswordReset,
);

// Sensitive actions on the logged in account: they need a fresh session (freshAuthValidator)
// instead of asking for the current password.
authRouter.all(
  routerEndpoints.changePassword,
  method(Methods.POST),
  tokenValidator,
  freshAuthValidator,
  changePasswordDataValidator,
  changePassword,
  sendToken,
);

authRouter.all(
  routerEndpoints.deleteAccount,
  method(Methods.DELETE),
  tokenValidator,
  freshAuthValidator,
  deleteAccount,
);

authRouter.all(
  routerEndpoints.signOutEverywhere,
  method(Methods.POST),
  tokenValidator,
  signOutEverywhere,
);

export default authRouter;
