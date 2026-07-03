// Decodes JWT claims for display purposes only. The frontend never verifies
// signatures - that's the backend's job whenever it trusts a bearer token.
export function decodeJwtClaims<T = Record<string, unknown>>(token: string): T | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as T;
  } catch {
    return null;
  }
}
