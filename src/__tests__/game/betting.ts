import { describe, expect } from 'vitest';
import { Game } from '../../Game';
import { getCurrentPlayerIndex } from '../../game/position';
import { applyAction } from '../../game/progress';
import type { Hand } from '../../Hand';

/**
 * @instructions
 *
 * Testing principles demonstrated in this file:
 *
 * 1. State Validation First:
 *    - Verify initial betting state before actions
 *    - Check getPlayerIndex to confirm correct action order
 *    - Validate betting completion conditions
 *
 * 2. Complete Action Sequences:
 *    - Each test shows complete sequence of actions
 *    - Actions are commented to show their meaning
 *    - Include all necessary setup (dealing cards, etc)
 *
 * 3. State Verification:
 *    - Check betting state after each action
 *    - Verify both direct effects (bettingComplete) and side effects (player states)
 *    - Confirm correct action order transitions
 *
 * 4. Edge Cases:
 *    - Test special scenarios (heads-up, all-in)
 *    - Verify folded player handling
 *    - Check boundary conditions
 *
 * 5. Clear Test Organization:
 *    - Group by betting scenario type
 *    - Each test focuses on one specific behavior
 *    - Descriptive test names
 */

const sampleGame: Hand = {
  variant: 'NT',
  players: ['p1', 'p2', 'p3'],
  startingStacks: [1000, 1000, 1000],
  blindsOrStraddles: [10, 20, 0],
  antes: [0, 0, 0],
  actions: [],
  minBet: 20,
};

