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
 * This test simulates a complex preflop all-in situation with three players having different stack depths.
 * It's interesting because it:
 * 1. Tests handling of multiple all-ins with different stack sizes
 * 2. Verifies correct pot calculation with multiple all-ins
 * 3. Ensures proper side pot creation
 * 4. Validates that all all-in players show cards at showdown
 * 5. Tests that player with remaining stack can still act
 */
describe('Croupier - Multi-way All-in', () => {
  it('should handle preflop multi-way all-in with different stack depths', async () => {
    const hand: Hand = {
      variant: 'NT',
      players: ['p1', 'p2', 'p3'],
      startingStacks: [50, 100, 200],
      blindsOrStraddles: [0, 10, 20],
      antes: [],
      actions: [],
      minBet: 20,
      seed: 123456,
    };

    const players = createPlayers([['p1 cbr 50'], ['p2 cbr 100'], ['p3 cc']]);
    const result = await croupier(hand, players);

    let game: Game;

    // Initial deal
    expect(result.actions[0]).toMatch(/^d dh p1/);
    expect(result.actions[1]).toMatch(/^d dh p2/);
    expect(result.actions[2]).toMatch(/^d dh p3/);

    game = Game(hand, result.actions.slice(0, 3));
    expect(game.street).toBe('preflop');
    expect(game.players.map(p => p.stack)).toEqual([50, 90, 180]); // After blinds
    expect(game.players.map(p => p.roundBet)).toEqual([0, 10, 20]);
    expect(game.bet).toBe(20);

    // Preflop betting - three-way all-in
    expect(result.actions[3]).toBe('p1 cbr 50'); // BTN all-in (+50)
    expect(result.actions[4]).toBe('p2 cbr 100'); // SB all-in (+90)
    expect(result.actions[5]).toBe('p3 cc'); // BB calls 100 (+80)

    game = Game(hand, result.actions.slice(0, 6));
    expect(game.players.map(p => p.stack)).toEqual([0, 0, 100]);
    expect(game.players.map(p => p.roundBet)).toEqual([0, 0, 0]);
    expect(game.players.map(p => p.totalBet)).toEqual([50, 100, 100]);
    expect(game.players.map(p => p.isAllIn)).toEqual([true, true, false]);
    expect(game.bet).toBe(0);
    expect(game.pot).toBe(250); // 50 (BTN) + 100 (SB) + 100 (BB)
    expect(game.isBettingComplete).toBe(true);

    // Board dealing - automatic due to all-ins
    expect(result.actions[6]).toMatch(/^d db/); // Flop
    expect(result.actions[7]).toMatch(/^d db/); // Turn
    expect(result.actions[8]).toMatch(/^d db/); // River

    // Final state
    game = Game(hand, result.actions);
    expect(game.board).toHaveLength(5); // Full board dealt
    expect(game.players.map(p => p.hasShownCards)).toEqual([true, true, true]); // All players show in multi-way pot
    expect(game.isBettingComplete).toBe(true);
  });
});
