import type { Api, LoginResult } from "./client";
import type {
  ActivePokemon,
  Battle,
  BattleCard,
  Move,
  Stats,
  TcgAction,
  TcgBattle,
  TcgCard,
  TcgInPlayCard,
  TcgPokemonCard,
  TcgSideState,
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

// --- TCG mode mock dataset - a small, self-contained catalog (not a mirror
// of the real ~1,267-card catalog) that's enough to exercise every new flow
// locally: deck building, mulligan/setup, evolution, energy-by-type,
// structural Trainer cards, retreat, attack, end-turn. Independent of
// MOCK_SPECIES above and of the real backend's tcg-engine (same
// "self-contained, no shared code" convention as the rest of this file). ---
const MOCK_TCG_CATALOG: TcgCard[] = [
  {
    cardId: 1,
    name: "Bulbasaur",
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
    category: "pokemon",
    stage: "basic",
    evolvesFrom: null,
    ruleTag: "none",
    hp: 90,
    energyType: "grass",
    weakness: "fire",
    resistance: null,
    retreatCost: 1,
    attacks: [{ name: "Vine Whip", cost: ["grass", "colorless"], damage: 20 }],
  },
  {
    cardId: 4,
    name: "Charmander",
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png",
    category: "pokemon",
    stage: "basic",
    evolvesFrom: null,
    ruleTag: "none",
    hp: 80,
    energyType: "fire",
    weakness: "water",
    resistance: null,
    retreatCost: 1,
    attacks: [{ name: "Ember", cost: ["fire"], damage: 20 }],
  },
  {
    cardId: 5,
    name: "Charmeleon",
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/5.png",
    category: "pokemon",
    stage: "stage1",
    evolvesFrom: "Charmander",
    ruleTag: "none",
    hp: 110,
    energyType: "fire",
    weakness: "water",
    resistance: null,
    retreatCost: 2,
    attacks: [{ name: "Flamethrower", cost: ["fire", "fire", "colorless"], damage: 60 }],
  },
  {
    cardId: 7,
    name: "Squirtle",
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png",
    category: "pokemon",
    stage: "basic",
    evolvesFrom: null,
    ruleTag: "none",
    hp: 90,
    energyType: "water",
    weakness: "electric",
    resistance: null,
    retreatCost: 1,
    attacks: [{ name: "Water Gun", cost: ["water", "colorless"], damage: 20 }],
  },
  {
    cardId: 25,
    name: "Pikachu",
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
    category: "pokemon",
    stage: "basic",
    evolvesFrom: null,
    ruleTag: "none",
    hp: 70,
    energyType: "electric",
    weakness: "ground",
    resistance: null,
    retreatCost: 1,
    attacks: [{ name: "Thunder Shock", cost: ["electric"], damage: 20 }],
  },
  { cardId: 101, name: "Basic Fire Energy", spriteUrl: "", category: "basic-energy", providesSymbols: ["fire"] },
  { cardId: 102, name: "Basic Water Energy", spriteUrl: "", category: "basic-energy", providesSymbols: ["water"] },
  { cardId: 103, name: "Basic Grass Energy", spriteUrl: "", category: "basic-energy", providesSymbols: ["grass"] },
  { cardId: 104, name: "Basic Electric Energy", spriteUrl: "", category: "basic-energy", providesSymbols: ["electric"] },
  { cardId: 105, name: "Double Colorless Energy", spriteUrl: "", category: "special-energy", providesSymbols: ["colorless", "colorless"] },
  { cardId: 201, name: "Poke Ball", spriteUrl: "", category: "item" },
  { cardId: 202, name: "Professor's Research", spriteUrl: "", category: "supporter" },
  { cardId: 203, name: "Path to the Peak", spriteUrl: "", category: "stadium" },
];

const MOCK_TCG_CATALOG_BY_ID = new Map(MOCK_TCG_CATALOG.map((c) => [c.cardId, c]));

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
  return sampleDistinct(MOCK_TCG_CATALOG, Math.min(count, MOCK_TCG_CATALOG.length)).map((card) => ({ cardId: card.cardId }));
}

