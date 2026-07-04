# Pokemon TCG Implementation Prompt

You are working on a Vite/React/TypeScript Pokemon TCG frontend app. Your job is to transform the existing simplified TCG mode into something much closer to the real Pokemon Trading Card Game rules and experience.

## Project Context

- **Stack**: Vite + React 19 + TypeScript + React Router v7
- **No backend**: All game logic runs in a mock API (`src/api/mock.ts`). There is a real API client (`src/api/client.ts`) but it's unused — all changes go in the mock.
- **Styling**: Plain CSS in `src/index.css` (dark theme, CSS variables). No component library.
- **Routing**: React Router v7 in `src/App.tsx`. TCG routes: `/tcg`, `/tcg/setup`, `/tcg/battle/:battleId`
- **Auth**: Simple name-based login, trainer stored in localStorage/sessionStorage.

## Current File Structure

```
src/
├── api/
│   ├── client.ts          # Real backend client (don't modify)
│   ├── index.ts           # Exports `api` (currently uses mockApi)
│   └── mock.ts            # ← MAIN FILE: all game logic lives here
├── auth/                  # Auth system (don't modify)
├── components/
│   ├── BattleLog.tsx      # Scrollable battle event log
│   ├── HPBar.tsx          # HP bar with color tiers
│   ├── MoveSelector.tsx   # Video-game mode move buttons
│   ├── NavBar.tsx         # Top nav
│   ├── PokemonCard.tsx    # Video-game card display
│   └── TcgCardView.tsx    # ← TCG card display component
├── hooks/
│   ├── useBattleState.ts      # Video-game polling hook
│   └── useTcgBattleState.ts   # TCG polling hook (polls every 1.5s)
├── lib/
│   └── myTrainer.ts       # Gets trainerId from localStorage
├── pages/
│   ├── LobbyPage.tsx          # Video-game lobby (don't modify)
│   ├── BattleSetupPage.tsx    # Video-game setup (don't modify)
│   ├── BattlePage.tsx         # Video-game battle (don't modify)
│   ├── TcgLobbyPage.tsx      # ← TCG lobby
│   ├── TcgDeckSetupPage.tsx   # ← TCG deck builder
│   └── TcgBattlePage.tsx      # ← TCG battle page
├── types.ts               # ← All TypeScript interfaces
├── App.tsx                # Router setup
├── index.css              # ← All styles
└── main.tsx               # Entry point
```

## What Currently Exists (TCG Mode)

### Current Types (`src/types.ts` — TCG section)
```typescript
export interface TcgAttack {
  name: string;
  energyCost: number;  // just a number, no energy types
  damage: number;
}

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
  energyAttached: number;  // just a count, no types
}

export interface TcgSideState {
  active: TcgInPlayCard | null;
  bench: TcgInPlayCard[];
  reserve: number[];           // card IDs not in play
  prizesRemaining: number;     // just a counter
  energyAttachedThisTurn: boolean;
  retreatedThisTurn: boolean;
}

export interface TcgBattle {
  battleId: string;
  trainer1Id: string;
  trainer2Id: string;
  turn: number;
  turnSide: "side1" | "side2";
  side1: TcgSideState;
  side2: TcgSideState;
  log: string[];
  status: "active" | "complete";
  winner: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TcgActionType = "attach-energy" | "retreat" | "attack" | "end-turn";
```

### Current Mock Data (`src/api/mock.ts`)
Only 4 Pokemon as TCG cards (Bulbasaur, Charmander, Squirtle, Pikachu), each with a single attack costing 1 energy and dealing 20 damage.

### Current Game Flow
1. Login → get 20 random TCG cards (drawn from the 4-card pool with duplicates)
2. Pick cards for deck → first = active, next 3 = bench, extras = reserve/prizes
3. Battle: take turns — attach energy (once/turn), retreat, attack (ends turn), or pass
4. Win by: collecting all prizes (KO 3 opponents) OR opponent has no bench when active KO'd

### What's WRONG vs Real TCG
- No hand/draw system — all cards placed immediately
- Energy is abstract (just +1 per turn) — not real Energy cards
- No Trainer cards (Items, Supporters, Stadiums)
- No evolution (all cards are Basic)
- Prize cards are just a counter, not actual cards
- No status conditions (Poisoned, Burned, Asleep, Confused, Paralyzed)
- No coin flips
- No deck-out loss condition
- No discard pile
- Energy costs don't require specific types
- Only 4 Pokemon species

