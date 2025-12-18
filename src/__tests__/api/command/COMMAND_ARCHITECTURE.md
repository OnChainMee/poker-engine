# Command API Architecture

## Overview

The Command API provides a clean, functional interface for generating valid Actions in the poker engine. Commands are pure functions that translate high-level player and dealer intentions into valid, low-level Action strings that accurately represent the intended game actions.

## Architecture Pattern

```
User Intent → Command Function → Valid Action String
```

### Key Principles

1. **Pure Functions**: Commands never mutate the input Game state
2. **Self-validating Actions**: Commands generate inherently valid Action strings based on simple game state analysis
3. **Deterministic**: Identical inputs always produce identical outputs
4. **Action Validity**: Commands ensure generated Actions are contextually appropriate and correctly formatted
5. **Seed-based Determinism**: Dealer Actions use game.seed for reproducible card dealing
6. **Flexible Amount Handling**: If the input amount isn't valid, the command will adjust it to the nearest allowed value to produce a correct action whenever possible.

## Command Categories

### Player Commands
Commands that generate single player Actions based on game state and player decisions.

#### Core Player Actions
- `Poker.Command.fold(game, playerIdentifier)` → `"p{index} f"`
- `Poker.Command.call(game, playerIdentifier)` → `"p{index} cc {amount}"`
- `Poker.Command.bet(game, playerIdentifier, amount)` → `"p{index} cbr {amount}"`
- `Poker.Command.raise(game, playerIdentifier, amount)` → `"p{index} cbr {amount}"`
- `Poker.Command.check(game, playerIdentifier)` → `"p{index} cc"`
- `Poker.Command.allIn(game, playerIdentifier)` → `"p{index} cbr {remainingStack}"`

#### Special Player Actions
- `Poker.Command.message(game, playerIdentifier, message)` → `"#{playerName} {message}"`

### Dealer Commands
Commands that generate single dealer Actions for game progression and card dealing.

#### Card Dealing
- `Poker.Command.deal(game)` → Determines next dealer action based on game state
  - Returns `"d dh p{index} {card1}{card2}"` when dealing hole cards
  - Returns `"d db {card1}{card2}{card3}..."` when dealing board cards
  - Returns `"p{index} sm {cards}"` during showdown
  - Returns null when no dealer action needed

## Implementation Contract

### Input/Output Contract
- **Input**: Always accepts (Game, ...parameters)
- **Output**: Always returns valid Action string or an empty string for impossible actions
- **Side Effects**: None - Commands are pure functions

### Parameter Types
- `game: Game` - The current game state (never mutated)
- `playerIdentifier: number | string` - Player index (0-based input, converted to 1-based in Action strings) or player name
- `amount: number` - Bet/raise amounts (Commands validate against game constraints)
- `message: string` - Chat messages and notifications

### Action Validity Contract
Commands are responsible for generating valid Actions by:
1. Generating Action strings that conform to the correct format for each ActionType
2. Ensuring each ActionType follows its specific validation pattern
3. Producing properly formatted Action strings regardless of game state context
4. Focusing solely on Action string format validation, not game state appropriateness

## Test-Driven Development Implementation

### Test Structure
Tests are organized by functional category:
- `core-contract.test.ts` - Fundamental Command contracts and behavior
- `player-actions.test.ts` - All player Command implementations  
- `dealer-operations.test.ts` - All dealer Command implementations
- `error-scenarios.test.ts` - Invalid input handling and edge cases

### Test Fixtures
- `fixtures/baseHand.ts` - BASE_HAND: The single, deterministic hand state used as foundation for all Command API tests
- All test fixtures are derived from BASE_HAND to ensure consistency and reproducibility

### Testing Principles
1. **Contract Testing**: Verify Commands follow architectural contracts
2. **State Immutability**: Ensure Commands never mutate input Game
3. **Deterministic Outputs**: Same inputs produce same Action strings
4. **Action Validity**: Generated Actions are contextually correct and properly formatted
5. **Game State Validation**: Use applyAction() to ensure test fixtures represent realistic game scenarios
6. **BASE_HAND Foundation**: All tests use BASE_HAND as the template for consistent test scenarios

## Critical Implementation Details

