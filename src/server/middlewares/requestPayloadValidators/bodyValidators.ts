import { NextFunction, Request, Response } from "express";
import { ObjectSchema } from "joi";
import { getValidationError } from "../../../data/errorObjects/dataValidationErrors";
import changePasswordData from "../../../data/joiObjects/changePasswordData";
import emailChangeData from "../../../data/joiObjects/emailChangeData";
import emailOrUsernameData from "../../../data/joiObjects/emailOrUsernameData";
import joiValidationOptions from "../../../data/joiObjects/joiValidationOptions";
import loginData from "../../../data/joiObjects/loginData";
import { oauthSignupData } from "../../../data/joiObjects/oauthData";
import { twoFactorCodeData, twoFactorVerifyData } from "../../../data/joiObjects/twoFactorData";
import registrationData from "../../../data/joiObjects/registrationData";
import resetPasswordData from "../../../data/joiObjects/resetPasswordData";
import signedTokenData from "../../../data/joiObjects/signedTokenData";
import updateProfileData from "../../../data/joiObjects/updateProfileData";
import userRoleData from "../../../data/joiObjects/userRoleData";

// Builds a validator for the plain case: validate req.body and put the clean result back in
// req.body. A validator belongs here only if that's all it does - one that reads from somewhere
// else or leaves data anywhere else (eg. res.locals) gets its own file in this folder.
const bodyValidator =
  (schema: ObjectSchema, payloadName: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, joiValidationOptions);

    // If the validation fails write an error and go next.
    if (error) {
      next(getValidationError(error, payloadName));
      return;
    }

    // If the validation is correct we override the request body with the validated object and go next.
    req.body = value;
    next();
  };

export const changePasswordDataValidator = bodyValidator(changePasswordData, "change password");
export const emailChangeDataValidator = bodyValidator(emailChangeData, "email change");
export const emailOrUsernameDataValidator = bodyValidator(emailOrUsernameData, "email/username");
export const loginDataValidator = bodyValidator(loginData, "login");
export const registrationDataValidator = bodyValidator(registrationData, "registration");
export const resetPasswordDataValidator = bodyValidator(resetPasswordData, "reset password");
export const signedTokenDataValidator = bodyValidator(signedTokenData, "token");
export const updateProfileDataValidator = bodyValidator(updateProfileData, "update profile");
export const userRoleDataValidator = bodyValidator(userRoleData, "user role");
export const oauthSignupDataValidator = bodyValidator(oauthSignupData, "OAuth signup");
export const twoFactorCodeDataValidator = bodyValidator(twoFactorCodeData, "two-factor code");
export const twoFactorVerifyDataValidator = bodyValidator(twoFactorVerifyData, "two-factor verify");
