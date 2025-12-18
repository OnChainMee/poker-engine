import type { Hand } from '../Hand';

/**
 * Checks if seats array is in ascending order
 */
function isSeatsAscending(seats: number[]): boolean {
  for (let i = 1; i < seats.length; i++) {
    if (seats[i] <= seats[i - 1]) {
      return false;
    }
  }
  return true;
}

/**
 * Ensures all player-related arrays are sorted by seat order.
 *
 * Three cases:
 * 1. No seats field or invalid: No sort needed
 * 2. Valid seats in ascending order (can have gaps): No sort needed
 * 3. Valid seats not in ascending order: Must sort all arrays
 *
 * @param hand - The hand to ensure seat ordering for
 * @returns Hand with arrays potentially reordered by seat
 */
export function ensureSeatOrder<T extends Hand>(hand: T): T {
  // Case 1: No seats field - assume sequential seating
  if (!hand.seats || hand.seats.length === 0) {
    return hand;
  }

  // Validate seats configuration - if invalid, skip sorting
  if (!validateSeats(hand.seats, hand.players.length)) {
    return hand;
  }

  // Case 2: Check if seats are already in ascending order
  if (isSeatsAscending(hand.seats)) {
    return hand;
  }

  // Case 3: Valid seats but not ascending - MUST SORT
  return sortHandBySeatOrder(hand);
}

/**
 * Sorts all player-related arrays based on seat order (ascending)
 */
function sortHandBySeatOrder<T extends Hand>(hand: T): T {
  // Create sorting indices based on seat order
  const seatIndices = hand
    .seats!.map((seat, index) => ({ seat, index }))
    .sort((a, b) => a.seat - b.seat);

  // Helper to reorder any array based on seat indices
  const reorder = <T>(arr: T[] | undefined): T[] | undefined => {
    if (!arr) return undefined;
    return seatIndices.map(({ index }) => arr[index]);
  };

  // Helper for required arrays (always defined)
  const reorderRequired = <T>(arr: T[]): T[] => {
    return seatIndices.map(({ index }) => arr[index]);
  };

  // Create new hand with all arrays reordered
  const sortedHand: T = {
    ...hand,
    // Required arrays
    players: reorderRequired(hand.players),
    startingStacks: reorderRequired(hand.startingStacks),
    blindsOrStraddles: reorderRequired(hand.blindsOrStraddles),
    seats: seatIndices.map(({ seat }) => seat), // Now in ascending order

    // Optional arrays that should exist
    antes: hand.antes ? reorderRequired(hand.antes) : [],

    // Optional arrays
    _inactive: reorder(hand._inactive),
    _intents: reorder(hand._intents),
    _deadBlinds: reorder(hand._deadBlinds),
    _venueIds: reorder(hand._venueIds),
    winnings: reorder(hand.winnings),
    finishingStacks: reorder(hand.finishingStacks),
    timeBanks: reorder(hand.timeBanks),
    _heroIds: reorder(hand._heroIds),
  };

  return sortedHand;
}

/**
 * Validates seat configuration for poker table
 */
export function validateSeats(seats: number[] | undefined, playerCount: number): boolean {
  // No seats is valid (implies sequential)
  if (!seats || seats.length === 0) {
    return true;
  }

  // Must match player count
  if (seats.length !== playerCount) {
    return false;
  }

  // All seats must be positive integers in valid poker range [1-9]
  if (!seats.every(seat => Number.isInteger(seat) && seat >= 1 && seat <= 9)) {
    return false;
  }

  // No duplicate seats
  const uniqueSeats = new Set(seats);
  if (uniqueSeats.size !== seats.length) {
    return false;
  }

  return true;
}

/**
 * Creates default sequential seats for a given player count
 */
export function createDefaultSeats(playerCount: number): number[] {
  return Array.from({ length: playerCount }, (_, i) => i + 1);
}
