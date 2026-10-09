import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import { getUserNotFoundForIdError } from "../../../data/errorObjects/userErrors";

const getUser = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals;

  try {
    const foundUser = await Users.findById(userId).select("information");

    if (!foundUser) {
      const notFoundForIdError = getUserNotFoundForIdError(userId);
      next(notFoundForIdError);
      return;
    }

    res.json(foundUser);
  } catch (error) {
    next(error);
  }
};

export default getUser;
