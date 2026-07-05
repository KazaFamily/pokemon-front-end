import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, isMockApi } from "../api";
import type { Trainer } from "../types";
import { useAuth } from "../auth/useAuth";
import { TcgCardView } from "../components/TcgCardView";
import { getMyTrainerId } from "../lib/myTrainer";
import { useLobbySocket } from "../hooks/useLobbySocket";

const TCG_DECK_SIZE = 60;

export function TcgLobbyPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [opponentId, setOpponentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const lobby = useLobbySocket("tcg");

  useEffect(() => {
    if (!isAuthenticated) return;
    const trainerId = getMyTrainerId();
    if (!trainerId) return;
    api.getTrainer(trainerId).then(setTrainer).catch(() => setTrainer(null));
  }, [isAuthenticated]);

  useEffect(() => {
    if (lobby.matched) navigate(`/tcg/battle/${lobby.matched.battleId}`);
  }, [lobby.matched, navigate]);

  useEffect(() => {
    if (lobby.needsSetup) navigate(`/tcg/setup?opponent=${encodeURIComponent(lobby.needsSetup.opponentTrainerId)}`);
  }, [lobby.needsSetup, navigate]);

  async function handleReroll() {
    if (!trainer) return;
    setIsBusy(true);
    setError(null);
    try {
      await api.rerollTcgCards(trainer.trainerId);
      setTrainer(await api.getTrainer(trainer.trainerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to draw new cards");
    } finally {
      setIsBusy(false);
    }
  }

  function handleStartBattle() {
    if (!opponentId.trim()) return;
    navigate(`/tcg/setup?opponent=${encodeURIComponent(opponentId.trim())}`);
  }

  if (!isAuthenticated) {
    return (
      <div className="page">
        <h1>TCG Lobby</h1>
        <p>
          Log in from the <Link to="/">video-game Lobby</Link> first - the same trainer plays both game modes.
        </p>
      </div>
    );
  }

  if (!trainer) {
    return <div className="page">Loading your trainer…</div>;
  }

  const hasLoadout = trainer.tcgDeck.length === TCG_DECK_SIZE;

  return (
    <div className="page">
      <h1>TCG Lobby</h1>

      <section className="panel">
        <h2>{trainer.name}</h2>
        <p>
          Your trainer ID: <code>{trainer.trainerId}</code>
        </p>
      </section>

      {isMockApi ? (
        <section className="panel">
          <h2>Start a TCG Battle</h2>
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
              You need a legal {TCG_DECK_SIZE}-card deck before you can be matched or challenged - <Link to="/tcg/setup">build one now</Link>.
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
                <strong>{lobby.incomingChallenge.from.name}</strong> has challenged you to a TCG battle!
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

      <section className="panel">
        <div className="panel__header">
          <h2>Your TCG Cards</h2>
          <button type="button" onClick={handleReroll} disabled={isBusy}>
            Redraw
          </button>
        </div>
        <div className="pokemon-grid">
          {trainer.tcgCards.map((card, i) => (
            <TcgCardView key={`${card.cardId}-${i}`} card={card} />
          ))}
        </div>
      </section>

      {(error || lobby.error) && <p className="error-text">{error ?? lobby.error}</p>}
    </div>
  );
}
