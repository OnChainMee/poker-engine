import { Game } from '../Game';
import { Hand } from '../Hand';
import type { Action, Player } from '../types';
import { deal } from './dealer';
import { getCurrentPlayerIndex } from './position';
import { applyAction } from './progress';

export type PlayerFunction = (game: Game, player: Player) => Promise<string>;

/**
 * Clones the game state
 * @param state - The game state to clone
 * @returns The cloned game state
 */
function cloneState(state: Game): Game {
  return {
    ...state,
    players: state.players.map(p => ({ ...p, cards: [...(p.cards || [])] })),
    board: [...state.board],
  };
}

/**
 * Orchestrates a poker game by managing dealer actions and player responses.
 * Returns a new game state with all actions applied.
 */
export async function croupier(
  hand: Hand,
  players: PlayerFunction[],
  game = Game(hand)
): Promise<Hand> {
  // Initialize table state
  const actions: Action[] = [...hand.actions];

  // Keep running until showdown
  for (var i = 0; i < 10000; i++) {
    // Get the current player index
    const currentPlayerIndex = getCurrentPlayerIndex(game);

    // If it's dealer's turn (-1), handle dealer actions
    if (currentPlayerIndex === -1 || (game.isShowdown && !game.isComplete)) {
      const action = deal(game);
      if (action) {
        game = applyAction(game, action);
        actions.push(action);
      } else {
        // End of the game
        break;
      }

      // Continue to next iteration
      continue;
    }

    // Handle player action
    const currentPlayer = game.players[currentPlayerIndex];

    // Get player function
    const player = players[currentPlayerIndex];
    if (!player) {
      throw new Error(`No player function found for position ${currentPlayerIndex}`);
    }

    const action = await player(cloneState(game), currentPlayer);
    game = applyAction(game, action as Action);
    actions.push(action as Action);
  }

  return {
    ...hand,
    actions,
  };
}
