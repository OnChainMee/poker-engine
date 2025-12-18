import { Street } from '../types';

/**
 * Each Stats record represents stats for a single street in a hand.
 * For example, one record might capture all actions on the preflop or on the flop.
 * These values are recorded per street and must be aggregated to get overall metrics.
 */
export interface StreetStat {
  // Meta information about the game/street
  /** Unique identifier for each hand */
  hand: number;
  /** Unique identifier for the venue */
  venue: string;
  /** Unique identifier for the table */
  table: string;
  /** Identifier for the player */
  player: string;
  /** Current street (e.g., 'preflop', 'flop', 'turn', 'river') */
  street: Street;
  /** Total time spent by the player on decisions on the street*/
  decisionDuration: number;

  createdAt: number;
  startedAt: number;

  /** Number of aggressions on this street */
  aggressions: number;
  /** Count of calls or checks made on this street */
  passivities: number;
  /** Decisions made on this street */
  decisions: number;

  // Basic actions
  /** Count of bets made on this street */
  bets: number;
  /** Count of raises made on this street */
  raises: number;
  /** Count of calls made on this street */
  calls: number;
  /** Count of checks made on this street */
  checks: number;
  /** Player folded on this street */
  folds: number;

  /** 1 if the player went all-in on this street, else 0 */
  allIns: number;
  /** 1 if the player voluntarily put money in the pot (beyond forced bets), else 0 */
  voluntaryPutMoneyInPotTimes: number;

  /** 1 if the player made the first aggression on this street, else 0 */
  firstAggressions: number;
  /** 1 if the player made the last aggression on this street, else 0 */
  lastAggressions: number;

  /** Number of times the player limped (called without raising) on this street */
  limps: number;
  /** Number of opportunities for a limp */
  limpOpportunities: number;

  /**
   * ### Preflop Raise (PFR)
   * An open-raise before the flop.
   */
  preflopRaiseOpportunities: number;
  preflopRaises: number;

  // --------------------------------------------------------------------------
  // --- Positional Maneuver Stats                                          ---
  // --------------------------------------------------------------------------
  // The following sections group all stats related to a specific poker maneuver.

  /**
   * ### Three-Bet (3-Bet) Stats
   * A 3-bet is the first re-raise before the flop.
   */
  /**
   * **IP vs. OOP Strategy (Aggressor):**
   * - **IP:** Can 3-bet a wider, merged range to leverage postflop advantage.
   * - **OOP:** Must 3-bet a more polarized range (premiums & bluffs) to compensate for postflop disadvantage.
   */
  threeBetIpOpportunities: number;
  threeBetOopOpportunities: number;
  threeBetIpAttempts: number;
  threeBetOopAttempts: number;
  threeBetIpTakedowns: number;
  threeBetOopTakedowns: number;
  /**
   * **IP vs. OOP Strategy (Defender):**
   * - **IP:** Can defend (call or 4-bet) wider against a 3-bet due to postflop positional advantage.
   * - **OOP:** Must defend with a tighter, stronger range, often preferring to 4-bet or fold rather than call.
   */
  threeBetIpChallenges: number;
  threeBetOopChallenges: number;
  threeBetIpContinues: number;
  threeBetOopContinues: number;
  threeBetIpFolds: number;
  threeBetOopFolds: number;

  /**
   * ### Squeeze Stats
   * A 3-bet made after an initial raise and one or more calls.
   */
  /**
   * **IP vs. OOP Strategy (Aggressor):**
   * - **IP:** Powerful squeeze with a wider range due to extra "dead money" in the pot.
   * - **OOP:** High-risk, polarized play to take the pot down immediately.
   */
  squeezeIpOpportunities: number;
  squeezeOopOpportunities: number;
  squeezeIpAttempts: number;
  squeezeOopAttempts: number;
  squeezeIpTakedowns: number;
  squeezeOopTakedowns: number;
  /**
   * **IP vs. OOP Strategy (Defender):**
   * - As Original Raiser:** Defends tighter than vs. a standard 3-bet due to the multi-way threat.
   * - **As Caller:** Very tight defense range, as their hand was not strong enough to 3-bet initially.
   */
  squeezeIpChallenges: number;
  squeezeOopChallenges: number;
  squeezeIpContinues: number;
  squeezeOopContinues: number;
  squeezeIpFolds: number;
  squeezeOopFolds: number;

