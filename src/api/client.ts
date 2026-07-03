import type { Battle, PokemonSpecies, Trainer } from "../types";
import { getAccessToken } from "../auth/tokenStore";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!BASE_URL) {
    throw new Error(
      "VITE_API_BASE_URL is not set. The backend has not been configured yet - the app should be using the mock API client instead.",
    );
  }

  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// Real backend-backed implementation of the API surface the app needs.
// Swap `src/api/index.ts` to point here once VITE_API_BASE_URL is live.
export const realApi = {
  listPokemon: () => request<PokemonSpecies[]>("/pokemon"),

  createTrainer: (name: string) =>
    request<Trainer>("/trainers", { method: "POST", body: JSON.stringify({ name }) }),

  getTrainer: (trainerId: string) => request<Trainer>(`/trainers/${trainerId}`),

  setTrainerRoster: (trainerId: string, pokemonIds: string[]) =>
    request<Trainer>(`/trainers/${trainerId}/roster`, {
      method: "PUT",
      body: JSON.stringify({ pokemonIds }),
    }),

  createBattle: (trainerId: string, opponentTrainerId: string) =>
    request<Battle>("/battles", {
      method: "POST",
      body: JSON.stringify({ trainerId, opponentTrainerId }),
    }),

  getBattle: (battleId: string) => request<Battle>(`/battles/${battleId}`),

  submitMove: (battleId: string, trainerId: string, moveId: string) =>
    request<Battle>(`/battles/${battleId}/moves`, {
      method: "POST",
      body: JSON.stringify({ trainerId, moveId }),
    }),

  healthCheck: () => request<{ ok: boolean }>("/health"),
};

export type Api = typeof realApi;
export { ApiError, BASE_URL };
