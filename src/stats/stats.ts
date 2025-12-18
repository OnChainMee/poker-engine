import { Game } from '../Game';
import {
  getActionAmount,
  getActionPlayerIndex,
  getActionTimestamp,
  getActionType,
  isLastToAct,
  isPlayerInPosition,
} from '../game/position';
import { isPlayerAction } from '../game/progress';
import { Player, Streets, type Action, type Street } from '../types';
import type { StreetStat } from './types';

/**
 * Determines if a raise qualifies as a steal attempt based on size.
 * A steal must be at least 2.5 times the big blind.
 *
 * @param table - The current table state.
 * @param amount - The amount of the raise.
 * @returns boolean indicating if the raise is a steal attempt.
 */
function isStealAttempt(table: Game, amount: number): boolean {
  return amount >= table.bigBlind * 2.5 && amount <= table.bigBlind * 4;
}

/**
 * Determines if a player is in a "steal" position (Button, Cutoff, or Small Blind).
 * This is used to identify opportunities for preflop steal raises.
 *
 * @param table - Current table state.
 * @param playerId - ID or index of the player being evaluated.
 * @returns boolean indicating if the player is in a steal position.
 */
function isLatePosition(table: Game, playerId: string | number): boolean {
  const player = getTablePlayerByName(table, playerId);
  const numPlayers = table.players.length;
  const buttonIndex = table.buttonIndex;

  const isButton = player.position === buttonIndex % numPlayers;
  const isSmallBlind = player.position === table.smallBlindIndex % numPlayers;

  // The Cutoff position only exists in games with 4 or more players.
  // In 3-handed game, the position to the right of the button is the Big Blind.
  const isCutoff =
    numPlayers >= 4 && player.position === (buttonIndex - 1 + numPlayers) % numPlayers;

  return isButton || isCutoff || isSmallBlind;
}

/**
 * Updates opportunity-based statistics for a player
 * This is called every time we get or create stats to ensure opportunities are current
 */
