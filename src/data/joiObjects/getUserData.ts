import Joi from "joi";
import { JoiObjectId } from "./joiTypes";

const getUserData = Joi.object({
  userId: JoiObjectId().message("Invalid user id"),
});

export default getUserData;
