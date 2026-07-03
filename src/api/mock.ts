import type { Api } from "./client";
import type { Battle, PokemonSpecies, Trainer } from "../types";

// MOCK API - stands in for pokemon-battle-apis until VITE_API_BASE_URL is set.
// Sprite URLs below are stub data shaped like what the real backend will return
// (it caches/serves PokeAPI sprite URLs); the frontend never fetches PokeAPI directly.
const MOCK_POKEMON: PokemonSpecies[] = [
  {
    id: "1",
    name: "Bulbasaur",
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
    types: ["grass", "poison"],
    baseStats: { hp: 45, attack: 49, defense: 49, speed: 45 },
    moves: [
      { id: "tackle", name: "Tackle", type: "normal", power: 40, accuracy: 100, pp: 35 },
      { id: "vine-whip", name: "Vine Whip", type: "grass", power: 45, accuracy: 100, pp: 25 },
      { id: "growl", name: "Growl", type: "normal", power: null, accuracy: 100, pp: 40 },
      { id: "poison-powder", name: "Poison Powder", type: "poison", power: null, accuracy: 75, pp: 35 },
    ],
  },
  {
    id: "4",
    name: "Charmander",
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png",
    types: ["fire"],
    baseStats: { hp: 39, attack: 52, defense: 43, speed: 65 },
    moves: [
      { id: "scratch", name: "Scratch", type: "normal", power: 40, accuracy: 100, pp: 35 },
      { id: "ember", name: "Ember", type: "fire", power: 40, accuracy: 100, pp: 25 },
      { id: "growl", name: "Growl", type: "normal", power: null, accuracy: 100, pp: 40 },
      { id: "smokescreen", name: "Smokescreen", type: "normal", power: null, accuracy: 100, pp: 20 },
    ],
  },
  {
    id: "7",
    name: "Squirtle",
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png",
    types: ["water"],
    baseStats: { hp: 44, attack: 48, defense: 65, speed: 43 },
    moves: [
      { id: "tackle", name: "Tackle", type: "normal", power: 40, accuracy: 100, pp: 35 },
      { id: "water-gun", name: "Water Gun", type: "water", power: 40, accuracy: 100, pp: 25 },
      { id: "withdraw", name: "Withdraw", type: "water", power: null, accuracy: 100, pp: 40 },
      { id: "bubble", name: "Bubble", type: "water", power: 40, accuracy: 100, pp: 30 },
    ],
  },
  {
    id: "25",
    name: "Pikachu",
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
    types: ["electric"],
    baseStats: { hp: 35, attack: 55, defense: 40, speed: 90 },
    moves: [
      { id: "quick-attack", name: "Quick Attack", type: "normal", power: 40, accuracy: 100, pp: 30 },
      { id: "thunder-shock", name: "Thunder Shock", type: "electric", power: 40, accuracy: 100, pp: 30 },
      { id: "growl", name: "Growl", type: "normal", power: null, accuracy: 100, pp: 40 },
      { id: "tail-whip", name: "Tail Whip", type: "normal", power: null, accuracy: 100, pp: 30 },
    ],
  },
];

const trainers = new Map<string, Trainer>();
const battles = new Map<string, Battle>();

let trainerSeq = 1;
let battleSeq = 1;
let logSeq = 1;

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// Trainer/Battle objects are mutated in place as the in-memory store of record, so
// every call returns a fresh clone - otherwise repeated polls of the same mutated
// object would hand back a referentially-identical value and React would bail out
// of re-rendering even though the underlying state changed.
function clone<T>(value: T): T {
  return structuredClone(value);
}

function pickPokemon(): PokemonSpecies {
  return MOCK_POKEMON[Math.floor(Math.random() * MOCK_POKEMON.length)];
}

function otherSide(battle: Battle, trainerId: string) {
  return battle.sides[0].trainerId === trainerId ? battle.sides[1] : battle.sides[0];
}

function thisSide(battle: Battle, trainerId: string) {
  return battle.sides[0].trainerId === trainerId ? battle.sides[0] : battle.sides[1];
}

function resolveTurnIfReady(battle: Battle, pendingMoves: Map<string, string>) {
  const [a, b] = battle.sides;
  if (!a.hasSubmittedMove || !b.hasSubmittedMove) return;

  const order = a.active.pokemon.baseStats.speed >= b.active.pokemon.baseStats.speed ? [a, b] : [b, a];

  for (const attacker of order) {
    const defender = attacker === a ? b : a;
    if (defender.active.currentHp <= 0) continue;

    const moveId = pendingMoves.get(attacker.trainerId);
    const move = attacker.active.pokemon.moves.find((m) => m.id === moveId);
    if (!move) continue;

    if (move.power == null) {
      battle.log.push({
        id: String(logSeq++),
        turn: battle.turn,
        message: `${attacker.active.pokemon.name} used ${move.name}!`,
      });
      continue;
    }

    const damage = Math.max(1, Math.round(move.power * (0.7 + Math.random() * 0.5) * 0.25));
    defender.active.currentHp = Math.max(0, defender.active.currentHp - damage);
    battle.log.push({
      id: String(logSeq++),
      turn: battle.turn,
      message: `${attacker.active.pokemon.name} used ${move.name}! It dealt ${damage} damage to ${defender.active.pokemon.name}.`,
    });
  }

  a.hasSubmittedMove = false;
  b.hasSubmittedMove = false;
  battle.turn += 1;
  battle.waitingOn = [a.trainerId, b.trainerId];
  pendingMoves.clear();

  if (a.active.currentHp <= 0 || b.active.currentHp <= 0) {
    battle.status = "finished";
    battle.winnerTrainerId = a.active.currentHp <= 0 ? b.trainerId : a.trainerId;
    battle.log.push({
      id: String(logSeq++),
      turn: battle.turn,
      message: `${battle.winnerTrainerId === a.trainerId ? a.trainerName : b.trainerName} wins the battle!`,
    });
    battle.waitingOn = [];
  }
}