### Player Indexing Convention
Commands follow a clear indexing pattern:
- **Input**: Accept 0-based player indexes (0, 1, 2...) and string names
- **Output**: Generate 1-based Action strings (p1, p2, p3...)
- **Conversion**: Uses `toOneBasedPlayerNumber()` helper for consistent conversion

```typescript
// Input: 0-based indexing
Poker.Command.fold(game, 0);  // Alice
Poker.Command.call(game, 1);  // Bob  
Poker.Command.bet(game, 2, 100);  // Charlie

// Output: 1-based Action strings
// "p1 f"     - Alice folds
// "p2 cc 20" - Bob calls
// "p3 cbr 100" - Charlie bets
```

### All-in Calculations
All-in amounts must reflect the player's remaining stack after all investments:
```typescript
// Correct all-in calculation
const allInAmount = player.startingStack - player.totalBet;
// Action: "p1 cbr {allInAmount}"
```

### Seed-based Determinism
Dealer Commands using `game.seed` to ensure reproducible card dealing:
```typescript
// Same seed = same cards ALWAYS
const game1 = createGameWithSeed(12345);
const game2 = createGameWithSeed(12345);
const action1 = Poker.Command.deal(game1);
const action2 = Poker.Command.deal(game2);
expect(action1).toBe(action2); // Must be identical
```

### Player Identifier Resolution
Commands must handle both numeric indices and string names:
```typescript
Poker.Command.fold(game, 0);        // By 0-based index (input)
Poker.Command.fold(game, 'Alice');  // By name
// Both generate Actions with 1-based player numbers: "p1 f"
// Commands accept 0-based indexes but output 1-based Action strings
```

## Action String Format

### Player Actions
- Format: `p{playerIndex} {action} [{amount}]`
- Examples:
  - `"p0 f"` - Incorrect, playerIndex can't be less than 1!
  - `"p1 cc 20"` - Player 1 calls 20
  - `"p2 cbr 100"` - Player 2 bets/raises 100
  - `"p3 cc"` - Player 3 checks

### Dealer Actions  
- Format: `d {action} [parameters]`
- Examples:
  - `"d dh p1 AsKs"` - Deal As Ks to player 1
  - `"d db AhKhQh"` - Deal flop Ah Kh Qh
  - `"d db Td"` - Deal turn card
  - `"d db 9s"` - Deal river card

### Messages
- Format: `#{playerName} {message}`
- Example: `"#Alice Good luck everyone!"`

## Error Handling Philosophy

Commands follow a "format-focused Action generation" approach:
1. Commands generate Action strings that conform to correct ActionType formats, not game state context
2. Commands normalize received number arguments to ensure they are within possible ranges
3. Invalid format inputs throw descriptive errors about format violations
4. Commands are responsible for Action format validation, not game rule enforcement

## Integration Points

### With Game State
- Commands read from Game but never modify it
- Game.seed is used for deterministic dealer operations
- Player states are analyzed to determine valid actions
- Commands enforce game rules and constraints internally

### With Game State Validation (Testing)
- `applyAction()` is used in tests to verify that game state fixtures are realistic
- Test fixtures are validated by applying actions to ensure they represent possible game scenarios
- This ensures test scenarios are not hallucinated but reflect actual game situations

### With UI/Frontend
- Commands provide high-level interface for user actions
- Generated Actions can be logged, transmitted, or stored
- Action strings are human-readable for debugging
- Command errors provide clear feedback for impossible actions

## Performance Considerations

- Commands are lightweight pure functions (fast execution)
- No side effects means Commands can be called speculatively
- Deterministic outputs enable caching optimizations
- Action string format is compact for network transmission

## Testing Strategy

### Unit Tests
- Each Command function tested in isolation
- Contract compliance (immutability, determinism, return types)
- Action format validation
- Error handling for impossible actions

### Integration Tests  
- Commands generate valid Actions for complex game scenarios
- Multi-street game progression with realistic action sequences
- Game state fixture validation using applyAction()

### Property-based Tests
- Invariants: Commands never mutate input
- Determinism: Same inputs always produce same outputs
- Validity: Generated Actions are contextually appropriate and correctly formatted

## Future Extensions

### Command Chaining
```typescript
const actions = [
  Poker.Command.deal(game),
  Poker.Command.deal(gameAfterFirstDeal),
  Poker.Command.deal(gameAfterSecondDeal)
];
```