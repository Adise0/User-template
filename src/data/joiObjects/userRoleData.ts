import Joi from "joi";
import UserRole from "../../types/userTypes/UserRole";

// SUPERUSER is left out on purpose, it can only be set directly in the database.
const userRoleData = Joi.object({
  role: Joi.string().valid(UserRole.user, UserRole.admin).required().messages({
    "any.required": "Missing role",
  }),
});

export default userRoleData;