function enrichTcg(slots: MockTrainer["tcgCards"]): TcgCard[] {
  return slots.flatMap((slot) => {
    const card = MOCK_TCG_CATALOG_BY_ID.get(slot.cardId);
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

function tcgSideForTrainer(battle: TcgBattle, trainerId: string): "side1" | "side2" {
  return battle.trainer1Id === trainerId ? "side1" : "side2";
}

// --- TCG mode mock battle engine - a self-contained, simplified
// reimplementation of the real backend's structural rules (deck/hand/draw,
// evolution, energy-by-type, bench-of-5, prizes-of-6, legal-move
// enumeration), kept independent so the mock doesn't depend on backend code. ---

const TCG_DECK_SIZE = 60;
const TCG_HAND_SIZE = 7;
const TCG_PRIZE_SIZE = 6;
const TCG_BENCH_SIZE = 5;
const TCG_MAX_COPIES = 4;
let tcgInstanceSeq = 1;

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function hasBasicPokemon(cardIds: number[]): boolean {
  return cardIds.some((id) => {
    const card = MOCK_TCG_CATALOG_BY_ID.get(id);
    return card?.category === "pokemon" && card.stage === "basic";
  });
}

function dealOpeningHand(deckCardIds: number[]): { hand: number[]; deck: number[]; prizes: number[] } {
  for (let attempt = 0; attempt < 20; attempt++) {
    const shuffled = shuffle(deckCardIds);
    const hand = shuffled.slice(0, TCG_HAND_SIZE);
    if (hasBasicPokemon(hand)) {
      const rest = shuffled.slice(TCG_HAND_SIZE);
      return { hand, prizes: rest.slice(0, TCG_PRIZE_SIZE), deck: rest.slice(TCG_PRIZE_SIZE) };
    }
  }
  throw new Error("Could not deal an opening hand with a Basic Pokemon - check this deck is legal");
}

function buildTcgSideState(trainer: MockTrainer): TcgSideState {
  const deckCardIds = trainer.tcgDeck.map((slot) => slot.cardId);
  if (deckCardIds.length !== TCG_DECK_SIZE) {
    throw new Error(`${trainer.name}'s TCG deck is not a legal ${TCG_DECK_SIZE}-card deck yet`);
  }
  const { hand, deck, prizes } = dealOpeningHand(deckCardIds);
  return {
    deck,
    hand,
    discard: [],
    active: null,
    bench: [],
    prizes,
    energyPlayedThisTurn: false,
    supporterPlayedThisTurn: false,
    stadiumPlayedThisTurn: false,
    retreatedThisTurn: false,
  };
}

function createInPlayCard(card: TcgPokemonCard): TcgInPlayCard {
  return {
    instanceId: tcgInstanceSeq++,
    cardId: card.cardId,
    name: card.name,
    stage: card.stage,
    evolvesFrom: card.evolvesFrom,
    ruleTag: card.ruleTag,
    maxHp: card.hp,
    currentHp: card.hp,
    energyType: card.energyType,
    weakness: card.weakness,
    resistance: card.resistance,
    retreatCost: card.retreatCost,
    attacks: card.attacks,
    spriteUrl: card.spriteUrl,
    attachedEnergy: {},
    attachedTools: [],
    turnsInPlay: 0,
    evolvedThisTurn: false,
  };
}

function takeFromHand(hand: number[], cardId: number): number[] {
  const index = hand.indexOf(cardId);
  if (index === -1) throw new Error(`Card ${cardId} is not in your hand`);
  const next = [...hand];
  next.splice(index, 1);
  return next;
}

function totalAttached(attached: TcgInPlayCard["attachedEnergy"]): number {
  return Object.values(attached).reduce((sum: number, n) => sum + (n ?? 0), 0);
}

function canPayCost(attached: TcgInPlayCard["attachedEnergy"], cost: (keyof NonNullable<TcgInPlayCard["attachedEnergy"]> | "colorless")[]): boolean {
  const remaining = { ...attached };
  let colorlessNeeded = 0;
  for (const symbol of cost) {
    if (symbol === "colorless") {
      colorlessNeeded++;
      continue;
    }
    const have = remaining[symbol] ?? 0;
    if (have <= 0) return false;
    remaining[symbol] = have - 1;
  }
  return totalAttached(remaining) >= colorlessNeeded;
}

function findInPlay(side: TcgSideState, instanceId: number): TcgInPlayCard | null {
  if (side.active?.instanceId === instanceId) return side.active;
  return side.bench.find((c) => c.instanceId === instanceId) ?? null;
}

function getLegalTcgActionsMock(acting: TcgSideState, opponent: TcgSideState): TcgAction[] {
  const actions: TcgAction[] = [];
  const inPlay = [acting.active, ...acting.bench].filter((c): c is TcgInPlayCard => c !== null);

  for (const handCardId of new Set(acting.hand)) {
    const card = MOCK_TCG_CATALOG_BY_ID.get(handCardId);
    if (!card) continue;

    if (card.category === "pokemon" && card.stage === "basic") {
      if (!acting.active || acting.bench.length < TCG_BENCH_SIZE) actions.push({ type: "play-basic", handCardId });
      continue;
    }
    if (card.category === "pokemon" && card.evolvesFrom) {
      const expectedFromStage = card.stage === "stage1" ? "basic" : "stage1";
      for (const target of inPlay) {
        if (target.name === card.evolvesFrom && target.stage === expectedFromStage && target.turnsInPlay >= 1 && !target.evolvedThisTurn) {
          actions.push({ type: "evolve", handCardId, targetInstanceId: target.instanceId });
        }
      }
      continue;
    }
    if (card.category === "basic-energy" || card.category === "special-energy") {
      if (!acting.energyPlayedThisTurn) {
        for (const target of inPlay) actions.push({ type: "attach-energy", handCardId, targetInstanceId: target.instanceId });
      }
      continue;
    }
    if (card.category === "item") {
      actions.push({ type: "play-item", handCardId });
      continue;
    }
    if (card.category === "supporter") {
      if (!acting.supporterPlayedThisTurn) actions.push({ type: "play-supporter", handCardId });
      continue;
    }
    if (card.category === "stadium") {
      if (!acting.stadiumPlayedThisTurn) actions.push({ type: "play-stadium", handCardId });
      continue;
    }
  }

  if (!acting.retreatedThisTurn && acting.active && totalAttached(acting.active.attachedEnergy) >= acting.active.retreatCost) {
    for (const benchCard of acting.bench) actions.push({ type: "retreat", benchInstanceId: benchCard.instanceId });
  }
  if (acting.active && opponent.active) {
    for (const attack of acting.active.attacks) {
      if (canPayCost(acting.active.attachedEnergy, attack.cost)) actions.push({ type: "attack", attackName: attack.name });
    }
  }
  actions.push({ type: "end-turn" });
  return actions;
}

function resolveTcgActionMock(battle: TcgBattle, actingSide: "side1" | "side2", action: TcgAction): void {
  const acting = battle[actingSide];
  const opponentSide = otherSideKey(actingSide);
  const opponent = battle[opponentSide];
  const log: string[] = [];
  let turnEnds = false;

  switch (action.type) {
    case "play-basic": {
      const card = MOCK_TCG_CATALOG_BY_ID.get(action.handCardId);
      if (!card || card.category !== "pokemon" || card.stage !== "basic") throw new Error(`Card ${action.handCardId} is not a Basic Pokemon`);
      if (acting.active && acting.bench.length >= TCG_BENCH_SIZE) throw new Error(`Your bench is full (max ${TCG_BENCH_SIZE})`);
      acting.hand = takeFromHand(acting.hand, action.handCardId);
      const inPlay = createInPlayCard(card);
      if (!acting.active) {
        acting.active = inPlay;
        log.push(`${card.name} takes the active spot.`);
      } else {
        acting.bench.push(inPlay);
        log.push(`${card.name} joins the bench.`);
      }
      break;
    }
    case "evolve": {
      const card = MOCK_TCG_CATALOG_BY_ID.get(action.handCardId);
      if (!card || card.category !== "pokemon" || card.stage === "basic" || !card.evolvesFrom) throw new Error("Not an evolution card");
      const target = findInPlay(acting, action.targetInstanceId);
      if (!target) throw new Error("No such in-play Pokemon");
      if (target.name !== card.evolvesFrom) throw new Error(`${card.name} does not evolve from ${target.name}`);
      if (target.turnsInPlay < 1) throw new Error(`${target.name} can't evolve the turn it entered play`);
      if (target.evolvedThisTurn) throw new Error(`${target.name} has already evolved this turn`);
      acting.hand = takeFromHand(acting.hand, action.handCardId);
      const damageTaken = target.maxHp - target.currentHp;
      const evolved: TcgInPlayCard = {
        ...target,
        cardId: card.cardId,
        name: card.name,
        stage: card.stage,
        maxHp: card.hp,
        currentHp: Math.max(0, card.hp - damageTaken),
        energyType: card.energyType,
        weakness: card.weakness,
        resistance: card.resistance,
        retreatCost: card.retreatCost,
        attacks: card.attacks,
        evolvedThisTurn: true,
      };
      if (acting.active?.instanceId === target.instanceId) acting.active = evolved;
      else acting.bench[acting.bench.findIndex((c) => c.instanceId === target.instanceId)] = evolved;
      log.push(`${target.name} evolved into ${card.name}!`);
      break;
    }
    case "attach-energy": {
      if (acting.energyPlayedThisTurn) throw new Error("You have already attached energy this turn");
      const card = MOCK_TCG_CATALOG_BY_ID.get(action.handCardId);
      if (!card || (card.category !== "basic-energy" && card.category !== "special-energy")) throw new Error("Not an Energy card");
      const target = action.targetInstanceId === undefined ? acting.active : findInPlay(acting, action.targetInstanceId);
      if (!target) throw new Error("No target Pokemon to attach energy to");
      acting.hand = takeFromHand(acting.hand, action.handCardId);
      for (const symbol of card.providesSymbols) {
        if (symbol === "colorless") continue;
        target.attachedEnergy[symbol] = (target.attachedEnergy[symbol] ?? 0) + 1;
      }
      acting.energyPlayedThisTurn = true;
      log.push(`${card.name} attached to ${target.name}.`);
      break;
    }
    case "play-item": {
      const card = MOCK_TCG_CATALOG_BY_ID.get(action.handCardId);
      if (!card || card.category !== "item") throw new Error("Not an Item card");
      acting.hand = takeFromHand(acting.hand, action.handCardId);
      acting.discard.push(card.cardId);
      log.push(`Played ${card.name}.`);
      break;
    }
    case "play-supporter": {
      if (acting.supporterPlayedThisTurn) throw new Error("You have already played a Supporter this turn");
      const card = MOCK_TCG_CATALOG_BY_ID.get(action.handCardId);
      if (!card || card.category !== "supporter") throw new Error("Not a Supporter card");
      acting.hand = takeFromHand(acting.hand, action.handCardId);
      acting.discard.push(card.cardId);
      acting.supporterPlayedThisTurn = true;
      log.push(`Played ${card.name}.`);
      break;
    }
    case "play-stadium": {
      if (acting.stadiumPlayedThisTurn) throw new Error("You have already played a Stadium this turn");
      const card = MOCK_TCG_CATALOG_BY_ID.get(action.handCardId);
      if (!card || card.category !== "stadium") throw new Error("Not a Stadium card");
      acting.hand = takeFromHand(acting.hand, action.handCardId);
      battle.stadiumCardId = card.cardId;
      acting.stadiumPlayedThisTurn = true;
      log.push(`Played ${card.name} as the active Stadium.`);
      break;
    }
    case "retreat": {
      if (acting.retreatedThisTurn) throw new Error("You have already retreated this turn");
      if (!acting.active) throw new Error("You have no active Pokemon to retreat");
      const benchIndex = acting.bench.findIndex((c) => c.instanceId === action.benchInstanceId);
      if (benchIndex === -1) throw new Error("No such bench Pokemon");
      const activeCard = acting.active;
      if (totalAttached(activeCard.attachedEnergy) < activeCard.retreatCost) throw new Error(`${activeCard.name} needs more energy to retreat`);
      let toDiscard = activeCard.retreatCost;
      const remaining = { ...activeCard.attachedEnergy };
      while (toDiscard > 0) {
        const [type] = (Object.entries(remaining) as [keyof typeof remaining, number][]).filter(([, c]) => c > 0).sort(([, a], [, b]) => b - a)[0] ?? [];
        if (!type) break;
        const next = (remaining[type] ?? 0) - 1;
        if (next > 0) remaining[type] = next;
        else delete remaining[type];
        toDiscard--;
      }
      activeCard.attachedEnergy = remaining;
      const incoming = acting.bench[benchIndex];
      acting.bench[benchIndex] = activeCard;
      acting.active = incoming;
      acting.retreatedThisTurn = true;
      log.push(`Retreated ${activeCard.name} and brought in ${incoming.name}.`);
      break;
    }
    case "attack": {
      if (!acting.active) throw new Error("You have no active Pokemon to attack with");
      const attackerCard = acting.active;
      const attack = attackerCard.attacks.find((a) => a.name === action.attackName);
      if (!attack) throw new Error(`${attackerCard.name} does not know "${action.attackName}"`);
      if (!canPayCost(attackerCard.attachedEnergy, attack.cost)) throw new Error(`${attackerCard.name} does not have enough energy for ${attack.name}`);
      if (!opponent.active) throw new Error("Opponent has no active Pokemon to attack");
      const defenderCard = opponent.active;
      let damage = attack.damage;
      if (defenderCard.weakness === attackerCard.energyType) damage *= 2;
      if (defenderCard.resistance === attackerCard.energyType) damage = Math.max(0, damage - 20);
      defenderCard.currentHp = Math.max(0, defenderCard.currentHp - damage);
      log.push(`${attackerCard.name} used ${attack.name} for ${damage} damage.`);

      if (defenderCard.currentHp === 0) {
        log.push(`${defenderCard.name} was knocked out!`);
        const prizeCount = Math.min(defenderCard.ruleTag === "ex" || defenderCard.ruleTag === "mega-ex" ? 2 : 1, acting.prizes.length);
        for (let i = 0; i < prizeCount; i++) {
          const prizeCardId = acting.prizes.shift();
          if (prizeCardId !== undefined) acting.hand.push(prizeCardId);
        }
        if (acting.prizes.length === 0) {
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
          battle.log.push(...log, `${opponentSide} has no more Pokemon and loses!`);
          battle.updatedAt = new Date().toISOString();
          return;
        }
        opponent.active = promoted;
        log.push(`${opponentSide} sends out ${promoted.name}.`);
      }
      turnEnds = true;
      break;
    }
    case "end-turn": {
      log.push(`${actingSide} ends their turn without attacking.`);
      turnEnds = true;
      break;
    }
  }

  if (turnEnds) {
    opponent.energyPlayedThisTurn = false;
    opponent.supporterPlayedThisTurn = false;
    opponent.stadiumPlayedThisTurn = false;
    opponent.retreatedThisTurn = false;
    for (const card of [opponent.active, ...opponent.bench]) {
      if (!card) continue;
      card.turnsInPlay += 1;
      card.evolvedThisTurn = false;
    }
    const drawnCardId = opponent.deck.shift();
    if (drawnCardId === undefined) {
      battle.status = "complete";
      battle.winner = actingSide === "side1" ? battle.trainer1Id : battle.trainer2Id;
      battle.log.push(...log, `${opponentSide} has no cards left to draw and loses!`);
      battle.updatedAt = new Date().toISOString();
      return;
    }
    opponent.hand.push(drawnCardId);
    log.push(`${opponentSide} draws a card.`);
    battle.turnSide = opponentSide;
    battle.turn += 1;
    battle.turnExpiresAt = new Date(Date.now() + 120_000).toISOString();
  }
  battle.log.push(...log);
  battle.updatedAt = new Date().toISOString();
}

// Simulates an opponent auto-playing their turn, for single-player testing
// convenience: attach energy and play a Basic if possible, then attack if
// affordable, otherwise pass the turn. Does NOT auto-complete opponent setup
// (see this repo's testing notes) - use two logins/tabs for that step.
function autoPlayTcgTurn(battleId: string, side: "side1" | "side2") {
  setTimeout(() => {
    const battle = tcgBattles.get(battleId);
    if (!battle || battle.status !== "active" || battle.turnSide !== side) return;
    const state = battle[side];
    if (!state.active) return;

    if (!state.energyPlayedThisTurn) {
      const energyCardId = state.hand.find((id) => {
        const card = MOCK_TCG_CATALOG_BY_ID.get(id);
        return card?.category === "basic-energy" || card?.category === "special-energy";
      });
      if (energyCardId !== undefined) {
        try {
          resolveTcgActionMock(battle, side, { type: "attach-energy", handCardId: energyCardId });
        } catch {
          /* ignore - best-effort auto-play */
        }
      }
    }

    const usableAttack = state.active.attacks.find((a) => canPayCost(state.active!.attachedEnergy, a.cost));
    try {
      if (usableAttack) {
        resolveTcgActionMock(battle, side, { type: "attack", attackName: usableAttack.name });
      } else {
        resolveTcgActionMock(battle, side, { type: "end-turn" });
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
    if (cardIds.length !== TCG_DECK_SIZE) return Promise.reject(new Error(`cardIds must be an array of exactly ${TCG_DECK_SIZE} card IDs`));

    const countsByName = new Map<string, number>();
    let aceSpecCount = 0;
    let hasBasic = false;
    for (const cardId of cardIds) {
      const card = MOCK_TCG_CATALOG_BY_ID.get(cardId);
      if (!card) return Promise.reject(new Error(`Unknown card ID: ${cardId}`));
      if (card.category !== "basic-energy") countsByName.set(card.name, (countsByName.get(card.name) ?? 0) + 1);
      if (card.category === "pokemon" && card.ruleTag === "ace-spec") aceSpecCount++;
      if (card.category === "pokemon" && card.stage === "basic") hasBasic = true;
    }
    const overLimit = [...countsByName.entries()].filter(([, count]) => count > TCG_MAX_COPIES);
    if (overLimit.length > 0) return Promise.reject(new Error(`Too many copies: ${overLimit.map(([n, c]) => `${n} x${c}`).join(", ")}`));
    if (aceSpecCount > 1) return Promise.reject(new Error("A deck may include at most 1 ACE SPEC card"));
    if (!hasBasic) return Promise.reject(new Error("A deck must include at least one Basic Pokemon"));

    trainer.tcgDeck = cardIds.map((cardId) => ({ cardId }));
    return delay({ trainerId, deckSize: trainer.tcgDeck.length });
  },

  rerollTcgCards: (trainerId: string) => {
    const trainer = trainersById.get(trainerId);
    if (!trainer) return Promise.reject(new Error(`Trainer ${trainerId} not found`));
    trainer.tcgCards = drawTcgCards();
    // tcgDeck is untouched - it's independent of this flavor collection (see setTcgDeck).
    return delay({ trainerId, tcgCards: enrichTcg(trainer.tcgCards), tcgDeck: enrichTcg(trainer.tcgDeck) });
  },

  listTcgCards: () => delay({ cards: MOCK_TCG_CATALOG }, 80),

  createTcgBattle: (trainer1Id: string, trainer2Id: string) => {
    const t1 = trainersById.get(trainer1Id);
    const t2 = trainersById.get(trainer2Id);
    if (!t1) return Promise.reject(new Error(`Trainer ${trainer1Id} not found`));
    if (!t2) return Promise.reject(new Error(`Trainer ${trainer2Id} not found`));

    let side1: TcgSideState;
    let side2: TcgSideState;
    try {
      side1 = buildTcgSideState(t1);
      side2 = buildTcgSideState(t2);
    } catch (err) {
      return Promise.reject(err instanceof Error ? err : new Error("Failed to build TCG battle state"));
    }

    const battleId = String(tcgBattleSeq++);
    const now = new Date().toISOString();
    const battle: TcgBattle = {
      battleId,
      trainer1Id,
      trainer2Id,
      turn: 1,
      turnSide: "side1", // meaningless until setup is done
      status: "setup",
      setupDone: { side1: false, side2: false },
      stadiumCardId: null,
      nextInstanceId: 1,
      turnExpiresAt: new Date(Date.now() + 120_000).toISOString(),
      side1,
      side2,
      legalActions: [],
      log: [`Hands dealt. Both sides must choose their opening board before the battle begins.`],
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
    const legalActions = battle.status === "active" ? getLegalTcgActionsMock(battle[battle.turnSide], battle[otherSideKey(battle.turnSide)]) : [];
    return delay(clone({ ...battle, legalActions }), 80);
  },

  submitTcgSetup: (battleId: string, trainerId: string, activeCardId: number, benchCardIds: number[]) => {
    const battle = tcgBattles.get(battleId);
    if (!battle) return Promise.reject(new Error(`TCG battle ${battleId} not found`));
    if (battle.status !== "setup") return Promise.reject(new Error(`Battle is ${battle.status}, setup is already complete`));
    const side = tcgSideForTrainer(battle, trainerId);
    if (battle.setupDone[side]) return Promise.reject(new Error("You have already submitted your opening setup"));
    if (benchCardIds.length > TCG_BENCH_SIZE) return Promise.reject(new Error(`benchCardIds may include at most ${TCG_BENCH_SIZE} cards`));

    const acting = battle[side];
    const chosenCardIds = [activeCardId, ...benchCardIds];
    try {
      let hand = [...acting.hand];
      for (const cardId of chosenCardIds) {
        const card = MOCK_TCG_CATALOG_BY_ID.get(cardId);
        if (!card || card.category !== "pokemon" || card.stage !== "basic") throw new Error(`Card ${cardId} is not a Basic Pokemon in your hand`);
        hand = takeFromHand(hand, cardId);
      }
      acting.hand = hand;
      acting.active = createInPlayCard(MOCK_TCG_CATALOG_BY_ID.get(activeCardId) as TcgPokemonCard);
      acting.bench = benchCardIds.map((cardId) => createInPlayCard(MOCK_TCG_CATALOG_BY_ID.get(cardId) as TcgPokemonCard));
    } catch (err) {
      return Promise.reject(err instanceof Error ? err : new Error("Invalid setup selection"));
    }

    battle.setupDone[side] = true;
    const bothDone = battle.setupDone.side1 && battle.setupDone.side2;
    if (bothDone) {
      battle.turnSide = Math.random() < 0.5 ? "side1" : "side2";
      battle.status = "active";
      battle.turnExpiresAt = new Date(Date.now() + 120_000).toISOString();
      battle.log.push(`Setup complete. ${battle.turnSide === "side1" ? battle.trainer1Id : battle.trainer2Id} goes first.`);
      // No auto-play here: unlike submitTcgAction (where the caller's own
      // action just ended their turn, so playing the opponent's next turn is
      // the intended "solo testing" convenience), whoever goes first after
      // setup should get a real turn regardless of which side happened to
      // call this particular submitTcgSetup request.
    } else {
      battle.log.push(`${side} has chosen their opening board.`);
    }
    battle.updatedAt = new Date().toISOString();
    return delay(undefined);
  },

  submitTcgAction: (battleId: string, trainerId: string, action: TcgAction) => {
    const battle = tcgBattles.get(battleId);
    if (!battle) return Promise.reject(new Error(`TCG battle ${battleId} not found`));
    if (battle.status !== "active") return Promise.reject(new Error(`Battle is ${battle.status}, no more actions can be submitted`));

    const side = tcgSideForTrainer(battle, trainerId);
    if (battle.turnSide !== side) return Promise.reject(new Error("It is not your turn"));

    try {
      resolveTcgActionMock(battle, side, action);
    } catch (err) {
      return Promise.reject(err instanceof Error ? err : new Error("Failed to resolve action"));
    }

    if (battle.status === "active" && battle.turnSide !== side) {
      autoPlayTcgTurn(battleId, battle.turnSide);
    }

    const legalActions = battle.status === "active" ? getLegalTcgActionsMock(battle[battle.turnSide], battle[otherSideKey(battle.turnSide)]) : [];
    return delay({ message: "Action resolved", log: battle.log.slice(-3), winner: battle.winner, status: battle.status, legalActions });
  },
};
