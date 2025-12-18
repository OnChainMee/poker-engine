import type { Game } from '../Game';
import type { Card, ValidCard } from '../types';
import { resetBettingState } from './betting';
import { calculateHandStrength } from './evaluation';
import { getRemainingPlayers } from './position';
import { finalizeStacks } from './stacks';

/**
 * Compares two poker hands and returns:
 * -1 if hand1 is worse than hand2
 * 0 if hands are equal
 * 1 if hand1 is better than hand2
 */
export function compareHands(hand1: ValidCard[], hand2: ValidCard[]): number {
  // calculateHandStrength returns lower numbers for better hands
  // so we need to reverse the comparison
  if (hand1.includes('??')) {
    throw new Error('Hand 1 contains unknown cards');
  }
  if (hand2.includes('??')) {
    throw new Error('Hand 2 contains unknown cards');
  }
  const strength1 = calculateHandStrength(hand1 as Card[]);
  const strength2 = calculateHandStrength(hand2 as Card[]);

  if (strength1 < strength2) return 1; // hand1 is better
  if (strength1 > strength2) return -1; // hand2 is better
  return 0; // equal hands
}

/**
 * Helper: completeHand
 * Handles hand completion by determining winners, distributing pot and resetting state
  // Complete hand if:
  // 1. Only one player remains
  // 2. All players are all-in and have acted
  // 3. Betting is complete on the river and all active players have shown cards
  // TODO: move it into completeHand
 */
export function completeHand(game: Game): void {
  if (game.isComplete) return;
  if (
    (game.isBettingComplete &&
      (!game.isShowdown || getRemainingPlayers(game).every(p => p.hasShownCards != null)) &&
      game.street == 'river') ||
    getRemainingPlayers(game).length === 1
  ) {
    finalizeStacks(game);

    // --- 5) Final cleanup ---
    //game.pot = 0; // All pots distributed
    game.isComplete = true;
    resetBettingState(game);
  }
}

/**
 * Determines if we're in showdown
 */
export function isShowdown(game: Game): boolean {
  if (game.isComplete) return false;
  if (game.board.length != 5) return false;
  if (game.street !== 'river') return false;
  const activePlayers = getRemainingPlayers(game);

  return activePlayers.length > 1 && activePlayers.some(p => p.hasShownCards == null);
}
