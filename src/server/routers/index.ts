import express from "express";
import { endpoints } from "../../data/serverConfig/endpoints";
import authRouter from "./auth";
import usersRouter from "./users";

const mainRouter = express.Router();

mainRouter.use(endpoints.auth.path, authRouter);
mainRouter.use(endpoints.users.path, usersRouter);

export default mainRouter;