  /**
   * ### Four-Bet (4-Bet) Stats
   * A re-raise against a 3-bet preflop.
   */
  /**
   * **IP vs. OOP Strategy (Aggressor):**
   * - **IP:** Can 4-bet slightly wider (including bluffs) to pressure the OOP 3-bettor.
   * - **OOP:** Typically represents the very top of a player's range; rarely a bluff.
   */
  fourBetIpOpportunities: number;
  fourBetOopOpportunities: number;
  fourBetIpAttempts: number;
  fourBetOopAttempts: number;
  fourBetIpTakedowns: number;
  fourBetOopTakedowns: number;
  /**
   * **IP vs. OOP Strategy (Defender):**
   * - A player facing a 4-bet is almost always continuing with an all-in (5-bet shove) or folding, regardless of position. Range is paramount.
   */
  fourBetIpChallenges: number;
  fourBetOopChallenges: number;
  fourBetIpContinues: number;
  fourBetOopContinues: number;
  fourBetIpFolds: number;
  fourBetOopFolds: number;

  /**
   * ### Five-Bet (5-Bet) Stats
   * A re-raise against a 4-bet preflop. This is typically an all-in move.
   */
  /**
   * **IP vs. OOP Strategy (Aggressor):**
   * - A 5-bet almost exclusively represents the absolute strongest premium hands (e.g., AA, KK). Position is less critical than hand strength at this point.
   */
  fiveBetIpOpportunities: number;
  fiveBetOopOpportunities: number;
  fiveBetIpAttempts: number;
  fiveBetOopAttempts: number;
  fiveBetIpTakedowns: number;
  fiveBetOopTakedowns: number;
  /**
   * **IP vs. OOP Strategy (Defender):**
   * - Facing a 5-bet requires an extremely strong hand to continue. The decision is based on pot odds against the opponent's perceived premium range.
   */
  fiveBetIpChallenges: number;
  fiveBetOopChallenges: number;
  fiveBetIpContinues: number;
  fiveBetOopContinues: number;
  fiveBetIpFolds: number;
  fiveBetOopFolds: number;

  /**
   * ### Continuation-Bet (C-Bet) Stats
   * A bet on the flop by the preflop aggressor.
   */
  /**
   * **IP vs. OOP Strategy (Aggressor):**
   * - **IP:** High frequency with smaller sizing, leveraging positional advantage.
   * - **OOP:** More selective, often with larger sizing and a more polarized range.
   */
  cbetIpOpportunities: number;
  cbetOopOpportunities: number;
  cbetIpAttempts: number;
  cbetOopAttempts: number;
  cbetIpTakedowns: number;
  cbetOopTakedowns: number;
  /**
   * **IP vs. OOP Strategy (Defender):**
   * - **IP:** Can "float" (call) with a wider range of hands, intending to bluff on later streets.
   * - **OOP:** Must play more straightforwardly, often preferring to check-raise or fold.
   */
  cbetIpChallenges: number;
  cbetOopChallenges: number;
  cbetIpContinues: number;
  cbetOopContinues: number;
  cbetIpFolds: number;
  cbetOopFolds: number;

