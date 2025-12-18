import { type Game } from '../Game';
import { recordStatsAfter, recordStatsBefore, recordStatsFinish } from '../stats/stats';
import type { Action, Card, Player } from '../types';
import {
  ACTION_CHECK_CALL,
  ACTION_COMPLETE_BET_RAISE,
  ACTION_DEAL_BOARD,
  ACTION_DEAL_HOLE,
  ACTION_FOLD,
  ACTION_MESSAGE,
  ACTION_SHOW_MUCK,
} from '../types';
import { completeBetting, makeBet, matchBet, resetBettingState } from './betting';
import {
  getActionAmount,
  getActionCards,
  getActionPlayerIndex,
  getActionTimestamp,
  getActionType,
  getCurrentPlayerIndex,
  getRemainingPlayers,
} from './position';
import { completeHand } from './showdown';
import { canBet, canCall, canCheck, canFold, canRaise } from './validation';

/**
 * Determines if action is a dealer action
 */
export function isDealerAction(action: Action): boolean {
  return action.startsWith('d ');
}

/**
 * Determines if action is a player action
 */
export function isPlayerAction(action?: Action, index?: number): boolean {
  return action?.startsWith('p' + (index == null ? '' : index + 1)) ?? false;
}

// Parse & apply a single action line to the Table
export function applyAction(game: Game, action: Action) {
  const playerIndex = getActionPlayerIndex(action);
  const cards = (getActionCards(action) as Card[]) || [];
  const actionType = getActionType(action);

  // Check if game is valid before applying any action
  // We check activePlayers.length < 2 as well because players might fold during the game
  const activePlayers = getRemainingPlayers(game);
  if (!game.isPlayable || activePlayers.length < 2) {
    throw new Error(
      `Cannot apply action to invalid game (less than 2 active players). Action: ${action}`
    );
  }

  if (actionType == ACTION_MESSAGE) {
    return game;
  }

  if (isDealerAction(action)) {
    if (game.nextPlayerIndex != -1) {
      throw new Error(
        `It's not the dealer's turn to deal, nextPlayerIndex is ${game.nextPlayerIndex}. Action: ${action}`
      );
    }
  } else {
    if (game.nextPlayerIndex != playerIndex) {
      throw new Error(
        `It's not the player's turn to act, nextPlayerIndex is ${game.nextPlayerIndex} but the action is for player ${playerIndex}. Action: ${action}. Before: ${game.lastAction}`
      );
    }
  }
  if (game.isComplete) {
    throw new Error(`Cannot apply action after hand is complete. Action: ${action}`);
  }
  if (game.isShowdown && game.players.some(p => p.hasShownCards && p.position === playerIndex)) {
    throw new Error(`Cannot apply showdown action after player has shown cards. Action: ${action}`);
  }
  // Store the action
  game.lastAction = action;

  if (isDealerAction(action)) {
    // Dealer action
    if (actionType === ACTION_DEAL_HOLE && playerIndex != null) {
      // Deal hole cards
      if (playerIndex >= 0 && playerIndex < game.players.length) {
        game.players[playerIndex].cards = cards;
        game.usedCards += cards.length;
      }
    } else if (actionType === ACTION_DEAL_BOARD) {
      // Validate all active players have hole cards before dealing board
      const activePlayers = getRemainingPlayers(game);
      const allPlayersHaveHoleCards = activePlayers.every(p => p.cards.length > 0);

      if (!allPlayersHaveHoleCards) {
        throw new Error(
          `Cannot deal board cards before all active players have hole cards. Action: ${action}`
        );
      }

      // Validate correct number of cards for the street
      const cardsToAdd = cards.length;
      const currentBoardSize = game.board.length;
      let expectedCards: number;

      if (currentBoardSize === 0) {
        expectedCards = 3; // Flop must be 3 cards
      } else if (currentBoardSize === 3 || currentBoardSize === 4) {
        expectedCards = 1; // Turn and river must be 1 card each
      } else {
        throw new Error(
          `Invalid board state: board has ${currentBoardSize} cards. Action: ${action}`
        );
      }

      if (cardsToAdd !== expectedCards) {
        throw new Error(
          `Invalid board deal: expected ${expectedCards} card(s) but got ${cardsToAdd}. ` +
            `Current board has ${currentBoardSize} cards. Action: ${action}`
        );
      }

      // Validate not exceeding 5 total board cards
      if (currentBoardSize + cardsToAdd > 5) {
        throw new Error(
          `Cannot deal more than 5 total board cards. Current: ${currentBoardSize}, ` +
            `attempting to add: ${cardsToAdd}. Action: ${action}`
        );
      }

      // Deal board cards
      game.board = [...game.board, ...cards];
      game.usedCards += cards.length;

      // Reset state for new street
      advanceStreet(game);
    }
  } else if (actionType === ACTION_SHOW_MUCK && playerIndex != null) {
    if (!game.isShowdown || game.isComplete) {
      throw new Error(`Cards should be shown at showdown. Action: ${action}`);
    }
    // Show cards at showdown
    const currentPlayer = game.players[playerIndex];
    const cards = getActionCards(action);
    if (cards) {
      currentPlayer.hasShownCards = true;
      currentPlayer.cards = cards as Card[];
    } else {
      currentPlayer.hasShownCards = false;
    }
    currentPlayer.hasActed = true;
    currentPlayer.roundAction = action;
    game.lastPlayerAction = action;
  } else if (playerIndex != null) {
    const currentPlayer = game.players[playerIndex];

    if (actionType === ACTION_FOLD) {
      if (!canFold(game, playerIndex)) {
        debugger;
        throw new Error(`Invalid Action: Player ${playerIndex} cannot fold.`);
      }
      // Fold
      currentPlayer.hasFolded = true;
      currentPlayer.hasActed = true;
    } else if (actionType === ACTION_CHECK_CALL) {
      // Call or check
      const isCheck = currentPlayer.roundBet === game.bet;
      if (isCheck) {
        if (!canCheck(game, playerIndex)) {
          throw new Error(`Invalid Action: Player ${playerIndex} cannot check.`);
        }
      } else {
        if (!canCall(game, playerIndex)) {
          throw new Error(`Invalid Action: Player ${playerIndex} cannot call.`);
        }
      }
      matchBet(game, playerIndex, game.bet);
    } else if (actionType === ACTION_COMPLETE_BET_RAISE) {
      const amount = getActionAmount(action) ?? 0;
      const isBet = game.bet === 0;

      if (isBet) {
        if (!canBet(game, playerIndex, amount)) {
          throw new Error(`Invalid Action: Player ${playerIndex} cannot bet.`);
        }
      } else {
        // Raise
        if (!canRaise(game, playerIndex, amount)) {
          throw new Error(`Invalid Action: Player ${playerIndex} cannot raise.`);
        }
      }
      makeBet(game, playerIndex, amount);
    } else {
      throw new Error(`Invalid action type: ${actionType}`);
    }
    currentPlayer.roundAction = action;
    game.lastPlayerAction = action;
  }

  detectRunout(game);
  completeBetting(game);
  completeHand(game);

  //  game.isRunOut = isRunOut(game);

  game.nextPlayerIndex = getCurrentPlayerIndex(game);

  if (!game.venue.includes('fuzz')) {
    if (isPlayerAction(action) && getActionType(action) !== ACTION_SHOW_MUCK) {
      // Record stats after the action is applied
      recordStatsAfter(game, action);
    }
    // First, record stats BEFORE the action is applied
    if (game.nextPlayerIndex != -1 && !game.isShowdown) {
      recordStatsBefore(game, game.nextPlayerIndex);
    }

    if (game.isComplete) {
      recordStatsFinish(game);
    }
  }

  // Record the timestamp of the action
  if (getActionType(action) !== ACTION_MESSAGE) {
    game.lastTimestamp = getActionTimestamp(action) || Date.now();
  }
  return game;
}

