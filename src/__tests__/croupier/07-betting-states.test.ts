/**
 * @instructions
 * Croupier test suite principles:
 * 1. Verify exact action sequence - each player action must be checked in order using exact index in result.actions
 * 2. Verify state transitions after each significant phase:
 *    - After initial deal: stacks after blinds, street
 *    - After betting round: stacks, roundBet, totalBet, currentBet, pot
 *    - After showdown: board length, shown cards
 * 3. Include detailed pot calculations in comments, showing contributions from each player
 * 4. Use position labels in comments (BTN, SB, BB) to clarify action order
 * 5. Group verifications by game phase (deal, betting, board, final)
 * 6. Avoid array slicing for action verification to ensure strict order
 * 7. Focus on money movement and betting state, avoid implementation details
 * 8. Always verify bettingComplete after each round closes
 * 9. For all-in situations, verify isAllIn status and automatic board dealing
 */

import { Game } from '../../Game';
import { croupier } from '../../game/croupier';
import { Hand } from '../../Hand';

const createPlayers = (histories: string[][]) => {
  return histories.map((history, i) => {
    let index = 0;
    return () => Promise.resolve(history[index++] || `p${i + 1} cc`);
  });
};

/**
 * This test verifies complex betting patterns across multiple streets.
 * It's interesting because it:
 * 1. Tests proper betting order and position changes across streets
 * 2. Verifies correct pot calculation with multiple betting rounds
 * 3. Ensures proper minimum raise rules are followed
 * 4. Validates that action closes correctly on each street
 */
describe('Croupier - Betting States', () => {
  it('should handle multi-street betting with raises and calls', async () => {
    const hand: Hand = {
      variant: 'NT',
      players: ['p1', 'p2', 'p3'],
      startingStacks: [1000, 1000, 1000],
      blindsOrStraddles: [0, 10, 20],
      antes: [],
      actions: [],
      minBet: 20,
      seed: 123456,
    };

    const players = createPlayers([
      ['p1 cbr 60', 'p1 cc'], // BTN raises to 60 preflop, calls flop bet
      ['p2 cc', 'p2 cbr 100'], // SB calls preflop, leads flop for 100
      ['p3 cc', 'p3 cc'], // BB calls preflop, calls flop bet
    ]);
    const result = await croupier(hand, players);

    let game: Game;

    // Initial deal
    expect(result.actions[0]).toMatch(/^d dh p1/);
    expect(result.actions[1]).toMatch(/^d dh p2/);
    expect(result.actions[2]).toMatch(/^d dh p3/);

    game = Game(hand, result.actions.slice(0, 3));
    expect(game.street).toBe('preflop');
    expect(game.players.map(p => p.stack)).toEqual([1000, 990, 980]);
    expect(game.players.map(p => p.roundBet)).toEqual([0, 10, 20]);
    expect(game.bet).toBe(20);

    // Preflop betting
    expect(result.actions[3]).toBe('p1 cbr 60'); // BTN raises to 60 (+60)

    game = Game(hand, result.actions.slice(0, 4));
    expect(game.players.map(p => p.roundBet)).toEqual([60, 10, 20]);
    expect(game.bet).toBe(60);

    expect(result.actions[4]).toBe('p2 cc'); // SB calls (+50)
    expect(result.actions[5]).toBe('p3 cc'); // BB calls (+40)

    game = Game(hand, result.actions.slice(0, 6));
    expect(game.players.map(p => p.stack)).toEqual([940, 940, 940]);
    expect(game.players.map(p => p.roundBet)).toEqual([60, 60, 60]);
    expect(game.players.map(p => p.totalBet)).toEqual([60, 60, 60]);
    expect(game.isBettingComplete).toBe(true);
    expect(game.bet).toBe(60);
    expect(game.pot).toBe(180); // 60 (BTN) + 60 (SB) + 60 (BB)

    // Flop
    expect(result.actions[6]).toMatch(/^d db/);
    expect(result.actions[7]).toBe('p2 cbr 100'); // SB leads for 100

    game = Game(hand, result.actions.slice(0, 8));
    expect(game.players.map(p => p.roundBet)).toEqual([0, 100, 0]);
    expect(game.bet).toBe(100);

    expect(result.actions[8]).toBe('p3 cc'); // BB calls
    expect(result.actions[9]).toBe('p1 cc'); // BTN calls

    // Check state after flop betting completes
    game = Game(hand, result.actions.slice(0, 10));
    expect(game.players.map(p => p.stack)).toEqual([840, 840, 840]); // Each -160 total
    expect(game.players.map(p => p.roundBet)).toEqual([100, 100, 100]); // Flop bets
    expect(game.players.map(p => p.totalBet)).toEqual([160, 160, 160]); // Preflop + Flop
    expect(game.players.map(p => p.hasFolded)).toEqual([false, false, false]);
    expect(game.bet).toBe(100);
    expect(game.pot).toBe(480); // Preflop (180) + Flop (300)
    expect(game.isBettingComplete).toBe(true);
    expect(game.board).toHaveLength(3); // Only flop dealt

    // Final state
    game = Game(hand, result.actions);
    expect(game.players.map(p => p.stack)).toEqual([840, 1320, 840]); // No more betting after flop
    expect(game.players.map(p => p.roundBet)).toEqual([0, 0, 0]); // Reset after river
    expect(game.players.map(p => p.totalBet)).toEqual([160, 160, 160]); // Unchanged from flop
    expect(game.pot).toBe(480); // Unchanged from flop
    expect(game.board).toHaveLength(5); // Full board dealt
  });
});