function updateOpportunityStats(
  table: Game,
  playerId: number | string,
  statEntry: StreetStat
): void {
  playerId = Game.getPlayerName(table, playerId);
  const playerIndex = Game.getPlayerIndex(table, playerId);
  const currentPlayer = getTablePlayerByName(table, playerId);

  const streetStats = table.stats.filter(s => s.street === table.street);
  const streetAggressions = streetStats.filter(s => s.aggressions > 0);
  const firstAggressorStat = streetStats.find(s => s.firstAggressions > 0);
  const threeBettorStat = streetStats.find(
    s => s.threeBetIpAttempts > 0 || s.threeBetOopAttempts > 0
  );
  const fourBettorStat = streetStats.find(s => s.fourBetIpAttempts > 0 || s.fourBetOopAttempts > 0);
  const fiveBettorStat = streetStats.find(s => s.fiveBetIpAttempts > 0 || s.fiveBetOopAttempts > 0);
  const cBettorStat = streetStats.find(s => s.cbetIpAttempts > 0 || s.cbetOopAttempts > 0);
  const delayedCBettorStat = streetStats.find(
    s => s.delayedCbetIpAttempts > 0 || s.delayedCbetOopAttempts > 0
  );

  // --- AGGRESSOR OPPORTUNITIES ---

  // A player can limp (call the big blind) if they are first to enter the pot preflop without raising.
  if (
    // We are on the preflop street
    table.street === 'preflop' &&
    // No player has made an aggressive action yet
    !firstAggressorStat
  ) {
    statEntry.limpOpportunities = 1;
    statEntry.preflopRaiseOpportunities = 1;
  }

  // Preflop Aggression Opportunities
  if (table.street === 'preflop') {
    const raises = streetAggressions.length;
    // A player can 3-bet if there has been exactly one raise before their turn to act.
    if (
      // There has been exactly one raise on this street
      raises === 1 &&
      // No player has 3-bet yet
      !threeBettorStat
    ) {
      if (firstAggressorStat) {
        const aggressorIndex = Game.getPlayerIndex(table, firstAggressorStat.player);
        if (isPlayerInPosition(table, playerIndex, aggressorIndex)) {
          statEntry.threeBetIpOpportunities = 1;
        } else {
          statEntry.threeBetOopOpportunities = 1;
        }
      }
      // A player can squeeze if there was a raise and at least one caller before their turn.
      const callers = streetStats.filter(s => s.calls > 0);
      if (
        // At least one player has called the initial raise
        callers.length > 0
      ) {
        if (firstAggressorStat) {
          const aggressorIndex = Game.getPlayerIndex(table, firstAggressorStat.player);
          if (isPlayerInPosition(table, playerIndex, aggressorIndex)) {
            statEntry.squeezeIpOpportunities = 1;
          } else {
            statEntry.squeezeOopOpportunities = 1;
          }
        }
      }
    }
    // A player can 4-bet if the last aggressive action was a 3-bet.
    else if (
      // A 3-bet has already occurred
      threeBettorStat &&
      // No 4-bet has occurred yet
      !fourBettorStat
    ) {
      const aggressorIndex = Game.getPlayerIndex(table, threeBettorStat.player);
      if (isPlayerInPosition(table, playerIndex, aggressorIndex)) {
        statEntry.fourBetIpOpportunities = 1;
      } else {
        statEntry.fourBetOopOpportunities = 1;
      }
    }
    // A player can 5-bet if the last aggressive action was a 4-bet.
    else if (
      // A 4-bet has already occurred
      fourBettorStat &&
      // No 5-bet has occurred yet
      !fiveBettorStat
    ) {
      const aggressorIndex = Game.getPlayerIndex(table, fourBettorStat.player);
      if (isPlayerInPosition(table, playerIndex, aggressorIndex)) {
        statEntry.fiveBetIpOpportunities = 1;
      } else {
        statEntry.fiveBetOopOpportunities = 1;
      }
    }
    // A player in a late position (CO, BTN, SB) can steal the blinds if the action folds to them.
    else if (
      // No player has made an aggressive action yet
      !firstAggressorStat &&
      // The current player is in a steal position (CO, BTN, or SB)
      isLatePosition(table, playerId)
    ) {
      const numPlayers = table.players.length;
      const buttonIndex = table.buttonIndex;

      const isButton = playerIndex === buttonIndex;
      const isSmallBlind = playerIndex === table.smallBlindIndex;
      const isCutoff =
        numPlayers >= 4 && playerIndex === (buttonIndex - 1 + numPlayers) % numPlayers;

      if (isButton || isCutoff) {
        statEntry.stealIpOpportunities = 1;
      } else if (isSmallBlind) {
        statEntry.stealOopOpportunities = 1;
      }
    }
  }

  const prevStreetName: Street | undefined = Streets[Streets.indexOf(table.street) - 1];
  const lastStreetStats = table.stats.filter(s => s.street === prevStreetName);
  const prevStreetLastAggressor = lastStreetStats.find(s => s.lastAggressions > 0);

  // Postflop Aggression Opportunities
  if (
    // We are on a postflop street
    table.street !== 'preflop' &&
    // The current player was the aggressor on the previous street
    prevStreetLastAggressor?.player === playerId
  ) {
    const noBetThisStreet = !firstAggressorStat;
    // The preflop aggressor can make a continuation bet (C-Bet) on the flop if no one has bet yet.
    if (
      // We are on the flop
      table.street === 'flop' &&
      // No bet has been made on this street yet
      noBetThisStreet
    ) {
      if (isLastToAct(table, playerIndex)) {
        statEntry.cbetIpOpportunities = 1;
      } else {
        statEntry.cbetOopOpportunities = 1;
      }
    }
    // An aggressor can double or triple barrel by continuing to bet on the turn or river.
    else if (
      // No bet has been made on this street yet
      noBetThisStreet
    ) {
      const doubleBarrel = table.street === 'turn';
      const tripleBarrel = table.street === 'river';

      if (isLastToAct(table, playerIndex)) {
        if (doubleBarrel) statEntry.doubleBarrelIpOpportunities = 1;
        if (tripleBarrel) statEntry.tripleBarrelIpOpportunities = 1;
      } else {
        if (doubleBarrel) statEntry.doubleBarrelOopOpportunities = 1;
        if (tripleBarrel) statEntry.tripleBarrelOopOpportunities = 1;
      }
    }
  }

  // The preflop aggressor can make a delayed C-Bet on the turn if they checked the flop and no one bet.
  const preflopAggressor = table.stats.find(s => s.street === 'preflop' && s.lastAggressions > 0);
  if (
    // We are on the turn
    table.street === 'turn' &&
    // The current player was the preflop aggressor
    preflopAggressor?.player === playerId &&
    // No bet has been made on the turn yet
    !firstAggressorStat
  ) {
    const noAggressionsLastStreet = lastStreetStats.every(s => s.aggressions == 0);
    if (
      // No aggressive actions occurred on the previous street (flop)
      noAggressionsLastStreet
    ) {
      if (isLastToAct(table, playerIndex)) {
        statEntry.delayedCbetIpOpportunities = 1;
      } else {
        statEntry.delayedCbetOopOpportunities = 1;
      }
    }
  }

  // General Postflop Opportunities
  if (table.street !== 'preflop') {
    // An OOP player can probe bet if the preflop aggressor checked back on the previous street.
    if (
      // We are on the turn or river
      (table.street === 'turn' || table.street === 'river') &&
      // There was a preflop aggressor
      preflopAggressor &&
      // The current player is not the preflop aggressor
      preflopAggressor.player !== playerId &&
      // No bet has been made on the current street yet
      !firstAggressorStat
    ) {
      const preflopAggressorLastStreetStat = lastStreetStats.find(
        s => s.player === preflopAggressor.player
      );

      if (
        // The preflop aggressor checked on the previous street
        (preflopAggressorLastStreetStat?.checks || 0) > 0
      ) {
        const aggressorIndex = Game.getPlayerIndex(table, preflopAggressor.player);
        if (!isPlayerInPosition(table, playerIndex, aggressorIndex)) {
          statEntry.probeBetOpportunities = 1;
        }
      }
    }

    // An IP player can float bet if the previous street's aggressor checks to them.
    if (
      // Opportunity is on the turn
      table.street === 'turn' &&
      // There was an aggressor on the previous street
      prevStreetLastAggressor &&
      // The current player is not that aggressor
      prevStreetLastAggressor.player !== playerId &&
      // The previous street's aggressor checked on the current street
      streetStats.some(s => s.player === prevStreetLastAggressor.player && s.checks > 0) &&
      // The current player called on the previous street
      lastStreetStats.some(s => s.player === playerId && s.calls > 0)
    ) {
      const aggressorIndex = Game.getPlayerIndex(table, prevStreetLastAggressor.player);
      if (isPlayerInPosition(table, playerIndex, aggressorIndex)) {
        statEntry.floatBetOpportunities = 1;
      }
    }

    // An OOP player can donk bet by betting into the previous street's aggressor before they have acted.
    if (
      // There was an aggressor on the previous street
      prevStreetLastAggressor &&
      // The current player is not that aggressor
      prevStreetLastAggressor.player !== playerId &&
      // The previous street's aggressor has not yet acted on the current street
      !streetStats.some(s => s.player === prevStreetLastAggressor.player && s.decisions > 0)
    ) {
      const aggressorIndex = Game.getPlayerIndex(table, prevStreetLastAggressor.player);
      if (!isPlayerInPosition(table, playerIndex, aggressorIndex)) {
        statEntry.donkBetOpportunities = 1;
      }
    }

    // A player can check-raise if they check and another player bets on the same street.
    if (
      // The current player has already checked on this street
      statEntry.checks > 0 &&
      // Another player has made a bet on this street
      firstAggressorStat
    ) {
      // Check-raises are always OOP by definition
      statEntry.checkRaiseOpportunities = 1;
    }
  }

  // A player can shove if they are not already all-in.
  if (
    // The player is not already all-in
    !currentPlayer.isAllIn
  ) {
    const isIp = isLastToAct(table, playerIndex);
    // A player can open shove if they are the first to make an aggressive action on the street.
    if (
      // No player has made an aggressive action on this street yet
      !firstAggressorStat
    ) {
      if (isIp) {
        statEntry.openShoveIpOpportunities = 1;
      } else {
        statEntry.openShoveOopOpportunities = 1;
      }
    }
    // A player faces a challenge when another player makes an aggressive action.
    if (isIp) {
      statEntry.shoveIpOpportunities = 1;
    } else {
      statEntry.shoveOopOpportunities = 1;
    }
  }

  // --- DEFENDER OPPORTUNITIES (CHALLENGES) ---

  const lastAggressor = streetStats.find(s => s.lastAggressions > 0);

  if (
    // There was a final aggressor on the current street
    lastAggressor &&
    // The current player is not that aggressor
    lastAggressor.player !== playerId
  ) {
    const aggressorIndex = Game.getPlayerIndex(table, lastAggressor.player);
    const isDefenderIp = isPlayerInPosition(table, playerIndex, aggressorIndex);

    // Player has an opportunity to float if they are in position against a c-bet or barrel.
    if (
      table.street !== 'preflop' &&
      isDefenderIp &&
      (cBettorStat?.player === lastAggressor.player ||
        (prevStreetLastAggressor?.player === lastAggressor.player &&
          (table.street === 'turn' || table.street === 'river')))
    ) {
      statEntry.floatOpportunities = 1;
    }

    const checkChallenge = (ipField: keyof StreetStat, oopField: keyof StreetStat) => {
      if (isDefenderIp) {
        (statEntry[ipField] as number) = 1;
        statEntry.challengesInPosition = 1;
      } else {
        (statEntry[oopField] as number) = 1;
      }
    };

    if (
      // Player is facing a 5-bet
      lastAggressor.fiveBetIpAttempts ||
      lastAggressor.fiveBetOopAttempts
    ) {
      checkChallenge('fiveBetIpChallenges', 'fiveBetOopChallenges');
    } else if (
      // Player is facing a 4-bet
      lastAggressor.fourBetIpAttempts ||
      lastAggressor.fourBetOopAttempts
    ) {
      checkChallenge('fourBetIpChallenges', 'fourBetOopChallenges');
    }
    if (
      // Player is facing a 3-bet
      lastAggressor.threeBetIpAttempts ||
      lastAggressor.threeBetOopAttempts
    ) {
      checkChallenge('threeBetIpChallenges', 'threeBetOopChallenges');
      if (
        // Player is facing a squeeze (a type of 3-bet)
        lastAggressor.squeezeIpAttempts ||
        lastAggressor.squeezeOopAttempts
      ) {
        checkChallenge('squeezeIpChallenges', 'squeezeOopChallenges');
      }
    } else if (
      // Player is facing a steal attempt
      lastAggressor.stealIpAttempts ||
      lastAggressor.stealOopAttempts
    ) {
      checkChallenge('stealIpChallenges', 'stealOopChallenges');
    } else if (
      // Player is facing a C-Bet
      cBettorStat
    ) {
      checkChallenge('cbetIpChallenges', 'cbetOopChallenges');
    } else if (
      // Player is facing a Delayed C-Bet
      delayedCBettorStat
    ) {
      checkChallenge('delayedCbetIpChallenges', 'delayedCbetOopChallenges');
    }
    if (
      // Player is facing a Double Barrel
      lastAggressor.doubleBarrelIpAttempts ||
      lastAggressor.doubleBarrelOopAttempts
    ) {
      checkChallenge('doubleBarrelIpChallenges', 'doubleBarrelOopChallenges');
    }
    if (
      // Player is facing a Triple Barrel
      lastAggressor.tripleBarrelIpAttempts ||
      lastAggressor.tripleBarrelOopAttempts
    ) {
      checkChallenge('tripleBarrelIpChallenges', 'tripleBarrelOopChallenges');
    }
    if (
      // Player is facing a Donk Bet
      lastAggressor.donkBetAttempts
    ) {
      statEntry.donkBetChallenges = 1;
    }
    if (
      // Player is facing a Probe Bet
      lastAggressor.probeBetAttempts
    ) {
      statEntry.probeBetChallenges = 1;
    }
    if (
      // Player is facing a Float Bet
      lastAggressor.floatBetAttempts
    ) {
      statEntry.floatBetChallenges = 1;
    }
    if (
      // Player is facing a Check-Raise
      lastAggressor.checkRaiseAttempts
    ) {
      statEntry.checkRaiseChallenges = 1;
    }
    if (
      // Player is facing an Open Shove
      lastAggressor.openShoveIpAttempts ||
      lastAggressor.openShoveOopAttempts
    ) {
      checkChallenge('openShoveIpChallenges', 'openShoveOopChallenges');
    }
    if (
      // Player is facing a generic shove
      lastAggressor.shoveIpAttempts ||
      lastAggressor.shoveOopAttempts
    ) {
      checkChallenge('shoveIpChallenges', 'shoveOopChallenges');
    }
  }
}

