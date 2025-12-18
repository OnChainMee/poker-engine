# Poker Engine - Technical Understanding

## What is the Poker Engine?

The **Poker Engine** is a comprehensive software system that manages the complete lifecycle of poker games. It's an abstract entity composed of simpler, specialized entities, utilities, methods, and handlers that work together to enable the creation, progression, and completion of poker games.

### Core Purpose

The poker engine is designed to support the complete game cycle. It provides mechanisms to:

- Create and initialize poker games with specific rules and players
- Play through hands with proper rule enforcement
- Advance games through betting rounds and streets
- Finish games with proper pot distribution and winner determination
- Rotate to next hand with button movement and chip continuity

When imported as `import * as PokerEngine from '@idealic/poker-engine'`, it provides a complete toolkit for poker game management.

### Key Design Principles

### 1. Immutability (Functional Core)

The engine operates as a reducer, applying actions to the state to produce a new state. This follows a functional approach where the core logic is pure and immutable. Immutability is not achieved by deep copying, but by the reducer pattern itself, ensuring predictable state transitions and enabling the functional core to remain pure while the imperative shell (`Game`) handles mutations.

### 2. Deterministic Behavior

Seeded random number generation ensures games can be replayed exactly, critical for testing and dispute resolution.

### 3. Validation-First

Every action is validated before application, preventing invalid states rather than handling errors after corruption.

### 4. Separation of Concerns (Functional Core / Imperative Shell)

Clear boundaries between data representation (**State**, implemented as `Hand`), runtime state (`Game`), and game logic (processors, validators). The `Game` acts as a mutable shell for the functionally pure `State`.

### 5. Action-Based Architecture

All state changes flow through standardized action strings, creating an event-sourced system with complete audit trails.

### 6. Protocol-Based Abstraction

Universal namespace protocols (Hand/Game/Command) create a consistent layer, enabling the same API pattern to work across different game engines and simplifying multi-game platform development.

## Advanced Features

### Multi-Format Support

- Import/export PokerStars hand histories
- Generate human-readable narratives
- JSON serialization for storage

### Player Perspectives

- Personalization shows each player only the information they're allowed to see
- All information is always available as appropriate to the game state.

### Statistics Tracking

- Real-time player statistics (VPIP, PFR, aggression)
- Position-based metrics
- Street-by-street analysis

### Complex Scenarios

- Multi-way all-in handling
- Side pot creation and distribution
- Heads-up position adjustments
- Sitting out player management
- Dead blind posting
- Accurate pot arithmetic
- Rake calculation with "no flop, no drop" support
- Split pot remainder distribution
- Tracks betting state across multiple streets

## Testing & Reliability

The engine includes comprehensive test coverage for:

- Complex betting sequences across multiple streets
- All-in scenarios with side pots
- Showdown mechanics and winner determination
- Edge cases like split pots, uncalled bets
- Position changes and turn order
- Rake calculations with "no flop, no drop"
- Tested by importing(and processing) 10 000 000 Pokerstars game hands

Each test validates complete state transitions, ensuring the engine handles real-world poker complexity reliably.

## Performance Optimizations

- **Lookup Tables**: Pre-computed hash tables for instant hand strength evaluation
- **Functional State Updates**: State transitions handled via pure reducers
- **Lazy Evaluation**: Deferred calculations until needed
- **Minimal Allocations**: Reuse of data structures where possible

## Namespace Abstraction Pattern

The engine implements a protocol-based design through three core namespaces that act as universal wrappers, simplifying engine usage and enabling support for any turn-based game:

### Protocol Namespaces

**Hand Namespace** - Generic Game Notation Protocol

- Not poker-specific but a universal game notation format
- Represents ANY turn-based game state (poker, chess, blackjack, etc.)
- Stores complete game history as action sequences
- Enables client-server synchronization for any game type
- In abstract terms: Hand = serializable game state notation
- The API provides a flexible, high-level abstraction that is not tied to any specific engine

**Game Namespace** - Runtime State Protocol

- Provides live game state management
- Abstracts complex engine operations into simple API
- Works with any game that can be represented as Hand notation
- Transforms notation into playable runtime state
- Handles all game rules, state validation, and progression, centralizing these responsibilities within the engine.

**Command Namespace** - Action Generation Protocol

- Interface abstraction for user interactions
- Translates UI events into standardized Action values
- Game-agnostic command generation system
- Creates actions consumable by any compatible engine
- Handles action validation and automatically adjusts actions, such as calculating the precise all-in amount

### Design Pattern Benefits

This namespace pattern creates a **specification layer** that:

1. **Decouples game logic** - Engine internals remain isolated
2. **Ensures consistent API across games** – The same API applies to any supported game type
3. **Simplifies integration** - Developers use consistent API regardless of game
4. **Standardizes communication** - Client-server exchange uses universal Hand format

### Extensibility Beyond Poker

The constant Hand transmission between client and server is game-agnostic:

- **For Poker**: Contains cards, bets, pot information
- **For Chess**: Would contain piece positions, moves, captures
- **For Blackjack**: Would contain dealt cards, player decisions, dealer rules
- **For Any Turn-Based Game**: Action history + current state = Hand

The namespaces act as a **specification** - determining how to interact with whichever game engine is loaded, making the system inherently extensible to any turn-based game following the same action-based architecture.

## Core Capabilities

### Game State Management

