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
import activateUser from "../controllers/auth/activateUser";
import cancelRegistration from "../controllers/auth/cancelRegistration";
import resendActivation from "../controllers/auth/resendActivation";
import emailOrUsernameDataValidator from "../middlewares/requestPayloadValidators/emailOrUsernameDataValidator";
import requestOtp from "../controllers/auth/requestOtp";
import revokeOtp from "../controllers/auth/revokeOtp";

// Router creation
const authRouter = express.Router();

// "routerEndpoints" is used here for clarity, you can also directly import "authEndpoints".
const routerEndpoints = endpoints.auth;

// Router endpoint chain

authRouter.post(routerEndpoints.login, loginDataValidator, login, sendToken);
authRouter.get(routerEndpoints.refreshToken, tokenValidator, sendToken);
authRouter.post(
  routerEndpoints.register,
  registrationDataValidator,
  createUser,
  duplicateKeyChecker,
  registerUser
);

authRouter.post(
  routerEndpoints.checkKeys,
  keyCheckerDataValidator,
  duplicateKeyChecker
);

authRouter.post(
  routerEndpoints.activate,
  signedTokenDataValidator,
  signedIdTokenValidator,
  activateUser,
  sendToken
);

authRouter.post(
  routerEndpoints.cancelRegistration,
  signedTokenDataValidator,
  signedIdTokenValidator,
  cancelRegistration
);

authRouter.post(
  routerEndpoints.resendActivation,
  emailOrUsernameDataValidator,
  resendActivation
);

authRouter.post(
  routerEndpoints.requestOtp,
  emailOrUsernameDataValidator,
  requestOtp
);

authRouter.post(
  routerEndpoints.revokeOtp,
  signedTokenDataValidator,
  signedIdTokenValidator,
  revokeOtp
);

export default authRouter;
