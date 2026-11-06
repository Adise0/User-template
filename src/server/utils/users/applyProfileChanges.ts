import { UserDocument } from "../../../types/userTypes/DatabaseUserData";

interface ProfileChanges {
  firstName?: string;
  lastName?: string;
  picture?: string | null;
  username?: string;
}

// Applies a validated profile edit, shared by a user editing themselves and an admin editing them.
// Only the fields sent change. Only mutates the document, the caller is responsible for saving it.
const applyProfileChanges = (user: UserDocument, changes: ProfileChanges) => {
  const { firstName, lastName, picture, username } = changes;

  if (firstName !== undefined) {
    user.set("information.firstName", firstName);
  }

  if (lastName !== undefined) {
    user.set("information.lastName", lastName);
  }

  // Sending null removes the picture.
  if (picture !== undefined) {
    user.set("information.picture", picture ?? undefined);
  }

  // Same as on registration: the casing is kept for display, the login key is lowercased.
  if (username !== undefined) {
    user.set("information.username", username);
    user.set("credentials.username", username.toLowerCase());
  }
};

export default applyProfileChanges;