---

## IMPLEMENTATION PLAN

Implement the following changes in order. Each phase builds on the previous.

### Phase 1: Core Card System Overhaul

#### 1A. Expand Types (`src/types.ts`)

Add new card category types and update existing ones:

```typescript
// Card categories in a TCG deck
export type TcgCardCategory = "pokemon" | "trainer" | "energy";
export type TrainerCardType = "item" | "supporter" | "stadium";
export type PokemonStage = "basic" | "stage1" | "stage2";
export type StatusCondition_Tcg = "poisoned" | "burned" | "asleep" | "confused" | "paralyzed" | null;

// Energy cost now requires specific types
export interface EnergyCost {
  type: PokemonTypeName | "colorless";  // "colorless" = any energy type works
  amount: number;
}

// Updated attack with typed energy costs
export interface TcgAttack {
  name: string;
  energyCost: EnergyCost[];       // e.g. [{type:"fire", amount:2}, {type:"colorless", amount:1}]
  damage: number;
  effect?: string;                // description of special effect
  effectType?: "coinflip-damage" | "coinflip-paralyze" | "self-damage" | "heal" | "draw" | "discard-energy" | null;
}

// Pokemon card (can be Basic, Stage 1, or Stage 2)
export interface TcgPokemonCard {
  cardId: number;
  category: "pokemon";
  name: string;
  stage: PokemonStage;
  evolvesFrom?: string;           // name of the Pokemon this evolves from
  energyType: PokemonTypeName;
  hp: number;
  weakness: PokemonTypeName | null;
  resistance: PokemonTypeName | null;
  retreatCost: number;
  attacks: TcgAttack[];
  ability?: { name: string; description: string; effectType: string };
  spriteUrl: string;
}

// Trainer card
export interface TcgTrainerCard {
  cardId: number;
  category: "trainer";
  trainerType: TrainerCardType;
  name: string;
  description: string;
  effectType: string;             // e.g. "heal-30", "draw-2", "switch", "search-basic", "rare-candy"
  spriteUrl: string;
}

// Energy card
export interface TcgEnergyCard {
  cardId: number;
  category: "energy";
  energyType: PokemonTypeName;
  name: string;                   // e.g. "Fire Energy"
  spriteUrl: string;
}

// Union type for any card in the deck
export type TcgDeckCard = TcgPokemonCard | TcgTrainerCard | TcgEnergyCard;

// A Pokemon currently in play (updated)
export interface TcgInPlayCard {
  cardId: number;
  name: string;
  stage: PokemonStage;
  energyType: PokemonTypeName;
  maxHp: number;
  currentHp: number;
  weakness: PokemonTypeName | null;
  resistance: PokemonTypeName | null;
  retreatCost: number;
  attacks: TcgAttack[];
  ability?: TcgPokemonCard["ability"];
  spriteUrl: string;
  energyAttached: { type: PokemonTypeName; cardId: number }[];  // actual energy cards attached
  status: StatusCondition_Tcg;
  evolvedFrom?: number;           // cardId of the card this evolved from
}

// Updated side state with hand, deck, discard, and real prize cards
export interface TcgSideState {
  active: TcgInPlayCard | null;
  bench: TcgInPlayCard[];         // max 5 bench slots
  hand: TcgDeckCard[];            // cards in hand (hidden from opponent)
  deck: number[];                 // cardIds remaining in deck (order matters — top = index 0)
  discard: TcgDeckCard[];         // discard pile (public)
  prizes: TcgDeckCard[];          // 6 face-down prize cards
  energyPlayedThisTurn: boolean;
  supporterPlayedThisTurn: boolean;
  retreatedThisTurn: boolean;
}

// Updated action types
export type TcgActionType =
  | "attach-energy"     // play an Energy card from hand onto a Pokemon
  | "play-trainer"      // play a Trainer card from hand
  | "evolve"            // evolve a Pokemon in play
  | "retreat"           // switch active with bench (discards energy)
  | "attack"            // use an attack (ends turn)
  | "end-turn";         // pass without attacking

// Updated action options
export interface TcgActionOptions {
  // attach-energy: which energy card from hand, onto which Pokemon
  handCardId?: number;
  targetCardId?: number;        // cardId of Pokemon to attach to (active or bench)
  // retreat: which bench Pokemon to swap in
  benchCardId?: number;
  // attack: which attack to use
  attackName?: string;
  // evolve: which card from hand evolves which Pokemon in play
  evolveCardId?: number;        // hand card (Stage 1/2)
  evolveTargetId?: number;      // in-play Pokemon to evolve
  // play-trainer: which trainer card from hand
  trainerCardId?: number;
  // for trainers that target a Pokemon (e.g. Potion)
  trainerTargetId?: number;
}
```