export const emptyStatValues: Omit<
  StreetStat,
  | 'gameId'
  | 'hand'
  | 'table'
  | 'player'
  | 'createdAt'
  | 'street'
  | 'venue'
  | 'startedAt'
  | 'isFinalAction'
> = {
  // Meta
  decisionDuration: 0,
  aggressions: 0,
  passivities: 0,
  decisions: 0,

  // Basic actions
  bets: 0,
  raises: 0,
  calls: 0,
  checks: 0,
  folds: 0,
  allIns: 0,
  voluntaryPutMoneyInPotTimes: 0,
  firstAggressions: 0,
  lastAggressions: 0,

  // Limp
  limps: 0,
  limpOpportunities: 0,

  // Preflop Raise (PFR)
  preflopRaiseOpportunities: 0,
  preflopRaises: 0,

  // 3-Bet
  threeBetIpOpportunities: 0,
  threeBetOopOpportunities: 0,
  threeBetIpAttempts: 0,
  threeBetOopAttempts: 0,
  threeBetIpTakedowns: 0,
  threeBetOopTakedowns: 0,
  threeBetIpChallenges: 0,
  threeBetOopChallenges: 0,
  threeBetIpContinues: 0,
  threeBetOopContinues: 0,
  threeBetIpFolds: 0,
  threeBetOopFolds: 0,

  // Squeeze
  squeezeIpOpportunities: 0,
  squeezeOopOpportunities: 0,
  squeezeIpAttempts: 0,
  squeezeOopAttempts: 0,
  squeezeIpTakedowns: 0,
  squeezeOopTakedowns: 0,
  squeezeIpChallenges: 0,
  squeezeOopChallenges: 0,
  squeezeIpContinues: 0,
  squeezeOopContinues: 0,
  squeezeIpFolds: 0,
  squeezeOopFolds: 0,

  // 4-Bet
  fourBetIpOpportunities: 0,
  fourBetOopOpportunities: 0,
  fourBetIpAttempts: 0,
  fourBetOopAttempts: 0,
  fourBetIpTakedowns: 0,
  fourBetOopTakedowns: 0,
  fourBetIpChallenges: 0,
  fourBetOopChallenges: 0,
  fourBetIpContinues: 0,
  fourBetOopContinues: 0,
  fourBetIpFolds: 0,
  fourBetOopFolds: 0,

  // 5-Bet
  fiveBetIpOpportunities: 0,
  fiveBetOopOpportunities: 0,
  fiveBetIpAttempts: 0,
  fiveBetOopAttempts: 0,
  fiveBetIpTakedowns: 0,
  fiveBetOopTakedowns: 0,
  fiveBetIpChallenges: 0,
  fiveBetOopChallenges: 0,
  fiveBetIpContinues: 0,
  fiveBetOopContinues: 0,
  fiveBetIpFolds: 0,
  fiveBetOopFolds: 0,

  // C-Bet
  cbetIpOpportunities: 0,
  cbetOopOpportunities: 0,
  cbetIpAttempts: 0,
  cbetOopAttempts: 0,
  cbetIpTakedowns: 0,
  cbetOopTakedowns: 0,
  cbetIpChallenges: 0,
  cbetOopChallenges: 0,
  cbetIpContinues: 0,
  cbetOopContinues: 0,
  cbetIpFolds: 0,
  cbetOopFolds: 0,

  // Delayed C-Bet
  delayedCbetIpOpportunities: 0,
  delayedCbetOopOpportunities: 0,
  delayedCbetIpAttempts: 0,
  delayedCbetOopAttempts: 0,
  delayedCbetIpTakedowns: 0,
  delayedCbetOopTakedowns: 0,
  delayedCbetIpChallenges: 0,
  delayedCbetOopChallenges: 0,
  delayedCbetIpContinues: 0,
  delayedCbetOopContinues: 0,
  delayedCbetIpFolds: 0,
  delayedCbetOopFolds: 0,

  // Double Barrel
  doubleBarrelIpOpportunities: 0,
  doubleBarrelOopOpportunities: 0,
  doubleBarrelIpAttempts: 0,
  doubleBarrelOopAttempts: 0,
  doubleBarrelIpTakedowns: 0,
  doubleBarrelOopTakedowns: 0,
  doubleBarrelIpChallenges: 0,
  doubleBarrelOopChallenges: 0,
  doubleBarrelIpContinues: 0,
  doubleBarrelOopContinues: 0,
  doubleBarrelIpFolds: 0,
  doubleBarrelOopFolds: 0,

  // Triple Barrel
  tripleBarrelIpOpportunities: 0,
  tripleBarrelOopOpportunities: 0,
  tripleBarrelIpAttempts: 0,
  tripleBarrelOopAttempts: 0,
  tripleBarrelIpTakedowns: 0,
  tripleBarrelOopTakedowns: 0,
  tripleBarrelIpChallenges: 0,
  tripleBarrelOopChallenges: 0,
  tripleBarrelIpContinues: 0,
  tripleBarrelOopContinues: 0,
  tripleBarrelIpFolds: 0,
  tripleBarrelOopFolds: 0,

  // Probe Bet
  probeBetOpportunities: 0,
  probeBetAttempts: 0,
  probeBetTakedowns: 0,
  probeBetChallenges: 0,
  probeBetContinues: 0,
  probeBetFolds: 0,

  // Float Bet
  floatBetOpportunities: 0,
  floatBetAttempts: 0,
  floatBetTakedowns: 0,
  floatBetChallenges: 0,
  floatBetContinues: 0,
  floatBetFolds: 0,

  // Float
  floatOpportunities: 0,
  floatAttempts: 0,

  // Steal
  stealIpOpportunities: 0,
  stealOopOpportunities: 0,
  stealIpAttempts: 0,
  stealOopAttempts: 0,
  stealIpTakedowns: 0,
  stealOopTakedowns: 0,
  stealIpChallenges: 0,
  stealOopChallenges: 0,
  stealIpContinues: 0,
  stealOopContinues: 0,
  stealIpFolds: 0,
  stealOopFolds: 0,

  // Donk Bet
  donkBetOpportunities: 0,
  donkBetAttempts: 0,
  donkBetTakedowns: 0,
  donkBetChallenges: 0,
  donkBetContinues: 0,
  donkBetFolds: 0,

  // Check-Raise
  checkRaiseOpportunities: 0,
  checkRaiseAttempts: 0,
  checkRaiseTakedowns: 0,
  checkRaiseChallenges: 0,
  checkRaiseContinues: 0,
  checkRaiseFolds: 0,

  // Shove
  openShoveIpOpportunities: 0,
  openShoveOopOpportunities: 0,
  openShoveIpAttempts: 0,
  openShoveOopAttempts: 0,
  openShoveIpTakedowns: 0,
  openShoveOopTakedowns: 0,
  openShoveIpChallenges: 0,
  openShoveOopChallenges: 0,
  openShoveIpContinues: 0,
  openShoveOopContinues: 0,
  openShoveIpFolds: 0,
  openShoveOopFolds: 0,
  shoveIpOpportunities: 0,
  shoveOopOpportunities: 0,
  shoveIpAttempts: 0,
  shoveOopAttempts: 0,
  shoveIpTakedowns: 0,
  shoveOopTakedowns: 0,
  shoveIpChallenges: 0,
  shoveOopChallenges: 0,
  shoveIpContinues: 0,
  shoveOopContinues: 0,
  shoveIpFolds: 0,
  shoveOopFolds: 0,

  // Retroactive
  success: 0,

  // Positional flags (simple counters)
  aggressionsInPosition: 0,
  challengesInPosition: 0,

  // Finance
  wentToShowdown: 0,
  wonAtShowdown: 0,
  wonWithoutShowdown: 0,
  pot: 0,
  sawFlop: 0,
  stackBefore: 0,
  stackAfter: 0,
  bigBlind: 0,
  won: 0,
  lost: 0,
  currency: 'USD',
  currencyRate: 1,
  investments: 0,
  returns: 0,
  profits: 0,
  balance: 0,
  winnings: 0,
  losses: 0,
  rake: 0,
};

