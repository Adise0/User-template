// The secret every token is signed with. Failing loudly here beats signing with a missing secret.
const getTokenSecret = (): string => {
  const tokenSecret = process.env.TOKEN_SECRET;

  if (!tokenSecret) {
    throw new Error("Missing TOKEN_SECRET environment variable");
  }

  return tokenSecret;
};

export default getTokenSecret;
