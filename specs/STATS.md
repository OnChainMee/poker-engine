# Poker.Stats Namespace

Complete reference for the `Poker.Stats` namespace, providing tools for poker analytics and statistical processing.

```typescript
import * as Poker from '@idealic/poker-engine';
```

## Main Function

**`Poker.Stats(source: Game | Hand | StreetStat[]): StreetStat[]`**

Extracts raw street-by-street, player-by-player statistics from a `Game` or `Hand` object. If an array of `StreetStat` is passed, it returns it unchanged. This is the primary function for accessing detailed statistical data.

## Core Methods

**`Poker.Stats.aggregate(source: Game | Hand | StreetStat[], groups: ('player' | 'street' | 'venue')[]): AggregatedStats`**

Aggregates statistics based on specified grouping criteria. It can group stats by player, street, or venue to provide summarized views of the data.

**`Poker.Stats.forPlayer(game: Game, playerIdentifier: PlayerIdentifier): StreetStat[]`**

Filters and returns all statistics for a specific player from a game.

**`Poker.Stats.forPlayerStreet(game: Game, playerIdentifier: PlayerIdentifier, street: Street): StreetStat | undefined`**

Finds and returns the statistics for a specific player on a specific street.

**`Poker.Stats.getRows(source: Game | Hand | StreetStat[]): any[][]`**

Returns the statistics as an array of rows, where each row is an array of stat values. Useful for exporting to CSV or other row-based formats.

**`Poker.Stats.getColumnNames(): string[]`**

Returns an array of all available statistic names in snake_case format, corresponding to the columns for `getRows`.

## Usage Examples

```typescript
import * as Poker from '@idealic/poker-engine';

const game = Poker.Game({
  /* ... */
});

// Get stats for a specific player
const playerStats = Poker.Stats.forPlayer(game, 'Alice');

// Get stats for a player on a specific street
const flopStats = Poker.Stats.forPlayerStreet(game, 'Alice', 'flop');
```

## Statistics Philosophy

The stats engine distinguishes between **Stats** and **Metrics**:

- **Stats**: These are the raw, fundamental counts tracked in real-time during a hand. They record basic events like `three_bet_ip_attempts` or `cbet_oop_challenges`. The system is optimized to capture these efficiently.
- **Metrics**: These are derived, contextual calculations computed from one or more base stats. Metrics provide meaningful insights into player behavior, such as `three_bet_frequency` (calculated from `three_bet_attempts` and `three_bet_opportunities`).

This separation allows for a lean, high-performance tracking system at the core, while enabling powerful, flexible analysis on top.

## Tracked Tactical Maneuvers

The engine tracks a comprehensive set of common poker maneuvers to build detailed player profiles. For a full breakdown of the logic for identifying each maneuver and determining positional advantage (IP/OOP), please refer to the [Positional Stat Tracking Strategy](./APPENDIX_STATS_POSITIONING.md) document.

### Stat Breakdown

Each maneuver is broken down into a set of granular stats and derived metrics for both the **aggressor** (the player making the move) and the **defender** (the player facing the move). This allows for a precise analysis of how a player acts and reacts in specific situations.

**For the Aggressor:**

_Base Stats:_

- **`{maneuver}_{ip/oop}_opportunities`**: How many times the player had a chance to make the move, either In Position (IP) or Out of Position (OOP).
- **`{maneuver}_{ip/oop}_attempts`**: How many times the player actually made the move.
- **`{maneuver}_{ip/oop}_takedowns`**: How many times the player's attempt resulted in them winning the pot without a showdown on that street.

_Derived Metrics:_

- **`{maneuver}_{ip/oop}_frequency`**: The percentage of time a player makes the move when given the opportunity (`attempts` / `opportunities`).
- **`{maneuver}_{ip/oop}_takedown_frequency`**: The success rate of the move; the percentage of time an attempt results in winning the pot (`takedowns` / `attempts`).

**For the Defender:**

_Base Stats:_

- **`{maneuver}_{ip/oop}_challenges`**: How many times the player faced this move.
- **`{maneuver}_{ip/oop}_continues`**: How many times the player defended against the move by calling or raising.
- **`{maneuver}_{ip/oop}_folds`**: How many times the player folded to the move.

_Derived Metrics:_

- **`{maneuver}_{ip/oop}_continue_frequency`**: The percentage of time a player defends against the move (`continues` / `challenges`).
- **`{maneuver}_{ip/oop}_fold_frequency`**: The percentage of time a player folds when facing the move (`folds` / `challenges`).

### List of Tracked Maneuvers

**Pre-flop:**

- Limp
- 3-Bet
- Squeeze (a 3-bet variant)
- 4-Bet
- 5-Bet
- Steal Attempt
- Open Shove

**Post-flop:**

- Continuation Bet (C-Bet)
- Delayed C-Bet
- Double Barrel / Triple Barrel
- Probe Bet
- Float Bet
- Donk Bet
- Check-Raise
- Shove

## Data Aggregation and Warehousing

The raw statistical events captured by the poker engine are written to a TimescaleDB hypertable named `poker_stats`. To enable high-performance analytics, these raw stats are then processed through a sophisticated, multi-layered aggregation pipeline.

Instead of storing pre-calculated, aggregated numbers (like total bets or average VPIP), the system uses specialized statistical digests from the TimescaleDB Toolkit, such as `statssummary1d` and `uddsketch`.

The pipeline works as follows:

1.  **Ingestion**: Raw stats from the `poker_stats` table are fed into an `input_agg` function. This function converts numeric values (like bet amounts) into statistical digests. For example, a series of bet amounts becomes a single `statssummary1d` object that efficiently stores sum, count, min, max, etc.

2.  **Hierarchical Rollups**: A series of TimescaleDB Continuous Aggregates automatically and efficiently roll up these digests into hierarchical time buckets:
    - **`poker_stats_hourly`**: Raw stats are aggregated into hourly summaries.
    - **`poker_stats_daily`**: Hourly digests are rolled up into daily digests.
    - **`poker_stats_monthly`**: Daily digests are rolled up into monthly digests.

    This hierarchical structure means that querying for a month's worth of data is incredibly fast, as the database only needs to combine ~30 daily digest rows instead of processing millions of raw event rows.

3.  **Querying (Egress)**: When you query the data, a final accessor function (`output_agg`) is used. This function unpacks the digests back into human-readable numbers (e.g., `public.sum(bets_digest)`) and calculates all the derived metrics (like frequencies and factors) on the fly.

This approach provides the best of both worlds: extreme performance and storage efficiency through digest-based rollups, and the flexibility to compute a vast array of complex metrics at query time without being constrained by pre-aggregated data.