export const emptyStat: StreetStat = {
  ...emptyStatValues,
  street: 'preflop',
  createdAt: Date.now(),
  hand: 0,
  table: '',
  venue: 'Virtual',
  player: '',
  startedAt: Date.now(),
  isFinalAction: 0,
};

/**
 * Helper function to get or create a stat entry for a player and street
 * Also updates opportunity-based statistics
 */
export function getOrCreatePlayerStreetStats(
  table: Game,
  playerId: string | number,
  street: Street
): StreetStat {
  playerId = Game.getPlayerName(table, playerId);

  if (!table.stats) {
    table.stats = [];
  }
  // Try to find existing stat
  let statEntry = table.stats.find(s => s.player === playerId && s.street === street);

  if (!statEntry) {
    // Create new stat entry for this player and street
    statEntry = {
      ...emptyStatValues,
      createdAt: Date.now(),
      startedAt: table.stats[0]?.startedAt ?? Date.now(),
      isFinalAction: 0,
      street,
      bigBlind: table.bigBlind ?? 0,
      player: playerId,
      hand: table.hand,
      table: table.table,
      venue: table.venue,
    };
    table.stats.push(statEntry);
  }
  return statEntry;
}

export function getTablePlayerByName(table: Game, playerId: string | number): Player {
  return table.players[Game.getPlayerIndex(table, playerId)];
}
export function getPlayer(table: Game, playerId: string | number): string {
  if (typeof playerId === 'number') {
    return table.players[playerId].name;
  }
  return playerId;
}

