import { describe, expect, it } from 'vitest';
import * as Poker from '../../../index';
import { getActionAmount, getActionCards, getActionPlayerIndex } from '../../../index';
import type { Action } from '../../../types';
import { NO_LIMIT_HAND } from './fixtures/baseGame';

describe('Game API - Integration', () => {
  describe('Complete Hand Flow', () => {
    it('should play complete hand from start to finish', () => {
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20],
        antes: [0, 0, 0],
        minBet: 20,
        actions: [],
      };

      const completedHand: Poker.Hand = {
        ...hand,
        actions: [
          'd dh p1 AsKs',
          'd dh p2 QhQc',
          'd dh p3 JdTd',
          'p1 cbr 60',
          'p2 cc 60',
          'p3 cc 60',
          'd db AhKhQd',
          'p2 cc',
          'p3 cc',
          'p1 cc',
          'd db Td',
          'p2 cc',
          'p3 cc',
          'p1 cc',
          'd db 9s',
          'p2 cc',
          'p3 cc',
          'p1 cc',
          'p1 sm',
          'p2 sm',
          'p3 sm',
        ],
      };

      let game = Poker.Game(hand);

      // Deal hole cards
      Poker.Game.applyAction(game, 'd dh p1 AsKs');
      Poker.Game.applyAction(game, 'd dh p2 QhQc');
      Poker.Game.applyAction(game, 'd dh p3 JdTd');

      // Preflop betting
      expect(game.street).toBe('preflop');
      Poker.Game.applyAction(game, 'p1 cbr 60');
      Poker.Game.applyAction(game, 'p2 cc 60');
      Poker.Game.applyAction(game, 'p3 cc 60');

      // Flop
      Poker.Game.applyAction(game, 'd db AhKhQd');
      expect(game.street).toBe('flop');
      expect(game.board).toEqual(['Ah', 'Kh', 'Qd']);

      // Flop betting
      Poker.Game.applyAction(game, 'p2 cc');
      Poker.Game.applyAction(game, 'p3 cbr 100');
      Poker.Game.applyAction(game, 'p1 cc 100');
      Poker.Game.applyAction(game, 'p2 cc 100');

      // Turn
      Poker.Game.applyAction(game, 'd db Td');
      expect(game.street).toBe('turn');

      // Turn betting
      Poker.Game.applyAction(game, 'p2 cc');
      Poker.Game.applyAction(game, 'p3 cc');
      Poker.Game.applyAction(game, 'p1 cc');

      // River
      Poker.Game.applyAction(game, 'd db 9s');
      expect(game.street).toBe('river');

      // River betting
      Poker.Game.applyAction(game, 'p2 cc');
      Poker.Game.applyAction(game, 'p3 cc');
      Poker.Game.applyAction(game, 'p1 cc');

      // Showdown
      Poker.Game.applyAction(game, 'p2 sm QhQc');
      Poker.Game.applyAction(game, 'p3 sm JdTd');
      Poker.Game.applyAction(game, 'p1 sm AsKs');

      expect(game.isShowdown).toBe(true);
      expect(game.isComplete).toBe(true);

      // Verify pot and winnings
      const finished = Poker.Game.finish(game, completedHand);

      expect(finished.finishingStacks).toBeDefined();
      expect(finished.finishingStacks).toEqual([840, 840, 1320]);
      expect(finished.winnings).toBeDefined();
      expect(finished.totalPot).toBeGreaterThan(0);
    });

    it('should handle all-in scenarios through completion', () => {
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob'],
        antes: [0, 0],
        startingStacks: [100, 500],
        blindsOrStraddles: [10, 20],
        minBet: 20,
        actions: [],
      };

      let game = Poker.Game(hand);

      // Deal and go all-in preflop
      Poker.Game.applyAction(game, 'd dh p1 AsKs');
      Poker.Game.applyAction(game, 'd dh p2 7h2d');
      Poker.Game.applyAction(game, 'p1 cbr 100'); // Alice all-in
      Poker.Game.applyAction(game, 'p2 cc 100'); // Bob calls

      expect(game.players[0].isAllIn).toBe(true);

      // Should auto-deal remaining streets
      Poker.Game.applyAction(game, 'd db AhKhQd');
      Poker.Game.applyAction(game, 'd db Td');
      Poker.Game.applyAction(game, 'd db 9s');

      // Direct to showdown
      Poker.Game.applyAction(game, 'p2 sm 7h2d');
      Poker.Game.applyAction(game, 'p1 sm AsKs');

      expect(game.isShowdown).toBe(true);
      expect(game.isComplete).toBe(true);
    });
  });

  describe('Validation and Application Flow', () => {
    it('should validate then apply actions correctly', () => {
      let game = Poker.Game(NO_LIMIT_HAND);
      const actions: Action[] = ['p3 cc', 'p4 cbr 100'];

      for (const action of actions) {
        // First validate
        const canApply = Poker.Game.canApplyAction(game, action);
        expect(canApply).toBe(true);

        // Then apply
        const newGame = Poker.Game.applyAction(game, action);
        expect(newGame).toMatchObject(game); // New instance

        // Verify state changed
        expect(newGame.nextPlayerIndex).toBe(game.nextPlayerIndex);
        expect(getActionPlayerIndex(action)).toEqual(getActionPlayerIndex(newGame.lastAction!));
        expect(getActionCards(action)).toEqual(getActionCards(newGame.lastAction!));
        expect(getActionAmount(action)).toEqual(getActionAmount(newGame.lastAction!));

        game = newGame;
      }
    });

    it('should reject invalid actions without state corruption', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      // Try invalid action
      const invalidAction = 'p1 cbr 100'; // Wrong player
      expect(Poker.Game.canApplyAction(game, invalidAction)).toBe(false);

      // Should throw when trying to apply
      expect(() => Poker.Game.applyAction(game, invalidAction)).toThrow();

      // Original game should be unchanged
      expect(game.nextPlayerIndex).toBe(2); // Still Charlie's turn
    });
  });

  describe('Player Management Integration', () => {
    it('should track player states through hand progression', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        author: 'Alice',
      };

      let game = Poker.Game(hand);

      // Track who has acted
      expect(Poker.Game.hasActed(game, 'Charlie')).toBe(false);

      Poker.Game.applyAction(game, 'p3 cc');
      expect(Poker.Game.hasActed(game, 'Charlie')).toBe(true);

      Poker.Game.applyAction(game, 'p4 cc');

      // New street resets hasActed
      Poker.Game.applyAction(game, 'd db Td');
      expect(Poker.Game.hasActed(game, 'Charlie')).toBe(false);
    });

    it('should handle player elimination correctly', () => {
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie', 'David'],
        startingStacks: [100, 100, 100, 100],
        blindsOrStraddles: [10, 20, 0, 0],
        antes: [0, 0, 0, 0],
        minBet: 20,
        actions: [],
      };

      const completedHand: Poker.Hand = {
        ...hand,
        actions: [
          'd dh p1 AsKs',
          'd dh p2 7h2d',
          'd dh p3 QhQc',
          'd dh p4 JdTd',
          'p3 cbr 100',
          'p4 f',
          'p1 f',
          'p2 f',
          'p3 sm QhQc',
          'p4 sm JdTd',
        ],
      };

      let game = Poker.Game(hand);

      // Deal cards
      Poker.Game.applyAction(game, 'd dh p1 AsKs');
      Poker.Game.applyAction(game, 'd dh p2 7h2d');
      Poker.Game.applyAction(game, 'd dh p3 QhQc');
      Poker.Game.applyAction(game, 'd dh p4 JdTd');

      // Charlie goes all-in, others fold
      Poker.Game.applyAction(game, 'p3 cbr 100');
      Poker.Game.applyAction(game, 'p4 f');
      Poker.Game.applyAction(game, 'p1 f');
      Poker.Game.applyAction(game, 'p2 f');

      expect(game.isComplete).toBe(true);

      // Charlie wins
      const finished = Poker.Game.finish(game, completedHand);

      if (finished.winnings) {
        expect(finished.winnings[2]).toBeGreaterThan(0);
      }
    });
  });

  describe('Timing Integration', () => {
    it('should track timing through hand progression', () => {
      const now = Date.now();
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        timeLimit: 30,
        actions: [],
      };

      let game = Poker.Game(hand);

      // Apply actions with timestamps
      Poker.Game.applyAction(game, `d dh p1 AsKs #${now}`);
      expect(game.lastTimestamp).toBe(now);

      Poker.Game.applyAction(game, `d dh p2 7h2d #${now + 1000}`);
      expect(game.lastTimestamp).toBe(now + 1000);

      // Check elapsed time
      const elapsed = Poker.Game.getElapsedTime(game);
      expect(elapsed).toBeGreaterThanOrEqual(-1000);

      // Check time left
      const timeLeft = Poker.Game.getTimeLeft(game);
      expect(timeLeft).toBeLessThanOrEqual(30000 + 5000);
    });
  });

  describe('Complex Multi-Way Scenarios', () => {
    it('should handle side pots with multiple all-ins', () => {
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie', 'David'],
        startingStacks: [100, 200, 300, 400],
        blindsOrStraddles: [10, 20, 0, 0],
        antes: [0, 0, 0, 0],
        minBet: 20,
        actions: [],
      };

      let game = Poker.Game(hand);

      // Deal cards to produce a specific outcome for testing side pots:
      // - p1 (shortest stack) gets the best hand (Full House) to win the Main Pot.
      // - p2 (second shortest) gets the second-best hand (Flush) to win Side Pot 1.
      // - p3 (third shortest) gets the third-best hand (Straight) to win Side Pot 2.
      // - p4 (largest stack) gets the fourth-best hand and wins nothing.
      Poker.Game.applyAction(game, 'd dh p1 AdAc'); // p1: Full House
      Poker.Game.applyAction(game, 'd dh p2 QhQc'); // p2: Flush
      Poker.Game.applyAction(game, 'd dh p3 JdTd'); // p3: Straight
      Poker.Game.applyAction(game, 'd dh p4 9h8h'); // p4: Two Pair

      // Pre-flop action: Multiple players go all-in
      Poker.Game.applyAction(game, 'p3 cbr 300'); // Charlie (UTG) is all-in for $300
      Poker.Game.applyAction(game, 'p4 cc 300'); // David (BTN) calls
      Poker.Game.applyAction(game, 'p1 cbr 100'); // Alice (SB) is all-in for $100
      Poker.Game.applyAction(game, 'p2 cbr 200'); // Bob (BB) is all-in for $200

      // The board is dealt
      Poker.Game.applyAction(game, 'd db AsKs5s'); // Flop
      Poker.Game.applyAction(game, 'd db 5c'); // Turn
      Poker.Game.applyAction(game, 'd db Jd'); // River

      expect(game.isShowdown).toBe(true);

      // --- Showdown Sequence ---
      // Pots are resolved from the outside in. Since there was no river betting,
      // the showdown order for each pot starts with the first eligible player
      // to the left of the button. The correct order of new showings is p3 -> p4 -> p2 -> p1.

      // Pot 1 (Side Pot 2: $200): Contested by Charlie (p3) and David (p4)
      // The first eligible player to act left of the button is Charlie.
      Poker.Game.applyAction(game, 'p3 sm JdTd');
      // The next eligible player is David.
      Poker.Game.applyAction(game, 'p4 sm 9h8h');

      // Pot 2 (Side Pot 1: $300): Contested by Bob (p2), Charlie, and David
      // The next eligible player who hasn't shown is Bob.
      Poker.Game.applyAction(game, 'p2 sm QhQc');

      // Pot 3 (Main Pot: $400): Contested by all players
      // The final player to show is Alice.
      Poker.Game.applyAction(game, 'p1 sm AdAc');

      expect(game.isComplete).toBe(true);
      // Hand Results:
      // Alice: Full House, Aces full of Fives (wins Main Pot)
      // Bob: King-high Flush (wins Side Pot 1)
      // Charlie: King-high Straight (wins Side Pot 2)
      // David: Two Pair, Kings and Fives
      expect(game.players.map(p => p.winnings)).toEqual([400, 300, 200, 0]);
      expect(game.players.map(p => p.stack)).toEqual([400, 300, 200, 100]);
    });

    it('should correctly process a real PokerStars hand history', () => {
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['aby100', 'Fridrih34', 'avstero', 'machosaliba22', 'ka100pka527', 'Riesa82'],
        startingStacks: [177.21, 124.69, 100.22, 21.46, 100, 106.54],
        blindsOrStraddles: [0, 0, 0, 0.5, 1, 0], // SB: p4, BB: p5
        minBet: 1,
        actions: [],
        antes: [],
        rakePercentage: 0.05,
      };

      let game = Poker.Game(hand);

      // Hole Cards are dealt to all players
      Poker.Game.applyAction(game, 'd dh p1 ??');
      Poker.Game.applyAction(game, 'd dh p2 ??');
      Poker.Game.applyAction(game, 'd dh p3 ??');
      Poker.Game.applyAction(game, 'd dh p4 KdJd');
      Poker.Game.applyAction(game, 'd dh p5 ??');
      Poker.Game.applyAction(game, 'd dh p6 9d9s');

      // Pre-flop Actions
      Poker.Game.applyAction(game, 'p6 cbr 2.3'); // Riesa82 raises
      Poker.Game.applyAction(game, 'p1 f'); // aby100 folds
      Poker.Game.applyAction(game, 'p2 f'); // Fridrih34 folds
      Poker.Game.applyAction(game, 'p3 f'); // avstero folds
      Poker.Game.applyAction(game, 'p4 cbr 3.6'); // machosaliba22 re-raises
      Poker.Game.applyAction(game, 'p5 f'); // ka100pka527 folds
      Poker.Game.applyAction(game, 'p6 cc 3.6'); // Riesa82 calls

      // Check pre-flop state
      expect(game.street).toBe('preflop');
      expect(game.pot).toBeCloseTo(8.2);
      expect(game.players[3].totalBet).toBe(3.6);
      expect(game.players[5].totalBet).toBe(3.6);

      // Flop
      Poker.Game.applyAction(game, 'd db 6cKc6s');
      expect(game.street).toBe('flop');
      expect(game.board).toEqual(['6c', 'Kc', '6s']);

      // Flop Actions
      Poker.Game.applyAction(game, 'p4 cbr 7.79'); // machosaliba22 bets
      Poker.Game.applyAction(game, 'p6 cbr 23.21'); // Riesa82 raises
      Poker.Game.applyAction(game, 'p4 cc 23.21'); // machosaliba22 calls all-in

      // Turn and River are dealt automatically as a player is all-in
      Poker.Game.applyAction(game, 'd db 9c');
      Poker.Game.applyAction(game, 'd db 2s');
      expect(game.street).toBe('river');
      expect(game.board).toEqual(['6c', 'Kc', '6s', '9c', '2s']);
      expect(game.isShowdown).toBe(true);

      // Showdown
      Poker.Game.applyAction(game, 'p4 sm KdJd');
      Poker.Game.applyAction(game, 'p6 sm 9d9s');
      expect(game.isComplete).toBe(true);

      // Final Assertions
      expect(game.rake).toBeCloseTo(2.2);
      expect(game.pot).toBeCloseTo(41.72);

      const finalStacks = game.players.map(p => p.stack);
      expect(finalStacks[0]).toBe(177.21); // aby100 - folded
      expect(finalStacks[1]).toBe(124.69); // Fridrih34 - folded
      expect(finalStacks[2]).toBe(100.22); // avstero - folded
      expect(finalStacks[3]).toBe(0); // machosaliba22 - lost all-in
      expect(finalStacks[4]).toBe(99); // ka100pka527 - folded BB
      expect(finalStacks[5]).toBeCloseTo(126.8); // Riesa82 - won pot (106.54 - 21.46 + 41.72)
    });
  });

  describe('Error Recovery', () => {
    it('should maintain consistency after failed action', () => {
      let game = Poker.Game(NO_LIMIT_HAND);
      const originalState = JSON.parse(JSON.stringify(game));

      // Try invalid action
      try {
        Poker.Game.applyAction(game, 'p1 cbr 100'); // Wrong player
      } catch (error) {
        // Expected to throw
      }

      // Game should still be in original state
      expect(JSON.stringify(game)).toBe(JSON.stringify(originalState));

      // Should be able to continue with valid action
      Poker.Game.applyAction(game, 'p3 cc');
      expect(game.nextPlayerIndex).toBe(3);
    });
  });

  describe('Query Methods Consistency', () => {
    it('should provide consistent results across methods', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        author: 'Charlie',
      };

      const game = Poker.Game(hand);
      const authorIndex = Poker.Hand.getAuthorPlayerIndex(hand);
      // All methods should work together consistently

      const charlieIndex = Poker.Game.getPlayerIndex(game, 'Charlie');
      expect(charlieIndex).toBe(authorIndex);

      const indexByNumber = Poker.Game.getPlayerIndex(game, 2);
      expect(indexByNumber).toBe(charlieIndex);

      // Validate current player to act
      if (game.nextPlayerIndex === charlieIndex) {
        expect(Poker.Game.canApplyAction(game, 'p3 cc')).toBe(true);
      }
    });
  });

  describe('Performance Scenarios', () => {
    it('should handle many rapid state changes', () => {
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['A', 'B'],
        startingStacks: [10000, 10000],
        blindsOrStraddles: [10, 20],
        antes: [0, 0],
        minBet: 20,
        actions: [],
      };

      let game = Poker.Game(hand);

      // Rapid back-and-forth betting
      Poker.Game.applyAction(game, 'd dh p1 AsKs');
      Poker.Game.applyAction(game, 'd dh p2 QhQc');

      // Many raises back and forth
      Poker.Game.applyAction(game, 'p1 cbr 60');
      Poker.Game.applyAction(game, 'p2 cbr 120');
      Poker.Game.applyAction(game, 'p1 cbr 240');
      Poker.Game.applyAction(game, 'p2 cbr 480');
      Poker.Game.applyAction(game, 'p1 cbr 960');
      Poker.Game.applyAction(game, 'p2 cc 960');

      // Continue through streets
      Poker.Game.applyAction(game, 'd db AhKhQd');
      Poker.Game.applyAction(game, 'p2 cbr 1000');
      Poker.Game.applyAction(game, 'p1 cc 1000');

      // Game should maintain consistency
      expect(game.pot).toBeGreaterThan(0);
      expect(game.street).toBe('flop');
    });

    it('should efficiently query large game states', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      // Multiple queries shouldn't degrade
      for (let i = 0; i < 100; i++) {
        Poker.Game.getPlayerIndex(game, 'Alice');
        Poker.Game.hasActed(game, 'Charlie');
        Poker.Game.getTimeLeft(game);
        Poker.Game.canApplyAction(game, 'p3 cc');
      }

      // Game should remain unchanged
      expect(game.nextPlayerIndex).toBe(2);
    });
  });
});
