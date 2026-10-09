import Joi from "joi";
import { JoiPassword } from "./joiTypes";

const registrationData = Joi.object({
  firstName: Joi.string().required().messages({
    "any.required": "Missing Fist name",
  }),
  lastName: Joi.string().required().messages({
    "any.required": "Missing Last name",
  }),
  picture: Joi.string().messages({
    "any.required": "Missing Picture link",
  }),
  username: Joi.string().required().messages({
    "any.required": "Missing username",
  }),
  password: JoiPassword().required().messages({
    "any.required": "Missing password",
  }),

  // Lowercased so "Foo@x.com" and "foo@x.com" can't end up as two separate accounts.
  email: Joi.string().email().lowercase().required().messages({
    "string.email": "Invalid email",
    "any.required": "Missing email",
  }),
});

export default registrationData;
