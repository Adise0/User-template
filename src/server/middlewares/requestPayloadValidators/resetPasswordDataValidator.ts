import { NextFunction, Request, Response } from "express";
import { getInvalidResetPasswordDataError } from "../../../data/errorObjects/dataValidationErrors";
import resetPasswordData from "../../../data/joiObjects/resetPasswordData";

const resetPasswordDataValidator = (
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

  // Use the resetPasswordData Joi object to validate the request body. (This object is found in data/JoiObjects)
  const { error, value } = resetPasswordData.validate(
    req.body,
    joiValidationOptions
  );

  // If the validation fails write an error and go next.
  if (error) {
    const detailsString = error.details.map((detail) => detail.message);
    const invalidResetPasswordDataError =
      getInvalidResetPasswordDataError(detailsString);

    next(invalidResetPasswordDataError);
    return;
  }

  // If the validation is correct we override the request body with the validated object and go next.
  req.body = value;

  next();
};

export default resetPasswordDataValidator;
