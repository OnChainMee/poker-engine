import { describe, expect } from 'vitest';
import { Game } from '../../Game';
import { deal } from '../../game/dealer';
import { getCurrentPlayerIndex } from '../../game/position';
import { applyAction, isAwaitingDealer } from '../../game/progress';
import type { Hand } from '../../Hand';
import type { Action } from '../../types';

/**
 * Testing principles demonstrated in this file:
 *
 * 1. State Validation First:
 *    - Always verify state (getPlayerIndex, isAwaitingDealer) before attempting actions
 *    - Use -1 from getPlayerIndex as safety check for dealer actions
 *
 * 2. Complete Action Sequences:
 *    - Each test shows complete sequence of actions needed to reach a state
 *    - Actions are commented to show their meaning (e.g. "BTN calls")
 *
 * 3. State Verification:
 *    - Verify all relevant state after each action
 *    - Check both direct effects and side effects
 *    - Verify state transitions are complete (e.g. blinds posted)
 *
 * 4. Failure Prevention:
 *    - Don't test by attempting invalid actions
 *    - Instead, verify that preconditions prevent invalid actions
 *    - Use getPlayerIndex as the main safety check
 *
 * 5. Clear Test Organization:
 *    - Group tests by functionality (dealing cards, streets)
 *    - Each test focuses on one specific behavior
 *    - Test names describe the behavior being tested
 */

const sampleGame: Hand = {
  variant: 'NT',
  players: ['p1', 'p2', 'p3'],
  startingStacks: [1000, 1000, 1000],
  blindsOrStraddles: [0, 10, 20],
  antes: [],
  actions: [],
  minBet: 20,
};

