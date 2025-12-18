// src/__tests__/api/command/core-contract.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import {
  getActionAmount,
  getActionCards,
  getActionPlayerIndex,
  getActionTimestamp,
  getActionType,
} from '../../../game/position';
import { applyAction } from '../../../game/progress';
import * as Poker from '../../../index';
import { BASE_HAND } from './fixtures/baseHand';

/**
 * Core Contract Tests for Command API
 *
 * Purpose: Validate that Command methods are pure functions that:
 * 1. Never mutate input Game state
 * 2. Return consistent Action strings for identical inputs
 * 3. Generate Actions that can be validated via applyAction()
 *
 * Architecture: Command -> Action string -> applyAction() -> New Poker.Game | Error
 * Base: All tests use BASE_HAND as the foundation for consistent, deterministic scenarios
 */
describe('Command Core Contracts', () => {
  let baseGame: Poker.Game;
  let gameSnapshot: string;
  let preflopGame: Poker.Game;
  let readyForFlopGame: Poker.Game;

  beforeEach(() => {
    // Fixture: Standard 3-player game from BASE_HAND where Alice is next to act preflop
    const hand = Poker.Hand({
      ...BASE_HAND,
      actions: BASE_HAND.actions.slice(0, 3), // Only deal hole cards
    });
    baseGame = Poker.Game(hand);
    gameSnapshot = JSON.stringify(baseGame);

    // Additional fixture: Clean preflop game for dealer operations testing
    const preflopHand = Poker.Hand({
      ...BASE_HAND,
      actions: [], // No actions yet
    });
    preflopGame = Poker.Game(preflopHand);

    // Fixture: Game ready for flop (all players have acted preflop)
    const readyForFlopHand = Poker.Hand({
      ...BASE_HAND,
      actions: BASE_HAND.actions.slice(0, 6), // Hole cards dealt and all players checked
    });
    readyForFlopGame = Poker.Game(readyForFlopHand);
  });

  describe('State Immutability Contract', () => {
    it('should never mutate input Poker.Game object during Action generation', () => {
      // Logic: Generate Actions and verify original Game unchanged
      // Testing: Commands are pure functions without side effects

      const commands = [
        () => Poker.Command.fold(baseGame, 0),
        () => Poker.Command.call(baseGame, 0),
        () => Poker.Command.bet(baseGame, 0, 100),
        () => Poker.Command.raise(baseGame, 0, 200),
        () => Poker.Command.allIn(baseGame, 0),
      ];

      commands.forEach(commandFn => {
        const action = commandFn();
        // Expectation: Original Game object must remain unchanged
        expect(JSON.stringify(baseGame)).toBe(gameSnapshot);
        // Verify we got a valid Action string
        expect(getActionPlayerIndex(action)).toBe(0);
        expect(getActionTimestamp(action)).toBeTypeOf('number');
        expect(typeof action).toBe('string');
        expect(action.length).toBeGreaterThan(0);
      });
    });

    it('should never mutate Game during dealer Action generation', () => {
      // Logic: Generate dealer Actions without affecting input Game
      // Testing: Dealer commands also respect immutability

      const dealerCommands = [
        () => Poker.Command.deal(baseGame),
        () => Poker.Command.deal(preflopGame),
        () => Poker.Command.forceShowCards(baseGame),
      ];

      dealerCommands.forEach(commandFn => {
        commandFn();
        // Expectation: Game state unchanged after dealer Action generation
        expect(JSON.stringify(baseGame)).toBe(gameSnapshot);
      });
    });
  });

  describe('Deterministic Output Contract', () => {
    it('should return identical Actions for identical inputs', () => {
      // Logic: Call same Command multiple times
      // Testing: Commands produce consistent output

      const action1 = Poker.Command.fold(baseGame, 0);
      const action2 = Poker.Command.fold(baseGame, 0);
      const action3 = Poker.Command.bet(baseGame, 0, 150);
      const action4 = Poker.Command.bet(baseGame, 0, 150);

      // Expectation: Identical inputs produce identical Actions
      expect(action1).toBe(action2);
      expect(action3).toBe(action4);
    });

    it('should return different Actions for different parameters', () => {
      // Logic: Test Commands with different parameters
      // Testing: Parameter changes affect Action generation

      const alice_fold = Poker.Command.fold(baseGame, 0);
      const bob_fold = Poker.Command.fold(baseGame, 1);
      const bet_50 = Poker.Command.bet(baseGame, 0, 50);
      const bet_100 = Poker.Command.bet(baseGame, 0, 100);

      // Expectation: Different parameters produce different Actions
      expect(alice_fold).not.toBe(bob_fold);
      expect(bet_50).not.toBe(bet_100);
    });
  });

  describe('Action Applicability Contract', () => {
    it('should generate Actions that can be processed by applyAction', () => {
      // Logic: Generate Action then attempt to apply it
      // Testing: Commands generate processable Actions for valid game states

      const validAction = Poker.Command.fold(baseGame, 0); // Alice can fold

      // Expectation: Generated Action should be applicable without throwing
      expect(() => {
        const newGame = applyAction(baseGame, validAction);
        expect(newGame).toBeDefined();
        expect(newGame.players[0].hasFolded).toBe(true);
      }).not.toThrow();
    });

    it('should generate Actions that fail appropriately for invalid game states', () => {
      // Fixture: Create game where player already folded
      const foldedGame = applyAction(baseGame, Poker.Command.fold(baseGame, 0));

      // Logic: Try to generate Action for folded player
      // Testing: Commands generate Actions even for invalid states, but applyAction rejects them

      const invalidAction = Poker.Command.call(foldedGame, 0); // Folded player can't call

      // Expectation: Action generates but applyAction should throw
      expect(typeof invalidAction).toBe('string');
      expect(() => {
        applyAction(foldedGame, invalidAction);
      }).toThrow();
    });

    it('should generate valid Actions for different player identifiers', () => {
      // Logic: Test Commands work with both numeric and string player identifiers
      // Testing: PlayerIdentifier resolution in Commands

      const numericAction = Poker.Command.fold(baseGame, 0);
      const stringAction = Poker.Command.fold(baseGame, 'Alice');

      // Both should produce valid, applicable Actions
      expect(() => applyAction(JSON.parse(JSON.stringify(baseGame)), numericAction)).not.toThrow();
      expect(() => applyAction(JSON.parse(JSON.stringify(baseGame)), stringAction)).not.toThrow();

      // And they should be identical
      expect(getActionPlayerIndex(numericAction)).toBe(getActionPlayerIndex(stringAction));
      expect(getActionType(numericAction)).toBe(getActionType(stringAction));
    });
  });

  describe('Return Value Contract', () => {
    it('should always return string Actions, never null or undefined', () => {
      // Logic: Test Commands with various parameters including edge cases
      // Testing: Commands handle all inputs gracefully

      const commands = [
        () => Poker.Command.fold(baseGame, 0),
        () => Poker.Command.call(baseGame, 0),
        () => Poker.Command.bet(baseGame, 0, 100),
        () => Poker.Command.message(baseGame, 0, 'Hello'),
      ];

      commands.forEach(commandFn => {
        const result = commandFn();
        // Expectation: All Commands return valid Action strings
        expect(typeof result).toBe('string');
        expect(result).toBeDefined();
        expect(result).not.toBeNull();
      });
    });

    it('should return Action strings even for problematic inputs', () => {
      // Logic: Test Commands with edge case parameters
      // Testing: Commands handle boundary conditions by returning valid Actions

      const edgeCaseCommands = [
        () => Poker.Command.fold(baseGame, 0), // Valid player (Alice)
        () => Poker.Command.bet(baseGame, 0, 0), // Zero bet amount
        () => Poker.Command.call(baseGame, 'Alice'), // Valid player name
      ];

      edgeCaseCommands.forEach(commandFn => {
        const result = commandFn();
        // Expectation: Commands return valid Action strings for edge cases
        expect(getActionPlayerIndex(result)).toBe(0);
        expect(getActionTimestamp(result)).toBeTypeOf('number');
        expect(typeof result).toBe('string');
        expect(result).toBeDefined();
      });
    });
  });

  describe('Action Format Contract', () => {
    it('should generate Actions in expected string format', () => {
      // Logic: Check that generated Actions follow expected patterns
      // Testing: Action string format compliance

      const fold_action = Poker.Command.fold(baseGame, 0);
      const call_action = Poker.Command.call(baseGame, 0);
      const bet_action = Poker.Command.bet(baseGame, 0, 150);

      // Expectation: Actions should have valid format and specific structure
      expect(getActionPlayerIndex(fold_action)).toBe(0); // Player 0 (p1)
      expect(getActionType(fold_action)).toBe('f');
      expect(getActionTimestamp(fold_action)).toBeTypeOf('number');

      expect(getActionPlayerIndex(call_action)).toBe(0); // Player 0 (p1)
      expect(getActionType(call_action)).toBe('cc');
      expect(getActionAmount(call_action)).toBeGreaterThan(0);
      expect(getActionTimestamp(call_action)).toBeTypeOf('number');

      expect(getActionPlayerIndex(bet_action)).toBe(0); // Player 0 (p1)
      expect(getActionType(bet_action)).toBe('cbr');
      expect(getActionAmount(bet_action)).toBe(150);
      expect(getActionTimestamp(bet_action)).toBeTypeOf('number');
    });

    it('should generate dealer Actions in expected format', () => {
      // Logic: Test dealer Action format patterns
      // Testing: Dealer Action string formatting

      const hole_action = Poker.Command.deal(preflopGame)!;
      const board_action = Poker.Command.deal(readyForFlopGame)!;
      const no_action = Poker.Command.deal(baseGame); // Players need to act first
      const force_show_action = Poker.Command.forceShowCards(baseGame);

      // Expectation: Dealer Actions should have valid format and expected structure
      expect(getActionType(hole_action)).toBe('dh');
      expect(getActionPlayerIndex(hole_action)).toBe(0); // Player 0 (p1) gets first cards
      expect(getActionCards(hole_action)).toEqual(['Qs', '5h']);
      expect(getActionPlayerIndex(hole_action)).toBe(0);
      expect(getActionTimestamp(hole_action)).toBeGreaterThan(0);

      expect(getActionType(board_action)).toBe('db');
      expect(getActionCards(board_action)).toEqual(['7h', 'Ac', '5c']);
      expect(getActionPlayerIndex(board_action)).toBe(undefined);
      expect(getActionTimestamp(board_action)).toBeGreaterThan(0);

      // When it's not dealer's turn, should return null
      expect(no_action).toBeNull();

      // forceShowCards should return null for preflop game state (no showdown yet)
      expect(getActionPlayerIndex(force_show_action ?? '')).toBe(0); // Player 0 (p1)
      expect(getActionType(force_show_action ?? '')).toBe('sm');
      expect(getActionCards(force_show_action ?? '')).toEqual(['6c', '5h']);
      expect(getActionTimestamp(force_show_action ?? '')).toBeGreaterThan(0);
    });
  });

  describe('BASE_HAND Integration Contract', () => {
    it('should generate consistent Actions using BASE_HAND data', () => {
      // Logic: Verify Commands work consistently with BASE_HAND foundation
      // Testing: BASE_HAND provides reliable test foundation
      const game = JSON.parse(JSON.stringify(baseGame));

      const charlieAction = Poker.Command.fold(game, 'Charlie');
      const aliceAction = Poker.Command.fold(game, 'Alice');
      const bobAction = Poker.Command.fold(game, 'Bob');

      // Expectation: Actions should reference correct players from BASE_HAND
      expect(getActionPlayerIndex(charlieAction)).toBe(2); // Player 2 (p3 - Charlie)
      expect(getActionType(charlieAction)).toBe('f');
      expect(getActionTimestamp(charlieAction)).toBeTypeOf('number');
      expect(getActionAmount(charlieAction)).toEqual(0);

      expect(getActionPlayerIndex(aliceAction)).toBe(0); // Player 0 (p1 - Alice)
      expect(getActionType(aliceAction)).toBe('f');
      expect(getActionTimestamp(aliceAction)).toBeTypeOf('number');
      expect(getActionAmount(aliceAction)).toEqual(0);

      expect(getActionPlayerIndex(bobAction)).toBe(1); // Player 1 (p2 - Bob)
      expect(getActionType(bobAction)).toBe('f');
      expect(getActionTimestamp(bobAction)).toBeTypeOf('number');
      expect(getActionAmount(bobAction)).toEqual(0);

      // Verify all actions are applicable
      expect(() => applyAction(game, aliceAction)).not.toThrow();
      expect(() => applyAction(game, bobAction)).not.toThrow();
      // Charlie should throw because he is the only player left, game is over
      expect(() => applyAction(game, charlieAction)).toThrow();
    });

    it('should generate deterministic dealer Actions with BASE_HAND seed', () => {
      // Logic: Verify dealer Actions are deterministic with BASE_HAND seed
      // Testing: BASE_HAND seed ensures reproducible card dealing
      const game = JSON.parse(JSON.stringify(preflopGame));

      const dealAction1 = Poker.Command.deal(game)!;
      if (dealAction1) applyAction(game, dealAction1);
      const dealAction2 = Poker.Command.deal(game)!;
      if (dealAction2) applyAction(game, dealAction2);
      const dealAction3 = Poker.Command.deal(game)!;
      if (dealAction3) applyAction(game, dealAction3);

      // Actions should be deterministic and match expected format
      expect(getActionType(dealAction1)).toBe('dh');
      expect(getActionPlayerIndex(dealAction1)).toBe(0); // Player 0 (p1)
      expect(getActionCards(dealAction1)).toEqual(['Qs', '5h']);
      expect(getActionTimestamp(dealAction1)).toBeTypeOf('number');

      expect(getActionType(dealAction2)).toBe('dh');
      expect(getActionPlayerIndex(dealAction2)).toBe(1); // Player 1 (p2)
      expect(getActionCards(dealAction2)).toEqual(['Kh', 'Jd']);
      expect(getActionTimestamp(dealAction2)).toBeTypeOf('number');

      expect(getActionType(dealAction3)).toBe('dh');
      expect(getActionPlayerIndex(dealAction3)).toBe(2); // Player 2 (p3)
      expect(getActionCards(dealAction3)).toEqual(['8h', '6s']);
      expect(getActionTimestamp(dealAction3)).toBeTypeOf('number');

      // Exectation: Game players should have the correct hole cards
      expect(game.players[0].cards).toEqual(['Qs', '5h']);
      expect(game.players[1].cards).toEqual(['Kh', 'Jd']);
      expect(game.players[2].cards).toEqual(['8h', '6s']);
    });
  });
});
