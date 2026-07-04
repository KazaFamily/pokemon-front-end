import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTcgBattleState } from "../hooks/useTcgBattleState";
import { HPBar } from "../components/HPBar";
import { BattleLog } from "../components/BattleLog";
import { TcgCardView } from "../components/TcgCardView";
import { api } from "../api";
import type { TcgAction, TcgCard, TcgInPlayCard, TcgSideState } from "../types";
import { getMyTrainerId } from "../lib/myTrainer";
import { getTcgCatalog } from "../lib/tcgCatalog";

function totalEnergy(card: TcgInPlayCard): number {
  return Object.values(card.attachedEnergy).reduce((sum: number, n) => sum + (n ?? 0), 0);
}

function InPlayCardView({ card, label }: { card: TcgInPlayCard; label: string }) {
  return (
    <div className="battle-side">
      <h3>{label}</h3>
      <div className="battle-side__name">
        {card.name} <span className="muted">({card.energyType})</span>
      </div>
      <HPBar current={card.currentHp} max={card.maxHp} />
      <div className="muted">⚡ {totalEnergy(card)} energy attached</div>
    </div>
  );
}

/** Builds a human-readable label for a legal action, resolving cardIds/
 * instanceIds through the catalog cache and the acting side's own state -
 * the backend enforces legality (see legalActions), this just labels it. */
function describeAction(action: TcgAction, catalog: Map<number, TcgCard>, mine: TcgSideState): string {
  const cardName = (cardId: number) => catalog.get(cardId)?.name ?? `Card ${cardId}`;
  const inPlayName = (instanceId: number) => {
    if (mine.active?.instanceId === instanceId) return mine.active.name;
    return mine.bench.find((c) => c.instanceId === instanceId)?.name ?? `Pokemon ${instanceId}`;
  };

  switch (action.type) {
    case "play-basic":
      return `Play ${cardName(action.handCardId)}`;
    case "evolve":
      return `Evolve ${inPlayName(action.targetInstanceId)} into ${cardName(action.handCardId)}`;
    case "attach-energy":
      return `Attach ${cardName(action.handCardId)} to ${action.targetInstanceId === undefined ? mine.active?.name : inPlayName(action.targetInstanceId)}`;
    case "play-item":
      return `Play ${cardName(action.handCardId)}`;
    case "play-supporter":
      return `Play ${cardName(action.handCardId)}`;
    case "play-stadium":
      return `Play ${cardName(action.handCardId)} (Stadium)`;
    case "retreat":
      return `Retreat to ${inPlayName(action.benchInstanceId)}`;
    case "attack":
      return `Attack: ${action.attackName}`;
    case "end-turn":
      return "End Turn";
  }
}