#### 1B. Expand Mock Card Database (`src/api/mock.ts`)

Replace the 4-card `MOCK_TCG_CARDS` with a much larger dataset. Include at minimum:

**Pokemon Cards (at least 20 unique, across multiple evolution lines):**
- Bulbasaur (Basic, Grass) → Ivysaur (Stage 1) → Venusaur (Stage 2)
- Charmander (Basic, Fire) → Charmeleon (Stage 1) → Charizard (Stage 2)
- Squirtle (Basic, Water) → Wartortle (Stage 1) → Blastoise (Stage 2)
- Pikachu (Basic, Electric) → Raichu (Stage 1)
- Gastly (Basic, Psychic) → Haunter (Stage 1) → Gengar (Stage 2)
- Machop (Basic, Fighting) → Machoke (Stage 1) → Machamp (Stage 2)
- Eevee (Basic, Normal) → Jolteon/Flareon/Vaporeon (Stage 1, different types)
- Snorlax (Basic, Normal — high HP tank)
- Magikarp (Basic, Water) → Gyarados (Stage 1, high damage)

Each Pokemon should have 1-2 attacks with typed energy costs. Higher evolutions should have stronger attacks that require more energy. Example:

```typescript
{
  cardId: 6,
  category: "pokemon",
  name: "Charizard",
  stage: "stage2",
  evolvesFrom: "Charmeleon",
  energyType: "fire",
  hp: 180,
  weakness: "water",
  resistance: "fighting",
  retreatCost: 3,
  attacks: [
    {
      name: "Fire Spin",
      energyCost: [{ type: "fire", amount: 2 }, { type: "colorless", amount: 2 }],
      damage: 150,
      effect: "Discard 2 Energy from this Pokemon.",
      effectType: "discard-energy"
    },
    {
      name: "Slash",
      energyCost: [{ type: "colorless", amount: 3 }],
      damage: 60
    }
  ],
  spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png"
}
```

**Trainer Cards (at least 8):**
- Potion (Item) — heal 30 HP from one of your Pokemon
- Super Potion (Item) — heal 60 HP, discard 1 energy from that Pokemon
- Switch (Item) — swap your active Pokemon with a benched Pokemon
- Rare Candy (Item) — evolve a Basic directly to Stage 2 (skip Stage 1)
- Professor's Research (Supporter) — discard your hand, draw 7 cards
- Boss's Orders (Supporter) — switch opponent's active with one of their benched Pokemon
- Nest Ball (Item) — search your deck for a Basic Pokemon, put it on your bench
- Energy Retrieval (Item) — put 2 Energy cards from your discard pile into your hand

**Energy Cards (one per major type):**
- Fire Energy, Water Energy, Grass Energy, Electric Energy, Psychic Energy, Fighting Energy, Normal/Colorless Energy

Use simple colored circle placeholder sprites for energy cards (or an emoji-based approach). For trainer cards, use a generic placeholder image or just render them differently in the UI.

#### 1C. Deck Building — 60-Card Decks (`src/api/mock.ts` + `src/pages/TcgDeckSetupPage.tsx`)

**Mock API changes:**
- Instead of giving trainers 20 random TcgCards, give them a **collection** of available cards they can build a 60-card deck from.
- The collection should include multiple copies of Pokemon, Trainers, and Energy cards.
- Enforce the **4-copy rule**: max 4 of any card with the same name (except Basic Energy, which is unlimited).
- Deck must contain exactly 60 cards with at least 1 Basic Pokemon.

