import { describe, expect, it } from 'vitest';
import * as Poker from '../../../index';
import type { Action } from '../../../types';
import { NO_LIMIT_HAND, COMPLETED_HAND, MINIMAL_HAND, SHOWDOWN_HAND } from './fixtures/baseGame';

describe('Game API - Construction', () => {
  describe('Basic Construction', () => {
    it('should create Game from Hand object', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      expect(game).toBeDefined();
      expect(game.players).toHaveLength(4);
      expect(game.players[0].name).toBe('Alice');
      expect(game.players[1].name).toBe('Bob');
      expect(game.players[2].name).toBe('Charlie');
      expect(game.players[3].name).toBe('David');
      expect(game.street).toBe('flop');
      expect(game.board).toEqual(['Ah', 'Kh', 'Qd']);
      expect(game.pot).toBe(150);
      expect(game.isShowdown).toBe(false);
      expect(game.isComplete).toBe(false);
      expect(game.nextPlayerIndex).toBe(2);
      expect(game.lastAction).toBe('d db AhKhQd');
      expect(game.variant).toBe('NT');
    });

    it('should replay actions to build current state', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      // After replaying actions, game state should reflect:
      // - Alice and Bob folded
      // - Charlie and David in the pot
      // - Flop has been dealt
      expect(game.players[0].hasFolded).toBe(true); // Alice folded
      expect(game.players[1].hasFolded).toBe(true); // Bob folded
      expect(game.players[2].hasFolded).toBe(false); // Charlie active
      expect(game.players[3].hasFolded).toBe(false); // David active
      expect(game.board).toEqual(['Ah', 'Kh', 'Qd']);
      expect(game.street).toBe('flop');
    });

    it('should handle optional actions parameter', () => {
      const handWithoutActions = {
        ...NO_LIMIT_HAND,
        actions: ['d dh p1 AsKs', 'd dh p2 7h2d', 'd dh p3 QhQc', 'd dh p4 JdTd'],
      };
      const customActions: Action[] = [
        'd dh p1 AsKs',
        'd dh p2 7h2d',
        'd dh p3 ThTc',
        'd dh p4 JdTd',
        'p3 cbr 100',
      ] as Action[];
      const game = Poker.Game(handWithoutActions, customActions);

      // Should apply custom actions instead of Hand's actions
      expect(game.players[2].roundBet).toBe(100);
      expect(game.players[2].cards).toEqual(['Th', 'Tc']);
    });

    it('should handle empty optional actions array', () => {
      const emptyActions: Action[] = [];
      const game = Poker.Game(NO_LIMIT_HAND, emptyActions);

      // Should still create game with Hand's actions
      expect(game).toBeDefined();
      expect(game.board).toEqual([]);
    });
  });

  describe('Variant Support', () => {
    it("should support No-Limit Texas Hold'em", () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        variant: 'NT',
        minBet: 20,
      } as Poker.Hand;
      const game = Poker.Game(hand);

      expect(game.variant).toBe('NT');
      expect(game.bigBlind).toBe(20);
    });

    it("should support Fixed-Limit Texas Hold'em", () => {
      // SCENARIO: Fixed-Limit Texas Hold'em game
      // INPUT: FT variant with smallBet: 10 (BB), bigBet: 20, blindsOrStraddles: [5, 10, 0, 0]
      // EXPECTED: Game is created with FT variant
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        variant: 'FT',
        smallBet: 10,
        bigBet: 20,
        minBet: undefined,
        blindsOrStraddles: [5, 10, 0, 0], // Fixed limit: BB = smallBet (10), SB = 5
      } as Poker.Hand;
      const game = Poker.Game(hand);

      expect(game.variant).toBe('FT');
      // Game should have betting structure info
      expect(game).toBeDefined();
    });
  });

  describe('State Initialization', () => {
    it('should initialize pot correctly', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      // Pot should include blinds and bets
      // SB: 10, BB: 20, Charlie: 60, David: 60
      // Total: 10 + 20 + 60 + 60 = 150
      expect(game.pot).toBeGreaterThan(0);
      expect(game.pot).toBe(150);
    });

    it('should set correct initial positions', () => {
      const freshHand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [],
      };
      const game = Poker.Game(freshHand);

      // With no actions, should be waiting for dealer action or first player
      expect(game.nextPlayerIndex).toBeDefined();
      expect(game.nextPlayerIndex).toBeGreaterThanOrEqual(-1); // -1 for dealer
    });

    it('should initialize button and blind positions', () => {
      const game = Poker.Game(MINIMAL_HAND);

      expect(game).toHaveProperty('buttonIndex');
      expect(game).toHaveProperty('smallBlindIndex');
      expect(game).toHaveProperty('bigBlindIndex');

      // In a 2-player game, button is small blind
      if (game.players.length === 2) {
        expect(game.buttonIndex).toBe(game.smallBlindIndex);
      }
    });

    it('should handle completed hands', () => {
      const game = Poker.Game(COMPLETED_HAND);

      expect(game.isComplete).toBe(true);
      // Game should have winner information
      expect(game.players.some(p => p.winnings && p.winnings > 0)).toBe(true);
    });

    it('should set seed for deterministic dealing', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      expect(game.seed).toBe(NO_LIMIT_HAND.seed);
    });

    it('should initialize timing properties', () => {
      const game = Poker.Game(NO_LIMIT_HAND);

      expect(game.timeLimit).toBe(NO_LIMIT_HAND.timeLimit);
      expect(game).toHaveProperty('lastTimestamp');
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimal Hand data', () => {
      const minimalHand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [10, 20],
        minBet: 20,
        antes: [0, 0],
        actions: [],
      };

      const game = Poker.Game(minimalHand);
      expect(game.players).toHaveLength(2);
      expect(game.variant).toBe('NT');
    });

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

    it('should handle hands with only dealer actions', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: ['d dh p1 AsKs', 'd dh p2 7h2d', 'd dh p3 QhQc', 'd dh p4 JdTd'],
      };

      const game = Poker.Game(hand);
      expect(game).toBeDefined();
      expect(game.players[0].cards).toEqual(['As', 'Ks']);
      expect(game.players[1].cards).toEqual(['7h', '2d']);
    });

    it('should handle different player counts', () => {
      const twoPlayerHand: Poker.Hand = {
        ...MINIMAL_HAND,
      };

      const ninePlayerHand: Poker.Hand = {
        variant: 'NT',
        players: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9'],
        startingStacks: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20, 0, 0, 0, 0, 0, 0],
        antes: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        minBet: 20,
        actions: [],
      };

      const game2 = Poker.Game(twoPlayerHand);
      const game9 = Poker.Game(ninePlayerHand);

      expect(game2.players).toHaveLength(2);
      expect(game9.players).toHaveLength(9);
    });
  });

  describe('Action Replay', () => {
    it('should correctly replay all actions in sequence', () => {
      const hand: Poker.Hand = {
        ...NO_LIMIT_HAND,
        actions: [
          'd dh p1 AsKs',
          'd dh p2 7h2d',
          'd dh p3 QhQc',
          'd dh p4 JdTd',
          'p3 cbr 60', // Charlie raises to 60
          'p4 cc 60', // David calls 60
        ],
      };

      const game = Poker.Game(hand);

      expect(game.players[0].cards).toEqual(['As', 'Ks']);
      expect(game.players[1].cards).toEqual(['7h', '2d']);
      expect(game.players[2].cards).toEqual(['Qh', 'Qc']);
      expect(game.players[3].cards).toEqual(['Jd', 'Td']);
      expect(game.players[0].roundBet).toBe(10);
      expect(game.players[1].roundBet).toBe(20);
      expect(game.players[2].roundBet).toBe(60);
      expect(game.players[3].roundBet).toBe(60);
      expect(game.pot).toBe(150);
    });

    it('should handle complex action sequences', () => {
      const game = Poker.Game(SHOWDOWN_HAND);

      // Should be at river after all actions
      expect(game.street).toBe('river');
      expect(game.board).toHaveLength(5);
      expect(game.isComplete).toBe(true);
    });
  });
});
