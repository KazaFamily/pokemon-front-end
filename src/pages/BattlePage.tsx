import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBattleState } from "../hooks/useBattleState";
import { HPBar } from "../components/HPBar";
import { MoveSelector } from "../components/MoveSelector";
import { BattleLog } from "../components/BattleLog";
import { api } from "../api";
import type { Move } from "../types";
import { getMyTrainerId } from "../lib/myTrainer";

export function BattlePage() {
  const { battleId } = useParams<{ battleId: string }>();
  const navigate = useNavigate();
  const myTrainerId = getMyTrainerId();
  const { battle, error, isLoading } = useBattleState(battleId ?? null);
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!battleId) return <div className="page">No battle selected.</div>;
  if (isLoading && !battle) return <div className="page">Loading battle…</div>;
  if (error && !battle) return <div className="page error-text">{error}</div>;
  if (!battle) return null;

  const mySide = battle.sides.find((s) => s.trainerId === myTrainerId) ?? battle.sides[0];
  const theirSide = battle.sides.find((s) => s.trainerId !== mySide.trainerId) ?? battle.sides[1];
  const isMyTurn = battle.status === "active" && battle.waitingOn.includes(mySide.trainerId);

  async function handleMoveSelect(move: Move) {
    if (!myTrainerId) return;
    setIsSubmittingMove(true);
    setSubmitError(null);
    try {
      await api.submitMove(battleId!, myTrainerId, move.id);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit move");
    } finally {
      setIsSubmittingMove(false);
    }
  }

  return (
    <div className="page battle-page">
      <h1>Battle</h1>

      <div className="battle-arena">
        <div className="battle-side">
          <h3>{theirSide.trainerName}</h3>
          <img className="battle-side__sprite" src={theirSide.active.pokemon.spriteUrl} alt={theirSide.active.pokemon.name} />
          <div className="battle-side__name">{theirSide.active.pokemon.name}</div>
          <HPBar current={theirSide.active.currentHp} max={theirSide.active.maxHp} />
        </div>

        <div className="battle-side battle-side--mine">
          <h3>{mySide.trainerName}</h3>
          <img className="battle-side__sprite" src={mySide.active.pokemon.spriteUrl} alt={mySide.active.pokemon.name} />
          <div className="battle-side__name">{mySide.active.pokemon.name}</div>
          <HPBar current={mySide.active.currentHp} max={mySide.active.maxHp} />
        </div>
      </div>

      {battle.status === "finished" ? (
        <div className="panel battle-result">
          <h2>{battle.winnerTrainerId === mySide.trainerId ? "You won!" : "You lost!"}</h2>
          <button type="button" onClick={() => navigate("/")}>
            Back to Lobby
          </button>
        </div>
      ) : (
        <div className="panel">
          <div className="battle-turn-indicator">
            {isMyTurn ? "Your move!" : `Waiting on ${theirSide.trainerName}…`}
          </div>
          <MoveSelector
            moves={mySide.active.pokemon.moves}
            disabled={!isMyTurn || isSubmittingMove}
            onSelect={handleMoveSelect}
          />
          {submitError && <p className="error-text">{submitError}</p>}
        </div>
      )}

      <BattleLog entries={battle.log} />
    </div>
  );
}
