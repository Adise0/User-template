import { NextFunction, Request, Response } from "express";
import { getValidationError } from "../../../data/errorObjects/dataValidationErrors";
import getUserData from "../../../data/joiObjects/getUserData";
import joiValidationOptions from "../../../data/joiObjects/joiValidationOptions";

const getUserDataValidator = (req: Request, res: Response, next: NextFunction) => {
  // Use the getUserData Joi object to validate the request params. (This object is found in data/JoiObjects)
  const { error, value } = getUserData.validate(req.params, joiValidationOptions);

  // If the validation fails write an error and go next.
  if (error) {
    next(getValidationError(error, "get user"));
    return;
  }

  // If the validation is correct we put the validated Id in the res.locals. Kept apart from
  // res.locals.userId, which is the logged in user left by the tokenValidator.
  res.locals.requestedUserId = value.userId;
  next();
};

export default getUserDataValidator;
