import type { TcgAttackCostSymbol, TcgCard, TcgRuleTag } from "../types";

interface TcgCardViewProps {
  card: TcgCard;
  selected?: boolean;
  onClick?: () => void;
  /** Shown as a small badge (e.g. deck-builder "x3") - omitted when undefined/0. */
  countInDeck?: number;
}

export function CostBadge({ symbol }: { symbol: TcgAttackCostSymbol }) {
  return <span className={`type-badge type-badge--${symbol}`}>{symbol === "colorless" ? "C" : symbol[0].toUpperCase()}</span>;
}

const CATEGORY_LABEL: Record<TcgCard["category"], string> = {
  pokemon: "Pokémon",
  "basic-energy": "Basic Energy",
  "special-energy": "Special Energy",
  item: "Item",
  supporter: "Supporter",
  stadium: "Stadium",
  tool: "Pokémon Tool",
};

const RULE_TAG_LABEL: Record<Exclude<TcgRuleTag, "none">, string> = {
  ex: "ex",
  "mega-ex": "Mega ex",
  "ace-spec": "ACE SPEC",
};

export function TcgCardView({ card, selected, onClick, countInDeck }: TcgCardViewProps) {
  return (
    <button
      type="button"
      className={`pokemon-card tcg-card${selected ? " pokemon-card--selected" : ""}`}
      onClick={onClick}
      disabled={!onClick}
    >
      {card.spriteUrl && <img className="pokemon-card__sprite" src={card.spriteUrl} alt={card.name} loading="lazy" />}
      <div className="pokemon-card__name">
        {card.name}
        {!!countInDeck && <span className="tcg-card__count"> ×{countInDeck}</span>}
      </div>
      <div className="pokemon-card__types">
        <span className="type-badge">{CATEGORY_LABEL[card.category]}</span>
        {card.category === "pokemon" && card.ruleTag !== "none" && (
          <span className="type-badge type-badge--rule">{RULE_TAG_LABEL[card.ruleTag]}</span>
        )}
      </div>

      {card.category === "pokemon" && (
        <>
          <div className="pokemon-card__stats">
            <span>HP {card.hp}</span>
            <span>Retreat {card.retreatCost}</span>
          </div>
          <div className="tcg-card__meta">
            <span className={`type-badge type-badge--${card.energyType}`}>{card.energyType}</span>
            {card.weakness && <span className="tcg-card__weakness">Weak: {card.weakness}</span>}
            {card.resistance && <span className="tcg-card__resistance">Resist: {card.resistance}</span>}
          </div>
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
        </>
      )}

      {(card.category === "basic-energy" || card.category === "special-energy") && (
        <div className="tcg-card__meta">
          Provides: {card.providesSymbols.map((symbol, i) => <CostBadge key={i} symbol={symbol} />)}
        </div>
      )}
    </button>
  );
}