**Deck Setup Page changes:**
- Show cards grouped by category: Pokemon, Trainer, Energy (use tabs or sections).
- For each card, show a count selector (0-4, unlimited for Basic Energy).
- Display running total: "42/60 cards selected"
- Validate: must be exactly 60, must have at least 1 Basic Pokemon.
- Show a summary panel: X Pokemon, Y Trainers, Z Energy.

### Phase 2: Hand, Deck, Draw, and Discard System

#### 2A. Game Start Sequence (`src/api/mock.ts` — `buildTcgSideState`)

When a TCG battle starts:
1. Shuffle the 60-card deck randomly.
2. Draw 7 cards into the hand.
3. Check for at least 1 Basic Pokemon in hand — if not, reveal hand, shuffle back, redraw 7 (opponent may draw 1 extra card per mulligan). Repeat until a Basic is found. Log mulligans.
4. Player places 1 Basic Pokemon as active (auto-pick the first Basic found for AI/mock).
5. Player may place additional Basics from hand onto bench (up to 5 bench slots). Auto-place for AI.
6. Set aside top 6 cards of deck as prize cards (face-down, not visible to either player).
7. Remaining cards in hand stay as the starting hand.

#### 2B. Turn Draw Phase

At the start of each turn (before the player acts):
- Automatically draw 1 card from the top of the deck into the hand.
- If the deck is empty and a draw is required, that player **loses** (deck-out loss). Log it and end the battle.

#### 2C. Track Discard Pile

- When a Pokemon is knocked out, it and all attached energy go to the discard pile.
- When a Trainer card is played, it goes to the discard pile after resolving.
- When energy is discarded (retreat cost, attack effects), those energy cards go to the discard pile.

### Phase 3: Turn Actions Overhaul (`src/api/mock.ts` — `resolveTcgActionMock`)

A player's turn allows **multiple free actions** before ending with an attack or passing. The current `resolveTcgActionMock` function needs to support all of these in one turn:

#### Free Actions (can do any number, within constraints):
1. **Draw card** — automatic at turn start (already handled in Phase 2).
2. **Attach Energy** — play 1 Energy card from hand onto any of your Pokemon (active or bench). Once per turn. The energy card is removed from hand and added to `energyAttached[]` on the target Pokemon.
3. **Play Trainer cards** — play Item cards from hand (no limit on Items per turn). Play 1 Supporter per turn. Play 1 Stadium per turn (replaces existing Stadium).
4. **Evolve Pokemon** — play a Stage 1 card from hand on a matching Basic in play, or Stage 2 on a matching Stage 1. Cannot evolve a Pokemon on the same turn it was played or already evolved this turn. Cannot evolve on the first turn of the game.
5. **Retreat** — once per turn, swap active Pokemon with a benched Pokemon. Discard energy cards from the retreating Pokemon equal to its retreat cost. Player chooses which energy cards to discard.
6. **Place Basic Pokemon from hand onto bench** — if bench has open slots (max 5).

#### Turn-Ending Actions:
7. **Attack** — use one of the active Pokemon's attacks. Must have the required energy types attached. Ends the turn.
8. **End Turn** — pass without attacking.

Update `TcgActionType` to include: `"attach-energy" | "play-trainer" | "evolve" | "retreat" | "attack" | "end-turn" | "place-basic"`

### Phase 4: Energy System with Types

#### Energy Attachment
- When attaching energy, the player specifies which Energy card from their hand (`handCardId`) and which Pokemon to attach it to (`targetCardId`).
- The energy card is moved from `hand` to the target Pokemon's `energyAttached` array as `{ type: PokemonTypeName, cardId: number }`.

#### Energy Cost Checking
When checking if an attack's energy cost is met:
1. Count the attached energy by type.
2. For each cost entry: if `type` is a specific type (e.g., "fire"), check that enough fire energy is attached. If `type` is "colorless", any remaining energy (not used for specific costs) can fulfill it.
3. Example: Attack costs `[{fire:2}, {colorless:1}]`. Pokemon has 2 fire + 1 grass attached → valid (2 fire meets the fire requirement, 1 grass meets the colorless requirement).

