import type { Api, LoginResult } from "./client";
import type { ActivePokemon, Battle, BattleCard, Move, Stats, Trainer } from "../types";

// MOCK API - stands in for pokemon-battle-apis until VITE_API_BASE_URL is set.
// Sprite URLs below are stub data shaped like what the real backend returns
// (it caches/serves PokeAPI sprite URLs); the frontend never fetches PokeAPI directly.

interface MockSpecies {
  pokemonId: number;
  name: string;
  spriteUrl: string;
  types: BattleCard["types"];
  baseStats: Stats;
  moves: Move[];
}

const MOCK_SPECIES: MockSpecies[] = [
  {
    pokemonId: 1,
    name: "bulbasaur",
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
    types: ["grass", "poison"],
    baseStats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 },
    moves: [
      { name: "tackle", type: "normal", power: 40, accuracy: 100, pp: 35, damageClass: "physical" },
      { name: "vine-whip", type: "grass", power: 45, accuracy: 100, pp: 25, damageClass: "physical" },
      { name: "growl", type: "normal", power: 0, accuracy: 100, pp: 40, damageClass: "status" },
      { name: "poison-powder", type: "poison", power: 0, accuracy: 75, pp: 35, damageClass: "status" },
    ],
  },
  {
    pokemonId: 4,
    name: "charmander",
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png",
    types: ["fire"],
    baseStats: { hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65 },
    moves: [
      { name: "scratch", type: "normal", power: 40, accuracy: 100, pp: 35, damageClass: "physical" },
      { name: "ember", type: "fire", power: 40, accuracy: 100, pp: 25, damageClass: "special" },
      { name: "growl", type: "normal", power: 0, accuracy: 100, pp: 40, damageClass: "status" },
      { name: "smokescreen", type: "normal", power: 0, accuracy: 100, pp: 20, damageClass: "status" },
    ],
  },
  {
    pokemonId: 7,
    name: "squirtle",
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png",
    types: ["water"],
    baseStats: { hp: 44, attack: 48, defense: 65, specialAttack: 50, specialDefense: 64, speed: 43 },
    moves: [
      { name: "tackle", type: "normal", power: 40, accuracy: 100, pp: 35, damageClass: "physical" },
      { name: "water-gun", type: "water", power: 40, accuracy: 100, pp: 25, damageClass: "special" },
      { name: "withdraw", type: "water", power: 0, accuracy: 100, pp: 40, damageClass: "status" },
      { name: "bubble", type: "water", power: 40, accuracy: 100, pp: 30, damageClass: "special" },
    ],
  },
  {
    pokemonId: 25,
    name: "pikachu",
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
    types: ["electric"],
    baseStats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
    moves: [
      { name: "quick-attack", type: "normal", power: 40, accuracy: 100, pp: 30, damageClass: "physical" },
      { name: "thunder-shock", type: "electric", power: 40, accuracy: 100, pp: 30, damageClass: "special" },
      { name: "growl", type: "normal", power: 0, accuracy: 100, pp: 40, damageClass: "status" },
      { name: "tail-whip", type: "normal", power: 0, accuracy: 100, pp: 30, damageClass: "status" },
    ],
  },
];

interface MockTrainer {
  trainerId: string;
  name: string;
  type: "human" | "ai";
  roster: { pokemonId: number; level: number; moves: string[] }[];
  battleCards: { pokemonId: number; level: number; moves: string[] }[];
}

const trainersById = new Map<string, MockTrainer>();
const trainersByName = new Map<string, MockTrainer>();
const battles = new Map<string, Battle>();

let trainerSeq = 1;
let battleSeq = 1;

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sampleDistinct<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const picked: T[] = [];
  while (picked.length < count && pool.length > 0) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
}

function drawBattleCards(count = 20): MockTrainer["battleCards"] {
  const picked = sampleDistinct(MOCK_SPECIES, Math.min(count, MOCK_SPECIES.length));
  return picked.map((species) => {
    const moveCount = Math.min(species.moves.length, randomInt(1, 4));
    return {
      pokemonId: species.pokemonId,
      level: randomInt(5, 50),
      moves: sampleDistinct(species.moves, moveCount).map((m) => m.name),
    };
  });
}

