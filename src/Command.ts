import { Game } from './Game';
import * as coreCommands from './game/commands';
import { deal as dealerDeal, showCards as dealerShowCards } from './game/dealer';
import type { Action, PlayerIdentifier } from './types';

/**
 * Command namespace - Interface abstraction for user interactions
 * Converts UI interactions into properly formatted Action values for core poker engine
 */
export namespace Command {
  // ==================== PLAYER ACTIONS ====================

  /**
   * Processes player fold with automatic pot forfeiture and seat status updates
   */
  export function fold(game: Game, playerIdentifier: PlayerIdentifier): Action {
    return coreCommands.fold(game, Game.getPlayerIndex(game, playerIdentifier));
  }

  /**
   * Processes check action with rule validation
   */
  export function check(game: Game, playerIdentifier: PlayerIdentifier): Action {
    return coreCommands.check(game, Game.getPlayerIndex(game, playerIdentifier));
  }

  /**
   * Executes call with precise stack validation and automatic pot contribution
   */
  export function call(game: Game, playerIdentifier: PlayerIdentifier): Action {
    return coreCommands.call(game, Game.getPlayerIndex(game, playerIdentifier));
  }

  /**
   * Initiates betting round with amount clamping based on stack size and table limits
   * If requested amount exceeds player's available chips, uses maximum possible amount
   */
  export function bet(game: Game, playerIdentifier: PlayerIdentifier, amount: number): Action {
    return coreCommands.bet(game, Game.getPlayerIndex(game, playerIdentifier), amount);
  }

  /**
   * Processes raise with amount clamping based on stack size and minimum raise rules
   * If requested amount exceeds player's available chips, uses maximum possible amount
   */
  export function raise(game: Game, playerIdentifier: PlayerIdentifier, amount: number): Action {
    return coreCommands.raise(game, Game.getPlayerIndex(game, playerIdentifier), amount);
  }

  /**
   * Executes all-in with complete stack commitment and side pot creation
   */
  export function allIn(game: Game, playerIdentifier: PlayerIdentifier): Action {
    const playerIndex = Game.getPlayerIndex(game, playerIdentifier);
    const player = game.players[playerIndex];
    const totalAvailable = player.stack + player.roundBet;
    return coreCommands.bet(game, playerIndex, totalAvailable);
  }

  /**

* Handles automatic player action when time limit expires

*/

  export function auto(game: Game, playerIdentifier?: PlayerIdentifier): Action {
    const playerId = playerIdentifier ?? game.nextPlayerIndex;

    // If in showdown, muck cards
    if (game.isShowdown && !game.isComplete) {
      const index = Game.getPlayerIndex(game, playerId);
      return coreCommands.showCards(game, index, game.players[index].cards);
    }

    // Otherwise, fold

    return fold(game, playerId);
  }

  /**

* Processes showdown reveals for specific player with proper pot distribution

*/

  export function showCards(game: Game, playerIdentifier: PlayerIdentifier): Action {
    const playerIndex = Game.getPlayerIndex(game, playerIdentifier);
    const player = game.players[playerIndex];
    return coreCommands.showCards(game, playerIndex, player.cards);
  }

  /**
   * Handles player mucking cards, not showing them
   */
  export function muckCards(game: Game, playerIdentifier: PlayerIdentifier): Action {
    return coreCommands.muckCards(game, Game.getPlayerIndex(game, playerIdentifier));
  }

  // ==================== DEALER OPERATIONS ====================

  /**
   * Generates the next dealer action based on game state - whether that's dealing hole cards,
   * community cards, or managing showdown. Returns an empty action if no dealer action is needed.
   * Uses the game's seed for deterministic card dealing.
   */
  export function deal(game: Game): Action | null {
    return dealerDeal(game);
  }

  /**
   * Forces the next player to show their cards when required by game rules
   */
  export function forceShowCards(game: Game): Action | null {
    return dealerShowCards(game);
  }

  // ==================== TABLE MANAGEMENT ====================

  /**
   * Adds timestamped player or dealer messages
   */
  export function message(game: Game, playerIdentifier: PlayerIdentifier, message: string): Action {
    const playerIndex = Game.getPlayerIndex(game, playerIdentifier);
    // If player is not found or message is empty, return an empty Action.
    if (playerIndex === -1 || !message) {
      return '' as Action;
    }
    return coreCommands.message(game, playerIndex, message);
  }
}
