// Minimal session-scoped token storage, isolated so the rest of the app
// (and the API client) doesn't need to know the storage mechanism.

export interface TokenSet {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
}

const STORAGE_KEY = "pokemon.auth.tokens";

export function getTokens(): TokenSet | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TokenSet;
  } catch {
    return null;
  }
}

export function setTokens(tokens: TokenSet): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearTokens(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getAccessToken(): string | null {
  const tokens = getTokens();
  if (!tokens) return null;
  if (Date.now() >= tokens.expiresAt) return null;
  return tokens.accessToken;
}