export function recordStatsBefore(table: Game, playerId: string | number) {
  const statEntry = createStatsEntry(table, playerId);
  // Update opportunity stats every time we access the entry
  updateOpportunityStats(table, playerId, statEntry);
}

export function createStatsEntry(table: Game, playerId: string | number): StreetStat {
  playerId = Game.getPlayerName(table, playerId);
  const statEntry = getOrCreatePlayerStreetStats(table, playerId, table.street);
  const player = table.players.find(p => p.name === playerId)!;
  if (statEntry.decisions === 0) {
    statEntry.investments = player.roundInvestments;
    statEntry.stackBefore = player.stack + (table.street === 'preflop' ? player.roundBet : 0);
  }
  return statEntry;
}

/**
 * Records statistics after an action is applied to the table
 * This handles all action-based statistics (bets, raises, etc.)
 */
export function recordStatsAfter(table: Game, action: Action): void {
  if (!isPlayerAction(action)) return;

  const playerIndex = getActionPlayerIndex(action);
  if (playerIndex === undefined || playerIndex < 0 || playerIndex >= table.players.length) return;

  const playerId = Game.getPlayerName(table, playerIndex);

  const currentPlayer = table.players[playerIndex];
  const actionType = getActionType(action);
  let statEntry = getOrCreatePlayerStreetStats(table, playerIndex, table.street);

  if (table.street === 'flop' && statEntry.decisions === 0) {
    statEntry.sawFlop = 1;
  }

  // Always update stack after any action
  statEntry.stackAfter = currentPlayer.stack;
  const streetStats = table.stats.filter(s => s.street === table.street && s.player !== playerId);

  const timestamp = new Date(getActionTimestamp(action) ?? Date.now());
  if (timestamp) {
    statEntry.createdAt ||= Number(timestamp);
    statEntry.decisionDuration += Number(timestamp) - (table.lastTimestamp || 0);
  }

  const handleFold = () => {
    statEntry.folds = 1;
    if (statEntry.fiveBetIpChallenges || statEntry.fiveBetOopChallenges) {
      if (statEntry.fiveBetIpChallenges) statEntry.fiveBetIpFolds = 1;
      else statEntry.fiveBetOopFolds = 1;
    }
    if (statEntry.threeBetIpChallenges || statEntry.threeBetOopChallenges) {
      if (statEntry.threeBetIpChallenges) statEntry.threeBetIpFolds = 1;
      else statEntry.threeBetOopFolds = 1;
    }
    if (statEntry.squeezeIpChallenges || statEntry.squeezeOopChallenges) {
      if (statEntry.squeezeIpChallenges) statEntry.squeezeIpFolds = 1;
      else statEntry.squeezeOopFolds = 1;
    }
    if (statEntry.fourBetIpChallenges || statEntry.fourBetOopChallenges) {
      if (statEntry.fourBetIpChallenges) statEntry.fourBetIpFolds = 1;
      else statEntry.fourBetOopFolds = 1;
    }
    if (statEntry.cbetIpChallenges || statEntry.cbetOopChallenges) {
      if (statEntry.cbetIpChallenges) statEntry.cbetIpFolds = 1;
      else statEntry.cbetOopFolds = 1;
    }
    if (statEntry.delayedCbetIpChallenges || statEntry.delayedCbetOopChallenges) {
      if (statEntry.delayedCbetIpChallenges) statEntry.delayedCbetIpFolds = 1;
      else statEntry.delayedCbetOopFolds = 1;
    }
    if (statEntry.doubleBarrelIpChallenges || statEntry.doubleBarrelOopChallenges) {
      if (statEntry.doubleBarrelIpChallenges) statEntry.doubleBarrelIpFolds = 1;
      else statEntry.doubleBarrelOopFolds = 1;
    }
    if (statEntry.tripleBarrelIpChallenges || statEntry.tripleBarrelOopChallenges) {
      if (statEntry.tripleBarrelIpChallenges) statEntry.tripleBarrelIpFolds = 1;
      else statEntry.tripleBarrelOopFolds = 1;
    }
    if (statEntry.stealIpChallenges || statEntry.stealOopChallenges) {
      if (statEntry.stealIpChallenges) statEntry.stealIpFolds = 1;
      else statEntry.stealOopFolds = 1;
    }
    if (statEntry.donkBetChallenges) {
      statEntry.donkBetFolds = 1;
    }
    if (statEntry.probeBetChallenges) {
      statEntry.probeBetFolds = 1;
    }
    if (statEntry.floatBetChallenges) {
      statEntry.floatBetFolds = 1;
    }
    if (statEntry.checkRaiseChallenges) {
      statEntry.checkRaiseFolds = 1;
    }
    if (statEntry.openShoveIpChallenges || statEntry.openShoveOopChallenges) {
      if (statEntry.openShoveIpChallenges) statEntry.openShoveIpFolds = 1;
      else statEntry.openShoveOopFolds = 1;
    }
    if (statEntry.shoveIpChallenges || statEntry.shoveOopChallenges) {
      if (statEntry.shoveIpChallenges) statEntry.shoveIpFolds = 1;
      else statEntry.shoveOopFolds = 1;
    }
  };

  const handleContinue = () => {
    if (statEntry.fiveBetIpChallenges || statEntry.fiveBetOopChallenges) {
      if (statEntry.fiveBetIpChallenges) statEntry.fiveBetIpContinues = 1;
      else statEntry.fiveBetOopContinues = 1;
    }
    if (statEntry.threeBetIpChallenges || statEntry.threeBetOopChallenges) {
      if (statEntry.threeBetIpChallenges) statEntry.threeBetIpContinues = 1;
      else statEntry.threeBetOopContinues = 1;
    }
    if (statEntry.squeezeIpChallenges || statEntry.squeezeOopChallenges) {
      if (statEntry.squeezeIpChallenges) statEntry.squeezeIpContinues = 1;
      else statEntry.squeezeOopContinues = 1;
    }
    if (statEntry.fourBetIpChallenges || statEntry.fourBetOopChallenges) {
      if (statEntry.fourBetIpChallenges) statEntry.fourBetIpContinues = 1;
      else statEntry.fourBetOopContinues = 1;
    }
    if (statEntry.cbetIpChallenges || statEntry.cbetOopChallenges) {
      if (statEntry.cbetIpChallenges) statEntry.cbetIpContinues = 1;
      else statEntry.cbetOopContinues = 1;
    }
    if (statEntry.delayedCbetIpChallenges || statEntry.delayedCbetOopChallenges) {
      if (statEntry.delayedCbetIpChallenges) statEntry.delayedCbetIpContinues = 1;
      else statEntry.delayedCbetOopContinues = 1;
    }
    if (statEntry.doubleBarrelIpChallenges || statEntry.doubleBarrelOopChallenges) {
      if (statEntry.doubleBarrelIpChallenges) statEntry.doubleBarrelIpContinues = 1;
      else statEntry.doubleBarrelOopContinues = 1;
    }
    if (statEntry.tripleBarrelIpChallenges || statEntry.tripleBarrelOopChallenges) {
      if (statEntry.tripleBarrelIpChallenges) statEntry.tripleBarrelIpContinues = 1;
      else statEntry.tripleBarrelOopContinues = 1;
    }
    if (statEntry.stealIpChallenges || statEntry.stealOopChallenges) {
      if (statEntry.stealIpChallenges) statEntry.stealIpContinues = 1;
      else statEntry.stealOopContinues = 1;
    }
    if (statEntry.donkBetChallenges) {
      statEntry.donkBetContinues = 1;
    }
    if (statEntry.probeBetChallenges) {
      statEntry.probeBetContinues = 1;
    }
    if (statEntry.floatBetChallenges) {
      statEntry.floatBetContinues = 1;
    }
    if (statEntry.checkRaiseChallenges) {
      statEntry.checkRaiseContinues = 1;
    }
    if (statEntry.openShoveIpChallenges || statEntry.openShoveOopChallenges) {
      if (statEntry.openShoveIpChallenges) statEntry.openShoveIpContinues = 1;
      else statEntry.openShoveOopContinues = 1;
    }
    if (statEntry.shoveIpChallenges || statEntry.shoveOopChallenges) {
      if (statEntry.shoveIpChallenges) statEntry.shoveIpContinues = 1;
      else statEntry.shoveOopContinues = 1;
    }
  };

  if (actionType === 'f') {
    statEntry.decisions++;

    statEntry.losses = currentPlayer.totalBet;
    statEntry.lost = 1;

    handleFold();
  }

  if (currentPlayer.isAllIn && !table.stats.find(s => s.allIns && s.player === playerId)) {
    statEntry.allIns = 1;
  }
  statEntry.investments = currentPlayer.roundInvestments;
  statEntry.balance = statEntry.stackAfter - statEntry.stackBefore;

  // Handle call/check
  if (actionType === 'cc') {
    statEntry.decisions++;
    statEntry.passivities++;
    const hasBeenAggression =
      streetStats.some(s => s.aggressions > 0) || table.street === 'preflop';
    if (hasBeenAggression) {
      statEntry.calls++;
      if (statEntry.floatOpportunities > 0) {
        statEntry.floatAttempts = 1;
      }
      handleContinue();
    } else {
      statEntry.checks++;
    }

    if (statEntry.limpOpportunities > 0 && statEntry.calls === 1 && statEntry.decisions == 1) {
      statEntry.limps++;
    }

    if (table.street === 'preflop' && statEntry.calls > 0) {
      statEntry.voluntaryPutMoneyInPotTimes = 1;
    }
  }
  // Handle bet/raise
  else if (actionType === 'cbr') {
    statEntry.decisions++;

    // Check for prior aggression BEFORE incrementing the current aggression count
    const hasPriorAggression = streetStats.some(s => s.aggressions > 0);

    statEntry.aggressions++;
    handleContinue(); // Raising is also a form of continuing

    if (!hasPriorAggression) {
      statEntry.firstAggressions = 1;
      if (table.street === 'preflop' && statEntry.preflopRaiseOpportunities > 0) {
        statEntry.preflopRaises = 1;
      }
    }

    // Clear previous last aggressor on this street
    streetStats.forEach(s => (s.lastAggressions = 0));
    statEntry.lastAggressions = 1;

    // Determine if it's a raise or a bet
    if (table.street === 'preflop' || hasPriorAggression) {
      statEntry.raises++;
    } else {
      statEntry.bets++;
    }

    // --- Classify the Aggressive Action ---
    // Note: These are not mutually exclusive. A single action can be a 3-bet, a squeeze, etc.

    // 5-Bet
    if (statEntry.fiveBetIpOpportunities || statEntry.fiveBetOopOpportunities) {
      if (statEntry.fiveBetIpOpportunities) {
        statEntry.fiveBetIpAttempts = 1;
        statEntry.aggressionsInPosition = 1;
      } else {
        statEntry.fiveBetOopAttempts = 1;
      }
    }
    // 4-Bet
    else if (statEntry.fourBetIpOpportunities || statEntry.fourBetOopOpportunities) {
      if (statEntry.fourBetIpOpportunities) {
        statEntry.fourBetIpAttempts = 1;
        statEntry.aggressionsInPosition = 1;
      } else {
        statEntry.fourBetOopAttempts = 1;
      }
    }

    // Squeeze (is a form of 3-bet, so we check it first)
    if (statEntry.squeezeIpOpportunities || statEntry.squeezeOopOpportunities) {
      if (statEntry.squeezeIpOpportunities) {
        statEntry.squeezeIpAttempts = 1;
        statEntry.threeBetIpAttempts = 1; // Squeeze is a type of 3-bet
        statEntry.aggressionsInPosition = 1;
      } else {
        statEntry.squeezeOopAttempts = 1;
        statEntry.threeBetOopAttempts = 1; // Squeeze is a type of 3-bet
      }
    }
    // 3-Bet (if not already counted as a squeeze)
    else if (statEntry.threeBetIpOpportunities || statEntry.threeBetOopOpportunities) {
      if (statEntry.threeBetIpOpportunities) {
        statEntry.threeBetIpAttempts = 1;
        statEntry.aggressionsInPosition = 1;
      } else {
        statEntry.threeBetOopAttempts = 1;
      }
    }

    // Steal
    if (statEntry.stealIpOpportunities || statEntry.stealOopOpportunities) {
      if (isStealAttempt(table, getActionAmount(action))) {
        if (statEntry.stealIpOpportunities) {
          statEntry.stealIpAttempts = 1;
          statEntry.aggressionsInPosition = 1;
        } else {
          statEntry.stealOopAttempts = 1;
        }
      }
    }

    // C-Bet
    if (statEntry.cbetIpOpportunities || statEntry.cbetOopOpportunities) {
      if (statEntry.cbetIpOpportunities) {
        statEntry.cbetIpAttempts = 1;
        statEntry.aggressionsInPosition = 1;
      } else {
        statEntry.cbetOopAttempts = 1;
      }
    }

    // Delayed C-Bet, Double/Triple Barrels, etc.
    if (statEntry.delayedCbetIpOpportunities || statEntry.delayedCbetOopOpportunities) {
      if (statEntry.delayedCbetIpOpportunities) {
        statEntry.delayedCbetIpAttempts = 1;
        statEntry.aggressionsInPosition = 1;
      } else {
        statEntry.delayedCbetOopAttempts = 1;
      }
    }
    if (statEntry.doubleBarrelIpOpportunities || statEntry.doubleBarrelOopOpportunities) {
      if (statEntry.doubleBarrelIpOpportunities) {
        statEntry.doubleBarrelIpAttempts = 1;
        statEntry.aggressionsInPosition = 1;
      } else {
        statEntry.doubleBarrelOopAttempts = 1;
      }
    }
    if (statEntry.tripleBarrelIpOpportunities || statEntry.tripleBarrelOopOpportunities) {
      if (statEntry.tripleBarrelIpOpportunities) {
        statEntry.tripleBarrelIpAttempts = 1;
        statEntry.aggressionsInPosition = 1;
      } else {
        statEntry.tripleBarrelOopAttempts = 1;
      }
    }

    // Postflop OOP Maneuvers
    if (statEntry.checkRaiseOpportunities) {
      statEntry.checkRaiseAttempts = 1;
    }
    if (statEntry.donkBetOpportunities) {
      statEntry.donkBetAttempts = 1;
    }
    if (statEntry.probeBetOpportunities) {
      statEntry.probeBetAttempts = 1;
    }
    if (statEntry.floatBetOpportunities) {
      statEntry.floatBetAttempts = 1;
      statEntry.aggressionsInPosition = 1;
    }

    // Shoves
    if (statEntry.openShoveIpOpportunities || statEntry.openShoveOopOpportunities) {
      if (statEntry.openShoveIpOpportunities) {
        statEntry.openShoveIpAttempts = 1;
        statEntry.aggressionsInPosition = 1;
      } else {
        statEntry.openShoveOopAttempts = 1;
      }
    }
    if (currentPlayer.isAllIn) {
      if (statEntry.shoveIpOpportunities || statEntry.shoveOopOpportunities) {
        if (statEntry.shoveIpOpportunities) statEntry.shoveIpAttempts = 1;
        else statEntry.shoveOopAttempts = 1;
      }
    }

    statEntry.voluntaryPutMoneyInPotTimes = 1;
  }
}

