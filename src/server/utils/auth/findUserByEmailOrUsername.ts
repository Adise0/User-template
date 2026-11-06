import Users from "../../../database/models/Users";

// Looks a user up by an identifier that can be either their email or their username. Both are
// stored lowercased in the credentials, so the lookup is case-insensitive.
const findUserByEmailOrUsername = async (identifier: string) => {
  const normalizedIdentifier = identifier.toLowerCase();

  const foundByEmail = await Users.findOne({
    "credentials.email": normalizedIdentifier,
  });

  if (foundByEmail) {
    return foundByEmail;
  }

  return Users.findOne({ "credentials.username": normalizedIdentifier });
};

export default findUserByEmailOrUsername;
