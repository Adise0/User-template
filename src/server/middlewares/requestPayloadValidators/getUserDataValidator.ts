import { NextFunction, Request, Response } from "express";
import { getInvalidGetUserDataError } from "../../../data/errorObjects/dataValidationErrors";
import getUserData from "../../../data/joiObjects/getUserData";

const getUserDataValidator = (
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

  // Use the registrationData Joi object to validate the request body. (This object is found in data/JoiObjects)
  const { error, value } = getUserData.validate(
    req.params,
    joiValidationOptions
  );

  // If the validation fails write an error and go next.
  if (error) {
    const detailsString = error.details.map((detail) => detail.message);
    const invalidGetUserDataError = getInvalidGetUserDataError(detailsString);

    next(invalidGetUserDataError);
    return;
  }

  // If the validation is correct we put the validated Id in the res.locals
  res.locals.userId = value.userId;
  next();
};

export default getUserDataValidator;
