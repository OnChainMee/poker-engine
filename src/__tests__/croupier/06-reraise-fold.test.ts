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
 * This test simulates a preflop 3-betting scenario where the initial raiser folds.
 * It's interesting because it:
 * 1. Tests proper handling of raises and re-raises
 * 2. Verifies correct bet sizing rules for 3-bets
 * 3. Ensures proper pot calculation after multiple raises
 * 4. Validates early hand termination after 3-bet fold
 */
describe('Croupier - Re-raise and Fold', () => {
  it('should handle preflop 3-bet with folds', async () => {
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
      ['p1 cbr 60', 'p1 f'], // BTN raises to 60 then folds to 3-bet
      ['p2 cbr 180'], // SB 3-bets to 180
      ['p3 f'], // BB folds
    ]);
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

    // Preflop betting - 3-bet and folds
    expect(result.actions[3]).toBe('p1 cbr 60'); // BTN opens to 60 (+60)

    game = Game(hand, result.actions.slice(0, 4));
    expect(game.players.map(p => p.roundBet)).toEqual([60, 10, 20]);
    expect(game.bet).toBe(60);
    expect(game.pot).toBe(90); // 60 (BTN) + 10 (SB) + 20 (BB)

    expect(result.actions[4]).toBe('p2 cbr 180'); // SB 3-bets to 180 (+170)

    game = Game(hand, result.actions.slice(0, 5));
    expect(game.players.map(p => p.roundBet)).toEqual([60, 180, 20]);
    expect(game.bet).toBe(180);
    expect(game.pot).toBe(260); // 60 (BTN) + 180 (SB) + 20 (BB)

    expect(result.actions[5]).toBe('p3 f'); // BB folds (posted 20)
    expect(result.actions[6]).toBe('p1 f'); // BTN folds (invested 60)

    // Final state
    game = Game(hand, result.actions);
    expect(game.players.map(p => p.hasFolded)).toEqual([true, false, true]);
    expect(game.players.map(p => p.stack)).toEqual([940, 1080, 980]); // BTN -60, SB wins pot (+260), BB -20
    expect(game.players.map(p => p.roundBet)).toEqual([0, 0, 0]); // Betting state is reset after hand completion
    expect(game.players.map(p => p.totalBet)).toEqual([60, 180, 20]); // Total bets should persist (BTN bet 60, SB 3-bet to 180, BB posted 20)
    expect(game.bet).toBe(0); // Betting state is reset after hand completion
    expect(game.pot).toBe(140); // Pot is distributed to SB
    expect(game.isBettingComplete).toBe(true);
    expect(game.board).toHaveLength(0); // No board cards dealt
  });
});
