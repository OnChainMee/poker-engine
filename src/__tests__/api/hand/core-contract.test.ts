import { describe, expect, it } from 'vitest';
import * as Poker from '../../../index';
import { BASE_HAND } from './fixtures/baseHand';

/**
 * Core Contract Tests for Hand API
 *
 * Purpose: Validate that Hand namespace methods follow core architectural contracts:
 * 1. Immutability - Never mutate input data
 * 2. Data Integrity - All transformations preserve information
 * 3. Determinism - Same inputs produce same outputs
 *
 * All tests use BASE_HAND as foundation for consistency
 */
describe('Hand Core Contracts', () => {
  describe('Immutability Contract', () => {
    it('should never mutate input Hand during operations', () => {
      const hand = Poker.Hand(BASE_HAND);
      const originalJson = JSON.stringify(hand);

      // Test constructor
      Poker.Hand(hand);
      expect(JSON.stringify(hand)).toBe(originalJson);

      // Test with nested modifications
      const modified = Poker.Hand({
        ...hand,
        venue: 'TestVenue',
        players: [...hand.players, 'David'],
        actions: [...hand.actions, 'p1 f'],
        antes: [0, 0, 0, 0],
        startingStacks: [1000, 1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20, 0],
      });
      expect(JSON.stringify(hand)).toBe(originalJson);
      expect(modified.venue).toBe('TestVenue');
      expect(modified.players).toHaveLength(4);
      expect(modified.actions).toHaveLength(BASE_HAND.actions.length + 1);

      // Test with array modifications
      const withArrayMods = Poker.Hand({
        ...(hand as Poker.NoLimitHand),
        minBet: (hand.minBet as number) * 2, // Double minBet to match doubled blinds
        startingStacks: hand.startingStacks.map(s => s * 2),
        blindsOrStraddles: hand.blindsOrStraddles.map(b => b * 2),
      });
      expect(JSON.stringify(hand)).toBe(originalJson);
      expect(withArrayMods.startingStacks).toEqual([2000, 2000, 2000]);
      expect(withArrayMods.blindsOrStraddles).toEqual([0, 20, 40]);

      // Original arrays should be unchanged
      expect(hand.startingStacks).toEqual(BASE_HAND.startingStacks);
      expect(hand.blindsOrStraddles).toEqual(BASE_HAND.blindsOrStraddles);

      // Test with private fields
      const withPrivates = Poker.Hand({
        ...hand,
        _venueIds: ['id1', 'id2', 'id3'],
        _customField: 'test',
      });
      expect(JSON.stringify(hand)).toBe(originalJson);
      expect(withPrivates._venueIds).toEqual(['id1', 'id2', 'id3']);
      expect(hand._venueIds).toBeUndefined();
    });
  });

  describe('Data Integrity Contract', () => {
    it('should preserve all fields when constructing from partial data', () => {
      const partial = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [10, 20],
        minBet: 20,
        antes: [0, 0],
      };

      const hand = Poker.Hand(partial);
      expect(hand.variant).toBe(partial.variant);
      expect(hand.players).toEqual(partial.players);
      expect(hand.startingStacks).toEqual(partial.startingStacks);
      expect(hand.blindsOrStraddles).toEqual(partial.blindsOrStraddles);
      expect(hand.minBet).toBe(partial.minBet);
    });

    it('should maintain all original fields including private ones', () => {
      const handWithPrivates = {
        ...BASE_HAND,
        _venueIds: ['id1', 'id2', 'id3'],
        _customField: 'preserved',
      };

      const result = Poker.Hand(handWithPrivates);
      expect(result._venueIds).toEqual(['id1', 'id2', 'id3']);
      expect(result._customField).toBe('preserved');
    });
  });

  describe('Deterministic Behavior Contract', () => {
    it('should produce identical results for identical inputs', () => {
      const hand1 = Poker.Hand(BASE_HAND);
      const hand2 = Poker.Hand(BASE_HAND);

      expect(JSON.stringify(hand1)).toBe(JSON.stringify(hand2));
    });

    it('should consistently handle variant-specific fields', () => {
      const noLimit = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [10, 20],
        minBet: 20,
        antes: [0, 0],
      });

      const fixedLimit = Poker.Hand({
        variant: 'FT',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [10, 20],
        smallBet: 20,
        bigBet: 40,
        antes: [0, 0],
      });

      const stud = Poker.Hand({
        variant: 'F7S',
        players: ['Alice', 'Bob'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
        antes: [5, 5],
        bringIn: 10,
        smallBet: 20,
        bigBet: 40,
      });

      expect(noLimit.variant).toBe('NT');
      expect(noLimit.minBet).toBe(20);
      expect(fixedLimit.variant).toBe('FT');
      expect(fixedLimit.smallBet).toBe(20);
      expect(fixedLimit.bigBet).toBe(40);
      expect(stud.variant).toBe('F7S');
      expect(stud.bringIn).toBe(10);
    });
  });
});
