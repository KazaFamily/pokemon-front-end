import { useCallback, useMemo, useState, type ReactNode } from "react";
import { api } from "../api";
import { clearTokens, setTokens } from "./tokenStore";
import { setMyTrainerId, clearMyTrainerId } from "../lib/myTrainer";
import { getStoredAuthUser, setStoredAuthUser, clearStoredAuthUser } from "./authUser";
import { AuthContext, type AuthContextValue, type AuthUser } from "./authContextObject";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredAuthUser);

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
    setStoredAuthUser(authUser);
    setUser(authUser);
  }, []);

  const signOut = useCallback(() => {
    clearTokens();
    clearMyTrainerId();
    clearStoredAuthUser();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: Boolean(user), isLoading: false, signIn, signOut }),
    [user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
