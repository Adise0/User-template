import Users from "../../../database/models/Users";
import { UserDocument } from "../../../types/userTypes/DatabaseUserData";
import hashToken from "../auth/hashToken";
import { findTotpStep } from "./totp";
import { decryptTwoFactorSecret } from "./twoFactorSecret";

// Checks a code against the user's enabled 2FA and uses it up, in one atomic step each, so two
// requests can't both get through with the same code:
//  - An authenticator code is only accepted for a time step later than the last one used.
//  - A backup code is removed as it's accepted.
// Says which kind it was, or null if the code is wrong (or was already used).
const consumeTwoFactorCode = async (
  user: UserDocument,
  code: string,
): Promise<"totp" | "backup" | null> => {
  const { secret } = user.twoFactor;

  if (!secret) {
    return null;
  }

  if (/^\d{6}$/.test(code)) {
    const step = findTotpStep(decryptTwoFactorSecret(secret), code);

    if (step === null) {
      return null;
    }

    const accepted = await Users.updateOne(
      {
        _id: user._id,
        $or: [{ "twoFactor.lastUsedStep": { $lt: step } }, { "twoFactor.lastUsedStep": null }],
      },
      { $set: { "twoFactor.lastUsedStep": step } },
    );

    return accepted.modifiedCount > 0 ? "totp" : null;
  }

  const codeHash = hashToken(code);
  const accepted = await Users.updateOne(
    { _id: user._id, "twoFactor.backupCodes": codeHash },
    { $pull: { "twoFactor.backupCodes": codeHash } },
  );

  return accepted.modifiedCount > 0 ? "backup" : null;
};

export default consumeTwoFactorCode;