function enrich(slots: MockTrainer["battleCards"]): BattleCard[] {
  return slots.flatMap((slot) => {
    const species = MOCK_SPECIES.find((s) => s.pokemonId === slot.pokemonId);
    if (!species) return [];
    return [{ ...slot, name: species.name, spriteUrl: species.spriteUrl, types: species.types, baseStats: species.baseStats }];
  });
}

function toTrainerView(trainer: MockTrainer): Trainer {
  return {
    trainerId: trainer.trainerId,
    name: trainer.name,
    type: trainer.type,
    roster: enrich(trainer.roster),
    battleCards: enrich(trainer.battleCards),
  };
}

function statAtLevel(base: number, level: number): number {
  return Math.floor((base * level) / 50) + 5;
}

function hpAtLevel(base: number, level: number): number {
  return Math.floor((base * level) / 50) + level + 10;
}

function buildActivePokemon(slot: MockTrainer["roster"][number]): ActivePokemon {
  const species = MOCK_SPECIES.find((s) => s.pokemonId === slot.pokemonId) ?? MOCK_SPECIES[0];
  const knownMoves = species.moves.filter((m) => slot.moves.includes(m.name));
  const moves = knownMoves.length > 0 ? knownMoves : species.moves.slice(0, 4);
  const maxHp = hpAtLevel(species.baseStats.hp, slot.level);
  return {
    pokemonId: species.pokemonId,
    name: species.name,
    types: species.types,
    level: slot.level,
    stats: {
      hp: maxHp,
      attack: statAtLevel(species.baseStats.attack, slot.level),
      defense: statAtLevel(species.baseStats.defense, slot.level),
      specialAttack: statAtLevel(species.baseStats.specialAttack, slot.level),
      specialDefense: statAtLevel(species.baseStats.specialDefense, slot.level),
      speed: statAtLevel(species.baseStats.speed, slot.level),
    },
    currentHp: maxHp,
    maxHp,
    status: null,
    moves,
  };
}

function otherSideKey(side: "side1" | "side2"): "side1" | "side2" {
  return side === "side1" ? "side2" : "side1";
}

function sideForTrainer(battle: Battle, trainerId: string): "side1" | "side2" {
  return battle.trainer1Id === trainerId ? "side1" : "side2";
}

function resolveTurnIfReady(battle: Battle) {
  const move1 = battle.pendingMoves.side1;
  const move2 = battle.pendingMoves.side2;
  if (!move1 || !move2) return;

  const order: Array<["side1" | "side2", string]> =
    battle.active1.stats.speed >= battle.active2.stats.speed
      ? [["side1", move1], ["side2", move2]]
      : [["side2", move2], ["side1", move1]];

  for (const [side, moveName] of order) {
    const attacker = side === "side1" ? battle.active1 : battle.active2;
    const defender = side === "side1" ? battle.active2 : battle.active1;
    if (defender.currentHp <= 0) continue;

    const move = attacker.moves.find((m) => m.name === moveName);
    if (!move) continue;

    if (move.power === 0) {
      battle.log.push(`${attacker.name} used ${move.name}!`);
      continue;
    }

    const damage = Math.max(1, Math.round(move.power * (0.7 + Math.random() * 0.5) * 0.25));
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    battle.log.push(`${attacker.name} used ${move.name}! It dealt ${damage} damage to ${defender.name}.`);
  }

  battle.pendingMoves = {};
  battle.turn += 1;
  battle.updatedAt = new Date().toISOString();

  if (battle.active1.currentHp <= 0 || battle.active2.currentHp <= 0) {
    battle.status = "complete";
    battle.winner = battle.active1.currentHp <= 0 ? battle.trainer2Id : battle.trainer1Id;
    battle.log.push(`${battle.winner === battle.trainer1Id ? "Trainer 1" : "Trainer 2"} wins the battle!`);
  }
}

