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
  /** Full owned collection of 20 randomly-drawn TCG cards (independent of battleCards). */
  tcgCards: TcgCard[];
  /** Current TCG match deck - a chosen subset of tcgCards - what createTcgBattle uses. */
  tcgDeck: TcgCard[];
}

// --- TCG mode: an independent card-battle mode with its own dataset and
// engine (energy/bench/prizes/weakness-resistance), sharing only the naming
// convention and auth pattern with the video-game mode above. ---

export interface TcgAttack {
  name: string;
  energyCost: number;
  damage: number;
}

/** One of a trainer's 20 owned TCG cards - static reference data. */
export interface TcgCard {
  cardId: number;
  name: string;
  energyType: PokemonTypeName;
  hp: number;
  weakness: PokemonTypeName | null;
  resistance: PokemonTypeName | null;
  retreatCost: number;
  attacks: TcgAttack[];
  spriteUrl: string;
}

/** A card currently in play (active or benched) during a TCG match -
 * denormalized from TcgCard plus match state, so the frontend can render it
 * with no separate card lookup (same idea as ActivePokemon below). */
export interface TcgInPlayCard {
  cardId: number;
  name: string;
  energyType: PokemonTypeName;
  maxHp: number;
  currentHp: number;
  weakness: PokemonTypeName | null;
  resistance: PokemonTypeName | null;
  retreatCost: number;
  attacks: TcgAttack[];
  spriteUrl: string;
  energyAttached: number;
}

export interface TcgSideState {
  active: TcgInPlayCard | null;
  bench: TcgInPlayCard[];
  reserve: number[];
  prizesRemaining: number;
  energyAttachedThisTurn: boolean;
  retreatedThisTurn: boolean;
}

export interface TcgBattle {
  battleId: string;
  trainer1Id: string;
  trainer2Id: string;
  turn: number;
  turnSide: BattleSideKey;
  side1: TcgSideState;
  side2: TcgSideState;
  log: string[];
  status: BattleStatus;
  winner: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TcgActionType = "attach-energy" | "retreat" | "attack" | "end-turn";

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
