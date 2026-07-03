import type { BattleCard } from "../types";

interface PokemonCardProps {
  card: BattleCard;
  selected?: boolean;
  onClick?: () => void;
}

export function PokemonCard({ card, selected, onClick }: PokemonCardProps) {
  return (
    <button
      type="button"
      className={`pokemon-card${selected ? " pokemon-card--selected" : ""}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <img className="pokemon-card__sprite" src={card.spriteUrl} alt={card.name} loading="lazy" />
      <div className="pokemon-card__name">
        {card.name} <span className="pokemon-card__level">Lv{card.level}</span>
      </div>
      <div className="pokemon-card__types">
        {card.types.map((t) => (
          <span key={t} className={`type-badge type-badge--${t}`}>
            {t}
          </span>
        ))}
      </div>
      <div className="pokemon-card__stats">
        <span>HP {card.baseStats.hp}</span>
        <span>ATK {card.baseStats.attack}</span>
        <span>DEF {card.baseStats.defense}</span>
        <span>SPD {card.baseStats.speed}</span>
      </div>
    </button>
  );
}