  /**
   * ### Delayed Continuation-Bet Stats
   * A bet on the turn or river by the preflop aggressor after they checked the previous street.
   */
  /**
   * **IP vs. OOP Strategy (Aggressor):**
   * - **IP:** Often a pot-control bet with a medium-strength hand or a bluff on a scare card.
   * - **OOP:** Less common; typically indicates a polarized range (a slow-played monster or a bluff).
   */
  delayedCbetIpOpportunities: number;
  delayedCbetOopOpportunities: number;
  delayedCbetIpAttempts: number;
  delayedCbetOopAttempts: number;
  delayedCbetIpTakedowns: number;
  delayedCbetOopTakedowns: number;
  /**
   * **IP vs. OOP Strategy (Defender):**
   * - Facing a delayed c-bet often means the aggressor has a capped or polarized range, allowing the defender to call wider or look for bluff-raise spots.
   */
  delayedCbetIpChallenges: number;
  delayedCbetOopChallenges: number;
  delayedCbetIpContinues: number;
  delayedCbetOopContinues: number;
  delayedCbetIpFolds: number;
  delayedCbetOopFolds: number;

  /**
   * ### Double & Triple Barrel Stats
   * Continuing to bet on the turn (double) and river (triple) as the street-by-street aggressor.
   */
  /**
   * **IP vs. OOP Strategy (Aggressor):**
   * - **IP:** Higher frequency, can use smaller sizing, and can barrel with thinner value and more bluffs.
   * - **OOP:** Lower frequency, larger sizing required, and range becomes extremely polarized by the river.
   */
  doubleBarrelIpOpportunities: number;
  doubleBarrelOopOpportunities: number;
  doubleBarrelIpAttempts: number;
  doubleBarrelOopAttempts: number;
  doubleBarrelIpTakedowns: number;
  doubleBarrelOopTakedowns: number;
  tripleBarrelIpOpportunities: number;
  tripleBarrelOopOpportunities: number;
  tripleBarrelIpAttempts: number;
  tripleBarrelOopAttempts: number;
  tripleBarrelIpTakedowns: number;
  tripleBarrelOopTakedowns: number;
  /**
   * **IP vs. OOP Strategy (Defender):**
   * - Facing multiple barrels requires a strong hand or a specific plan to bluff-catch, as the aggressor's range is very strong or polarized.
   */
  doubleBarrelIpChallenges: number;
  doubleBarrelOopChallenges: number;
  doubleBarrelIpContinues: number;
  doubleBarrelOopContinues: number;
  doubleBarrelIpFolds: number;
  doubleBarrelOopFolds: number;
  tripleBarrelIpChallenges: number;
  tripleBarrelOopChallenges: number;
  tripleBarrelIpContinues: number;
  tripleBarrelOopContinues: number;
  tripleBarrelIpFolds: number;
  tripleBarrelOopFolds: number;

  /**
   * ### Probe Bet Stats
   * An OOP bet on the turn or river after the preflop aggressor checked back.
   * - **Aggressor:** Always OOP.
   * - **Defender:** Always IP.
   */
  probeBetOpportunities: number;
  probeBetAttempts: number;
  probeBetTakedowns: number;
  probeBetChallenges: number;
  probeBetContinues: number;
  probeBetFolds: number;

  /**
   * ### Float Bet Stats
   * An IP bet after the previous street's aggressor checks.
   * - **Aggressor:** Always IP.
   * - **Defender:** Always OOP.
   */
  floatBetOpportunities: number;
  floatBetAttempts: number;
  floatBetTakedowns: number;
  floatBetChallenges: number;
  floatBetContinues: number;
  floatBetFolds: number;

  // Float
  floatOpportunities: number;
  floatAttempts: number;

