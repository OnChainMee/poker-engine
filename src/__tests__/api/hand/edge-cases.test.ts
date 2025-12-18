import { describe, expect, it } from 'vitest';
import {
  getActionAmount,
  getActionCards,
  getActionMessage,
  getActionPlayerIndex,
  getActionTimestamp,
  getActionType,
} from '../../../game/position';
import * as Poker from '../../../index';
import { BASE_HAND } from './fixtures/baseHand';

/**
 * Edge Cases Tests for Hand API
 *
 * Purpose: Test edge cases and boundary conditions for Hand methods
 * Note: We don't test invalid Hand field types - that's TypeScript's job
 * We do test broken action formats since they're runtime strings
 *
 * Uses BASE_HAND as reference
 */
describe('Hand Edge Cases', () => {
  describe('Method Edge Cases', () => {
    describe('getPlayerId edge cases', () => {
      it('should handle negative indices', () => {
        const hand = Poker.Hand({
          ...BASE_HAND,
          _venueIds: ['id1', 'id2', 'id3'],
        });

        expect(Poker.Hand.getPlayerId(hand, -1)).toBe(null);
        expect(Poker.Hand.getPlayerId(hand, -100)).toBe(null);
      });

      it('should handle very large indices', () => {
        const hand = Poker.Hand({
          ...BASE_HAND,
          _venueIds: ['id1', 'id2', 'id3'],
        });

        expect(Poker.Hand.getPlayerId(hand, 1000)).toBe(null);
        expect(Poker.Hand.getPlayerId(hand, 100_000)).toBe(null);
      });

      it('should handle empty _venueIds array', () => {
        const hand = Poker.Hand({
          ...BASE_HAND,
          _venueIds: [],
        });

        expect(Poker.Hand.getPlayerId(hand, 0)).toBe(null);
      });

      it('should handle sparse _venueIds array', () => {
        const hand = Poker.Hand({
          ...BASE_HAND,
          _venueIds: [undefined, 'id2', undefined] as any,
        });

        expect(Poker.Hand.getPlayerId(hand, 0)).toBe(null);
        expect(Poker.Hand.getPlayerId(hand, 1)).toBe('id2');
        expect(Poker.Hand.getPlayerId(hand, 2)).toBe(null);
      });
    });

    describe('getPlayerIndex edge cases', () => {
      it('should handle empty string name', () => {
        const hand = Poker.Hand(BASE_HAND);

        expect(Poker.Hand.getPlayerIndex(hand, '')).toBe(-1);
      });

      it('should handle special characters in name', () => {
        const hand = Poker.Hand({
          ...BASE_HAND,
          players: ['Player#1', 'Player@2', 'Player$3'],
        });

        expect(Poker.Hand.getPlayerIndex(hand, 'Player#1')).toBe(0);
        expect(Poker.Hand.getPlayerIndex(hand, 'Player@2')).toBe(1);
        expect(Poker.Hand.getPlayerIndex(hand, 'Player$3')).toBe(2);
      });

      it('should handle very long names', () => {
        const longName = 'A'.repeat(1000);
        const hand = Poker.Hand({
          ...BASE_HAND,
          players: [longName, 'Bob', 'Charlie'],
        });

        expect(Poker.Hand.getPlayerIndex(hand, longName)).toBe(0);
      });
    });

    describe('getTimeLeft edge cases', () => {
      it('should handle future timestamps', () => {
        const futureTime = Date.now() + 10000;
        const hand = Poker.Hand({
          ...BASE_HAND,
          timeLimit: 30, // 30 second time limit
          actions: [`p1 f #${futureTime}`],
        });

        const remaining = Poker.Hand.getTimeLeft(hand);

        // Future timestamp means negative elapsed time, so MORE remaining time than the limit
        expect(remaining).toBeGreaterThan(30000);
        expect(remaining).toBeLessThanOrEqual(40000); // Should be around 30000 + 10000
      });

      it('should handle invalid timestamps in actions', () => {
        const hand = Poker.Hand({
          ...BASE_HAND,
          timeLimit: 30, // 30 second time limit
          actions: ['p1 f #invalid', 'p2 cc #abc', 'p3 cbr 100 #'],
        });

        // Should return full time limit if no valid timestamp found
        expect(Poker.Hand.getTimeLeft(hand)).toBe(30000);
      });

      it('should handle very old timestamps', () => {
        const hand = Poker.Hand({
          ...BASE_HAND,
          timeLimit: 30, // 30 second time limit
          actions: [`p1 f #0000000000001`], // Valid 13-digit timestamp (1ms after epoch)
        });

        const remaining = Poker.Hand.getTimeLeft(hand);

        // Very old timestamp means time expired long ago
        expect(remaining).toBe(0);
      });

      it('should handle mixed timestamped and non-timestamped actions', () => {
        const now = Date.now();
        const hand = Poker.Hand({
          ...BASE_HAND,
          timeLimit: 30, // 30 second time limit
          actions: [
            'p1 f', // No timestamp
            `p2 cc #${now - 5000}`, // 5 seconds ago
            'p3 cbr 100', // No timestamp
          ],
        });

        const remaining = Poker.Hand.getTimeLeft(hand);

        // Should use the last timestamped action (5 seconds ago)
        // Remaining time should be around 25000ms (30000 - 5000)
        expect(remaining).toBeGreaterThanOrEqual(24900);
        expect(remaining).toBeLessThanOrEqual(25100);
      });
    });

    describe('merge edge cases', () => {
      it('should handle merging with empty hands', () => {
        const hand = Poker.Hand(BASE_HAND);
        const emptyHand = Poker.Hand({
          ...BASE_HAND,
          actions: [],
        });

        const merged1 = Poker.Hand.merge(hand, emptyHand);
        expect(merged1.actions).toEqual(BASE_HAND.actions);
      });

      it('should handle merging hands with conflicting metadata', () => {
        // Different venues - can't merge
        const hand1 = Poker.Hand({
          ...BASE_HAND,
          venue: 'Venue1',
        });

        const hand2 = Poker.Hand({
          ...BASE_HAND,
          venue: 'Venue2',
        });

        const merged = Poker.Hand.merge(hand1, hand2);
        // Should return first hand unchanged when venues differ
        expect(merged).toEqual(hand1);

        // Different currencies - can't merge
        const hand3 = Poker.Hand({
          ...BASE_HAND,
          currency: 'USD',
        });

        const hand4 = Poker.Hand({
          ...BASE_HAND,
          currency: 'EUR',
        });

        const merged2 = Poker.Hand.merge(hand3, hand4);
        // Should return first hand unchanged when currencies differ
        expect(merged2).toEqual(hand3);

        // Author field is always removed from merged hands
        const hand5 = Poker.Hand({
          ...BASE_HAND,
          author: 'Alice',
        });

        const hand6 = Poker.Hand({
          ...BASE_HAND,
          author: 'Bob',
        });

        const merged3 = Poker.Hand.merge(hand5, hand6);
        // Should merge successfully and always remove author field
        expect(merged3.author).toBeUndefined();
      });

      it('should reject merging hands with different variants', () => {
        const ntHand = Poker.Hand(BASE_HAND, {
          variant: 'NT',
          minBet: 20,
        });

        const ftHand = Poker.Hand(BASE_HAND, {
          variant: 'FT',
          smallBet: 10,
          bigBet: 20,
          blindsOrStraddles: [0, 5, 10], // FT: BB=smallBet=10, SB=5
        });
        const merged = Poker.Hand.merge(ntHand, ftHand);
        expect(merged).toEqual(ntHand);
      });

      it('should reject merging hands with different table/game IDs', () => {
        const hand1 = Poker.Hand({
          ...BASE_HAND,
          table: 'table-123',
        });

        const hand2 = Poker.Hand({
          ...BASE_HAND,
          table: 'table-456',
        });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);

        // Different game IDs
        const hand3 = Poker.Hand({
          ...BASE_HAND,
          hand: 123,
        });

        const hand4 = Poker.Hand({
          ...BASE_HAND,
          hand: 321,
        });

        const merged2 = Poker.Hand.merge(hand3, hand4);
        expect(merged2).toEqual(hand3);
      });

      it('should reject merging hands with different seeds', () => {
        const hand1 = Poker.Hand({
          ...BASE_HAND,
          seed: 12345,
        });

        const hand2 = Poker.Hand({
          ...BASE_HAND,
          seed: 67890,
        });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);
      });

      it('should reject merging hands with different player arrays', () => {
        // Different players
        const hand1 = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
        });

        const hand2 = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'David'],
        });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);

        // Different starting stacks
        const hand3 = Poker.Hand({
          ...BASE_HAND,
          startingStacks: [1000, 1000, 1000],
        });

        const hand4 = Poker.Hand({
          ...BASE_HAND,
          startingStacks: [1000, 1500, 1000],
        });

        const merged2 = Poker.Hand.merge(hand3, hand4);
        expect(merged2).toEqual(hand3);

        // Different blinds
        const hand5 = Poker.Hand({
          ...BASE_HAND,
          minBet: 20,
          blindsOrStraddles: [10, 20, 0],
        });

        const hand6 = Poker.Hand({
          ...BASE_HAND,
          minBet: 50,
          blindsOrStraddles: [25, 50, 0],
        });

        const merged3 = Poker.Hand.merge(hand5, hand6);
        expect(merged3).toEqual(hand5);
      });

      it('should reject merging hands with different betting limits', () => {
        // Different minBet for NT variant
        const hand1 = Poker.Hand({
          ...BASE_HAND,
          variant: 'NT',
          minBet: 20,
        } as Poker.Hand);

        const hand2 = Poker.Hand({
          ...BASE_HAND,
          variant: 'NT',
          minBet: 50,
          blindsOrStraddles: [0, 25, 50], // Match minBet: 50
        } as Poker.Hand);

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);

        // Different betting structure for FT variant
        const hand3 = Poker.Hand({
          variant: 'FT',
          players: ['Alice', 'Bob'],
          startingStacks: [1000, 1000],
          blindsOrStraddles: [5, 10], // FT: BB=smallBet=10, SB=5
          smallBet: 10,
          bigBet: 20,
          actions: [],
          antes: [0, 0],
        });

        const hand4 = Poker.Hand({
          variant: 'FT',
          players: ['Alice', 'Bob'],
          startingStacks: [1000, 1000],
          blindsOrStraddles: [10, 20], // FT: BB=smallBet=20, SB=10
          smallBet: 20,
          bigBet: 40,
          actions: [],
          antes: [0, 0],
        });

        const merged2 = Poker.Hand.merge(hand3, hand4);
        expect(merged2).toEqual(hand3);
      });

      it('should handle merging with undefined fields gracefully', () => {
        const hand1 = Poker.Hand({
          ...BASE_HAND,
          venue: 'Venue1',
        });

        const hand2 = Poker.Hand({
          ...BASE_HAND,
          // No venue field
        });

        const merged = Poker.Hand.merge(hand1, hand2);
        // Should succeed when only one has the field
        expect(merged.venue).toBe('Venue1');
        expect(merged.actions).toEqual(BASE_HAND.actions);
      });

      it('should prevent metadata overwrite', () => {
        const hand1 = Poker.Hand({
          ...BASE_HAND,
          time: '2024-01-01T10:00:00Z',
          timeLimit: 30,
          rake: 5,
        });

        const hand2 = Poker.Hand({
          ...BASE_HAND,
          timeLimit: 60,
          rake: 10,
          rakePercentage: 0.05,
          winnings: [100, 0, 0],
          time: '2024-01-01T10:01:00Z',
        });

        const merged = Poker.Hand.merge(hand1, hand2);

        // Should update all metadata from hand2
        expect(merged.time).toBe('2024-01-01T10:00:00Z');
        expect(merged.timeLimit).toBe(30);
        expect(merged.rake).toBe(5);
        expect(merged.rakePercentage).toBeUndefined();
        expect(merged.winnings).toBeUndefined();
      });
    });

    describe('isEqual edge cases', () => {
      it('should detect subtle differences', () => {
        const hand1 = Poker.Hand(BASE_HAND);
        const hand2 = Poker.Hand({
          ...BASE_HAND,
          seed: 12346, // Different by 1
        });

        expect(Poker.Hand.isEqual(hand1, hand2)).toBe(false);
      });
    });

    describe('personalize edge cases', () => {
      it('should handle invalid player identifier', () => {
        const hand = Poker.Hand(BASE_HAND);

        const personalized = Poker.Hand.personalize(hand, 'NonExistentPlayer');

        // Should return hand with author set to invalid player (observer)
        expect(personalized.author).toBe('NonExistentPlayer');

        // Observer can't see any hole cards
        const dealActions = personalized.actions.filter(a => getActionType(a) === 'dh');
        dealActions.forEach(action => {
          const cards = getActionCards(action);
          expect(cards).toEqual(['??', '??']); // No hole cards visible to observer
        });
      });

      it('should handle negative player index', () => {
        const hand = Poker.Hand(BASE_HAND);

        const personalized = Poker.Hand.personalize(hand, -1);

        // Should set empty author for invalid index
        expect(personalized.author).toBe('');

        // Hole cards should be hidden
        const dealActions = personalized.actions.filter(a => getActionType(a) === 'dh');
        dealActions.forEach(action => {
          const cards = getActionCards(action);
          expect(cards).toEqual(['??', '??']); // No hole cards visible
        });
      });
    });
  });

  describe('Action Extraction Utilities', () => {
    it('should properly extract all components from valid actions', () => {
      const testActions = [
        {
          action: 'd dh p1 AsKs #1700000000000',
          type: 'dh',
          player: 0,
          cards: ['As', 'Ks'],
          timestamp: 1700000000000,
        },
        {
          action: 'p2 cbr 100 #1700000001000',
          type: 'cbr',
          player: 1,
          amount: 100,
          timestamp: 1700000001000,
        },
        {
          action: 'p3 m Hello world! #1700000002000',
          type: 'm',
          player: 2,
          message: 'Hello world!',
          timestamp: 1700000002000,
        },
        {
          action: 'd db AhKhQd #1700000003000',
          type: 'db',
          cards: ['Ah', 'Kh', 'Qd'],
          timestamp: 1700000003000,
        },
      ];

      testActions.forEach(test => {
        if (test.type !== undefined) expect(getActionType(test.action)).toBe(test.type);
        if (test.player !== undefined) expect(getActionPlayerIndex(test.action)).toBe(test.player);
        if (test.cards !== undefined) expect(getActionCards(test.action)).toEqual(test.cards);
        if (test.amount !== undefined) expect(getActionAmount(test.action)).toBe(test.amount);
        if (test.message !== undefined) expect(getActionMessage(test.action)).toBe(test.message);
        if (test.timestamp !== undefined)
          expect(getActionTimestamp(test.action)).toBe(test.timestamp);
      });
    });

    it('should handle edge cases in action extraction', () => {
      // Actions at boundaries
      expect(getActionPlayerIndex('p0 f')).toBe(-1); // p0 would be -1 after conversion
      expect(getActionPlayerIndex('p10 f')).toBe(9); // p10 = index 9
      expect(getActionPlayerIndex('p999 f')).toBe(998); // p999 = index 998

      // Actions with no timestamp
      const actionNoTimestamp = 'p1 f';
      const beforeTime = Date.now();
      const timestamp = getActionTimestamp(actionNoTimestamp);
      const afterTime = Date.now();

      // Should return current time as default
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });
});
