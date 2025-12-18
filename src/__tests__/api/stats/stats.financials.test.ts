import { describe, expect, it } from 'vitest';
import * as Poker from '../../..';
import { applyAction } from '../../../game/progress';
import { getPokerMetrics } from '../../../stats/metrics';

/**
 * @fileoverview Financial Statistics Tests for the Poker Engine
 *
 * @description
 * This file contains tests focused on verifying the accuracy of financial calculations
 * throughout a poker hand. The core philosophy is to track stats on a per-street basis
 * to allow for detailed analysis of player actions.
 *
 * --- Assertion Strategy ---
 *
 * 1.  **Per-Street Granularity**: All stats are stored in `PlayerStreetStats` objects.
 *     It's crucial to verify the state of these objects after each street's action.
 *
 * 2.  **`investments`**: This reflects the amount a player put into the pot *on that specific street*.
 *     It does not include amounts invested on previous streets.
 *
 * 3.  **`balance`**: This is a strictly per-street metric. It is calculated as:
 *     `winnings - (investments - returns)`.
 *     - For most streets, where winnings and returns are 0, this will simply be `-investments`.
 *     - For the final street of action for a player, it will include any winnings from the hand.
 *     - It should NOT reflect the total, cumulative hand profit/loss.
 *
 * 4.  **`winnings`, `losses`, `profits`, `returns`**: These are hand-level outcomes. They are
 *     recorded ONLY on the `PlayerStreetStats` object corresponding to the player's *final* street
 *     of action (e.g., the street they folded, went all-in, or showed down). All other streets
 *     will have these values as 0.
 *
 * 5.  **`stackBefore`, `stackAfter`**: These track the player's stack at the beginning and end
 *     of a single street, providing a clear audit trail of their financial state changes.
 *
 * 6.  **Aggregated Verification**: After all per-street assertions, each test must conclude
 *     by calling `getPokerMetrics` to verify the aggregated hand-level financials for each
 *     player and for the table total. This ensures that the sum of all actions results in a
 *     balanced and correct final outcome (e.g., total profits - total losses = total rake).
 *
 * By adhering to these principles, the tests ensure that both the granular per-street actions
 * and the final hand outcomes are calculated and attributed correctly.
 */

const sampleGame: Poker.Hand = {
  variant: 'NT',
  players: [],
  startingStacks: [],
  blindsOrStraddles: [],
  antes: [],
  actions: [],
  minBet: 20,
  seed: 12345,
};

