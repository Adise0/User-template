import { NextFunction, Request, Response } from "express";
import { getInvalidLoginDataError } from "../../../data/errorObjects/dataValidationErrors";
import loginData from "../../../data/joiObjects/loginData";

const loginDataValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Options to tell Joi how to validate the payload
  const joiValidationOptions = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  };

  const { error, value } = loginData.validate(req.body, joiValidationOptions); // Use the loginData Joi object to validate the request body. (This object is found in data/JoiObjects)

  // If the validation fails write an error and go next.
  if (error) {
    const invalidLoginDataError = getInvalidLoginDataError(
      error.details.map((detail) => detail.message)
    );
    next(invalidLoginDataError);
    return;
  }

  // If the validation is correct we override the request body with the validated object and go next.
  req.body = value;
  next();
};

export default loginDataValidator;
