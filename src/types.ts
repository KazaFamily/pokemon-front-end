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
// engine, sharing only the naming convention and auth pattern with the
// video-game mode above. Rebuilt on the real Pokemon TCG AI Battle Challenge
// card pool with structural (not card-text) rules - see pokemon-battle-apis's
// README "Rule differences" for what's modeled vs. intentionally left out. ---

export type TcgCardCategory = "pokemon" | "basic-energy" | "special-energy" | "item" | "supporter" | "stadium" | "tool";
export type TcgPokemonStage = "basic" | "stage1" | "stage2";
export type TcgRuleTag = "none" | "ex" | "mega-ex" | "ace-spec";
/** An attack/retreat cost symbol - a specific energy type, or "colorless"
 * (any attached energy, of any type, can pay it). */
export type TcgAttackCostSymbol = PokemonTypeName | "colorless";

export interface TcgAttack {
  name: string;
  cost: TcgAttackCostSymbol[];
  damage: number;
}

interface TcgCardBase {
  cardId: number;
  name: string;
  spriteUrl: string;
  category: TcgCardCategory;
}

export interface TcgPokemonCard extends TcgCardBase {
  category: "pokemon";
  stage: TcgPokemonStage;
  evolvesFrom: string | null;
  ruleTag: TcgRuleTag;
  hp: number;
  energyType: PokemonTypeName;
  weakness: PokemonTypeName | null;
  resistance: PokemonTypeName | null;
  retreatCost: number;
  attacks: TcgAttack[];
}

export interface TcgEnergyCard extends TcgCardBase {
  category: "basic-energy" | "special-energy";
  providesSymbols: TcgAttackCostSymbol[];
}

export interface TcgTrainerCard extends TcgCardBase {
  category: "item" | "supporter" | "stadium" | "tool";
}

/** One card from the full TCG catalog (or a trainer's owned collection) -
 * a union by category. Narrow on `card.category` before reading
 * category-specific fields. */
export type TcgCard = TcgPokemonCard | TcgEnergyCard | TcgTrainerCard;

/** A Pokemon currently in play (active or benched) during a TCG match -
 * denormalized from TcgPokemonCard plus match state, so the frontend can
 * render it with no separate card lookup (same idea as ActivePokemon below).
 * Only Pokemon cards ever sit in active/bench - Energy/Trainer cards are
 * structural hand->discard plays tracked only via attachedEnergy/attachedTools. */
export interface TcgInPlayCard {
  /** Identifies this specific physical card once in play, distinct from
   * cardId (the card species) - a deck may run up to 4 copies of the same
   * species. Preserved across evolution. */
  instanceId: number;
  cardId: number;
  name: string;
  stage: TcgPokemonStage;
  evolvesFrom: string | null;
  ruleTag: TcgRuleTag;
  maxHp: number;
  currentHp: number;
  energyType: PokemonTypeName;
  weakness: PokemonTypeName | null;
  resistance: PokemonTypeName | null;
  retreatCost: number;
  attacks: TcgAttack[];
  spriteUrl: string;
  attachedEnergy: Partial<Record<PokemonTypeName, number>>;
  attachedTools: number[];
  turnsInPlay: number;
  evolvedThisTurn: boolean;
}

export interface TcgSideState {
  /** Face-down draw pile, cardIds. */
  deck: number[];
  /** Cards in hand, cardIds (may contain duplicates). */
  hand: number[];
  discard: number[];
  active: TcgInPlayCard | null;
  /** Up to 5. */
  bench: TcgInPlayCard[];
  /** Face-down prize cards remaining, cardIds - reaching empty means this side wins. */
  prizes: number[];
  energyPlayedThisTurn: boolean;
  supporterPlayedThisTurn: boolean;
  stadiumPlayedThisTurn: boolean;
  retreatedThisTurn: boolean;
}

export type TcgAction =
  | { type: "play-basic"; handCardId: number }
  | { type: "evolve"; handCardId: number; targetInstanceId: number }
  /** targetInstanceId omitted = attach to the active Pokemon. */
  | { type: "attach-energy"; handCardId: number; targetInstanceId?: number }
  | { type: "play-item"; handCardId: number }
  | { type: "play-supporter"; handCardId: number }
  | { type: "play-stadium"; handCardId: number }
  | { type: "retreat"; benchInstanceId: number }
  | { type: "attack"; attackName: string }
  | { type: "end-turn" };

export interface TcgBattle {
  battleId: string;
  trainer1Id: string;
  trainer2Id: string;
  turn: number;
  turnSide: BattleSideKey;
  /** "setup": both hands are dealt but active/bench haven't been chosen yet. */
  status: "setup" | BattleStatus;
  setupDone: { side1: boolean; side2: boolean };
  /** Only one Stadium card is in play across both sides. */
  stadiumCardId: number | null;
  nextInstanceId: number;
  /** ISO timestamp - the side whose turn it is auto-forfeits if this passes. */
  turnExpiresAt: string;
  side1: TcgSideState;
  side2: TcgSideState;
  /** Every action the side-to-act could legally submit right now. Computed
   * on read by GET /tcg-battles/{id} and the actions response - absent from
   * POST /tcg-battles's create response (status is "setup" at that point). */
  legalActions?: TcgAction[];
  log: string[];
  winner: string | null;
  createdAt: string;
  updatedAt: string;
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
