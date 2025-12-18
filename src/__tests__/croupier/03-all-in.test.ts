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
 * This test simulates a preflop all-in confrontation between two players.
 * It's interesting because it:
 * 1. Tests proper handling of all-in mechanics
 * 2. Verifies automatic dealing of all streets without betting
 * 3. Ensures correct showdown procedure when players are all-in
 * 4. Validates that folded players don't show cards
 * 5. Tests pot calculation with large bets
 */
describe('Croupier - All-in', () => {
  it('should handle preflop all-in with showdown correctly', async () => {
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

    const players = createPlayers([['p1 cbr 1000'], ['p2 cc'], ['p3 f']]);
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

    // Betting round - verify exact action sequence
    expect(result.actions[3]).toBe('p1 cbr 1000'); // BTN all-in
    expect(result.actions[4]).toBe('p2 cc'); // SB calls
    expect(result.actions[5]).toBe('p3 f'); // BB folds

    game = Game(hand, result.actions.slice(0, 6));
    expect(game.players.map(p => p.stack)).toEqual([0, 0, 980]);
    expect(game.players.map(p => p.roundBet)).toEqual([0, 0, 0]);
    expect(game.players.map(p => p.totalBet)).toEqual([1000, 1000, 20]);
    expect(game.players.map(p => p.isAllIn)).toEqual([true, true, false]);
    expect(game.players.map(p => p.hasFolded)).toEqual([false, false, true]);
    expect(game.bet).toBe(0);
    expect(game.pot).toBe(2020); // 1000 (BTN) + 1000 (SB) + 20 (BB folded)
    expect(game.isBettingComplete).toBe(true);

    // Board dealing - automatic due to all-in
    expect(result.actions[6]).toMatch(/^d db/); // Flop
    expect(result.actions[7]).toMatch(/^d db/); // Turn
    expect(result.actions[8]).toMatch(/^d db/); // River

    // Final state
    game = Game(hand, result.actions);
    expect(game.board).toHaveLength(5); // Full board dealt
    expect(game.players.map(p => p.hasShownCards)).toEqual([true, true, null]); // Only all-in players show
    expect(game.isBettingComplete).toBe(true);
  });
});
