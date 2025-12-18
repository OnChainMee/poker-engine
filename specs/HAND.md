# Poker.Hand Namespace (Poker.State)

Complete reference for the `Poker.Hand` namespace (conceptually `Poker.State` in the functional core architecture) and Hand notation format. Hand notation provides a standardized, action-based format for storing complete poker hands, based on the PHH (Poker Hand History) specification.

```typescript
import * as Poker from '@idealic/poker-engine';
```

## Hand Type Definition

```typescript
type Hand = NoLimitHand | FixedLimitHand | StudHand;
```

The Hand type represents different poker variants, each with specific fields for that variant's rules and betting structure.

## Constructor

**`Poker.Hand(props: Partial<Hand>): Hand`**

Creates a validated Hand object with variant-specific validation and defaults.

## Core Methods

**`Poker.Format.JSON.parse(input: string): Hand`**

Parses a JSON string representation of a Hand into a Hand object.

**`Poker.Format.Pokerstars.parse(input: string): Hand`**

Parses a PokerStars format string representation of a Hand into a Hand object.

**`Poker.Hand.personalize(hand: Hand, playerIdentifier: PlayerIdentifier): Hand`**

Returns a version of the hand as seen by the specified player—only cards and information visible to that player are included.

**`Poker.Hand.isEqual(oldHand: Hand, newHand: Hand): boolean`**

Compares two hands for equality using deep JSON serialization comparison.

**`Poker.Hand.getPlayerId(hand: Hand, playerIdentifier: PlayerIdentifier): string | null`**

Returns the unique venue player ID for a given player identifier using the hand's \_venueIds, ensuring consistent identification. Returns null if \_venueIds is missing or the player is not found.

**`Poker.Hand.getPlayerIndex(hand: Hand, playerIdentifier: PlayerIdentifier): number`**

Gets the player index (0-based) for a given player identifier, supporting both numeric indices and string names. Used to access array values in Hand, like players, blindsOrStraddles, etc. Returns -1 if the player is not found.

**`Poker.Hand.getAuthorPlayerIndex(hand: Hand): number`**

Returns the index of the perspective player for table operations, or -1 if not found. Essential for player-specific views when the hand has an author field.

**`Poker.Format.JSON.stringify(hand: Hand): string`**

Serializes a Hand object to JSON string format.

**`Poker.Format.Pokerstars.stringify(hand: Hand): string`**

Serializes a Hand object to PokerStars string format.

**`Poker.Hand.merge(oldHand: Hand, newHand: Hand, allowUnsafeMerge?: boolean): Hand`**

Intelligently merges two hand states with advanced hole card visibility preservation and dealer action validation. Server retains control of \_inactive and \_deadBlinds fields (ignores values from newHand). Returns `oldHand` unchanged if hands are incompatible.

**`Poker.Hand.applyAction(hand: Hand, action: Action): Hand`**

Appends a valid action to the Hand, updating its state only if the action is allowed. If the action cannot be applied, an exception will be thrown. Automatically handles hand completion with proper financial reconciliation and final state recording.

**`Poker.Hand.getStats(hand: Hand): string[][]`**

Returns per-player statistics derived from the hand that are suitable for database insertion.

## Game State Methods

**`Poker.Hand.isPlayable(hand: Hand): boolean`**

Checks if the hand has enough active players to start a game. Returns `true` if there are 2 or more active players, `false` otherwise.

**`Poker.Hand.start(hand: Hand): Hand`**

Initializes blinds for a new hand when the game is playable. Assigns SB and BB to the first two active players. Returns unchanged hand if not playable or blinds already set.

**`Poker.Hand.advance(hand: Hand): Hand`**

Advances the hand by running all needed dealer and player actions. Handles dealing cards, moving streets, and resolving showdown.

**`Poker.Hand.getTimeLeft(hand: Hand): number`**

Gets the elapsed time since the most recent timestamped action in milliseconds.

**`Poker.Hand.canApplyAction(hand: Hand, action: Action): boolean`**

Validates whether an action can be legally applied to the current hand state. Returns `true` if the action is valid and follows game rules, `false` otherwise.

**`Poker.Hand.handleTimeOut(hand: Hand): Hand`**

Handles situations where a player runs out of time, automatically applying actions like folding or mucking as needed for the correct player.

**`Poker.Hand.isComplete(hand: Hand): boolean`**

Checks if a hand has reached completion. Returns `true` if the hand is complete, `false` otherwise.

**`Poker.Hand.next(completedHand: Hand): Hand`**

Creates a new hand from a completed hand with proper button rotation. Rotates players, stacks, and venue IDs clockwise to move the button position. Preserves chip continuity by using finishing stacks as starting stacks. Generates new unique identifiers (id, hand number, seed) and resets action-related fields.

**`Poker.Hand.finish(hand: Hand): Hand`**

Extracts final state from a completed hand. Returns the hand with finishing stacks, winnings, rake, and total pot calculated from the game's final reconciliation.

## Player Session Methods

**`Poker.Hand.join(hand: Hand, player: JoinHand): Hand`**

Adds a new player with intent 0 (ready to play) and sets \_inactive to 2 (new player state). New player will be inactive until next hand.

**`Poker.Hand.quit(hand: Hand, playerIdentifier?: PlayerIdentifier): Hand`**

Sets player intent to 3. Player removed after hand completes, dead blinds forgiven. PlayerIdentifier field takes precedence over author field.

**`Poker.Hand.pause(hand: Hand, playerIdentifier?: PlayerIdentifier): Hand`**

