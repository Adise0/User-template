// Every token we sign is stamped with what it's for, and every validator checks it, so a token
// issued for one job (eg. an activation link) can never be replayed as another (eg. a session).
export enum TokenPurpose {
  session = "SESSION",
  activation = "ACTIVATION",
  otpRevoke = "OTPREVOKE",
  passwordReset = "PASSWORDRESET",
  emailChange = "EMAILCHANGE",
  oauthSignup = "OAUTHSIGNUP",
  twoFactorChallenge = "TWOFACTORCHALLENGE",
}

interface TokenPayload {
  purpose: TokenPurpose.session;
  id: string;
  tokenVersion: number;
  // Identifies this login. Carried over on refresh, so a single session can be signed out.
  sessionId: string;
  // Unix time (seconds) of the last real login (credentials or activation link). Carried over
  // unchanged on refresh, so it tells how "fresh" the session is.
  authTime: number;
  tokenRefreshTime: number;
}

// Generic shape for any signed, single-purpose link token (activation, cancel-registration, OTP-revoke, ...).
// The id identifies the user and the purpose says which kind of link it is. Each endpoint still compares the
// raw token against its own stored field, so only the latest link of each kind is valid.
export interface SignedIdTokenPayload {
  purpose: Exclude<
    TokenPurpose,
    TokenPurpose.session | TokenPurpose.oauthSignup | TokenPurpose.twoFactorChallenge
  >;
  id: string;
}

// Handed out on a first OAuth sign-in: the provider proved who the user is, but there's no account
// yet. Carries what the provider said, so completeSignup can create the account once the user has
// picked a username. Signed, so none of it can be changed on the way.
export interface OAuthSignupTokenPayload {
  purpose: TokenPurpose.oauthSignup;
  provider: string;
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

// Handed out instead of a session when the credentials were right but the account has 2FA on.
// challengeId ties it to the attempt counter stored on the user, so a new login starts it over.
export interface TwoFactorChallengeTokenPayload {
  purpose: TokenPurpose.twoFactorChallenge;
  id: string;
  challengeId: string;
}

export default TokenPayload;
