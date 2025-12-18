// src/__tests__/api/command/player-actions.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { Game } from '../../../Game';
import {
  getActionAmount,
  getActionPlayerIndex,
  getActionTimestamp,
  getActionType,
} from '../../../game/position';
import { applyAction } from '../../../game/progress';
import * as Poker from '../../../index';
import { BASE_HAND } from './fixtures/baseHand';

/**
 * Player Actions Command Tests
 *
 * Purpose: Test specific player action Commands (fold, call, check, bet, raise, allIn, auto, message)
 * Focus: Verify each Command generates correct Action strings and handles parameters properly
 * Critical: All-in amounts must reflect TOTAL bet amount (currentBet + remaining stack)
 * Base: All tests use BASE_HAND as the foundation for consistent, deterministic scenarios
 */
describe('Player Action Commands', () => {
  let preflopGame: Game;
  let flopGame: Game;
  let turnGame: Game;
  let showdownGame: Game;
  let bettingGame: Game;

  beforeEach(() => {
    // Fixture 1: Preflop state - hole cards dealt, players ready to act
    const preflopHand = Poker.Hand({
      ...BASE_HAND,
      actions: BASE_HAND.actions.slice(0, 3), // Only deal hole cards
    });
    preflopGame = Poker.Game(preflopHand);

    // Fixture 2: Flop state - preflop complete, flop dealt
    const flopHand = Poker.Hand({
      ...BASE_HAND,
      actions: BASE_HAND.actions.slice(0, 7), // Through flop
    });
    flopGame = Poker.Game(flopHand);

    // Fixture 3: Turn state - flop complete, turn dealt
    const turnHand = Poker.Hand({
      ...BASE_HAND,
      actions: BASE_HAND.actions.slice(0, 11), // Through turn
    });
    turnGame = Poker.Game(turnHand);

    // Fixture 4: Complete hand at showdown
    const showdownHand = Poker.Hand(BASE_HAND);
    showdownGame = Poker.Game({ ...showdownHand, actions: [...showdownHand.actions.slice(0, -2)] });

    // Fixture 5: Game with betting action - create from BASE_HAND with bet
    const bettingHand = Poker.Hand({
      ...BASE_HAND,
      actions: [
        ...BASE_HAND.actions.slice(0, 3), // Deal hole cards
        'p1 cbr 60', // Alice bets
        'p2 cc 60', // Bob calls
        // Charlie to act
      ],
    });
    bettingGame = Poker.Game(bettingHand);
    // using the variables
    if (!turnGame || !flopGame || !preflopGame || !showdownGame || !bettingGame)
      throw new Error('Game is undefined');
  });

  describe('allIn Command - Critical Stack Calculations', () => {
    it('should generate all-in for total bet amount from BASE_HAND', () => {
      // Logic: Test all-in calculation using BASE_HAND foundation
      // Testing: All-in returns total bet amount (currentBet + remainingStack)

      // From BASE_HAND: Alice, Bob, Charlie all have 1000 starting stacks
      // After preflop calls, all players invested 20 (currentBet = 20, stack = 980)
      const aliceAllIn = Poker.Command.allIn(flopGame, 0);
      const bobAllIn = Poker.Command.allIn(flopGame, 1);
      const charlieAllIn = Poker.Command.allIn(flopGame, 2);

      // Expectation: All-in amounts should be total bet amounts (currentBet + stack = 1000 - 20 = 980)
      expect(getActionPlayerIndex(aliceAllIn)).toBe(0); // Player 0 (p1)
      expect(getActionType(aliceAllIn)).toBe('cbr');
      expect(getActionAmount(aliceAllIn)).toBe(980);
      expect(getActionTimestamp(aliceAllIn)).toBeTypeOf('number');

      expect(getActionPlayerIndex(bobAllIn)).toBe(1); // Player 1 (p2)
      expect(getActionType(bobAllIn)).toBe('cbr');
      expect(getActionAmount(bobAllIn)).toBe(980);
      expect(getActionTimestamp(bobAllIn)).toBeTypeOf('number');

      expect(getActionPlayerIndex(charlieAllIn)).toBe(2); // Player 2 (p3)
      expect(getActionType(charlieAllIn)).toBe('cbr');
      expect(getActionAmount(charlieAllIn)).toBe(980);
      expect(getActionTimestamp(charlieAllIn)).toBeTypeOf('number');

      // Verify actions are applicable
      expect(() => applyAction(flopGame, bobAllIn)).not.toThrow();
      expect(() => applyAction(flopGame, charlieAllIn)).not.toThrow();
      expect(() => applyAction(flopGame, aliceAllIn)).not.toThrow();
    });

    it('should generate all-in after betting from BASE_HAND state', () => {
      // Logic: Test all-in calculation after betting action from BASE_HAND
      // Testing: All-in calculation with player investments

      // From bettingGame: Alice bet 60, Bob called 60, Charlie to act
      // Charlie still has 1000 - 0 = 1000 remaining (hasn't acted yet)
      const charlieAllIn = Poker.Command.allIn(bettingGame, 2);

      expect(getActionPlayerIndex(charlieAllIn)).toBe(2); // Player 2 (p3)
      expect(getActionType(charlieAllIn)).toBe('cbr');
      expect(getActionAmount(charlieAllIn)).toBe(1000); // Full stack available
      expect(getActionTimestamp(charlieAllIn)).toBeTypeOf('number');

      // Apply the bet and test Alice's remaining stack
      const afterCharlieCall = applyAction(bettingGame, 'p3 cc 60');
      const aliceAllIn = Poker.Command.allIn(afterCharlieCall, 0);

      expect(getActionPlayerIndex(aliceAllIn)).toBe(0); // Player 0 (p1)
      expect(getActionType(aliceAllIn)).toBe('cbr');
      expect(getActionAmount(aliceAllIn)).toBe(1000); // 1000 = 60 + 940 remaining
      expect(getActionTimestamp(aliceAllIn)).toBeTypeOf('number');
    });

    it('should handle all-in scenarios with different stack investments', () => {
      // Logic: Create scenario with varied investments from BASE_HAND
      // Testing: All-in calculation with different player investments

      // Create a scenario where players have different investments
      const variedInvestmentHand = Poker.Hand({
        ...BASE_HAND,
        startingStacks: [500, 800, 1200], // Different starting stacks
        actions: [
          'd dh p1 6c5h',
          'd dh p2 Jc2s',
          'd dh p3 Tc3c',
          'p1 cbr 100', // Alice raises to 100
          'p2 cc 100', // Bob calls
          // Charlie to act
        ],
      });
      const variedGame = Poker.Game(variedInvestmentHand);

      const aliceAllIn = Poker.Command.allIn(variedGame, 0);
      const bobAllIn = Poker.Command.allIn(variedGame, 1);
      const charlieAllIn = Poker.Command.allIn(variedGame, 2);

      expect(getActionPlayerIndex(aliceAllIn)).toBe(0); // Player 0 (p1)
      expect(getActionType(aliceAllIn)).toBe('cbr');
      expect(getActionAmount(aliceAllIn)).toBe(500); // currentBet (100) + stack (400) = 500 total
      expect(getActionTimestamp(aliceAllIn)).toBeTypeOf('number');

      expect(getActionPlayerIndex(bobAllIn)).toBe(1); // Player 1 (p2)
      expect(getActionType(bobAllIn)).toBe('cbr');
      expect(getActionAmount(bobAllIn)).toBe(800); // currentBet (100) + stack (700) = 800 total
      expect(getActionTimestamp(bobAllIn)).toBeTypeOf('number');

      expect(getActionPlayerIndex(charlieAllIn)).toBe(2); // Player 2 (p3)
      expect(getActionType(charlieAllIn)).toBe('cbr');
      expect(getActionAmount(charlieAllIn)).toBe(1200); // currentBet (0) + stack (1200) = 1200 total
      expect(getActionTimestamp(charlieAllIn)).toBeTypeOf('number');
    });
  });

  describe('fold Command', () => {
    it('should generate fold Action for active player', () => {
      const foldAction = Poker.Command.fold(preflopGame, 0);

      expect(getActionPlayerIndex(foldAction)).toBe(0); // Player 0 (p1)
      expect(getActionType(foldAction)).toBe('f');
      expect(getActionTimestamp(foldAction)).toBeTypeOf('number');

      const newGame = applyAction(preflopGame, foldAction);
      expect(newGame.players[0].hasFolded).toBe(true);
    });

    it('should generate fold Actions for different players', () => {
      const aliceFold = Poker.Command.fold(preflopGame, 0);
      const bobFold = Poker.Command.fold(preflopGame, 1);
      const charlieFold = Poker.Command.fold(preflopGame, 2);

      expect(getActionPlayerIndex(aliceFold)).toBe(0); // Player 0 (p1)
      expect(getActionType(aliceFold)).toBe('f');
      expect(getActionTimestamp(aliceFold)).toBeTypeOf('number');
      expect(getActionAmount(aliceFold)).toBe(0);

      expect(getActionPlayerIndex(bobFold)).toBe(1); // Player 1 (p2)
      expect(getActionType(bobFold)).toBe('f');
      expect(getActionTimestamp(bobFold)).toBeTypeOf('number');
      expect(getActionAmount(bobFold)).toBe(0);

      expect(getActionPlayerIndex(charlieFold)).toBe(2); // Player 2 (p3)
      expect(getActionType(charlieFold)).toBe('f');
      expect(getActionTimestamp(charlieFold)).toBeTypeOf('number');
      expect(getActionAmount(charlieFold)).toBe(0);
    });

    it('should generate fold Action using string player identifier', () => {
      const foldByName = Poker.Command.fold(preflopGame, 'Alice');
      const foldByIndex = Poker.Command.fold(preflopGame, 0);

      // Both should target the same player with same action type
      expect(getActionPlayerIndex(foldByName)).toBe(getActionPlayerIndex(foldByIndex));
      expect(getActionType(foldByName)).toBe(getActionType(foldByIndex));
      expect(getActionPlayerIndex(foldByName)).toBe(0); // Player 0 (p1 - Alice)
      expect(getActionType(foldByName)).toBe('f');
      expect(getActionTimestamp(foldByName)).toBeTypeOf('number');
      expect(getActionTimestamp(foldByIndex)).toBeTypeOf('number');
    });
  });

  describe('call Command', () => {
    it('should generate call Action with correct amount from BASE_HAND', () => {
      const callAction = Poker.Command.call(bettingGame, 2); // Charlie calling the bet

      expect(getActionPlayerIndex(callAction)).toBe(2); // Player 2 (p3 - Charlie)
      expect(getActionType(callAction)).toBe('cc');
      expect(getActionAmount(callAction)).toBeGreaterThan(0);
      expect(getActionTimestamp(callAction)).toBeTypeOf('number');

      const newGame = applyAction(bettingGame, callAction);
      expect(newGame.players[2].roundBet).toBe(bettingGame.bet);
    });

    it('should generate call Action for preflop big blind scenario', () => {
      const callAction = Poker.Command.call(preflopGame, 0);

      expect(getActionPlayerIndex(callAction)).toBe(0); // Player 0 (p1)
      expect(getActionType(callAction)).toBe('cc');
      expect(getActionAmount(callAction)).toBe(20);
      expect(getActionTimestamp(callAction)).toBeTypeOf('number');

      const newGame = applyAction(preflopGame, callAction);
      expect(newGame.players[0].roundBet).toBe(20);
    });
  });

  describe('bet Command', () => {
    it('should generate bet Action with specified amount', () => {
      const betAction = Poker.Command.bet(preflopGame, 0, 150);

      expect(getActionPlayerIndex(betAction)).toBe(0); // Player 0 (p1)
      expect(getActionType(betAction)).toBe('cbr');
      expect(getActionAmount(betAction)).toBe(150);
      expect(getActionTimestamp(betAction)).toBeTypeOf('number');

      const newGame = applyAction(preflopGame, betAction);
      expect(newGame.bet).toBe(150);
      expect(newGame.players[0].roundBet).toBe(150);
    });

    it('should generate bet Action for minimum bet', () => {
      const minBetAction = Poker.Command.bet(preflopGame, 0, 20);

      expect(getActionPlayerIndex(minBetAction)).toBe(0); // Player 0 (p1)
      expect(getActionType(minBetAction)).toBe('cc');
      expect(getActionAmount(minBetAction)).toBe(20);
      expect(getActionTimestamp(minBetAction)).toBeTypeOf('number');
      expect(() => applyAction(preflopGame, minBetAction)).not.toThrow();
    });
  });

  describe('raise Command', () => {
    it('should generate raise Action to specified total amount', () => {
      const raiseAction = Poker.Command.raise(bettingGame, 2, 120);

      expect(getActionPlayerIndex(raiseAction)).toBe(2); // Player 2 (p3)
      expect(getActionType(raiseAction)).toBe('cbr');
      expect(getActionAmount(raiseAction)).toBe(120);
      expect(getActionTimestamp(raiseAction)).toBeTypeOf('number');

      const newGame = applyAction(bettingGame, raiseAction);
      expect(newGame.bet).toBe(120);
      expect(newGame.players[2].roundBet).toBe(120);
    });
  });

  describe('check Command', () => {
    it('should generate check Action when no bet to call', () => {
      const game = JSON.parse(JSON.stringify(flopGame));
      const checkAction = Poker.Command.check(game, 1);

      expect(getActionPlayerIndex(checkAction)).toBe(1); // Player 1 (p2)
      expect(getActionType(checkAction)).toBe('cc');
      expect(getActionAmount(checkAction)).toBe(0);
      expect(getActionTimestamp(checkAction)).toBeTypeOf('number');

      const newGame = applyAction(game, checkAction);
      expect(newGame.players[1].hasActed).toBe(true);
    });
  });

  describe('auto Command', () => {
    it('should generate fold Action for timeout in betting round', () => {
      const autoAction = Poker.Command.auto(preflopGame, 0);

      expect(getActionPlayerIndex(autoAction)).toBe(0); // Player 0 (p1)
      expect(getActionType(autoAction)).toBe('f');
      expect(getActionTimestamp(autoAction)).toBeTypeOf('number');

      const newGame = applyAction(preflopGame, autoAction);
      expect(newGame.players[0].hasFolded).toBe(true);
    });

    it('should generate muck Action for timeout in showdown', () => {
      const autoShowdownAction = Poker.Command.auto(showdownGame, 2);
      expect(getActionPlayerIndex(autoShowdownAction)).toBe(2); // Player 2 (p3)
      expect(getActionType(autoShowdownAction)).toBe('sm');
      expect(getActionTimestamp(autoShowdownAction)).toBeTypeOf('number');

      const newGame = applyAction(showdownGame, autoShowdownAction);
      expect(newGame.players[1].hasShownCards).toBe(true);
    });
  });

  describe('message Command', () => {
    it('should generate message Action with player and text', () => {
      const messageAction = Poker.Command.message(preflopGame, 0, 'Good luck everyone!');

      // Message actions are player actions with type 'm'
      expect(getActionType(messageAction)).toBe('m');
      expect(getActionPlayerIndex(messageAction)).toBe(0);
      expect(getActionTimestamp(messageAction)).toBeTypeOf('number');
      expect(messageAction).toContain('Good luck everyone!');

      expect(() => {
        return applyAction(showdownGame, messageAction);
      }).not.toThrow();
    });

    it('should generate message Action with different players and messages', () => {
      const aliceMsg = Poker.Command.message(preflopGame, 'Alice', 'Hello');
      const bobMsg = Poker.Command.message(preflopGame, 1, 'Nice hand');
      const charlieMsg = Poker.Command.message(preflopGame, 2, 'GG');

      // Message actions are player actions with type 'm'
      expect(getActionType(aliceMsg)).toBe('m');
      expect(getActionPlayerIndex(aliceMsg)).toBe(0);
      expect(getActionTimestamp(aliceMsg)).toBeTypeOf('number');
      expect(getActionAmount(aliceMsg)).toBe(0);
      expect(aliceMsg).toContain('Hello');

      expect(getActionType(bobMsg)).toBe('m');
      expect(getActionPlayerIndex(bobMsg)).toBe(1);
      expect(getActionTimestamp(bobMsg)).toBeTypeOf('number');
      expect(getActionAmount(bobMsg)).toBe(0);
      expect(bobMsg).toContain('Nice hand');

      expect(getActionType(charlieMsg)).toBe('m');
      expect(getActionPlayerIndex(charlieMsg)).toBe(2);
      expect(getActionTimestamp(charlieMsg)).toBeTypeOf('number');
      expect(getActionAmount(charlieMsg)).toBe(0);
      expect(charlieMsg).toContain('GG');

      // Verify actions are applicable
      expect(() => applyAction(preflopGame, aliceMsg)).not.toThrow();
      expect(() => applyAction(preflopGame, bobMsg)).not.toThrow();
      expect(() => applyAction(preflopGame, charlieMsg)).not.toThrow();
    });
  });
});
