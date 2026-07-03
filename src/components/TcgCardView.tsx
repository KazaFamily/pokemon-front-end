import type { TcgCard } from "../types";

interface TcgCardViewProps {
  card: TcgCard;
  selected?: boolean;
  onClick?: () => void;
}

export function TcgCardView({ card, selected, onClick }: TcgCardViewProps) {
  return (
    <button
      type="button"
      className={`pokemon-card tcg-card${selected ? " pokemon-card--selected" : ""}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <img className="pokemon-card__sprite" src={card.spriteUrl} alt={card.name} loading="lazy" />
      <div className="pokemon-card__name">{card.name}</div>
      <div className="pokemon-card__types">
        <span className={`type-badge type-badge--${card.energyType}`}>{card.energyType}</span>
      </div>
      <div className="pokemon-card__stats">
        <span>HP {card.hp}</span>
        <span>Retreat {card.retreatCost}</span>
      </div>
      <div className="tcg-card__meta">
        {card.weakness && <span className="tcg-card__weakness">Weak: {card.weakness}</span>}
        {card.resistance && <span className="tcg-card__resistance">Resist: {card.resistance}</span>}
      </div>
      <div className="tcg-card__attacks">
        {card.attacks.map((attack) => (
          <div key={attack.name} className="tcg-card__attack">
            {attack.name} <span className="muted">({attack.energyCost}⚡ · {attack.damage} dmg)</span>
          </div>
        ))}
      </div>
    </button>
  );
}
