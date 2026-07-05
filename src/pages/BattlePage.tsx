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

  const mySide = battle.trainer1Id === myTrainerId ? "side1" : "side2";
  const theirTrainerId = mySide === "side1" ? battle.trainer2Id : battle.trainer1Id;
  const myActive = mySide === "side1" ? battle.active1 : battle.active2;
  const theirActive = mySide === "side1" ? battle.active2 : battle.active1;
  const isMyTurn = battle.status === "active" && !battle.pendingMoves[mySide];

  async function handleMoveSelect(move: Move) {
    if (!myTrainerId) return;
    setIsSubmittingMove(true);
    setSubmitError(null);
    try {
      await api.submitMove(battleId!, myTrainerId, move.name);
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
          <h3>Trainer {theirTrainerId}</h3>
          <div className="battle-side__name">
            {theirActive.name} <span className="muted">Lv{theirActive.level}</span>
          </div>
          <HPBar current={theirActive.currentHp} max={theirActive.maxHp} />
        </div>

        <div className="battle-side battle-side--mine">
          <h3>You</h3>
          <div className="battle-side__name">
            {myActive.name} <span className="muted">Lv{myActive.level}</span>
          </div>
          <HPBar current={myActive.currentHp} max={myActive.maxHp} />
        </div>
      </div>

      {battle.status === "complete" ? (
        <div className="panel battle-result">
          <h2>{battle.winner === myTrainerId ? "You won!" : "You lost!"}</h2>
          <button type="button" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      ) : (
        <div className="panel">
          <div className="battle-turn-indicator">{isMyTurn ? "Your move!" : "Waiting on your opponent…"}</div>
          <MoveSelector moves={myActive.moves} disabled={!isMyTurn || isSubmittingMove} onSelect={handleMoveSelect} />
          {submitError && <p className="error-text">{submitError}</p>}
        </div>
      )}

      <BattleLog entries={battle.log} />
    </div>
  );
}
