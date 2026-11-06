import express from "express";
import { endpoints } from "../../data/serverConfig/endpoints";
import tokenValidator from "../middlewares/auth/tokenValidator";
import getMyUser from "../controllers/users/getMyUser";
import updateMyUser from "../controllers/users/updateMyUser";
import { updateProfileDataValidator } from "../middlewares/requestPayloadValidators/bodyValidators";
import method, { Methods } from "../middlewares/method";

// Router creation
const usersRouter = express.Router();

// "routerEndpoints" is used here for clarity, you can also directly import "userEndpoints".
const routerEndpoints = endpoints.users;

// Router endpoint chain

// This router is completely protected
usersRouter.use(tokenValidator);

// One path with two verbs: the guard goes on .all(), each verb then has its own chain.
usersRouter
  .route(routerEndpoints.myUser)
  .all(method(Methods.GET, Methods.PATCH))
  .get(getMyUser)
  .patch(updateProfileDataValidator, updateMyUser);

export default usersRouter;
