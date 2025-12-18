# Positional Stat Tracking Strategy

## 1. Overview

To enhance the predictive power of our player statistics, we are transitioning to a new system that incorporates positional awareness. The current stats are often not descriptive enough because they lack the context of whether a player was In Position (IP) or Out of Position (OOP) when making a play.

The new system will break down key maneuvers by position, allowing for a more granular and accurate analysis of player tendencies. This will help us build better predictive models of player behavior.

## 2. Stats vs. Metrics Philosophy

The thinking is as follows: we have stats and metrics in the system.

- **Stats** are the bare minimum, compact values that are tracked in real-time during game processing. They track basic events (e.g., `four_bets`) and flags (e.g., `aggressor_in_position`).
- **Metrics** are more complex, descriptive values constructed from stats. They are computed by taking multiple stats into account to create a fuller picture of an action, for example by combining a base stat with a positional flag.

This approach keeps the core stat tracking lean and efficient, while allowing for powerful, detailed analysis through metrics.

## 3. Stat and Metric Naming

### Aggressor Stats

To avoid ambiguity when a player makes multiple aggressive actions with different positional contexts on the same street, we track aggressive maneuvers with explicit positional counters. The naming convention follows the pattern `{maneuver}_{ip/oop}_{stat_type}`.

**Base Stats Tracked (per-maneuver):**

- `{maneuver}_ip_opportunities`
- `{maneuver}_oop_opportunities`
- `{maneuver}_ip_attempts`
- `{maneuver}_oop_attempts`
- `{maneuver}_ip_takedowns`
- `{maneuver}_oop_takedowns`

_Example for a 4-bet aggressor:_

We would directly track stats like `four_bet_ip_opportunities`, `four_bet_ip_attempts`, and `four_bet_ip_takedowns` (and their `_oop` counterparts) in the stats engine.

The old `aggressions_in_position` field will still be tracked as a simple counter for total in-position aggressions on a street, but it will no longer be used to derive positional metrics.

### Defender Stats

To avoid ambiguity when a player faces multiple defensive decisions against different aggressors on the same street, we track defensive maneuvers with the same explicit positional counters.

**Base Stats Tracked (per-maneuver):**

- `{maneuver}_ip_challenges`
- `{maneuver}_oop_challenges`
- `{maneuver}_ip_continues`
- `{maneuver}_oop_continues`
- `{maneuver}_ip_folds`
- `{maneuver}_oop_folds`

_Example for a player facing a 4-bet:_

We would directly track stats like `four_bet_ip_challenges`, `four_bet_ip_continues`, and `four_bet_ip_folds` (and their `_oop` counterparts) in the stats engine.

The old `challenges_in_position` field will still be tracked as a simple counter but will no longer be used for deriving metrics.

### Replacing Old Stats

This new system clarifies and expands upon the old maneuver-based stats. The new, granular IP/OOP stats are now the source of truth. For backward compatibility or simpler analysis, the old base stats can be derived by summing their positional counterparts.

- **Base Aggression Stats** like `threeBets` are now `three_bets`.
  - `three_bets = three_bet_ip_attempts + three_bet_oop_attempts`
- **Base Fold Stats** like `threeBetFolds` are now `three_bet_folds`.
  - `three_bet_folds = three_bet_ip_folds + three_bet_oop_folds`
- **Old Success/Defense Stats are replaced by new metrics:**
  - Stats ending in `*Successes` (e.g., `openShoveSuccesses`) are replaced by `*Takedowns`.
  - Stats ending in `*Defenses` (e.g., `squeezeDefenses`) are replaced by `*Continues`.

The generic `success` flag on a player's record for a hand will still be used to indicate if they won the pot.

## 4. Migration Strategy

This is a significant refactoring of our stats system. The migration will be performed in stages:

1.  **Introduce New Stats**: Implement the logic to track the new positional stats alongside the existing ones. This will involve significant changes to `poker-engine/src/stats/stats.ts`.
2.  **Update Stats Serializer**: The stats serialization and storage mechanism will need to be updated to handle the new stat format.
3.  **Update Consumers**: Any part of the application that consumes stats will need to be updated to use the new positional stats.
4.  **Deprecate and Remove Old Stats**: Once the new system is validated and fully integrated, we will remove the old, non-positional stats to clean up the codebase.

## 5. Positional Logic Reference

This section defines how to determine if a player is In Position (IP) or Out of Position (OOP) for various game situations. For any facing decision in a multiway pot, log one record per defender vs the actual bettor they face.

### Preflop (Projected Position)

For preflop actions, "position" refers to the projected postflop betting order among the players still in the hand when the action occurs.

