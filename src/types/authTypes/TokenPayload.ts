interface TokenPayload {
  tokenRefreshTime: number;
  id: string;
  tokenVersion: number;
}

// Generic shape for any signed, single-purpose link token (activation, cancel-registration, OTP-revoke, ...).
// The id alone identifies the user; which action it authorizes is determined by the endpoint it's sent to
// and which stored token field it's checked against, not by anything in the payload itself.
export interface SignedIdTokenPayload {
  id: string;
}

export default TokenPayload;
