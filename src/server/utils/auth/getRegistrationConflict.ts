import Users from "../../../database/models/Users";
import { DuplicatedKeys } from "../../../data/errorObjects/userErrors";
import {
  registrationRetryCooldownInSeconds,
  userActivationExpirationInMinutes,
} from "../../../data/serverConfig/server-config";
import getSecondsSince from "./getSecondsSince";

// Answers "would /register accept these keys?", for both /register and /checkKeys, so they can
// never disagree. An active account always blocks its keys. A pending one is replaceable if:
//  - It has the same email: the same person retrying an abandoned signup (only the owner of the
//    email can activate either way). The retry still has to wait for the cooldown.
//  - Its activation link expired. Until then its username stays taken for anyone with a different
//    email, so a stranger can't delete someone else's signup.
const getRegistrationConflict = async (email?: string, username?: string) => {
  const usersWithKeysFound = await Users.find({
    $or: [{ "credentials.email": email || "" }, { "credentials.username": username || "" }],
  });

  const duplicatedKeys: DuplicatedKeys = { email: false, username: false };
  const replaceableUsers: typeof usersWithKeysFound = [];
  let cooldownSecondsRemaining = 0;

  usersWithKeysFound.forEach((userFound) => {
    const secondsSinceSent = getSecondsSince(userFound.activationLastSentAt);
    const isSameEmail = userFound.credentials.email === email;
    const isLinkExpired = secondsSinceSent >= userActivationExpirationInMinutes * 60;

    if (!userFound.activatedAt && (isSameEmail || isLinkExpired)) {
      replaceableUsers.push(userFound);

      if (isSameEmail) {
        cooldownSecondsRemaining = Math.max(
          0,
          registrationRetryCooldownInSeconds - secondsSinceSent,
        );
      }

      return;
    }

    duplicatedKeys.email = duplicatedKeys.email || isSameEmail;
    duplicatedKeys.username =
      duplicatedKeys.username || userFound.credentials.username === username;
  });

  return {
    hasDuplicates: duplicatedKeys.email || duplicatedKeys.username,
    duplicatedKeys,
    replaceableUsers,
    cooldownSecondsRemaining,
  };
};

export default getRegistrationConflict;
