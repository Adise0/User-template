import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import { getUserNotFoundForIdError } from "../../../data/errorObjects/userErrors";

const getMyUser = async (req: Request, res: Response, next: NextFunction) => {
  const myUserId = res.locals.userId;

  try {
    const foundUser = await Users.findById(myUserId).select("information");

    if (!foundUser) {
      const notFoundForIdError = getUserNotFoundForIdError(myUserId);
      next(notFoundForIdError);
      return;
    }

    res.json(foundUser);
  } catch (error) {
    next(error);
  }
};

export default getMyUser;
