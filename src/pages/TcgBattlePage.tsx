import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTcgBattleState } from "../hooks/useTcgBattleState";
import { HPBar } from "../components/HPBar";
import { BattleLog } from "../components/BattleLog";
import { TcgCardView, CostBadge } from "../components/TcgCardView";
import { api } from "../api";
import type { TcgAction, TcgCard, TcgInPlayCard, TcgSideState } from "../types";
import { getMyTrainerId } from "../lib/myTrainer";
import { getTcgCatalog } from "../lib/tcgCatalog";

function totalEnergy(card: TcgInPlayCard): number {
  return Object.values(card.attachedEnergy).reduce((sum: number, n) => sum + (n ?? 0), 0);
}

function InPlayMiniCard({ card, isActive }: { card: TcgInPlayCard; isActive?: boolean }) {
  return (
    <div className={`tcg-inplay-card${isActive ? " tcg-inplay-card--active" : ""}`}>
      <div className="tcg-inplay-card__header">
        <span className="tcg-inplay-card__name">{card.name}</span>
        <span className={`type-badge type-badge--${card.energyType} tcg-inplay-card__hp`}>{card.currentHp}</span>
      </div>
      {card.spriteUrl && <img className="tcg-inplay-card__sprite" src={card.spriteUrl} alt={card.name} loading="lazy" />}
      <HPBar current={card.currentHp} max={card.maxHp} />
      <div className="tcg-inplay-card__footer">
        <span className="muted">⚡ ×{totalEnergy(card)}</span>
        <span className="muted">Retreat {card.retreatCost}</span>
      </div>
      {card.attacks.length > 0 && (
        <div className="tcg-card__attacks">
          {card.attacks.map((attack) => (
            <div key={attack.name} className="tcg-card__attack">
              {attack.name}{" "}
              <span className="muted">
                ({attack.cost.map((symbol, i) => <CostBadge key={i} symbol={symbol} />)} · {attack.damage} dmg)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptySlot({ label }: { label: string }) {
  return <div className="tcg-mat__empty-slot">{label}</div>;
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
  const stadiumCard = battle.stadiumCardId != null ? catalog.get(battle.stadiumCardId) : undefined;

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

      <section className="panel">
        <div className="tcg-status-row">
          <span>Your prizes remaining: <strong>{mine.prizes.length}</strong></span>
          <span>Opponent prizes remaining: <strong>{theirs.prizes.length}</strong></span>
          {battle.status === "active" && <TurnCountdown turnExpiresAt={battle.turnExpiresAt} />}
        </div>
      </section>

      <div className="tcg-mat">
        <div className="tcg-mat__row tcg-mat__row--opponent">
          <div className="tcg-mat__bench">
            {theirs.bench.map((card) => (
              <InPlayMiniCard key={card.instanceId} card={card} />
            ))}
          </div>
          <div className="tcg-mat__side-info">
            <span>Deck: {theirs.deck.length}</span>
            <span>Hand: {theirs.hand.length}</span>
            <span>Prizes: {theirs.prizes.length}</span>
          </div>
        </div>

        <div className="tcg-mat__row tcg-mat__row--field">
          {stadiumCard ? <TcgCardView card={stadiumCard} /> : <EmptySlot label="No Stadium" />}
          <div className="tcg-mat__active-stack">
            {theirs.active ? <InPlayMiniCard card={theirs.active} isActive /> : <EmptySlot label="Opponent's Active" />}
            <span className="tcg-mat__vs">VS</span>
            {mine.active ? <InPlayMiniCard card={mine.active} isActive /> : <EmptySlot label="Your Active" />}
          </div>
        </div>

        <div className="tcg-mat__row tcg-mat__row--mine">
          <div className="tcg-mat__bench">
            {mine.bench.map((card) => (
              <InPlayMiniCard key={card.instanceId} card={card} />
            ))}
          </div>
          <div className="tcg-mat__side-info">
            <span>Deck: {mine.deck.length}</span>
            <span>Prizes: {mine.prizes.length}</span>
          </div>
        </div>
      </div>

      {mine.hand.length > 0 && (
        <section className="panel">
          <div className="muted">Your hand ({mine.hand.length} cards):</div>
          <div className="tcg-hand-row">
            {mine.hand.map((cardId, i) => (catalog.has(cardId) ? <TcgCardView key={i} card={catalog.get(cardId)!} /> : null))}
          </div>
        </section>
      )}

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
