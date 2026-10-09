import { NextFunction, Request, Response } from "express";
import { getValidationError } from "../../../data/errorObjects/dataValidationErrors";
import emailOrUsernameData from "../../../data/joiObjects/emailOrUsernameData";

// Shared by every endpoint that just needs to look a user up by email or username
// (requestOtp, resendActivation, ...).
const emailOrUsernameDataValidator = (req: Request, res: Response, next: NextFunction) => {
  // Options to tell Joi how to validate the payload
  const joiValidationOptions = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  };

  // Use the emailOrUsernameData Joi object to validate the request body. (This object is found in data/JoiObjects)
  const { error, value } = emailOrUsernameData.validate(req.body, joiValidationOptions);

  // If the validation fails write an error and go next.
  if (error) {
    next(getValidationError(error, "email/username"));
    return;
  }

  // If the validation is correct we override the request body with the validated object and go next.
  req.body = value;

  next();
};

export default emailOrUsernameDataValidator;