#### Retreat Energy Discard
When retreating, the player must discard energy cards equal to the retreat cost. For simplicity in the mock, auto-discard the first N energy cards from the retreating Pokemon. Discarded energy cards go to the discard pile.

### Phase 5: Status Conditions

Add status conditions that apply between turns and during attacks:

- **Poisoned**: Between turns, take 10 damage. Multiple poisons don't stack (just stays poisoned).
- **Burned**: Between turns, flip a coin. Tails = 20 damage. Heads = no damage. Stays burned either way (some rules cure on heads — pick one and be consistent).
- **Asleep**: Cannot attack or retreat. Between turns, flip a coin. Heads = wake up. Tails = stay asleep.
- **Confused**: When attacking, flip a coin. Tails = deal 30 damage to yourself instead of attacking. Heads = attack normally.
- **Paralyzed**: Cannot attack or retreat. Cured at the end of the player's next turn automatically.

**Rules:**
- A Pokemon can only have one Special Condition at a time (new one replaces old).
- Evolving or going to the bench clears all status conditions.
- Apply between-turn effects (poison/burn damage, sleep/paralysis checks) when the turn switches.

Implement a `resolveBetweenTurns(battle, side)` function called when a turn ends, before the next player's turn starts.

### Phase 6: Coin Flips

Add a `flipCoin(): boolean` utility function that returns `true` for heads, `false` for tails. Log each flip.

Use coin flips for:
- Status condition checks (burn, sleep, confusion)
- Attacks with `effectType: "coinflip-damage"` (e.g., "Flip a coin. If heads, this attack does 30 more damage.")
- Attacks with `effectType: "coinflip-paralyze"` (e.g., "Flip a coin. If heads, the Defending Pokemon is now Paralyzed.")

### Phase 7: Trainer Card Effects

Implement effect resolution for each trainer card. When a player uses `"play-trainer"` action:

1. Validate: card is in hand, is a trainer card, supporter limit not exceeded this turn.
2. Resolve the effect based on `effectType`:
   - `"heal-30"` → Heal 30 HP from target Pokemon (specified by `trainerTargetId`)
   - `"heal-60-discard-energy"` → Heal 60 HP, discard 1 energy from target
   - `"switch"` → Swap active with a bench Pokemon (specified by `benchCardId`)
   - `"rare-candy"` → Evolve a Basic directly to Stage 2 (specify both cards)
   - `"draw-7-discard-hand"` → Discard entire hand, draw 7 from deck
   - `"boss-orders"` → Switch opponent's active with one of their bench Pokemon
   - `"search-basic"` → Search deck for a Basic Pokemon, add to bench, shuffle deck
   - `"energy-retrieval"` → Return 2 Energy from discard to hand
3. Move the Trainer card to the discard pile.
4. Log what happened.

### Phase 8: Prize Cards

