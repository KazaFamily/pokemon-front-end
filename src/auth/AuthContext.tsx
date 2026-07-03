import { useCallback, useMemo, useState, type ReactNode } from "react";
import { cognitoConfig, hostedUiAuthorizeUrl, hostedUiLogoutUrl, hostedUiTokenUrl, isCognitoConfigured } from "./cognitoConfig";
import { generateCodeChallenge, generateCodeVerifier, generateState } from "./pkce";
import { clearTokens, getTokens, setTokens, type TokenSet } from "./tokenStore";
import { decodeJwtClaims } from "./jwt";
import { AuthContext, type AuthContextValue, type AuthUser } from "./authContextObject";

const PKCE_VERIFIER_KEY = "pokemon.auth.pkce_verifier";
const PKCE_STATE_KEY = "pokemon.auth.pkce_state";

function userFromTokens(tokens: TokenSet): AuthUser | null {
  const claims = decodeJwtClaims<{ sub: string; email?: string; name?: string }>(tokens.idToken);
  if (!claims) return null;
  return { sub: claims.sub, email: claims.email, name: claims.name };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const tokens = getTokens();
    return tokens ? userFromTokens(tokens) : null;
  });

  const signIn = useCallback(async () => {
    if (!isCognitoConfigured) {
      throw new Error("Cognito is not configured yet - set VITE_COGNITO_* env vars.");
    }
    const verifier = generateCodeVerifier();
    const state = generateState();
    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
    sessionStorage.setItem(PKCE_STATE_KEY, state);
    const challenge = await generateCodeChallenge(verifier);
    window.location.assign(hostedUiAuthorizeUrl(challenge, state));
  }, []);

  const completeSignIn = useCallback(async (code: string, state: string) => {
    const expectedState = sessionStorage.getItem(PKCE_STATE_KEY);
    const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
    if (!verifier || !expectedState || expectedState !== state) {
      throw new Error("Invalid auth state - please sign in again.");
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: cognitoConfig.clientId!,
      code,
      redirect_uri: cognitoConfig.redirectUri,
      code_verifier: verifier,
    });

    const res = await fetch(hostedUiTokenUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as {
      access_token: string;
      id_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    const tokens: TokenSet = {
      accessToken: data.access_token,
      idToken: data.id_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    setTokens(tokens);
    setUser(userFromTokens(tokens));

    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    sessionStorage.removeItem(PKCE_STATE_KEY);
  }, []);

  const signOut = useCallback(() => {
    clearTokens();
    setUser(null);
    if (isCognitoConfigured) {
      window.location.assign(hostedUiLogoutUrl());
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading: false,
      isConfigured: isCognitoConfigured,
      signIn,
      signOut,
      completeSignIn,
    }),
    [user, signIn, signOut, completeSignIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
