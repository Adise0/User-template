import Users from "../../../database/models/Users";

// Looks a user up by an identifier that can be either their email or their username. Emails are
// stored lowercased, so the email lookup is case-insensitive, usernames are matched as typed.
const findUserByEmailOrUsername = async (identifier: string) => {
  const foundByEmail = await Users.findOne({
    "credentials.email": identifier.toLowerCase(),
  });

  if (foundByEmail) {
    return foundByEmail;
  }

  return Users.findOne({ "credentials.username": identifier });
};

export default findUserByEmailOrUsername;
