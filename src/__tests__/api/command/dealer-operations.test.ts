import { beforeEach, describe, expect, it } from 'vitest';
import { Game } from '../../../Game';
import {
  getActionCards,
  getActionPlayerIndex,
  getActionTimestamp,
  getActionType,
} from '../../../game/position';
import * as Poker from '../../../index';
import { BASE_HAND } from './fixtures/baseHand';

/**
 * Dealer Operations Command Tests
 *
 * Tests the core contracts for dealer Commands:
 * - Generate valid Action strings
 * - Deterministic behavior (same input = same output)
 * - Proper game state analysis
 * - Player identifier handling
 */
describe('Dealer Operation Commands', () => {
  let preflopGame: Game;
  let baseGame: Game;
  let readyForFlopGame: Game;
  let showdownGame: Game;

  beforeEach(() => {
    preflopGame = Poker.Game(
      Poker.Hand({
        ...BASE_HAND,
        actions: [],
      })
    );

    const hand = Poker.Hand({
      ...BASE_HAND,
      actions: BASE_HAND.actions.slice(0, 3), // Only deal hole cards
    });
    baseGame = Poker.Game(hand);

    readyForFlopGame = Poker.Game(
      Poker.Hand({
        ...BASE_HAND,
        actions: BASE_HAND.actions.slice(0, 6),
      })
    );

    showdownGame = Poker.Game(Poker.Hand(BASE_HAND));
  });

  describe('deal Command', () => {
    it('should deal hole cards when players need them', () => {
      const dealAction = Poker.Command.deal(preflopGame);

      expect(dealAction).not.toBeNull();
      expect(dealAction).toBeTruthy();

      // Type is narrowed after null check
      const action = dealAction as string;
      expect(getActionType(action)).toBe('dh');
      expect(getActionCards(action)).toEqual(['Qs', '5h']);
      expect(getActionCards(action)?.length).toBeGreaterThan(0);
      expect(getActionTimestamp(action)).toBeTypeOf('number');
    });

    it('should deal flop when ready for board cards', () => {
      const dealAction = Poker.Command.deal(readyForFlopGame);

      expect(dealAction).not.toBeNull();
      expect(dealAction).toBeTruthy();

      // Type is narrowed after null check
      const action = dealAction as string;
      expect(getActionType(action)).toBe('db');
      expect(getActionCards(action)).toBeDefined();
      expect(getActionCards(action)).toEqual(['7h', 'Ac', '5c']);
      expect(getActionTimestamp(action)).toBeTypeOf('number');
    });

    it('should handle showdown when needed', () => {
      const dealAction = Poker.Command.deal(showdownGame);

      // In showdown, might show cards or return null if no action needed
      if (dealAction !== null) {
        expect(getActionType(dealAction)).toBe('sm');
      }
    });

    it('should be deterministic', () => {
      const action1 = Poker.Command.deal(preflopGame);
      const action2 = Poker.Command.deal(preflopGame);

      expect(action1).not.toBeNull();
      expect(action2).not.toBeNull();
      expect(action1).toBeTruthy();
      expect(action2).toBeTruthy();

      // Type is narrowed after null checks
      const a1 = action1 as string;
      const a2 = action2 as string;

      // Actions should have same type, player, and cards
      expect(getActionType(a1)).toBe(getActionType(a2));
      expect(getActionPlayerIndex(a1)).toBe(getActionPlayerIndex(a2));
      expect(getActionCards(a1)).toEqual(getActionCards(a2));
      expect(getActionTimestamp(a1)).toBeTypeOf('number');
      expect(getActionTimestamp(a2)).toBeTypeOf('number');
    });

    it('should be deterministic for flop dealing', () => {
      const action1 = Poker.Command.deal(readyForFlopGame);
      const action2 = Poker.Command.deal(readyForFlopGame);

      expect(action1).not.toBeNull();
      expect(action2).not.toBeNull();
      expect(action1).toBeTruthy();
      expect(action2).toBeTruthy();

      // Type is narrowed after null checks
      const a1 = action1 as string;
      const a2 = action2 as string;

      // Actions should have same type and cards, timestamps may differ
      expect(getActionType(a1)).toBe(getActionType(a2));
      expect(getActionCards(a1)).toEqual(getActionCards(a2));
      expect(getActionPlayerIndex(a1)).toBe(getActionPlayerIndex(a2));
      expect(getActionCards(a1)).toEqual(['7h', 'Ac', '5c']);
      expect(getActionCards(a2)).toEqual(['7h', 'Ac', '5c']);
      expect(getActionTimestamp(a1)).toBeTypeOf('number');
      expect(getActionTimestamp(a2)).toBeTypeOf('number');
    });

    it('should target first player needing cards', () => {
      const dealAction = Poker.Command.deal(preflopGame)!;

      expect(dealAction).not.toBeNull();
      expect(dealAction).toBeTruthy();

      // Type is narrowed after null check
      const action = dealAction as string;
      expect(getActionType(action)).toBe('dh');
      expect(getActionPlayerIndex(action)).toBe(0); // Player 0 (p1)
      expect(getActionTimestamp(dealAction)).toBeTypeOf('number');
    });

    it('should generate different Actions for different seeds', () => {
      const differentSeedGame = Poker.Game(
        Poker.Hand({
          ...BASE_HAND,
          seed: 54321,
          actions: [],
        })
      );

      const sameSeedAction = Poker.Command.deal(preflopGame);
      const differentSeedAction = Poker.Command.deal(differentSeedGame);

      expect(sameSeedAction).not.toBeNull();
      expect(differentSeedAction).not.toBeNull();
      expect(sameSeedAction).toBeTruthy();
      expect(differentSeedAction).toBeTruthy();

      expect(sameSeedAction).not.toBe(differentSeedAction);
    });

    it('should return empty action when no dealer action is needed', () => {
      // Create a game where a player needs to act, not the dealer
      const playerTurnGame = Poker.Game(
        Poker.Hand({
          ...BASE_HAND,
          actions: BASE_HAND.actions.slice(0, 9), // After hole cards and flop dealt, waiting for player action
        })
      );

      const dealAction = Poker.Command.deal(playerTurnGame);
      expect(dealAction).toBeNull();
    });
  });

  describe('showCards Command', () => {
    it('should generate show Action with player index', () => {
      const showAction = Poker.Command.showCards(showdownGame, 0);

      expect(getActionPlayerIndex(showAction)).toBe(0); // Player 0 (p1)
      expect(getActionType(showAction)).toBe('sm');
      expect(getActionCards(showAction)).toBeDefined();
      expect(getActionTimestamp(showAction)).toBeTypeOf('number');
    });

    it('should generate show Action with player name', () => {
      const showAction = Poker.Command.showCards(showdownGame, 'Bob');

      expect(getActionPlayerIndex(showAction)).toBe(1); // Player 1 (p2 - Bob)
      expect(getActionType(showAction)).toBe('sm');
      expect(getActionCards(showAction)).toBeDefined();
      expect(getActionTimestamp(showAction)).toBeTypeOf('number');
    });

    it('should show player actual cards', () => {
      const aliceShowAction = Poker.Command.showCards(showdownGame, 'Alice');

      expect(getActionPlayerIndex(aliceShowAction)).toBe(0); // Alice is player 0 (p1)
      expect(getActionType(aliceShowAction)).toBe('sm');
      expect(getActionCards(aliceShowAction)).toEqual(['6c', '5h']);
      expect(getActionTimestamp(aliceShowAction)).toBeTypeOf('number');
    });

    it('should handle both index and name identifiers', () => {
      const showByIndex = Poker.Command.showCards(showdownGame, 1);
      const showByName = Poker.Command.showCards(showdownGame, 'Bob');

      // Both should target the same player with same action type and cards
      expect(getActionPlayerIndex(showByIndex)).toBe(getActionPlayerIndex(showByName));
      expect(getActionType(showByIndex)).toBe(getActionType(showByName));
      expect(getActionCards(showByIndex)).toEqual(getActionCards(showByName));
      expect(getActionTimestamp(showByIndex)).toBeTypeOf('number');
      expect(getActionTimestamp(showByName)).toBeTypeOf('number');
    });
  });

  describe('muckCards Command', () => {
    it('should generate muck Action with player index', () => {
      const muckAction = Poker.Command.muckCards(showdownGame, 0);

      expect(getActionPlayerIndex(muckAction)).toBe(0); // Player 0 (p1)
      expect(getActionType(muckAction)).toBe('sm');
      expect(getActionTimestamp(muckAction)).toBeTypeOf('number');
    });

    it('should generate muck Action with player name', () => {
      const muckAction = Poker.Command.muckCards(showdownGame, 'Charlie');

      expect(getActionPlayerIndex(muckAction)).toBe(2); // Player 2 (p3 - Charlie)
      expect(getActionType(muckAction)).toBe('sm');
      expect(getActionTimestamp(muckAction)).toBeTypeOf('number');
    });

    it('should handle both index and name identifiers', () => {
      const muckByIndex = Poker.Command.muckCards(showdownGame, 2);
      const muckByName = Poker.Command.muckCards(showdownGame, 'Charlie');

      // Both should target the same player with same action type
      expect(getActionPlayerIndex(muckByIndex)).toBe(getActionPlayerIndex(muckByName));
      expect(getActionType(muckByIndex)).toBe(getActionType(muckByName));
      expect(getActionTimestamp(muckByIndex)).toBeTypeOf('number');
      expect(getActionTimestamp(muckByName)).toBeTypeOf('number');
    });
  });

  describe('forceShowCards Command', () => {
    it('should return null when no player needs to show cards', () => {
      // Test with preflop game where no showdown has occurred yet
      const forceShowAction = Poker.Command.forceShowCards(preflopGame);

      expect(forceShowAction).toBe(null);
    });

    it('should return action string when player needs to show cards', () => {
      // Test with showdown game where players should show cards
      const forceShowAction = Poker.Command.forceShowCards(baseGame);

      expect(typeof forceShowAction).toBe('string');
      expect(getActionPlayerIndex(forceShowAction ?? '')).toBe(0); // Player 0 (p1)
      expect(getActionType(forceShowAction ?? '')).toBe('sm');
      expect(getActionCards(forceShowAction ?? '')).toEqual(['6c', '5h']);
      expect(getActionTimestamp(forceShowAction ?? '')).toBeTypeOf('number');
    });

    it('should be deterministic for same game state', () => {
      const action1 = Poker.Command.forceShowCards(showdownGame);
      const action2 = Poker.Command.forceShowCards(showdownGame);

      expect(action1).toBe(action2);
    });

    it('should automatically determine next player to show cards', () => {
      const forceShowAction = Poker.Command.forceShowCards(baseGame);

      // Should return specific action for next player who needs to show
      expect(getActionPlayerIndex(forceShowAction ?? '')).toBe(0); // Player 0 (p1)
      expect(getActionType(forceShowAction ?? '')).toBe('sm');
      expect(getActionTimestamp(forceShowAction ?? '')).toBeTypeOf('number');
    });
  });
});