Sets player intent to 2. Player becomes inactive, accumulates dead blinds up to 1.5×BB. PlayerIdentifier field takes precedence over author field.

**`Poker.Hand.waitForBB(hand: Hand, playerIdentifier?: PlayerIdentifier): Hand`**

Sets player intent to 1 and \_inactive to 1 (waiting state). Player inactive until BB position, returns without penalty. PlayerIdentifier field takes precedence over author field.

**`Poker.Hand.resume(hand: Hand, playerIdentifier?: PlayerIdentifier): Hand`**

Sets player intent to 0 and \_inactive to 0 (active state). Allows player to cancel waitForBB and return to play immediately. PlayerIdentifier field takes precedence over author field.

## Hand Fields Reference

### Core Information

- **`variant`**: Poker variant, e.g. 'NT' (No-Limit Texas Hold'em), 'FT' (Fixed-Limit Texas), 'F7S' (Fixed-Limit 7-Card Stud), etc.
- **`players`**: Array of player names in clockwise order
- **`startingStacks`**: Array of starting stack amounts for each player
- **`blindsOrStraddles`**: Array of blind/straddle amounts for each player
- **`antes`**: Array of ante amounts for each player (optional)
- **`actions`**: Array of action strings representing the complete hand

### Session State Fields

- **`_intents`**: Array of player intentions (0=play, 1=wait BB, 2=pause, 3=quit)
- **`_inactive`**: Array of activity status (0=active, 1=waiting for BB, 2=new player)
- **`_deadBlinds`**: Array of accumulated blind penalties in chips (max 1.5×BB)

### Variant-Specific Fields

- **`minBet`**: Minimum bet amount (No-Limit games)
- **`smallBet`**, **`bigBet`**: Small/big bet amounts (Fixed-Limit games)
- **`bringIn`**: Bring-in amount (Stud games)

### Game Information

- **`gameId`**, **`table`**, **`hand`**: Game identifiers
- **`venue`**: Venue name where hand was played
- **`_venueIds`**: Array of unique player IDs from venue system for cross-game player identification
- **`currency`**: Currency code ('USD', 'EUR', etc.)
- **`time`**: ISO format timestamp
- **`timeZone`**: IANA timezone name

### Financial Information

- **`rake`**: Absolute rake amount
- **`rakePercentage`**: Rake percentage (0.05 = 5%)
- **`winnings`**: Array of player winnings

### Metadata

- **`author`**: Player perspective for exports
- **`seed`**: Random seed for deterministic dealing
- **`timeLimit`**: Time limit per action in seconds

## Actions Format

Actions use a simple string format: `actor action details`

**Examples:**

- `'d dh p1 AsKs'` - Deal hole cards to player 1
- `'d db AhKhQd'` - Deal board cards (flop)
- `'p1 f'` - Player 1 folds
- `'p2 cc 20'` - Player 2 calls/checks for 20
- `'p3 cbr 60'` - Player 3 bets/raises to 60
- `'p1 sm AsKs'` - Player 1 shows cards
- `'p4 m Hello!'` - Player 4 sends a message

## Intent Values

- `0` - Active play
- `1` - Wait for BB position
- `2` - Immediate pause
- `3` - Leave table

New players join with intent 0 and are inactive until next hand. When author field exists, only that player's intent can be modified. When author field is absent, playerIdentifier parameter determines which player's intent to modify.

## Usage Examples

### Basic Hand Processing

```typescript
import * as Poker from '@idealic/poker-engine';

// Create a hand
const hand = Poker.Hand({
  variant: 'NT',
  players: ['Alice', 'Bob'],
  startingStacks: [1000, 1000],
  blindsOrStraddles: [10, 20],
  minBet: 20,
  actions: [],
});

// Parse from string
const jsonHand = Poker.Format.JSON.parse(jsonString);
const pokerstarsHand = Poker.Format.Pokerstars.parse(pokerstarsString);

// Apply actions
let currentHand = hand;
// An action string can be generated by a Command or defined manually
const foldAction = 'p1 f';
currentHand = Poker.Hand.applyAction(currentHand, foldAction);

// Advance through dealer actions
currentHand = Poker.Hand.advance(currentHand);

// Export for different perspectives
const fullView = Poker.Hand.personalize(currentHand);
const playerView = Poker.Hand.personalize(currentHand, 'Alice');

// Serialize for storage
const jsonFormat = Poker.Format.JSON.stringify(currentHand);
const pokerStarsFormat = Poker.Format.Pokerstars.stringify(currentHand);

// Compare hands
const isEqual = Poker.Hand.isEqual(hand1, hand2);
```

### Session Management

```typescript
// New player joins (intent 0, inactive until next hand)
const withPlayer = Poker.Hand.joinHand(hand, {
  playerName: 'Charlie',
  buyIn: 1000,
  seat: 3,
});

// Modify player intents
let sessionHand = hand;
sessionHand = Poker.Hand.pauseHand(sessionHand, 'Bob'); // Intent 2, accumulates dead blinds
sessionHand = Poker.Hand.waitForBB(sessionHand, 'Alice'); // Intent 1, returns at BB without penalty
sessionHand = Poker.Hand.resumeHand(sessionHand, 'Charlie'); // Intent 0, pays dead blinds next hand
sessionHand = Poker.Hand.quitHand(sessionHand, 'Dan'); // Intent 3, removed after hand

// Next hand processes all transitions
const nextHand = Poker.Hand.next(completedHand);
// Automatically: activates/deactivates players, processes dead blinds, removes quitting players
```
