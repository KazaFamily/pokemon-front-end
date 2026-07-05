import type { Battle, TcgAction, TcgBattle, TcgCard, TcgStarterDeck, Trainer } from "../types";
import type { TokenSet } from "../auth/tokenStore";
import { getIdToken, setTokens } from "../auth/tokenStore";
import { getStoredAuthUser, setStoredAuthUser } from "../auth/authUser";
import { setMyTrainerId } from "../lib/myTrainer";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// This app's login has no password - just a remembered trainer name - so an
// expired/missing ID token (Cognito's default TTL is short, and this SPA has
// no OAuth refresh flow) can be transparently "refreshed" by logging in again
// under the same name. Without this, a session that outlived the token (e.g.
// someone taking a while to hand-build a 60-card TCG deck) would silently
// stop sending an Authorization header at all, and API Gateway's JWT
// authorizer would reject every subsequent request with a bare Unauthorized.
async function reAuthenticate(): Promise<boolean> {
  const storedUser = getStoredAuthUser();
  if (!storedUser) return false;
  try {
    const { trainer, tokens } = await request<LoginResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ name: storedUser.name }),
    });
    setTokens({
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    });
    setMyTrainerId(trainer.trainerId);
    setStoredAuthUser({ trainerId: trainer.trainerId, name: trainer.name });
    return true;
  } catch {
    return false;
  }
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  if (!BASE_URL) {
    throw new Error(
      "VITE_API_BASE_URL is not set. The backend has not been configured yet - the app should be using the mock API client instead.",
    );
  }

  const token = getIdToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && !isRetry && path !== "/auth/login") {
    const reAuthed = await reAuthenticate();
    if (reAuthed) return request<T>(path, options, true);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface LoginResult {
  trainer: Trainer;
  tokens: Omit<TokenSet, "expiresAt"> & { expiresIn: number };
}

// Real backend-backed implementation of the API surface the app needs.
// Swap `src/api/index.ts` to point here once VITE_API_BASE_URL is live.
export const realApi = {
  // Login has no password of its own - typing an existing trainer's exact name logs
  // you in as them (creating them, with 20 random battle cards, on first login).
  login: (name: string) =>
    request<LoginResult>("/auth/login", { method: "POST", body: JSON.stringify({ name }) }),

  getTrainer: (trainerId: string) => request<Trainer>(`/trainers/${trainerId}`),

  setRoster: (trainerId: string, pokemonIds: number[]) =>
    request<{ trainerId: string; roster: Trainer["roster"] }>(`/trainers/${trainerId}/roster`, {
      method: "PUT",
      body: JSON.stringify({ pokemonIds }),
    }),

  rerollBattleCards: (trainerId: string) =>
    request<{ trainerId: string; battleCards: Trainer["battleCards"]; roster: Trainer["roster"] }>(
      `/trainers/${trainerId}/battle-cards/reroll`,
      { method: "POST" },
    ),

  createBattle: (trainer1Id: string, trainer2Id: string) =>
    request<Battle>("/battles", { method: "POST", body: JSON.stringify({ trainer1Id, trainer2Id }) }),

  getBattle: (battleId: string) => request<Battle>(`/battles/${battleId}`),

  submitMove: (battleId: string, trainerId: string, moveName: string) =>
    request<unknown>(`/battles/${battleId}/moves`, {
      method: "POST",
      body: JSON.stringify({ trainerId, moveName }),
    }),

  // TCG mode - independent dataset/engine, same auth pattern as above.
  setTcgDeck: (trainerId: string, cardIds: number[]) =>
    request<{ trainerId: string; deckSize: number }>(`/trainers/${trainerId}/tcg-deck`, {
      method: "PUT",
      body: JSON.stringify({ cardIds }),
    }),

  rerollTcgCards: (trainerId: string) =>
    request<{ trainerId: string; tcgCards: Trainer["tcgCards"]; tcgDeck: Trainer["tcgDeck"] }>(
      `/trainers/${trainerId}/tcg-cards/reroll`,
      { method: "POST" },
    ),

  createTcgBattle: (trainer1Id: string, trainer2Id: string) =>
    request<TcgBattle>("/tcg-battles", { method: "POST", body: JSON.stringify({ trainer1Id, trainer2Id }) }),

  getTcgBattle: (battleId: string) => request<TcgBattle>(`/tcg-battles/${battleId}`),

  listTcgCards: () => request<{ cards: TcgCard[] }>("/tcg-cards"),

  listTcgStarterDecks: () => request<{ starterDecks: TcgStarterDeck[] }>("/tcg-starter-decks"),

  submitTcgSetup: (battleId: string, trainerId: string, activeCardId: number, benchCardIds: number[]) =>
    request<unknown>(`/tcg-battles/${battleId}/setup`, {
      method: "POST",
      body: JSON.stringify({ trainerId, activeCardId, benchCardIds }),
    }),

  submitTcgAction: (battleId: string, trainerId: string, action: TcgAction) => {
    const { type, ...fields } = action;
    return request<{ message: string; log: string[]; winner: string | null; status: string; turnSide?: string; legalActions: TcgAction[] }>(
      `/tcg-battles/${battleId}/actions`,
      { method: "POST", body: JSON.stringify({ trainerId, action: type, ...fields }) },
    );
  },
};

export type Api = typeof realApi;
export { ApiError, BASE_URL };
