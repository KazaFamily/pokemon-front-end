import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTcgBattleState } from "../hooks/useTcgBattleState";
import { HPBar } from "../components/HPBar";
import { BattleLog } from "../components/BattleLog";
import { api } from "../api";
import type { TcgInPlayCard } from "../types";
import { getMyTrainerId } from "../lib/myTrainer";

function InPlayCardView({ card, label }: { card: TcgInPlayCard; label: string }) {
  return (
    <div className="battle-side">
      <h3>{label}</h3>
      <div className="battle-side__name">
        {card.name} <span className="muted">({card.energyType})</span>
      </div>
      <HPBar current={card.currentHp} max={card.maxHp} />
      <div className="muted">⚡ {card.energyAttached} energy attached</div>
    </div>
  );
}

export function TcgBattlePage() {
  const { battleId } = useParams<{ battleId: string }>();
  const navigate = useNavigate();
  const myTrainerId = getMyTrainerId();
  const { battle, error, isLoading } = useTcgBattleState(battleId ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!battleId) return <div className="page">No TCG battle selected.</div>;
  if (isLoading && !battle) return <div className="page">Loading battle…</div>;
  if (error && !battle) return <div className="page error-text">{error}</div>;
  if (!battle) return null;

  const mySide = battle.trainer1Id === myTrainerId ? "side1" : "side2";
  const theirSide = mySide === "side1" ? "side2" : "side1";
  const mine = battle[mySide];
  const theirs = battle[theirSide];
  const isMyTurn = battle.status === "active" && battle.turnSide === mySide;

  async function submit(action: "attach-energy" | "retreat" | "attack" | "end-turn", options?: { benchCardId?: number; attackName?: string }) {
    if (!myTrainerId || !battleId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await api.submitTcgAction(battleId, myTrainerId, action, options);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit action");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page battle-page">
      <h1>TCG Battle</h1>

      <div className="battle-arena">
        {theirs.active ? <InPlayCardView card={theirs.active} label="Opponent" /> : <div className="battle-side"><h3>Opponent</h3><p className="muted">No active card</p></div>}
        {mine.active ? <InPlayCardView card={mine.active} label="You" /> : <div className="battle-side"><h3>You</h3><p className="muted">No active card</p></div>}
      </div>

      <section className="panel">
        <div className="tcg-status-row">
          <span>Your prizes remaining: <strong>{mine.prizesRemaining}</strong></span>
          <span>Opponent prizes remaining: <strong>{theirs.prizesRemaining}</strong></span>
        </div>
        {mine.bench.length > 0 && (
          <div className="tcg-bench">
            <div className="muted">Your bench:</div>
            <div className="tcg-bench__cards">
              {mine.bench.map((card) => (
                <div key={card.cardId} className="tcg-bench__card">
                  {card.name} ({card.currentHp}/{card.maxHp} HP)
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {battle.status === "complete" ? (
        <div className="panel battle-result">
          <h2>{battle.winner === myTrainerId ? "You won!" : "You lost!"}</h2>
          <button type="button" onClick={() => navigate("/tcg")}>
            Back to TCG Lobby
          </button>
        </div>
      ) : (
        <div className="panel">
          <div className="battle-turn-indicator">{isMyTurn ? "Your turn!" : "Waiting on your opponent…"}</div>

          {mine.active && (
            <div className="tcg-actions">
              <button
                type="button"
                onClick={() => submit("attach-energy")}
                disabled={!isMyTurn || isSubmitting || mine.energyAttachedThisTurn}
              >
                Attach Energy
              </button>

              {mine.bench.map((card) => (
                <button
                  key={card.cardId}
                  type="button"
                  onClick={() => submit("retreat", { benchCardId: card.cardId })}
                  disabled={!isMyTurn || isSubmitting || mine.retreatedThisTurn || mine.active!.energyAttached < card.retreatCost}
                >
                  Retreat to {card.name}
                </button>
              ))}

              {mine.active.attacks.map((attack) => (
                <button
                  key={attack.name}
                  type="button"
                  onClick={() => submit("attack", { attackName: attack.name })}
                  disabled={!isMyTurn || isSubmitting || mine.active!.energyAttached < attack.energyCost}
                >
                  {attack.name} ({attack.energyCost}⚡ · {attack.damage} dmg)
                </button>
              ))}

              <button type="button" onClick={() => submit("end-turn")} disabled={!isMyTurn || isSubmitting}>
                End Turn
              </button>
            </div>
          )}
          {submitError && <p className="error-text">{submitError}</p>}
        </div>
      )}

      <BattleLog entries={battle.log} />
    </div>
  );
}
