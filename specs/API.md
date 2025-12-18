# Poker Engine API Reference

Complete reference for all public methods available through the Poker namespace.

```typescript
import * as Poker from '@idealic/poker-engine';
```

## Poker.Hand Namespace

The Hand namespace provides poker hand notation and processing capabilities. Hand objects serve as the single source of truth in the engine's Hand-centric architecture.

**Core capabilities:**

- **Hand Creation**: Constructor with validation and variant-specific defaults
- **Format Processing**: Parse and serialize between different hand formats (JSON, PokerStars)
- **State Management**: Action application, hand advancement, and game state queries (delegates validation to Game namespace)
- **Data Operations**: Merging, comparison, export, and player perspective handling
- **Hand Rotation**: Create next hand from completed hand with button rotation and chip continuity

For complete Hand reference including all methods, field definitions, action formats, and usage examples, see **[Hand Reference](./HAND.md)**.

## Poker.Game Namespace

The Game namespace provides comprehensive poker game management with constructor overloads for different initialization patterns and utilities for game state analysis.

**Core capabilities:**

- **Game Creation**: Multiple constructor patterns for Hand objects and direct property initialization
- **State Analysis**: Showdown detection, player indexing, timing utilities
- **Action Validation**: Primary validation method for comprehensive rule checking and action legality
- **Live Table Management**: Real-time game state processing and analytics

For complete Game reference including all methods, constructor overloads, usage examples, and live table management patterns, see **[Game Reference](./GAME.md)**.

### Command Integration

The Game namespace provides direct access to all Command methods for generating poker actions. Commands translate user interactions into properly formatted Action values that can be applied to Hand states.

For complete Command reference including all methods, parameters, usage examples, and game flow patterns, see **[Command Reference](./COMMAND.md)**.

**Available command categories:**

- **Player Actions**: fold, call, check, bet, raise, allIn, auto, message
- **Dealer Operations**: deal, showCards, muckCards, forceShowCards

## Poker.Stats Namespace

The Stats namespace provides tools for extracting, processing, and aggregating poker statistics from Hand or Game objects.

**Core capabilities:**

- **Stats Extraction**: Generate detailed per-player, per-street statistics from a hand.
- **Data Aggregation**: Aggregate stats by player, street, or venue.
- **Data Formatting**: Export stats in different formats (rows, column names).

For a complete Stats reference including all methods and usage examples, see **[Stats Reference](./STATS.md)**.
