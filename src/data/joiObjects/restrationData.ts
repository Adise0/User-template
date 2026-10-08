import Joi from "joi";

const registrationData = Joi.object({
  firstName: Joi.string().required().messages({
    "any.required": "Missing Fist name",
  }),
  lastName: Joi.string().required().messages({
    "any.required": "Missing Last name",
  }),
  picture: Joi.string().required().messages({
    "any.required": "Missing Picture link",
  }),
  username: Joi.string().required().messages({
    "any.required": "Missing username",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must have at lease 8 characters",
    "string.required": "Missing password",
  }),

  email: Joi.string().email().required().messages({
    "string.email": "Invalid email",
    "string.required": "Missing email",
  }),
});

export default registrationData;
