import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { PokemonSpecies } from "../types";
import { PokemonCard } from "../components/PokemonCard";
import { getMyTrainerId } from "../lib/myTrainer";

const MAX_ROSTER_SIZE = 3;

export function TrainerSetupPage() {
  const navigate = useNavigate();
  const trainerId = getMyTrainerId();
  const [available, setAvailable] = useState<PokemonSpecies[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trainerId) return;
    Promise.all([api.listPokemon(), api.getTrainer(trainerId)])
      .then(([pokemon, trainer]) => {
        setAvailable(pokemon);
        setSelectedIds(trainer.roster.map((p) => p.id));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false));
  }, [trainerId]);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= MAX_ROSTER_SIZE) return prev;
      return [...prev, id];
    });
  }

  async function handleSave() {
    if (!trainerId) return;
    setIsSaving(true);
    setError(null);
    try {
      await api.setTrainerRoster(trainerId, selectedIds);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save roster");
    } finally {
      setIsSaving(false);
    }
  }

  if (!trainerId) {
    return (
      <div className="page">
        <h1>Trainer Setup</h1>
        <p>You need to create a trainer in the Lobby first.</p>
        <button type="button" onClick={() => navigate("/")}>
          Go to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Trainer Setup</h1>
      <p className="muted">
        Pick up to {MAX_ROSTER_SIZE} Pokémon for your roster ({selectedIds.length}/{MAX_ROSTER_SIZE} selected).
      </p>

      {isLoading ? (
        <p>Loading available Pokémon…</p>
      ) : (
        <div className="pokemon-grid">
          {available.map((pokemon) => (
            <PokemonCard
              key={pokemon.id}
              pokemon={pokemon}
              selected={selectedIds.includes(pokemon.id)}
              onClick={() => toggle(pokemon.id)}
            />
          ))}
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      <button type="button" onClick={handleSave} disabled={isSaving || selectedIds.length === 0}>
        Save Roster
      </button>
    </div>
  );
}
