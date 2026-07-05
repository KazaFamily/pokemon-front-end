// Shared with client.ts (for silent re-login on session expiry) as well as
// AuthContext - isolated here so neither has to reach into the other.
import type { AuthUser } from "./authContextObject";

const STORAGE_KEY = "pokemon.auth.user";

export function getStoredAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredAuthUser(user: AuthUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredAuthUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}