function TurnCountdown({ turnExpiresAt }: { turnExpiresAt: string }) {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.round((new Date(turnExpiresAt).getTime() - Date.now()) / 1000)));

  useEffect(() => {
    const tick = () => setSecondsLeft(Math.max(0, Math.round((new Date(turnExpiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [turnExpiresAt]);

  return <span className="muted">Turn expires in {secondsLeft}s</span>;
}

function SetupPicker({ battleId, myTrainerId, hand, catalog }: { battleId: string; myTrainerId: string; hand: number[]; catalog: Map<number, TcgCard> }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [benchIndices, setBenchIndices] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligible = hand
    .map((cardId, index) => ({ cardId, index }))
    .filter(({ cardId }) => {
      const card = catalog.get(cardId);
      return card?.category === "pokemon" && card.stage === "basic";
    });

  function toggleBench(index: number) {
    setBenchIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else if (next.size < 5) next.add(index);
      return next;
    });
  }

  async function handleConfirm() {
    if (activeIndex === null) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const benchCardIds = [...benchIndices].map((i) => hand[i]);
      await api.submitTcgSetup(battleId, myTrainerId, hand[activeIndex], benchCardIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit setup");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="panel">
      <h2>Choose Your Opening Board</h2>
      <p className="muted">Pick one Basic Pokémon as your active, and up to 5 more for your bench.</p>
      <div className="pokemon-grid">
        {eligible.map(({ cardId, index }) => (
          <div key={index} className="tcg-setup-slot">
            <TcgCardView card={catalog.get(cardId)!} selected={activeIndex === index || benchIndices.has(index)} />
            <div className="tcg-setup-slot__actions">
              <button type="button" onClick={() => setActiveIndex(index)} disabled={activeIndex === index}>
                {activeIndex === index ? "Active ✓" : "Make Active"}
              </button>
              <button
                type="button"
                onClick={() => toggleBench(index)}
                disabled={activeIndex === index || (!benchIndices.has(index) && benchIndices.size >= 5)}
              >
                {benchIndices.has(index) ? "On Bench ✓" : "Add to Bench"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="button" onClick={handleConfirm} disabled={activeIndex === null || isSubmitting}>
        Confirm Setup
      </button>
    </div>
  );
}

export function TcgBattlePage() {
  const { battleId } = useParams<{ battleId: string }>();
  const navigate = useNavigate();
  const myTrainerId = getMyTrainerId();
  const { battle, error, isLoading } = useTcgBattleState(battleId ?? null);
  const [catalog, setCatalog] = useState<Map<number, TcgCard>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    getTcgCatalog()
      .then(setCatalog)
      .catch((err) => setSubmitError(err instanceof Error ? err.message : "Failed to load the card catalog"));
  }, []);

  if (!battleId) return <div className="page">No TCG battle selected.</div>;
  if (isLoading && !battle) return <div className="page">Loading battle…</div>;
  if (error && !battle) return <div className="page error-text">{error}</div>;
  if (!battle) return null;

  const mySide = battle.trainer1Id === myTrainerId ? "side1" : "side2";
  const theirSide = mySide === "side1" ? "side2" : "side1";
  const mine = battle[mySide];
  const theirs = battle[theirSide];
  const isMyTurn = battle.status === "active" && battle.turnSide === mySide;

  async function submit(action: TcgAction) {
    if (!myTrainerId || !battleId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await api.submitTcgAction(battleId, myTrainerId, action);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit action");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (battle.status === "setup") {
    if (battle.setupDone[mySide]) {
      return (
        <div className="page battle-page">
          <h1>TCG Battle</h1>
          <div className="panel">Waiting for your opponent to choose their opening board…</div>
        </div>
      );
    }
    return (
      <div className="page battle-page">
        <h1>TCG Battle</h1>
        {myTrainerId && <SetupPicker battleId={battleId} myTrainerId={myTrainerId} hand={mine.hand} catalog={catalog} />}
      </div>
    );
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
          <span>Your prizes remaining: <strong>{mine.prizes.length}</strong></span>
          <span>Opponent prizes remaining: <strong>{theirs.prizes.length}</strong></span>
          {battle.status === "active" && <TurnCountdown turnExpiresAt={battle.turnExpiresAt} />}
        </div>
        {mine.bench.length > 0 && (
          <div className="tcg-bench">
            <div className="muted">Your bench:</div>
            <div className="tcg-bench__cards">
              {mine.bench.map((card) => (
                <div key={card.instanceId} className="tcg-bench__card">
                  {card.name} ({card.currentHp}/{card.maxHp} HP)
                </div>
              ))}
            </div>
          </div>
        )}
        {mine.hand.length > 0 && (
          <div className="tcg-hand">
            <div className="muted">Your hand ({mine.hand.length} cards):</div>
            <div className="pokemon-grid">
              {mine.hand.map((cardId, i) => (catalog.has(cardId) ? <TcgCardView key={i} card={catalog.get(cardId)!} /> : null))}
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

          {isMyTurn && (
            <div className="tcg-actions">
              {(battle.legalActions ?? []).map((action, i) => (
                <button key={i} type="button" onClick={() => submit(action)} disabled={isSubmitting}>
                  {describeAction(action, catalog, mine)}
                </button>
              ))}
            </div>
          )}
          {submitError && <p className="error-text">{submitError}</p>}
        </div>
      )}

      <BattleLog entries={battle.log} />
    </div>
  );
}
