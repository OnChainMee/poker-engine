import { describe, expect, it } from 'vitest';
import * as Poker from '../../../index';
import { NO_LIMIT_HAND, SHOWDOWN_HAND } from './fixtures/baseGame';

describe('Game API - Core Contract', () => {
  describe('Rules Engine Contract', () => {
    it('should own all game logic and validation', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      // Game should provide comprehensive validation
      expect(typeof Poker.Game.canApplyAction).toBe('function');
      expect(typeof Poker.Game.applyAction).toBe('function');

      // Game should transform Hand to runtime state
      expect(game).toHaveProperty('players');
      expect(game).toHaveProperty('pot');
      expect(game).toHaveProperty('street');
      expect(game).toHaveProperty('nextPlayerIndex');
      expect(game).toHaveProperty('isShowdown');
      expect(game).toHaveProperty('isComplete');
    });

    it('should maintain deterministic state from identical Hand inputs', () => {
      const game1 = Poker.Game(NO_LIMIT_HAND);
      const game2 = Poker.Game(NO_LIMIT_HAND);

      // Same Hand should produce identical Game states
      expect(game1.pot).toBe(game2.pot);
      expect(game1.street).toBe(game2.street);
      expect(game1.nextPlayerIndex).toBe(game2.nextPlayerIndex);
      expect(JSON.stringify(game1.players)).toBe(JSON.stringify(game2.players));
      expect(game1.board).toEqual(game2.board);
    });

    it('should never modify input Hand data', () => {
      const handCopy = JSON.parse(JSON.stringify(NO_LIMIT_HAND));
      const game = Poker.Game(NO_LIMIT_HAND);

      // Apply some action to game
      if (game.nextPlayerIndex >= 0) {
        try {
          const action = `p${game.nextPlayerIndex + 1} cc`;
          Poker.Game.applyAction(game, action);
        } catch {
          // Action might be invalid, that's ok for this test
        }
      }

      // Original Hand should remain unchanged
      expect(JSON.stringify(NO_LIMIT_HAND)).toBe(JSON.stringify(handCopy));
    });
  });

  describe('Query Methods Contract', () => {
    it('should have no side effects for query operations', () => {
      const game = Poker.Game(NO_LIMIT_HAND);
      const gameCopy = JSON.parse(JSON.stringify(game));

      // Call all query methods
      Poker.Game.getPlayerIndex(game, 'Alice');
      Poker.Game.getTimeLeft(game);
      Poker.Game.getElapsedTime(game);
      Poker.Game.hasActed(game, 'Charlie');
      Poker.Game.canApplyAction(game, 'p3 cc');

      // Game state should remain unchanged (except for any cached computations)
      // Compare key mutable properties
      expect(game.pot).toBe(gameCopy.pot);
      expect(game.street).toBe(gameCopy.street);
      expect(game.nextPlayerIndex).toBe(gameCopy.nextPlayerIndex);
      expect(JSON.stringify(game.players)).toBe(JSON.stringify(gameCopy.players));
    });

    it('should correctly use canApplyAction', () => {
      const game = Poker.Game({ ...NO_LIMIT_HAND, actions: [] });
      // Apply all actions
      for (const action of NO_LIMIT_HAND.actions) {
        expect(Poker.Game.canApplyAction(game, action)).toBe(true);
        expect(() => Poker.Game.applyAction(game, action)).not.toThrow();
      }
      expect(Poker.Game(NO_LIMIT_HAND).lastAction).toBe(
        NO_LIMIT_HAND.actions[NO_LIMIT_HAND.actions.length - 1]
      );
    });

    it('should return -1 for not found instead of throwing', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      // Should return -1 for not found, not throw
      expect(Poker.Game.getPlayerIndex(game, 'NonExistent')).toBe(-1);
      expect(Poker.Game.getPlayerIndex(game, -1)).toBe(-1);
      expect(Poker.Game.getPlayerIndex(game, 100)).toBe(-1);

      // Should return false for invalid players
      expect(Poker.Game.hasActed(game, 'NonExistent')).toBe(false);
      expect(Poker.Game.hasActed(game, -1)).toBe(false);
      expect(Poker.Game.hasActed(game, 100)).toBe(false);
    });
  });

  describe('Separation of Concerns', () => {
    it('should own all game logic while Hand owns data notation', () => {
      const hand = NO_LIMIT_HAND;
      const game = Poker.Game(hand);

      // Game owns runtime state and logic
      expect(game).toHaveProperty('isShowdown');
      expect(game).toHaveProperty('nextPlayerIndex');
      expect(game).toHaveProperty('pot');
      expect(game).toHaveProperty('street');
      expect(game).toHaveProperty('board');
      expect(game).toHaveProperty('players');

      // Hand owns data notation
      expect(hand).toHaveProperty('actions');
      expect(hand).toHaveProperty('variant');
      expect(hand).toHaveProperty('startingStacks');
      expect(hand).not.toHaveProperty('isShowdown');
      expect(hand).not.toHaveProperty('nextPlayerIndex');
      expect(hand).not.toHaveProperty('pot');
    });

    it('should provide all necessary methods for game management', () => {
      // Constructor
      expect(typeof Poker.Game).toBe('function');

      // Query methods
      expect(typeof Poker.Game.getPlayerIndex).toBe('function');
      expect(typeof Poker.Game.getTimeLeft).toBe('function');
      expect(typeof Poker.Game.getElapsedTime).toBe('function');
      expect(typeof Poker.Game.hasActed).toBe('function');

      // Validation
      expect(typeof Poker.Game.canApplyAction).toBe('function');

      // State modification
      expect(typeof Poker.Game.applyAction).toBe('function');
      expect(typeof Poker.Game.finish).toBe('function');
    });
  });

  describe('Immutability Contract', () => {
    it('should not mutate Hand when creating Game', () => {
      const originalActions = [...NO_LIMIT_HAND.actions];
      const originalStacks = [...NO_LIMIT_HAND.startingStacks];

      expect(() => Poker.Game(NO_LIMIT_HAND)).not.toThrow();
      expect(NO_LIMIT_HAND.actions).toEqual(originalActions);
      expect(NO_LIMIT_HAND.startingStacks).toEqual(originalStacks);
    });

    it('should not mutate Hand when calling finish', () => {
      const hand = { ...SHOWDOWN_HAND };
      const originalHand = JSON.parse(JSON.stringify(hand));

      const game = Poker.Game(hand);

      expect(() => Poker.Game.finish(game, hand)).not.toThrow();
      // Original hand should be unchanged if we didn't complete it
      if (!game.isComplete) {
        expect(hand).toEqual(originalHand);
      }
    });
  });
});
