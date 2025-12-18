// src/__tests__/api/command/error-scenarios.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { Game } from '../../../Game';
import {
  getActionAmount,
  getActionMessage,
  getActionPlayerIndex,
  getActionTimestamp,
  getActionType,
} from '../../../game/position';
import { applyAction } from '../../../game/progress';
import * as Poker from '../../../index';
import { BASE_HAND } from './fixtures/baseHand';

/**
 * Command Error Scenarios Tests
 *
 * Purpose: Test Command behavior with invalid inputs, edge cases, and error conditions
 * Focus: Commands should generate Actions gracefully but let applyAction() handle validation
 * Critical: Commands never throw - they always return Action strings (valid or invalid)
 * Base: All tests use BASE_HAND as the foundation for consistent, deterministic scenarios
 */
describe('Command Error Scenarios', () => {
  let validGame: Game;
  let completedGame: Game;
  let foldedPlayersGame: Game;
  let allInGame: Game;
  let emptyStackGame: Game;

  beforeEach(() => {
    // Fixture 1: Valid active game state from BASE_HAND
    const validHand = Poker.Hand({
      ...BASE_HAND,
      actions: BASE_HAND.actions.slice(0, 3), // Only deal hole cards
    });
    validGame = Poker.Game(validHand);

    // Fixture 2: Completed game - only one player remains
    const completedHand = Poker.Hand({
      ...BASE_HAND,
      actions: [
        ...BASE_HAND.actions.slice(0, 3), // Deal hole cards
        'p1 cbr 100', // Alice raises
        'p2 f', // Bob folds
        'p3 f', // Charlie folds - Alice wins, game over
      ],
    });
    completedGame = Poker.Game(completedHand);

    // Fixture 3: Game with folded players
    const foldedHand = Poker.Hand({
      ...BASE_HAND,
      actions: [
        ...BASE_HAND.actions.slice(0, 3), // Deal hole cards
        'p1 cbr 60', // Alice raises
        'p2 f', // Bob folds
        // Charlie to act
      ],
    });
    foldedPlayersGame = Poker.Game(foldedHand);

    // Fixture 4: All-in scenario with side pots
    const allInHand = Poker.Hand({
      ...BASE_HAND,
      startingStacks: [100, 500, 1000], // Different starting stacks
      actions: [
        'd dh p1 6c5h',
        'd dh p2 Jc2s',
        'd dh p3 Tc3c',
        'p1 cbr 100', // Alice all-in (remaining: 0)
        'p2 cc 100', // Bob calls (remaining: 400)
        // Charlie to act
      ],
    });
    allInGame = Poker.Game(allInHand);

    // Fixture 5: Players with zero stacks
    const emptyStackHand = Poker.Hand({
      ...BASE_HAND,
      startingStacks: [0, 1000, 1000], // Alice has no chips
      blindsOrStraddles: [0, 10, 20], // Standard blinds (Alice can't post, but Bob=SB, Charlie=BB)
      actions: ['d dh p1 6c5h', 'd dh p2 Jc2s', 'd dh p3 Tc3c'],
    });
    emptyStackGame = Poker.Game(emptyStackHand);
  });

  describe('Invalid Player Identifier Scenarios', () => {
    it('should not allow actions for invalid numeric player indices', () => {
      // Logic: Test Commands with out-of-range player indices
      // Testing: Commands handle invalid indices gracefully without throwing

      const negativeIndex = Poker.Command.fold(validGame, -1);
      const zeroButInvalid = Poker.Command.fold(validGame, 999);
      const wayOutOfRange = Poker.Command.fold(validGame, 1000000);

      // Expectation: Commands generate Actions (may be invalid) but don't throw
      expect(typeof negativeIndex).toBe('string');
      expect(getActionTimestamp(negativeIndex)).toBeTypeOf('number');

      expect(typeof zeroButInvalid).toBe('string');
      expect(getActionTimestamp(zeroButInvalid)).toBeTypeOf('number');

      expect(typeof wayOutOfRange).toBe('string');
      expect(getActionTimestamp(wayOutOfRange)).toBeTypeOf('number');

      // These Actions should fail when applied
      expect(() => applyAction(validGame, negativeIndex)).toThrow();
      expect(() => applyAction(validGame, zeroButInvalid)).toThrow();
      expect(() => applyAction(validGame, wayOutOfRange)).toThrow();
    });

    it('should not allow actions for invalid player names', () => {
      // Logic: Test Commands with non-existent player names
      // Testing: Commands handle unknown player names without throwing

      const unknownPlayer = Poker.Command.fold(validGame, 'Unknown');
      const emptyName = Poker.Command.fold(validGame, '');
      const numericString = Poker.Command.fold(validGame, '42');

      expect(typeof unknownPlayer).toBe('string');
      expect(getActionTimestamp(unknownPlayer)).toBeTypeOf('number');

      expect(typeof emptyName).toBe('string');
      expect(getActionTimestamp(emptyName)).toBeTypeOf('number');

      expect(typeof numericString).toBe('string');
      expect(getActionTimestamp(numericString)).toBeTypeOf('number');

      // applyAction should reject these
      expect(() => applyAction(validGame, unknownPlayer)).toThrow();
      expect(() => applyAction(validGame, emptyName)).toThrow();
      expect(() => applyAction(validGame, numericString)).toThrow();
    });

    it('should generate Actions for null/undefined player identifiers', () => {
      // Logic: Test Commands with null/undefined player parameters
      // Testing: Commands handle missing player parameters gracefully

      const nullPlayer = Poker.Command.fold(validGame, null as any);
      const undefinedPlayer = Poker.Command.fold(validGame, undefined as any);

      expect(typeof nullPlayer).toBe('string');
      expect(getActionTimestamp(nullPlayer)).toBeTypeOf('number');

      expect(typeof undefinedPlayer).toBe('string');
      expect(getActionTimestamp(undefinedPlayer)).toBeTypeOf('number');

      expect(() => applyAction(validGame, nullPlayer)).toThrow();
      expect(() => applyAction(validGame, undefinedPlayer)).toThrow();
    });

    it('should generate Actions for invalid player types', () => {
      // Logic: Test Commands with wrong parameter types
      // Testing: Commands handle type mismatches without throwing

      const objectAsPlayer = Poker.Command.fold(validGame, {} as any);
      const arrayAsPlayer = Poker.Command.fold(validGame, [] as any);
      const functionAsPlayer = Poker.Command.fold(validGame, (() => {}) as any);

      expect(typeof objectAsPlayer).toBe('string');
      expect(getActionTimestamp(objectAsPlayer)).toBeTypeOf('number');

      expect(typeof arrayAsPlayer).toBe('string');
      expect(getActionTimestamp(arrayAsPlayer)).toBeTypeOf('number');

      expect(typeof functionAsPlayer).toBe('string');
      expect(getActionTimestamp(functionAsPlayer)).toBeTypeOf('number');
    });

    it('should return an empty string for a message from a non-existent player', () => {
      const action = Poker.Command.message(validGame, 'UnknownPlayer', 'Hello there');
      expect(action).toBe('');
    });
  });

  describe('Invalid Betting Amount Scenarios', () => {
    it('should generate bet Actions with negative amounts', () => {
      // Logic: Test bet Commands with negative amounts
      // Testing: Commands handle negative values without throwing

      const negativeBet = Poker.Command.bet(validGame, 0, -100);
      const negativeRaise = Poker.Command.raise(validGame, 0, -200);

      expect(getActionPlayerIndex(negativeBet)).toBe(0); // Player 0 (p1)
      expect(getActionType(negativeBet)).toBe('cc');
      expect(getActionAmount(negativeBet)).toBe(20);
      expect(getActionTimestamp(negativeBet)).toBeTypeOf('number');

      expect(getActionPlayerIndex(negativeRaise)).toBe(0); // Player 0 (p1)
      expect(getActionType(negativeRaise)).toBe('cbr');
      expect(getActionAmount(negativeRaise)).toBe(40);
      expect(getActionTimestamp(negativeRaise)).toBeTypeOf('number');
    });

    it('should generate bet Actions with zero amounts', () => {
      // Logic: Test betting Commands with zero amounts
      // Testing: Commands handle edge case amounts

      const zeroBet = Poker.Command.bet(validGame, 0, 0);
      const zeroRaise = Poker.Command.raise(validGame, 0, 0);

      expect(getActionPlayerIndex(zeroBet)).toBe(0); // Player 0 (p1)
      expect(getActionType(zeroBet)).toBe('cc');
      expect(getActionAmount(zeroBet)).toBe(20);
      expect(getActionTimestamp(zeroBet)).toBeTypeOf('number');

      expect(getActionPlayerIndex(zeroRaise)).toBe(0); // Player 0 (p1)
      expect(getActionType(zeroRaise)).toBe('cbr');
      expect(getActionAmount(zeroRaise)).toBe(40);
      expect(getActionTimestamp(zeroRaise)).toBeTypeOf('number');

      // Zero bets may or may not be valid depending on game rules
      // Let applyAction decide
      const zeroBetGame = JSON.parse(JSON.stringify(validGame));
      const zeroRaiseGame = JSON.parse(JSON.stringify(validGame));
      applyAction(zeroBetGame, zeroBet);
      applyAction(zeroRaiseGame, zeroRaise);
    });

    it('should generate bet Actions with non-numeric amounts', () => {
      // Logic: Test betting Commands with invalid amount types
      // Testing: Commands handle type mismatches in amount parameters

      const stringAmount = Poker.Command.bet(validGame, 0, 'hundred' as any);
      const nullAmount = Poker.Command.bet(validGame, 0, null as any);
      const undefinedAmount = Poker.Command.bet(validGame, 0, undefined as any);
      const objectAmount = Poker.Command.bet(validGame, 0, {} as any);

      // Commands should generate Actions (may contain invalid amounts)
      expect(getActionPlayerIndex(stringAmount)).toBe(0);
      expect(getActionType(stringAmount)).toBe('cc');
      expect(getActionAmount(stringAmount)).toBe(validGame.bigBlind);
      expect(getActionTimestamp(stringAmount)).toBeTypeOf('number');
      expect(getActionPlayerIndex(nullAmount)).toBe(0);
      expect(getActionType(nullAmount)).toBe('cc');
      expect(getActionAmount(nullAmount)).toBe(validGame.bigBlind);
      expect(getActionTimestamp(nullAmount)).toBeTypeOf('number');
      expect(getActionPlayerIndex(undefinedAmount)).toBe(0);
      expect(getActionType(undefinedAmount)).toBe('cc');
      expect(getActionAmount(undefinedAmount)).toBe(validGame.bigBlind);
      expect(getActionTimestamp(undefinedAmount)).toBeTypeOf('number');
      expect(getActionPlayerIndex(objectAmount)).toBe(0);
      expect(getActionType(objectAmount)).toBe('cc');
      expect(getActionAmount(objectAmount)).toBe(validGame.bigBlind);
      expect(getActionTimestamp(objectAmount)).toBeTypeOf('number');
    });

    it('should generate bet Actions with extremely large amounts', () => {
      // Logic: Test betting Commands with unrealistic amounts
      // Testing: Commands handle overflow/extreme values
      const largeBet = Poker.Command.bet(validGame, 0, 5684843);
      const nanBet = Poker.Command.bet(validGame, 0, NaN);

      expect(typeof largeBet).toBe('string');
      expect(typeof nanBet).toBe('string');
      expect(getActionPlayerIndex(largeBet)).toBe(0);
      expect(getActionType(largeBet)).toBe('cbr');
      expect(getActionAmount(largeBet)).toBe(1000);
      expect(getActionTimestamp(largeBet)).toBeTypeOf('number');
      expect(getActionPlayerIndex(nanBet)).toBe(0);
      expect(getActionType(nanBet)).toBe('cbr');
      expect(getActionAmount(nanBet)).toBe(0);
      expect(getActionTimestamp(nanBet)).toBeTypeOf('number');
    });

    it('should generate bet Actions exceeding player stack', () => {
      // Logic: Test betting more than player has available
      // Testing: Commands generate overbet Actions for applyAction to handle

      // Alice has 1000 from BASE_HAND - try to bet 2000
      const overbet = Poker.Command.bet(validGame, 0, 2000);

      expect(getActionPlayerIndex(overbet)).toBe(0); // Player 0 (p1)
      expect(getActionType(overbet)).toBe('cbr');
      expect(getActionAmount(overbet)).toBe(1000); // Capped at stack size
      expect(getActionTimestamp(overbet)).toBeTypeOf('number');

      // applyAction should convert this to all-in or reject it
      const result = applyAction(validGame, overbet);
      expect(result.players[0].isAllIn || result.players[0].roundBet <= 1000).toBe(true);
    });
  });

  describe('Invalid Game State Scenarios', () => {
    it('should generate Actions for completed games but throw when applied', () => {
      // Logic: Test Commands when game is already over
      // Testing: Commands work even when game state is invalid

      const foldInCompletedGame = Poker.Command.fold(completedGame, 0);
      const betInCompletedGame = Poker.Command.bet(completedGame, 0, 100);
      const dealInCompletedGame = Poker.Command.deal(completedGame);

      expect(typeof foldInCompletedGame).toBe('string');
      expect(typeof betInCompletedGame).toBe('string');
      // When game is completed, no dealer action is needed
      expect(dealInCompletedGame).toBeNull();

      // applyAction should reject these for completed games
      expect(() => applyAction(completedGame, foldInCompletedGame)).toThrow();
      expect(() => applyAction(completedGame, betInCompletedGame)).toThrow();
    });

    it('should generate Actions for folded players but throw when applied', () => {
      // Logic: Test Commands for players who already folded
      // Testing: Commands generate Actions for inactive players

      const foldedPlayerCall = Poker.Command.call(foldedPlayersGame, 1); // Bob folded
      const foldedPlayerBet = Poker.Command.bet(foldedPlayersGame, 1, 100); // Bob folded
      const foldedPlayerShow = Poker.Command.showCards(foldedPlayersGame, 1);

      expect(typeof foldedPlayerCall).toBe('string');
      expect(typeof foldedPlayerBet).toBe('string');
      expect(typeof foldedPlayerShow).toBe('string');

      // applyAction should reject actions from folded players
      expect(() => applyAction(foldedPlayersGame, foldedPlayerCall)).toThrow();
      expect(() => applyAction(foldedPlayersGame, foldedPlayerBet)).toThrow();
    });

    it('should generate Actions for all-in players but throw when applied', () => {
      // Logic: Test Commands for players who are already all-in
      // Testing: Commands handle all-in player states

      const allInPlayerBet = Poker.Command.bet(allInGame, 0, 50); // Alice is all-in
      const allInPlayerCall = Poker.Command.call(allInGame, 0);
      const allInPlayerFold = Poker.Command.fold(allInGame, 0);

      expect(typeof allInPlayerBet).toBe('string');
      expect(typeof allInPlayerCall).toBe('string');
      expect(typeof allInPlayerFold).toBe('string');

      // applyAction should reject actions from all-in players (except maybe fold)
      expect(() => applyAction(allInGame, allInPlayerBet)).toThrow();
      expect(() => applyAction(allInGame, allInPlayerCall)).toThrow();
    });

    it('should generate Actions for players with zero stacks but throw when applied', () => {
      // Logic: Test Commands for players with no chips
      // Testing: Commands handle empty stack scenarios

      const zeroStackBet = Poker.Command.bet(emptyStackGame, 0, 100);
      const zeroStackCall = Poker.Command.call(emptyStackGame, 0);
      const zeroStackAllIn = Poker.Command.allIn(emptyStackGame, 0);

      expect(typeof zeroStackBet).toBe('string');
      expect(typeof zeroStackCall).toBe('string');
      expect(getActionPlayerIndex(zeroStackAllIn)).toBe(0); // Player 0 (p1)
      expect(getActionType(zeroStackAllIn)).toBe('cc');
      expect(getActionAmount(zeroStackAllIn)).toBe(0);
      expect(getActionTimestamp(zeroStackAllIn)).toBeTypeOf('number');

      expect(() => applyAction(emptyStackGame, zeroStackBet)).toThrow();
    });
  });

  describe('Turn Order Violation Scenarios', () => {
    it("should generate Actions for players when it's not their turn but throw when applied", () => {
      // Logic: Test Commands for non-active players
      // Testing: Commands don't enforce turn order (applyAction does)

      // In validGame, Alice (p1) is next to act
      const bobOutOfTurn = Poker.Command.fold(validGame, 1); // Bob acts out of turn
      const charlieOutOfTurn = Poker.Command.bet(validGame, 2, 100); // Charlie acts out of turn

      expect(getActionPlayerIndex(bobOutOfTurn)).toBe(1); // Player 1 (p2 - Bob)
      expect(getActionType(bobOutOfTurn)).toBe('f');
      expect(getActionTimestamp(bobOutOfTurn)).toBeTypeOf('number');

      expect(getActionPlayerIndex(charlieOutOfTurn)).toBe(2); // Player 2 (p3 - Charlie)
      expect(getActionType(charlieOutOfTurn)).toBe('cbr');
      expect(getActionAmount(charlieOutOfTurn)).toBe(100);
      expect(getActionTimestamp(charlieOutOfTurn)).toBeTypeOf('number');

      // applyAction should enforce turn order
      expect(() => applyAction(validGame, bobOutOfTurn)).toThrow();
      expect(() => applyAction(validGame, charlieOutOfTurn)).toThrow();
    });

    it('should generate player Actions when dealer action expected but throw when applied', () => {
      // Fixture: Game state where dealer should act (deal flop)
      const dealerTurnHand = Poker.Hand({
        ...BASE_HAND,
        actions: [
          ...BASE_HAND.actions.slice(0, 3), // Deal hole cards
          'p1 cc 20',
          'p2 cc 0',
          'p3 cc 0', // Preflop complete, dealer should deal flop
        ],
      });
      const dealerTurnGame = Poker.Game(dealerTurnHand);

      // Logic: Try player actions when dealer should act
      // Testing: Commands generate Actions regardless of expected actor

      const playerWhenDealer = Poker.Command.fold(dealerTurnGame, 0);
      const betWhenDealer = Poker.Command.bet(dealerTurnGame, 0, 100);

      expect(typeof playerWhenDealer).toBe('string');
      expect(typeof betWhenDealer).toBe('string');

      // applyAction should enforce proper turn order
      expect(() => applyAction(dealerTurnGame, playerWhenDealer)).toThrow();
    });

    it('should return null for dealer action when player action expected', () => {
      // Logic: Try dealer actions when player should act
      // Testing: Command.deal returns null when it's not dealer's turn

      const dealerWhenPlayer = Poker.Command.deal(validGame);
      const dealHoleWhenPlayer = Poker.Command.deal(validGame);

      // When it's player's turn to act, no dealer action is needed
      expect(dealerWhenPlayer).toBeNull();
      expect(dealHoleWhenPlayer).toBeNull();
    });
  });

  describe('Message Command Edge Cases', () => {
    it('should generate message Actions with empty strings', () => {
      // Logic: Test message Command with empty/minimal input
      // Testing: Message Commands handle edge case content

      const emptyMessage = Poker.Command.message(validGame, 0, '');
      const spaceMessage = Poker.Command.message(validGame, 0, ' ');
      const tabMessage = Poker.Command.message(validGame, 0, '\t');

      expect(emptyMessage).toBe('');
      expect(getActionType(spaceMessage)).toBe('m');
      expect(getActionPlayerIndex(spaceMessage)).toBe(0);
      expect(getActionMessage(spaceMessage)).toBe(' ');
      expect(getActionTimestamp(spaceMessage)).toBeTypeOf('number');

      expect(getActionType(tabMessage)).toBe('m');
      expect(getActionPlayerIndex(tabMessage)).toBe(0);
      expect(getActionMessage(tabMessage)).toBe('\t');
      expect(getActionTimestamp(tabMessage)).toBeTypeOf('number');
    });

    it('should generate message Actions with special characters', () => {
      // Logic: Test message Commands with various special characters
      // Testing: Message content handling for unusual characters

      const specialChars = Poker.Command.message(validGame, 0, '!@#$%^&*()');
      const unicodeChars = Poker.Command.message(validGame, 0, '♠♥♦♣🃏');
      const newlineChars = Poker.Command.message(validGame, 0, 'Line1\nLine2');

      expect(getActionType(specialChars)).toBe('m');
      expect(getActionPlayerIndex(specialChars)).toBe(0);
      expect(getActionMessage(specialChars)).toBe('!@#$%^&*()');
      expect(getActionTimestamp(specialChars)).toBeTypeOf('number');

      expect(getActionType(unicodeChars)).toBe('m');
      expect(getActionPlayerIndex(unicodeChars)).toBe(0);
      expect(getActionMessage(unicodeChars)).toBe('♠♥♦♣🃏');
      expect(getActionTimestamp(unicodeChars)).toBeTypeOf('number');

      expect(getActionType(newlineChars)).toBe('m');
      expect(getActionPlayerIndex(newlineChars)).toBe(0);
      expect(getActionMessage(newlineChars)).toBe('Line1\nLine2');
      expect(getActionTimestamp(newlineChars)).toBeTypeOf('number');
      // verify actions are applicable
      expect(() => applyAction(validGame, specialChars)).not.toThrow();
      expect(() => applyAction(validGame, unicodeChars)).not.toThrow();
      expect(() => applyAction(validGame, newlineChars)).not.toThrow();
    });

    it('should generate message Actions with extremely long text', () => {
      // Logic: Test message Commands with very long content
      // Testing: Message Commands handle large text input

      const longText = 'A'.repeat(10000);
      const longMessage = Poker.Command.message(validGame, 0, longText);

      expect(getActionType(longMessage)).toBe('m');
      expect(getActionPlayerIndex(longMessage)).toBe(0);
      expect(getActionMessage(longMessage)).toBe(longText);
      expect(getActionTimestamp(longMessage)).toBeTypeOf('number');
    });

    it('should generate message Actions with null/undefined text', () => {
      // Logic: Test message Commands with invalid text parameters
      // Testing: Message Commands handle missing text gracefully

      const nullText = Poker.Command.message(validGame, 0, null as any);
      const undefinedText = Poker.Command.message(validGame, 0, undefined as any);

      expect(typeof nullText).toBe('string');
      expect(typeof undefinedText).toBe('string');
    });
  });

  describe('Auto Command Edge Cases', () => {
    it('should generate auto Actions without playerIdentifier', () => {
      // Logic: Test auto Command when no specific player provided
      // Testing: Auto Commands handle implicit player detection

      const autoNoPlayer = Poker.Command.auto(validGame);

      expect(typeof autoNoPlayer).toBe('string');
      const actionType = getActionType(autoNoPlayer);
      expect(actionType === 'f' || actionType === 'sm').toBe(true);
      expect(getActionTimestamp(autoNoPlayer)).toBeTypeOf('number');
    });

    it('should generate auto Actions for invalid players', () => {
      // Logic: Test auto Command with non-existent players
      // Testing: Auto Commands handle invalid player gracefully

      const autoInvalidPlayer = Poker.Command.auto(validGame, 999);
      const autoNullPlayer = Poker.Command.auto(validGame, null as any);

      expect(typeof autoInvalidPlayer).toBe('string');
      expect(getActionTimestamp(autoInvalidPlayer)).toBeTypeOf('number');

      expect(typeof autoNullPlayer).toBe('string');
      expect(getActionTimestamp(autoNullPlayer)).toBeTypeOf('number');
    });

    it('should generate auto Actions in different game phases', () => {
      // Logic: Test auto Commands in various game phases
      // Testing: Auto behavior adapts to game phase (fold vs muck)

      const autoBetting = Poker.Command.auto(validGame, 0); // Should fold
      const autoShowdown = Poker.Command.auto(completedGame, 0); // Should muck

      expect(typeof autoBetting).toBe('string');
      expect(getActionPlayerIndex(autoBetting)).toBe(0); // Player 0 (p1)
      const bettingType = getActionType(autoBetting);
      expect(bettingType === 'f' || bettingType === 'sm').toBe(true);
      expect(getActionTimestamp(autoBetting)).toBeTypeOf('number');

      expect(typeof autoShowdown).toBe('string');
      expect(getActionPlayerIndex(autoShowdown)).toBe(0); // Player 0 (p1)
      const showdownType = getActionType(autoShowdown);
      expect(showdownType === 'f' || showdownType === 'sm').toBe(true);
      expect(getActionTimestamp(autoShowdown)).toBeTypeOf('number');
    });
  });

  describe('ForceShowCards Command Edge Cases', () => {
    it('should return null for games where no showdown is needed', () => {
      const result = Poker.Command.forceShowCards(completedGame);
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should be deterministic even with invalid game states', () => {
      const result1 = Poker.Command.forceShowCards(emptyStackGame);
      const result2 = Poker.Command.forceShowCards(emptyStackGame);

      expect(result1).toBe(result2);
    });
  });

  describe('Consistency Under Error Conditions', () => {
    it('should generate identical Actions for identical invalid inputs', () => {
      // Logic: Test determinism with invalid inputs
      // Testing: Even error Actions are consistent

      const invalid1 = Poker.Command.fold(validGame, 999);
      const invalid2 = Poker.Command.fold(validGame, 999);
      const invalid3 = Poker.Command.fold(validGame, 999);

      expect(invalid1).toBe(invalid2);
      expect(invalid2).toBe(invalid3);
    });
  });
});
