import { NextFunction, Request, Response } from "express";
import { getValidationError } from "../../../data/errorObjects/dataValidationErrors";
import joiValidationOptions from "../../../data/joiObjects/joiValidationOptions";
import userListData from "../../../data/joiObjects/userListData";

const userListDataValidator = (req: Request, res: Response, next: NextFunction) => {
  // Use the userListData Joi object to validate the query. (This object is found in data/JoiObjects)
  const { error, value } = userListData.validate(req.query, joiValidationOptions);

  // If the validation fails write an error and go next.
  if (error) {
    next(getValidationError(error, "user list"));
    return;
  }

  // If the validation is correct we put the validated query in the res.locals
  res.locals.listQuery = value;
  next();
};

export default userListDataValidator;
