import Joi from "joi";

const emailChangeData = Joi.object({
  email: Joi.string().email().lowercase().required().messages({
    "string.email": "Invalid email",
    "any.required": "Missing email",
  }),
});

export default emailChangeData;
