import type { Api, LoginResult } from "./client";
import type {
  ActivePokemon,
  Battle,
  BattleCard,
  Move,
  Stats,
  TcgActionType,
  TcgBattle,
  TcgCard,
  TcgInPlayCard,
  Trainer,
} from "../types";

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

// --- TCG mode mock dataset - independent of MOCK_SPECIES above (same source
// species, independently-derived card stats, matching the real backend's
// separate pokemon-battle-tcg-cards table). ---
const MOCK_TCG_CARDS: TcgCard[] = [
  {
    cardId: 1,
    name: "bulbasaur",
    energyType: "grass",
    hp: 130,
    weakness: "fire",
    resistance: "water",
    retreatCost: 2,
    attacks: [{ name: "vine-whip", energyCost: 1, damage: 20 }],
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
  },
  {
    cardId: 4,
    name: "charmander",
    energyType: "fire",
    hp: 120,
    weakness: "water",
    resistance: null,
    retreatCost: 1,
    attacks: [{ name: "ember", energyCost: 1, damage: 20 }],
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png",
  },
  {
    cardId: 7,
    name: "squirtle",
    energyType: "water",
    hp: 130,
    weakness: "electric",
    resistance: "fire",
    retreatCost: 1,
    attacks: [{ name: "water-gun", energyCost: 1, damage: 20 }],
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png",
  },
  {
    cardId: 25,
    name: "pikachu",
    energyType: "electric",
    hp: 100,
    weakness: "ground",
    resistance: null,
    retreatCost: 1,
    attacks: [{ name: "thunder-shock", energyCost: 1, damage: 20 }],
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
  },
];

interface MockTrainer {
  trainerId: string;
  name: string;
  type: "human" | "ai";
  roster: { pokemonId: number; level: number; moves: string[] }[];
  battleCards: { pokemonId: number; level: number; moves: string[] }[];
  tcgCards: { cardId: number }[];
  tcgDeck: { cardId: number }[];
}

const trainersById = new Map<string, MockTrainer>();
const trainersByName = new Map<string, MockTrainer>();
const battles = new Map<string, Battle>();
const tcgBattles = new Map<string, TcgBattle>();

let trainerSeq = 1;
let battleSeq = 1;
let tcgBattleSeq = 1;

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

function drawTcgCards(count = 20): MockTrainer["tcgCards"] {
  return sampleDistinct(MOCK_TCG_CARDS, Math.min(count, MOCK_TCG_CARDS.length)).map((card) => ({ cardId: card.cardId }));
}

function enrichTcg(slots: MockTrainer["tcgCards"]): TcgCard[] {
  return slots.flatMap((slot) => {
    const card = MOCK_TCG_CARDS.find((c) => c.cardId === slot.cardId);
    return card ? [card] : [];
  });
}

