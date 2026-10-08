import express from "express";
import { endpoints } from "../../data/serverConfig/endpoints";
import tokenValidator from "../middlewares/auth/tokenValidator";
import getMyUser from "../controllers/users/getMyUser";
import getUser from "../controllers/users/getUser";
import getUserDataValidator from "../middlewares/requestPayloadValidators/getUserDataValidator";

// Router creation
const usersRouter = express.Router();

// "routerEndpoints" is used here for clarity, you can also directly import "userEndpoints".
const routerEndpoints = endpoints.users;

// Router endpoint chain

// This router is completley protected
usersRouter.use(tokenValidator);
usersRouter.get(routerEndpoints.myUser, getMyUser);
usersRouter.get(routerEndpoints.getUser, getUserDataValidator, getUser);

export default usersRouter;
