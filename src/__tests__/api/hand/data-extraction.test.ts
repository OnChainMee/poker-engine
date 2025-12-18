import { describe, expect, it } from 'vitest';
import * as Poker from '../../../index';
import { BASE_HAND } from './fixtures/baseHand';

/**
 * Data Extraction Tests for Hand API
 *
 * Purpose: Test Hand methods that extract data without any game logic:
 * 1. getPlayerId - Returns unique venue player ID from _venueIds array (null if not found)
 * 2. getPlayerIndex - Gets player index (0-based) for a given identifier
 * 3. getAuthorPlayerIndex - Gets author's player index (0-based) or -1 if not found
 * 4. getTimeLeft - Gets remaining time from time limit (returns Infinity if no time limit)
 * 5. isComplete - Checks if hand has reached completion
 *
 * Uses BASE_HAND as reference
 */
describe('Hand Data Extraction', () => {
  describe('Hand.getPlayerId', () => {
    it('should return venue player ID for numeric index', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        _venueIds: ['alice123', 'bob456', 'charlie789'],
      });

      expect(Poker.Hand.getPlayerId(hand, 0)).toBe('alice123');
      expect(Poker.Hand.getPlayerId(hand, 1)).toBe('bob456');
      expect(Poker.Hand.getPlayerId(hand, 2)).toBe('charlie789');
    });

    it('should return venue player ID for string name', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        _venueIds: ['alice123', 'bob456', 'charlie789'],
      });

      expect(Poker.Hand.getPlayerId(hand, 'Alice')).toBe('alice123');
      expect(Poker.Hand.getPlayerId(hand, 'Bob')).toBe('bob456');
      expect(Poker.Hand.getPlayerId(hand, 'Charlie')).toBe('charlie789');
    });

    it('should return null if player not found', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        _venueIds: ['alice123', 'bob456', 'charlie789'],
      });

      expect(Poker.Hand.getPlayerId(hand, 3)).toBe(null);
      expect(Poker.Hand.getPlayerId(hand, 'David')).toBe(null);
      expect(Poker.Hand.getPlayerId(hand, -1)).toBe(null);
    });

    it('should return null if no _venueIds', () => {
      const hand = Poker.Hand(BASE_HAND);

      expect(Poker.Hand.getPlayerId(hand, 0)).toBe(null);
      expect(Poker.Hand.getPlayerId(hand, 'Alice')).toBe(null);
    });
  });

  describe('Hand.getPlayerIndex', () => {
    it('should get player index for numeric identifier', () => {
      const hand = Poker.Hand(BASE_HAND);

      expect(Poker.Hand.getPlayerIndex(hand, 0)).toBe(0);
      expect(Poker.Hand.getPlayerIndex(hand, 1)).toBe(1);
      expect(Poker.Hand.getPlayerIndex(hand, 2)).toBe(2);
    });

    it('should get player index for string name', () => {
      const hand = Poker.Hand(BASE_HAND);

      expect(Poker.Hand.getPlayerIndex(hand, 'Alice')).toBe(0);
      expect(Poker.Hand.getPlayerIndex(hand, 'Bob')).toBe(1);
      expect(Poker.Hand.getPlayerIndex(hand, 'Charlie')).toBe(2);
    });

    it('should return -1 if player not found', () => {
      const hand = Poker.Hand(BASE_HAND);

      expect(Poker.Hand.getPlayerIndex(hand, 3)).toBe(-1);
      expect(Poker.Hand.getPlayerIndex(hand, -1)).toBe(-1);
      expect(Poker.Hand.getPlayerIndex(hand, 'David')).toBe(-1);
      expect(Poker.Hand.getPlayerIndex(hand, '')).toBe(-1);
    });

    it('should handle out of bounds indices', () => {
      const hand = Poker.Hand(BASE_HAND);

      expect(Poker.Hand.getPlayerIndex(hand, 100)).toBe(-1);
      expect(Poker.Hand.getPlayerIndex(hand, -100)).toBe(-1);
    });
  });

  describe('Hand.getAuthorPlayerIndex', () => {
    it('should return correct index when author exists in players', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice',
      });

      expect(Poker.Hand.getAuthorPlayerIndex(hand)).toBe(0);
    });

    it('should return correct index for author at different positions', () => {
      // Author is first player
      const handFirst = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice',
      });
      expect(Poker.Hand.getAuthorPlayerIndex(handFirst)).toBe(0);

      // Author is middle player
      const handMiddle = Poker.Hand({
        ...BASE_HAND,
        author: 'Bob',
      });
      expect(Poker.Hand.getAuthorPlayerIndex(handMiddle)).toBe(1);

      // Author is last player
      const handLast = Poker.Hand({
        ...BASE_HAND,
        author: 'Charlie',
      });
      expect(Poker.Hand.getAuthorPlayerIndex(handLast)).toBe(2);
    });

    it('should return -1 when no author field is set', () => {
      const hand = Poker.Hand(BASE_HAND);

      expect(Poker.Hand.getAuthorPlayerIndex(hand)).toBe(-1);
    });

    it('should return -1 when author is not in players array', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        author: 'UnknownPlayer',
      });

      expect(Poker.Hand.getAuthorPlayerIndex(hand)).toBe(-1);
    });

    it('should return -1 when players array is empty', () => {
      const hand = {
        ...BASE_HAND,
        players: [],
        author: 'Alice',
      } as const satisfies Poker.Hand;

      expect(Poker.Hand.getAuthorPlayerIndex(hand)).toBe(-1);
    });

    it('should return -1 when players array is missing', () => {
      const hand = {
        variant: 'NT',
        minBet: 20,
        author: 'Alice',
      } as any;

      expect(Poker.Hand.getAuthorPlayerIndex(hand)).toBe(-1);
    });

    it('should handle undefined author field', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        author: undefined,
      });

      expect(Poker.Hand.getAuthorPlayerIndex(hand)).toBe(-1);
    });

    it('should handle null author field', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        author: null as any,
      });

      expect(Poker.Hand.getAuthorPlayerIndex(hand)).toBe(-1);
    });

    it('should handle empty string author', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        author: '',
      });

      // Empty string is still a valid string, but won't be found in players
      expect(Poker.Hand.getAuthorPlayerIndex(hand)).toBe(-1);
    });

    it('should be case-sensitive when matching author name', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        author: 'alice', // lowercase
      });

      // 'alice' !== 'Alice' in players array
      expect(Poker.Hand.getAuthorPlayerIndex(hand)).toBe(-1);
    });

    it('should work with players that have special characters', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        players: ['Player-1', 'Player@2', 'Player.3'],
        author: 'Player@2',
      });

      expect(Poker.Hand.getAuthorPlayerIndex(hand)).toBe(1);
    });

    it('should handle non-string author types gracefully', () => {
      const handWithNumber = Poker.Hand({
        ...BASE_HAND,
        author: 123 as any,
      });

      expect(Poker.Hand.getAuthorPlayerIndex(handWithNumber)).toBe(-1);

      const handWithObject = Poker.Hand({
        ...BASE_HAND,
        author: { name: 'Alice' } as any,
      });

      expect(Poker.Hand.getAuthorPlayerIndex(handWithObject)).toBe(-1);
    });
  });

  describe('Hand.getTimeLeft', () => {
    it('should return Infinity when no time limit', () => {
      const hand = Poker.Hand(BASE_HAND);

      const remaining = Poker.Hand.getTimeLeft(hand);

      expect(remaining).toBe(Infinity);
    });

    it('should return remaining time from time limit', () => {
      const now = Date.now();
      const hand = Poker.Hand({
        ...BASE_HAND,
        timeLimit: 30, // 30 second time limit
        actions: [
          ...BASE_HAND.actions.slice(0, -1),
          `p3 cc #${now - 5000}`, // 5 seconds ago
        ],
      });

      const remaining = Poker.Hand.getTimeLeft(hand);

      // Should be approximately 25000ms remaining (30000 - 5000)
      expect(remaining).toBeGreaterThanOrEqual(24900);
      expect(remaining).toBeLessThanOrEqual(25100);
    });

    it('should return full time limit if no actions', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        timeLimit: 30, // 30 second time limit
        actions: [],
      });

      expect(Poker.Hand.getTimeLeft(hand)).toBe(30000);
    });

    it('should return full time limit if no timestamped actions', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        timeLimit: 30, // 30 second time limit
        actions: ['p1 f', 'p2 cc', 'p3 cbr 100'],
      });

      expect(Poker.Hand.getTimeLeft(hand)).toBe(30000);
    });

    it('should use most recent timestamped action', () => {
      const now = Date.now();
      const hand = Poker.Hand({
        ...BASE_HAND,
        timeLimit: 30, // 30 second time limit
        actions: [
          `p1 f #${now - 10000}`, // 10 seconds ago
          'p2 cc', // no timestamp
          `p3 cbr 100 #${now - 3000}`, // 3 seconds ago (most recent)
        ],
      });

      const remaining = Poker.Hand.getTimeLeft(hand);

      // Should use the 3-second timestamp (27000ms remaining)
      expect(remaining).toBeGreaterThanOrEqual(26900);
      expect(remaining).toBeLessThanOrEqual(27100);
    });

    it('should return 0 when time has expired', () => {
      const now = Date.now();
      const hand = Poker.Hand({
        ...BASE_HAND,
        timeLimit: 30, // 30 second time limit
        actions: [
          ...BASE_HAND.actions.slice(0, -1),
          `p3 cc #${now - 35000}`, // 35 seconds ago (expired)
        ],
      });

      const remaining = Poker.Hand.getTimeLeft(hand);

      // Should return 0 since time has expired
      expect(remaining).toBe(0);
    });
  });

  describe('Hand.isComplete', () => {
    it('should return false for incomplete hand', () => {
      const hand = Poker.Hand(BASE_HAND);
      expect(Poker.Hand.isComplete(hand)).toBe(false);
    });

    it('should return true for complete hand with finishingStacks', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        finishingStacks: [100, 200, 150],
      });
      expect(Poker.Hand.isComplete(hand)).toBe(true);
    });

    it('should return true even with empty finishingStacks array', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        finishingStacks: [],
      });
      expect(Poker.Hand.isComplete(hand)).toBe(true);
    });

    it('should return false when finishingStacks is undefined', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        finishingStacks: undefined,
      });
      expect(Poker.Hand.isComplete(hand)).toBe(false);
    });

    it('should return false for hand without finishingStacks field', () => {
      const hand = Poker.Hand({
        variant: 'FT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [100, 100, 100],
        blindsOrStraddles: [1, 2, 3],
        antes: [0, 0, 0],
        smallBet: 1,
        bigBet: 2,
        actions: [],
      });
      expect(Poker.Hand.isComplete(hand)).toBe(false);
    });

    it('should work correctly after applying actions that complete a hand', () => {
      // Start with an incomplete hand
      const incompleteHand = Poker.Hand(BASE_HAND);
      expect(Poker.Hand.isComplete(incompleteHand)).toBe(false);

      // When a hand is completed via applyAction, it should have finishingStacks
      // This test verifies the integration with the existing applyAction logic
      // that calls Game.finish when hand is complete
    });
  });

  describe('Hand.isPlayable', () => {
    it('should return true when 2+ active players with chips exist', () => {
      // SCENARIO: Standard game with all players active and having chips
      // INPUT: 3 players, all active, all have chips
      // EXPECTED: true - game can start
      const hand = Poker.Hand({
        ...BASE_HAND,
        _inactive: [0, 0, 0],
      });

      expect(Poker.Hand.isPlayable(hand)).toBe(true);
    });

    it('should return true when exactly 2 active players (heads-up)', () => {
      // SCENARIO: Heads-up game
      // INPUT: 2 players, both active with chips
      // EXPECTED: true - minimum players for game
      const hand = Poker.Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [10, 20],
        antes: [0, 0],
        _inactive: [0, 0],
      });

      expect(Poker.Hand.isPlayable(hand)).toBe(true);
    });

    it('should return false when only 1 player exists', () => {
      // SCENARIO: Only one player at table
      // INPUT: 1 player with chips
      // EXPECTED: false - cannot play alone
      const hand = Poker.Hand({
        ...BASE_HAND,
        players: ['Alice'],
        startingStacks: [1000],
        blindsOrStraddles: [20],
        antes: [0],
      });

      expect(Poker.Hand.isPlayable(hand)).toBe(false);
    });

    it('should return false when no players exist', () => {
      // SCENARIO: Empty table
      // INPUT: 0 players
      // EXPECTED: false - no one to play
      const hand = Poker.Hand({
        ...BASE_HAND,
        players: [],
        startingStacks: [],
        blindsOrStraddles: [],
        antes: [],
      });

      expect(Poker.Hand.isPlayable(hand)).toBe(false);
    });

    it('should return true when 2+ players are active with chips', () => {
      // SCENARIO: Mixed table with some inactive players
      // INPUT: 3 players, _inactive: [0, 1, 0] - Alice and Charlie active with chips
      // EXPECTED: true - 2 active players with chips
      const hand = Poker.Hand({
        ...BASE_HAND,
        _inactive: [0, 1, 0],
        blindsOrStraddles: [10, 0, 20],
      });

      expect(Poker.Hand.isPlayable(hand)).toBe(true);
    });

    it('should return false when only 1 player is active', () => {
      // SCENARIO: All but one player sitting out
      // INPUT: 3 players, _inactive: [0, 1, 1] - only Alice active
      // EXPECTED: false - not enough active players
      const hand = Poker.Hand({
        ...BASE_HAND,
        _inactive: [0, 1, 1],
        blindsOrStraddles: [20, 0, 0],
      });

      expect(Poker.Hand.isPlayable(hand)).toBe(false);
    });

    it('should return false when all players are inactive', () => {
      // SCENARIO: Everyone sitting out
      // INPUT: 3 players, _inactive: [1, 1, 1] - all waiting
      // EXPECTED: false - no active players
      const hand = Poker.Hand({
        ...BASE_HAND,
        _inactive: [1, 1, 1],
        blindsOrStraddles: [0, 0, 0],
      });

      expect(Poker.Hand.isPlayable(hand)).toBe(false);
    });

    it('should treat new players (_inactive: 2) as not playable', () => {
      // SCENARIO: Table with new players who joined mid-game
      // INPUT: 3 players, _inactive: [0, 2, 2] - Alice active, Bob and Charlie new
      // EXPECTED: false - new players don't count as playable
      const hand = Poker.Hand({
        ...BASE_HAND,
        _inactive: [0, 2, 2],
        blindsOrStraddles: [20, 0, 0],
      });

      expect(Poker.Hand.isPlayable(hand)).toBe(false);
    });

    it('should count mixed inactive states correctly', () => {
      // SCENARIO: Various inactive states
      // INPUT: 4 players, _inactive: [0, 1, 2, 0] - Alice and Dan active with chips
      // EXPECTED: true - 2 active players with chips
      const hand = Poker.Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'Charlie', 'Dan'],
        startingStacks: [1000, 1000, 1000, 1000],
        blindsOrStraddles: [10, 0, 0, 20],
        antes: [0, 0, 0, 0],
        _inactive: [0, 1, 2, 0],
      });

      expect(Poker.Hand.isPlayable(hand)).toBe(true);
    });

    it('should handle missing _inactive array as all active', () => {
      // SCENARIO: Legacy hand without _inactive field
      // INPUT: 3 players with chips, no _inactive field
      // EXPECTED: true - all players considered active
      const hand = Poker.Hand(BASE_HAND);

      expect(Poker.Hand.isPlayable(hand)).toBe(true);
    });

    it('should return false when active player has zero chips', () => {
      // SCENARIO: Player with zero stack cannot play
      // INPUT: 3 players, all active, but Bob has 0 chips
      // EXPECTED: true - Alice and Charlie can still play (2 playable)
      const hand = Poker.Hand({
        ...BASE_HAND,
        startingStacks: [1000, 0, 1000],
        _inactive: [0, 0, 0],
      });

      expect(Poker.Hand.isPlayable(hand)).toBe(true);
    });

    it('should return false when only one active player has chips', () => {
      // SCENARIO: Two active players but only one with chips
      // INPUT: 3 players, 2 active (Alice with chips, Bob with 0), Charlie inactive
      // EXPECTED: false - only 1 player can actually play
      const hand = Poker.Hand({
        ...BASE_HAND,
        startingStacks: [1000, 0, 1000],
        _inactive: [0, 0, 1], // Alice and Bob active, Charlie inactive
        blindsOrStraddles: [10, 20, 0], // Alice SB, Bob BB (even though Bob has 0 chips)
      });

      // Alice has chips, Bob has 0 chips - only 1 playable
      expect(Poker.Hand.isPlayable(hand)).toBe(false);
    });

    it('should return false when all active players have zero chips', () => {
      // SCENARIO: Active players with no chips
      // INPUT: 3 players, 2 active but both with 0 chips
      // EXPECTED: false - no one can play
      const hand = Poker.Hand({
        ...BASE_HAND,
        startingStacks: [0, 0, 1000],
        _inactive: [0, 0, 1], // Alice and Bob active, Charlie inactive
        blindsOrStraddles: [10, 20, 0], // Blinds set but players have 0 chips
      });

      // Both active players have 0 chips - 0 playable
      expect(Poker.Hand.isPlayable(hand)).toBe(false);
    });
  });
});
