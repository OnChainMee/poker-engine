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
 * This test verifies the simplest way a poker hand can end - when everyone folds to the big blind.
 * It's interesting because it:
 * 1. Tests early hand termination without reaching later streets
 * 2. Verifies correct pot distribution when hand ends preflop
 * 3. Ensures BB wins uncontested without showing cards
 * 4. Validates that no unnecessary cards are dealt when hand ends early
 */
describe('Croupier - All Fold', () => {
  it('should handle preflop folds with BB winning uncontested', async () => {
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

    const players = createPlayers([['p1 f'], ['p2 f']]); // BB doesn't need to act when winning uncontested
    const result = await croupier(hand, players);

    let game: Game;

    // Initial deal
    expect(result.actions[0]).toMatch(/^d dh p1/);
    expect(result.actions[1]).toMatch(/^d dh p2/);
    expect(result.actions[2]).toMatch(/^d dh p3/);

    game = Game(hand, result.actions.slice(0, 3));
    expect(game.street).toBe('preflop');
    expect(game.players.map(p => p.stack)).toEqual([1000, 990, 980]); // After blinds
    expect(game.players.map(p => p.roundBet)).toEqual([0, 10, 20]);
    expect(game.bet).toBe(20);
    expect(game.pot).toBe(30); // 10 (SB) + 20 (BB)

    // Preflop betting - everyone folds to BB
    expect(result.actions[3]).toBe('p1 f'); // BTN folds
    expect(result.actions[4]).toBe('p2 f'); // SB folds
    expect(result.actions.length).toBe(5); // Hand ends here, BB wins uncontested

    // Final state

    game = Game(hand, result.actions);
    expect(game.players.map(p => p.hasFolded)).toEqual([true, true, false]);
    expect(game.players.map(p => p.stack)).toEqual([1000, 990, 1010]); // BTN unchanged, SB -10, BB wins pot (+30)
    expect(game.players.map(p => p.roundBet)).toEqual([0, 0, 0]); // Betting state is reset after hand completion
    expect(game.players.map(p => p.totalBet)).toEqual([0, 10, 20]); // Total bets should persist (BTN folded without betting, SB posted 10, BB posted 20)
    expect(game.pot).toBe(20); // Pot is distributed to BB
    expect(game.isBettingComplete).toBe(true);
    expect(game.board).toHaveLength(0); // No board cards dealt
  });
});
