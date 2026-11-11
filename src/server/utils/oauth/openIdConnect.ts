import { createPublicKey, JsonWebKeyInput, KeyObject } from "node:crypto";
import jwt, { JwtPayload } from "jsonwebtoken";

const fetchTimeoutInMs = 10 * 1000;
const jwksMaxAgeInMs = 60 * 60 * 1000; // Providers rotate their keys, but rarely.
const jwksMinRefetchInMs = 60 * 1000; // An unknown key id can't make us fetch more often than this.

interface CachedJwks {
  keys: Map<string, KeyObject>;
  fetchedAt: number;
}

const jwksCache = new Map<string, CachedJwks>();

const fetchJwks = async (jwksUri: string): Promise<CachedJwks> => {
  const response = await fetch(jwksUri, { signal: AbortSignal.timeout(fetchTimeoutInMs) });

  if (!response.ok) {
    throw new Error(`JWKS request failed with ${response.status}`);
  }

  const { keys } = (await response.json()) as {
    keys: (JsonWebKeyInput["key"] & { kid: string })[];
  };
  const cached = {
    keys: new Map(keys.map((key) => [key.kid, createPublicKey({ key, format: "jwk" })])),
    fetchedAt: Date.now(),
  };

  jwksCache.set(jwksUri, cached);
  return cached;
};

// The provider's public key that signed a token. Cached, and fetched again when it's old or when a
// token names a key we don't have yet (the provider rotated them).
const getSigningKey = async (jwksUri: string, keyId: string): Promise<KeyObject> => {
  let cached = jwksCache.get(jwksUri);
  const age = cached ? Date.now() - cached.fetchedAt : Infinity;

  if (!cached || age > jwksMaxAgeInMs || (!cached.keys.has(keyId) && age > jwksMinRefetchInMs)) {
    cached = await fetchJwks(jwksUri);
  }

  const key = cached.keys.get(keyId);

  if (!key) {
    throw new Error("ID token signed with an unknown key");
  }

  return key;
};

interface CodeExchangeRequest {
  tokenEndpoint: string;
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
  codeVerifier?: string;
}

// Trades an authorization code for the provider's ID token (the signed JWT that says who the user is).
export const exchangeCodeForIdToken = async (request: CodeExchangeRequest): Promise<string> => {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: request.code,
    redirect_uri: request.redirectUri,
    client_id: request.clientId,
    client_secret: request.clientSecret,
    ...(request.codeVerifier && { code_verifier: request.codeVerifier }),
  });

  const response = await fetch(request.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
    signal: AbortSignal.timeout(fetchTimeoutInMs),
  });

  if (!response.ok) {
    throw new Error(`Code exchange refused with ${response.status}`);
  }

  const { id_token: idToken } = (await response.json()) as { id_token?: string };

  if (!idToken) {
    throw new Error("Code exchange answered without an ID token");
  }

  return idToken;
};

interface IdTokenCheck {
  jwksUri: string;
  issuers: [string, ...string[]];
  clientId: string;
  nonce: string;
}

// Checks an ID token the way OpenID Connect requires: signed by the provider's current key, issued
// by the provider, for this app, not expired, and carrying the nonce the frontend generated for this
// sign-in (so a token from another sign-in can't be replayed here).
export const verifyIdToken = async (idToken: string, check: IdTokenCheck): Promise<JwtPayload> => {
  const decoded = jwt.decode(idToken, { complete: true });
  const keyId = decoded?.header.kid;

  if (!keyId) {
    throw new Error("ID token without a key id");
  }

  const key = await getSigningKey(check.jwksUri, keyId);
  const payload = jwt.verify(idToken, key, {
    algorithms: ["RS256"],
    issuer: check.issuers,
    audience: check.clientId,
  }) as JwtPayload;

  if (payload.nonce !== check.nonce) {
    throw new Error("ID token nonce mismatch");
  }

  if (!payload.sub) {
    throw new Error("ID token without a subject");
  }

  return payload;
};
