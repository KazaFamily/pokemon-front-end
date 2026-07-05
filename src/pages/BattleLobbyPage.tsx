import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, isMockApi } from "../api";
import type { Trainer } from "../types";
import { getMyTrainerId } from "../lib/myTrainer";
import { useLobbySocket } from "../hooks/useLobbySocket";

export function BattleLobbyPage() {
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [opponentId, setOpponentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const lobby = useLobbySocket("video");

  useEffect(() => {
    const trainerId = getMyTrainerId();
    if (!trainerId) return;
    api.getTrainer(trainerId).then(setTrainer).catch(() => setTrainer(null));
  }, []);

  useEffect(() => {
    if (lobby.matched) navigate(`/battle/${lobby.matched.battleId}`);
  }, [lobby.matched, navigate]);

  useEffect(() => {
    if (lobby.needsSetup) navigate(`/battle/setup?opponent=${encodeURIComponent(lobby.needsSetup.opponentTrainerId)}`);
  }, [lobby.needsSetup, navigate]);

  function handleStartBattle() {
    if (!opponentId.trim()) return;
    navigate(`/battle/setup?opponent=${encodeURIComponent(opponentId.trim())}`);
  }

  if (!trainer) {
    return <div className="page">Loading your trainer…</div>;
  }

  const hasLoadout = trainer.roster.length > 0;

  return (
    <div className="page">
      <h1>Battle Lobby</h1>

      {isMockApi ? (
        <section className="panel">
          <h2>Start a Battle</h2>
          <p className="muted">The live lobby needs a real backend - paste an opponent's trainer ID to battle directly.</p>
          <div className="form-row">
            <input
              placeholder="Opponent trainer ID"
              value={opponentId}
              onChange={(e) => setOpponentId(e.target.value)}
            />
            <button type="button" onClick={handleStartBattle} disabled={!opponentId.trim()}>
              Battle
            </button>
          </div>
        </section>
      ) : (
        <section className="panel">
          <div className="panel__header">
            <h2>Lobby</h2>
            <label className="form-row" style={{ gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={lobby.self?.autoMatch ?? false}
                onChange={(e) => lobby.setAutoMatch(e.target.checked)}
                disabled={
                  !hasLoadout ||
                  !lobby.isConnected ||
                  (lobby.self?.status !== "in-lobby" && lobby.self?.status !== "auto-matching")
                }
              />
              Auto-match me with the next available trainer
            </label>
          </div>

          {!hasLoadout && (
            <p className="muted">
              You need a battle team before you can be matched or challenged - <Link to="/battle/setup">pick one now</Link>.
            </p>
          )}

          {!lobby.isConnected && <p className="muted">Connecting to the lobby…</p>}

          {lobby.isConnected && (
            <>
              {lobby.members.length === 0 ? (
                <p className="muted">No other trainers in the lobby right now.</p>
              ) : (
                <ul>
                  {lobby.members.map((m) => (
                    <li key={m.trainerId} className="form-row">
                      <span>
                        {m.name} - {m.status}
                        {m.autoMatch ? " (auto-match)" : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => lobby.challenge(m.trainerId)}
                        disabled={!hasLoadout || lobby.self?.status !== "in-lobby" || m.status === "in-battle"}
                      >
                        Challenge
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {lobby.incomingChallenge && (
            <div className="panel" style={{ border: "2px solid orange" }}>
              <p>
                <strong>{lobby.incomingChallenge.from.name}</strong> has challenged you to a battle!
              </p>
              <div className="form-row">
                <button type="button" onClick={() => lobby.acceptChallenge(lobby.incomingChallenge!.challengeId)}>
                  Accept
                </button>
                <button type="button" onClick={() => lobby.declineChallenge(lobby.incomingChallenge!.challengeId)}>
                  Decline
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {(error || lobby.error) && <p className="error-text">{error ?? lobby.error}</p>}
    </div>
  );
}
