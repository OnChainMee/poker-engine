import { describe, expect, it } from 'vitest';
import {
  getActionAmount,
  getActionCards,
  getActionPlayerIndex,
  getActionType,
} from '../../../game/position';
import * as Poker from '../../../index';
import { BASE_HAND } from './fixtures/baseHand';

/**
 * Delegation Tests for Hand API
 *
 * Purpose: Test Hand methods that purely delegate to Game namespace:
 * 1. applyAction - Appends action if Game.canApplyAction() returns true
 * 2. advance - Creates Game, calls Game.advance(), returns resulting Hand
 * 3. handleTimeOut - Creates Game, handles timeout logic, returns resulting Hand
 * 4. canApplyAction - Determines if an action can be applied to the Hand
 * 5. finish - Extracts finishing data from a completed game and updates the hand with final state
 *
 * These tests verify pure delegation without implementing game logic
 */
describe('Hand Delegation to Game', () => {
  describe('Hand.applyAction', () => {
    it('should append valid action to Hand', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        actions: BASE_HAND.actions.slice(0, 3), // Only hole cards dealt
      });

      // Apply a valid action
      const newHand = Poker.Hand.applyAction(hand, 'p1 cc');

      // Should append action
      expect(newHand.actions).toHaveLength(4);
      expect(newHand.actions[3]).toBe('p1 cc');

      // Verify action components
      expect(getActionType(newHand.actions[3])).toBe('cc');
      expect(getActionPlayerIndex(newHand.actions[3])).toBe(0); // 0-based
      expect(getActionAmount(newHand.actions[3])).toBe(0);

      // Original unchanged
      expect(hand.actions).toHaveLength(3);
    });

    it('should not append invalid action', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        actions: BASE_HAND.actions.slice(0, 3), // Only hole cards dealt
      });

      // Try to apply invalid action (player 4 doesn't exist)
      expect(() => Poker.Hand.applyAction(hand, 'p4 f')).toThrow();
    });

    it('should delegate validation to Game.canApplyAction', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        actions: [],
      });

      // Dealer action should be first
      const dealerHand = Poker.Hand.applyAction(hand, 'd dh p1 AsKs');

      // Verify dealer action components
      const dealerAction = dealerHand.actions[0];
      expect(getActionType(dealerAction)).toBe('dh');
      expect(getActionPlayerIndex(dealerAction)).toBe(0);
      expect(getActionCards(dealerAction)).toEqual(['As', 'Ks']);

      // Player action without dealing should fail
      expect(() => Poker.Hand.applyAction(hand, 'p1 f')).toThrow();
    });

    it('should maintain immutability', () => {
      const hand = Poker.Hand({ ...BASE_HAND, actions: BASE_HAND.actions.slice(0, 3) });
      const originalJson = JSON.stringify(hand);

      Poker.Hand.applyAction(hand, 'p1 f');

      expect(JSON.stringify(hand)).toBe(originalJson);
    });
  });

  describe('Hand.advance', () => {
    it('should advance hand through dealer actions', () => {
      const hand = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        antes: [0, 0, 0],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20],
        minBet: 20,
        seed: 12345,
        actions: [],
      });

      // Advance should deal hole cards
      const advanced = Poker.Hand.advance(hand);

      // Should have dealer actions added
      expect(advanced.actions.length).toBeGreaterThan(0);

      // Verify first action is dealing hole cards
      const firstAction = advanced.actions[0];
      expect(getActionType(firstAction)).toBe('dh');
      expect(getActionPlayerIndex(firstAction)).toBe(0);
      expect(getActionCards(firstAction)).toBeDefined();
      expect(getActionCards(firstAction)?.length).toBe(2);
    });

    it('should handle auto-actions like timeout', () => {
      // Test non-showdown timeout (should fold)
      const now = Date.now();
      const handPreflop = Poker.Hand({
        ...BASE_HAND,
        timeLimit: 30,
        actions: [
          BASE_HAND.actions[0], // d dh p1
          BASE_HAND.actions[1], // d dh p2
          BASE_HAND.actions[2], // d dh p3
          `p1 cc #${now - 40000}`, // Alice calls, 40 seconds ago
          // Bob is next to act and will timeout
        ],
      });

      const advancedPreflop = Poker.Hand.advance(handPreflop);

      // Bob should fold due to timeout (not showdown)
      const newAction = advancedPreflop.actions[advancedPreflop.actions.length - 1];
      expect(getActionType(newAction)).toBe('f');
      expect(getActionPlayerIndex(newAction)).toBe(1); // Bob (player index 1)

      // Test showdown timeout (should show/muck)
      const handShowdown = Poker.Hand({
        ...BASE_HAND,
        timeLimit: 30,
        actions: [
          ...BASE_HAND.actions.slice(0, 18), // All the way to showdown
          // At showdown, players need to show/muck
        ],
      });

      const advancedShowdown = Poker.Hand.advance(handShowdown);

      // Should add show/muck action
      const showdownAction = advancedShowdown.actions[advancedShowdown.actions.length - 1];
      expect(getActionType(showdownAction)).toBe('sm'); // Show cards at showdown
    });

    it('should maintain immutability', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        actions: [],
      });
      const originalJson = JSON.stringify(hand);

      Poker.Hand.advance(hand);

      expect(JSON.stringify(hand)).toBe(originalJson);
    });

    it('should delegate to Game.advance', () => {
      // Use a hand state where advance will deal the flop
      const hand = Poker.Hand({
        ...BASE_HAND,
        actions: BASE_HAND.actions.slice(0, 6), // Through preflop betting
      });

      const advanced = Poker.Hand.advance(hand);

      // Should return new Hand with game progression
      expect(advanced).not.toBe(hand);
      expect(advanced.actions.length).toBeGreaterThan(hand.actions.length);

      // Should have dealt the flop
      const newAction = advanced.actions[6];
      expect(getActionType(newAction)).toBe('db'); // Deal board
      expect(getActionCards(newAction)).toBeDefined();
      expect(getActionCards(newAction)?.length).toBe(3); // Flop has 3 cards
    });
  });

  describe('Hand.handleTimeOut', () => {
    it('should handle timeout for current player', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        timeLimit: 30,
        actions: [
          BASE_HAND.actions[0], // d dh p1
          BASE_HAND.actions[1], // d dh p2
          BASE_HAND.actions[2], // d dh p3
          // Alice is next to act and has timed out
        ],
      });

      const handled = Poker.Hand.handleTimeOut(hand);

      // Should add fold action for Alice
      expect(handled.actions.length).toBe(4);
      const newAction = handled.actions[3];
      expect(getActionType(newAction)).toBe('f');
      expect(getActionPlayerIndex(newAction)).toBe(0); // Alice
    });

    it('should fold in betting round', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        timeLimit: 30,
        actions: BASE_HAND.actions.slice(0, 7), // After flop is dealt, Bob to act
      });

      const handled = Poker.Hand.handleTimeOut(hand);

      // Bob should fold due to timeout
      const lastAction = handled.actions[handled.actions.length - 1];
      expect(getActionType(lastAction)).toBe('f');
      expect(getActionPlayerIndex(lastAction)).toBe(1); // Bob
    });

    it('should show cards in showdown', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        timeLimit: 30,
        actions: BASE_HAND.actions.slice(0, 20), // At showdown, Alice to show
      });

      const handled = Poker.Hand.handleTimeOut(hand);

      // Alice should show cards
      const lastAction = handled.actions[handled.actions.length - 1];
      expect(getActionType(lastAction)).toBe('sm'); // Show cards
      expect(getActionPlayerIndex(lastAction)).toBe(0); // Alice
      expect(getActionCards(lastAction)).toEqual(['6c', '5h']); // Alice's cards from BASE_HAND
    });

    it('should maintain immutability', () => {
      const hand = Poker.Hand(BASE_HAND);
      const originalJson = JSON.stringify(hand);

      Poker.Hand.handleTimeOut(hand);

      expect(JSON.stringify(hand)).toBe(originalJson);
    });
  });

  describe('Hand.canApplyAction', () => {
    it('should delegate directly to Game.canApplyAction', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        actions: BASE_HAND.actions.slice(0, 3), // Hole cards dealt
      });

      // Valid action for current state
      expect(Poker.Hand.canApplyAction(hand, 'p1 cc')).toBe(true);
      // Invalid action (out of turn)
      expect(Poker.Hand.canApplyAction(hand, 'p2 f')).toBe(false);
      // Invalid action (player doesn't exist)
      expect(Poker.Hand.canApplyAction(hand, 'p4 f')).toBe(false);
    });

    it('should validate dealer actions', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        actions: [],
      });

      // Should deal hole cards first
      const dealAction = 'd dh p1 AsKs';
      expect(Poker.Hand.canApplyAction(hand, dealAction)).toBe(true);

      // Can't deal board without hole cards
      const boardAction = 'd db AhKhQd';
      expect(Poker.Hand.canApplyAction(hand, boardAction)).toBe(false);
    });

    it('should validate board card sequence - flop must be 3 cards', () => {
      const handAfterPreflopBetting = Poker.Hand({
        ...BASE_HAND,
        actions: BASE_HAND.actions.slice(0, 6), // Hole cards + preflop betting complete
      });

      // Can't deal turn (1 card) before flop
      const turnBeforeFlop = 'd db Ah';
      expect(Poker.Hand.canApplyAction(handAfterPreflopBetting, turnBeforeFlop)).toBe(false);

      // Can't deal river (2 cards) as first board cards
      const twoCards = 'd db AhKh';
      expect(Poker.Hand.canApplyAction(handAfterPreflopBetting, twoCards)).toBe(false);

      // Must deal exactly 3 cards for flop
      const validFlop = 'd db AhKhQd';
      expect(Poker.Hand.canApplyAction(handAfterPreflopBetting, validFlop)).toBe(true);

      // Can't deal 4+ cards at once
      const tooManyCards = 'd db AhKhQdJc';
      expect(Poker.Hand.canApplyAction(handAfterPreflopBetting, tooManyCards)).toBe(false);
    });

    it('should validate board card sequence - turn must be 1 card after flop', () => {
      const handAfterFlopBetting = Poker.Hand({
        ...BASE_HAND,
        actions: BASE_HAND.actions.slice(0, 10), // Through flop betting complete
      });

      // Can't deal 3 cards again after flop
      const secondFlop = 'd db ThTdTc';
      expect(Poker.Hand.canApplyAction(handAfterFlopBetting, secondFlop)).toBe(false);

      // Can't deal 2 cards for turn
      const twoCardTurn = 'd db ThTd';
      expect(Poker.Hand.canApplyAction(handAfterFlopBetting, twoCardTurn)).toBe(false);

      // Must deal exactly 1 card for turn
      const validTurn = 'd db Th';
      expect(Poker.Hand.canApplyAction(handAfterFlopBetting, validTurn)).toBe(true);
    });

    it('should validate board card sequence - river must be 1 card after turn', () => {
      const handAfterTurnBetting = Poker.Hand({
        ...BASE_HAND,
        actions: BASE_HAND.actions.slice(0, 14), // Through turn betting complete
      });

      // Can't deal multiple cards for river
      const multiCardRiver = 'd db 9h9d';
      expect(Poker.Hand.canApplyAction(handAfterTurnBetting, multiCardRiver)).toBe(false);

      // Must deal exactly 1 card for river
      const validRiver = 'd db 9h';
      expect(Poker.Hand.canApplyAction(handAfterTurnBetting, validRiver)).toBe(true);
    });

    it('should prevent dealing board cards when not all active players have hole cards', () => {
      const partiallyDealtHand = Poker.Hand({
        ...BASE_HAND,
        actions: [
          BASE_HAND.actions[0], // p1 has hole cards
          BASE_HAND.actions[1], // p2 has hole cards
          // p3 doesn't have hole cards yet
        ],
      });

      // Can't deal flop when not all players have hole cards
      const prematureFlop = 'd db AhKhQd';
      expect(Poker.Hand.canApplyAction(partiallyDealtHand, prematureFlop)).toBe(false);

      // Should be able to deal remaining hole cards
      const dealToP3 = 'd dh p3 TsTd';
      expect(Poker.Hand.canApplyAction(partiallyDealtHand, dealToP3)).toBe(true);
    });

    it('should handle complex invalid board sequences', () => {
      const emptyHand = Poker.Hand({
        ...BASE_HAND,
        actions: [],
      });

      // Can't skip straight to dealing board
      expect(Poker.Hand.canApplyAction(emptyHand, 'd db AhKhQd')).toBe(false);

      // After dealing all hole cards
      const holeCardsDealt = Poker.Hand({
        ...BASE_HAND,
        actions: BASE_HAND.actions.slice(0, 3),
      });

      // Can't deal turn-sized board as first community cards
      expect(Poker.Hand.canApplyAction(holeCardsDealt, 'd db Ah')).toBe(false);

      // After valid flop
      let handWithFlop = Poker.Hand.applyAction(holeCardsDealt, 'p1 cc');
      handWithFlop = Poker.Hand.applyAction(handWithFlop, 'p2 cc');
      handWithFlop = Poker.Hand.applyAction(handWithFlop, 'p3 cc');
      handWithFlop = Poker.Hand.applyAction(handWithFlop, 'd db AhKhQd');

      // Can't deal another flop-sized board
      expect(Poker.Hand.canApplyAction(handWithFlop, 'd db JhJdJc')).toBe(false);
      // Can't skip turn and go to river (dealing when board.length would be 6)
      handWithFlop = Poker.Hand.applyAction(handWithFlop, 'p2 cc');
      handWithFlop = Poker.Hand.applyAction(handWithFlop, 'p3 cc');
      handWithFlop = Poker.Hand.applyAction(handWithFlop, 'p1 cc');
      const turnAction = 'd db Th';
      handWithFlop = Poker.Hand.applyAction(handWithFlop, turnAction);

      // Now with 4 cards on board, can only deal 1 more (river)
      expect(Poker.Hand.canApplyAction(handWithFlop, 'd db 9h8h')).toBe(false);
    });

    it('should validate betting actions', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        actions: BASE_HAND.actions.slice(0, 3), // Hole cards dealt, Alice to act
      });

      // Valid actions for Alice
      const foldAction = 'p1 f';
      const checkAction = 'p1 cc';
      const betAction = 'p1 cbr 60';

      // Valid actions
      expect(Poker.Hand.canApplyAction(hand, foldAction)).toBe(true);
      expect(Poker.Hand.canApplyAction(hand, checkAction)).toBe(true);
      expect(Poker.Hand.canApplyAction(hand, betAction)).toBe(true);

      // Invalid - out of turn
      const outOfTurnAction = 'p2 f';
      expect(Poker.Hand.canApplyAction(hand, outOfTurnAction)).toBe(false);
    });

    it('should be pure pass-through without side effects', () => {
      const hand = Poker.Hand(BASE_HAND);
      const originalJson = JSON.stringify(hand);

      // Multiple calls should not affect hand
      Poker.Hand.canApplyAction(hand, 'p1 f');
      Poker.Hand.canApplyAction(hand, 'p2 cc');
      Poker.Hand.canApplyAction(hand, 'd db AhKhQd');

      expect(JSON.stringify(hand)).toBe(originalJson);
    });
  });

  describe('Hand.finish', () => {
    it('should delegate to Game.finish and return hand with completion data', () => {
      // Create a complete hand (all actions including showdown)
      const completeHand = Poker.Hand(BASE_HAND);

      // Call finish
      const finishedHand = Poker.Hand.finish(completeHand);

      // Should have finishing data
      expect(finishedHand.finishingStacks).toBeDefined();
      expect(Array.isArray(finishedHand.finishingStacks)).toBe(true);
      expect(finishedHand.finishingStacks).toHaveLength(3); // 3 players

      // Should have winnings
      expect(finishedHand.winnings).toBeDefined();
      expect(Array.isArray(finishedHand.winnings)).toBe(true);

      // Rake should be a number or undefined
      if (finishedHand.rake !== undefined) {
        expect(typeof finishedHand.rake).toBe('number');
      }
    });

    it('should maintain immutability', () => {
      const hand = Poker.Hand(BASE_HAND);
      const originalJson = JSON.stringify(hand);

      const finished = Poker.Hand.finish(hand);

      expect(JSON.stringify(hand)).toBe(originalJson);
      expect(JSON.stringify(finished)).not.toBe(originalJson);
    });

    it('should handle incomplete hands', () => {
      // Create an incomplete hand (only partial actions)
      const incompleteHand = Poker.Hand({
        ...BASE_HAND,
        actions: BASE_HAND.actions.slice(0, 10), // Partial hand
      });

      const finishedHand = Poker.Hand.finish(incompleteHand);

      // Should still return a hand (Game.finish handles the logic)
      expect(finishedHand).toBeDefined();

      // May or may not have finishing data depending on game state
      // We're just testing delegation, not the logic
    });

    it('should work with hands at showdown', () => {
      // Use a hand that's at showdown
      const showdownHand = Poker.Hand({
        ...BASE_HAND,
        actions: BASE_HAND.actions.slice(0, 19), // At showdown
      });

      const finishedHand = Poker.Hand.finish(showdownHand);

      // Should delegate and return result
      expect(finishedHand).toBeDefined();
      expect(finishedHand.actions).toEqual(showdownHand.actions);
    });

    it('should preserve all original hand data', () => {
      const hand = Poker.Hand(BASE_HAND);
      const finishedHand = Poker.Hand.finish(hand);

      // All original fields should be preserved
      expect(finishedHand.variant).toBe(hand.variant);
      expect(finishedHand.players).toEqual(hand.players);
      expect(finishedHand.startingStacks).toEqual(hand.startingStacks);
      expect(finishedHand.blindsOrStraddles).toEqual(hand.blindsOrStraddles);
      expect(finishedHand.actions).toEqual(hand.actions);
    });
  });
});