/**
 * Resets player states for a new street
 */
export function advanceStreet(game: Game): void {
  // Update street based on number of board cards
  if (game.board.length === 3) {
    game.street = 'flop';
  } else if (game.board.length === 4) {
    game.street = 'turn';
  } else if (game.board.length === 5) {
    game.street = 'river';
  }

  resetBettingState(game);
  game.lastBetAction = undefined;
  game.lastPlayerAction = undefined;
  game.isBettingComplete = false;
  // Only reset state for players who are still in the hand and not all-in
  // Skip resetting hasActed in multi-way all-in situations
  game.players.forEach((p: Player) => {
    p.roundInvestments = 0;
    p.roundAction = null;
    if (!p.hasFolded && !p.isAllIn) {
      p.hasActed = false;
    }
  });
} /**
 * Determines if dealer intervention is needed
 */
export function isAwaitingDealer(game: Game): boolean {
  // Get active players (not folded)
  const activePlayers = getRemainingPlayers(game);

  // Condition 1: Missing hole cards
  // We need to deal if any player is missing cards, regardless of initial deal phase
  if (activePlayers.some((p: Player) => p.cards.length === 0)) {
    return true;
  }

  // Condition 2: Single player remaining (need to award pot)
  if (activePlayers.length === 1) {
    return true;
  }

  // Condition 3: All-in situations (need to deal remaining streets)
  if (game.isRunOut && game.street !== 'river') {
    return true;
  }

  // Check if betting round is complete
  const allPlayersActed = activePlayers.every((p: Player) => p.hasActed || p.isAllIn);
  const allPlayersBetsMatch = activePlayers.every(
    (p: Player) => p.roundBet === game.bet || p.hasFolded || p.isAllIn
  );

  // Condition 4: Betting round completion
  if ((!game.isBettingComplete || game.street !== 'river') && !game.isShowdown) {
    // Condition 5: No betting or last bet was called
    if (allPlayersActed && allPlayersBetsMatch) {
      const lastBetWasCalled =
        game.lastBetAction &&
        activePlayers.every((p: Player) => p.hasFolded || p.isAllIn || p.roundBet === game.bet);

      if (!game.lastBetAction || lastBetWasCalled) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if we're in a multi-way all-in situation where no more betting is possible.
 * This happens when:
 * 1. At least one player is all-in
 * 2. All remaining players have matched the all-in amount
 *
 * @example
 * - One player all-in, others matched -> true
 * - One player all-in, others still betting -> false
 * - All players all-in -> true
 * - No all-in players -> false
 */

export function isRunOut(game: Game): boolean {
  const activePlayers = getRemainingPlayers(game);
  const allInPlayers = activePlayers.filter((p: Player) => p.isAllIn);
  const activeNotAllInPlayers = activePlayers.filter((p: Player) => !p.isAllIn);

  // Get the highest all-in amount
  const maxAllInBet = Math.max(...allInPlayers.map(p => p.totalBet));

  // Check if all non-all-in players have matched the highest all-in bet
  return activeNotAllInPlayers.every(
    (p: Player) => p.totalBet >= maxAllInBet && activeNotAllInPlayers.length == 1
  );
}

export function detectRunout(game: Game) {
  if (game.street !== 'river') {
    game.isRunOut = isRunOut(game);
    if (game.isRunOut) {
      resetBettingState(game);
    }
  }
}