export const mockApi: Api = {
  login: (name: string): Promise<LoginResult> => {
    let trainer = trainersByName.get(name);
    if (!trainer) {
      trainer = {
        trainerId: String(trainerSeq++),
        name,
        type: "human",
        roster: [],
        battleCards: drawBattleCards(),
      };
      trainersById.set(trainer.trainerId, trainer);
      trainersByName.set(name, trainer);
    }
    return delay({
      trainer: toTrainerView(trainer),
      tokens: { accessToken: "mock-access-token", idToken: "mock-id-token", expiresIn: 3600 },
    });
  },

  getTrainer: (trainerId: string) => {
    const trainer = trainersById.get(trainerId);
    if (!trainer) return Promise.reject(new Error(`Trainer ${trainerId} not found`));
    return delay(clone(toTrainerView(trainer)));
  },

  setRoster: (trainerId: string, pokemonIds: number[]) => {
    const trainer = trainersById.get(trainerId);
    if (!trainer) return Promise.reject(new Error(`Trainer ${trainerId} not found`));
    const roster = pokemonIds.map((id) => {
      const card = trainer.battleCards.find((c) => c.pokemonId === id);
      if (!card) throw new Error(`Pokemon ${id} is not one of your battle cards`);
      return card;
    });
    trainer.roster = roster;
    return delay({ trainerId, roster: enrich(roster) });
  },

  rerollBattleCards: (trainerId: string) => {
    const trainer = trainersById.get(trainerId);
    if (!trainer) return Promise.reject(new Error(`Trainer ${trainerId} not found`));
    trainer.battleCards = drawBattleCards();
    trainer.roster = [];
    return delay({ trainerId, battleCards: enrich(trainer.battleCards), roster: [] });
  },

  createBattle: (trainer1Id: string, trainer2Id: string) => {
    const t1 = trainersById.get(trainer1Id);
    const t2 = trainersById.get(trainer2Id);
    if (!t1) return Promise.reject(new Error(`Trainer ${trainer1Id} not found`));
    if (!t2) return Promise.reject(new Error(`Trainer ${trainer2Id} not found`));
    if (t1.roster.length === 0) return Promise.reject(new Error(`${t1.name} has not picked a battle roster yet`));
    if (t2.roster.length === 0) return Promise.reject(new Error(`${t2.name} has not picked a battle roster yet`));

    const battleId = String(battleSeq++);
    const active1 = buildActivePokemon(t1.roster[0]);
    const active2 = buildActivePokemon(t2.roster[0]);
    const now = new Date().toISOString();
    const battle: Battle = {
      battleId,
      trainer1Id,
      trainer2Id,
      turn: 1,
      active1,
      active2,
      pendingMoves: {},
      log: [`Battle started! ${t1.name} sent out ${active1.name}. ${t2.name} sent out ${active2.name}.`],
      status: "active",
      winner: null,
      createdAt: now,
      updatedAt: now,
    };
    battles.set(battleId, battle);
    return delay(clone(battle));
  },

  getBattle: (battleId: string) => {
    const battle = battles.get(battleId);
    if (!battle) return Promise.reject(new Error(`Battle ${battleId} not found`));
    return delay(clone(battle), 80);
  },

  submitMove: (battleId: string, trainerId: string, moveName: string) => {
    const battle = battles.get(battleId);
    if (!battle) return Promise.reject(new Error(`Battle ${battleId} not found`));
    if (battle.status !== "active") return delay(undefined);

    const side = sideForTrainer(battle, trainerId);
    battle.pendingMoves[side] = moveName;
    resolveTurnIfReady(battle);

    // Simulate an opponent auto-move for single-player testing convenience
    // when the "opponent" trainer has no human submitting moves in this tab.
    const opponentSide = otherSideKey(side);
    if (battle.status === "active" && !battle.pendingMoves[opponentSide]) {
      setTimeout(() => {
        const freshBattle = battles.get(battleId);
        if (!freshBattle || freshBattle.status !== "active" || freshBattle.pendingMoves[opponentSide]) return;
        const opponentActive = opponentSide === "side1" ? freshBattle.active1 : freshBattle.active2;
        const autoMove = opponentActive.moves[Math.floor(Math.random() * opponentActive.moves.length)];
        freshBattle.pendingMoves[opponentSide] = autoMove.name;
        resolveTurnIfReady(freshBattle);
      }, 900);
    }

    return delay(undefined);
  },
};
