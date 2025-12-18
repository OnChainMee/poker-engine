import type { Game } from '../Game';
import type { Action } from '../types';

/**
 * Returns a fold action string without applying it
 */
export function fold(_: Game, playerIndex: number): Action {
  return `p${playerIndex + 1} f #${Date.now()}`;
}

/**
 * Returns a check action string without applying it
 */
export function check(game: Game, playerIndex: number): Action {
  return call(game, playerIndex);
}

/**
 * Returns a call action string without applying it.
 * Available stack includes current bet since it will be returned when calling.
 */
export function call(game: Game, playerIndex: number): Action {
  const player = game.players[playerIndex];
  const availableStack = player.stack + player.roundBet;
  const amountToCall = game.bet - player.roundBet;
  const callAmount = Math.min(amountToCall, availableStack);
  return `p${playerIndex + 1} cc ${player.roundBet + callAmount} #${Date.now()}`;
}

/**
 * Returns a bet action string without applying it.
 * Available stack includes current bet since it will be returned when betting.
 */
export function bet(game: Game, playerIndex: number, amount: number): Action {
  const player = game.players[playerIndex];
  const availableStack = player.stack + player.roundBet;
  const minBet = game.bigBlind ?? 0;
  const betAmount = Math.max(
    minBet,
    Math.min(availableStack, typeof amount === 'number' ? amount : 0)
  );

  if (betAmount === game.bet) {
    return call(game, playerIndex);
  }

  return `p${playerIndex + 1} cbr ${betAmount} #${Date.now()}`;
}

/**
 * Returns a raise action string without applying it.
 * Available stack includes current bet since it will be returned when raising.
 */
export function raise(game: Game, playerIndex: number, amount: number): Action {
  const player = game.players[playerIndex];
  const availableStack = player.stack + player.roundBet;
  const minRaiseIncrement = game.minBet;
  const minBet = (game.bet || 0) + minRaiseIncrement;
  const raiseAmount = Math.max(
    minBet,
    Math.min(availableStack, typeof amount === 'number' ? amount : 0)
  );
  return `p${playerIndex + 1} cbr ${raiseAmount} #${Date.now()}`;
}

/**
 * Returns a deal board action string without applying it
 */
export function dealBoard(_game: Game, cards: string[]): Action {
  return `d db ${cards.join('')} #${Date.now()}`;
}

/**
 * Returns a deal hole cards action string without applying it
 */
export function dealHoleCards(_game: Game, playerIndex: number, cards: string[]): Action {
  return `d dh p${playerIndex + 1} ${cards.join('')} #${Date.now()}`;
}

/**
 * Returns a show cards action string without applying it
 */
export function showCards(_: Game, playerIndex: number, cards: string[]): Action {
  return `p${playerIndex + 1} sm ${cards.join('')} #${Date.now()}`;
}

/**
 * Returns a muck cards action string without applying it
 */
export function muckCards(_: Game, playerIndex: number): Action {
  return `p${playerIndex + 1} sm #${Date.now()}`;
}

/**
 * Returns a message action string without applying it
 */
export function message(_: Game, playerIndex: number, message: string): Action {
  return `p${playerIndex + 1} m ${message} #${Date.now()}`;
}
