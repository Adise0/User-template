import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import getTokenSecret from "../auth/getTokenSecret";

// TOTP secrets have to be read back to check codes, so they can't be hashed like the rest. They're
// encrypted instead (AES-256-GCM), so a database leak alone doesn't hand out working 2FA. The key
// is derived from TOKEN_SECRET, so there's no other variable to manage. Changing TOKEN_SECRET makes
// the stored secrets unreadable: every user with 2FA would have to be reset (see the admin endpoint).
// Derived on first use and kept, it's the same for the life of the process. Sync on purpose: HKDF is
// a couple of HMACs, far cheaper than a trip through the thread pool.
let key: Buffer | undefined;

const getKey = (): Buffer => {
  // eslint-disable-next-line n/no-sync
  key ??= Buffer.from(hkdfSync("sha256", getTokenSecret(), "", "two-factor-secret", 32));
  return key;
};

export const encryptTwoFactorSecret = (secret: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);

  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64")).join(".");
};

export const decryptTwoFactorSecret = (stored: string): string => {
  const [iv, authTag, encrypted] = stored.split(".").map((part) => Buffer.from(part, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
};
