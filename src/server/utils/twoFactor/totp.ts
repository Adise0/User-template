import { createHmac, randomBytes } from "node:crypto";

// Time-based one-time passwords (RFC 6238), the 6 digit codes of Google Authenticator, Authy,
// 1Password... Implemented here because it's a few lines on top of node:crypto.

const stepInSeconds = 30;
const digits = 6;
const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const toBase32 = (buffer: Buffer): string => {
  let bits = "";
  buffer.forEach((byte) => {
    bits += byte.toString(2).padStart(8, "0");
  });

  let output = "";
  for (let i = 0; i < bits.length; i += 5) {
    output += base32Alphabet[parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)];
  }

  return output;
};

const fromBase32 = (text: string): Buffer => {
  let bits = "";
  [...text.replace(/=+$/, "").toUpperCase()].forEach((char) => {
    bits += base32Alphabet.indexOf(char).toString(2).padStart(5, "0");
  });

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
};

// A new secret, in base32 (the format authenticator apps take). 160 bits, as RFC 4226 recommends.
export const generateTotpSecret = (): string => toBase32(randomBytes(20));

export const getCurrentTotpStep = (now = Date.now()): number =>
  Math.floor(now / 1000 / stepInSeconds);

export const getTotpCode = (secret: string, step: number): string => {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));

  const hmac = createHmac("sha1", fromBase32(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf; // eslint-disable-line no-bitwise
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff; // eslint-disable-line no-bitwise

  return String(binary % 10 ** digits).padStart(digits, "0");
};

// Which time step a code belongs to, or null if it's wrong. One step either way is accepted, so a
// phone clock a little off (or a code typed just as it changed) still works.
export const findTotpStep = (secret: string, code: string, now = Date.now()): number | null => {
  const currentStep = getCurrentTotpStep(now);

  const matchingStep = [currentStep - 1, currentStep, currentStep + 1].find(
    (step) => getTotpCode(secret, step) === code,
  );

  return matchingStep ?? null;
};

// What the QR code holds. Authenticator apps show the issuer and the account name next to the code.
export const getOtpAuthUrl = (secret: string, issuer: string, accountName: string): string => {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({ secret, issuer, digits: String(digits), period: "30" });

  return `otpauth://totp/${label}?${params}`;
};
