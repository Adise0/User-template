import Joi from "joi";

const resetPasswordData = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Missing token",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must have at lease 8 characters",
    "any.required": "Missing password",
  }),
});

export default resetPasswordData;
