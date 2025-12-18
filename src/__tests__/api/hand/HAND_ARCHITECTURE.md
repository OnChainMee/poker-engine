# Hand API Architecture

## Overview

The Hand API is the central data state for the poker engine, capturing the full progression of a hand through its complete action history. Each transformation produces a new Hand, preserving all previous information for reliable reconstruction and synchronization. Hand is focused on representing and evolving the hand’s data, while all rules, logic, and validation are handled by the Game namespace. This keeps Hand as a pure game state, decoupled from business logic.

## Architecture Pattern

```
Raw Data → Hand Methods → Data Transformation → New Hand Data
```

### Key Principles

1. **Data Layer Only**: Hand manages data representation - Game namespace handles all logic
2. **Immutability**: All operations return new objects through deep cloning
3. **Format Agnostic**: Bidirectional conversion between JSON, PokerStars, and internal formats
4. **Data Integrity**: Transformations always keep all information intact — nothing gets lost or changed in the process.
5. **Deterministic Operations**: Identical inputs always produce identical outputs
6. **Clear Boundaries**: Hand = data notation, Game = rules engine, Command = action generator

## Hand Categories

### Pure Data Operations

Methods that transform or extract data without any game logic.

#### Construction

- `Poker.Hand(props: Partial<Hand>)` → Hand with variant-specific defaults
- Applies default values for optional fields

#### Format Conversion

- `Poker.Format.JSON.parse(input)` → Parse JSON string to Hand data
- `Poker.Format.JSON.stringify(hand)` → Serialize Hand data to JSON string
- `Poker.Format.Pokerstars.parse(input)` → Parse PokerStars format string to Hand data
- `Poker.Format.Pokerstars.stringify(hand)` → Serialize Hand data to PokerStars format string

#### Data Extraction

- `Poker.Hand.getPlayerId(hand, playerIdentifier)` → Extract venue ID from \_venueIds array (returns null if not found or \_venueIds missing)
- `Poker.Hand.getPlayerIndex(hand, playerIdentifier)` → Find index in players array, 0-based (returns -1 if not found)
- `Poker.Hand.getAuthorPlayerIndex(hand)` → Get author's player index, 0-based (returns -1 if not found or no author)
- `Poker.Hand.getTimeLeft(hand)` → Calculate elapsed time from last timestamped action
- `Poker.Hand.isPlayable(hand)` → Check if minimum active players exist (returns boolean)

#### Data Transformation

- `Poker.Hand.merge(oldHand, newHand)` → Combine two Hand data structures
- `Poker.Hand.isEqual(hand1, hand2)` → Deep comparison of data structures
- `Poker.Hand.personalize(hand, playerIdentifier?)` → Filter data for player perspective
- `Poker.Hand.next(completedHand)` → Generate new hand from completed hand with button rotation
- `Poker.Hand.start(hand)` → Initialize blinds for first two active players
- `Poker.Hand.joinHand(hand, player)` → Adds a new player to the `hand`, extending existing player-related arrays
- `Poker.Hand.quitHand(hand, playerIdentifier?)` → Set player's _intents to 3 for removal request
- `Poker.Hand.pauseHand(hand, playerIdentifier?)` → Set player's _intents to 2 for pause request
- `Poker.Hand.waitForBB(hand, playerIdentifier?)` → Set player's _intents to 1 for wait-till-BB request
- `Poker.Hand.resumeHand(hand, playerIdentifier?)` → Set player's _intents to 0 for resume request

### Delegation Methods

Methods that purely delegate to Game namespace for logic operations. These create a Game instance internally to invoke the logic.

#### Action Management (via Game)

- `Poker.Hand.applyAction(hand, action)` → Append action if Game.canApplyAction() returns true
- `Poker.Hand.advance(hand)` → Create Game, call Game.advance(), return resulting Hand
- `Poker.Hand.handleTimeOut(hand)` → Create Game, handle timeout logic, return resulting Hand
- `Poker.Hand.canApplyAction(hand, action)` → Direct pass-through to Game.canApplyAction()
- `Poker.Hand.finish(hand)` → Direct pass-through to Game.finish() for final reconciliation

## Implementation Contract

### Data Layer Contract

Hand methods MUST:

1. **Never** implement game logic or rules
2. **Only** perform data transformations and extractions
3. **Delegate** all logic operations to Game namespace
4. **Maintain** data integrity through immutable operations

### Input/Output Contract

- **Input**: Accepts partial or complete Hand data structures
- **Output**: Always returns new, immutable Hand objects
- **Side Effects**: None - Hand namespace is purely functional
- **Validation**: Only structural validation, game rules handled by Game namespace

