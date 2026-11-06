import Joi from "joi";
import { JoiUsername } from "./joiTypes";

const keyCheckerData = Joi.object({
  email: Joi.string().email().lowercase().messages({
    "string.email": "Invalid email",
  }),
  username: JoiUsername().lowercase(),
})
  .or("email", "username")
  .messages({
    "object.missing": "Missing email or username",
  });

export default keyCheckerData;
