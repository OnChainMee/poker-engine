# Poker.Game Namespace

Complete reference for the `Poker.Game` namespace - the comprehensive poker management toolkit. The Game API serves as a Swiss-knife for poker operations, providing everything needed to run live poker games: rules enforcement, money handling, player management, timing controls, and real-time analytics.

```typescript
import * as Poker from '@idealic/poker-engine';
```

## Constructor

**`Poker.Game(hand: Hand, actions?: Action[]): Game`**

Creates a Game from a Hand object with optional custom actions.

## Game Operations & Analytics

**`Poker.Game.getPlayer(game: Game, playerIdentifier: PlayerIdentifier): Player`**

Gets the player object for a given player identifier in the current game state.

**`Poker.Game.getPlayerName(game: Game, playerIdentifier: PlayerIdentifier): string`**

Gets the player name for a given player identifier in the current game state.

**`Poker.Game.getPlayerIndex(game: Game, playerIdentifier: PlayerIdentifier): number`**

Gets the player index (0-based) for a given player identifier in the current game state, supporting both numeric indices and string names.

**`Poker.Game.getCurrentPlayerIndex(game: Game): number`**

Gets the index of the player whose turn it is to act.

**`Poker.Game.getTimeLeft(game: Game): number`**

Gets remaining decision time for current player in milliseconds (countdown timer).

**`Poker.Game.getElapsedTime(game: Game): number`**

Gets elapsed time since last action occurred in milliseconds (elapsed timer). Used for analytics, timeout enforcement, and game flow monitoring.

**`Poker.Game.canApplyAction(game: Game, action: Action): boolean`**

Validates if the specified action is legal and can be applied to the current game state. Performs comprehensive rule checking including turn validation, stack requirements, betting minimums, and poker-specific constraints. This is the primary validation method used by the engine.

**`Poker.Game.hasActed(game: Game, playerIdentifier: PlayerIdentifier): boolean`**

Checks if the specified player has acted in the current betting round. Essential for betting round completion logic and turn order management.

**`Poker.Game.applyAction(game: Game, action: Action): Game`**

Applies an action to the game state and returns the updated game. Mutates the game object by processing the action through the core engine, handling all state transitions including player actions (fold, call, bet, raise), dealer operations (dealing cards, advancing streets), and game flow progression.

**`Poker.Game.finish(game: Game, hand: Hand): Hand`**

Extracts finishing data from a completed game and updates the hand with final state. This method consolidates all end-of-hand information including finishing stacks, winnings per player, rake collected, and total pot size. If the game is not finished, just returns the same object (hand from the input).

## Usage Examples

### Setting Up Live Tables

```typescript
import * as Poker from '@idealic/poker-engine';

// Initialize game from historical hand data
const hand = Poker.Hand({
  variant: 'NT',
  players: ['Alice', 'Bob', 'Charlie'],
  startingStacks: [1000, 1000, 1000],
  blindsOrStraddles: [10, 20, 0],
  minBet: 20,
  actions: [],
});

const game = Poker.Game(hand);

// Or setup new live game
const liveGame = Poker.Game({
  players: [
    { name: 'Alice', stack: 1000 },
    { name: 'Bob', stack: 1500 },
    { name: 'Charlie', stack: 800 },
  ],
  minBet: 20,
});

// Monitor game state for game operations
const nextPlayerIndex = Poker.Game.getCurrentPlayerIndex(game);
const isDealerActionNext = nextPlayerIndex === -1;
const actionTimeRemaining = Poker.Game.getTimeLeft(game);
```
