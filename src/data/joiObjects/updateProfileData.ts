import Joi from "joi";
import { JoiName, JoiPicture, JoiUsername } from "./joiTypes";

// Every field is optional, but at least one has to be sent.
const updateProfileData = Joi.object({
  firstName: JoiName(),
  lastName: JoiName(),
  username: JoiUsername(),
  picture: JoiPicture().allow(null), // null removes the picture.
})
  .min(1)
  .messages({
    "object.min": "Nothing to update",
  });

export default updateProfileData;
