# Poker.Command Namespace

Complete reference for the `Poker.Command` namespace - live poker table operations that convert user interactions into properly formatted Action values for the core poker engine. Action will have to be applied to the game to take effect.

```typescript
import * as Poker from '@idealic/poker-engine';
```

## Command Type Definition

```typescript
type Command =
  | 'fold'
  | 'call'
  | 'check'
  | 'bet'
  | 'raise'
  | 'allIn'
  | 'auto'
  | 'deal'
  | 'showCards'
  | 'muckCards'
  | 'forceShowCards'
  | 'message';
```

Union type of all available commands for user interaction and Action value creation.

## PlayerIdentifier Type Definition

```typescript
type PlayerIdentifier = string | number;
```

Type for identifying players, supporting both numeric indices (0-based) and string names.

## Player Actions

**`Poker.Command.fold(game: Game, playerIdentifier: PlayerIdentifier): Action`**

Processes player fold with automatic pot forfeiture and seat status updates.

**`Poker.Command.call(game: Game, playerIdentifier: PlayerIdentifier): Action`**

Executes call with precise stack validation and automatic pot contribution.

**`Poker.Command.check(game: Game, playerIdentifier: PlayerIdentifier): Action`**

Processes check action with rule validation.

**`Poker.Command.bet(game: Game, playerIdentifier: PlayerIdentifier, amount: number): Action`**

Initiates betting round with amount validation against table minimums and player stack.

**`Poker.Command.raise(game: Game, playerIdentifier: PlayerIdentifier, amount: number): Action`**

Processes raise with comprehensive validation: minimum raise rules, stack limits, and pot odds compliance.

**`Poker.Command.allIn(game: Game, playerIdentifier: PlayerIdentifier): Action`**

Executes all-in with complete stack commitment and side pot creation.

**`Poker.Command.auto(game: Game, playerIdentifier?: PlayerIdentifier): Action`**

Handles automatic player action when time limit expires. If game is in showdown phase, player mucks cards. Otherwise, player folds automatically.

## Dealer Operations

**`Poker.Command.deal(game: Game): Action | null`**

Generates the next dealer action based on game state - whether that's dealing hole cards, community cards, or managing showdown. Returns null if no dealer action is needed. Uses the game's seed for deterministic card dealing.

**`Poker.Command.showCards(game: Game, playerIdentifier: PlayerIdentifier): Action`**

Processes showdown reveals for a specific player with proper pot distribution. Just shows each player cards. The winners are being determined by the poker engine itself.

**`Poker.Command.muckCards(game: Game, playerIdentifier: PlayerIdentifier): Action`**

Processes player mucking cards during showdown. Player forfeits their chance to win the pot by not revealing their cards.

**`Poker.Command.forceShowCards(game: Game): Action | null`**

Forces the next player to reveal their cards if the game rules require it. Returns null if no one needs to show or if a forced reveal doesn't apply.

## Table Management

**`Poker.Command.message(game: Game, playerIdentifier: PlayerIdentifier, message: string): Action`**

Adds timestamped game chat or dealer announcements. Supports player communication and game narration.

## Usage Examples

### Basic Command Usage

```typescript
import * as Poker from '@idealic/poker-engine';

// Initialize game
const hand = Poker.Hand({
  variant: 'NT',
  players: ['Alice', 'Bob', 'Charlie'],
  startingStacks: [1000, 1000, 1000],
  blindsOrStraddles: [10, 20, 0],
  minBet: 20,
  actions: [],
});

const game = Poker.Game(hand);

// Player actions
const foldAction = Poker.Command.fold(game, 0); // 'p1 f'
const callAction = Poker.Command.call(game, 1); // 'p2 cc 20'
const checkAction = Poker.Command.check(game, 2); // 'p3 cc 0'
const betAction = Poker.Command.bet(game, 0, 100); // 'p1 cbr 100'
const raiseAction = Poker.Command.raise(game, 1, 200); // 'p2 cbr 200'
const allInAction = Poker.Command.allIn(game, 2); // 'p3 cbr 1000'
const autoAction = Poker.Command.auto(game); // Timeout handling

// Dealer operations
const dealAction = Poker.Command.deal(game); // Determines next dealer action
// Could be: 'd dh p1 AsKs' (hole cards)
//           'd db AhKhQd' (flop)
//           'd db Td' (turn/river)
//           'p1 sm AsKs' (showdown)
//           '' (empty string - no action needed)
const showAction = Poker.Command.showCards(game, 0); // Player 0 shows cards
const muckAction = Poker.Command.muckCards(game, 1); // Player 1 mucks cards
const forceShowAction = Poker.Command.forceShowCards(game); // Force next player to show cards

// Table management
const messageAction = Poker.Command.message(game, 'Alice', 'Good luck!'); // 'p1 m Good luck! #1234567890123'
```


## Command Flow

Commands provide an abstraction layer that:

- **Translates Inputs**: User actions → Command.\*(game, params) → Action string → applyAction() → Updated state
- **Reads Game State**: Commands analyze current Game state to generate appropriate Action values
- **Creates Actions Only**: Commands generate Action strings but don't modify game state directly
- **Feeds Core Engine**: Generated Action values are consumed by core poker engine via `applyAction()`

## Purpose

Commands translate user interactions into Action values for core poker engine consumption. They provide clean separation between UI interactions and core poker engine processing.
