import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import type { BattleCard } from "../types";
import { PokemonCard } from "../components/PokemonCard";
import { getMyTrainerId } from "../lib/myTrainer";

const MAX_ROSTER_SIZE = 3;

export function BattleSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const opponentId = searchParams.get("opponent") ?? "";
  const trainerId = getMyTrainerId();

  const [battleCards, setBattleCards] = useState<BattleCard[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedrawing, setIsRedrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trainerId) return;
    api
      .getTrainer(trainerId)
      .then((trainer) => setBattleCards(trainer.battleCards))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load your cards"))
      .finally(() => setIsLoading(false));
  }, [trainerId]);

  async function handleRedraw() {
    if (!trainerId) return;
    setIsRedrawing(true);
    setError(null);
    try {
      const { battleCards: freshCards } = await api.rerollBattleCards(trainerId);
      setBattleCards(freshCards);
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to draw new cards");
    } finally {
      setIsRedrawing(false);
    }
  }

  function toggle(pokemonId: number) {
    setSelectedIds((prev) => {
      if (prev.includes(pokemonId)) return prev.filter((id) => id !== pokemonId);
      if (prev.length >= MAX_ROSTER_SIZE) return prev;
      return [...prev, pokemonId];
    });
  }

  async function handleConfirm() {
    if (!trainerId || selectedIds.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.setRoster(trainerId, selectedIds);
      if (opponentId) {
        const battle = await api.createBattle(trainerId, opponentId);
        navigate(`/battle/${battle.battleId}`);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save your team");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!trainerId) {
    return (
      <div className="page">
        <h1>Choose Your Team</h1>
        <p>You need to log in first.</p>
        <button type="button" onClick={() => navigate("/")}>
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Choose Your Team</h1>
      <p className="muted">
        {opponentId ? (
          <>
            Pick up to {MAX_ROSTER_SIZE} battle cards to bring against trainer <code>{opponentId}</code> (
            {selectedIds.length}/{MAX_ROSTER_SIZE} selected).
          </>
        ) : (
          <>
            Pick up to {MAX_ROSTER_SIZE} battle cards as your active team ({selectedIds.length}/{MAX_ROSTER_SIZE}{" "}
            selected) - you'll need this set before the lobby can match or challenge you.
          </>
        )}
      </p>

      <div className="form-row">
        <button type="button" onClick={handleRedraw} disabled={isLoading || isRedrawing}>
          Redraw All Cards
        </button>
      </div>

      {isLoading ? (
        <p>Loading your cards…</p>
      ) : (
        <div className="pokemon-grid">
          {battleCards.map((card, i) => (
            <PokemonCard
              key={`${card.pokemonId}-${i}`}
              card={card}
              selected={selectedIds.includes(card.pokemonId)}
              onClick={() => toggle(card.pokemonId)}
            />
          ))}
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      <button type="button" onClick={handleConfirm} disabled={isSubmitting || selectedIds.length === 0}>
        {opponentId ? "Confirm & Battle" : "Save Team"}
      </button>
    </div>
  );
}
