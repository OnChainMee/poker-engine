import { Game } from '../Game';
import type { Player } from '../types';
import { addWithPrecision } from './betting';
import { getCurrentPlayerIndex } from './position';

/**
 * Determines if a player can act (not folded, not all-in)
 */
export function isPlayerEligibleToAct(player: Player): boolean {
  return !player.hasFolded && !player.isAllIn && !player.isInactive;
}

export function isPlayerActive(player: Player): boolean {
  return !player.hasFolded && !player.isInactive;
}

/**
 * Determines if it's a specific player's turn to act.
 * A player can act if they are the first non-acted, non-folded player in position.
 * @param table Current table state
 * @param playerIndex Index of the player to check
 * @returns True if it's the specified player's turn
 */
export function isPlayerTurn(game: Game, playerIndex: number): boolean {
  const activePlayer = getCurrentPlayerIndex(game);
  return activePlayer === playerIndex;
}

/**
 * Determines if a player can check.
 * A player can check if they've matched the highest bet and haven't acted yet.
 * @param table Current table state
 * @param playerIndex Index of the player to check
 * @returns True if the player can check
 */
export function canCheck(game: Game, position: number): boolean {
  const player = game.players[position];
  if (player.hasFolded || game.isComplete) return false;

  // Can only check if we've matched the current bet
  return player.roundBet === game.bet;
}

/**
 * Determines if a player can call.
 * A player can call if they face a bet higher than their current bet and have enough chips.
 * @param table Current table state
 * @param playerIndex Index of the player to check
 * @returns True if the player can call
 */
export function canCall(game: Game, position: number): boolean {
  const player = game.players[position];
  if (player.hasFolded || game.isComplete) return false;

  // Can only call if there are existing bets
  if (game.bet === 0) return false;

  // Can only call if we haven't matched the current bet
  if (player.roundBet >= game.bet) return false;

  return true;
}

/**
 * Determines if a player can bet.
 * A player can bet if there are no existing bets and they have chips.
 * @param table Current table state
 * @param playerIndex Index of the player to check
 * @returns True if the player can bet
 */
export function canBet(game: Game, position: number, amount?: number): boolean {
  const player = game.players[position];
  if (player.hasFolded) return false;

  // Can only bet if there are no existing bets
  if (game.bet > 0) return false;

  // Can't bet if we don't have any chips
  if (player.stack <= 0) return false;

  if (amount !== undefined) {
    const maxStack = player.stack + player.roundBet;
    const isAllIn = amount >= maxStack;

    if (amount < game.minBet && !isAllIn) {
      return false;
    }
  }

  return true;
}

/**
 * Determines if a player can raise.
 * A player can raise if they face a bet and have enough chips.
 * @param table Current table state
 * @param playerIndex Index of the player to check
 * @param amount Optional amount to check against
 * @returns True if the player can raise
 */
export function canRaise(game: Game, position: number, amount?: number): boolean {
  const player = game.players[position];
  if (player.hasFolded) return false;

  // Can only raise if there are existing bets
  if (game.bet === 0) return false;

  // Incomplete Raise Rule:
  // If the current bet is higher than the last COMPLETE bet (meaning there's an incomplete all-in raise on top),
  // players who have already acted on the last COMPLETE bet are "capped" and cannot raise.
  // They can only Call or Fold.
  const isFacingIncompleteRaise = game.bet > (game.lastCompleteBet || 0);
  const hasActedOnLastFullBet = player.roundBet >= (game.lastCompleteBet || 0);

  if (isFacingIncompleteRaise && hasActedOnLastFullBet) {
    return false;
  }

  // Min Raise Rule:
  // Must raise by at least the previous raise increment (game.minBet).
  // Target total bet = Current Bet + Min Increment
  const minTotalBet = addWithPrecision(game.lastCompleteBet, game.minBet);
  const maxStack = addWithPrecision(player.stack, player.totalBet);

  if (amount !== undefined) {
    const totalBet = addWithPrecision(addWithPrecision(amount, -player.roundBet), player.totalBet);
    const isAllIn = totalBet === maxStack;

    if ((amount < minTotalBet || minTotalBet > maxStack) && !isAllIn) {
      return false;
    }
  } else {
    if (maxStack <= game.bet) {
      return false;
    }
  }

  return true;
}

/**
 * Determines if a player can fold.
 * A player can fold if they face a bet higher than their current bet.
 * @param table Current table state
 * @param playerIndex Index of the player to check
 * @returns True if the player can fold
 */
export function canFold(game: Game, position: number): boolean {
  const player = game.players[position];
  if (player.hasFolded || player.hasActed) return false;

  return true;
}