describe('Betting State', () => {
  describe('standard betting rounds', () => {
    it('should not complete hand until showdown', () => {
      const hand: Hand = {
        variant: 'NT',
        minBet: 100,
        actions: [
          'd dh p1 3hTc',
          'd dh p2 3sQc',
          'p1 cbr 250',
          'p2 cbr 600',
          'p1 cbr 2500',
          'p2 cbr 3500',
          'p1 cbr 10000',
          'p2 cbr 22000',
          'p1 f',
        ],
        table: 'croupierTable_220182',
        antes: [0, 0],
        blindsOrStraddles: [50, 100],
        startingStacks: [100000, 100000],
        players: ['Leleka', 'Romulus'],
        seats: [0, 3],
        author: '',
        timeLimit: 10,
        venue: 'pokerrrr',
        _heroIds: ['Leleka', 'Romulus'],
        _venueIds: ['Leleka', 'Romulus'],
        _managerUid: 'manager_123',
        hand: 1,
        seed: 459717,
        time: '2025-04-21T15:05:21.537Z',
        _timestamp: 1745247921537,
        _croupierId: 'croupier_123',
      };
      const game = Game(hand);
      // no showdown, should be true
      expect(game.isComplete).toBe(true);
    });
    it('should complete betting round when all players call a bet', () => {
      const game = Game(sampleGame);

      // Initial state - awaiting dealer
      expect(game.isBettingComplete).toBe(false);
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Awaiting initial deal

      // Deal cards one by one, should still await dealer
      applyAction(game, 'd dh p1 AhKh');
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Still dealing

      applyAction(game, 'd dh p2 QhJh');
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Still dealing

      applyAction(game, 'd dh p3 ThTd');
      expect(getCurrentPlayerIndex(game)).toBe(2); // UTG acts first preflop

      // Complete preflop action
      applyAction(game, 'p3 cc'); // UTG calls
      expect(getCurrentPlayerIndex(game)).toBe(0); // Action to BTN

      applyAction(game, 'p1 cc'); // BTN calls
      expect(getCurrentPlayerIndex(game)).toBe(1); // Action to SB

      applyAction(game, 'p2 cc'); // SB checks
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Betting complete, dealer to act

      // Deal flop
      applyAction(game, 'd db AcKcQc');

      // Verify initial flop state
      expect(game.isBettingComplete).toBe(false);
      expect(getCurrentPlayerIndex(game)).toBe(0); // First after button
      expect(game.buttonIndex).toBe(2);
      expect(game.lastBetAction).toBeUndefined();

      // Player 1 checks
      applyAction(game, 'p1 cc');
      expect(getCurrentPlayerIndex(game)).toBe(1); // Action to SB

      // Player 2 bets
      applyAction(game, 'p2 cbr 100');
      expect(game.isBettingComplete).toBe(false);
      expect(game.lastBetAction).toBe('p2 cbr 100');
      expect(getCurrentPlayerIndex(game)).toBe(2); // Action to BB

      // Player 3 calls
      applyAction(game, 'p3 cc');
      expect(game.isBettingComplete).toBe(false);
      expect(getCurrentPlayerIndex(game)).toBe(0); // Back to BTN

      // Player 1 calls, completing the betting round
      applyAction(game, 'p1 cc');
      expect(game.isBettingComplete).toBe(true);
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Awaiting dealer
      expect(game.players.every(p => p.hasActed)).toBe(true);
    });

    it('should complete betting round when all remaining players fold to a bet', () => {
      const game = Game(sampleGame);

      // Initial state - awaiting dealer
      expect(getCurrentPlayerIndex(game)).toBe(-1);

      // Setup game state
      applyAction(game, 'd dh p1 AhKh');
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Still dealing

      applyAction(game, 'd dh p2 QhJh');
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Still dealing

      applyAction(game, 'd dh p3 ThTd');
      expect(getCurrentPlayerIndex(game)).toBe(2); // UTG acts first preflop

      // Complete preflop action
      applyAction(game, 'p3 cc'); // UTG calls
      expect(getCurrentPlayerIndex(game)).toBe(0); // Action to BTN

      applyAction(game, 'p1 cc'); // BTN calls
      expect(getCurrentPlayerIndex(game)).toBe(1); // Action to SB

      applyAction(game, 'p2 cc'); // SB checks
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Betting complete, dealer to act

      // Deal flop
      applyAction(game, 'd db AcKcQc');

      // Verify initial flop state
      expect(game.isBettingComplete).toBe(false);
      expect(getCurrentPlayerIndex(game)).toBe(0); // First after button

      // Player 1 checks
      applyAction(game, 'p1 cc');
      expect(getCurrentPlayerIndex(game)).toBe(1); // Action to SB

      // Player 2 bets
      applyAction(game, 'p2 cbr 100');
      expect(game.isBettingComplete).toBe(false);
      expect(game.lastBetAction).toBe('p2 cbr 100');
      expect(getCurrentPlayerIndex(game)).toBe(2); // Action to BB

      // Player 3 folds
      applyAction(game, 'p3 f');
      expect(game.isBettingComplete).toBe(false);
      expect(game.players[2].hasFolded).toBe(true);
      expect(getCurrentPlayerIndex(game)).toBe(0); // Action to BTN

      // Player 1 folds, completing the betting round
      applyAction(game, 'p1 f');
      expect(game.isBettingComplete).toBe(true);
      expect(game.players[0].hasFolded).toBe(true);
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Awaiting dealer
    });
  });

  describe('position and action order', () => {
    it('should handle heads-up position rules with SB acting first preflop and BB first postflop', () => {
      const headsUpGame: Hand = {
        ...sampleGame,
        players: ['p1', 'p2'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [10, 20],
        antes: [0, 0],
      };

      const game = Game(headsUpGame);
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Awaiting initial deal

      // Setup initial state
      applyAction(game, 'd dh p1 AhKh');
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Still dealing

      applyAction(game, 'd dh p2 QhJh');
      expect(getCurrentPlayerIndex(game)).toBe(0); // SB acts first in heads-up preflop

      // Verify preflop state (SB acts first in heads-up)
      expect(game.buttonIndex).toBe(0); // Button is SB in heads-up

      // Complete preflop action
      applyAction(game, 'p1 cc'); // SB calls
      expect(getCurrentPlayerIndex(game)).toBe(1); // Action to BB

      applyAction(game, 'p2 cc'); // BB checks
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Betting complete, dealer to act

      // Deal flop
      applyAction(game, 'd db AcKcQc');

      // Verify postflop state (BB acts first in heads-up)
      expect(getCurrentPlayerIndex(game)).toBe(1); // BB acts first postflop
      expect(game.isBettingComplete).toBe(false);

      // BB checks
      applyAction(game, 'p2 cc');
      expect(getCurrentPlayerIndex(game)).toBe(0); // Action to SB/BTN

      // SB/BTN checks
      applyAction(game, 'p1 cc');
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Betting complete, dealer to act
    });

    it('should maintain correct action order when players fold preflop', () => {
      const game = Game(sampleGame);
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Awaiting initial deal

      // Setup initial state
      applyAction(game, 'd dh p1 AhKh');
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Still dealing

      applyAction(game, 'd dh p2 QhJh');
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Still dealing

      applyAction(game, 'd dh p3 ThTd');
      expect(getCurrentPlayerIndex(game)).toBe(2); // UTG acts first preflop

      // Verify preflop state
      expect(game.buttonIndex).toBe(2);

      // Player 3 (UTG) folds
      applyAction(game, 'p3 f');
      expect(game.players[2].hasFolded).toBe(true);
      expect(getCurrentPlayerIndex(game)).toBe(0); // Action to BTN

      // Complete preflop action
      applyAction(game, 'p1 cc'); // BTN calls
      expect(getCurrentPlayerIndex(game)).toBe(1); // Action to SB

      applyAction(game, 'p2 cc'); // SB checks
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Betting complete, dealer to act

      // Deal flop
      applyAction(game, 'd db AcKcQc');

      // Verify postflop state
      expect(getCurrentPlayerIndex(game)).toBe(0); // First active player after button
      expect(game.isBettingComplete).toBe(false);

      // BTN checks
      applyAction(game, 'p1 cc');
      expect(getCurrentPlayerIndex(game)).toBe(1); // Action to SB

      // SB checks
      applyAction(game, 'p2 cc');
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Betting complete, dealer to act
    });

    it('should handle betting completion when player goes all-in and others call', () => {
      const smallStackGame = {
        ...sampleGame,
        startingStacks: [50, 1000, 1000],
      };

      const game = Game(smallStackGame);
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Awaiting initial deal

      // Setup initial state
      applyAction(game, 'd dh p1 AhKh');
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Still dealing

      applyAction(game, 'd dh p2 QhJh');
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Still dealing

      applyAction(game, 'd dh p3 ThTd');
      expect(getCurrentPlayerIndex(game)).toBe(2); // UTG acts first preflop

      // Verify preflop state
      expect(game.players[0].stack).toBe(40); // After SB
      expect(game.players[0].roundBet).toBe(10);

      // UTG folds
      applyAction(game, 'p3 f');
      expect(getCurrentPlayerIndex(game)).toBe(0); // Action to BTN

      // Player 1 goes all-in
      applyAction(game, 'p1 cbr 50');
      expect(game.isBettingComplete).toBe(false);
      expect(game.lastBetAction).toBe('p1 cbr 50');
      expect(game.players[0].isAllIn).toBe(true);
      expect(game.players[0].stack).toBe(0);
      expect(getCurrentPlayerIndex(game)).toBe(1); // Action to SB

      // SB calls
      applyAction(game, 'p2 cc');
      expect(game.isBettingComplete).toBe(true); // No more action possible
      expect(getCurrentPlayerIndex(game)).toBe(-1); // Betting complete, dealer to act
      expect(game.players.every(p => p.hasActed || p.hasFolded)).toBe(true);
    });

    it('should handle betting completion when last player folds to all-in after others called', () => {
      const game = Game(sampleGame);

      // Setup initial state
      applyAction(game, 'd dh p1 AhKh');
      applyAction(game, 'd dh p2 QhJh');
      applyAction(game, 'd dh p3 ThTd');
      expect(getCurrentPlayerIndex(game)).toBe(2); // UTG acts first preflop

      // Preflop action
      applyAction(game, 'p3 cbr 200'); // UTG raises
      expect(getCurrentPlayerIndex(game)).toBe(0);

      applyAction(game, 'p1 cc'); // BTN calls
      expect(getCurrentPlayerIndex(game)).toBe(1);

      applyAction(game, 'p2 cc'); // SB calls
      expect(game.isBettingComplete).toBe(true);
      expect(getCurrentPlayerIndex(game)).toBe(-1);

      // Deal flop
      applyAction(game, 'd db AcKcQc');
      expect(getCurrentPlayerIndex(game)).toBe(0);

      // BTN goes all-in
      applyAction(game, 'p1 cbr 800');
      expect(getCurrentPlayerIndex(game)).toBe(1);
      expect(game.isBettingComplete).toBe(false);

      // SB calls all-in
      applyAction(game, 'p2 cc');
      expect(getCurrentPlayerIndex(game)).toBe(2);
      expect(game.isBettingComplete).toBe(false);

      // BB folds to all-in after others called
      applyAction(game, 'p3 f');
      expect(game.isBettingComplete).toBe(true);
      expect(getCurrentPlayerIndex(game)).toBe(-1);
    });

    it('should handle betting when multiple players go all-in with different stack sizes', () => {
      const shortStackGame = {
        ...sampleGame,
        startingStacks: [200, 400, 800],
      };

      const game = Game(shortStackGame);

      // Setup initial state
      applyAction(game, 'd dh p1 AhKh');
      applyAction(game, 'd dh p2 QhJh');
      applyAction(game, 'd dh p3 ThTd');
      expect(getCurrentPlayerIndex(game)).toBe(2); // UTG acts first preflop

      // UTG goes all-in with largest stack
      applyAction(game, 'p3 cbr 800');
      expect(getCurrentPlayerIndex(game)).toBe(0);
      expect(game.isBettingComplete).toBe(false);

      // BTN goes all-in with smallest stack
      applyAction(game, 'p1 cc');
      expect(game.players[0].isAllIn).toBe(true);
      expect(game.players[0].stack).toBe(0);
      expect(getCurrentPlayerIndex(game)).toBe(1);
      expect(game.isBettingComplete).toBe(false);

      // SB goes all-in with medium stack
      applyAction(game, 'p2 cc');
      expect(game.players[1].isAllIn).toBe(true);
      expect(game.players[1].stack).toBe(0);
      expect(game.isBettingComplete).toBe(true);
      expect(getCurrentPlayerIndex(game)).toBe(-1);
    });

    it('should handle betting when player goes all-in for less than previous bet', () => {
      const shortStackGame = {
        ...sampleGame,
        startingStacks: [50, 1000, 1000],
      };

      const game = Game(shortStackGame);

      // Setup initial state
      applyAction(game, 'd dh p1 AhKh');
      applyAction(game, 'd dh p2 QhJh');
      applyAction(game, 'd dh p3 ThTd');
      expect(getCurrentPlayerIndex(game)).toBe(2); // UTG acts first preflop

      // UTG raises big
      applyAction(game, 'p3 cbr 200');
      expect(getCurrentPlayerIndex(game)).toBe(0);
      expect(game.isBettingComplete).toBe(false);

      // BTN all-in for less than the raise
      applyAction(game, 'p1 cc');
      expect(game.players[0].isAllIn).toBe(true);
      expect(game.players[0].stack).toBe(0);
      expect(getCurrentPlayerIndex(game)).toBe(1);
      expect(game.isBettingComplete).toBe(false);

      // SB calls full amount
      applyAction(game, 'p2 cc');
      expect(game.isBettingComplete).toBe(true);
      expect(getCurrentPlayerIndex(game)).toBe(-1);
    });

    it('should handle betting when all players but one are all-in', () => {
      const shortStackGame = {
        ...sampleGame,
        startingStacks: [50, 60, 1000],
      };

      const game = Game(shortStackGame);

      // Setup initial state
      applyAction(game, 'd dh p1 AhKh');
      applyAction(game, 'd dh p2 QhJh');
      applyAction(game, 'd dh p3 ThTd');
      expect(getCurrentPlayerIndex(game)).toBe(2); // UTG acts first preflop

      // UTG raises
      applyAction(game, 'p3 cbr 100');
      expect(getCurrentPlayerIndex(game)).toBe(0);
      expect(game.isBettingComplete).toBe(false);

      // BTN all-in for less
      applyAction(game, 'p1 cc');
      expect(game.players[0].isAllIn).toBe(true);
      expect(getCurrentPlayerIndex(game)).toBe(1);
      expect(game.isBettingComplete).toBe(false);

      // SB all-in for less
      applyAction(game, 'p2 cc');
      expect(game.players[1].isAllIn).toBe(true);
      expect(game.isBettingComplete).toBe(true);
      expect(getCurrentPlayerIndex(game)).toBe(-1);
    });
  });

  describe('complex betting scenarios', () => {
    it('should track correct betting amounts in flush vs pair showdown hand', () => {
      const hand: Hand = {
        variant: 'NT',
        players: ['dddocky', 'Duke Croix', 'color_singleton', 'Klemtonius', 'HighCardJasper'],
        startingStacks: [4768, 8950, 10000, 68607, 18608],
        blindsOrStraddles: [0, 50, 100, 0, 0],
        antes: [0, 0, 0, 0, 0],
        minBet: 100,
        actions: [],
        rake: 938,
      };

      const game = Game(hand);

      // Deal cards
      applyAction(game, 'd dh p1 ????');
      applyAction(game, 'd dh p2 Td8s');
      applyAction(game, 'd dh p3 ????');
      applyAction(game, 'd dh p4 QcTh');
      applyAction(game, 'd dh p5 JhAc');

      // Preflop
      applyAction(game, 'p4 cbr 200');
      expect(game.players[3].totalBet).toBe(200);

      applyAction(game, 'p5 cc');
      expect(game.players[4].totalBet).toBe(200);

      applyAction(game, 'p1 f');
      expect(game.players[0].hasFolded).toBe(true);

      applyAction(game, 'p2 f');
      expect(game.players[1].hasFolded).toBe(true);
      expect(game.players[1].totalBet).toBe(50); // SB remains

      applyAction(game, 'p3 cc');
      expect(game.players[2].totalBet).toBe(200);
      expect(game.pot).toBe(650); // SB(50) + BB(200) + Klemtonius(200) + HighCardJasper(200)

      // Flop
      applyAction(game, 'd db Kc6c8c');

      applyAction(game, 'p3 cc');
      expect(game.players[2].roundBet).toBe(0);

      applyAction(game, 'p4 cbr 543');
      expect(game.players[3].roundBet).toBe(543);
      expect(game.players[3].totalBet).toBe(743);

      applyAction(game, 'p5 cc');
      expect(game.players[4].roundBet).toBe(543);
      expect(game.players[4].totalBet).toBe(743);

      applyAction(game, 'p3 f');
      expect(game.players[2].hasFolded).toBe(true);
      expect(game.pot).toBe(1736); // Previous 650 + 2 * 543

      // Turn
      applyAction(game, 'd db 2s');

      applyAction(game, 'p4 cc');
      expect(game.players[3].roundBet).toBe(0);

      applyAction(game, 'p5 cc');
      expect(game.players[4].roundBet).toBe(0);
      expect(game.pot).toBe(1736); // No new bets

      // River
      applyAction(game, 'd db 9c');

      applyAction(game, 'p4 cbr 1830');
      expect(game.players[3].roundBet).toBe(1830);
      expect(game.players[3].totalBet).toBe(2573);

      applyAction(game, 'p5 cbr 7560');
      expect(game.players[4].roundBet).toBe(7560);
      expect(game.players[4].totalBet).toBe(8303);

      applyAction(game, 'p4 cc');
      expect(game.players[3].roundBet).toBe(7560);
      expect(game.players[3].totalBet).toBe(8303);

      // Final pot should be 16118 (16856 - 938 rake)
      expect(game.pot).toBe(16856); // Total bets: preflop(650) + flop(1086) + river(15120)
      expect(game.rake).toBe(938);

      // Show cards
      applyAction(game, 'p5 sm JhAc');
      applyAction(game, 'p4 sm QcTh');

      expect(game.isBettingComplete).toBe(true);
      expect(game.isShowdown).toBe(true);

      // Verify final state
      expect(game.isComplete).toBe(true);
      expect(game.pot).toBe(15918);
    });
  });
});
