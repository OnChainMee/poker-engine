import { describe, it, expect } from 'vitest';
import * as Poker from '../../../index';
import { NO_LIMIT_HAND } from './fixtures/baseGame';

describe('Game API - Player Management', () => {
  describe('getPlayerIndex', () => {
    it('should return index for valid player name', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      expect(Poker.Game.getPlayerIndex(game, 'Alice')).toBe(0);
      expect(Poker.Game.getPlayerIndex(game, 'Bob')).toBe(1);
      expect(Poker.Game.getPlayerIndex(game, 'Charlie')).toBe(2);
      expect(Poker.Game.getPlayerIndex(game, 'David')).toBe(3);
    });

    it('should return index for valid numeric index', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      expect(Poker.Game.getPlayerIndex(game, 0)).toBe(0);
      expect(Poker.Game.getPlayerIndex(game, 1)).toBe(1);
      expect(Poker.Game.getPlayerIndex(game, 2)).toBe(2);
      expect(Poker.Game.getPlayerIndex(game, 3)).toBe(3);
    });

    it('should return -1 for invalid player name', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      expect(Poker.Game.getPlayerIndex(game, 'NonExistent')).toBe(-1);
      expect(Poker.Game.getPlayerIndex(game, '')).toBe(-1);
    });

    it('should return -1 for out-of-bounds index', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      expect(Poker.Game.getPlayerIndex(game, -1)).toBe(-1);
      expect(Poker.Game.getPlayerIndex(game, 4)).toBe(-1);
      expect(Poker.Game.getPlayerIndex(game, 100)).toBe(-1);
    });

    it('should handle case-sensitive names', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      expect(Poker.Game.getPlayerIndex(game, 'alice')).toBe(-1); // lowercase
      expect(Poker.Game.getPlayerIndex(game, 'ALICE')).toBe(-1); // uppercase
      expect(Poker.Game.getPlayerIndex(game, 'Alice')).toBe(0); // exact match
    });
  });

  describe('hasActed', () => {
    it('should return true for players who acted in current round', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      // On the flop, we need to check who has acted
      // Charlie (p3) and David (p4) are still in the hand
      // Charlie should act first on the flop (small blind position)
      expect(game.street).toBe('flop');

      // Check if players have acted based on the actions in BASE_HAND
      // Charlie raised preflop (p3 cbr 60)
      // David called preflop (p4 cc 60)
      // But on the flop, they haven't acted yet
      expect(Poker.Game.hasActed(game, 'Charlie')).toBe(false); // New street, hasn't acted
      expect(Poker.Game.hasActed(game, 'David')).toBe(false); // New street, hasn't acted
    });

    it('should return true for players who acted preflop', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [
          'd dh p1 AsKs',
          'd dh p2 7h2d',
          'd dh p3 QhQc',
          'd dh p4 JdTd',
          'p3 cbr 60', // Charlie raised
          'p4 cc 60', // David called
        ],
      };
      const game = Poker.Game(hand);

      // Still preflop, Charlie and David have acted
      expect(Poker.Game.hasActed(game, 'Charlie')).toBe(true);
      expect(Poker.Game.hasActed(game, 'David')).toBe(true);
    });

    it("should return false for players who haven't acted in current round", () => {
      const freshHand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: ['d dh p1 AsKs', 'd dh p2 7h2d', 'd dh p3 QhQc', 'd dh p4 JdTd'],
      };
      const game = Poker.Game(freshHand);

      // No one has acted yet in betting round
      expect(Poker.Game.hasActed(game, 'Charlie')).toBe(false);
      expect(Poker.Game.hasActed(game, 'David')).toBe(false);
    });

    it('should return false for folded players', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      // Alice and Bob folded
      expect(Poker.Game.hasActed(game, 'Alice')).toBe(false);
      expect(Poker.Game.hasActed(game, 'Bob')).toBe(false);
    });

    it('should return false for invalid players', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      expect(Poker.Game.hasActed(game, 'NonExistent')).toBe(false);
      expect(Poker.Game.hasActed(game, -1)).toBe(false);
      expect(Poker.Game.hasActed(game, 10)).toBe(false);
      expect(Poker.Game.hasActed(game, '')).toBe(false);
    });

    it('should reset after new street', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [
          ...NO_LIMIT_HAND.actions,
          'p3 cc', // Charlie checks
          'p4 cc', // David checks
          'd db Td', // Turn - new street
        ],
      };
      const game = Poker.Game(hand);

      // After new street, hasActed should reset
      expect(game.street).toBe('turn');
      expect(Poker.Game.hasActed(game, 'Charlie')).toBe(false);
      expect(Poker.Game.hasActed(game, 'David')).toBe(false);
    });

    it('should handle all-in players', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        startingStacks: [100, 1500, 800, 1200],
        actions: [
          'd dh p1 AsKs',
          'd dh p2 7h2d',
          'd dh p3 QhQc',
          'd dh p4 JdTd',
          'p3 cc 100',
          'p4 cbr 100',
          'p1 cc 100', // Alice all-in
        ],
      };
      const game = Poker.Game(hand);

      expect(game.players[0].isAllIn).toBe(true);
      expect(Poker.Game.hasActed(game, 'Alice')).toBe(true);
      expect(Poker.Game.hasActed(game, 'Bob')).toBe(false);
    });

    it('should work with numeric indices', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: ['d dh p1 AsKs', 'd dh p2 7h2d', 'd dh p3 QhQc', 'd dh p4 JdTd', 'p3 cbr 60'],
      };
      const game = Poker.Game(hand);

      expect(Poker.Game.hasActed(game, 2)).toBe(true); // Charlie at index 2
      expect(Poker.Game.hasActed(game, 3)).toBe(false); // David hasn't acted yet
    });
  });

  describe('Player Resolution Edge Cases', () => {
    it('should handle games with duplicate player names', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        players: ['Alice', 'Alice', 'Bob', 'Bob'],
      };
      const game = Poker.Game(hand);

      // Should return first occurrence
      expect(Poker.Game.getPlayerIndex(game, 'Alice')).toBe(0);
      expect(Poker.Game.getPlayerIndex(game, 'Bob')).toBe(2);
    });

    it('should handle empty string as player name', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        players: ['', 'Bob', 'Charlie', 'David'],
      };
      const game = Poker.Game(hand);

      expect(Poker.Game.getPlayerIndex(game, '')).toBe(0);
    });

    it('should distinguish between number 0 and invalid index', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      expect(Poker.Game.getPlayerIndex(game, 0)).toBe(0); // Valid index
      expect(Poker.Game.getPlayerIndex(game, -0)).toBe(0); // -0 is same as 0
    });
  });
});
