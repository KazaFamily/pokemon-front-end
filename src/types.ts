// Shared domain types. Adapt these once the real pokemon-battle-apis response shape is known.

export interface PokemonType {
  name: string;
}

export interface Move {
  id: string;
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
}

export interface PokemonSpecies {
  id: string;
  name: string;
  spriteUrl: string;
  types: string[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  moves: Move[];
}

export interface Trainer {
  id: string;
  name: string;
  roster: PokemonSpecies[];
}

export type BattleStatus = "waiting" | "active" | "finished";

export interface ActivePokemon {
  pokemon: PokemonSpecies;
  currentHp: number;
  maxHp: number;
}

export interface BattleSide {
  trainerId: string;
  trainerName: string;
  active: ActivePokemon;
  hasSubmittedMove: boolean;
}

export interface BattleLogEntry {
  id: string;
  turn: number;
  message: string;
}

export interface Battle {
  id: string;
  status: BattleStatus;
  turn: number;
  sides: [BattleSide, BattleSide];
  log: BattleLogEntry[];
  winnerTrainerId: string | null;
  /** trainerId of whoever the viewer needs to wait on, if anyone */
  waitingOn: string[];
}
