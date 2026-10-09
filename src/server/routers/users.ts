import express from "express";
import { endpoints } from "../../data/serverConfig/endpoints";
import tokenValidator from "../middlewares/auth/tokenValidator";
import getMyUser from "../controllers/users/getMyUser";
import getUser from "../controllers/users/getUser";
import getUserDataValidator from "../middlewares/requestPayloadValidators/getUserDataValidator";
import method, { Methods } from "../middlewares/method";

// Router creation
const usersRouter = express.Router();

// "routerEndpoints" is used here for clarity, you can also directly import "userEndpoints".
const routerEndpoints = endpoints.users;

// Router endpoint chain

// This router is completley protected
usersRouter.use(tokenValidator);

usersRouter.all(routerEndpoints.myUser, method(Methods.GET), getMyUser);
usersRouter.all(
  routerEndpoints.getUser,
  method(Methods.GET),
  getUserDataValidator,
  getUser
);

export default usersRouter;
