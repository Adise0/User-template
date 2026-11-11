import Joi from "joi";

const signedTokenData = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Missing token",
  }),
});

export default signedTokenData;
