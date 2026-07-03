import { useCallback, useMemo, useState, type ReactNode } from "react";
import { api } from "../api";
import { clearTokens, setTokens } from "./tokenStore";
import { setMyTrainerId, clearMyTrainerId } from "../lib/myTrainer";
import { AuthContext, type AuthContextValue, type AuthUser } from "./authContextObject";

const USER_STORAGE_KEY = "pokemon.auth.user";

function loadStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);

  const signIn = useCallback(async (name: string) => {
    const { trainer, tokens } = await api.login(name);
    setTokens({
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    });
    setMyTrainerId(trainer.trainerId);
    const authUser: AuthUser = { trainerId: trainer.trainerId, name: trainer.name };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const signOut = useCallback(() => {
    clearTokens();
    clearMyTrainerId();
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: Boolean(user), isLoading: false, signIn, signOut }),
    [user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
