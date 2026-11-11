import { OAuthProvider } from "../types";
import apple from "./apple";
import google from "./google";

// Every sign-in provider the API knows. To add one (GitHub, Microsoft...), write a file like
// google.ts implementing OAuthProvider and add it here. Each one only switches on when its .env
// variables are set.
const oauthProviders: OAuthProvider[] = [google, apple];

export const getConfiguredOAuthProviders = (): OAuthProvider[] =>
  oauthProviders.filter((provider) => provider.isConfigured());

export const getConfiguredOAuthProvider = (name: string): OAuthProvider | undefined =>
  getConfiguredOAuthProviders().find((provider) => provider.name === name);
