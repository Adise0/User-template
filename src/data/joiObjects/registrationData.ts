import Joi from "joi";
import { JoiName, JoiPassword, JoiUsername } from "./joiTypes";

const registrationData = Joi.object({
  firstName: JoiName().required().messages({
    "any.required": "Missing First name",
  }),
  lastName: JoiName().required().messages({
    "any.required": "Missing Last name",
  }),
  username: JoiUsername().required().messages({
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
