import Joi from "joi";

const loginData = Joi.object({
  email: Joi.string().required().messages({
    "any.required": "Missing username or email",
  }),
  password: Joi.string(),
  withOtp: Joi.boolean(),
});

export default loginData;
