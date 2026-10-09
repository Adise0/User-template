import Joi from "joi";

const keyCheckerData = Joi.object({
  email: Joi.string().email().messages({
    "string.email": "Invalid email",
  }),
  username: Joi.string(),
});

export default keyCheckerData;
