import jwt from "jsonwebtoken";

// Reads the "iat" (issued-at) claim jsonwebtoken stamps on every signed token by default, and
// returns how many seconds ago that was. Used to throttle retries (eg. registration,
// resend-activation) without needing a separate "last sent at" field that could drift out of
// sync with the token itself. Only ever called on tokens we ourselves issued and stored, so
// signature verification isn't needed here - decoding the payload is enough.
const getTokenAgeInSeconds = (token: string): number => {
  const payload = jwt.decode(token) as { iat?: number } | null;

  if (!payload?.iat) {
    return Infinity;
  }

  return Math.floor(Date.now() / 1000) - payload.iat;
};

export default getTokenAgeInSeconds;