// Record final stacks and calculate winnings for all players at showdown
export function recordStatsFinish(table: Game) {
  if (!table.isComplete) {
    return;
  }
  // Check for takedowns - assign to the last aggressor if hand ended without showdown
  if (!table.isShowdown) {
    // Find the last aggressive action on any street
    const allAggressions = table.stats.filter(s => s.aggressions > 0 && s.street == table.street);

    if (allAggressions.length > 0) {
      const lastAggressorStat = allAggressions.find(s => s.lastAggressions > 0)!;

      const assignTakedown = (
        ipAttempts: keyof StreetStat,
        oopAttempts: keyof StreetStat,
        ipTakedowns: keyof StreetStat,
        oopTakedowns: keyof StreetStat
      ) => {
        if (lastAggressorStat[ipAttempts]) {
          (lastAggressorStat[ipTakedowns] as number) = 1;
          return true;
        }
        if (lastAggressorStat[oopAttempts]) {
          (lastAggressorStat[oopTakedowns] as number) = 1;
          return true;
        }
        return false;
      };
      const assignTakedownSimple = (attempts: keyof StreetStat, takedowns: keyof StreetStat) => {
        if (lastAggressorStat[attempts]) {
          (lastAggressorStat[takedowns] as number) = 1;
          return true;
        }
        return false;
      };

      assignTakedown(
        'fiveBetIpAttempts',
        'fiveBetOopAttempts',
        'fiveBetIpTakedowns',
        'fiveBetOopTakedowns'
      );
      assignTakedown(
        'fourBetIpAttempts',
        'fourBetOopAttempts',
        'fourBetIpTakedowns',
        'fourBetOopTakedowns'
      );
      assignTakedown(
        'threeBetIpAttempts',
        'threeBetOopAttempts',
        'threeBetIpTakedowns',
        'threeBetOopTakedowns'
      );
      assignTakedown(
        'squeezeIpAttempts',
        'squeezeOopAttempts',
        'squeezeIpTakedowns',
        'squeezeOopTakedowns'
      );
      assignTakedown('cbetIpAttempts', 'cbetOopAttempts', 'cbetIpTakedowns', 'cbetOopTakedowns');
      assignTakedown(
        'delayedCbetIpAttempts',
        'delayedCbetOopAttempts',
        'delayedCbetIpTakedowns',
        'delayedCbetOopTakedowns'
      );
      assignTakedown(
        'doubleBarrelIpAttempts',
        'doubleBarrelOopAttempts',
        'doubleBarrelIpTakedowns',
        'doubleBarrelOopTakedowns'
      );
      assignTakedown(
        'tripleBarrelIpAttempts',
        'tripleBarrelOopAttempts',
        'tripleBarrelIpTakedowns',
        'tripleBarrelOopTakedowns'
      );
      assignTakedown(
        'stealIpAttempts',
        'stealOopAttempts',
        'stealIpTakedowns',
        'stealOopTakedowns'
      );
      assignTakedownSimple('donkBetAttempts', 'donkBetTakedowns');
      assignTakedownSimple('probeBetAttempts', 'probeBetTakedowns');
      assignTakedownSimple('floatBetAttempts', 'floatBetTakedowns');
      assignTakedownSimple('checkRaiseAttempts', 'checkRaiseTakedowns');
      assignTakedown(
        'openShoveIpAttempts',
        'openShoveOopAttempts',
        'openShoveIpTakedowns',
        'openShoveOopTakedowns'
      );
      assignTakedown(
        'shoveIpAttempts',
        'shoveOopAttempts',
        'shoveIpTakedowns',
        'shoveOopTakedowns'
      );
    }
  }

  table.players.forEach((player, idx) => {
    if (player.isInactive) return;
    const preflopStats = getOrCreatePlayerStreetStats(table, idx, 'preflop');
    const playerId = Game.getPlayerName(table, idx);
    const lastPlayerStat =
      table.stats.filter(s => s.player === playerId && s.decisions > 0).pop()! ||
      // if all other players folded preflop
      table.stats.filter(s => s.player === playerId).pop();

    if (table.isShowdown) {
      if (player.hasShownCards) {
        lastPlayerStat.wentToShowdown = 1;
      }
    }

    // Calculate winnings using preflop stackBefore
    const stackDiff = player.stack - preflopStats.stackBefore;

    // Update final stack
    lastPlayerStat.stackAfter = player.stack;
    lastPlayerStat.returns = player.returns;
    lastPlayerStat.winnings = player.winnings;
    lastPlayerStat.profits = Math.max(0, stackDiff);
    lastPlayerStat.losses = Math.max(0, -stackDiff);
    lastPlayerStat.rake += player.rake;
    lastPlayerStat.balance = lastPlayerStat.stackAfter - lastPlayerStat.stackBefore;
    lastPlayerStat.investments ||= player.roundInvestments;

    if (stackDiff > 0) {
      Streets.map(street => {
        const streetStats = getPlayerStreetStats(table, idx, street);
        if (streetStats) {
          streetStats.success = 1;
        }
      });
      if (table.isShowdown) {
        lastPlayerStat.wonAtShowdown = 1;
      } else {
        lastPlayerStat.wonWithoutShowdown = 1;
      }
      lastPlayerStat.won = 1;
    } else if (stackDiff < 0) {
      lastPlayerStat.lost = 1;
    }
  });

  // Find the single stat entry corresponding to the very last action of the hand
  // and assign game-level stats to it.
  const allDecisionStats = table.stats.filter(s => s.decisions > 0);
  const finalActionStat = allDecisionStats.pop(); // .pop() gets the last element

  if (finalActionStat) {
    finalActionStat.pot = table.pot;
    finalActionStat.isFinalAction = 1;
  }
}

/**
 * Extracts player statistics for a specific player and street
 */
export function getPlayerStreetStats(
  table: Game,
  playerId: string | number,
  street: Street
): StreetStat | undefined {
  playerId = Game.getPlayerName(table, playerId);
  return table.stats.find(s => s.player === playerId && s.street === street);
}
