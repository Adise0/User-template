import Joi from "joi";
import { JoiPassword } from "./joiTypes";

const changePasswordData = Joi.object({
  password: JoiPassword().required().messages({
    "any.required": "Missing password",
  }),
  signOutOtherSessions: Joi.boolean().default(false),
});

export default changePasswordData;