When a player knocks out an opponent's Pokemon:
1. The attacking player takes 1 prize card (moves from `prizes` array into `hand`).
2. If `prizes` is now empty, that player wins.
3. Log which prize was taken (but don't reveal it to the opponent — just say "Player took a prize card").

### Phase 9: UI Overhaul

#### 9A. TCG Card Component (`src/components/TcgCardView.tsx`)

Redesign to handle all 3 card categories:
- **Pokemon cards**: Show stage (Basic/Stage 1/Stage 2), `evolvesFrom` text, HP, energy type icon, attacks with typed energy cost icons (small colored circles), weakness, resistance, retreat cost (as energy dots), and sprite.
- **Trainer cards**: Different visual style — show trainer type badge (Item/Supporter/Stadium), name, description text, and a generic trainer icon.
- **Energy cards**: Simple design — large colored circle with type name.

Use colored circles/dots for energy type indicators throughout:
```
Fire  Water  Grass  Electric  Psychic  Fighting  Colorless
```
Implement these as small colored `<span>` elements with CSS, not emoji.

#### 9B. Battle Board Layout (`src/pages/TcgBattlePage.tsx`)

Replace the current minimal layout with a proper TCG board layout:

```
+--------------------------------------------------+
|  OPPONENT SIDE                                    |
|  [Prize count: 5]  [Deck: 32]  [Discard: 3]      |
|                                                   |
|  Bench: [card] [card] [card] [  ] [  ]            |
|                                                   |
|              +----------------+                   |
|              |  ACTIVE        |                   |
|              |  Pokemon       |                   |
|              +----------------+                   |
| - - - - - - - - - - - - - - - - - - - - - - - - -|
|              +----------------+                   |
|              |  YOUR          |                   |
|              |  ACTIVE        |                   |
|              +----------------+                   |
|                                                   |
|  Bench: [card] [card] [card] [  ] [  ]            |
|                                                   |
|  [Prize: 6]  [Deck: 28]  [Discard: 1]            |
|                                                   |
|  HAND: [card] [card] [card] [card] [card]         |
|                                                   |
|  ACTIONS: [Attach Energy] [Play Trainer]          |
|           [Evolve] [Retreat] [Attack] [End Turn]  |
+--------------------------------------------------+
```

**Key UI elements:**
- **Opponent's side** (top): Show active Pokemon card, bench cards (smaller), prize count, deck count, discard count. Do NOT show opponent's hand.
- **Your side** (bottom): Show your active Pokemon, bench, prizes, deck count, discard pile count.
- **Your hand** (bottom): Horizontal scrollable row of cards from your hand. Clicking a card should enable relevant actions (e.g., clicking an Energy card highlights "Attach Energy" and lets you pick a target).
- **Action buttons**: Context-sensitive. Attach Energy is only clickable when an Energy card is selected from hand. Attack buttons show energy cost and are disabled if requirements not met.
- **Turn indicator**: Clear "Your Turn" / "Opponent's Turn" display.
- **Status conditions**: Show status badges on Pokemon cards (colored indicators).

#### 9C. Hand Interaction Model

Implement a selection-based interaction:
1. Player clicks a card in their hand → it becomes "selected" (highlighted).
2. Based on selected card type, show available actions:
   - Energy card selected → "Attach to..." buttons appear for each of your Pokemon (active + bench).
   - Trainer card selected → "Play" button appears (plus any targeting UI needed).
   - Basic Pokemon selected → "Place on Bench" button appears (if bench has room).
   - Stage 1/2 Pokemon selected → "Evolve" buttons appear next to valid evolution targets.
3. Clicking an action resolves it and deselects the card.

Add state to `TcgBattlePage.tsx`:
```typescript
const [selectedHandCard, setSelectedHandCard] = useState<number | null>(null); // cardId
```

#### 9D. In-Play Card Display

For Pokemon in play (active + bench), show:
- Name, HP bar, sprite
- Attached energy as small colored dots below the card
- Status condition badge if any
- "Can evolve" indicator if player has a matching evolution in hand

#### 9E. Deck Setup Page (`src/pages/TcgDeckSetupPage.tsx`)

Complete redesign for 60-card deck building:
- Three tabs/sections: Pokemon | Trainers | Energy
- Each card shows a +/- counter for how many copies to include
- Running total bar: "47/60 cards" with validation messages
- Summary sidebar: "12 Pokemon, 15 Trainers, 33 Energy"
- "Auto-fill Energy" button that fills remaining slots with appropriate energy types based on Pokemon in deck
- Enforce 4-copy max (except Basic Energy)
- Must have >=1 Basic Pokemon to confirm

### Phase 10: AI Opponent Improvements (`src/api/mock.ts` — `autoPlayTcgTurn`)

Update the auto-play AI to handle the new mechanics:

```
AI turn logic (priority order):
1. Draw card (automatic)
2. Place any Basic Pokemon from hand onto bench (if slots available)
3. Evolve any Pokemon that can be evolved (prioritize active)
4. Attach energy to active Pokemon (if haven't this turn, and have energy in hand)
   - Prefer matching energy type for active Pokemon's attack costs
5. Play beneficial Trainer cards:
   - If active HP < 50%, play Potion/Super Potion
   - If hand size < 3, play Professor's Research
   - Play Nest Ball if bench not full
6. If active Pokemon can attack, attack with strongest available attack
7. If active Pokemon can't attack and has high retreat cost, consider retreating
   to a Pokemon that CAN attack (if one exists on bench with enough energy)
8. End turn
```

---

## API Contract

The `Api` interface in `src/api/client.ts` defines the contract. You need to update the mock to match these methods. The key TCG methods:

```typescript
setTcgDeck(trainerId: string, cardIds: number[]): Promise<{ trainerId: string; tcgDeck: TcgDeckCard[] }>
rerollTcgCards(trainerId: string): Promise<{ trainerId: string; tcgCards: TcgDeckCard[]; tcgDeck: TcgDeckCard[] }>
createTcgBattle(trainer1Id: string, trainer2Id: string): Promise<TcgBattle>
getTcgBattle(battleId: string): Promise<TcgBattle>
submitTcgAction(battleId: string, trainerId: string, action: TcgActionType, options?: TcgActionOptions): Promise<void>
```

**Important**: The `getTcgBattle` response should NOT include the opponent's hand or deck contents (for a real game). But since this is mock mode where both players share the same browser, you can include `hand` for both sides. Just be aware of this if you add any "opponent hand" display — hide it in the UI.

Update the `Trainer` type and mock to store the player's **card collection** (a pool of available cards to build decks from) separately from their built deck. The collection should be generous — include multiple copies of each card so players can build real 60-card decks.

---

## CSS Guidelines

All styles go in `src/index.css`. Use the existing CSS variable system:
```css
--bg: #12141c;          /* page background */
--bg-elevated: #1c1f2b; /* raised surfaces */
--bg-card: #232739;     /* card backgrounds */
--border: #333850;      /* borders */
--text: #d7dae6;        /* body text */
--text-h: #ffffff;      /* headings */
--text-muted: #8890a8;  /* secondary text */
--accent: #f7c948;      /* primary accent (gold) */
--accent-2: #4fc3f7;    /* secondary accent (blue) */
--danger: #ef5350;      /* red */
--success: #66bb6a;     /* green */
```

Prefix all new TCG-specific classes with `tcg-`. Use the existing `.type-badge--{type}` classes for energy type colors.

Add new energy dot styles:
```css
.energy-dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.3);
}
/* Reuse type-badge colors: .energy-dot--fire { background: #f08030; } etc. */
```

---

## Important Rules

1. **Do NOT modify** any video-game mode files (`BattlePage.tsx`, `BattleSetupPage.tsx`, `LobbyPage.tsx`, `useBattleState.ts`, `PokemonCard.tsx`, `MoveSelector.tsx`) or the auth system.
2. **Do NOT modify** `src/api/client.ts` (the real API client). Only modify `src/api/mock.ts`.
3. Keep the `Api` type in `client.ts` in sync — if you add new methods to mock, add them to the `Api` type and `realApi` stub too so TypeScript doesn't complain. Use `TODO` comments in `realApi` for unimplemented methods.
4. Keep the existing video-game `Battle` types and `MOCK_SPECIES` in `types.ts` and `mock.ts` — don't remove them.
5. All new components should be in `src/components/`. All new pages in `src/pages/`.
6. The app must build with zero TypeScript errors (`npx tsc --noEmit`).
7. The app must work end-to-end: login → lobby → build deck → battle → play full game → win/lose.
8. Use PokeAPI sprite URLs for Pokemon: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{nationalDexNumber}.png`

## Suggested File Changes Summary

| File | Action |
|------|--------|
| `src/types.ts` | Add new types, update existing TCG types |
| `src/api/mock.ts` | Major rewrite of TCG section (card data, game logic, AI) |
| `src/api/client.ts` | Update `Api` type + `realApi` stubs to match |
| `src/components/TcgCardView.tsx` | Rewrite to handle Pokemon/Trainer/Energy cards |
| `src/components/EnergyDot.tsx` | New — small colored energy type indicator |
| `src/components/StatusBadge.tsx` | New — status condition indicator |
| `src/components/HandView.tsx` | New — horizontal hand display with selection |
| `src/components/BoardSide.tsx` | New — one side of the battle board |
| `src/pages/TcgBattlePage.tsx` | Major rewrite — new board layout + hand interaction |
| `src/pages/TcgDeckSetupPage.tsx` | Major rewrite — 60-card deck builder with categories |
| `src/pages/TcgLobbyPage.tsx` | Minor updates — show collection instead of raw cards |
| `src/index.css` | Add new TCG board, hand, energy dot, status badge styles |
| `src/App.tsx` | No changes needed (routes stay the same) |
