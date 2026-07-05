import { useCallback, useEffect, useRef, useState } from "react";
import { getIdToken } from "../auth/tokenStore";
import { getMyTrainerId } from "../lib/myTrainer";
import type {
  LobbyClientMessage,
  LobbyMemberView,
  LobbyMode,
  LobbyServerMessage,
  LobbyStatus,
} from "../types";

const WS_URL = import.meta.env.VITE_LOBBY_WS_URL as string | undefined;
const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000];

export interface IncomingChallenge {
  challengeId: string;
  from: { trainerId: string; name: string };
  expiresAt: number;
}

export interface LobbyMatch {
  battleId: string;
  mode: LobbyMode;
}

export interface NeedsSetup {
  mode: LobbyMode;
  opponentTrainerId: string;
  opponentName: string;
}

interface UseLobbySocketResult {
  isConnected: boolean;
  self: { status: LobbyStatus; autoMatch: boolean } | null;
  members: LobbyMemberView[];
  incomingChallenge: IncomingChallenge | null;
  matched: LobbyMatch | null;
  needsSetup: NeedsSetup | null;
  error: string | null;
  setAutoMatch: (autoMatch: boolean) => void;
  challenge: (targetTrainerId: string) => void;
  acceptChallenge: (challengeId: string) => void;
  declineChallenge: (challengeId: string) => void;
  cancelChallenge: (challengeId: string) => void;
}

/**
 * Owns the lobby WebSocket connection for one game mode: connects, sends
 * ENTER_LOBBY, reconnects with backoff on drop, and exposes the latest
 * server-pushed state. All transport details live here so pages just render
 * `members`/`incomingChallenge`/`matched` and call the action functions.
 */
export function useLobbySocket(mode: LobbyMode): UseLobbySocketResult {
  const [isConnected, setIsConnected] = useState(false);
  const [self, setSelf] = useState<{ status: LobbyStatus; autoMatch: boolean } | null>(null);
  const [members, setMembers] = useState<LobbyMemberView[]>([]);
  const [incomingChallenge, setIncomingChallenge] = useState<IncomingChallenge | null>(null);
  const [matched, setMatched] = useState<LobbyMatch | null>(null);
  const [needsSetup, setNeedsSetup] = useState<NeedsSetup | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const deliberateClose = useRef(false);

  const send = useCallback((message: LobbyClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    if (!WS_URL) return; // mock mode / backend not configured - pages fall back to manual entry

    const trainerId = getMyTrainerId();
    if (!trainerId) return;

    deliberateClose.current = false;

    function connect() {
      const idToken = getIdToken();
      if (!idToken || !trainerId) {
        setError("Your session has expired - please log in again");
        return;
      }

      const ws = new WebSocket(`${WS_URL}?idToken=${encodeURIComponent(idToken)}&trainerId=${encodeURIComponent(trainerId)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempt.current = 0;
        send({ action: "ENTER_LOBBY", mode });
      };

      ws.onmessage = (event) => {
        let message: LobbyServerMessage;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }
        switch (message.type) {
          case "LOBBY_STATE":
            setSelf(message.self);
            setMembers(message.members);
            break;
          case "CHALLENGED":
            setIncomingChallenge({ challengeId: message.challengeId, from: message.from, expiresAt: message.expiresAt });
            break;
          case "CHALLENGE_CANCELED":
            setIncomingChallenge((prev) => (prev?.challengeId === message.challengeId ? null : prev));
            break;
          case "MATCHED":
            setMatched({ battleId: message.battleId, mode: message.mode });
            break;
          case "NEEDS_SETUP":
            setNeedsSetup({ mode: message.mode, opponentTrainerId: message.opponentTrainerId, opponentName: message.opponentName });
            break;
          case "AUTO_MATCH_TIMED_OUT":
            setSelf((prev) => (prev ? { ...prev, autoMatch: false, status: "in-lobby" } : prev));
            break;
          case "ERROR":
            setError(message.message);
            break;
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        if (deliberateClose.current) return;
        const delay = RECONNECT_DELAYS_MS[Math.min(reconnectAttempt.current, RECONNECT_DELAYS_MS.length - 1)];
        reconnectAttempt.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      deliberateClose.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: "LEAVE_LOBBY" }));
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return {
    isConnected,
    self,
    members,
    incomingChallenge,
    matched,
    needsSetup,
    error,
    setAutoMatch: (autoMatch: boolean) => send({ action: "SET_AUTO_MATCH", autoMatch }),
    challenge: (targetTrainerId: string) => send({ action: "CHALLENGE", targetTrainerId }),
    acceptChallenge: (challengeId: string) => send({ action: "ACCEPT_CHALLENGE", challengeId }),
    declineChallenge: (challengeId: string) => send({ action: "DECLINE_CHALLENGE", challengeId }),
    cancelChallenge: (challengeId: string) => send({ action: "CANCEL_CHALLENGE", challengeId }),
  };
}