- **Limp**
  - **Opportunity**: A player has an opportunity to limp if the action has folded to them and no raise has occurred yet. They must be able to call the big blind to enter the pot.
  - **Action**: Calling the big blind as the first voluntary action to enter the pot.
  - **Positional Note**: Limping is a passive action. While a player's position when limping significantly impacts their postflop strategy, the limp stat itself (`limps`, `limpOpportunities`) is not broken down into IP/OOP variants in our system.

- **Preflop Raise (PFR)**
  - **Opportunity**: A player has an opportunity to make a preflop raise if no other player has raised on the current street. There may be one or more limpers before them.
  - **Aggressor**: The player making the first raise.
  - **Positional Note**: PFR is a foundational aggression metric. While the player's position is critical, the base PFR stat (`preflop_raises`, `preflop_raise_opportunities`) is tracked as a single, non-positional value representing a player's overall tendency to open-raise. More specific preflop raises, like Steal Attempts, are broken down by position.

- **3-Bet**
  - **Opportunity**: There has been exactly one raise; one or more callers are optional. Opportunity only if raising is open (no closed-raise situations after a short all-in under-raise).
  - **Aggressor**: The 3-bettor.
  - **Compute IP Against**: The last preflop aggressor (the opener).
  - **Aggressor IP Rule**: IP ⇔ `pos[3B] > pos[lastAgg]`.

- **Squeeze (3-Bet Variant)**
  - **Opportunity**: There has been a raise and at least one caller before the player's action.
  - **Aggressor**: The Squeezer.
  - **Compute IP Against**: The Original Raiser (OR) (last aggressor).
  - **Aggressor IP Rule**: IP ⇔ `pos[Squeezer] > pos[OR]`.
  - **Note on Strict Squeeze IP**: For more granular analysis, a "strict" squeeze can be marked as IP only if `pos[squeezer]` is greater than the OR's position _and_ greater than the position of every caller.

- **4-Bet**
  - **Opportunity**: The last aggressive action was a 3-bet. Opportunity only if raising is open (no closed-raise situations after a short all-in under-raise).
  - **Aggressor**: The 4-bettor.
  - **Compute IP Against**: The 3-bettor (last aggressor).
  - **Aggressor IP Rule**: IP ⇔ `pos[4B] > pos[3B]`.

- **5-Bet**
  - **Opportunity**: The last aggressive action was a 4-bet. Opportunity only if raising is open (no closed-raise situations after a short all-in under-raise).
  - **Aggressor**: The 5-bettor.
  - **Compute IP Against**: The 4-bettor (last aggressor).
  - **Aggressor IP Rule**: IP ⇔ `pos[5B] > pos[4B]`.

- **Steal Attempt**
  - **Opportunity**: Action folds to the player in the Cutoff (CO), Button (BTN), or Small Blind (SB), and the actor can open-raise.
  - **Aggressor**: Stealer (CO/BTN/SB).
  - **Compute IP Against**: Players yet to act (Blinds, or BTN if CO opens).
  - **Aggressor IP Rule**:
    - **Behind-seat (strict)**: BTN steal is IP. SB steal is OOP. CO steal is IP only if BTN folded.
    - **Blinds-centric (HUD)**: Any open from CO, BTN, or SB is considered a steal attempt against the blinds. Position is determined relative to the blinds. (Recommended for production).
    - **Note on SB vs BB**: While we classify an SB open as OOP, many HUDs treat "SB vs BB" as a unique steal category without a specific positional label, due to its distinct dynamics.

- **Open Shove**
  - **Opportunity**: Player is first-in to the pot (or facing only limpers) and moves all-in. No prior raise on this street (limps allowed). If there is a prior raise/3-bet and raising is open, an all-in is a 3b/4b/5b shove, not an open shove.
  - **Aggressor**: First all-in bettor.
  - **Compute IP Against**: Remaining field.
  - **Aggressor IP Rule**: IP ⇔ Is last to act among active players at the moment of the shove.

### Postflop (Actual Street Order)

For postflop actions, position is determined by the actual betting order on the current street.

- **C-Bet (Continuation Bet)**
  - **Opportunity**: Player was the preflop aggressor and has the first opportunity to bet on the flop (no bet yet on this street). This maneuver occurs only on the flop.
  - **Aggressor**: The preflop aggressor.
  - **Compute IP Against**: N/A (table-target).
  - **Aggressor IP Rule**: IP ⇔ `isLastToAct` among eligible players on this street (i.e., players who have not folded and are not all-in).

- **Delayed C-Bet**
  - **Opportunity**: The preflop aggressor checked on the previous street, and the action checks to them again on the current street (no bet yet on this street). This maneuver occurs on the turn.
  - **Aggressor**: PFA who checked back the previous street.
  - **Compute IP Against**: N/A (table-target).
  - **Aggressor IP Rule**: IP ⇔ `isLastToAct` among eligible players on this street (i.e., players who have not folded and are not all-in).

