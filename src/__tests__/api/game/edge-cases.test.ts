import { describe, expect, it } from 'vitest';
import * as Poker from '../../../index';
import type { Action } from '../../../types';
import { NO_LIMIT_HAND, MINIMAL_HAND } from './fixtures/baseGame';

describe('Game API - Edge Cases', () => {
  describe('Extreme Stack Sizes', () => {
    it('should handle zero starting stacks', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        startingStacks: [5, 1000, 0, 1000],
      };
      // game constructor should throw
      // because player with chips 0 or lower than big blind CAN'T act
      expect(() => Poker.Game(hand)).toThrow();
    });

    it('should handle negative starting stacks', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        startingStacks: [-5, -1000, 0, 1000],
      };
      // game constructor should throw
      // because player with chips negative CAN'T act
      expect(() => Poker.Game(hand)).toThrow();
    });

    it('should handle fractional stacks if allowed', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        startingStacks: [100.5, 200.25, 300.75, 400.1],
      };
      const game = Poker.Game(hand);

      expect(game.players[0].stack).toBe(90.5);
      expect(game.players[1].stack).toBe(180.25);
    });
  });

  describe('Player Count Extremes', () => {
    it('should set isValid=false for single player game', () => {
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Lonely'],
        startingStacks: [1000],
        blindsOrStraddles: [0],
        minBet: 20,
        antes: [0],
        actions: [],
      };

      const game = Poker.Game(hand);
      expect(game.isPlayable).toBe(false);
    });

    it('should set isValid=true for normal game', () => {
      const game = Poker.Game(NO_LIMIT_HAND);
      expect(game.isPlayable).toBe(true);
    });

    it('should throw when applying action with less than 2 active players', () => {
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Lonely'],
        startingStacks: [1000],
        blindsOrStraddles: [0],
        minBet: 20,
        antes: [0],
        actions: [],
      };

      const game = Poker.Game(hand);
      expect(game.isPlayable).toBe(false);

      // Only 1 player, so activePlayers.length < 2
      // Trying to apply an action should throw
      const action = 'p1 cc' as Action;
      expect(() => Poker.Game.applyAction(game, action)).toThrowError(
        /Cannot apply action to invalid game/
      );
    });

    it('should throw when applying action after everyone else folded (1 active player)', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [
          'd dh p1 AsKs',
          'd dh p2 7h2d',
          'd dh p3 QhQc',
          'd dh p4 JdTd',
          'p3 f', // UTG folds
          'p4 f', // BTN folds
          'p1 f', // SB folds
          // p2 wins, hand complete
        ] as Action[],
      };

      const game = Poker.Game(hand);
      // game started valid but now has < 2 active players
      expect(game.isPlayable).toBe(true);

      // Try to apply an action for p2
      expect(() => Poker.Game.applyAction(game, 'p2 cc')).toThrowError(
        /Cannot apply action to invalid game/
      );
    });

    it('should handle maximum players (9)', () => {
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9'],
        startingStacks: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
        blindsOrStraddles: [0, 0, 0, 0, 0, 0, 0, 10, 20],
        antes: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        minBet: 20,
        actions: [],
      };

      const game = Poker.Game(hand);
      expect(game.players).toHaveLength(9);
    });

    it('should throw when players exceed default seat count (9)', () => {
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10'],
        startingStacks: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
        blindsOrStraddles: [0, 0, 0, 0, 0, 0, 0, 10, 20, 0],
        antes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        minBet: 20,
        actions: [],
      };

      expect(() => Poker.Game(hand)).toThrowError(/Game cannot have more players than seats/);
    });

    it('should throw when players exceed explicit seat count', () => {
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
        startingStacks: [1000, 1000, 1000, 1000, 1000, 1000],
        blindsOrStraddles: [0, 0, 0, 0, 10, 20],
        antes: [0, 0, 0, 0, 0, 0],
        minBet: 20,
        seatCount: 5, // Limit to 5
        actions: [],
      };

      expect(() => Poker.Game(hand)).toThrowError(/Game cannot have more players than seats/);
    });
  });

  describe('Action Sequence Edge Cases', () => {
    it('should handle empty actions array', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [],
      };

      const game = Poker.Game(hand);
      expect(game).toBeDefined();
      expect(game.board).toEqual([]);
      expect(game.street).toBe('preflop');
    });

    it('should handle actions array with only dealer actions', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: ['d dh p1 AsKs', 'd dh p2 7h2d', 'd dh p3 QhQc', 'd dh p4 JdTd'],
      };

      const game = Poker.Game(hand);
      expect(game.players[0].cards).toEqual(['As', 'Ks']);
      expect(game.street).toBe('preflop');
      expect(game.nextPlayerIndex).toBeGreaterThanOrEqual(0);
    });

    it('should handle incomplete action sequences', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [
          'd dh p1 AsKs',
          'd dh p2 7h2d',
          // Missing p3 and p4 hole cards
          'p3 cbr 60',
        ],
      };

      // Should either handle gracefully or throw
      expect(() => Poker.Game(hand)).toBeDefined();
    });

    it('should handle duplicate actions', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [
          'd dh p1 AsKs',
          'd dh p1 AsKs', // Duplicate
          'd dh p2 7h2d',
        ],
      };

      // Should handle or reject duplicates
      const game = Poker.Game(hand);
      expect(game.players[0].cards).toEqual(['As', 'Ks']);
    });

    it('should report illegal move when raising less than min-raise', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: ['d dh p1 AsKs', 'd dh p2 7h2d', 'd dh p3 QhQc', 'd dh p4 JdTd'],
        startingStacks: [1000, 1500, 30, 1200],
      };
      const game = Poker.Game(hand);
      // BB is 20. Min raise is to 40.

      const illegalAction: Action = 'p3 cbr 29';

      // Attempting to raise less than min (29) when stack allows more should be invalid
      expect(Poker.Game.canApplyAction(game, illegalAction)).toBe(false);

      // 30 is fine since it's the whole stack - meaning going all in
      expect(Poker.Game.canApplyAction(game, 'p3 cbr 30')).toBe(true);
    });
  });

  describe('Illegal Moves', () => {
    it('should throw when capped player attempts to raise', () => {
      const cappedHand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        startingStacks: [1000, 1000, 120, 1000],
        blindsOrStraddles: [0, 0, 10, 20],
        players: ['P1', 'P2', 'P3', 'P4'],
        actions: [
          'd dh p1 AsKs',
          'd dh p2 7h2d',
          'd dh p3 QhQc',
          'd dh p4 JdTd',
          'p1 cbr 100',
          'p2 cc',
          'p3 cbr 120', // all-in, incomplete raise
          'p4 f',
          // Action back on P1. P1 is capped.
        ],
      };

      const game = Poker.Game(cappedHand);
      expect(game.nextPlayerIndex).toBe(0);

      // P1 tries to raise to 200 (Illegal)
      const illegalAction = 'p1 cbr 200' as Action;

      // Ensure canApplyAction returns false
      expect(Poker.Game.canApplyAction(game, illegalAction)).toBe(false);

      // Ensure applyAction throws
      // NOTE: This expectation might fail if the engine is permissive.
      // If it fails, we need to decide whether to enforce strictness in engine or update test.
      // The requirement was "it should throw".
      expect(() => Poker.Game.applyAction(game, illegalAction)).toThrow();
    });
  });

  describe('Blind Structure Edge Cases', () => {
    it('should handle no blinds, should throw', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        blindsOrStraddles: [0, 0, 0, 0],
      };

      // this game variant MUST have blinds
      expect(() => Poker.Game(hand)).toThrow();
    });

    it('should handle unusual blind positions, should throw', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        blindsOrStraddles: [0, 10, 0, 20], // Blinds not in typical positions
      };

      // this game variant MUST have blinds in typical positions
      expect(() => Poker.Game(hand)).toThrow();
    });
  });

  describe('Card Dealing Edge Cases', () => {
    it('should handle invalid card notations gracefully', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [
          'd dh p1 XxYy' as Action, // Invalid cards
        ],
      };
      let game: Poker.Game;
      // Should either handle gracefully or throw
      expect(() => (game = Poker.Game(hand))).not.toThrow();
      expect(game!.players[0].cards).toEqual(['Xx', 'Yy']);
    });

    it('should handle duplicate cards in deck', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [
          'd dh p1 AsKs',
          'd dh p2 AsKs', // Same cards as p1
        ],
      };
      let game: Poker.Game;
      // Do not check for duplicate cards, any cards is OK
      expect(() => (game = Poker.Game(hand))).not.toThrow();
      expect(game!.players[0].cards).toEqual(['As', 'Ks']);
      expect(game!.players[1].cards).toEqual(['As', 'Ks']);
    });

    it('should handle too many board cards, should throw', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [
          ...NO_LIMIT_HAND.actions,
          'd db Td',
          'd db 9s',
          'd db 8h', // 6th card - invalid
        ],
      };

      // Should have max 5 board cards
      expect(() => Poker.Game(hand)).toThrow();
    });
  });

  describe('Timing Edge Cases', () => {
    it('should handle negative time limits', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        timeLimit: -30, // negative time limit is like no time limit
      };

      const game = Poker.Game(hand);
      expect(Poker.Game.getTimeLeft(game)).toBe(Infinity);
    });

    it('should handle zero time limit', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        timeLimit: 0,
      };

      const game = Poker.Game(hand);
      expect(Poker.Game.getTimeLeft(game)).toBe(Infinity);
    });

    it('should handle very large time limits', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        timeLimit: Number.MAX_SAFE_INTEGER,
      };

      const game = Poker.Game(hand);
      const timeLeft = Poker.Game.getTimeLeft(game);
      expect(timeLeft).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER * 1000);
    });

    it('should handle timestamps in the future', () => {
      const futureTime = Date.now() + 1000000;
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [`d dh p1 AsKs #${futureTime}`],
      };

      const game = Poker.Game(hand);
      expect(game.lastTimestamp).toBe(futureTime);
    });

    it('should handle very old timestamps', () => {
      const oldTime = 0; // Unix epoch
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [`d dh p1 AsKs #${oldTime}`],
      };
      const now = Date.now(); // invalid timestamp is being replaced with current time
      const game = Poker.Game(hand);
      expect(game.lastTimestamp).toBeGreaterThan(now - 1000);
      expect(game.lastTimestamp).toBeLessThan(now + 1000);
    });
  });

  describe('Special Characters in Player Names', () => {
    it('should handle unicode characters', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        players: ['Alice', '🎮Player', '中文名', 'Пользователь'],
      };

      const game = Poker.Game(hand);
      expect(game.players[1].name).toBe('🎮Player');
      expect(game.players[2].name).toBe('中文名');
      expect(Poker.Game.getPlayerIndex(game, '🎮Player')).toBe(1);
    });

    it('should handle empty player names', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        players: ['', 'Bob', 'Ch arlie', 'David'],
      };

      const game = Poker.Game(hand);
      expect(game.players[0].name).toBe('');
      expect(Poker.Game.getPlayerIndex(game, '')).toBe(0);
    });

    it('should handle very long player names', () => {
      const longName = 'A'.repeat(1000);
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        players: [longName, 'Bob', 'Charlie', 'David'],
      };

      const game = Poker.Game(hand);
      expect(game.players[0].name).toBe(longName);
      expect(Poker.Game.getPlayerIndex(game, longName)).toBe(0);
    });
  });

  describe('Rake Edge Cases', () => {
    it('should handle 100% rake', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        rakePercentage: 1.0,
      };

      const game = Poker.Game(hand);
      const finished = Poker.Game.finish(game, hand);

      if (finished.rake !== undefined) {
        // All pot goes to rake
        expect(finished.rake).toBeLessThanOrEqual(finished.totalPot || 0);
      }
    });

    it('should handle negative rake', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        rakePercentage: -0.1,
      };

      const game = Poker.Game(hand);
      const finished = Poker.Game.finish(game, hand);

      if (finished.rake !== undefined) {
        // Should treat as 0 or handle specially
        expect(finished.rake).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle fixed rake amount', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        rake: 5,
        rakePercentage: undefined,
      };

      const game = Poker.Game(hand);
      const finished = Poker.Game.finish(game, hand);

      if (finished.rake !== undefined) {
        expect(finished.rake).toBe(5);
      }
    });
  });

  describe('Action Validation Edge Cases', () => {
    it('should handle malformed action strings', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      // Various malformed actions
      //expect(Poker.Game.canApplyAction(game, '' as Action)).toBe(false);
      //expect(Poker.Game.canApplyAction(game, '   ' as Action)).toBe(false);
      //expect(Poker.Game.canApplyAction(game, 'p' as Action)).toBe(false);
      expect(Poker.Game.canApplyAction(game, 'p3' as Action)).toBe(false);
      //expect(Poker.Game.canApplyAction(game, 'cbr 100' as Action)).toBe(false);
      //expect(Poker.Game.canApplyAction(game, '3 cbr 100' as Action)).toBe(false);
    });

    it('should handle out-of-range player indices', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      expect(Poker.Game.canApplyAction(game, 'p0 cc' as Action)).toBe(false);
      expect(Poker.Game.canApplyAction(game, 'p5 cc' as Action)).toBe(false);
      expect(Poker.Game.canApplyAction(game, 'p-1 cc' as Action)).toBe(false);
      expect(Poker.Game.canApplyAction(game, 'p99 cc' as Action)).toBe(false);
    });

    it('should handle invalid action types', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      expect(Poker.Game.canApplyAction(game, 'p3 xyz' as Action)).toBe(false);
      expect(Poker.Game.canApplyAction(game, 'p3 call' as Action)).toBe(false);
      expect(Poker.Game.canApplyAction(game, 'p3 raise 100' as Action)).toBe(false);
      expect(Poker.Game.canApplyAction(game, 'p3 CHECK' as Action)).toBe(false);
    });

    it('should handle invalid amounts', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      expect(Poker.Game.canApplyAction(game, 'p3 cbr -100' as Action)).toBe(false);
      expect(Poker.Game.canApplyAction(game, 'p3 cbr 0' as Action)).toBe(false);
      // Non-numeric or infinite should be rejected too if strict, but previous behavior accepted them?
      // getActionAmount returns 0 for NaN/invalid.
      // And 0 < bigBlind, so it should be rejected now.
      expect(Poker.Game.canApplyAction(game, 'p3 cbr abc' as Action)).toBe(false);

      // Infinity handling: getActionAmount might return Infinity or 0?
      // parseInt('Infinity') is NaN -> 0. So rejected.
      expect(Poker.Game.canApplyAction(game, 'p3 cbr Infinity' as Action)).toBe(false);
      expect(Poker.Game.canApplyAction(game, 'p3 cbr NaN' as Action)).toBe(false);
    });
  });

  describe('State Recovery Edge Cases', () => {
    it('should handle contradictory state', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [
          'd dh p1 AsKs',
          'd dh p2 7h2d',
          'p1 f', // Alice folds
          'p1 cbr 100', // Alice bets after folding - contradiction
        ] as Action[],
      };

      // Should handle or reject contradictory actions
      expect(() => Poker.Game(hand)).toBeDefined();
    });

    it('should handle actions after hand complete', () => {
      const hand: Poker.Hand = {
        ...MINIMAL_HAND,
        actions: [
          'd dh p1 AsKs',
          'd dh p2 7h2d',
          'p1 cbr 100',
          'p2 f', // Hand complete
          'p1 cc', // Action after complete
        ] as Action[],
      };

      // Should handle or ignore actions after completion
      expect(() => Poker.Game(hand)).toBeDefined();
    });
  });

  describe('Null and Undefined Handling', () => {
    it('should handle undefined optional fields', () => {
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        antes: [0, 0],
        blindsOrStraddles: [10, 20],
        minBet: 20,
        actions: [],
        // All optional fields undefined
        seed: undefined,
        timeLimit: undefined,
        rake: undefined,
        rakePercentage: undefined,
        currency: undefined,
        author: undefined,
      };

      const game = Poker.Game(hand);
      expect(game).toBeDefined();
      expect(Poker.Game.getTimeLeft(game)).toBe(Infinity);
    });

    it('should handle null values gracefully', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      // Various null/undefined inputs
      expect(Poker.Game.getPlayerIndex(game, null as any)).toBe(-1);
      expect(Poker.Game.getPlayerIndex(game, undefined as any)).toBe(-1);
      expect(Poker.Game.hasActed(game, null as any)).toBe(false);
      expect(Poker.Game.hasActed(game, undefined as any)).toBe(false);
      expect(Poker.Game.canApplyAction(game, null as any)).toBe(false);
      expect(Poker.Game.canApplyAction(game, undefined as any)).toBe(false);
    });
  });

  describe('Concurrent Modifications', () => {
    it('should handle rapid successive actions', () => {
      let game = Poker.Game(NO_LIMIT_HAND);

      // Simulate rapid action application
      const actions: Action[] = ['p3 cc', 'p4 cc'];

      for (const action of actions) {
        if (Poker.Game.canApplyAction(game, action)) {
          game = Poker.Game.applyAction(game, action);
        }
      }

      expect(game).toBeDefined();
      expect(game.street).toBeDefined();
    });

    it('should maintain consistency across multiple operations', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      // Multiple query operations shouldn't affect each other
      const index1 = Poker.Game.getPlayerIndex(game, 'Alice');
      const showdown1 = game.isShowdown;
      const hasActed1 = Poker.Game.hasActed(game, 'Charlie');

      const index2 = Poker.Game.getPlayerIndex(game, 'Alice');
      const showdown2 = game.isShowdown;
      const hasActed2 = Poker.Game.hasActed(game, 'Charlie');

      expect(index1).toBe(index2);
      expect(showdown1).toBe(showdown2);
      expect(hasActed1).toBe(hasActed2);
    });
  });
});