  /**
   * ### Steal Attempt Stats
   * An open-raise from a late position (CO, BTN, or SB).
   */
  /**
   * **IP vs. OOP Strategy (Aggressor):**
   * - **IP (CO/BTN):** Very high-frequency action with a wide range of hands.
   * - **OOP (SB):** More polarized action, as the SB is OOP postflop if called.
   */
  stealIpOpportunities: number;
  stealOopOpportunities: number;
  stealIpAttempts: number;
  stealOopAttempts: number;
  stealIpTakedowns: number;
  stealOopTakedowns: number;
  /**
   * **IP vs. OOP Strategy (Defender):**
   * - As the BB, the defender is always IP against a steal attempt from the SB, and always OOP against the CO/BTN, heavily influencing their 3-betting and calling range.
   */
  stealIpChallenges: number;
  stealOopChallenges: number;
  stealIpContinues: number;
  stealOopContinues: number;
  stealIpFolds: number;
  stealOopFolds: number;

  /**
   * ### Donk Bet Stats
   * An OOP bet by a player who was not the aggressor on the previous street.
   * - **Aggressor:** Always OOP.
   * - **Defender:** Always IP.
   */
  donkBetOpportunities: number;
  donkBetAttempts: number;
  donkBetTakedowns: number;
  donkBetChallenges: number;
  donkBetContinues: number;
  donkBetFolds: number;

  /**
   * ### Check-Raise Stats
   * A check followed by a raise on the same street.
   * - **Aggressor:** A powerful, exclusively OOP maneuver.
   * - **Defender:** Always IP.
   */
  checkRaiseOpportunities: number;
  checkRaiseAttempts: number;
  checkRaiseTakedowns: number;
  checkRaiseChallenges: number;
  checkRaiseContinues: number;
  checkRaiseFolds: number;

  /**
   * ### Shove Stats
   * Committing all remaining chips. Context (Open Shove vs. Re-raise Shove) is key.
   */
  /**
   * **IP vs. OOP Strategy (Aggressor):**
   * - **Open Shove:** Often a polarized range (premiums or bluffs).
   * - **Re-raise Shove:** Typically a value-heavy range, narrowing with each successive re-raise.
   */
  openShoveIpOpportunities: number;
  openShoveOopOpportunities: number;
  openShoveIpAttempts: number;
  openShoveOopAttempts: number;
  openShoveIpTakedowns: number;
  openShoveOopTakedowns: number;
  shoveIpOpportunities: number;
  shoveOopOpportunities: number;
  shoveIpAttempts: number;
  shoveOopAttempts: number;
  shoveIpTakedowns: number;
  shoveOopTakedowns: number;
  /**
   * **IP vs. OOP Strategy (Defender):**
   * - Facing an all-in is a purely mathematical decision based on pot odds and equity. Position matters less than the exact ranges and stack sizes.
   */
  openShoveIpChallenges: number;
  openShoveOopChallenges: number;
  openShoveIpContinues: number;
  openShoveOopContinues: number;
  openShoveIpFolds: number;
  openShoveOopFolds: number;
  shoveIpChallenges: number;
  shoveOopChallenges: number;
  shoveIpContinues: number;
  shoveOopContinues: number;
  shoveIpFolds: number;
  shoveOopFolds: number;

  // Stats filled retroactively for simpler aggregation
  /** Whether the player won subsequently */
  success: number;

  // Positional flags (used for simple counting, not metric derivation)
  /** Count of aggressive actions made in position on this street */
  aggressionsInPosition: number;
  /** Count of defensive challenges faced in position on this street */
  challengesInPosition: number;

  // Finance information computed at the end of the game
  /** Whether the player went to showdown */
  wentToShowdown: number;
  /** Whether the player won money at showdown (success) */
  wonAtShowdown: number;
  /** Whether the player won money at showdown (success) */
  wonWithoutShowdown: number;

  /** Final pot size for the hand */
  pot: number;
  /** 1 if the player saw the flop, recorded on the flop street */
  sawFlop: number;
  /** True if this is the last stat entry for this player in this hand */
  isFinalAction: number;

  /** Chip stack at the start of the hand */
  stackBefore: number;
  /** Chip stack at the end of the hand */
  stackAfter: number;
  /** Big blind value used for normalizing profit (for bb100 calculations) */
  bigBlind: number;

