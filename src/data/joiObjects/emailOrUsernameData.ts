import Joi from "joi";

const emailOrUsernameData = Joi.object({
  email: Joi.string().required().messages({
    "any.required": "Missing username or email",
  }),
});

export default emailOrUsernameData;