- **Card Dealing**: Deterministic card dealing using seeded randomization for reproducible games
- **Betting Mechanics**: Complex betting state tracking with precise financial calculations
- **Pot Management**: Sophisticated side pot creation and distribution algorithms
- **Turn Order**: Automatic position management and turn determination

### Rule Enforcement

- **Validation System**: Prevents invalid actions before they corrupt game state
- **Betting Rules**: Enforces minimum bets, raise requirements, and all-in rules
- **Street Progression**: Manages transitions from preflop through showdown
- **Showdown Logic**: Determines winners using fast hand strength evaluation

### Player Management

- **Position Tracking**: Button, small blind, big blind, and acting positions
- **Stack Management**: Precise chip tracking with all-in detection
- **Action History**: Complete audit trail of all player and dealer actions
- **Fair Play**: Ensures proper turn order and prevents out-of-turn actions

## Architectural Components

### 1. Data Structures Layer

**State Types (Hand)** (`types.ts`)

- `NoLimitHand`, `FixedLimitHand`, `StudHand` - Immutable data structures (State) for different poker variants
- Stores complete game history as action sequences
- Enables game reconstruction from any point

**Game Interface** (`Game.ts`)

- Runtime state representation with 80+ properties
- Mutable state for active gameplay
- Complete table information including players, cards, pot, and betting state

**Player Interface**

- Individual player state: stack, cards, betting amounts, action flags
- Tracks `hasFolded`, `isAllIn`, `hasActed` for game flow control

### 2. Core Engine Systems

**Action Processor** (`actions/processor.ts`)

- Central command processor applying all state changes
- Pure state updates via reducer pattern
- Universal handler for dealer and player actions
- Format: `'p1 f'` (fold), `'p2 cbr 100'` (raise), `'d db AhKhQh'` (deal board)

**Table Management** (`Game.ts`)

- `Game(hand)` - Converts Hand to Game runtime state
- Initializes positions, posts blinds/antes
- Replays action history to build current state

**Position Management** (`utils/position.ts`)

- `getPlayerIndex()` returns `-1` for dealer turn, player index otherwise
- Manages circular turn order with fold/all-in filtering
- Street-specific first-to-act calculations

**Validation System** (`utils/validation.ts`)

- `isAwaitingDealer()` - Determines dealer vs player turns
- Action-specific validators: `canCheck()`, `canBet()`, `canRaise()`
- Prevents invalid game state transitions

### 3. Game Flow Orchestration

**Croupier** (`game/croupier.ts`)

- Coordinates dealer and player actions through completion
- Integrates with PlayerFunction callbacks for AI/human decisions
- Enables running virtual poker games, testing scenarios, and replaying entire games in a fully isolated environment

**Dealer** (`game/dealer.ts`)

- Autonomous dealer making automatic progression decisions
- `deal(game)` determines next appropriate action
- Handles card dealing, street advancement, showdown management
- Seeded deterministic shuffling for reproducible games

**Betting Module** (`actions/betting.ts`)

- Complex betting state with `currentBet`, `roundBet`, `totalBet`
- All-in handling with automatic side pot creation
- Betting round completion detection

### 4. Specialized Systems

**Hand Strength Evaluation** (`utils/hand-strength.ts`)

- Fast lookup table-based evaluation
- Pre-computed hash tables for 5, 6, and 7-card hands
- Hand ranking classification (High Card, Pair, Flush, etc.)

**Stack Finalization** (`game/stacks.ts`)

- `finalizeStacks()` - Sophisticated pot distribution engine
- Side pot slicing for multiple all-in scenarios
- "No flop, no drop" rake implementation
- Split pot handling with remainder distribution

**Showdown System** (`actions/showdown.ts`)

- Hand comparison and winner determination
- Card revealing sequence management
- End-of-hand processing

## Action Format Specification

The engine uses standardized action strings for all game events:

### Player Actions

- `'p1 f'` - Player 1 folds
- `'p2 cc'` or `'p2 cc 0'` - Player 2 checks
- `'p2 cc 20'` - Player 2 calls 20
- `'p3 cbr 100'` - Player 3 bets/raises to 100
- `'p1 sm AsKs'` - Player 1 shows cards at showdown

### Dealer Actions

- `'d dh p1 AsKs'` - Deal hole cards to player 1
- `'d db AhKhQh'` - Deal board cards (flop)
- `'d db Td'` - Deal turn card
- `'d db 9s'` - Deal river card

### Commentary

- `'p4 m Hello!'` - Player 4 sends a message

### Client and server difference

The key difference between client and server is that the client only sees the game from a single player's perspective. The client is mainly concerned with managing that player's UI—showing possible actions, updating the display as the game state changes, handling animations, and so on. The flow is straightforward: **merge the received Hand state**, **figure out what the player can do**, **wait or create an action**, **apply it**, and **send the updated Hand back to the server**.

On the other hand, the server has a more involved job. It handles communication with all clients, making sure everyone has the correct Hand state. The server knows the game seed and is responsible for fair play, ensuring each player only sees their own cards (and mucked or showdown cards as appropriate). It also validates all incoming Hand states, progresses the game by performing dealer actions, determines winners, redistributes the pot, and updates player balances.

## Summary

The Poker Engine uses a layered, protocol-driven design: **State** (`Hand`) is a universal, immutable game notation, **Command** translates user intent, and **Game** acts as the imperative shell that enforces all rules and validation. This separation ensures the core data remains pure while the shell handles the specific logic of Poker, making the system compatible with the generalized Game Service architecture.
