// Options to tell Joi how to validate a payload, shared by every request payload validator.
const joiValidationOptions = {
  abortEarly: false,
  allowUnknown: true,
  stripUnknown: true,
};

export default joiValidationOptions;
