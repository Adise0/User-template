import Joi from "joi";
import UserRole from "../../types/userTypes/UserRole";
import { adminUserListMaxLimit } from "../serverConfig/server-config";

const userListData = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(adminUserListMaxLimit).default(20),
  search: Joi.string().trim().max(100), // Start of an email or username.
  role: Joi.string().valid(...Object.values(UserRole)),
  isDisabled: Joi.boolean(),
  isActivated: Joi.boolean(),
});

export default userListData;
