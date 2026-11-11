import { Algorithm } from "jsonwebtoken";

// The only algorithm tokens are accepted with. jsonwebtoken signs with it by default, and pinning it
// on verify means a token claiming any other algorithm (eg. "none") is refused outright.
export const tokenAlgorithm: Algorithm = "HS256";

// The secret every token is signed with. Failing loudly here beats signing with a missing secret.
const getTokenSecret = (): string => {
  const tokenSecret = process.env.TOKEN_SECRET;

  if (!tokenSecret) {
    throw new Error("Missing TOKEN_SECRET environment variable");
  }

  return tokenSecret;
};

export default getTokenSecret;
