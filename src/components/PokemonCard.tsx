import type { PokemonSpecies } from "../types";

interface PokemonCardProps {
  pokemon: PokemonSpecies;
  selected?: boolean;
  onClick?: () => void;
}

export function PokemonCard({ pokemon, selected, onClick }: PokemonCardProps) {
  return (
    <button
      type="button"
      className={`pokemon-card${selected ? " pokemon-card--selected" : ""}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <img className="pokemon-card__sprite" src={pokemon.spriteUrl} alt={pokemon.name} loading="lazy" />
      <div className="pokemon-card__name">{pokemon.name}</div>
      <div className="pokemon-card__types">
        {pokemon.types.map((t) => (
          <span key={t} className={`type-badge type-badge--${t}`}>
            {t}
          </span>
        ))}
      </div>
      <div className="pokemon-card__stats">
        <span>HP {pokemon.baseStats.hp}</span>
        <span>ATK {pokemon.baseStats.attack}</span>
        <span>DEF {pokemon.baseStats.defense}</span>
        <span>SPD {pokemon.baseStats.speed}</span>
      </div>
    </button>
  );
}
