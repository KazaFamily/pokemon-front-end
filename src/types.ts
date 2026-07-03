// Shared domain types, matching pokemon-battle-apis's actual response shapes
// (services/api/src/lib/types.ts and battle-engine/src/types.ts in that repo).

export type PokemonTypeName =
  | "normal" | "fire" | "water" | "electric" | "grass" | "ice"
  | "fighting" | "poison" | "ground" | "flying" | "psychic" | "bug"
  | "rock" | "ghost" | "dragon" | "dark" | "steel" | "fairy";

export type DamageClass = "physical" | "special" | "status";
export type StatusCondition = "burn" | "poison" | "paralysis" | null;

export interface Move {
  name: string; // PokeAPI move slug, e.g. "thunder-shock" - also the move identifier
  type: PokemonTypeName;
  power: number;
  accuracy: number;
  pp: number;
  damageClass: DamageClass;
}

export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

/** A single owned battle card: a specific Pokemon at a level with a moveset,
 * enriched with display data (name/sprite/types/baseStats) by the backend. */
export interface BattleCard {
  pokemonId: number;
  level: number;
  moves: string[]; // move name slugs
  name: string;
  spriteUrl: string;
  types: PokemonTypeName[];
  baseStats: Stats;
}

export interface Trainer {
  trainerId: string;
  name: string;
  type: "human" | "ai";
  /** Current battle-day loadout (subset of battleCards) - what createBattle uses. */
  roster: BattleCard[];
  /** Full owned collection of randomly-drawn cards for this game. */
  battleCards: BattleCard[];
}

export interface ActivePokemon {
  pokemonId: number;
  name: string;
  types: PokemonTypeName[];
  level: number;
  stats: Stats;
  currentHp: number;
  maxHp: number;
  status: StatusCondition;
  moves: Move[];
}

export type BattleSideKey = "side1" | "side2";
export type BattleStatus = "active" | "complete";

export interface Battle {
  battleId: string;
  trainer1Id: string;
  trainer2Id: string;
  turn: number;
  active1: ActivePokemon;
  active2: ActivePokemon;
  pendingMoves: Partial<Record<BattleSideKey, string>>;
  log: string[];
  status: BattleStatus;
  winner: string | null;
  createdAt: string;
  updatedAt: string;
}