  /** Times the player won */
  won: number;
  /** Times the player lost */
  lost: number;

  /** Currency of the game */
  currency: string;
  /** Rate of the currency at the time of the game */
  currencyRate: number;

  /** Amount invested on this street */
  investments: number;
  /** Amount of uncalled bets returned to the player */
  returns: number;
  /** Amount of earned money with investment subtracted */
  profits: number;
  /** Amount of earned money with investment subtracted */
  balance: number;
  /** Amount won on this street (positive only) */
  winnings: number;
  /** Amount lost on this street (positive only) */
  losses: number;
  /** Amount taken by the house from the pot */
  rake: number;
}

/**
 * The PokerMetrics interface defines aggregated metrics computed over multiple hands.
 * Each metric includes its calculation, an explanation of its usefulness (importance),
 * and notes on how certain the metric is (certainty), based on the data quality.
 */
export interface PokerMetrics extends StreetStat {
  gameIds: Set<string>;
  distinctGameCount: number;

  limpFrequency: number;

  aggressionFactor: number;
  aggressionFrequency: number;

  vpipFrequency: number;
  allInFrequency: number;

  // --- Maneuver-Specific Metrics ---

  // Preflop Raise (PFR)
  preflopRaiseOpportunities: number;
  preflopRaises: number;
  preflopRaiseFrequency: number;

  // 3-Bet
  threeBetOpportunities: number;
  threeBetAttempts: number;
  threeBetChallenges: number;
  threeBetContinues: number;
  threeBetFolds: number;
  threeBetTakedowns: number;
  threeBetFrequency: number;
  threeBetIpFrequency: number;
  threeBetOopFrequency: number;
  threeBetFoldFrequency: number;
  threeBetIpFoldFrequency: number;
  threeBetOopFoldFrequency: number;
  threeBetContinueFrequency: number;
  threeBetIpContinueFrequency: number;
  threeBetOopContinueFrequency: number;
  threeBetTakedownFrequency: number;
  threeBetIpTakedownFrequency: number;
  threeBetOopTakedownFrequency: number;

  // Squeeze
  squeezeOpportunities: number;
  squeezeAttempts: number;
  squeezeChallenges: number;
  squeezeContinues: number;
  squeezeFolds: number;
  squeezeTakedowns: number;
  squeezeFrequency: number;
  squeezeIpFrequency: number;
  squeezeOopFrequency: number;
  squeezeFoldFrequency: number;
  squeezeIpFoldFrequency: number;
  squeezeOopFoldFrequency: number;
  squeezeContinueFrequency: number;
  squeezeIpContinueFrequency: number;
  squeezeOopContinueFrequency: number;
  squeezeTakedownFrequency: number;
  squeezeIpTakedownFrequency: number;
  squeezeOopTakedownFrequency: number;

  // 4-Bet
  fourBetOpportunities: number;
  fourBetAttempts: number;
  fourBetChallenges: number;
  fourBetContinues: number;
  fourBetFolds: number;
  fourBetTakedowns: number;
  fourBetFrequency: number;
  fourBetIpFrequency: number;
  fourBetOopFrequency: number;
  fourBetFoldFrequency: number;
  fourBetIpFoldFrequency: number;
  fourBetOopFoldFrequency: number;
  fourBetContinueFrequency: number;
  fourBetIpContinueFrequency: number;
  fourBetOopContinueFrequency: number;
  fourBetTakedownFrequency: number;
  fourBetIpTakedownFrequency: number;
  fourBetOopTakedownFrequency: number;