- **Double/Triple Barrel**
  - **Opportunity**: Player was the aggressor on the previous street and bets again (no bet yet on this street). A double barrel is a turn bet after a flop c-bet; a triple barrel is a river bet after betting the flop and turn. To qualify, the player must have been the last aggressor on the previous street; if their prior bet was raised and they only called, they lose aggressor status.
  - **Aggressor**: Current bettor.
  - **Compute IP Against**: N/A (table-target).
  - **Aggressor IP Rule**: IP ⇔ isLastToAct among eligible players on this street (i.e., players who have not folded and are not all-in).

- **Donk Bet**
  - **Opportunity**: A player who was not the previous street's aggressor makes a bet out of position before the aggressor has a chance to act.
  - **Aggressor**: OOP player leading into PFA.
  - **Compute IP Against**: Prior-street aggressor.
  - **Aggressor IP Rule**: **Always OOP** by definition. If a generic IP calculation would place the actor in position, this move should not be classified as a Donk Bet.

- **Probe Bet**
  - **Opportunity**: The previous street's aggressor checks, and an out-of-position player makes a bet.
  - **Aggressor**: OOP player betting after PFA checked back.
  - **Compute IP Against**: The PFA who checked (prior-street aggressor).
  - **Aggressor IP Rule**: **Always OOP** by definition. If a generic IP calculation would place the actor in position, this move should not be classified as a Probe Bet.

- **Check-Raise**
  - **Opportunity**: A player checks and then raises after another player bets on the same street.
  - **Aggressor**: Check-raiser.
  - **Compute IP Against**: The bettor being raised (first aggressor this street).
  - **Aggressor IP Rule**: **Always OOP** by definition. If a generic IP calculation would place the actor in position, this move should not be classified as a Check-Raise.
  - **Note on Multiway Pots**: This is an intentional simplification. In a multiway pot, a player could technically be IP against a bettor but still be check-raising from our perspective. We categorize all check-raises as OOP for consistency.

- **Raise vs C-Bet**
  - **Opportunity**: A player raises the continuation bet of the preflop aggressor.
  - **Aggressor**: Raiser.
  - **Compute IP Against**: The c-bettor (first aggressor this street).
  - **Aggressor IP Rule**: Pairwise: IP ⇔ `pos[raiser] > pos[cbettor]` (can be IP or OOP).

- **Raise vs Donk/Probe/Bet**
  - **Opportunity**: A player raises a standard bet, donk bet, or probe bet.
  - **Aggressor**: Raiser.
  - **Compute IP Against**: The original bettor (first aggressor this street).
  - **Aggressor IP Rule**: Pairwise: IP ⇔ `pos[raiser] > pos[bettor]`.

- **Float (The Call)**
  - **Opportunity**: A player is in position postflop and faces a bet from the aggressor of the previous street (e.g., a c-bet or a barrel).
  - **Action**: Calling a bet (usually a flop c-bet) in position with a speculative hand.
  - **Plan**: To bluff on a later street if the aggressor shows weakness.
  - **Key Point**: The "float" is the call itself. For stats purposes, this is tracked with `floatOpportunities` and `floatAttempts`.

- **Float Bet (The Delayed Bluff)**
  - **Opportunity**: An in-position player who called on the previous street ("floated") sees the aggressor check on the current street (turn or river).
  - **Action**: The floater now bets, taking advantage of the perceived weakness.
  - **Aggressor**: The player who called on the prior street.
  - **Compute IP Against**: The prior-street aggressor who checked.
  - **Aggressor IP Rule**: **Always IP** by definition. If the actor is OOP, this action is classified as a Probe Bet, not a Float Bet.

- **Open Shove**
  - **Opportunity**: Action is checked to the player, and they move all-in.
  - **Aggressor**: First all-in bettor on the street.
  - **Compute IP Against**: N/A (table-target).
  - **Aggressor IP Rule**: IP ⇔ `isLastToAct` among eligible players on this street (i.e., players who have not folded and are not all-in). For simplicity, any player not last to act is considered OOP, including players in "sandwiched" positions in multiway pots.

### Shove Taxonomy

An all-in action is classified and logged based on the context in which it occurs:

- **Open Shove:** A player's first aggressive action on a street is an all-in. Log these actions using the `open_shove` stats (e.g., `open_shove_ip_attempts`).
- **Re-raising Shove (e.g., 3-Bet Shove, 4-Bet Shove):** A player's re-raise is an all-in. This action should be logged under **both** the specific maneuver and the generic shove categories. For example, a 4-bet shove would increment both `four_bet_ip_attempts` and `shove_ip_attempts`. The positional logic must follow the more specific maneuver (the 4-bet rule), not the generic shove rule.
