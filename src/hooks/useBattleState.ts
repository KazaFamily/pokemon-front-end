import { useEffect, useState } from "react";
import { api } from "../api";
import type { Battle } from "../types";

const POLL_INTERVAL_MS = 1500;

interface UseBattleStateResult {
  battle: Battle | null;
  error: string | null;
  isLoading: boolean;
  refresh: () => void;
}

/**
 * Polls GET /battles/{id} on an interval while the battle is active.
 * All battle-state fetching is isolated here so swapping to a push-based
 * transport (WebSocket/SSE) later only requires changing this hook's internals,
 * not any of its callers.
 */
export function useBattleState(battleId: string | null): UseBattleStateResult {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!battleId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const result = await api.getBattle(battleId as string);
        if (cancelled) return;
        setBattle(result);
        setError(null);
        setIsLoading(false);
        if (result.status !== "finished") {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load battle state");
        setIsLoading(false);
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [battleId, refreshTick]);

  return {
    battle: battleId ? battle : null,
    error: battleId ? error : null,
    isLoading: battleId ? isLoading : false,
    refresh: () => setRefreshTick((t) => t + 1),
  };
}
