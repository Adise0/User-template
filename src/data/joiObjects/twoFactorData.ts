import Joi from "joi";

// A 6 digit code from the authenticator app, or one of the backup codes. Spaces and dashes are
// dropped, so "123 456" and "ABCD-EFGH-JK" work as typed.
const JoiTwoFactorCode = () =>
  Joi.string()
    .replace(/[\s-]/g, "")
    .uppercase()
    .pattern(/^(\d{6}|[A-Z0-9]{10})$/)
    .messages({
      "string.pattern.base": "Invalid code",
    });

export const twoFactorCodeData = Joi.object({
  code: JoiTwoFactorCode().required().messages({
    "any.required": "Missing code",
  }),
});

export const twoFactorVerifyData = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Missing token",
  }),
  code: JoiTwoFactorCode().required().messages({
    "any.required": "Missing code",
  }),
});
