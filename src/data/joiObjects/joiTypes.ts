import Joi from "joi";

export const JoiObjectId = () => Joi.string().alphanum().length(24);

// bcrypt silently ignores everything past the first 72 bytes of a password, so anything longer
// is rejected up front instead of being truncated without the user knowing.
export const JoiPassword = () =>
  Joi.string().min(8).max(72, "utf8").messages({
    "string.min": "Password must have at lease 8 characters",
    "string.max": "Password is too long",
  });
