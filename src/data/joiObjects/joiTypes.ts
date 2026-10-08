/* eslint-disable import/prefer-default-export */

import Joi from "joi";

export const JoiObjectId = () => Joi.string().alphanum().length(24);
