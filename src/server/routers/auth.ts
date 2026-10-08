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
import keyCheckerDataValidator from "../middlewares/requestPayloadValidators/keyCheckerDataValidator";

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

export default authRouter;