function toTrainerView(trainer: MockTrainer): Trainer {
  return {
    trainerId: trainer.trainerId,
    name: trainer.name,
    type: trainer.type,
    roster: enrich(trainer.roster),
    battleCards: enrich(trainer.battleCards),
    tcgCards: enrichTcg(trainer.tcgCards),
    tcgDeck: enrichTcg(trainer.tcgDeck),
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

// --- TCG mode mock battle engine - a self-contained reimplementation of the
// real backend's tcg-engine rules (energy/bench/prizes/weakness-resistance),
// kept independent so the mock doesn't depend on backend code. ---

function mustTcgCard(cardId: number): TcgCard {
  const card = MOCK_TCG_CARDS.find((c) => c.cardId === cardId);
  if (!card) throw new Error(`Unknown TCG card ${cardId}`);
  return card;
}

function toInPlay(card: TcgCard): TcgInPlayCard {
  return {
    cardId: card.cardId,
    name: card.name,
    energyType: card.energyType,
    maxHp: card.hp,
    currentHp: card.hp,
    weakness: card.weakness,
    resistance: card.resistance,
    retreatCost: card.retreatCost,
    attacks: card.attacks,
    spriteUrl: card.spriteUrl,
    energyAttached: 0,
  };
}

const TCG_BENCH_SIZE = 3;
const TCG_STARTING_PRIZES = 3;

function buildTcgSideState(trainer: MockTrainer): { state: TcgBattle["side1"]; activeName: string } {
  if (trainer.tcgDeck.length === 0) throw new Error(`${trainer.name} has not picked a TCG deck yet`);
  const cards = trainer.tcgDeck.map((slot) => mustTcgCard(slot.cardId));
  const [activeCard, ...rest] = cards;
  const benchCards = rest.slice(0, TCG_BENCH_SIZE);
  const remaining = rest.slice(TCG_BENCH_SIZE);
  const prizeCount = Math.min(TCG_STARTING_PRIZES, remaining.length);
  const reserve = remaining.slice(prizeCount).map((c) => c.cardId);
  return {
    state: {
      active: toInPlay(activeCard),
      bench: benchCards.map(toInPlay),
      reserve,
      prizesRemaining: prizeCount,
      energyAttachedThisTurn: false,
      retreatedThisTurn: false,
    },
    activeName: activeCard.name,
  };
}

function tcgSideForTrainer(battle: TcgBattle, trainerId: string): "side1" | "side2" {
  return battle.trainer1Id === trainerId ? "side1" : "side2";
}

function resolveTcgActionMock(
  battle: TcgBattle,
  actingSide: "side1" | "side2",
  action: TcgActionType,
  options: { benchCardId?: number; attackName?: string },
): void {
  const acting = battle[actingSide];
  const opponentSide = otherSideKey(actingSide);
  const opponent = battle[opponentSide];
  if (!acting.active) throw new Error("You have no active card and cannot act");

  const log: string[] = [];
  let turnEnds = false;

  if (action === "attach-energy") {
    if (acting.energyAttachedThisTurn) throw new Error("You have already attached energy this turn");
    acting.active.energyAttached += 1;
    acting.energyAttachedThisTurn = true;
    log.push(`${acting.active.name} has ${acting.active.energyAttached} energy attached.`);
  } else if (action === "retreat") {
    if (acting.retreatedThisTurn) throw new Error("You have already retreated this turn");
    const benchIndex = acting.bench.findIndex((c) => c.cardId === options.benchCardId);
    if (benchIndex === -1) throw new Error(`Card ${options.benchCardId} is not on your bench`);
    const activeCard = acting.active;
    if (activeCard.energyAttached < activeCard.retreatCost) {
      throw new Error(`${activeCard.name} needs ${activeCard.retreatCost} energy attached to retreat`);
    }
    activeCard.energyAttached -= activeCard.retreatCost;
    const incoming = acting.bench[benchIndex];
    acting.bench[benchIndex] = activeCard;
    acting.active = incoming;
    acting.retreatedThisTurn = true;
    log.push(`Retreated ${activeCard.name} and brought in ${incoming.name}.`);
  } else if (action === "attack") {
    const attackerCard = acting.active;
    const attack = attackerCard.attacks.find((a) => a.name === options.attackName);
    if (!attack) throw new Error(`${attackerCard.name} does not know "${options.attackName}"`);
    if (attackerCard.energyAttached < attack.energyCost) {
      throw new Error(`${attack.name} needs ${attack.energyCost} energy, has ${attackerCard.energyAttached}`);
    }
    if (!opponent.active) throw new Error("Opponent has no active card to attack");

    const defenderCard = opponent.active;
    let damage = attack.damage;
    if (defenderCard.weakness === attackerCard.energyType) damage *= 2;
    if (defenderCard.resistance === attackerCard.energyType) damage = Math.max(0, damage - 20);
    defenderCard.currentHp = Math.max(0, defenderCard.currentHp - damage);
    log.push(`${attackerCard.name} used ${attack.name} for ${damage} damage.`);

    if (defenderCard.currentHp === 0) {
      log.push(`${defenderCard.name} was knocked out!`);
      acting.prizesRemaining = Math.max(0, acting.prizesRemaining - 1);

      if (acting.prizesRemaining === 0) {
        battle.status = "complete";
        battle.winner = actingSide === "side1" ? battle.trainer1Id : battle.trainer2Id;
        battle.log.push(...log, `${actingSide} takes the last prize and wins!`);
        battle.updatedAt = new Date().toISOString();
        return;
      }

      const promoted = opponent.bench.shift();
      if (!promoted) {
        opponent.active = null;
        battle.status = "complete";
        battle.winner = actingSide === "side1" ? battle.trainer1Id : battle.trainer2Id;
        battle.log.push(...log, `${opponentSide} has no more cards and loses!`);
        battle.updatedAt = new Date().toISOString();
        return;
      }
      opponent.active = promoted;
      log.push(`${opponentSide} sends out ${promoted.name}.`);
    }
    turnEnds = true;
  } else {
    log.push(`${actingSide} ends their turn without attacking.`);
    turnEnds = true;
  }

  if (turnEnds) {
    opponent.energyAttachedThisTurn = false;
    opponent.retreatedThisTurn = false;
    battle.turnSide = opponentSide;
    battle.turn += 1;
  }
  battle.log.push(...log);
  battle.updatedAt = new Date().toISOString();
}

// Simulates an opponent auto-playing their turn, for single-player testing
// convenience (mirroring resolveTurnIfReady's auto-move above): attach energy
// if not yet done, then attack if affordable, otherwise pass the turn.
function autoPlayTcgTurn(battleId: string, side: "side1" | "side2") {
  setTimeout(() => {
    const battle = tcgBattles.get(battleId);
    if (!battle || battle.status !== "active" || battle.turnSide !== side) return;
    const state = battle[side];
    if (!state.active) return;

    if (!state.energyAttachedThisTurn) {
      try {
        resolveTcgActionMock(battle, side, "attach-energy", {});
      } catch {
        /* ignore - best-effort auto-play */
      }
    }

    const usableAttack = state.active.attacks.find((a) => a.energyCost <= (state.active?.energyAttached ?? 0));
    try {
      if (usableAttack) {
        resolveTcgActionMock(battle, side, "attack", { attackName: usableAttack.name });
      } else {
        resolveTcgActionMock(battle, side, "end-turn", {});
      }
    } catch {
      /* ignore - best-effort auto-play */
    }
  }, 900);
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
        tcgCards: drawTcgCards(),
        tcgDeck: [],
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

  // TCG mode - independent dataset/engine, same auth pattern as above.
  setTcgDeck: (trainerId: string, cardIds: number[]) => {
    const trainer = trainersById.get(trainerId);
    if (!trainer) return Promise.reject(new Error(`Trainer ${trainerId} not found`));
    const tcgDeck = cardIds.map((id) => {
      const slot = trainer.tcgCards.find((c) => c.cardId === id);
      if (!slot) throw new Error(`Card ${id} is not one of your TCG cards`);
      return slot;
    });
    trainer.tcgDeck = tcgDeck;
    return delay({ trainerId, tcgDeck: enrichTcg(tcgDeck) });
  },

  rerollTcgCards: (trainerId: string) => {
    const trainer = trainersById.get(trainerId);
    if (!trainer) return Promise.reject(new Error(`Trainer ${trainerId} not found`));
    trainer.tcgCards = drawTcgCards();
    trainer.tcgDeck = [];
    return delay({ trainerId, tcgCards: enrichTcg(trainer.tcgCards), tcgDeck: [] });
  },

  createTcgBattle: (trainer1Id: string, trainer2Id: string) => {
    const t1 = trainersById.get(trainer1Id);
    const t2 = trainersById.get(trainer2Id);
    if (!t1) return Promise.reject(new Error(`Trainer ${trainer1Id} not found`));
    if (!t2) return Promise.reject(new Error(`Trainer ${trainer2Id} not found`));

    let side1: { state: TcgBattle["side1"]; activeName: string };
    let side2: { state: TcgBattle["side1"]; activeName: string };
    try {
      side1 = buildTcgSideState(t1);
      side2 = buildTcgSideState(t2);
    } catch (err) {
      return Promise.reject(err instanceof Error ? err : new Error("Failed to build TCG battle state"));
    }

    const battleId = String(tcgBattleSeq++);
    const turnSide: "side1" | "side2" = Math.random() < 0.5 ? "side1" : "side2";
    const now = new Date().toISOString();
    const battle: TcgBattle = {
      battleId,
      trainer1Id,
      trainer2Id,
      turn: 1,
      turnSide,
      side1: side1.state,
      side2: side2.state,
      log: [`${side1.activeName} vs ${side2.activeName}! ${turnSide === "side1" ? t1.name : t2.name} goes first.`],
      status: "active",
      winner: null,
      createdAt: now,
      updatedAt: now,
    };
    tcgBattles.set(battleId, battle);
    return delay(clone(battle));
  },

  getTcgBattle: (battleId: string) => {
    const battle = tcgBattles.get(battleId);
    if (!battle) return Promise.reject(new Error(`TCG battle ${battleId} not found`));
    return delay(clone(battle), 80);
  },

  submitTcgAction: (
    battleId: string,
    trainerId: string,
    action: TcgActionType,
    options?: { benchCardId?: number; attackName?: string },
  ) => {
    const battle = tcgBattles.get(battleId);
    if (!battle) return Promise.reject(new Error(`TCG battle ${battleId} not found`));
    if (battle.status !== "active") return delay(undefined);

    const side = tcgSideForTrainer(battle, trainerId);
    if (battle.turnSide !== side) return Promise.reject(new Error("It is not your turn"));

    try {
      resolveTcgActionMock(battle, side, action, options ?? {});
    } catch (err) {
      return Promise.reject(err instanceof Error ? err : new Error("Failed to resolve action"));
    }

    if (battle.status === "active" && battle.turnSide !== side) {
      autoPlayTcgTurn(battleId, battle.turnSide);
    }

    return delay(undefined);
  },
};
