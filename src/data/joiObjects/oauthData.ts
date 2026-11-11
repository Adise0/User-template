import Joi from "joi";
import { JoiName, JoiUsername } from "./joiTypes";

// state and nonce are random values the frontend generates for each sign-in (at least 128 bits,
// eg. crypto.randomUUID() or 16 random bytes in base64url) and keeps until the provider sends the user back.
const JoiOAuthRandom = () =>
  Joi.string()
    .min(16)
    .max(512)
    .pattern(/^[\w.~-]+$/);

// PKCE (RFC 7636): the verifier is 43 to 128 characters, the challenge its SHA-256 in base64url.
const JoiCodeVerifier = () =>
  Joi.string()
    .min(43)
    .max(128)
    .pattern(/^[\w.~-]+$/);

// Validated with { context: { pkce } }: the challenge is required for providers that support PKCE.
export const oauthAuthorizationUrlData = Joi.object({
  state: JoiOAuthRandom().required(),
  nonce: JoiOAuthRandom().required(),
  codeChallenge: Joi.string()
    .length(43)
    .pattern(/^[\w-]+$/)
    .when("$pkce", { is: true, then: Joi.required() }),
});

// Same idea for the code: a PKCE provider needs the verifier that goes with the challenge.
const JoiCodeVerifierForProvider = () =>
  JoiCodeVerifier().when("$pkce", { is: true, then: Joi.required() });

// Sent once the provider has sent the user back with a code. firstName/lastName are only used to
// pre-fill a first-time signup (Apple sends the name to the frontend, never in the token).
export const oauthCodeData = Joi.object({
  code: Joi.string().max(2048).required(),
  nonce: JoiOAuthRandom().required(),
  codeVerifier: JoiCodeVerifierForProvider(),
  firstName: JoiName(),
  lastName: JoiName(),
});

export const oauthSignupData = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Missing token",
  }),
  username: JoiUsername().required().messages({
    "any.required": "Missing username",
  }),
  firstName: JoiName(),
  lastName: JoiName(),
});
