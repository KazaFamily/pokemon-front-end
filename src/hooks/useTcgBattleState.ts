import { useEffect, useState } from "react";
import { api } from "../api";
import type { TcgBattle } from "../types";

const POLL_INTERVAL_MS = 1500;

interface UseTcgBattleStateResult {
  battle: TcgBattle | null;
  error: string | null;
  isLoading: boolean;
}

/** Polls GET /tcg-battles/{id} on an interval while the battle is active, mirroring useBattleState. */
export function useTcgBattleState(battleId: string | null): UseTcgBattleStateResult {
  const [battle, setBattle] = useState<TcgBattle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!battleId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const result = await api.getTcgBattle(battleId as string);
        if (cancelled) return;
        setBattle(result);
        setError(null);
        setIsLoading(false);
        if (result.status !== "complete") {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load TCG battle state");
        setIsLoading(false);
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [battleId]);

  return { battle: battleId ? battle : null, error: battleId ? error : null, isLoading: battleId ? isLoading : false };
}
