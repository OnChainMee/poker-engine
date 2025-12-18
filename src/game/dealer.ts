/**
 * @instructions
 * Keep dealer actions pure and functional.
 * Do not introduce state management.
 * Follow existing action format.
 */

import type { Game } from '../Game';
import type { Action, Player } from '../types';
import { getRemainingPlayers } from './position';

/**
 * Generates a shuffled deck of cards using a seed for deterministic shuffling
 */
function generateDeck(seed: number): string[] {
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const suits = ['h', 'd', 'c', 's'];
  const deck = [] as string[];

  // Create deck
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(rank + suit);
    }
  }

  // Shuffle using Fisher-Yates with seeded random
  let rng = seed;
  for (let i = deck.length - 1; i > 0; i--) {
    // Simple LCG for deterministic random numbers
    rng = (1103515245 * rng + 12345) & 0x7fffffff;
    const j = rng % (i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

/**
 * Gets the next N cards from the deck, using the table's seed and usedCards
 */
export function getNextCards(game: Game, count: number): string[] {
  if (game.seed === undefined) {
    throw new Error('Table seed is undefined');
  }
  const deck = generateDeck(game.seed);
  const cards = deck.slice(game.usedCards, game.usedCards + count);
  return cards;
}

/**
 * Deals hole cards to the next player who needs them
 */
export function dealHoleCardsFromDeck(game: Game): Action | null {
  // Deal to players in order
  for (let i = 0; i < game.players.length; i++) {
    if (game.players[i].cards.length === 0 && !game.players[i].isInactive) {
      const cards = getNextCards(game, 2);
      return `d dh p${i + 1} ${cards.join('')} #${Date.now()}` as Action;
    }
  }
  return null;
}

/**
 * Deals the next street of community cards
 */
export function dealStreet(game: Game): Action {
  const cardsNeeded = game.board.length === 0 ? 3 : 1;
  const cards = getNextCards(game, cardsNeeded);
  return `d db ${cards.join('')} #${Date.now()}` as Action;
}

/**
 * Shows next player's cards at showdown
 */
export function showCards(game: Game): Action | null {
  // Find next player who hasn't shown cards yet
  const nextPlayerIndex = game.nextPlayerIndex;

  if (nextPlayerIndex === -1) return null;

  const player = game.players[nextPlayerIndex];
  return `p${nextPlayerIndex + 1} sm ${player.cards.join('')} #${Date.now()}` as Action;
}

/**
 * Determines which dealer action to take based on table state.
 * Assumes it's dealer's turn (getCurrentPlayerIndex returned -1).
 * Returns a single action without applying it to the game.
 *
 * @instructions
 * This function ONLY checks:
 * 1. Missing hole cards - deal to next player
 * 2. Single player remaining - no more dealing needed
 * 3. All-in situations - deal all remaining streets
 * 4. Normal betting - deal next street if all acted
 * 5. Showdown - show cards
 *
 * It does NOT:
 * - Check bet amounts (only hasActed flags)
 * - Apply actions to table
 * - Handle side pots
 * - Reset flags
 */
export function deal(game: Game): Action | null {
  const activePlayers = getRemainingPlayers(game);
  // 1. If some players don't have cards yet, deal next hole card
  if (activePlayers.some((p: Player) => p.cards.length === 0)) {
    return dealHoleCardsFromDeck(game);
  }

  // 2. If all players but one have folded, no need to deal more cards
  if (activePlayers.length === 1) {
    return null;
  }

  // 3. Check if we should deal next street
  const isAllInSituation = game.isRunOut;
  const shouldDeal = isAllInSituation || game.isBettingComplete;

  if (shouldDeal) {
    if (game.board.length < 5) {
      return dealStreet(game);
    }
    return showCards(game);
  }

  return null;
}
