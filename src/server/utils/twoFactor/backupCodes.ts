import { randomInt } from "node:crypto";
import { charactersOTP, twoFactorBackupCodeCount } from "../../../data/serverConfig/server-config";
import hashToken from "../auth/hashToken";

const backupCodeLength = 10; // ~50 bits each with the OTP alphabet, plenty for a one-time code.

// Fresh backup codes for a user who loses their authenticator. The plain codes are shown once, only
// their hashes are stored (SHA-256 is enough, they're random), and each one works a single time.
const generateBackupCodes = (): { codes: string[]; hashes: string[] } => {
  const codes = Array.from({ length: twoFactorBackupCodeCount }, () =>
    Array.from({ length: backupCodeLength }, () =>
      charactersOTP.charAt(randomInt(charactersOTP.length)),
    ).join(""),
  );

  return { codes, hashes: codes.map(hashToken) };
};

export default generateBackupCodes;
