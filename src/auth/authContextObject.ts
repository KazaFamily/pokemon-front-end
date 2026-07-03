import { createContext } from "react";

export interface AuthUser {
  sub: string;
  email?: string;
  name?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
  completeSignIn: (code: string, state: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
