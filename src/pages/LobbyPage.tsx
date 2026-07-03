import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Trainer } from "../types";
import { getMyTrainerId, setMyTrainerId } from "../lib/myTrainer";

export function LobbyPage() {
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [trainerName, setTrainerName] = useState("");
  const [opponentId, setOpponentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const existingId = getMyTrainerId();
    if (!existingId) return;
    api
      .getTrainer(existingId)
      .then(setTrainer)
      .catch(() => setTrainer(null));
  }, []);

  async function handleCreateTrainer() {
    if (!trainerName.trim()) return;
    setIsBusy(true);
    setError(null);
    try {
      const created = await api.createTrainer(trainerName.trim());
      setMyTrainerId(created.id);
      setTrainer(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trainer");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleStartBattle() {
    if (!trainer || !opponentId.trim()) return;
    setIsBusy(true);
    setError(null);
    try {
      const battle = await api.createBattle(trainer.id, opponentId.trim());
      navigate(`/battle/${battle.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start battle");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="page">
      <h1>Lobby</h1>

      {!trainer ? (
        <section className="panel">
          <h2>Create a Trainer</h2>
          <div className="form-row">
            <input
              placeholder="Trainer name"
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
            />
            <button type="button" onClick={handleCreateTrainer} disabled={isBusy || !trainerName.trim()}>
              Create
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="panel">
            <h2>Your Trainer</h2>
            <p>
              <strong>{trainer.name}</strong> — ID: <code>{trainer.id}</code>
            </p>
            <p className="muted">Share this ID with an opponent so they can battle you.</p>
            <p>Roster: {trainer.roster.length ? trainer.roster.map((p) => p.name).join(", ") : "empty — set one up"}</p>
            <button type="button" onClick={() => navigate("/trainer")}>
              Edit roster
            </button>
          </section>

          <section className="panel">
            <h2>Start a Battle</h2>
            <div className="form-row">
              <input
                placeholder="Opponent trainer ID"
                value={opponentId}
                onChange={(e) => setOpponentId(e.target.value)}
              />
              <button type="button" onClick={handleStartBattle} disabled={isBusy || !opponentId.trim()}>
                Battle
              </button>
            </div>
          </section>
        </>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