### Clear Separation of Concerns

- **Hand Owns**: Data format, serialization, deserialization, data extraction, state progression
- **Game Owns**: All game logic, validation, rules, state progression
- **Command Owns**: Action generation from user input

### Integration Points

- **Game Namespace**: All logic operations delegate to Game
- **Format Parsers**: Uses existing parsers for format conversion
- **Player Utilities**: Simple array lookups for player resolution
- **No Direct Logic**: Hand never directly implements game rules

## Test-Driven Development Implementation

### Test Structure

Tests organized by data operation categories:

- `core-contract.test.ts` - Immutability and data integrity contracts
- `construction.test.ts` - Constructor defaults and basic structure validation
- `format-operations.test.ts` - Parse/serialize round-trip testing
- `data-extraction.test.ts` - getPlayerId, getPlayerIndex, getAuthorPlayerIndex, getTimeLeft, isComplete, isPlayable
- `data-transformation.test.ts` - merge, isEqual, personalize, start operations
- `create-next-hand.test.ts` - Hand rotation and chip continuity for new hands
- `client-methods.test.ts` - Player session management (joinHand, quitHand, pauseHand, waitForBB, resumeHand) with optional playerIdentifier parameter
- `delegation.test.ts` - Verify pure delegation to Game namespace (advance, handleTimeOut, canApplyAction, applyAction, finish)
- `edge-cases.test.ts` - Error scenarios and boundary conditions

### Test Fixtures

- `fixtures/baseHand.ts` - Single BASE_HAND as foundation
- `fixtures/formats/` - Test data in JSON and PokerStars formats
- All fixtures validated through Game namespace to ensure realistic data is being used

### Testing Principles

1. **Data Integrity**: Verify transformations preserve all information
2. **Immutability Testing**: Ensure no input mutation ever occurs
3. **Round-trip Validation**: parse → serialize → parse produces identical data
4. **Pure Delegation**: Delegation methods do nothing except call Game namespace
5. **Format Fidelity**: All formats represent identical game states
6. **No Logic Testing**: Hand tests never validate game rules (that's Game's job)
7. **Deterministic Data**: Same inputs always produce same data outputs

### Key Method Test Scenarios

#### advance() Testing

- Verify it creates a Game instance from Hand
- Confirm it delegates to Game.advance()
- Ensure it returns the resulting Hand from the advanced Game
- Test that input Hand remains unchanged (immutability)
- Verify it handles all automatic progressions (dealer actions, timeouts)

#### handleTimeOut() Testing

- Verify delegation to Game for timeout handling
- Ensure correct player action is applied (fold/muck)
- Test immutability of input Hand

#### applyAction() Testing

- Verify Game.canApplyAction() is called for validation
- Test that valid actions are appended to actions array
- Ensure invalid actions return unchanged Hand
- Confirm no game logic is implemented directly

#### merge() Testing (Updated)

- **Field Compatibility**:
  - Test rejection when variant, venue, currency differ
  - Verify acceptance when all critical fields match
- **Hole Card Resolution**:
  - Test filling unknown cards from incoming state
  - Verify known cards are never overwritten
  - Test card visibility preservation (known vs hidden '??')
  - Verify multiple players' hole cards handling
- **Dealer Action Control**:
  - Test rejection of dealer actions without `allowUnsafeMerge`
  - Verify acceptance with `allowUnsafeMerge` flag
  - Test base state returned unchanged on unauthorized dealer actions
- **Action Sequence Validation**:
  - Test incoming state must contain full base sequence
  - Verify rejection when actions don't match at prefix
  - Test various action sequence lengths
- **Action Diff Security**:
  - Test author validation for action ownership
  - Verify player cannot submit actions for others
  - Test rejection of impersonation attempts
- **Final State**:
  - Verify `author` field always removed from result
  - Test combined state has correct action sequence
  - Verify data enrichment (cards + actions)

## Critical Implementation Details

### Validation Delegation Pattern

Hand.canApplyAction() serves as a convenience wrapper:

```typescript
// Hand delegates validation entirely to Game
Hand.canApplyAction(hand, action) {
  const game = Poker.Game(hand);
  return Poker.Game.canApplyAction(game, action);
}
```

### Format Handling

Format conversion has been moved to the Format namespace for better modularity:

1. Use `Poker.Format.JSON.parse()` and `Poker.Format.JSON.stringify()` for JSON format
2. Use `Poker.Format.Pokerstars.parse()` and `Poker.Format.Pokerstars.stringify()` for PokerStars format
3. Each format module handles its specific parsing and serialization
4. Throws error if parsing fails for the specified format

