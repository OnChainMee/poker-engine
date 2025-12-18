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
 * This test simulates a scenario where the small blind goes all-in for a small amount.
 * It tests handling of very small all-ins, verifies correct multi-way pot calculation with an all-in player,
 * ensures proper action order after a small blind all-in, and validates that remaining players can still act normally.
 */
describe('Croupier - Small Blind All-in', () => {
  it('should handle preflop SB all-in with multi-way action', async () => {
    const hand: Hand = {
      variant: 'NT',
      players: ['p1', 'p2', 'p3'],
      startingStacks: [1000, 50, 1000],
      blindsOrStraddles: [0, 10, 20],
      antes: [],
      actions: [],
      minBet: 20,
      seed: 123456,
    };

    const players = createPlayers([
      ['p1 cc', 'p1 cc'], // BTN calls BB, then later calls to match SB all-in
      ['p2 cbr 50'], // SB goes all-in (adds +40 to its blind of 10)
      ['p3 cc'], // BB calls SB all-in (adds +30 to its blind of 20)
    ]);
    const result = await croupier(hand, players);

    let game: Game;

    // --- Initial deal ---
    expect(result.actions[0]).toMatch(/^d dh p1/);
    expect(result.actions[1]).toMatch(/^d dh p2/);
    expect(result.actions[2]).toMatch(/^d dh p3/);

    game = Game(hand, result.actions.slice(0, 3));
    expect(game.street).toBe('preflop');
    expect(game.players.map(p => p.stack)).toEqual([1000, 40, 980]); // p2: 50-10, p3: 1000-20
    expect(game.players.map(p => p.roundBet)).toEqual([0, 10, 20]);
    expect(game.bet).toBe(20);

    // --- Preflop betting ---
    // p1 calls the BB
    expect(result.actions[3]).toBe('p1 cc');
    game = Game(hand, result.actions.slice(0, 4));
    expect(game.players.map(p => p.roundBet)).toEqual([20, 10, 20]);
    expect(game.bet).toBe(20);
    expect(game.pot).toBe(50); // 20 + 10 + 20

    // p2 (SB) goes all in (adds 40 more to reach 50)
    expect(result.actions[4]).toBe('p2 cbr 50');
    game = Game(hand, result.actions.slice(0, 5));
    expect(game.players.map(p => p.roundBet)).toEqual([20, 50, 20]);
    expect(game.bet).toBe(50);
    expect(game.pot).toBe(90); // 20 + 50 + 20
    expect(game.players.map(p => p.isAllIn)).toEqual([false, true, false]);

    // p3 (BB) calls the increased bet (+30)
    expect(result.actions[5]).toBe('p3 cc');
    // p1 (BTN) calls the increased bet (+30)
    expect(result.actions[6]).toBe('p1 cc');

    // Final preflop state
    game = Game(hand, result.actions.slice(0, 7));
    expect(game.players.map(p => p.stack)).toEqual([950, 0, 950]); // p1 and p3 each put in 50; p2 is all in
    expect(game.players.map(p => p.roundBet)).toEqual([50, 50, 50]);
    expect(game.players.map(p => p.totalBet)).toEqual([50, 50, 50]);
    expect(game.players.map(p => p.isAllIn)).toEqual([false, true, false]);
    expect(game.bet).toBe(50);
    expect(game.pot).toBe(150); // 50 + 50 + 50
    expect(game.isBettingComplete).toBe(true);

    // --- Board dealing ---
    // Since only one player is all in, the remaining players (p1 and p3) can still act.
    // Therefore, only the flop should be auto-dealt.
    expect(result.actions[7]).toMatch(/^d db/); // Flop dealt automatically

    // Final state after flop:
    game = Game(hand, result.actions);
    // Flop should consist of 3 cards
    expect(game.board).toHaveLength(5);
    expect(game.players.map(p => p.hasShownCards)).toEqual([true, true, true]);
    expect(game.isBettingComplete).toBe(true);
  });
});
