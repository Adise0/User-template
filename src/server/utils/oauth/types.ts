// What a provider tells us about the user once the sign-in checks out.
export interface OAuthIdentity {
  provider: string;
  providerId: string; // The provider's stable id for the user ("sub"). Never changes, unlike the email.
  email: string; // Lowercased.
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
}

export interface AuthorizationUrlParams {
  state: string;
  nonce: string;
  codeChallenge?: string;
}

export interface CodeExchangeParams {
  code: string;
  nonce: string;
  codeVerifier?: string;
}

// One sign-in provider. Add your own by implementing this and registering it in
// oauth/providers/index.ts (see the README).
export interface OAuthProvider {
  name: string;

  // Whether the .env has what this provider needs. An unconfigured provider answers 404.
  isConfigured: () => boolean;

  // Whether the frontend has to send a PKCE code challenge/verifier.
  supportsPkce: boolean;

  // Whether the provider POSTs its callback as a form (Apple does) instead of redirecting with the
  // code in the URL. The backend then receives it and passes it on to the frontend.
  usesFormPostCallback: boolean;

  // Where the provider sends the user back to. Has to be registered with the provider as is.
  getRedirectUri: () => string;

  getAuthorizationUrl: (params: AuthorizationUrlParams) => string;

  // Trades the code for the user's identity. Throws if anything doesn't check out.
  getIdentity: (params: CodeExchangeParams) => Promise<OAuthIdentity>;
}
