import type { Game } from '../Game';
import type { Player } from '../types';
import { getRemainingPlayers } from './position';
import { isShowdown } from './showdown';

/**
 * Determines if the betting round is complete.
 * Betting is complete if:
 * - Only one active player remains
 * - All active players are all-in
 * - All active players have matched the highest bet or are all-in
 */
export function completeBetting(game: Game) {
  const activePlayers = getRemainingPlayers(game);
  const highestBet = Math.max(...game.players.map((p: Player) => p.totalBet));

  if (
    activePlayers.length < 2 ||
    activePlayers.every((p: Player) => p.isAllIn) ||
    activePlayers.every((p: Player) => (p.totalBet === highestBet && p.hasActed) || p.isAllIn) ||
    game.isRunOut
  ) {
    game.isBettingComplete = true;
    game.isShowdown ||= isShowdown(game);
    if (game.isShowdown) {
      resetBettingState(game);
    }
  }
}

/**
 * Updates player state when matching a bet
 */
export function matchBet(game: Game, playerIndex: number, targetAmount: number): void {
  setPlayerBet(game, playerIndex, targetAmount);
  const player = game.players[playerIndex];

  // Player has acted if they matched the bet or went all-in
  player.hasActed = player.roundBet === targetAmount || player.isAllIn;
}

/**
 * Updates player state when making a new bet
 */
export function makeBet(game: Game, playerIndex: number, targetAmount: number) {
  // Calculate the raise amount
  const previousBet = game.lastCompleteBet;
  const raiseAmount = addWithPrecision(targetAmount, -previousBet);

  // The minimum allowable raise increment is stored in game.minBet
  const minRaiseIncrement = game.minBet;

  const player = game.players[playerIndex];
  const isFacingIncompleteRaise = game.bet > (game.lastCompleteBet || 0);
  const hasActedOnLastFullBet = player.roundBet >= (game.lastCompleteBet || 0);

  setPlayerBet(game, playerIndex, targetAmount);

  if (raiseAmount >= minRaiseIncrement && (!isFacingIncompleteRaise || !hasActedOnLastFullBet)) {
    // Update the minimum raise increment for future raises
    game.minBet = raiseAmount;
    game.lastCompleteBet = targetAmount;
  }

  // Reset bettingComplete since we have a new bet
  game.isBettingComplete = false;
  const correctedAction = `p${playerIndex + 1} cbr ${targetAmount}`;
  game.lastBetAction = correctedAction;

  player.hasActed = true;

  // Reset hasActed for all non-all-in players except the bettor
  // This starts a new betting round, so everyone needs to act again
  game.players.forEach((p: Player, i: number) => {
    // Only reset hasActed for players who:
    // 1. Are not the bettor
    // 2. Have not folded
    // 3. Are not all-in
    // 4. Have a lower bet than the current bet (need to act on the raise)
    if (i !== playerIndex && !p.hasFolded && !p.isAllIn && p.roundBet < game.bet) {
      p.hasActed = false;
    }
  });
}

export function setPlayerAnte(game: Game, playerIndex: number, amount: number) {
  const player = game.players[playerIndex];

  player.stack = addWithPrecision(player.stack, -amount);
  game.pot = addWithPrecision(game.pot, amount);
}

export function setPlayerBet(game: Game, playerIndex: number, absoluteAmount: number) {
  const player = game.players[playerIndex];
  const amount = Math.min(absoluteAmount - player.roundBet, player.stack);
  player.stack = addWithPrecision(player.stack, -amount);
  player.roundBet = addWithPrecision(player.roundBet, amount);
  player.totalBet = addWithPrecision(player.totalBet, amount);
  player.roundInvestments = player.roundBet;
  player.totalInvestments = player.totalBet;
  player.isAllIn = player.stack == 0;
  game.pot = addWithPrecision(game.pot, amount);
  game.bet = Math.max(game.bet, player.roundBet);
}

export function addWithPrecision(a: number, b: number) {
  return Math.round((a + b) * 10000) / 10000;
}
/**
 * Helper: resetBettingState
 * Resets all betting-related state when a hand is complete
 */
// todo: use it everywhere
export function resetBettingState(game: Game): void {
  game.minBet = game.bigBlind;
  game.lastCompleteBet = game.minBet;
  game.bet = 0;
  game.players.forEach((p: Player) => {
    p.roundBet = 0;
    p.roundAction = null;
  });
}
