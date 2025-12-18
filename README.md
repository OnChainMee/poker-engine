# @yuga-labs/poker-engine

NOTE: this is forked from
[@idealic/poker-engine](https://www.npmjs.com/package/@idealic/poker-engine),
which had Typescript type errors that prevented us from using the library directly.

Professional poker game engine with TypeScript support. Provides comprehensive game state management, action processing, and hand evaluation for Texas Hold'em and other poker variants.

## Overview

The Poker Engine provides two core abstractions for building poker applications:

- **Hand**: A standardized notation format that stores the complete sequence of actions in a poker game, similar to chess notation. This action-based approach enables deterministic game reconstruction, easy storage, and network transmission.

- **Game**: A rich game state object containing all information needed to render a poker table, including player stacks, community cards, pot size, betting status, and available actions.

## Core Concepts

### The State (Poker.State) as a Functional Core

The Poker Engine uses a standardized notation for poker games, which is conceptually the **State** (implemented as `Poker.State`), as the source of truth. This State is **fully self-contained**, meaning it holds every piece of information required to play the game. Similar to chess notation, it stores the complete history of actions, which allows for perfect reconstruction of the game at any point.

The engine follows the **Functional Core, Imperative Shell** architectural pattern:

- **Functional Core (`Poker.State`):** This is the pure, immutable data structure that represents the game state. It is modified only through pure reducer functions that take a state and an action, and return a new state. Immutability is achieved not by deep copying, but by the reducer pattern itself, ensuring a predictable state evolution.
- **Imperative Shell (`Poker.Game`):** The `Game` acts as a mutable wrapper or "shell" around the functionally pure `State`. It manages the runtime environment, provides a convenient API for querying the state, and handles side effects, but it delegates the core logic to the pure state reducers.

This approach offers several key advantages:

- **Portability:** The State notation is a human-readable, portable format that is easily stored, transmitted, and replayed.
- **Determinism:** The game state can be precisely reconstructed by replaying actions, simplifying debugging and testing.
- **Flexibility:** The notation supports a wide variety of poker variants and game types.

### The Game as a Vision of the Table

While the `State` is the data, the `Game` object provides the interface needed to render a poker game, including:

- Players, stacks, and action status
- Community cards and pot size
- Current betting round and next player to act
- Allowed actions (buttons to enable) and timeouts
- Winnings, losses, and rake computations

### Standardized Statistics

The engine gathers metrics (stats) for each play action using a standardized API. While the specific statistics (like "VPIP" or "3-Bet") are unique to Poker, the approach allows different engines to plug into the same infrastructure.

### Poker.Format Namespace

The `Poker.Format` namespace provides specialized utilities for:

- **Serialization/Deserialization:** Efficiently encoding and decoding game states and actions for network transmission or storage.
- **Hand History Parsing:** Converting raw hand history text into structured `Hand` objects, compatible with major formats like PokerStars.

## Reliability

The engine is developed using a rigorous **spec-driven approach**, ensuring that every rule and mechanic is formally defined. It is backed by approximately **3000 tests**, covering a vast array of scenarios—from standard play to complex edge cases like multi-way side pots and split pots—guaranteeing rock-solid stability and correctness.

Additionally:

- **Fuzzy Testing:** The full game lifecycle is continuously validated via fuzzy testing at the Game Service integration level, simulating chaotic real-world conditions.
- **Proven Heritage:** The engine's logic is derived from a system compatible with the **PokerStars hand format**, which has been stress-tested against a dataset of over **10 million historical games**.

## System Architecture

### Scope & Responsibilities

The Poker Engine provides the **game logic** and **state management** for a single table. It explicitly **does not** handle:

- **Table Management:** Creation of tables, matchmaking, or seating logic.
- **User Sessions:** Authentication, balance management, or persistent connections.

These concerns are handled by the generic **Game Service**.

### Client-Server Model

The Poker Engine runs on both the client and the server.

- **Client-Side:** Handles optimistic rendering and enables user actions (e.g., showing the bet button) based on the local state.
- **Server-Side:** Acts as the ultimate authority for action validation, game sanitization (hiding hole cards), and randomness (shuffling/dealing).

### Integration

This engine is designed to work seamlessly with:

- **Backend:** **[@idealic/game-service](../game-service/README.md)** — A generic game service that handles session management, persistence, and networking. The Poker Engine registers as a logic provider within this service.
- **Frontend:** **[@idealic/poker-ui](../poker-ui/README.md)** — A pure functional React UI that renders the `Game` state produced by this engine.

## Game Lifecycle

The Poker Engine operates as a request-response pipeline.

### 1. Joining and Initialization

Players request to join or create a game. The system finds a matching table or creates a new one. The game waits until at least **two active players** are seated before starting.

### 2. Game Creation

Once conditions are met:

1.  **Initialization:** The authoritative `State` is created with a secure seed.
2.  **Dealer Actions:** Initial shuffling and dealing occur immediately.
3.  **Persist & Broadcast:** The state is stored and a sanitized version is sent to players.

### 3. Player Action Loop

1.  **Receive:** Client sends an action.
2.  **Process:** The engine applies the action to the current server state.
3.  **Update:** The new state is stored, sanitized, and broadcast to all players.

### 4. Completion and Succession

When a hand finishes, the engine enforces succession rules (moving the button, handling blinds) and automatically prepares the `State` for the next hand.

### 5. Player Lifecycle Management

Players can signal their intent to change status at any time, which takes effect **starting from the next game**:

- **Quit:** Leave the table after the current hand.
- **Pause:** Sit out starting next hand.
- **Resume / Wait for BB:** Unpause ASAP or wait for the Big Blind to rejoin.

### 6. Waiting State

If there are not enough **active players** (minimum 2) to start the next game:

1.  The game loop pauses.
2.  Players wait at the table.
3.  The next game starts automatically once new players join or existing players unpause.

### 7. Timeout Handling

The system (via the Game Service) periodically checks for timeouts and applies default actions (e.g., fold) to keep the game moving.

## Usage Examples

### Basic Hand Processing

```typescript
import * as Poker from '@idealic/poker-engine';

// Create a hand object
const hand = Poker.State({
  variant: 'NT',
  players: ['Alice', 'Bob'],
  startingStacks: [1000, 1000],
  blindsOrStraddles: [10, 20],
  minBet: 20,
  actions: [],
});

// Convert to game state
const game = Poker.Game(hand);

// Execute commands
const foldAction = Poker.Command.fold(game, 0);
const updatedHand = Poker.State.applyAction(hand, foldAction);

// Export for display (from player perspective)
const playerPerspectiveGame = Poker.State.personalize(hand, 'Alice');

// Check time elapsed
const elapsed = Poker.State.getTimeLeft(hand);

// Handle timeouts automatically
const timeoutCheckedHand = Poker.State.advance(hand);
```

## Documentation

- **[Engine Reference](./specs/ENGINE.md)** - System design and principles.
- **[Game Namespace](./specs/GAME.md)** - Game state management and table processing.
- **[Hand Namespace](./specs/HAND.md)** - Hand notation format.
- **[Format Namespace](./specs/FORMAT.md)** - Tools for serializing and deserializing game data and hand histories.
- **[Command Namespace](./specs/COMMAND.md)** - Action generation and execution.
- **[API Reference](./specs/API.md)** - Detailed API documentation.
- **[Statistics](./specs/STATS.md)** - Analytics capabilities.

## License

MIT License - see [LICENSE](./LICENSE) file for details.
