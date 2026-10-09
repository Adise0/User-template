import Joi from "joi";

const keyCheckerData = Joi.object({
  email: Joi.string().email().lowercase().messages({
    "string.email": "Invalid email",
  }),
  username: Joi.string(),
});

export default keyCheckerData;
