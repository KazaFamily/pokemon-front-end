import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Trainer } from "../types";
import { useAuth } from "../auth/useAuth";
import { TcgCardView } from "../components/TcgCardView";
import { getMyTrainerId } from "../lib/myTrainer";

export function TcgLobbyPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [opponentId, setOpponentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const trainerId = getMyTrainerId();
    if (!trainerId) return;
    api.getTrainer(trainerId).then(setTrainer).catch(() => setTrainer(null));
  }, [isAuthenticated]);

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

  return (
    <div className="page">
      <h1>TCG Lobby</h1>

      <section className="panel">
        <h2>{trainer.name}</h2>
        <p>
          Your trainer ID: <code>{trainer.trainerId}</code>
        </p>
        <p className="muted">Share this ID with an opponent so they can battle you.</p>
      </section>

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

      <section className="panel">
        <h2>Start a TCG Battle</h2>
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

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
