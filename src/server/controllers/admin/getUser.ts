import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import { getUserNotFoundForIdError } from "../../../data/errorObjects/userErrors";
import adminUserFields from "./adminUserFields";

const getUser = async (_req: Request, res: Response, next: NextFunction) => {
  const { requestedUserId } = res.locals;

  try {
    const foundUser = await Users.findById(requestedUserId).select(adminUserFields);

    if (!foundUser) {
      next(getUserNotFoundForIdError(requestedUserId));
      return;
    }

    res.json(foundUser);
  } catch (error) {
    next(error);
  }
};

export default getUser;
