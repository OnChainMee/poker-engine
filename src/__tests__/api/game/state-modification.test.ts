import { describe, expect, it } from 'vitest';
import * as Poker from '../../../index';
import { NO_LIMIT_HAND, MINIMAL_HAND } from './fixtures/baseGame';

describe('Game API - State Modification', () => {
  describe('applyAction', () => {
    describe('Betting Actions', () => {
      it('should update pot and player bets on raise', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          actions: ['d dh p1 AsKs', 'd dh p2 7h2d', 'd dh p3 QhQc', 'd dh p4 JdTd'],
        };
        const game = Poker.Game(hand);
        const initialPot = game.pot;

        const updatedGame = Poker.Game.applyAction(game, 'p3 cbr 60');

        expect(updatedGame.pot).toBe(initialPot + 60);
        expect(updatedGame.players[2].roundBet).toBe(60);
        expect(updatedGame.players[2].stack).toBe(800 - 60);
        expect(updatedGame.nextPlayerIndex).toBe(3); // David's turn
      });

      it('should handle call actions correctly', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          actions: ['d dh p1 AsKs', 'd dh p2 7h2d', 'd dh p3 QhQc', 'd dh p4 JdTd', 'p3 cbr 60'],
        };
        const game = Poker.Game(hand);

        const updatedGame = Poker.Game.applyAction(game, 'p4 cc 60');

        expect(updatedGame.players[3].roundBet).toBe(60);
        expect(updatedGame.players[3].stack).toBe(1200 - 60);
        expect(updatedGame.pot).toBe(30 + 60 + 60); // Blinds + two bets
      });

      it('should handle check actions', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          actions: [...NO_LIMIT_HAND.actions], // On flop, Charlie to act
        };
        const game = Poker.Game(hand);
        const initialPot = game.pot;

        const updatedGame = Poker.Game.applyAction(game, 'p3 cc');

        expect(updatedGame.pot).toBe(initialPot); // No change
        expect(updatedGame.players[2].roundBet).toBe(0); // Reset for new street
        expect(updatedGame.nextPlayerIndex).toBe(3); // David's turn
      });

      it('should handle fold actions', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          actions: ['d dh p1 AsKs', 'd dh p2 7h2d', 'd dh p3 QhQc', 'd dh p4 JdTd', 'p3 cbr 60'],
        };
        const game = Poker.Game(hand);

        const updatedGame = Poker.Game.applyAction(game, 'p4 f');

        expect(updatedGame.players[3].hasFolded).toBe(true);
        expect(updatedGame.players[3].roundBet).toBe(0);
        // Should advance to next player or complete hand
        expect(updatedGame.nextPlayerIndex).toBe(0); // Alice's turn
      });

      it('should handle all-in bets', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          startingStacks: [100, 150, 80, 120],
          actions: ['d dh p1 AsKs', 'd dh p2 7h2d', 'd dh p3 QhQc', 'd dh p4 JdTd'],
        };
        const game = Poker.Game(hand);

        const updatedGame = Poker.Game.applyAction(game, 'p3 cbr 80');

        expect(updatedGame.players[2].isAllIn).toBe(true);
        expect(updatedGame.players[2].stack).toBe(0);
        expect(updatedGame.players[2].roundBet).toBe(80);
        expect(updatedGame.pot).toBe(30 + 80); // Blinds + all-in
      });
    });

    describe('Dealer Actions', () => {
      it('should deal hole cards', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          actions: [],
        };
        const game = Poker.Game(hand);

        const updated1 = Poker.Game.applyAction(game, 'd dh p1 AsKs');
        expect(updated1.players[0].cards).toEqual(['As', 'Ks']);

        const updated2 = Poker.Game.applyAction(updated1, 'd dh p2 7h2d');
        expect(updated2.players[1].cards).toEqual(['7h', '2d']);
      });

      it('should deal flop', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          actions: [
            'd dh p1 AsKs',
            'd dh p2 7h2d',
            'd dh p3 QhQc',
            'd dh p4 JdTd',
            'p3 cc 20',
            'p4 cc 20',
            'p1 cc',
            'p2 cc',
          ],
        };
        const game = Poker.Game(hand);

        const updatedGame = Poker.Game.applyAction(game, 'd db AhKhQd');

        expect(updatedGame.board).toEqual(['Ah', 'Kh', 'Qd']);
        expect(updatedGame.street).toBe('flop');
        // Should reset to first active player
        expect(updatedGame.players[2].roundBet).toBe(0); // Bets reset
      });

      it('should deal turn', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          actions: [...NO_LIMIT_HAND.actions, 'p3 cc', 'p4 cc'],
        };
        const game = Poker.Game(hand);

        const updatedGame = Poker.Game.applyAction(game, 'd db Td');

        expect(updatedGame.board).toEqual(['Ah', 'Kh', 'Qd', 'Td']);
        expect(updatedGame.street).toBe('turn');
      });

      it('should deal river', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          actions: [...NO_LIMIT_HAND.actions, 'p3 cc', 'p4 cc', 'd db Td', 'p3 cc', 'p4 cc'],
        };
        const game = Poker.Game(hand);

        const updatedGame = Poker.Game.applyAction(game, 'd db 9s');

        expect(updatedGame.board).toEqual(['Ah', 'Kh', 'Qd', 'Td', '9s']);
        expect(updatedGame.street).toBe('river');
      });
    });

    describe('Show/Muck Actions', () => {
      it('should handle show actions', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          actions: [
            ...NO_LIMIT_HAND.actions,
            'p3 cc',
            'p4 cc',
            'd db Td',
            'p3 cc',
            'p4 cc',
            'd db 9s',
            'p3 cc',
            'p4 cc',
          ],
        };
        const game = Poker.Game(hand);

        const updatedGame = Poker.Game.applyAction(game, 'p3 sm QhQc');

        // Cards should be revealed
        expect(updatedGame.players[2].cards).toEqual(['Qh', 'Qc']);
        expect(updatedGame.players[2].hasShownCards).toBe(true);
      });

      it('should handle muck actions', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          actions: [
            ...NO_LIMIT_HAND.actions,
            'p3 cc',
            'p4 cc',
            'd db Td',
            'p3 cc',
            'p4 cc',
            'd db 9s',
            'p3 cc',
            'p4 cc',
          ],
        };
        const game = Poker.Game(hand);

        const updatedGame = Poker.Game.applyAction(game, 'p3 sm QhQc');

        expect(updatedGame.players[2].hasActed).toBe(true);
        // Cards should be visible
        expect(updatedGame.players[2].hasShownCards).toBe(true);

        const updatedGame2 = Poker.Game.applyAction(updatedGame, 'p4 sm');
        expect(updatedGame2.players[3].hasActed).toBe(true);
        expect(updatedGame2.players[3].hasShownCards).toBe(false);
      });
    });

    describe('State Transitions', () => {
      it('should advance street after betting round completes', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          actions: [
            'd dh p1 AsKs',
            'd dh p2 7h2d',
            'd dh p3 QhQc',
            'd dh p4 JdTd',
            'p3 cc 20',
            'p4 cc 20',
            'p1 cc',
          ],
        };
        const game = Poker.Game(hand);
        expect(game.street).toBe('preflop');

        // Last action to complete preflop
        const updatedGame = Poker.Game.applyAction(game, 'p2 cc');

        // Should be ready for flop
        expect(updatedGame.nextPlayerIndex).toBe(-1); // Dealer's turn
      });

      it('should complete hand when all but one fold', () => {
        const hand: Poker.Hand = {
          ...MINIMAL_HAND,
          actions: ['d dh p1 AsKs', 'd dh p2 7h2d', 'p1 cbr 100'],
        };
        const game = Poker.Game(hand);

        const updatedGame = Poker.Game.applyAction(game, 'p2 f');

        expect(updatedGame.isComplete).toBe(true);
        // Alice wins
        expect(updatedGame.players[0].winnings).toBeGreaterThan(0);
      });

      it('should enter showdown after final betting and card show/muck', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          actions: [
            ...NO_LIMIT_HAND.actions,
            'p3 cc',
            'p4 cc',
            'd db Td',
            'p3 cc',
            'p4 cc',
            'd db 9s',
            'p3 cc',
          ],
        };
        const game = Poker.Game(hand);

        let updatedGame = Poker.Game.applyAction(game, Poker.Command.check(game, 3));
        updatedGame = Poker.Game.applyAction(game, Poker.Command.muckCards(game, 2));
        updatedGame = Poker.Game.applyAction(game, Poker.Command.muckCards(game, 3));

        expect(updatedGame.isShowdown).toBe(true);
        expect(updatedGame.nextPlayerIndex).toBeGreaterThanOrEqual(-1); // Someone needs to show
      });
    });

    describe('Player Position Updates', () => {
      it('should update nextPlayerIndex correctly', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          actions: ['d dh p1 AsKs', 'd dh p2 7h2d', 'd dh p3 QhQc', 'd dh p4 JdTd'],
        };
        const game = Poker.Game(hand);
        expect(game.nextPlayerIndex).toBe(2); // Charlie

        const g1 = Poker.Game.applyAction(game, 'p3 cbr 60');
        expect(g1.nextPlayerIndex).toBe(3); // David

        const g2 = Poker.Game.applyAction(g1, 'p4 cc 60');
        expect(g2.nextPlayerIndex).toBe(0); // Alice

        const g3 = Poker.Game.applyAction(g2, 'p1 f');
        expect(g3.nextPlayerIndex).toBe(1); // Bob
      });

      it('should skip folded players', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          actions: [
            'd dh p1 AsKs',
            'd dh p2 7h2d',
            'd dh p3 QhQc',
            'd dh p4 JdTd',
            'p3 cbr 60',
            'p4 cc 60',
            'p1 f', // Alice folds
            'p2 f', // Bob folds
            'd db AhKhQd',
          ],
        };
        const game = Poker.Game(hand);

        // Only Charlie and David active
        expect(game.nextPlayerIndex).toBe(2); // Charlie

        const g1 = Poker.Game.applyAction(game, 'p3 cc');
        expect(g1.nextPlayerIndex).toBe(3); // David (skips folded players)
      });

      it('should skip all-in players', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          startingStacks: [100, 1500, 50, 1200],
          actions: [
            'd dh p1 AsKs',
            'd dh p2 7h2d',
            'd dh p3 QhQc',
            'd dh p4 JdTd',
            'p3 cbr 50', // Charlie all-in
            'p4 cc 50',
            'p1 cc 50',
            'p2 cc 50',
            'd db AhKhQd',
          ],
        };
        const game = Poker.Game(hand);

        // Charlie is all-in, should skip
        expect(game.players[2].isAllIn).toBe(true);
        expect(game.nextPlayerIndex).not.toBe(2);
      });
    });

    describe('Mutability', () => {
      it('should mutate the original game object', () => {
        const game = Poker.Game(NO_LIMIT_HAND);
        const originalNextPlayerIndex = game.nextPlayerIndex;

        const updatedGame = Poker.Game.applyAction(game, 'p3 cc');

        // Should return the same game reference
        expect(updatedGame).toBe(game);

        // Original game should be mutated
        expect(game.nextPlayerIndex).not.toBe(originalNextPlayerIndex);
        expect(game.nextPlayerIndex).toBe(3); // David's turn

        // Player has acted flag should be updated
        expect(game.players[2].hasActed).toBe(true);
      });

      it('should mutate player objects in place', () => {
        const game = Poker.Game(NO_LIMIT_HAND);
        const originalPlayer = game.players[2];
        const originalPlayers = game.players;

        const updatedGame = Poker.Game.applyAction(game, 'p3 cbr 100');

        // Should return same references
        expect(updatedGame.players).toBe(originalPlayers);
        expect(updatedGame.players[2]).toBe(originalPlayer);

        // But the player object should be mutated
        expect(game.players[2].roundBet).toBe(100);
        expect(game.players[2].stack).toBe(640); // 740 (after preflop 60 bet) - 100
      });
    });

    describe('Error Handling', () => {
      it('should throw for invalid actions', () => {
        // Wrong player - Alice already folded, can't act
        const game1 = Poker.Game(NO_LIMIT_HAND);
        expect(() => Poker.Game.applyAction(game1, 'p1 cc')).toThrow();

        // Wrong turn - it's Charlie's turn (p3), not David's (p4)
        const game2 = Poker.Game(NO_LIMIT_HAND);
        expect(() => Poker.Game.applyAction(game2, 'p4 cc')).toThrow();
      });

      it('should throw for actions after hand complete', () => {
        const hand: Poker.Hand = {
          ...MINIMAL_HAND,
          actions: [
            'd dh p1 AsKs',
            'd dh p2 7h2d',
            'p1 cbr 100',
            'p2 f', // Hand complete
          ],
        };
        const game = Poker.Game(hand);

        // Verify the hand is actually complete
        expect(game.isComplete).toBe(true);

        // Try to perform actions after completion
        expect(() => Poker.Game.applyAction(game, 'p1 cbr 200')).toThrow();
        expect(() => Poker.Game.applyAction(game, 'p2 cc')).toThrow();
      });
    });

    describe('Complex Scenarios', () => {
      it('should handle multi-way pots', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          actions: [
            'd dh p1 AsKs',
            'd dh p2 7h2d',
            'd dh p3 QhQc',
            'd dh p4 JdTd',
            'p3 cbr 60',
            'p4 cc 60',
            'p1 cc 60',
          ],
        };
        const game = Poker.Game(hand);

        const updatedGame = Poker.Game.applyAction(game, 'p2 cc 60');

        // All players in, ready for flop
        expect(updatedGame.pot).toBe(60 * 4); // 4 players at 60 each
        expect(updatedGame.nextPlayerIndex).toBe(-1); // Dealer's turn
      });

      it('should handle side pots with all-ins', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          startingStacks: [100, 500, 300, 400],
          actions: [
            'd dh p1 AsKs',
            'd dh p2 7h2d',
            'd dh p3 QhQc',
            'd dh p4 JdTd',
            'p3 cbr 100', // Charlie bets 100 (his max with 300 stack after blinds)
            'p4 cc 100',
            'p1 cbr 100', // Alice all-in for 100 total (90 more + 10 blind)
          ],
        };
        const game = Poker.Game(hand);

        // Bob calls 100
        const g1 = Poker.Game.applyAction(game, 'p2 cc 100');
        // Charlie already bet 100, doesn't need to act again
        // David already called 100, doesn't need to act again

        // Alice is all-in, main pot will be 100*4 = 400
        expect(g1.players[0].isAllIn).toBe(true);
        expect(g1.pot).toBe(100 * 4); // All players contributed 100
        expect(g1.nextPlayerIndex).toBe(-1); // Betting complete, dealer's turn
      });

      it('should handle re-raises', () => {
        const hand: Poker.Hand = {
          ...NO_LIMIT_HAND,
          actions: [
            'd dh p1 AsKs',
            'd dh p2 7h2d',
            'd dh p3 QhQc',
            'd dh p4 JdTd',
            'p3 cbr 60',
            'p4 cbr 120', // Re-raise
          ],
        };
        const game = Poker.Game(hand);

        const g1 = Poker.Game.applyAction(game, 'p1 f');
        const g2 = Poker.Game.applyAction(g1, 'p2 f');
        const g3 = Poker.Game.applyAction(g2, 'p3 cbr 240'); // Re-re-raise

        expect(g3.players[2].roundBet).toBe(240);
        expect(g3.nextPlayerIndex).toBe(3); // Back to David
      });
    });

    describe('Timestamp Handling', () => {
      it('should preserve timestamps in actions', () => {
        const now = Date.now();
        const game = Poker.Game(NO_LIMIT_HAND);

        const updatedGame = Poker.Game.applyAction(game, `p3 cc #${now}`);

        expect(updatedGame.lastTimestamp).toBe(now);
      });

      it('should update lastTimestamp', () => {
        const game = Poker.Game(NO_LIMIT_HAND);
        const originalTimestamp = game.lastTimestamp;
        const now = Date.now() + 1000; // Ensure it's different from any existing timestamp

        const updatedGame = Poker.Game.applyAction(game, `p3 cc #${now}`);

        expect(updatedGame).toBe(game); // Same object reference
        expect(updatedGame.lastTimestamp).toBe(now);
        expect(originalTimestamp).not.toBe(now); // Original value was different
      });
    });
  });
});
