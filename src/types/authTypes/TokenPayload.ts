// Every token we sign is stamped with what it's for, and every validator checks it, so a token
// issued for one job (eg. an activation link) can never be replayed as another (eg. a session).
export enum TokenPurpose {
  session = "SESSION",
  activation = "ACTIVATION",
  otpRevoke = "OTPREVOKE",
  passwordReset = "PASSWORDRESET",
}

interface TokenPayload {
  purpose: TokenPurpose.session;
  id: string;
  tokenVersion: number;
  // Unix time (seconds) of the last real login (credentials or activation link). Carried over
  // unchanged on refresh, so it tells how "fresh" the session is.
  authTime: number;
  tokenRefreshTime: number;
}

// Generic shape for any signed, single-purpose link token (activation, cancel-registration, OTP-revoke, ...).
// The id identifies the user and the purpose says which kind of link it is. Each endpoint still compares the
// raw token against its own stored field, so only the latest link of each kind is valid.
export interface SignedIdTokenPayload {
  purpose: Exclude<TokenPurpose, TokenPurpose.session>;
  id: string;
}

export default TokenPayload;
