import { describe, expect, it } from 'vitest';
import { Game } from '../../Game';
import { findFirstToActForStreet, getNextEligiblePlayerIndex } from '../../game/position';
import { isAwaitingDealer } from '../../game/progress';
import { Hand } from '../../Hand';
import type { Action } from '../../types';

describe('Action Helpers', () => {
  describe('Player Order and Action Flow', () => {
    it('should handle heads-up (2 players) dynamics', () => {
      /*
       * Tests the unique heads-up dynamics where BTN is also SB:
       * - BTN/SB posts 10, BB posts 20
       * - Preflop action starts with BTN/SB (since BB posted highest blind)
       * - Postflop BB acts first (first active after button)
       * - Only two positions to track, which makes it a special case
       */
      const game = Game({
        variant: 'NT',
        players: ['p1', 'p2'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [10, 20], // p1 is SB (10), p2 is BB (20)
        antes: [0, 0],
        actions: [
          'd dh p1 AhKh', // BTN/SB
          'd dh p2 QhJh', // BB
        ],
        minBet: 20,
      });

      // Verify button position - in heads-up, button is SB
      expect(game.buttonIndex).toBe(0); // p1 is BTN/SB

      // Check first to act for each street
      expect(findFirstToActForStreet(game, 'preflop')).toBe(0); // BTN/SB acts first preflop
      expect(findFirstToActForStreet(game, 'flop')).toBe(1); // BB acts first postflop (first after button)
      expect(findFirstToActForStreet(game, 'turn')).toBe(1); // BB acts first postflop
      expect(findFirstToActForStreet(game, 'river')).toBe(1); // BB acts first postflop

      // Check next player for each position
      expect(getNextEligiblePlayerIndex(game, 0)).toBe(1); // From BTN/SB to BB
      expect(getNextEligiblePlayerIndex(game, 1)).toBe(0); // From BB wraps to BTN/SB

      // Verify current player - preflop starts with BTN/SB
      expect(Game.getCurrentPlayerIndex(game)).toBe(0); // BTN/SB acts first preflop
    });

    it('should handle 3-handed dynamics with action flow', () => {
      /*
       * Tests the minimal full ring dynamics with 3 players:
       * - p1 is BTN (no blind)
       * - p2 is SB (10)
       * - p3 is BB (20)
       * - Preflop starts after BB (UTG/BTN), postflop starts after button (SB)
       */
      const game = Game({
        variant: 'NT',
        players: ['p1', 'p2', 'p3'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20], // BTN (0), SB (10), BB (20)
        antes: [0, 0, 0],
        actions: [
          'd dh p1 AhKh', // BTN
          'd dh p2 QhJh', // SB
          'd dh p3 ThTd', // BB
          'p1 cc', // BTN calls
          'p2 cc', // SB completes
          'p3 cc', // BB checks
          'd db AcKcQc', // Flop dealt
        ],
        minBet: 20,
      });

      // Verify button position - in ring game, button is 2 positions before BB
      expect(game.buttonIndex).toBe(0); // p1 is BTN

      // Check first to act for each street
      expect(findFirstToActForStreet(game, 'preflop')).toBe(0); // BTN acts first preflop (first after BB)
      expect(findFirstToActForStreet(game, 'flop')).toBe(1); // SB acts first postflop (first after button)
      expect(findFirstToActForStreet(game, 'turn')).toBe(1); // SB acts first postflop
      expect(findFirstToActForStreet(game, 'river')).toBe(1); // SB acts first postflop

      // Check next player for each position
      expect(getNextEligiblePlayerIndex(game, 0)).toBe(1); // From BTN to SB
      expect(getNextEligiblePlayerIndex(game, 1)).toBe(2); // From SB to BB
      expect(getNextEligiblePlayerIndex(game, 2)).toBe(0); // From BB wraps to BTN

      // Verify current player - after flop is dealt, SB acts first
      expect(Game.getCurrentPlayerIndex(game)).toBe(1); // SB acts first postflop
    });

    it('should handle 5-handed with all-ins and folds', () => {
      /*
       * Tests complex scenario with mixed stack depths and actions:
       * Seat order: BTN -> SB -> BB -> UTG -> CO
       * - p1 is BTN (no blind)
       * - p2 is SB (10)
       * - p3 is BB (20)
       * - p4 is UTG
       * - p5 is CO
       * - Tests action flow when multiple players are all-in or folded
       */
      const game = Game({
        variant: 'NT',
        players: ['p1', 'p2', 'p3', 'p4', 'p5'],
        startingStacks: [1000, 100, 1000, 100, 1000],
        blindsOrStraddles: [0, 10, 20, 0, 0], // BTN (0), SB (10), BB (20), UTG (0), CO (0)
        antes: [0, 0, 0, 0, 0],
        actions: [
          'd dh p1 AhKh', // BTN
          'd dh p2 QhJh', // SB
          'd dh p3 ThTd', // BB
          'd dh p4 9h9d', // UTG
          'd dh p5 8h8d', // CO
          'p4 cc', // UTG calls
          'p5 cc', // CO calls
          'p1 cc', // BTN calls
          'p2 cbr 100', // SB all-in
          'p3 f', // BB folds
          'p4 f', // UTG folds
        ],
        minBet: 20,
      });

      // Verify button position
      expect(game.buttonIndex).toBe(0); // p1 is BTN

      // Check first to act for each street
      expect(findFirstToActForStreet(game, 'preflop')).toBe(3); // UTG acts first preflop
      expect(findFirstToActForStreet(game, 'flop')).toBe(1); // First after button (SB)
      expect(findFirstToActForStreet(game, 'turn')).toBe(1); // First after button (SB)
      expect(findFirstToActForStreet(game, 'river')).toBe(1); // First after button (SB)

      // Check next player for each position
      expect(getNextEligiblePlayerIndex(game, 0)).toBe(4); // From BTN to CO (skip all-in SB and folded BB/UTG)
      expect(getNextEligiblePlayerIndex(game, 4)).toBe(0); // From CO wraps to BTN

      // Verify current player - after SB all-in and BB/UTG fold
      expect(Game.getCurrentPlayerIndex(game)).toBe(4); // CO to act on SB's all-in
    });

    it('should handle mixed stack sizes with multiple side pots', () => {
      /*
       * Tests complex scenario with multiple all-ins creating side pots:
       * Seat order: BTN -> SB -> BB -> UTG
       * - p1 is BTN (no blind)
       * - p2 is SB (10)
       * - p3 is BB (20)
       * - p4 is UTG
       * - Tests action when players have different stack sizes
       */
      const game = Game({
        variant: 'NT',
        players: ['p1', 'p2', 'p3', 'p4'],
        startingStacks: [50, 100, 200, 1000],
        blindsOrStraddles: [0, 10, 20, 0], // BTN (0), SB (10), BB (20), UTG (0)
        antes: [0, 0, 0, 0],
        actions: [
          'd dh p1 AhKh', // BTN
          'd dh p2 QhJh', // SB
          'd dh p3 ThTd', // BB
          'd dh p4 9h9d', // UTG
          'p4 cc', // UTG calls
          'p1 cc', // BTN calls
          'p2 cc', // SB completes
          'p3 cbr 50', // BB raises
          'p4 cbr 100', // UTG raises more
          'p1 cbr 50', // BTN all-in for less
          'p2 cbr 100', // SB all-in exact
          'p3 cc', // BB calls
        ],
        minBet: 20,
      });

      // Verify button position
      expect(game.buttonIndex).toBe(0); // p1 is BTN

      // Check theoretical first to act for each street (purely positional)
      expect(findFirstToActForStreet(game, 'preflop')).toBe(3); // UTG (3 after button)
      expect(findFirstToActForStreet(game, 'flop')).toBe(1); // First after button (SB)
      expect(findFirstToActForStreet(game, 'turn')).toBe(1); // First after button (SB)
      expect(findFirstToActForStreet(game, 'river')).toBe(1); // First after button (SB)

      // Check next eligible player for each position
      expect(getNextEligiblePlayerIndex(game, 0)).toBe(2); // From BTN to BB (skip all-in SB)
      expect(getNextEligiblePlayerIndex(game, 2)).toBe(3); // From BB to UTG
      expect(getNextEligiblePlayerIndex(game, 3)).toBe(2); // From UTG wraps to BB (skip all-ins)

      // Verify current player - after BB calls UTG's raise
      expect(Game.getCurrentPlayerIndex(game)).toBe(-1); // No more action needed, ready for flop
    });

    it('should handle flop action with all players active', () => {
      /*
       * Tests player order on the flop with all players active:
       * - p1 is BTN (no blind)
       * - p2 is SB (10)
       * - p3 is BB (20)
       * - p4 is UTG
       *
       * Player order:
       * Preflop: UTG -> BTN -> SB -> BB
       * Postflop: SB -> BB -> UTG -> BTN
       *
       * Initial state:
       * - All players called preflop
       * - Flop is dealt
       * - No player has acted on flop yet
       */
      const game = Game({
        variant: 'NT',
        players: ['p1', 'p2', 'p3', 'p4'],
        startingStacks: [1000, 1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20, 0], // BTN (0), SB (10), BB (20), UTG (0)
        antes: [0, 0, 0, 0],
        actions: [
          'd dh p1 AhKh', // BTN
          'd dh p2 QhJh', // SB
          'd dh p3 ThTd', // BB
          'd dh p4 9h9d', // UTG
          'p4 cc', // UTG calls
          'p1 cc', // BTN calls
          'p2 cc', // SB completes
          'p3 cc', // BB checks
          'd db AcKcQc', // Flop dealt
        ],
        minBet: 20,
      });

      // Verify button position
      expect(game.buttonIndex).toBe(0); // p1 is BTN

      // Check first to act for each street
      expect(findFirstToActForStreet(game, 'preflop')).toBe(3); // UTG acts first preflop
      expect(findFirstToActForStreet(game, 'flop')).toBe(1); // SB acts first postflop
      expect(findFirstToActForStreet(game, 'turn')).toBe(1); // SB acts first postflop
      expect(findFirstToActForStreet(game, 'river')).toBe(1); // SB acts first postflop

      // Check next eligible player for each position
      expect(getNextEligiblePlayerIndex(game, 0)).toBe(1); // BTN -> SB
      expect(getNextEligiblePlayerIndex(game, 1)).toBe(2); // SB -> BB
      expect(getNextEligiblePlayerIndex(game, 2)).toBe(3); // BB -> UTG
      expect(getNextEligiblePlayerIndex(game, 3)).toBe(0); // UTG -> BTN

      // Verify current player - flop just dealt
      expect(Game.getCurrentPlayerIndex(game)).toBe(1); // SB acts first on flop
      expect(game.street).toBe('flop');
    });

    it('should handle turn action with some players folded', () => {
      /*
       * Tests player order on the turn after some players folded on flop:
       * - p1 is BTN (no blind)
       * - p2 is SB (10)
       * - p3 is BB (20)
       * - p4 is UTG
       *
       * Player order after folds:
       * - BB and UTG folded on flop
       * - Only BTN and SB remain
       * - SB acts first postflop (first after button)
       * - Action skips folded players
       *
       * Initial state:
       * - All players called preflop
       * - On flop: SB bet, BB folded, UTG folded, BTN called
       * - Turn is dealt
       */
      const game = Game({
        variant: 'NT',
        players: ['p1', 'p2', 'p3', 'p4'],
        startingStacks: [1000, 1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20, 0], // BTN (0), SB (10), BB (20), UTG (0)
        antes: [0, 0, 0, 0],
        actions: [
          'd dh p1 AhKh', // BTN
          'd dh p2 QhJh', // SB
          'd dh p3 ThTd', // BB
          'd dh p4 9h9d', // UTG
          'p4 cc', // UTG calls
          'p1 cc', // BTN calls
          'p2 cc', // SB completes
          'p3 cc', // BB checks
          'd db AcKcQc', // Flop dealt
          'p2 cbr 100', // SB bets
          'p3 f', // BB folds
          'p4 f', // UTG folds
          'p1 cc', // BTN calls
          'd db 7c', // Turn dealt
        ],
        minBet: 20,
      });

      // Verify button position
      expect(game.buttonIndex).toBe(0); // p1 is BTN

      // Check first to act for each street
      expect(findFirstToActForStreet(game, 'preflop')).toBe(3); // UTG acts first preflop
      expect(findFirstToActForStreet(game, 'flop')).toBe(1); // SB acts first postflop
      expect(findFirstToActForStreet(game, 'turn')).toBe(1); // SB acts first postflop
      expect(findFirstToActForStreet(game, 'river')).toBe(1); // SB acts first postflop

      // Check next eligible player for each position
      expect(getNextEligiblePlayerIndex(game, 0)).toBe(1); // BTN -> SB (only active players)
      expect(getNextEligiblePlayerIndex(game, 1)).toBe(0); // SB -> BTN (skip folded BB and UTG)

      // Verify current player - turn just dealt
      expect(Game.getCurrentPlayerIndex(game)).toBe(1); // SB acts first on turn
      expect(game.street).toBe('turn');
    });

    it('should handle river action with multiple active players', () => {
      /*
       * Tests player order on the river with multiple active players:
       * - p1 is BTN (no blind)
       * - p2 is SB (10)
       * - p3 is BB (20)
       * - p4 is UTG
       *
       * Player order:
       * Preflop: UTG -> BTN -> SB -> BB
       * Postflop: SB -> BB -> UTG -> BTN
       *
       * Initial state:
       * - All players called preflop
       * - All players checked flop
       * - All players checked turn
       * - River just dealt
       * - No player has acted on river yet
       */
      const game = Game({
        variant: 'NT',
        players: ['p1', 'p2', 'p3', 'p4'],
        startingStacks: [1000, 1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20, 0], // BTN (0), SB (10), BB (20), UTG (0)
        antes: [0, 0, 0, 0],
        actions: [
          'd dh p1 AhKh', // BTN
          'd dh p2 QhJh', // SB
          'd dh p3 ThTd', // BB
          'd dh p4 9h9d', // UTG
          'p4 cc', // UTG calls
          'p1 cc', // BTN calls
          'p2 cc', // SB completes
          'p3 cc', // BB checks
          'd db AcKcQc', // Flop dealt
          'p2 cc', // SB checks
          'p3 cc', // BB checks
          'p4 cc', // UTG checks
          'p1 cc', // BTN checks
          'd db 7c', // Turn dealt
          'p2 cc', // SB checks
          'p3 cc', // BB checks
          'p4 cc', // UTG checks
          'p1 cc', // BTN checks
          'd db 2h', // River dealt
        ],
        minBet: 20,
      });

      // Verify button position
      expect(game.buttonIndex).toBe(0); // p1 is BTN

      // Check first to act for each street
      expect(findFirstToActForStreet(game, 'preflop')).toBe(3); // UTG acts first preflop
      expect(findFirstToActForStreet(game, 'flop')).toBe(1); // SB acts first postflop
      expect(findFirstToActForStreet(game, 'turn')).toBe(1); // SB acts first postflop
      expect(findFirstToActForStreet(game, 'river')).toBe(1); // SB acts first postflop

      // Check next eligible player for each position
      expect(getNextEligiblePlayerIndex(game, 0)).toBe(1); // BTN -> SB
      expect(getNextEligiblePlayerIndex(game, 1)).toBe(2); // SB -> BB
      expect(getNextEligiblePlayerIndex(game, 2)).toBe(3); // BB -> UTG
      expect(getNextEligiblePlayerIndex(game, 3)).toBe(0); // UTG -> BTN

      // Verify current player - river just dealt
      expect(Game.getCurrentPlayerIndex(game)).toBe(1); // SB acts first on river
      expect(game.street).toBe('river');
    });

    it('should handle flop action with multiple all-ins', () => {
      /*
       * Tests player order when multiple players go all-in on the flop:
       * Seat order: BTN -> SB -> BB -> UTG
       * - p1 is BTN (no blind)
       * - p2 is SB (10) - stack 500
       * - p3 is BB (20) - stack 200
       * - p4 is UTG - stack 100
       *
       * Initial state:
       * - All players called preflop
       * - Flop is dealt
       * - SB went all-in for 480
       * - BB went all-in for less (180)
       * - UTG went all-in for even less (80)
       * - BTN has not acted yet
       */
      const game = Game({
        variant: 'NT',
        players: ['p1', 'p2', 'p3', 'p4'],
        startingStacks: [1000, 500, 200, 100],
        blindsOrStraddles: [0, 10, 20, 0], // BTN (0), SB (10), BB (20), UTG (0)
        antes: [0, 0, 0, 0],
        actions: [
          'd dh p1 AhKh', // BTN
          'd dh p2 QhJh', // SB
          'd dh p3 ThTd', // BB
          'd dh p4 9h9d', // UTG
          'p4 cc', // UTG calls
          'p1 cc', // BTN calls
          'p2 cc', // SB completes
          'p3 cc', // BB checks
          'd db AcKcQc', // Flop dealt
          'p2 cbr 480', // SB all-in (+460)
          'p3 cbr 180', // BB all-in for less
          'p4 cbr 80', // UTG all-in for even less
        ],
        minBet: 20,
      });

      // Verify button position
      expect(game.buttonIndex).toBe(0); // p1 is BTN

      // Check theoretical first to act for each street (purely positional)
      expect(findFirstToActForStreet(game, 'preflop')).toBe(3); // UTG (3 after button)
      expect(findFirstToActForStreet(game, 'flop')).toBe(1); // First after button (SB)
      expect(findFirstToActForStreet(game, 'turn')).toBe(1); // First after button (SB)
      expect(findFirstToActForStreet(game, 'river')).toBe(1); // First after button (SB)

      // Check next eligible player considering all-ins
      expect(getNextEligiblePlayerIndex(game, 0)).toBe(-1); // BTN has no next player (all others all-in)
      expect(getNextEligiblePlayerIndex(game, 1)).toBe(0); // SB -> BTN (only non-all-in)
      expect(getNextEligiblePlayerIndex(game, 2)).toBe(0); // BB -> BTN (only non-all-in)
      expect(getNextEligiblePlayerIndex(game, 3)).toBe(0); // UTG -> BTN (only non-all-in)

      // Verify current player - after multiple all-ins
      expect(Game.getCurrentPlayerIndex(game)).toBe(0); // BTN to act on all-ins
      expect(game.street).toBe('flop');
    });

    it('should handle heads-up preflop action with raises', () => {
      /*
       * Tests heads-up preflop dynamics with raises:
       * Seat order: BTN/SB -> BB
       * - p1 is BTN/SB (10)
       * - p2 is BB (20)
       *
       * Action sequence:
       * - BTN/SB raises to 60
       * - BB re-raises to 120
       * - BTN/SB calls
       * - Flop is dealt
       */
      const game = Game({
        variant: 'NT',
        players: ['p1', 'p2'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [10, 20], // p1 is SB (10), p2 is BB (20)
        antes: [0, 0],
        actions: [
          'd dh p1 AhKh', // BTN/SB
          'd dh p2 QhJh', // BB
          'p1 cbr 60', // BTN/SB raises
          'p2 cbr 120', // BB re-raises
          'p1 cc', // BTN/SB calls
          'd db AcKcQc', // Flop dealt
        ],
        minBet: 20,
      });

      // Verify button position
      expect(game.buttonIndex).toBe(0); // p1 is BTN/SB

      // Check theoretical first to act for each street (purely positional)
      expect(findFirstToActForStreet(game, 'preflop')).toBe(0); // BTN/SB acts first in heads-up preflop
      expect(findFirstToActForStreet(game, 'flop')).toBe(1); // First after button (BB)
      expect(findFirstToActForStreet(game, 'turn')).toBe(1); // First after button (BB)
      expect(findFirstToActForStreet(game, 'river')).toBe(1); // First after button (BB)

      // Check next eligible player for each position
      expect(getNextEligiblePlayerIndex(game, 0)).toBe(1); // From BTN/SB to BB
      expect(getNextEligiblePlayerIndex(game, 1)).toBe(0); // From BB wraps to BTN/SB

      // Verify current player - flop just dealt
      expect(Game.getCurrentPlayerIndex(game)).toBe(1); // BB acts first postflop
      expect(game.street).toBe('flop');
    });
  });

  it('should continue dealing after flop in all-in situations', () => {
    // Setup a game with 3 players, different stack depths
    const hand: Hand = {
      variant: 'NT',
      players: ['p1', 'p2', 'p3'],
      startingStacks: [50, 100, 200],
      blindsOrStraddles: [0, 10, 20],
      antes: [],
      minBet: 20,
      actions: [],
    };

    // Initial actions up to flop
    const preFlop = [
      'd dh p1 3h9d',
      'd dh p2 Ks9h',
      'd dh p3 7hQh',
      'p1 cbr 50', // BTN all-in
      'p2 cbr 100', // SB all-in
      'p3 cc', // BB calls
    ] as Action[];

    // Create game state after preflop
    let game = Game(hand, preFlop);

    // Verify preflop state is correct for dealer to act
    expect(game.isBettingComplete).toBe(true);
    expect(game.players.map(p => p.isAllIn)).toEqual([true, true, false]);
    expect(game.street).toBe('preflop');

    // Add flop action
    const withFlop = [...preFlop, 'd db 6d8dTc'] as Action[];
    game = Game(hand, withFlop);

    // Key test: After flop is dealt, dealer should still need to act
    expect(game.street).toBe('flop');
    expect(game.board).toHaveLength(3);
    expect(isAwaitingDealer(game)).toBe(true); // This should be true but is false
  });
});