describe('Financial Statistics', () => {
  describe('Complex Scenarios: All-ins and Side Pots', () => {
    it('should correctly track finances in a multiway all-in with side pots and a short stack', () => {
      // SCENARIO: P1 (short stack) is all-in pre-flop. P2 and P3 build a side pot on the flop and turn.
      // OUTCOME: P1 wins the main pot, P2 wins the side pot, and P3 loses both bets.
      // VERIFY: Correct per-street investments, winnings, profits, and losses for all three players.
      const table = Poker.Game({
        ...sampleGame,
        players: ['P1_BTN_Short', 'P2_SB', 'P3_BB'],
        blindsOrStraddles: [0, 10, 20],
        startingStacks: [200, 1000, 1000],
        rakePercentage: 0.05,
      });

      // --- PREFLOP ---
      // P1 (BTN) shoves, P2 (SB) and P3 (BB) call. Main pot is 600.
      applyAction(table, 'd dh p1 AsAc');
      applyAction(table, 'd dh p2 KsKc');
      applyAction(table, 'd dh p3 QsQc');
      applyAction(table, 'p1 cbr 200');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');

      // --- FLOP ---
      // P2 and P3 build a side pot. Side pot is 600.
      applyAction(table, 'd db 2h7d8c');
      applyAction(table, 'p2 cbr 300');
      applyAction(table, 'p3 cc');

      // --- TURN & RIVER ---
      // Checked down.
      applyAction(table, 'd db 9s');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');
      applyAction(table, 'd db Ts');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');

      // --- SHOWDOWN ---
      // P1 wins the main pot with a pair of Aces.
      // P2 wins the side pot, as their pair of Kings beats P3's pair of Queens.
      applyAction(table, 'p2 sm KsKc');
      applyAction(table, 'p3 sm QsQc');
      applyAction(table, 'p1 sm AsAc');

      // --- PER-STREET STAT VERIFICATION ---
      // P1 (Short stack) - All-in preflop for 200. Final stats are recorded on this street.
      expect(Poker.Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        investments: 200,
        winnings: 570, // Won main pot of 600, minus 30 rake.
        profits: 370, // 570 winnings - 200 investment.
        losses: 0,
        balance: 370, // Net change in stack.
        rake: 30,
        stackBefore: 200,
        stackAfter: 570, // 200 (start) - 200 (invest) + 570 (win)
      });

      // P2 (Side pot winner)
      // Preflop: Called P1's all-in of 200 (invested 190 on top of 10 SB).
      expect(Poker.Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        investments: 200,
        winnings: 0,
        profits: 0,
        losses: 0,
        balance: -200, // Balance reflects money invested on this street.
        returns: 0,
        rake: 0,
        stackBefore: 1000,
        stackAfter: 800,
      });
      // Flop: Bet 300 into the side pot.
      expect(Poker.Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        investments: 300,
        winnings: 0,
        profits: 0,
        losses: 0,
        balance: -300,
        returns: 0,
        rake: 0,
        stackBefore: 800,
        stackAfter: 500,
      });
      // Turn: Checked.
      expect(Poker.Stats.forPlayerStreet(table, 1, 'turn')).toMatchObject({
        investments: 0,
        winnings: 0,
        profits: 0,
        losses: 0,
        balance: 0,
        returns: 0,
        rake: 0,
        stackBefore: 500,
        stackAfter: 500,
      });
      // River: Final hand results are recorded on the last street of action.
      expect(Poker.Stats.forPlayerStreet(table, 1, 'river')).toMatchObject({
        investments: 0,
        winnings: 570, // Won side pot of 600, minus 30 rake.
        profits: 70, // 570 winnings - 500 total investment (200 pre, 300 flop).
        losses: 0,
        balance: 570, // Balance for this street is winnings - street_investment.
        returns: 0,
        rake: 30,
        stackBefore: 500,
        stackAfter: 1070, // 500 (start) + 570 (win)
      });

      // P3 (Loser)
      // Preflop: Called P1's all-in of 200 (invested 180 on top of 20 BB).
      expect(Poker.Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        investments: 200,
        winnings: 0,
        profits: 0,
        losses: 0,
        balance: -200,
        returns: 0,
        rake: 0,
        stackBefore: 1000,
        stackAfter: 800,
      });
      // Flop: Called P2's bet of 300.
      expect(Poker.Stats.forPlayerStreet(table, 2, 'flop')).toMatchObject({
        investments: 300,
        winnings: 0,
        profits: 0,
        losses: 0,
        balance: -300,
        returns: 0,
        rake: 0,
        stackBefore: 800,
        stackAfter: 500,
      });
      // Turn: Checked.
      expect(Poker.Stats.forPlayerStreet(table, 2, 'turn')).toMatchObject({
        investments: 0,
        winnings: 0,
        profits: 0,
        losses: 0,
        balance: 0,
        returns: 0,
        rake: 0,
        stackBefore: 500,
        stackAfter: 500,
      });
      // River: Final stats recorded. Lost both main and side pots.
      expect(Poker.Stats.forPlayerStreet(table, 2, 'river')).toMatchObject({
        investments: 0,
        winnings: 0,
        profits: 0,
        losses: 500, // Lost total investment of 200 preflop + 300 flop.
        balance: 0,
        returns: 0,
        rake: 0,
        stackBefore: 500,
        stackAfter: 500,
      });

      // --- AGGREGATED METRICS VERIFICATION ---
      const aggregated = getPokerMetrics(table.stats, ['player'] as const);

      // P1 Aggregated
      expect(aggregated['P1_BTN_Short']).toMatchObject({
        investments: 200,
        winnings: 570,
        profits: 370,
        losses: 0,
        balance: 370,
        rake: 30,
      });

      // P2 Aggregated
      expect(aggregated['P2_SB']).toMatchObject({
        investments: 500, // 200 pre + 300 flop
        winnings: 570,
        profits: 70,
        losses: 0,
        balance: 70,
        rake: 30,
      });

      // P3 Aggregated
      expect(aggregated['P3_BB']).toMatchObject({
        investments: 500, // 200 pre + 300 flop
        winnings: 0,
        profits: 0,
        losses: 500,
        balance: -500,
        rake: 0,
      });

      // Total Aggregated
      expect(aggregated.total).toMatchObject({
        investments: 1200, // 200 + 500 + 500
        winnings: 1140, // 570 + 570
        profits: 440, // 370 + 70
        losses: 500,
        balance: -60, // 440 - 500
        rake: 60,
      });
    });

    it('should correctly track winnings with side pots from a short-stack all-in', () => {
      const table = Poker.Game({
        ...sampleGame,
        players: ['BTN', 'SB_Short', 'BB'],
        blindsOrStraddles: [0, 10, 20],
        startingStacks: [1000, 200, 1000],
      });

      // --- SETUP ---
      applyAction(table, 'd dh p1 2h2c'); // BTN
      applyAction(table, 'd dh p2 3h3c'); // SB (short)
      applyAction(table, 'd dh p3 4h4c'); // BB

      // --- PREFLOP ---
      // BTN opens, SB shoves, BB calls, BTN calls. Main pot is 600.
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cbr 200');
      applyAction(table, 'p3 cc');
      applyAction(table, 'p1 cc');

      // --- FLOP ---
      // BTN and BB build a side pot of 600.
      applyAction(table, 'd db 3d7s9c');
      applyAction(table, 'p3 cc');
      applyAction(table, 'p1 cbr 300');
      applyAction(table, 'p3 cc');

      // --- TURN & RIVER ---
      // Checked down.
      applyAction(table, 'd db 5h');
      applyAction(table, 'p3 cc');
      applyAction(table, 'p1 cc');
      applyAction(table, 'd db Ah');
      applyAction(table, 'p3 cc');
      applyAction(table, 'p1 cc');

      // --- SHOWDOWN ---
      // On a board of 3d7s9c5hAh:
      // P2 (SB) wins the main pot with a set of threes.
      // P3 (BB) wins the side pot with a pair of fours, beating P1's pair of twos.
      applyAction(table, 'p3 sm 4h4c');
      applyAction(table, 'p1 sm 2h2c');
      applyAction(table, 'p2 sm 3h3c');

      // --- DETAILED PER-STREET VERIFICATION ---

      // P1 (BTN) - Loser
      expect(Poker.Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        investments: 200,
        balance: -200,
        stackBefore: 1000,
        stackAfter: 800,
      });
      expect(Poker.Stats.forPlayerStreet(table, 0, 'flop')).toMatchObject({
        investments: 300,
        balance: -300,
        stackBefore: 800,
        stackAfter: 500,
      });
      expect(Poker.Stats.forPlayerStreet(table, 0, 'turn')).toMatchObject({
        investments: 0,
        balance: 0,
        stackBefore: 500,
        stackAfter: 500,
      });
      expect(Poker.Stats.forPlayerStreet(table, 0, 'river')).toMatchObject({
        investments: 0,
        balance: 0,
        stackBefore: 500,
        stackAfter: 500,
        winnings: 0,
        losses: 500,
        profits: 0,
      });

      // P2 (SB_Short) - Main Pot Winner (All-in Preflop)
      expect(Poker.Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        investments: 200,
        stackBefore: 200,
        stackAfter: 600,
        winnings: 600,
        profits: 400,
        losses: 0,
        balance: 400,
      });
      // Check that post-flop streets are empty for the all-in player
      expect(Poker.Stats.forPlayerStreet(table, 1, 'flop')).toBeUndefined();
      expect(Poker.Stats.forPlayerStreet(table, 1, 'turn')).toBeUndefined();
      expect(Poker.Stats.forPlayerStreet(table, 1, 'river')).toBeUndefined();

      // P3 (BB) - Side Pot Winner
      expect(Poker.Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        investments: 200,
        balance: -200,
        stackBefore: 1000,
        stackAfter: 800,
      });
      expect(Poker.Stats.forPlayerStreet(table, 2, 'flop')).toMatchObject({
        investments: 300,
        balance: -300,
        stackBefore: 800,
        stackAfter: 500,
      });
      expect(Poker.Stats.forPlayerStreet(table, 2, 'turn')).toMatchObject({
        investments: 0,
        balance: 0,
        stackBefore: 500,
        stackAfter: 500,
      });
      expect(Poker.Stats.forPlayerStreet(table, 2, 'river')).toMatchObject({
        investments: 0,
        stackBefore: 500,
        stackAfter: 1100,
        winnings: 600,
        profits: 100,
        losses: 0,
        balance: 600,
      });

      // --- AGGREGATED METRICS VERIFICATION ---
      const aggregated = getPokerMetrics(table.stats, ['player'] as const);
      expect(aggregated['BTN']).toMatchObject({
        investments: 500,
        winnings: 0,
        profits: 0,
        losses: 500,
        balance: -500,
      });
      expect(aggregated['SB_Short']).toMatchObject({
        investments: 200,
        winnings: 600,
        profits: 400,
        losses: 0,
        balance: 400,
      });
      expect(aggregated['BB']).toMatchObject({
        investments: 500,
        winnings: 600,
        profits: 100,
        losses: 0,
        balance: 100,
      });
      expect(aggregated.total).toMatchObject({
        investments: 1200,
        winnings: 1200,
        profits: 500,
        losses: 500,
        balance: 0,
      });
    });

    it('should correctly handle a split pot in a multiway all-in', () => {
      const table = Poker.Game({
        ...sampleGame,
        players: ['Alice', 'Bob', 'Carol'],
        blindsOrStraddles: [0, 10, 20],
        startingStacks: [1000, 1000, 1000],
      });

      // Deal hole cards
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Preflop - P1 raises, P2 3-bets, P3 folds, P1 4-bets all-in, P2 calls.
      applyAction(table, 'p1 cbr 100');
      applyAction(table, 'p2 cbr 350');
      applyAction(table, 'p3 f');
      applyAction(table, 'p1 cbr 1000');
      applyAction(table, 'p2 cc');

      // Board and showdown
      applyAction(table, 'd db 4c5c6d');
      applyAction(table, 'd db 7h');
      applyAction(table, 'd db 8h');
      // --- SHOWDOWN ---
      // On a board of 4c5c6d7h8h, both players have a 4-8 straight and play the board.
      // This results in a split pot.
      applyAction(table, 'p2 sm QhJh');
      applyAction(table, 'p1 sm AhKh');

      // --- DETAILED PER-STREET VERIFICATION ---
      // All significant action occurred preflop. Final results are recorded there.

      // P1 (Split Pot)
      expect(Poker.Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        investments: 1000,
        winnings: 1010, // Pot of 2020 is split
        profits: 10, // 1010 winnings - 1000 investment
        losses: 0,
        balance: 10, // 1010 winnings - 1000 investment
        returns: 0,
        rake: 0,
        stackBefore: 1000,
        stackAfter: 1010,
      });

      // P2 (Split Pot)
      expect(Poker.Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        investments: 1000,
        winnings: 1010, // Pot of 2020 is split
        profits: 10, // 1010 winnings - 1000 investment
        losses: 0,
        balance: 10, // 1010 winnings - 1000 investment
        returns: 0,
        rake: 0,
        stackBefore: 1000,
        stackAfter: 1010,
      });

      // P3 (Folded Preflop)
      expect(Poker.Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        investments: 20, // Just the BB
        winnings: 0,
        profits: 0,
        losses: 20,
        balance: -20,
        returns: 0,
        rake: 0,
        stackBefore: 1000,
        stackAfter: 980,
      });

      // Post-flop streets should have no financial data for any player
      for (const street of ['flop', 'turn', 'river'] as const) {
        for (let i = 0; i < 3; i++) {
          expect(Poker.Stats.forPlayerStreet(table, i, street)).toBeUndefined();
        }
      }

      // --- AGGREGATED METRICS VERIFICATION ---
      const aggregated = getPokerMetrics(table.stats, ['player'] as const);
      expect(aggregated['Alice']).toMatchObject({
        investments: 1000,
        winnings: 1010,
        profits: 10,
        balance: 10,
      });
      expect(aggregated['Bob']).toMatchObject({
        investments: 1000,
        winnings: 1010,
        profits: 10,
        balance: 10,
      });
      expect(aggregated['Carol']).toMatchObject({
        investments: 20,
        losses: 20,
        balance: -20,
      });
      expect(aggregated.total).toMatchObject({
        investments: 2020,
        winnings: 2020,
        profits: 20,
        losses: 20,
        balance: 0,
      });
    });

    it('should track finances correctly when one player decisively wins a multiway all-in', () => {
      const table = Poker.Game({
        ...sampleGame,
        players: ['Alice', 'Bob', 'Carol'],
        blindsOrStraddles: [0, 10, 20],
        startingStacks: [1000, 1000, 1000],
      });

      // Deal hole cards
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QsJs'); // P2 has a different hand now
      applyAction(table, 'd dh p3 2c3c');

      // Preflop - P1 raises, P2 3-bets, P3 folds, P1 4-bets all-in, P2 calls.
      applyAction(table, 'p1 cbr 100');
      applyAction(table, 'p2 cbr 350');
      applyAction(table, 'p3 f');
      applyAction(table, 'p1 cbr 1000');
      applyAction(table, 'p2 cc');

      // Board and showdown
      applyAction(table, 'd db Ac2d7h'); // Board is changed so P1 wins
      applyAction(table, 'd db 8s');
      applyAction(table, 'd db 9h');

      // --- SHOWDOWN ---
      // On a board of Ac2d7h8s9h, P1 wins with a pair of Aces. P2 has Queen-high.
      applyAction(table, 'p2 sm QsJs');
      applyAction(table, 'p1 sm AhKh');

      // --- DETAILED PER-STREET VERIFICATION ---
      // P1 (Winner)
      expect(Poker.Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        investments: 1000,
        winnings: 2020,
        profits: 1020,
        losses: 0,
        balance: 1020, // 2020 winnings - 1000 investment
        returns: 0,
        rake: 0,
        stackBefore: 1000,
        stackAfter: 2020,
      });

      // P2 (Loser)
      expect(Poker.Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        investments: 1000,
        winnings: 0,
        profits: 0,
        losses: 1000,
        balance: -1000,
        returns: 0,
        rake: 0,
        stackBefore: 1000,
        stackAfter: 0,
      });

      // P3 (Folded Preflop)
      expect(Poker.Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        investments: 20,
        losses: 20,
      });

      // --- AGGREGATED METRICS VERIFICATION ---
      const aggregated = getPokerMetrics(table.stats, ['player'] as const);
      expect(aggregated['Alice']).toMatchObject({
        investments: 1000,
        winnings: 2020,
        profits: 1020,
        balance: 1020,
      });
      expect(aggregated['Bob']).toMatchObject({
        investments: 1000,
        winnings: 0,
        profits: 0,
        losses: 1000,
        balance: -1000,
      });
      expect(aggregated['Carol']).toMatchObject({
        investments: 20,
        losses: 20,
        balance: -20,
      });
      expect(aggregated.total).toMatchObject({
        investments: 2020,
        winnings: 2020,
        profits: 1020,
        losses: 1020,
        balance: 0,
      });
    });
  });

  describe('Standard Pot Scenarios', () => {
    it('should correctly handle an uncalled bet being returned to a player', () => {
      // SCENARIO: In a heads-up pot, P1 bets the river, and P2 folds.
      // OUTCOME: P1 wins the pot, and their uncalled river bet is returned to their stack.
      // VERIFY: The uncalled bet is correctly tracked in `returns`, and not counted towards net investment for profit calculation.
      const table = Poker.Game({
        ...sampleGame,
        players: ['P1_BTN', 'P2_BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });

      // --- PREFLOP --- P1 raises to 60, P2 calls. Pot: 120
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QsJs');
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');

      // --- FLOP --- P1 bets 100, P2 calls. Pot: 320
      applyAction(table, 'd db 2h7d8c');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 100'); // Bet is 100 for this street
      applyAction(table, 'p2 cc');

      // --- TURN --- P1 bets 200, P2 calls. Pot: 720
      applyAction(table, 'd db 9s');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 200'); // Bet is 200 for this street
      applyAction(table, 'p2 cc');

      // --- RIVER --- P1 bets 500, P2 folds.
      applyAction(table, 'd db Ts');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 500'); // Bet is 500 for this street
      // --- FINAL ACTION ---
      // P2 folds, so P1 wins the pot. P1's uncalled 500 river bet is returned.
      applyAction(table, 'p2 f'); // P2 folds

      // --- DETAILED PER-STREET VERIFICATION ---

      // P1 (Winner)
      expect(Poker.Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        investments: 60,
        balance: -60,
        returns: 0,
        winnings: 0,
        profits: 0,
        losses: 0,
        stackBefore: 1000,
        stackAfter: 940,
      });
      expect(Poker.Stats.forPlayerStreet(table, 0, 'flop')).toMatchObject({
        investments: 100,
        balance: -100,
        returns: 0,
        winnings: 0,
        profits: 0,
        losses: 0,
        stackBefore: 940,
        stackAfter: 840,
      });
      expect(Poker.Stats.forPlayerStreet(table, 0, 'turn')).toMatchObject({
        investments: 200,
        balance: -200,
        returns: 0,
        winnings: 0,
        profits: 0,
        losses: 0,
        stackBefore: 840,
        stackAfter: 640,
      });
      expect(Poker.Stats.forPlayerStreet(table, 0, 'river')).toMatchObject({
        investments: 500,
        returns: 500, // The uncalled 500 bet is returned.
        winnings: 720, // Pot was 360 from each player = 720.
        profits: 360, // 720 winnings - 360 matched investment.
        balance: 720, // On this street: 720 winnings - (500 inv - 500 ret)
        losses: 0,
        stackBefore: 640,
        stackAfter: 1360, // 640 (current) - 500 (bet) + 500 (return) + 720 (win)
      });

      // P2 (Loser)
      expect(Poker.Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        investments: 60,
        balance: -60,
        returns: 0,
        winnings: 0,
        profits: 0,
        losses: 0,
        stackBefore: 1000,
        stackAfter: 940,
      });
      expect(Poker.Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        investments: 100,
        balance: -100,
        returns: 0,
        winnings: 0,
        profits: 0,
        losses: 0,
        stackBefore: 940,
        stackAfter: 840,
      });
      expect(Poker.Stats.forPlayerStreet(table, 1, 'turn')).toMatchObject({
        investments: 200,
        balance: -200,
        returns: 0,
        winnings: 0,
        profits: 0,
        losses: 0,
        stackBefore: 840,
        stackAfter: 640,
      });
      expect(Poker.Stats.forPlayerStreet(table, 1, 'river')).toMatchObject({
        investments: 0,
        returns: 0,
        winnings: 0,
        profits: 0,
        losses: 360, // Lost total matched investment (60+100+200).
        balance: 0, // 0 winnings - 0 investments on this street
        stackBefore: 640,
        stackAfter: 640,
      });

      // --- AGGREGATED STATS ---
      const aggregated = getPokerMetrics(table.stats, ['player'] as const);
      expect(aggregated['P1_BTN']).toMatchObject({
        investments: 860, // 60 + 100 + 200 + 500
        returns: 500,
        winnings: 720,
        profits: 360, // 720 winnings - (860 gross inv - 500 returns)
        balance: 360,
        losses: 0,
      });
      expect(aggregated['P2_BB']).toMatchObject({
        investments: 360, // 60 + 100 + 200
        returns: 0,
        winnings: 0,
        profits: 0,
        losses: 360,
        balance: -360,
      });
      expect(aggregated.total).toMatchObject({
        investments: 1220,
        returns: 500,
        winnings: 720,
        profits: 360,
        losses: 360,
        balance: 0,
      });
    });

    it('should correctly calculate profit for a player who gets a walk in the big blind', () => {
      // SCENARIO: All players fold to the big blind pre-flop.
      // OUTCOME: The big blind wins the small blind and any antes.
      // VERIFY: The BB's `profits` equal the small blind amount plus antes. Their own blind is returned and not counted as a loss.
      // FIXME: Currently  the walk is not implemented correctly, as its still subject to the side pot calculation. Values are correct now, but they wont be if antes are involved.
      const table = Poker.Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 10, 20],
        startingStacks: [1000, 1000, 1000],
      });

      // --- DEAL CARDS ---
      applyAction(table, 'd dh p1 2h7c');
      applyAction(table, 'd dh p2 8s3d');
      applyAction(table, 'd dh p3 AcKc');

      // --- ACTION ---
      applyAction(table, 'p1 f'); // BTN folds
      applyAction(table, 'p2 f'); // SB folds

      // --- VERIFICATION ---
      // The hand ends immediately. BB wins the SB's 10 chips.
      const bbStats = Poker.Stats.forPlayerStreet(table, 2, 'preflop');
      expect(bbStats).toMatchObject({
        investments: 20,
        winnings: 20, // Own 10 back + SB's 10, extra own 10 is returned
        returns: 10,
        profits: 10,
        losses: 0,
        balance: 10, // 30 winnings - 20 investment
        stackBefore: 1000,
        stackAfter: 1010,
      });

      const sbStats = Poker.Stats.forPlayerStreet(table, 1, 'preflop');
      expect(sbStats).toMatchObject({
        investments: 10,
        returns: 0,
        losses: 10,
        winnings: 0,
        profits: 0,
        balance: -10,
      });

      // --- AGGREGATED METRICS VERIFICATION ---
      const aggregated = getPokerMetrics(table.stats, ['player'] as const);
      expect(aggregated.total).toMatchObject({
        investments: 30,
        returns: 10,
        winnings: 20,
        profits: 10,
        losses: 10,
        balance: 0,
      });
    });

    it('should accurately account for rake and respect the rake cap', () => {
      // SCENARIO: Two players go to a large showdown pot.
      // VERIFY: Rake is calculated correctly based on the percentage, and the final rake taken does not exceed the cap.
      const table = Poker.Game({
        ...sampleGame,
        players: ['P1', 'P2'],
        blindsOrStraddles: [10, 20],
        startingStacks: [5000, 5000],
        rakePercentage: 0.05, // 5% rake
        rakeCap: 100, // Capped at 100
      });

      // --- SETUP ---
      applyAction(table, 'd dh p1 AsAc');
      applyAction(table, 'd dh p2 KsKc');

      // --- ACTION ---
      // Players go all-in preflop, creating a pot of 10000.
      // 5% of 10000 is 500, which is > the 100 cap.
      applyAction(table, 'p1 cbr 5000');
      applyAction(table, 'p2 cc');

      // Board runout
      applyAction(table, 'd db 2h7d8c');
      applyAction(table, 'd db 9s');
      applyAction(table, 'd db Ts');

      // --- SHOWDOWN ---
      applyAction(table, 'p2 sm KsKc');
      applyAction(table, 'p1 sm AsAc');

      // --- VERIFICATION ---
      const p1Stats = Poker.Stats.forPlayerStreet(table, 0, 'preflop');
      expect(p1Stats).toMatchObject({
        winnings: 9900, // 10000 pot - 100 capped rake
        profits: 4900, // 9900 winnings - 5000 investment
        rake: 100, // Rake should be capped at 100
      });

      const p2Stats = Poker.Stats.forPlayerStreet(table, 1, 'preflop');
      expect(p2Stats).toMatchObject({
        losses: 5000,
        rake: 0,
      });

      const aggregated = getPokerMetrics(table.stats, ['player'] as const);
      expect(aggregated.total).toMatchObject({
        investments: 10000,
        winnings: 9900,
        profits: 4900,
        losses: 5000,
        balance: -100, // Total balance should be the negative of the rake taken
        rake: 100,
      });
    });

    it('should track finances when a player is all-in for less than the minimum bet', () => {
      // SCENARIO: P3 is all-in for 40, which is less than the 50 BB.
      // INPUT: 3 players, BB=50, SB=25, P3 has only 40 chips (short stack)
      // EXPECTED: Main pot 120 (40*3), P1 and P2 create side pot. P3's losses capped at 40.
      const table = Poker.Game({
        ...sampleGame,
        players: ['P1_BTN', 'P2_SB', 'P3_BB_Short'],
        blindsOrStraddles: [0, 25, 50],
        startingStacks: [1000, 1000, 40], // P3 is short
        minBet: 50, // BB = 50, SB = 25
      });

      // --- SETUP ---
      applyAction(table, 'd dh p1 AsAc');
      applyAction(table, 'd dh p2 KsKc');
      applyAction(table, 'd dh p3 QsQc');

      // --- PREFLOP ---
      // P1 raises to 100, P2 calls. P3 is already all-in.
      applyAction(table, 'p1 cbr 100');
      applyAction(table, 'p2 cc');

      // --- FLOP, TURN, RIVER ---
      // P1 and P2 play for a side pot.
      applyAction(table, 'd db 2h7d8c');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 200');
      applyAction(table, 'p2 cc');
      applyAction(table, 'd db 9s');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cc');
      applyAction(table, 'd db Ts');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cc');

      // --- SHOWDOWN ---
      // P1 wins both pots.
      applyAction(table, 'p2 sm KsKc');
      applyAction(table, 'p1 sm AsAc');
      applyAction(table, 'p3 sm QsQc');

      // --- VERIFICATION ---
      // P3 (Short Stack)
      expect(Poker.Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        investments: 40,
        losses: 40,
        balance: -40,
        winnings: 0,
        profits: 0,
        stackBefore: 40,
        stackAfter: 0,
      });

      // P1 (Winner)
      const p1RiverStats = Poker.Stats.forPlayerStreet(table, 0, 'river');
      expect(p1RiverStats?.winnings).toBe(640); // Main pot 120 + Side pot 520
      expect(p1RiverStats?.profits).toBe(340); // 640 winnings - 300 total investment

      // P2 (Loser)
      const p2RiverStats = Poker.Stats.forPlayerStreet(table, 1, 'river');
      expect(p2RiverStats?.losses).toBe(300);

      // --- AGGREGATED ---
      const aggregated = getPokerMetrics(table.stats, ['player'] as const);
      expect(aggregated.total.balance).toBe(0);
      expect(aggregated['P1_BTN'].balance).toBe(340);
      expect(aggregated['P2_SB'].balance).toBe(-300);
      expect(aggregated['P3_BB_Short'].balance).toBe(-40);
    });
  });
});
