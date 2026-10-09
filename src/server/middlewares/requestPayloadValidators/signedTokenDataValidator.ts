import { NextFunction, Request, Response } from "express";
import { getInvalidTokenBodyError } from "../../../data/errorObjects/dataValidationErrors";
import signedTokenData from "../../../data/joiObjects/signedTokenData";

// Shared by every endpoint that takes a single signed link token in the body
// (activate, cancelRegistration, revokeOtp, ...).
const signedTokenDataValidator = (
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

  // Use the signedTokenData Joi object to validate the request body. (This object is found in data/JoiObjects)
  const { error, value } = signedTokenData.validate(
    req.body,
    joiValidationOptions
  );

  // If the validation fails write an error and go next.
  if (error) {
    const detailsString = error.details.map((detail) => detail.message);
    const invalidTokenBodyError = getInvalidTokenBodyError(detailsString);

    next(invalidTokenBodyError);
    return;
  }

  // If the validation is correct we override the request body with the validated object and go next.
  req.body = value;

  next();
};

export default signedTokenDataValidator;