const pendingMovesByBattle = new Map<string, Map<string, string>>();

export const mockApi: Api = {
  listPokemon: () => delay([...MOCK_POKEMON]),

  createTrainer: (name: string) => {
    const id = String(trainerSeq++);
    const trainer: Trainer = { id, name, roster: [] };
    trainers.set(id, trainer);
    return delay(clone(trainer));
  },

  getTrainer: (trainerId: string) => {
    const trainer = trainers.get(trainerId);
    if (!trainer) return Promise.reject(new Error(`Trainer ${trainerId} not found`));
    return delay(clone(trainer));
  },

  setTrainerRoster: (trainerId: string, pokemonIds: string[]) => {
    const trainer = trainers.get(trainerId);
    if (!trainer) return Promise.reject(new Error(`Trainer ${trainerId} not found`));
    trainer.roster = pokemonIds
      .map((id) => MOCK_POKEMON.find((p) => p.id === id))
      .filter((p): p is PokemonSpecies => Boolean(p));
    return delay(clone(trainer));
  },

  createBattle: (trainerId: string, opponentTrainerId: string) => {
    const trainer = trainers.get(trainerId);
    const opponent = trainers.get(opponentTrainerId);
    if (!trainer) return Promise.reject(new Error(`Trainer ${trainerId} not found`));
    if (!opponent) return Promise.reject(new Error(`Opponent trainer ${opponentTrainerId} not found`));

    const trainerMon = trainer.roster[0] ?? pickPokemon();
    const opponentMon = opponent.roster[0] ?? pickPokemon();

    const id = String(battleSeq++);
    const battle: Battle = {
      id,
      status: "active",
      turn: 1,
      sides: [
        {
          trainerId: trainer.id,
          trainerName: trainer.name,
          active: { pokemon: trainerMon, currentHp: trainerMon.baseStats.hp, maxHp: trainerMon.baseStats.hp },
          hasSubmittedMove: false,
        },
        {
          trainerId: opponent.id,
          trainerName: opponent.name,
          active: { pokemon: opponentMon, currentHp: opponentMon.baseStats.hp, maxHp: opponentMon.baseStats.hp },
          hasSubmittedMove: false,
        },
      ],
      log: [
        {
          id: String(logSeq++),
          turn: 1,
          message: `Battle started! ${trainer.name} sent out ${trainerMon.name}. ${opponent.name} sent out ${opponentMon.name}.`,
        },
      ],
      winnerTrainerId: null,
      waitingOn: [trainer.id, opponent.id],
    };
    battles.set(id, battle);
    pendingMovesByBattle.set(id, new Map());
    return delay(clone(battle));
  },

  getBattle: (battleId: string) => {
    const battle = battles.get(battleId);
    if (!battle) return Promise.reject(new Error(`Battle ${battleId} not found`));
    return delay(clone(battle), 80);
  },

  submitMove: (battleId: string, trainerId: string, moveId: string) => {
    const battle = battles.get(battleId);
    if (!battle) return Promise.reject(new Error(`Battle ${battleId} not found`));
    if (battle.status !== "active") return delay(clone(battle));

    const side = thisSide(battle, trainerId);
    side.hasSubmittedMove = true;
    battle.waitingOn = battle.waitingOn.filter((id) => id !== trainerId);

    const pending = pendingMovesByBattle.get(battleId)!;
    pending.set(trainerId, moveId);

    resolveTurnIfReady(battle, pending);

    // Simulate an opponent auto-move for single-player testing convenience
    // when the "opponent" trainer has no human submitting moves in this tab.
    const opponent = otherSide(battle, trainerId);
    if (battle.status === "active" && !opponent.hasSubmittedMove) {
      setTimeout(() => {
        const freshBattle = battles.get(battleId);
        if (!freshBattle || freshBattle.status !== "active") return;
        const freshOpponent = otherSide(freshBattle, trainerId);
        if (freshOpponent.hasSubmittedMove) return;
        const autoMove = freshOpponent.active.pokemon.moves[
          Math.floor(Math.random() * freshOpponent.active.pokemon.moves.length)
        ];
        freshOpponent.hasSubmittedMove = true;
        freshBattle.waitingOn = freshBattle.waitingOn.filter((id) => id !== freshOpponent.trainerId);
        const freshPending = pendingMovesByBattle.get(battleId)!;
        freshPending.set(freshOpponent.trainerId, autoMove.id);
        resolveTurnIfReady(freshBattle, freshPending);
      }, 900);
    }

    return delay(clone(battle));
  },

  healthCheck: () => delay({ ok: true }),
};