describe('Dealer Actions', () => {
  describe('dealing hole cards', () => {
    it('should deal hole cards to all players in order', () => {
      const game = Game(sampleGame);

      // Initial state - dealer should deal
      expect(isAwaitingDealer(game)).toBe(true);
      expect(getCurrentPlayerIndex(game)).toBe(-1);
      expect(game.usedCards).toBe(0);
      expect(game.players.every(p => p.cards.length === 0)).toBe(true);

      // Deal to BTN (p1)
      applyAction(game, 'd dh p1 AhKh');
      expect(game.players[0].cards).toEqual(['Ah', 'Kh']);
      expect(game.usedCards).toBe(2);
      expect(isAwaitingDealer(game)).toBe(true);
      expect(getCurrentPlayerIndex(game)).toBe(-1);

      // Deal to SB (p2)
      applyAction(game, 'd dh p2 QhJh');
      expect(game.players[1].cards).toEqual(['Qh', 'Jh']);
      expect(game.usedCards).toBe(4);
      expect(isAwaitingDealer(game)).toBe(true);
      expect(getCurrentPlayerIndex(game)).toBe(-1);

      // Deal to BB (p3)
      applyAction(game, 'd dh p3 ThTd');
      expect(game.players[2].cards).toEqual(['Th', 'Td']);
      expect(game.usedCards).toBe(6);

      // After dealing, BTN acts first preflop
      expect(getCurrentPlayerIndex(game)).toBe(0);
      expect(isAwaitingDealer(game)).toBe(false);

      // Verify blinds are posted
      expect(game.players[1].roundBet).toBe(10); // SB
      expect(game.players[2].roundBet).toBe(20); // BB
    });

    it('should handle invalid hole card deals gracefully', () => {
      const game = Game(sampleGame);

      expect(getCurrentPlayerIndex(game)).toBe(-1);
      expect(isAwaitingDealer(game)).toBe(true);

      // Invalid player index
      applyAction(game, 'd dh p9 AhKh');
      expect(game.players.every(p => p.cards.length === 0)).toBe(true);
      expect(game.usedCards).toBe(0);
      expect(getCurrentPlayerIndex(game)).toBe(-1);

      // Invalid action type
      applyAction(game, 'd xx AhKh' as Action);
      expect(game.players.every(p => p.cards.length === 0)).toBe(true);
      expect(game.usedCards).toBe(0);
      expect(getCurrentPlayerIndex(game)).toBe(-1);
    });
  });

  describe('dealing board cards', () => {
    it('should deal flop after preflop betting completes', () => {
      const game = Game({
        ...sampleGame,
        actions: [
          'd dh p1 AhKh',
          'd dh p2 QhJh',
          'd dh p3 ThTd',
          'p1 cc', // BTN calls
          'p2 cc', // SB completes
          'p3 cc', // BB checks
        ],
      });

      // Verify dealer should act
      expect(getCurrentPlayerIndex(game)).toBe(-1);
      expect(isAwaitingDealer(game)).toBe(true);

      // Deal flop
      applyAction(game, 'd db AhKhQh');

      // Verify flop state
      expect(game.board).toEqual(['Ah', 'Kh', 'Qh']);
      expect(game.street).toBe('flop');
      expect(game.bet).toBe(0);
      expect(game.players.every(p => !p.hasActed && p.roundBet === 0 && p.roundBet === 0)).toBe(
        true
      );
      expect(game.isBettingComplete).toBe(false);
      expect(game.lastBetAction).toBeUndefined();
      expect(getCurrentPlayerIndex(game)).toBe(1); // SB acts first postflop
    });

    it('should deal turn after flop betting completes', () => {
      const game = Game({
        ...sampleGame,
        actions: [
          'd dh p1 AhKh',
          'd dh p2 QhJh',
          'd dh p3 ThTd',
          'p1 cc', // BTN calls
          'p2 cc', // SB completes
          'p3 cc', // BB checks
          'd db AhKhQh', // Flop
          'p2 cc', // SB checks
          'p3 cc', // BB checks
          'p1 cc', // BTN checks
        ],
      });

      // Verify dealer should act
      expect(getCurrentPlayerIndex(game)).toBe(-1);
      expect(isAwaitingDealer(game)).toBe(true);

      // Deal turn
      applyAction(game, 'd db Jh');

      // Verify turn state
      expect(game.board).toEqual(['Ah', 'Kh', 'Qh', 'Jh']);
      expect(game.street).toBe('turn');
      expect(game.bet).toBe(0);
      expect(game.players.every(p => !p.hasActed && p.roundBet === 0 && p.roundBet === 0)).toBe(
        true
      );
      expect(game.isBettingComplete).toBe(false);
      expect(game.lastBetAction).toBeUndefined();
      expect(getCurrentPlayerIndex(game)).toBe(1); // SB acts first postflop
    });

    it('should deal river after turn betting completes', () => {
      const game = Game({
        ...sampleGame,
        actions: [
          'd dh p1 AhKh',
          'd dh p2 QhJh',
          'd dh p3 ThTd',
          'p1 cc', // BTN calls
          'p2 cc', // SB completes
          'p3 cc', // BB checks
          'd db AhKhQh', // Flop
          'p2 cc', // SB checks
          'p3 cc', // BB checks
          'p1 cc', // BTN checks
          'd db Jh', // Turn
          'p2 cc', // SB checks
          'p3 cc', // BB checks
          'p1 cc', // BTN checks
        ],
      });

      // Verify dealer should act
      expect(getCurrentPlayerIndex(game)).toBe(-1);
      expect(isAwaitingDealer(game)).toBe(true);

      // Deal river
      applyAction(game, 'd db Th');

      // Verify river state
      expect(game.board).toEqual(['Ah', 'Kh', 'Qh', 'Jh', 'Th']);
      expect(game.street).toBe('river');
      expect(game.bet).toBe(0);
      expect(game.players.every(p => !p.hasActed && p.roundBet === 0 && p.roundBet === 0)).toBe(
        true
      );
      expect(game.isBettingComplete).toBe(false);
      expect(game.lastBetAction).toBeUndefined();
      expect(getCurrentPlayerIndex(game)).toBe(1); // SB acts first postflop
    });

    it('should not allow dealing next street when betting is incomplete', () => {
      const game = Game({
        ...sampleGame,
        actions: [
          'd dh p1 AhKh',
          'd dh p2 QhJh',
          'd dh p3 ThTd',
          'p1 cc', // BTN calls
          'p2 cbr 100', // SB raises
          // BB hasn't acted yet
        ],
      });

      // Verify betting is not complete, dealer cannot act
      expect(getCurrentPlayerIndex(game)).toBe(2); // BB still needs to act
      expect(isAwaitingDealer(game)).toBe(false);
      expect(game.street).toBe('preflop');
    });

    it('should not allow dealing next street when bets are not matched', () => {
      const game = Game({
        ...sampleGame,
        actions: [
          'd dh p1 AhKh',
          'd dh p2 QhJh',
          'd dh p3 ThTd',
          'p1 cc', // BTN calls
          'p2 cbr 100', // SB raises
          'p3 cc', // BB calls
          // BTN hasn't called the raise
        ],
      });

      // Verify betting is not complete, dealer cannot act
      expect(getCurrentPlayerIndex(game)).toBe(0); // BTN still needs to act
      expect(isAwaitingDealer(game)).toBe(false);
      expect(game.street).toBe('preflop');
    });
  });

  describe('multi-way all-in scenarios', () => {
    it('should deal all streets automatically after multi-way all-in', () => {
      const game = Game({
        variant: 'NT',
        minBet: 20,
        players: ['p1', 'p2', 'p3'],
        startingStacks: [50, 100, 200],
        blindsOrStraddles: [0, 10, 20],
        antes: [],
        seed: 0,
        actions: [
          'd dh p1 3h9d',
          'd dh p2 Ks9h',
          'd dh p3 7hQh',
          'p1 cbr 50', // p1 all-in
          'p2 cbr 100', // p2 all-in
          'p3 cc', // p3 calls
        ],
      });

      // After p3 calls, all players have acted and matched bets
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Should be dealer's turn
      expect(game.players[0].isAllIn).toBe(true);
      expect(game.players[1].isAllIn).toBe(true);
      expect(game.players[2].hasActed).toBe(true);

      // After p3 calls, dealer should automatically deal flop
      const action1 = deal(game);
      expect(action1).toMatch(/^d db/);
      if (action1) applyAction(game, action1);
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Still dealer's turn as no more betting possible

      // After flop, dealer should automatically deal turn
      const action2 = deal(game);
      expect(action2).toMatch(/^d db/);
      if (action2) applyAction(game, action2);
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Still dealer's turn

      // After turn, dealer should automatically deal river
      const action3 = deal(game);
      expect(action3).toMatch(/^d db/);
      if (action3) applyAction(game, action3);
      expect(getCurrentPlayerIndex(game)).toBe(1); // P2 is next to act in showdown

      // After river, dealer should start showing cards
      const action4 = deal(game);
      expect(action4).toMatch(/^p\d sm/);
      if (action4) applyAction(game, action4);
      expect(getCurrentPlayerIndex(game)).toBe(2); // P3 now to show
    });
  });
});
