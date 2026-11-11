import Joi from "joi";
import { JoiName, JoiUsername } from "./joiTypes";

// Every field is optional, but at least one has to be sent.
const updateProfileData = Joi.object({
  firstName: JoiName(),
  lastName: JoiName(),
  username: JoiUsername(),
})
  .min(1)
  .messages({
    "object.min": "Nothing to update",
  });

export default updateProfileData;
