import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import type { TcgCard } from "../types";
import { TcgCardView } from "../components/TcgCardView";
import { getMyTrainerId } from "../lib/myTrainer";

export function TcgDeckSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const opponentId = searchParams.get("opponent") ?? "";
  const trainerId = getMyTrainerId();

  const [tcgCards, setTcgCards] = useState<TcgCard[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trainerId) return;
    api
      .getTrainer(trainerId)
      .then((trainer) => setTcgCards(trainer.tcgCards))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load your cards"))
      .finally(() => setIsLoading(false));
  }, [trainerId]);

  function toggle(cardId: number) {
    setSelectedIds((prev) => (prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]));
  }

  async function handleConfirm() {
    if (!trainerId || !opponentId || selectedIds.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.setTcgDeck(trainerId, selectedIds);
      const battle = await api.createTcgBattle(trainerId, opponentId);
      navigate(`/tcg/battle/${battle.battleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start TCG battle");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!trainerId) {
    return (
      <div className="page">
        <h1>Build Your Deck</h1>
        <p>You need to log in first.</p>
        <button type="button" onClick={() => navigate("/")}>
          Go to Lobby
        </button>
      </div>
    );
  }

  if (!opponentId) {
    return (
      <div className="page">
        <h1>Build Your Deck</h1>
        <p>No opponent selected.</p>
        <button type="button" onClick={() => navigate("/tcg")}>
          Go to TCG Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Build Your Deck</h1>
      <p className="muted">
        Pick any of your 20 TCG cards to bring against trainer <code>{opponentId}</code> (
        {selectedIds.length} selected). The first card you pick becomes your active card; the next 3 sit on your bench.
      </p>

      {isLoading ? (
        <p>Loading your cards…</p>
      ) : (
        <div className="pokemon-grid">
          {tcgCards.map((card, i) => (
            <TcgCardView
              key={`${card.cardId}-${i}`}
              card={card}
              selected={selectedIds.includes(card.cardId)}
              onClick={() => toggle(card.cardId)}
            />
          ))}
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      <button type="button" onClick={handleConfirm} disabled={isSubmitting || selectedIds.length === 0}>
        Confirm & Battle
      </button>
    </div>
  );
}
