import { NextFunction, Request, Response } from "express";
import { getValidationError } from "../../../data/errorObjects/dataValidationErrors";
import joiValidationOptions from "../../../data/joiObjects/joiValidationOptions";
import keyCheckerData from "../../../data/joiObjects/keyCheckerData";

const keyCheckerDataValidator = (req: Request, res: Response, next: NextFunction) => {
  // Use the keyCheckerData Joi object to validate the request body. (This object is found in data/JoiObjects)
  const { error, value } = keyCheckerData.validate(req.body, joiValidationOptions);

  // If the validation fails write an error and go next.
  if (error) {
    next(getValidationError(error, "key check"));
    return;
  }

  // If the validation is correct we put the validated keys in the res.locals
  res.locals = value;
  next();
};

export default keyCheckerDataValidator;
