import { NextFunction, Request, Response } from "express";
import { getInvalidKeyCheckData } from "../../../data/errorObjects/dataValidationErrors";
import keyCheckerData from "../../../data/joiObjects/keyCheckerData";

const keyCheckerDataValidator = (
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
  const { error, value } = keyCheckerData.validate(
    req.body,
    joiValidationOptions
  );

  // If the validation fails write an error and go next.
  if (error) {
    const detailsString = error.details.map((detail) => detail.message);
    const invalidKeyCheckData = getInvalidKeyCheckData(detailsString);

    next(invalidKeyCheckData);
    return;
  }

  // If the validation is correct we put the validated Id in the res.locals
  res.locals = value;
  res.locals.goNext = false;
  next();
};

export default keyCheckerDataValidator;
