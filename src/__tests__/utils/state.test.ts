/**
 * @instructions Actions should be applied to the table immediately after they are generated
 */

import { describe, expect, it } from 'vitest';
import { Game } from '../../Game';
import { bet, call, check, dealBoard, fold, raise } from '../../game/commands';
import { applyAction } from '../../game/progress';
import { canBet, canCall, canCheck, canFold, canRaise } from '../../game/validation';
import type { Hand } from '../../Hand';

const baseHand: Hand = {
  variant: 'NT',
  currency: 'USD',
  players: ['Hero', 'Villain', 'BB'],
  startingStacks: [1000, 1000, 1000],
  blindsOrStraddles: [0, 10, 20],
  antes: [],
  time: new Date().toISOString(),
  timeZone: 'UTC',
  minBet: 20,
  actions: ['d dh p1 AhKh', 'd dh p2 QhJh', 'd dh p3 ThTd'],
};

describe('Table State', () => {
  describe('canCheck', () => {
    it('allows BB to check after SB calls preflop', () => {
      const game = Game(baseHand);
      expect(canCall(game, 0)).toBe(true);
      applyAction(game, call(game, 0));

      // Big blind player should be able to check
      expect(game.players[2].totalBet).toBe(20); // BB player
      expect(game.players[2].hasActed).toBe(false);
      expect(game.players[2].hasFolded).toBe(false);
      expect(canCheck(game, 2)).toBe(true);

      // Verify check action works
      applyAction(game, check(game, 1));
      expect(game.players[1].hasActed).toBe(true);
      expect(game.players[1].totalBet).toBe(20);
    });

    it('prevents SB from checking when facing BB', () => {
      const game = Game(baseHand);

      // First player has only posted small blind
      expect(game.players[1].totalBet).toBe(10);
      expect(game.players[1].hasActed).toBe(false);
      expect(game.players[1].hasFolded).toBe(false);
      expect(canCheck(game, 1)).toBe(false);
    });
  });

  describe('canCall', () => {
    it('allows UTG to call BB preflop', () => {
      const game = Game(baseHand);

      // First player faces BB of 20 and has only posted 0
      expect(game.players[0].totalBet).toBe(0);
      expect(game.players[0].stack).toBe(1000);
      expect(game.players[0].hasActed).toBe(false);
      expect(game.players[0].hasFolded).toBe(false);
      expect(canCall(game, 0)).toBe(true);

      // Verify call action works
      applyAction(game, call(game, 0));
      expect(game.players[0].hasActed).toBe(true);
      expect(game.players[0].totalBet).toBe(20);
    });

    it('prevents BB from calling when no bets to call', () => {
      const game = Game(baseHand);
      applyAction(game, call(game, 0));

      // Player who posted BB should not be able to call
      expect(game.players[2].totalBet).toBe(20);
      expect(game.players[2].hasActed).toBe(false);
      expect(game.players[2].hasFolded).toBe(false);
      expect(canCall(game, 2)).toBe(false);
    });
  });

  describe('canBet', () => {
    it('allows first player to bet on flop', () => {
      // Complete preflop action
      const game = Game(baseHand);
      applyAction(game, call(game, 0));
      applyAction(game, call(game, 1));
      applyAction(game, check(game, 2));

      // Deal flop
      applyAction(game, dealBoard(game, ['Ac', 'Kc', 'Qc']));

      // First player should be able to bet on flop
      expect(game.players[0].hasActed).toBe(false);
      expect(game.players[0].hasFolded).toBe(false);
      expect(game.isComplete).toBe(false);
      expect(game.bet).toBe(0);
      expect(canBet(game, 0)).toBe(true);

      // Verify bet action works
      applyAction(game, bet(game, 1, 50));
      expect(game.players[1].hasActed).toBe(true);
      expect(game.players[1].totalBet).toBe(70); // 20 from preflop call + 50 from flop bet
      expect(game.bet).toBe(50);
    });

    it('prevents betting preflop when BB is posted', () => {
      const game = Game(baseHand);

      // Can't bet preflop because BB is posted
      expect(game.bet).toBe(20);
      expect(canBet(game, 0)).toBe(false);
    });
  });

  describe('canRaise', () => {
    it('allows UTG to raise over BB preflop', () => {
      const game = Game(baseHand);

      // First player can raise over BB
      expect(game.players[0].stack).toBe(1000);
      expect(game.bet).toBe(20);
      expect(game.players[0].hasActed).toBe(false);
      expect(game.players[0].hasFolded).toBe(false);
      expect(canRaise(game, 0)).toBe(true);

      // Verify raise action works
      applyAction(game, raise(game, 0, 60));
      expect(game.players[0].hasActed).toBe(true);
      expect(game.players[0].totalBet).toBe(60);
      expect(game.bet).toBe(60);
    });

    it('prevents raising on flop with no bets', () => {
      // Complete preflop action
      const game = Game(baseHand);
      applyAction(game, call(game, 0));
      applyAction(game, call(game, 1));
      applyAction(game, check(game, 2));

      // Deal flop
      applyAction(game, dealBoard(game, ['Ac', 'Kc', 'Qc']));

      // Can't raise on flop with no bets
      expect(game.bet).toBe(0);
      expect(canRaise(game, 0)).toBe(false);
    });

    it('allows raising all-in with insufficient stack for min-raise', () => {
      const smallStackHand = {
        ...baseHand,
        // Player 0 (UTG) has only 30 chips.
        // BB is 20. Min raise is to 40 (20 call + 20 raise).
        // Player 0 needs 40 chips total to make a valid raise.
        // Stack 30 is less than 40.
        startingStacks: [30, 1000, 1000],
      };
      const game = Game(smallStackHand);

      // First player can't make a FULL raise over BB with only 30 chips (needs 40)
      expect(game.players[0].stack).toBe(30);
      expect(game.bet).toBe(20);
      expect(game.minBet).toBe(20);

      // But they CAN raise all-in (incomplete raise)
      expect(canRaise(game, 0)).toBe(true);

      // Verify specific amounts
      // Cannot raise to min-raise (40) because stack is 30
      expect(canRaise(game, 0, 40)).toBe(false);

      // Can raise all-in (30)
      expect(canRaise(game, 0, 30)).toBe(true);
    });

    it('prevents capped player from re-raising after incomplete raise (all-in)', () => {
      // Scenario:
      // P1 bets 100
      // P2 calls 100
      // P3 goes all-in for 120 (incomplete raise, only +20)
      // Action back to P1.
      // P1 has already acted on the 100 bet.
      // The new raise is incomplete (less than min raise of 100).
      // P1 should be CAPPED (cannot raise, can only call or fold).

      const cappedHand = {
        ...baseHand,
        startingStacks: [1000, 1000, 120], // P3 short stack
        // implicitly uses baseHand.actions which deals cards
      };
      const game = Game(cappedHand);

      // Preflop: BB is 20.
      // P1 (UTG) raises to 100
      applyAction(game, raise(game, 0, 100));
      expect(game.bet).toBe(100);
      expect(game.lastCompleteBet).toBe(100);
      expect(game.minBet).toBe(80); // Raise was 80 (20->100)

      // P2 (SB) calls 100
      applyAction(game, call(game, 1));
      expect(game.players[1].roundBet).toBe(100);

      // P3 (BB) goes all-in for 120
      // This is a raise of 20 (120 - 100).
      // Min raise required was 80 (to 180).
      // So this is an INCOMPLETE raise.
      applyAction(game, 'p3 cbr 120'); // Manual all-in command
      expect(game.bet).toBe(120);
      expect(game.players[2].isAllIn).toBe(true);

      // Check state updates
      // The raise was incomplete, so minBet and lastCompleteBet should NOT have updated from P1's action?
      // P1's action: minBet = 80, lastCompleteBet = 100.
      // P3's action: incomplete.
      expect(game.lastCompleteBet).toBe(100);
      expect(game.minBet).toBe(80);

      // Action returns to P1 (UTG)
      expect(game.nextPlayerIndex).toBe(0);

      // P1 has already bet 100 (matches lastCompleteBet).
      // P1 is facing 120 (incomplete raise).
      // P1 should be capped.
      expect(canRaise(game, 0)).toBe(false);
      expect(canCall(game, 0)).toBe(true);
      expect(canFold(game, 0)).toBe(true);
    });

    it('allows uncapped player to raise after incomplete raise', () => {
      // Scenario:
      // P1 bets 100
      // P2 calls 100
      // P3 goes all-in for 120 (incomplete raise)
      // Suppose there was a P4 who hasn't acted yet.
      // P4 is NOT capped and can raise.

      const fourPlayerHand = {
        ...baseHand,
        players: ['P1', 'P2', 'P3', 'P4'],
        startingStacks: [1000, 1000, 120, 1000],
        blindsOrStraddles: [0, 0, 10, 20], // P3=SB, P4=BB
        actions: ['d dh p1 AhKh', 'd dh p2 QhJh', 'd dh p3 ThTd', 'd dh p4 2s3s'],
      };
      // Order: P1, P2, P3(SB), P4(BB)
      const game = Game(fourPlayerHand);

      // P1 bets 100
      applyAction(game, raise(game, 0, 100));

      // P2 calls 100
      applyAction(game, call(game, 1));

      // P3 (SB) goes all-in for 120 (incomplete raise)
      applyAction(game, 'p3 cbr 120');
      expect(game.bet).toBe(120);
      expect(game.lastCompleteBet).toBe(100);

      // Action moves to P4 (BB). P4 has NOT acted on the 100 bet yet.
      // P4 should be able to raise.
      expect(game.nextPlayerIndex).toBe(3);
      expect(canRaise(game, 3)).toBe(true);
    });

    it('enforces minimum raise amount correctly', () => {
      const game = Game(baseHand);
      // BB is 20. Min raise is to 40.

      // canRaise just returns boolean.
      expect(canRaise(game, 0)).toBe(true); // Can raise generally

      // The 'raise' command helper calculates the min correctly:
      const raiseCmd = raise(game, 0, 30);
      // Should auto-correct 30 to min (40)
      expect(raiseCmd).toContain('40');
    });
  });

  describe('canFold', () => {
    it('allows UTG to fold facing BB preflop', () => {
      const game = Game(baseHand);

      // First player can fold facing BB
      expect(game.players[0].totalBet).toBe(0);
      expect(game.bet).toBe(20);
      expect(game.players[0].hasActed).toBe(false);
      expect(game.players[0].hasFolded).toBe(false);
      expect(canFold(game, 0)).toBe(true);

      // Verify fold action works
      applyAction(game, fold(game, 0));
      expect(game.players[0].hasActed).toBe(true);
      expect(game.players[0].hasFolded).toBe(true);
    });
    it('allows folding on flop even with no bets', () => {
      // Complete preflop action
      const game = Game(baseHand);
      applyAction(game, call(game, 0));
      applyAction(game, call(game, 1));
      applyAction(game, check(game, 2));

      // Deal flop
      applyAction(game, dealBoard(game, ['Ac', 'Kc', 'Qc']));

      // No bet on the flop yet
      expect(game.bet).toBe(0);

      // Player 0 should still be allowed to fold (even though it's a bad play)
      expect(canFold(game, 0)).toBe(true);
    });
  });
});