### Player Resolution (Simple Array Operations)

Basic data lookups without validation:

1. Numeric index → Direct array access (0-based)
2. String name → indexOf() in players array
3. For getPlayerIndex: Return -1 if not found (no error thrown)
4. For getPlayerId: Return venue ID from \_venueIds[index] or null if unavailable
5. For getAuthorPlayerIndex: Return -1 if no author or player not found (no error thrown)

### Player Intent Methods with Optional PlayerIdentifier
Methods quitHand, pauseHand, waitForBB, and resumeHand support optional playerIdentifier parameter:
1. **Priority Logic** (no errors thrown):
   - If `hand.author` exists → use author field (ignore playerIdentifier)
   - If no author but playerIdentifier provided → use playerIdentifier
   - Otherwise → return unchanged hand (same instance)
2. **PlayerIdentifier Types**:
   - Numeric index (0-based) → direct array access
   - String name → player name lookup
   - Index 0 is valid (falsy but valid)
3. **Immutability**:
   - Return new Hand instance when change is made
   - Return same instance when no change (no unnecessary cloning)
4. **State Transitions**:
   - With author: client restrictions apply (e.g., cannot pause if leaving)
   - With playerIdentifier (authorless): all transitions allowed
5. **Array Initialization**:
   - Creates _intents array if missing
   - Never modifies _inactive or _deadBlinds

### Action Application Flow

```
Hand.applyAction()
  → Create Game from Hand
  → Delegate to Game.canApplyAction()
  → If valid, append to actions array
  → Return new Hand object (unchanged if invalid)
```

### Data Merge Strategy (Updated)

Progressive state reconciliation with data integrity preservation:

1. **Field Compatibility Validation**:
   - Verifies critical fields match between states (variant, venue, currency, etc.)
   - Ensures both states represent the same game instance
   - Rejects merge if fundamental game properties differ

2. **Hole Card Resolution**:
   - Fills unknown cards from incoming state when base state has hidden cards ('??')
   - Preserves already known cards in base state (no overwriting)
   - Processes hole cards before other actions for accurate state reconstruction
   - Supports adding newly revealed cards with `allowUnsafeMerge` flag

3. **Dealer Action Control**:
   - Incoming state cannot inject dealer actions without explicit permission
   - `allowUnsafeMerge` flag enables dealer action acceptance
   - Returns unchanged base state if unauthorized dealer actions detected

4. **Action Sequence Validation (Suffix Comparison)**:
   - Verifies incoming state extends base state (not replaces)
   - Incoming actions must contain complete base action sequence at start
   - Ensures no retroactive modification of established game history
   - Common prefix must equal full base state action count

5. **Information Maximization**:
   - Combines most complete card information from both states
   - Maintains action sequence integrity while enriching data
   - Confirms incoming state is valid continuation of base state

6. **Action Diff Security**:
   - Extracts new actions from incoming state (beyond base state)
   - Validates author field against action ownership
   - Prevents impersonation (player cannot submit actions for others)
   - Rejects dealer actions in diff unless `allowUnsafeMerge` is true
   - Author identity verification critical for security

7. **Final State Construction**:
   - Appends validated diff to base state actions
   - Always removes `author` field from result (server stores authorless state)
   - Author field only used during merge validation phase
   - Returns enriched, validated game state

## Error Handling Philosophy

Hand namespace errors focus on data operations only:

1. **Invalid Construction**: Basic structure errors only (missing required fields)
2. **Parse Failures**: Format detection errors with attempted format info
3. **Delegation Errors**: Pass through Game namespace errors unmodified
4. **No Data Type Issues**: Wrong data types is being handled via typescript, not logic
5. **No Game Logic Errors**: Hand never validates game rules

## Testing Strategy

The main idea is to keep tests straightforward and easy to follow, while still making sure every bit of logic is covered. Tests should be as simple as possible, but thorough enough to exercise all the important paths.

### Unit Tests

- Each Hand method tested in isolation
- Mock underlying utilities to verify delegation
- Test contract compliance (immutability, determinism)
- Validate error handling and edge cases

### Integration Tests

- Full flow from construction to serialization
- Multi-format round-trip validation
- Complex hand progression scenarios
- Cross-namespace operation chains

### Property-Based Tests

- Invariants: Immutability across all operations
- Determinism: Same inputs → same outputs
- Format Equivalence: All formats represent same data
- Delegation Consistency: Results match direct utility calls
