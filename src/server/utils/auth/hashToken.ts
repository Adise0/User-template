import { createHash } from "node:crypto";

// Email link tokens are stored hashed, so a database leak doesn't hand out working links. SHA-256
// and not hashPassword: these tokens are already long and random, and bcrypt only reads the first
// 72 bytes, which two JWTs for the same user and purpose can share, so old links would still match.
const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

export default hashToken;