  // 5-Bet
  fiveBetOpportunities: number;
  fiveBetAttempts: number;
  fiveBetChallenges: number;
  fiveBetContinues: number;
  fiveBetFolds: number;
  fiveBetTakedowns: number;
  fiveBetFrequency: number;
  fiveBetIpFrequency: number;
  fiveBetOopFrequency: number;
  fiveBetFoldFrequency: number;
  fiveBetIpFoldFrequency: number;
  fiveBetOopFoldFrequency: number;
  fiveBetContinueFrequency: number;
  fiveBetIpContinueFrequency: number;
  fiveBetOopContinueFrequency: number;
  fiveBetTakedownFrequency: number;
  fiveBetIpTakedownFrequency: number;
  fiveBetOopTakedownFrequency: number;

  // C-Bet
  cbetOpportunities: number;
  cbetAttempts: number;
  cbetChallenges: number;
  cbetContinues: number;
  cbetFolds: number;
  cbetTakedowns: number;
  cbetFrequency: number;
  cbetIpFrequency: number;
  cbetOopFrequency: number;
  cbetFoldFrequency: number;
  cbetIpFoldFrequency: number;
  cbetOopFoldFrequency: number;
  cbetContinueFrequency: number;
  cbetIpContinueFrequency: number;
  cbetOopContinueFrequency: number;
  cbetTakedownFrequency: number;
  cbetIpTakedownFrequency: number;
  cbetOopTakedownFrequency: number;

  // Delayed C-Bet
  delayedCbetOpportunities: number;
  delayedCbetAttempts: number;
  delayedCbetChallenges: number;
  delayedCbetContinues: number;
  delayedCbetFolds: number;
  delayedCbetTakedowns: number;
  delayedCbetFrequency: number;
  delayedCbetIpFrequency: number;
  delayedCbetOopFrequency: number;
  delayedCbetFoldFrequency: number;
  delayedCbetIpFoldFrequency: number;
  delayedCbetOopFoldFrequency: number;
  delayedCbetContinueFrequency: number;
  delayedCbetIpContinueFrequency: number;
  delayedCbetOopContinueFrequency: number;
  delayedCbetTakedownFrequency: number;
  delayedCbetIpTakedownFrequency: number;
  delayedCbetOopTakedownFrequency: number;

  // Double Barrel
  doubleBarrelOpportunities: number;
  doubleBarrelAttempts: number;
  doubleBarrelChallenges: number;
  doubleBarrelContinues: number;
  doubleBarrelFolds: number;
  doubleBarrelTakedowns: number;
  doubleBarrelFrequency: number;
  doubleBarrelIpFrequency: number;
  doubleBarrelOopFrequency: number;
  doubleBarrelFoldFrequency: number;
  doubleBarrelIpFoldFrequency: number;
  doubleBarrelOopFoldFrequency: number;
  doubleBarrelContinueFrequency: number;
  doubleBarrelIpContinueFrequency: number;
  doubleBarrelOopContinueFrequency: number;
  doubleBarrelTakedownFrequency: number;
  doubleBarrelIpTakedownFrequency: number;
  doubleBarrelOopTakedownFrequency: number;

  // Triple Barrel
  tripleBarrelOpportunities: number;
  tripleBarrelAttempts: number;
  tripleBarrelChallenges: number;
  tripleBarrelContinues: number;
  tripleBarrelFolds: number;
  tripleBarrelTakedowns: number;
  tripleBarrelFrequency: number;
  tripleBarrelIpFrequency: number;
  tripleBarrelOopFrequency: number;
  tripleBarrelFoldFrequency: number;
  tripleBarrelIpFoldFrequency: number;
  tripleBarrelOopFoldFrequency: number;
  tripleBarrelContinueFrequency: number;
  tripleBarrelIpContinueFrequency: number;
  tripleBarrelOopContinueFrequency: number;
  tripleBarrelTakedownFrequency: number;
  tripleBarrelIpTakedownFrequency: number;
  tripleBarrelOopTakedownFrequency: number;

  // Probe Bet
  probeBetOpportunities: number;
  probeBetAttempts: number;
  probeBetChallenges: number;
  probeBetContinues: number;
  probeBetFolds: number;
  probeBetTakedowns: number;
  probeBetFrequency: number;
  probeBetFoldFrequency: number;
  probeBetContinueFrequency: number;
  probeBetTakedownFrequency: number;

