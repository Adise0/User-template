import { isIP } from "node:net";
import Joi, { CustomHelpers } from "joi";

const validateIpList = (value: string, helpers: CustomHelpers) =>
  value.split(",").every((ip) => isIP(ip.trim())) ? value : helpers.error("any.invalid");

const validateUrlList = (value: string, helpers: CustomHelpers) =>
  value.split(",").every((url) => URL.canParse(url.trim())) ? value : helpers.error("any.invalid");

const envSchema = Joi.object({
  CONN_STRING: Joi.string().required(),
  TOKEN_SECRET: Joi.string().min(32).required(),
  SMTP_HOST: Joi.string().hostname().required(),
  SMTP_PORT: Joi.number().port(),
  EMAIL: Joi.string().required(),
  EMAIL_PASSWORD: Joi.string().required(),
  EMAIL_ALIAS: Joi.string(),
  FRONTEND_URL: Joi.string().uri().required(),
  BACKEND_URL: Joi.string().uri().required(),
  CORS_ORIGINS: Joi.string().custom(validateUrlList),
  DNS_SERVERS: Joi.string().custom(validateIpList),
  PORT: Joi.number().port(),
  LOG_LEVEL: Joi.string().valid("fatal", "error", "warn", "info", "debug", "trace", "silent"),
});

// Runs once at startup, so a missing or broken variable stops the server right away and says which
// one it is, instead of surfacing later as a failed request.
const validateEnv = () => {
  const { error } = envSchema.validate(process.env, { abortEarly: false, allowUnknown: true });

  if (error) {
    const messages = error.details.map((detail) => detail.message);
    throw new Error(`Invalid environment: ${messages.join(", ")}`);
  }
};

export default validateEnv;
