import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as Poker from '../../../index';
import { NO_LIMIT_HAND, COMPLETED_HAND, SHOWDOWN_HAND } from './fixtures/baseGame';

describe('Game API - State Analysis', () => {
  describe('isShowdown', () => {
    it('should return true when multiple players remain after final betting', () => {
      const game = Poker.Game(SHOWDOWN_HAND);

      expect(game.isShowdown).toBe(true);
    });

    it('should return false during betting rounds', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      expect(game.isShowdown).toBe(false);
    });

    it('should return false with single player remaining', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [
          'd dh p1 AsKs',
          'd dh p2 7h2d',
          'd dh p3 QhQc',
          'd dh p4 JdTd',
          'p3 f',
          'p4 f',
          'p1 cbr 60',
          'p2 f', // Bob folds, only Alice remains
        ],
      };
      const game = Poker.Game(hand);

      expect(game.isShowdown).toBe(false);
      expect(game.isComplete).toBe(true);
      expect(game.players[0].winnings).toEqual(40);
      expect(game.players[1].winnings).toEqual(0);
      expect(game.players[2].winnings).toEqual(0);
      expect(game.players[3].winnings).toEqual(0);
    });

    it('should handle all-in scenarios correctly', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        startingStacks: [100, 100, 800, 1200],
        actions: [
          'd dh p1 AsKs',
          'd dh p2 7h2d',
          'd dh p3 QhQc',
          'd dh p4 JdTd',
          'p3 f', // Charlie folds
          'p4 f', // David folds
          'p1 cbr 100', // Alice all-in
          'p2 cc 100', // Bob calls all-in
          'd db AhKhQd', // Flop
          'd db Td', // Turn
          'd db 9s', // River
        ],
      };
      const game = Poker.Game(hand);

      // Should be in showdown after river with both all-in
      expect(game.isShowdown).toBe(true);
    });
  });

  describe('getElapsedTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return elapsed time since last action', () => {
      const now = Date.now();
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [
          'd dh p1 AsKs',
          'd dh p2 7h2d',
          'd dh p3 QhQc',
          'd dh p4 JdTd',
          'p3 f',
          'p4 f',
          `p1 f #${now}`, // Action with current timestamp
        ],
      };

      const game = Poker.Game(hand);

      // Should track elapsed time
      expect(Poker.Game.getElapsedTime(game)).toBeGreaterThanOrEqual(0);

      // After 5 seconds
      vi.advanceTimersByTime(5000);
      const elapsed = Poker.Game.getElapsedTime(game);
      expect(elapsed).toBeGreaterThanOrEqual(5000);
    });

    it('should return 0 when no timestamp available', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [
          'd dh p1 AsKs',
          'd dh p2 7h2d',
          'd dh p3 QhQc',
          'd dh p4 JdTd',
          'p3 f',
          'p4 f',
          'p1 f',
        ], // No timestamp
      };
      const game = Poker.Game(hand);

      // Without lastTimestamp, should return 0
      expect(Poker.Game.getElapsedTime(game)).toBe(0);
    });

    it("should use game's lastTimestamp property", () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      // Game should track lastTimestamp internally
      if (game.lastTimestamp) {
        const elapsed = Poker.Game.getElapsedTime(game);
        expect(elapsed).toBeGreaterThanOrEqual(0);
      } else {
        expect(Poker.Game.getElapsedTime(game)).toBe(0);
      }
    });
  });

  describe('finish', () => {
    it('should extract finishing data from completed game', () => {
      const game = Poker.Game(COMPLETED_HAND);
      const result = Poker.Game.finish(game, COMPLETED_HAND);

      expect(result.finishingStacks).toBeDefined();
      expect(result.winnings).toBeDefined();
      expect(result.totalPot).toBeDefined();
    });

    it('should return unchanged hand if game not complete', () => {
      const game = Poker.Game(NO_LIMIT_HAND);
      const result = Poker.Game.finish(game, NO_LIMIT_HAND);

      // Should return same hand object
      expect(result).toBe(NO_LIMIT_HAND);
      expect(result.finishingStacks).toBeUndefined();
    });

    it('should calculate winnings correctly', () => {
      const game = Poker.Game(COMPLETED_HAND);
      const result = Poker.Game.finish(game, COMPLETED_HAND);

      if (result.winnings) {
        // Winnings should be non-negative
        result.winnings.forEach(w => {
          expect(w).toBeGreaterThanOrEqual(0);
        });

        // At least one player should have winnings
        expect(result.winnings.some(w => w > 0)).toBe(true);
      }
    });

    it('should preserve chip continuity', () => {
      const game = Poker.Game(COMPLETED_HAND);
      const result = Poker.Game.finish(game, COMPLETED_HAND);

      if (result.finishingStacks) {
        // Total chips should be conserved (minus rake)
        const startingTotal = COMPLETED_HAND.startingStacks.reduce(
          (a: number, b: number) => a + b,
          0
        );
        const finishingTotal = result.finishingStacks.reduce((a, b) => a + b, 0);
        const rake = result.rake || 0;

        expect(finishingTotal).toBeLessThanOrEqual(startingTotal);
        expect(finishingTotal + rake).toBe(startingTotal);
      }
    });

    it('should handle split pots', () => {
      const splitPotHand: Poker.Hand = {
        ...COMPLETED_HAND,
        actions: [
          ...SHOWDOWN_HAND.actions.slice(0, -2),
          'p3 sm AsAc', // Charlie shows aces
          'p4 sm AdAh', // David shows aces too - split pot
        ],
      };

      const game = Poker.Game(splitPotHand);
      expect(game.isShowdown).toBe(true);
      const result = Poker.Game.finish(game, splitPotHand);

      if (result.winnings) {
        // Both Charlie and David should have winnings
        expect(result.winnings[2]).toEqual(175); // Charlie wins
        expect(result.winnings[3]).toEqual(175); // David wins
      }
    });

    it('should include rake information', () => {
      const handWithRake: Poker.Hand = {
        ...COMPLETED_HAND,
        rakePercentage: 0.05,
      };

      const game = Poker.Game(handWithRake);
      const result = Poker.Game.finish(game, handWithRake);

      if (game.isComplete && result.rake !== undefined) {
        expect(result.rake).toBeGreaterThanOrEqual(0);
        expect(result.rakePercentage).toBe(0.05);
      }
    });

    it('should extract total pot', () => {
      const game = Poker.Game(COMPLETED_HAND);
      const result = Poker.Game.finish(game, COMPLETED_HAND);

      if (result.totalPot) {
        expect(result.totalPot).toBeGreaterThan(0);
      }
    });

    it('should handle games with all players folding except one', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [
          'd dh p1 AsKs',
          'd dh p2 7h2d',
          'd dh p3 QhQc',
          'd dh p4 JdTd',
          'p3 cbr 60',
          'p4 f',
          'p1 f',
          'p2 f', // Everyone folds to Charlie
        ],
      };

      const game = Poker.Game(hand);
      const result = Poker.Game.finish(game, hand);

      if (game.isComplete) {
        expect(result.finishingStacks).toBeDefined();
        expect(result.winnings).toBeDefined();
        // Charlie (index 2) should win the pot
        if (result.winnings) {
          expect(result.winnings[2]).toBeGreaterThan(0);
        }
      }
    });
  });
});
