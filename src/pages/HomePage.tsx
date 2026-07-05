import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Trainer } from "../types";
import { useAuth } from "../auth/useAuth";
import { PokemonCard } from "../components/PokemonCard";
import { getMyTrainerId } from "../lib/myTrainer";

const ROSTER_SIZE = 3;
const TCG_DECK_SIZE = 60;

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, signIn } = useAuth();
  const [name, setName] = useState("");
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const trainerId = getMyTrainerId();
    if (!trainerId) return;
    api.getTrainer(trainerId).then(setTrainer).catch(() => setTrainer(null));
  }, [isAuthenticated]);

  async function handleLogin() {
    if (!name.trim()) return;
    setIsBusy(true);
    setError(null);
    try {
      await signIn(name.trim());
      const trainerId = getMyTrainerId();
      if (trainerId) setTrainer(await api.getTrainer(trainerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log in");
    } finally {
      setIsBusy(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="page">
        <h1>Poké Battle</h1>
        <section className="panel">
          <h2>Enter your trainer name</h2>
          <p className="muted">
            New name? We'll create your trainer, deal you 20 random battle cards, and assign a starter TCG deck.
            Existing name? You're straight back in - there's no password, so only use a name you and your opponents
            already know.
          </p>
          <div className="form-row">
            <input
              placeholder="Trainer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <button type="button" onClick={handleLogin} disabled={isBusy || !name.trim()}>
              Enter the Battle
            </button>
          </div>
          {error && <p className="error-text">{error}</p>}
        </section>
      </div>
    );
  }

  if (!trainer) {
    return <div className="page">Loading your trainer…</div>;
  }

  const hasTeam = trainer.roster.length === ROSTER_SIZE;
  const deckReady = trainer.tcgDeck.length === TCG_DECK_SIZE;

  return (
    <div className="page">
      <h1>Welcome, {trainer.name}</h1>

      <div className="mode-grid">
        <section className="panel mode-panel">
          <h2>Poké Battle</h2>
          {hasTeam ? (
            <div className="pokemon-grid">
              {trainer.roster.map((card, i) => (
                <PokemonCard key={`${card.pokemonId}-${i}`} card={card} />
              ))}
            </div>
          ) : (
            <p className="muted">
              {trainer.roster.length > 0
                ? `Team incomplete (${trainer.roster.length}/${ROSTER_SIZE} picked).`
                : "You haven't picked a battle team yet."}
            </p>
          )}
          <div className="mode-panel__actions">
            <button type="button" onClick={() => navigate("/battle/setup")}>
              {hasTeam ? "Manage Team" : "Pick Your Team"}
            </button>
            <button type="button" onClick={() => navigate("/battle/lobby")}>
              Join Lobby
            </button>
          </div>
        </section>

        <section className="panel mode-panel">
          <h2>Pokémon TCG</h2>
          <p className={deckReady ? "muted" : "error-text"}>
            {deckReady
              ? `Deck ready (${TCG_DECK_SIZE}/${TCG_DECK_SIZE}).`
              : `Deck needs preparation (${trainer.tcgDeck.length}/${TCG_DECK_SIZE}).`}
          </p>
          <div className="mode-panel__actions">
            <button type="button" onClick={() => navigate("/tcg/setup")}>
              {deckReady ? "Manage Deck" : "Build Your Deck"}
            </button>
            <button type="button" onClick={() => navigate("/tcg/lobby")}>
              Join Lobby
            </button>
          </div>
        </section>
      </div>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
