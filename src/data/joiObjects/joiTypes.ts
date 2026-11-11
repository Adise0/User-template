import Joi from "joi";
import { nameMaxLength, usernameMaxLength, usernameMinLength } from "../serverConfig/server-config";

export const JoiObjectId = () => Joi.string().hex().length(24);

// bcrypt silently ignores everything past the first 72 bytes of a password, so anything longer
// is rejected up front instead of being truncated without the user knowing.
export const JoiPassword = () =>
  Joi.string().min(8).max(72, "utf8").messages({
    "string.min": "Password must have at least 8 characters",
    "string.max": "Password is too long",
  });

// Rejected rather than sanitized, so the username is always exactly what the user typed. The
// allowed characters also keep it from looking like an email, a URL or a phone number, since it
// ends up in email subjects.
export const JoiUsername = () =>
  Joi.string()
    .min(usernameMinLength)
    .max(usernameMaxLength)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .messages({
      "string.min": `Username must have at least ${usernameMinLength} characters`,
      "string.max": `Username can't have more than ${usernameMaxLength} characters`,
      "string.pattern.base": "Username can only have letters, numbers, _ and -",
    });

// Trimmed first, so a name made only of spaces counts as empty.
export const JoiName = () => Joi.string().trim().max(nameMaxLength);