  // Float Bet
  floatBetOpportunities: number;
  floatBetAttempts: number;
  floatBetChallenges: number;
  floatBetContinues: number;
  floatBetFolds: number;
  floatBetTakedowns: number;
  floatBetFrequency: number;
  floatBetFoldFrequency: number;
  floatBetContinueFrequency: number;
  floatBetTakedownFrequency: number;

  // Steal
  stealOpportunities: number;
  stealAttempts: number;
  stealChallenges: number;
  stealContinues: number;
  stealFolds: number;
  stealTakedowns: number;
  stealFrequency: number;
  stealIpFrequency: number;
  stealOopFrequency: number;
  stealFoldFrequency: number;
  stealIpFoldFrequency: number;
  stealOopFoldFrequency: number;
  stealContinueFrequency: number;
  stealIpContinueFrequency: number;
  stealOopContinueFrequency: number;
  stealTakedownFrequency: number;
  stealIpTakedownFrequency: number;
  stealOopTakedownFrequency: number;

  // Donk Bet
  donkBetOpportunities: number;
  donkBetAttempts: number;
  donkBetChallenges: number;
  donkBetContinues: number;
  donkBetFolds: number;
  donkBetTakedowns: number;
  donkBetFrequency: number;
  donkBetFoldFrequency: number;
  donkBetContinueFrequency: number;
  donkBetTakedownFrequency: number;

  // Check-Raise
  checkRaiseOpportunities: number;
  checkRaiseAttempts: number;
  checkRaiseChallenges: number;
  checkRaiseContinues: number;
  checkRaiseFolds: number;
  checkRaiseTakedowns: number;
  checkRaiseFrequency: number;
  checkRaiseFoldFrequency: number;
  checkRaiseContinueFrequency: number;
  checkRaiseTakedownFrequency: number;

  // Open Shove
  openShoveOpportunities: number;
  openShoveAttempts: number;
  openShoveChallenges: number;
  openShoveContinues: number;
  openShoveFolds: number;
  openShoveTakedowns: number;
  openShoveFrequency: number;
  openShoveIpFrequency: number;
  openShoveOopFrequency: number;
  openShoveFoldFrequency: number;
  openShoveIpFoldFrequency: number;
  openShoveOopFoldFrequency: number;
  openShoveContinueFrequency: number;
  openShoveIpContinueFrequency: number;
  openShoveOopContinueFrequency: number;
  openShoveTakedownFrequency: number;
  openShoveIpTakedownFrequency: number;
  openShoveOopTakedownFrequency: number;

  // Shove
  shoveOpportunities: number;
  shoveAttempts: number;
  shoveChallenges: number;
  shoveContinues: number;
  shoveFolds: number;
  shoveTakedowns: number;
  shoveFrequency: number;
  shoveIpFrequency: number;
  shoveOopFrequency: number;
  shoveFoldFrequency: number;
  shoveIpFoldFrequency: number;
  shoveOopFoldFrequency: number;
  shoveContinueFrequency: number;
  shoveIpContinueFrequency: number;
  shoveOopContinueFrequency: number;
  shoveTakedownFrequency: number;
  shoveIpTakedownFrequency: number;
  shoveOopTakedownFrequency: number;

  // --- General Metrics ---

  wentToShowdownFrequency: number;
  wonAtShowdownFrequency: number;
  wonWithoutShowdownFrequency: number;

  decisionDurationAverage: number;
  decisionDuration: number;

  winningsAverage: number;
  investmentsAverage: number;
  profitAverage: number;
  lossesAverage: number;
  potAverage: number;
  sawFlopFrequency: number;
  startedAt: number;

  bb100: number;
  profitFactor: number;
  returnOnInvestmentFactor: number;
  stackToPotFactor: number;
}
