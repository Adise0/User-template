import express from "express";
import { endpoints } from "../../data/serverConfig/endpoints";
import getHealth from "../controllers/health/getHealth";
import method, { Methods } from "../middlewares/method";
import adminRouter from "./admin";
import authRouter from "./auth";
import usersRouter from "./users";

const mainRouter = express.Router();

mainRouter.all(endpoints.health.path, method(Methods.GET), getHealth);
mainRouter.use(endpoints.auth.path, authRouter);
mainRouter.use(endpoints.users.path, usersRouter);
mainRouter.use(endpoints.admin.path, adminRouter);

export default mainRouter;
