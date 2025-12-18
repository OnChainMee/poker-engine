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
 * This test verifies showdown mechanics in a limped pot where all players see all streets.
 * It's interesting because it:
 * 1. Tests showdown procedure when all players reach the river
 * 2. Verifies correct hand comparison and winner determination
 * 3. Ensures proper card exposure rules at showdown
 * 4. Validates pot distribution in a multi-way pot
 */
describe('Croupier - Showdown', () => {
  it('should handle showdown with all streets checked down', async () => {
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

    const players = createPlayers([['p1 cc'], ['p2 cc'], ['p3 cc']]);
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
    expect(result.actions[3]).toBe('p1 cc'); // BTN calls 20
    expect(result.actions[4]).toBe('p2 cc'); // SB completes to 20
    expect(result.actions[5]).toBe('p3 cc'); // BB checks

    game = Game(hand, result.actions.slice(0, 6));
    expect(game.players.map(p => p.stack)).toEqual([980, 980, 980]);
    expect(game.players.map(p => p.roundBet)).toEqual([20, 20, 20]);
    expect(game.players.map(p => p.totalBet)).toEqual([20, 20, 20]);
    expect(game.isBettingComplete).toBe(true);
    expect(game.bet).toBe(20);
    expect(game.pot).toBe(60); // 20 (BTN) + 20 (SB) + 20 (BB)

    // Flop
    expect(result.actions[6]).toMatch(/^d db/);
    expect(result.actions[7]).toBe('p2 cc'); // SB checks
    expect(result.actions[8]).toBe('p3 cc'); // BB checks
    expect(result.actions[9]).toBe('p1 cc'); // BTN checks

    game = Game(hand, result.actions.slice(0, 10));
    expect(game.players.map(p => p.roundBet)).toEqual([0, 0, 0]);
    expect(game.players.map(p => p.totalBet)).toEqual([20, 20, 20]);
    expect(game.isBettingComplete).toBe(true);
    expect(game.bet).toBe(0);

    // Turn
    expect(result.actions[10]).toMatch(/^d db/);
    expect(result.actions[11]).toBe('p2 cc'); // SB checks
    expect(result.actions[12]).toBe('p3 cc'); // BB checks
    expect(result.actions[13]).toBe('p1 cc'); // BTN checks

    game = Game(hand, result.actions.slice(0, 14));
    expect(game.players.map(p => p.roundBet)).toEqual([0, 0, 0]);
    expect(game.players.map(p => p.totalBet)).toEqual([20, 20, 20]);
    expect(game.isBettingComplete).toBe(true);
    expect(game.bet).toBe(0);

    // River
    expect(result.actions[14]).toMatch(/^d db/);
    expect(result.actions[15]).toBe('p2 cc'); // SB checks
    expect(result.actions[16]).toBe('p3 cc'); // BB checks
    expect(result.actions[17]).toBe('p1 cc'); // BTN checks

    game = Game(hand, result.actions.slice(0, 18));
    expect(game.players.map(p => p.roundBet)).toEqual([0, 0, 0]);
    expect(game.players.map(p => p.totalBet)).toEqual([20, 20, 20]);
    expect(game.isBettingComplete).toBe(true);
    expect(game.bet).toBe(0);

    // Showdown - all players show in checked pot
    expect(result.actions[18]).toMatch(/^p2 sm/); // SB shows
    expect(result.actions[19]).toMatch(/^p3 sm/); // BB shows
    expect(result.actions[20]).toMatch(/^p1 sm/); // BTN shows

    // Final state
    game = Game(hand, result.actions);
    expect(game.board).toHaveLength(5); // Full board dealt
    expect(game.players.map(p => p.hasShownCards)).toEqual([true, true, true]); // All show in checked pot
    expect(game.players.map(p => p.hasFolded)).toEqual([false, false, false]);
    expect(game.players.map(p => p.stack)).toEqual([980, 1040, 980]); // No changes after preflop
    expect(game.pot).toBe(60); // No additional betting after preflop
    expect(game.isBettingComplete).toBe(true);
  });
});
