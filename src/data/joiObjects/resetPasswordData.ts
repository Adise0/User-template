import Joi from "joi";
import { JoiPassword } from "./joiTypes";

const resetPasswordData = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Missing token",
  }),
  password: JoiPassword().required().messages({
    "any.required": "Missing password",
  }),
});

export default resetPasswordData;
