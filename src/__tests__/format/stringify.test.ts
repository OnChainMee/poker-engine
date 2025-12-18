import { parseHand } from '../../formats/pokerstars/parse';
import { describeHand, stringifyPokerstarsHand } from '../../formats/pokerstars/stringify';
import type { NoLimitVariant } from '../../types';
import * as Poker from '../../types';
import { fixtures as pokerstarsFixtures } from '../fixtures/hands';
import { fixtures } from '../fixtures/pokerstars_fixtures';

describe.concurrent('stringifyPokerstarsHand', () => {
  it('should narrate whole game with showdown', () => {
    // SCENARIO: Complete 9-player game through showdown with flush vs two pair
    // INPUT: 9-player game with full betting rounds and showdown ($0.50/$1 blinds)
    // EXPECTED: Properly formatted PokerStars narrative with all sections
    const game: Poker.NoLimitHand = {
      variant: 'NT' as NoLimitVariant,
      minBet: 1,
      antes: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      blindsOrStraddles: [0.5, 1, 0, 0, 0, 0, 0, 0, 0],
      startingStacks: [147.45, 77, 43, 100.25, 30.55, 82.5, 116.85, 84.6, 31.36],
      players: [
        'Q1wMNadv0MqRUDF/XFX2sQ',
        'K+xKH+v9giGAZhVCQ/HIvA',
        'cj8PFnDXSLQOM6J5y46H0g',
        'DTn8ms2ooz0h4sXDL+m3Fw',
        'KV6ayN/9pI4yJOH7PEGLNw',
        'IRMjAwuLYKvUi+z86ekgvw',
        'R2WtWE+6NYlt4/YHMpnsAQ',
        '246i06+qR/eim1c+rM7tTg',
        'PlUNwpktWubhMZcwWIJGbw',
      ],
      actions: [
        'd dh p1 ????',
        'd dh p2 ????',
        'd dh p3 ????',
        'd dh p4 ????',
        'd dh p5 ????',
        'd dh p6 ????',
        'd dh p7 ????',
        'd dh p8 ????',
        'd dh p9 ????',
        'p3 f',
        'p4 f',
        'p5 f',
        'p6 f',
        'p7 f',
        'p8 f',
        'p9 cbr 2',
        'p1 f',
        'p2 cc',
        'd db TsQs5s',
        'p2 cc',
        'p9 cbr 2',
        'p2 cc',
        'd db Js',
        'p2 cc',
        'p9 cc',
        'd db 9c',
        'p2 cbr 5',
        'p9 cc',
        'p2 sm TdJd',
        'p9 sm KsQd',
      ],
      table: '67b43cd6cb8e8306526bc926',
      hand: 3036569838,
      seats: [3, 4, 5, 6, 7, 8, 9, 1, 2],
      _venueIds: [
        '663fa776a939262963069559',
        '67b2bb5ea7f89f18df846dd0',
        '5e8633db5b74f20573d45ba1',
        '6491479251bf38266adc3231',
      ],
      _heroIds: [null, '67b2bb5ea7f89f18df846dd0', null, null],
      time: '2025-03-27T10:05:49.466Z',
      timestamp: 1743069949466,
      author: 'As2',
      timeLimit: 20,
      venue: 'Absolute Poker',
      _managerUid: 'manager_123',
    };

    const output = stringifyPokerstarsHand(game);
    expect(output).toContain(
      `Absolute poker Hand #3036569838: Hold'em No Limit ($0.50/$1 USD) - 2025/03/27 10:05:49 UTC`
    );
    expect(output).toContain(`Table '67b43cd6cb8e8306526bc926' 9-max Seat #2 is the button`);
    expect(output).toContain('Seat 3: cj8PFnDXSLQOM6J5y46H0g ($43 in chips)');
    expect(output).toContain('Seat 4: DTn8ms2ooz0h4sXDL+m3Fw ($100.25 in chips)');
    expect(output).toContain('Seat 5: KV6ayN/9pI4yJOH7PEGLNw ($30.55 in chips)');
    expect(output).toContain('Seat 6: IRMjAwuLYKvUi+z86ekgvw ($82.50 in chips)');
    expect(output).toContain('Seat 7: R2WtWE+6NYlt4/YHMpnsAQ ($116.85 in chips)');
    expect(output).toContain('Seat 8: 246i06+qR/eim1c+rM7tTg ($84.60 in chips)');
    expect(output).toContain('Seat 9: PlUNwpktWubhMZcwWIJGbw ($31.36 in chips)');
    expect(output).toContain('Seat 1: Q1wMNadv0MqRUDF/XFX2sQ ($147.45 in chips)');
    expect(output).toContain('Seat 2: K+xKH+v9giGAZhVCQ/HIvA ($77 in chips)');
    expect(output).toContain('Q1wMNadv0MqRUDF/XFX2sQ: posts small blind $0.50');
    expect(output).toContain('K+xKH+v9giGAZhVCQ/HIvA: posts big blind $1');
    expect(output).toContain('*** HOLE CARDS ***');
    expect(output).toContain('cj8PFnDXSLQOM6J5y46H0g: folds');
    expect(output).toContain('DTn8ms2ooz0h4sXDL+m3Fw: folds');
    expect(output).toContain('KV6ayN/9pI4yJOH7PEGLNw: folds');
    expect(output).toContain('IRMjAwuLYKvUi+z86ekgvw: folds');
    expect(output).toContain('R2WtWE+6NYlt4/YHMpnsAQ: folds');
    expect(output).toContain('246i06+qR/eim1c+rM7tTg: folds');
    expect(output).toContain('PlUNwpktWubhMZcwWIJGbw: raises $1 to $2');
    expect(output).toContain('Q1wMNadv0MqRUDF/XFX2sQ: folds');
    expect(output).toContain('K+xKH+v9giGAZhVCQ/HIvA: calls $1');
    expect(output).toContain('*** FLOP *** [Ts Qs 5s]');
    expect(output).toContain('K+xKH+v9giGAZhVCQ/HIvA: checks');
    expect(output).toContain('PlUNwpktWubhMZcwWIJGbw: bets $2');
    expect(output).toContain('K+xKH+v9giGAZhVCQ/HIvA: calls $2');
    expect(output).toContain('*** TURN *** [Ts Qs 5s] [Js]');
    expect(output).toContain('K+xKH+v9giGAZhVCQ/HIvA: checks');
    expect(output).toContain('PlUNwpktWubhMZcwWIJGbw: checks');
    expect(output).toContain('*** RIVER *** [Ts Qs 5s Js] [9c]');
    expect(output).toContain('K+xKH+v9giGAZhVCQ/HIvA: bets $5');
    expect(output).toContain('PlUNwpktWubhMZcwWIJGbw: calls $5');
    expect(output).toContain('*** SHOW DOWN ***');
    expect(output).toContain('K+xKH+v9giGAZhVCQ/HIvA: shows [Td Jd] (two pair, Jacks and Tens)');
    expect(output).toContain('PlUNwpktWubhMZcwWIJGbw: shows [Ks Qd] (a flush, King high)');
    expect(output).toContain('PlUNwpktWubhMZcwWIJGbw collected $18.50 from pot');
    expect(output).toContain('*** SUMMARY ***');
    expect(output).toContain('Total pot $18.50 | Rake $0');
    expect(output).toContain('Board [Ts Qs 5s Js 9c]');
    expect(output).toContain("Seat 3: cj8PFnDXSLQOM6J5y46H0g folded before Flop (didn't bet)");
    expect(output).toContain("Seat 4: DTn8ms2ooz0h4sXDL+m3Fw folded before Flop (didn't bet)");
    expect(output).toContain("Seat 5: KV6ayN/9pI4yJOH7PEGLNw folded before Flop (didn't bet)");
    expect(output).toContain("Seat 6: IRMjAwuLYKvUi+z86ekgvw folded before Flop (didn't bet)");
    expect(output).toContain("Seat 7: R2WtWE+6NYlt4/YHMpnsAQ folded before Flop (didn't bet)");
    expect(output).toContain("Seat 8: 246i06+qR/eim1c+rM7tTg folded before Flop (didn't bet)");
    expect(output).toContain(
      'Seat 9: PlUNwpktWubhMZcwWIJGbw (button) showed [Ks Qd] and won ($18.50) with a flush, King high'
    );
    expect(output).toContain('Seat 1: Q1wMNadv0MqRUDF/XFX2sQ (small blind) folded before Flop');
    expect(output).toContain(
      'Seat 2: K+xKH+v9giGAZhVCQ/HIvA (big blind) showed [Td Jd] and lost with two pair, Jacks and Tens'
    );
  });

  it('should narrate 4-player game with all-in and showdown', () => {
    // SCENARIO: 4-player game with all-in on turn and showdown
    // INPUT: Complete hand with visible hole cards for one player (As2)
    // EXPECTED: Proper narrative with dealt cards shown for author player
    const game: Poker.NoLimitHand = {
      variant: 'NT' as NoLimitVariant,
      minBet: 100,
      antes: [0, 0, 0, 0],
      blindsOrStraddles: [50, 100, 0, 0],
      startingStacks: [15052, 2350, 5520, 16214],
      players: ['Vicky', 'As2', 'Jevon', 'Philippe hamon'],
      actions: [
        'd dh p1 ???? #0 Vicky',
        'd dh p2 ThQs #0 As2',
        'd dh p3 ???? #0 Jevon',
        'd dh p4 ???? #0 Philippe hamon',
        'p3 f #1743069949466 Jevon',
        'p4 cbr 350 #1743069949467 Philippe hamon',
        'p1 f #1743069949468 Vicky',
        'p2 cc 350 #1743069949468 As2',
        'd db Qh9sAh',
        'p2 cbr 100 #1743069949469 As2',
        'p4 cbr 800 #1743069949470 Philippe hamon',
        'p2 cc 800 #1743069949470 As2',
        'd db 6c',
        'p2 cbr 100 #1743069949470 As2',
        'p4 cbr 2000 #1743069949471 Philippe hamon',
        'p2 cc 1200 #1743069949471 As2',
        'd db 4h',
        'p2 sm ThQs',
        'p4 sm 9dKs',
      ],
      table: '67b43cd6cb8e8306526bc926',
      hand: 39,
      seats: [3, 4, 0, 2],
      _venueIds: [
        '663fa776a939262963069559',
        '67b2bb5ea7f89f18df846dd0',
        '5e8633db5b74f20573d45ba1',
        '6491479251bf38266adc3231',
      ],
      _heroIds: [null, '67b2bb5ea7f89f18df846dd0', null, null],
      time: '2025-03-27T10:05:49.466Z',
      timestamp: 1743069949466,
      author: 'As2',
      timeLimit: 20,
      venue: 'pokerrrr',
      _managerUid: 'manager_123',
    };

    const output = stringifyPokerstarsHand(game);
    expect(output).toContain(
      `Pokerrrr Hand #39: Hold'em No Limit ($50/$100 USD) - 2025/03/27 10:05:49 UTC`
    );
    expect(output).toContain(`Table '67b43cd6cb8e8306526bc926' 4-max Seat #2 is the button`);
    expect(output).toContain('Seat 3: Jevon ($5520 in chips)');
    expect(output).toContain('Seat 4: Philippe hamon ($16214 in chips)');
    expect(output).toContain('Seat 0: Vicky ($15052 in chips)');
    expect(output).toContain('Seat 2: As2 ($2350 in chips)');
    expect(output).toContain('Vicky: posts small blind $50');
    expect(output).toContain('As2: posts big blind $100');
    expect(output).toContain('*** HOLE CARDS ***');
    expect(output).toContain('Dealt to As2 [Th Qs]');
    expect(output).toContain('Jevon: folds');
    expect(output).toContain('Philippe hamon: raises $250 to $350');
    expect(output).toContain('Vicky: folds');
    expect(output).toContain('As2: calls $250');
    expect(output).toContain('*** FLOP *** [Qh 9s Ah]');
    expect(output).toContain('As2: bets $100');
    expect(output).toContain('Philippe hamon: raises $700 to $800');
    expect(output).toContain('As2: calls $700');
    expect(output).toContain('*** TURN *** [Qh 9s Ah] [6c]');
    expect(output).toContain('As2: bets $100');
    expect(output).toContain('Philippe hamon: raises $1900 to $2000');
    expect(output).toContain('As2: calls $1100 and is all-in');
    expect(output).toContain('*** RIVER *** [Qh 9s Ah 6c] [4h]');
    expect(output).toContain('*** SHOW DOWN ***');
    expect(output).toContain('Philippe hamon: shows [9d Ks] (a pair of Nines)');
    expect(output).toContain('As2: shows [Th Qs] (a pair of Queens)');
    expect(output).toContain('As2 collected $4750 from pot');
    expect(output).toContain('*** SUMMARY ***');
    expect(output).toContain('Total pot $4750 | Rake $0');
    expect(output).toContain('Board [Qh 9s Ah 6c 4h]');
    expect(output).toContain("Seat 3: Jevon folded before Flop (didn't bet)");
    expect(output).toContain(
      'Seat 4: Philippe hamon (button) showed [9d Ks] and lost with a pair of Nines'
    );
    expect(output).toContain('Seat 0: Vicky (small blind) folded before Flop');
    expect(output).toContain(
      'Seat 2: As2 (big blind) showed [Th Qs] and won ($4750) with a pair of Queens'
    );
  });

  it('should narrate incomplete hand stopping at turn', () => {
    // SCENARIO: Incomplete hand that stops at turn (no river, no showdown)
    // INPUT: Game with actions through turn but no river/showdown
    // EXPECTED: Narrative ends at turn with proper summary showing current state
    const game: Poker.NoLimitHand = {
      variant: 'NT' as NoLimitVariant,
      minBet: 100,
      antes: [0, 0, 0, 0],
      blindsOrStraddles: [50, 100, 0, 0],
      startingStacks: [15052, 2350, 5520, 16214],
      players: ['Vicky', 'As2', 'Jevon', 'Philippe hamon'],
      actions: [
        'd dh p1 ???? #0 Vicky',
        'd dh p2 ThQs #0 As2',
        'd dh p3 ???? #0 Jevon',
        'd dh p4 ???? #0 Philippe hamon',
        'p3 f #1743069949466 Jevon',
        'p4 cbr 350 #1743069949467 Philippe hamon',
        'p1 f #1743069949468 Vicky',
        'p2 cc 350 #1743069949468 As2',
        'd db Qh9sAh',
        'p2 cbr 100 #1743069949469 As2',
        'p4 cbr 800 #1743069949470 Philippe hamon',
        'p2 cc 800 #1743069949470 As2',
        'd db 6c',
        'p2 cbr 100 #1743069949470 As2',
        'p4 cbr 2000 #1743069949471 Philippe hamon',
        'p2 cc 1200 #1743069949471 As2',
      ],
      table: '67b43cd6cb8e8306526bc926',
      hand: 39,
      seats: [3, 4, 0, 2],
      _venueIds: [
        '663fa776a939262963069559',
        '67b2bb5ea7f89f18df846dd0',
        '5e8633db5b74f20573d45ba1',
        '6491479251bf38266adc3231',
      ],
      _heroIds: [null, '67b2bb5ea7f89f18df846dd0', null, null],
      time: '2025-03-27T10:05:49.466Z',
      timestamp: 1743069949466,
      author: 'As2',
      timeLimit: 20,
      venue: 'pokerrrr',
      _managerUid: 'manager_123',
    };

    const output = stringifyPokerstarsHand(game);
    expect(output).toContain(
      `Pokerrrr Hand #39: Hold'em No Limit ($50/$100 USD) - 2025/03/27 10:05:49 UTC`
    );
    expect(output).toContain(`Table '67b43cd6cb8e8306526bc926' 4-max Seat #2 is the button`);
    expect(output).toContain('Seat 3: Jevon ($5520 in chips)');
    expect(output).toContain('Seat 4: Philippe hamon ($16214 in chips)');
    expect(output).toContain('Seat 0: Vicky ($15052 in chips)');
    expect(output).toContain('Seat 2: As2 ($2350 in chips)');
    expect(output).toContain('Vicky: posts small blind $50');
    expect(output).toContain('As2: posts big blind $100');
    expect(output).toContain('*** HOLE CARDS ***');
    expect(output).toContain('Dealt to As2 [Th Qs]');
    expect(output).toContain('Jevon: folds');
    expect(output).toContain('Philippe hamon: raises $250 to $350');
    expect(output).toContain('Vicky: folds');
    expect(output).toContain('As2: calls $250');
    expect(output).toContain('*** FLOP *** [Qh 9s Ah]');
    expect(output).toContain('As2: bets $100');
    expect(output).toContain('Philippe hamon: raises $700 to $800');
    expect(output).toContain('As2: calls $700');
    expect(output).toContain('*** TURN *** [Qh 9s Ah] [6c]');
    expect(output).toContain('As2: bets $100');
    expect(output).toContain('Philippe hamon: raises $1900 to $2000');
    expect(output).toContain('As2: calls $1100 and is all-in');
    expect(output).toContain('*** SUMMARY ***');
    expect(output).toContain('Total pot $5550 | Rake $0');
    expect(output).toContain('Board [Qh 9s Ah 6c]');
    expect(output).toContain("Seat 3: Jevon folded before Flop (didn't bet)");
    expect(output).toContain('Seat 4: Philippe hamon (button)');
    expect(output).toContain('Seat 0: Vicky (small blind) folded before Flop');
    expect(output).toContain(
      'Seat 2: As2 (big blind) shows Ten of Hearts, Queen of Spades, got combination a pair of Queens'
    );
  });

  it('should handle empty actions gracefully', () => {
    // SCENARIO: Hand with no actions taken yet
    // INPUT: Valid hand structure but empty actions array
    // EXPECTED: Basic structure with hole cards section but no betting/board
    const game: Poker.NoLimitHand = {
      variant: 'NT' as NoLimitVariant,
      minBet: 100,
      antes: [0, 0, 0, 0],
      blindsOrStraddles: [50, 100, 0, 0],
      startingStacks: [15052, 2350, 5520, 16214],
      players: ['Vicky', 'As2', 'Jevon', 'Philippe hamon'],
      actions: [],
      table: 'test_table',
      hand: 1,
      seats: [1, 2, 3, 4],
      time: '2025-03-27T10:05:49.466Z',
      timestamp: 1743069949466,
      author: 'As2',
      timeLimit: 20,
      venue: 'pokerrrr',
      _managerUid: 'manager_123',
    };
    const output = stringifyPokerstarsHand(game);
    expect(output).toContain('*** HOLE CARDS ***');
    expect(output).not.toContain('*** FLOP ***');
    expect(output).not.toContain('collected');
  });

  it('should handle incomplete hand (no river, no showdown)', () => {
    // SCENARIO: Hand that progresses to turn but doesn't complete
    // INPUT: Actions through turn betting
    // EXPECTED: Narrative stops at turn, no river/showdown/collection
    const game: Poker.NoLimitHand = {
      variant: 'NT' as NoLimitVariant,
      minBet: 100,
      antes: [0, 0, 0, 0],
      blindsOrStraddles: [50, 100, 0, 0],
      startingStacks: [15052, 2350, 5520, 16214],
      players: ['Vicky', 'As2', 'Jevon', 'Philippe hamon'],
      actions: [
        'd dh p1 ????',
        'd dh p2 ThQs',
        'd dh p3 ????',
        'd dh p4 ????',
        'p3 f',
        'p4 cbr 350',
        'p1 f',
        'p2 cc 350',
        'd db Qh9sAh',
        'p2 cbr 100',
        'p4 cbr 800',
        'p2 cc 800',
        'd db 6c',
        'p2 cbr 100',
        'p4 cbr 2000',
        'p2 cc 1200',
        // No river, no showdown
      ],
      table: 'test_table',
      hand: 2,
      seats: [1, 2, 3, 4],
      time: '2025-03-27T10:05:49.466Z',
      timestamp: 1743069949466,
      author: 'As2',
      timeLimit: 20,
      venue: 'pokerrrr',
      _managerUid: 'manager_123',
    };
    const output = stringifyPokerstarsHand(game);
    expect(output).toContain('*** TURN ***');
    expect(output).not.toContain('*** RIVER ***');
    expect(output).not.toContain('collected');
    expect(output).not.toContain('SHOW DOWN');
  });

  it('should handle all but one player folding (no showdown, winner by default)', () => {
    // SCENARIO: All players fold except one, winner by elimination
    // INPUT: Preflop with everyone folding to big blind
    // EXPECTED: Big blind collects pot without showdown
    const game: Poker.NoLimitHand = {
      variant: 'NT' as NoLimitVariant,
      minBet: 100,
      antes: [0, 0, 0, 0],
      blindsOrStraddles: [50, 100, 0, 0],
      startingStacks: [15052, 2350, 5520, 16214],
      players: ['Vicky', 'As2', 'Jevon', 'Philippe hamon'],
      actions: [
        'd dh p1 ????',
        'd dh p2 ThQs',
        'd dh p3 ????',
        'd dh p4 ????',
        'p3 f',
        'p4 f',
        'p1 f',
        // Only As2 remains
      ],
      table: 'test_table',
      hand: 3,
      seats: [1, 2, 3, 4],
      time: '2025-03-27T10:05:49.466Z',
      timestamp: 1743069949466,
      author: 'As2',
      timeLimit: 20,
      venue: 'pokerrrr',
      _managerUid: 'manager_123',
    };
    const output = stringifyPokerstarsHand(game);
    expect(output).toContain('As2 collected');
    expect(output).not.toContain('SHOW DOWN');
  });

  it('should handle multiple currencies (USD, EUR)', () => {
    // SCENARIO: Different currency formatting
    // INPUT: Same hand with USD and EUR currencies
    // EXPECTED: Proper currency symbols ($ for USD, € for EUR)
    const gamePlay: Poker.NoLimitHand = {
      variant: 'NT' as NoLimitVariant,
      minBet: 100,
      antes: [0, 0],
      blindsOrStraddles: [50, 100],
      startingStacks: [1000, 1000],
      players: ['A', 'B'],
      actions: ['d dh p1 ????', 'd dh p2 ????', 'p1 f'],
      table: 't',
      hand: 4,
      seats: [1, 2],
      time: '2025-03-27T10:05:49.466Z',
      timestamp: 1743069949466,
      author: 'A',
      timeLimit: 20,
      venue: 'pokerrrr',
      _managerUid: 'manager_123',
      currency: 'USD',
    };
    const gameEur: Poker.NoLimitHand = {
      ...gamePlay,
      currency: 'EUR',
      hand: 5,
    };
    const outPlay = stringifyPokerstarsHand(gamePlay);
    const outEur = stringifyPokerstarsHand(gameEur);
    expect(outPlay).not.toContain('PLAY');
    expect(outPlay).toContain('$');
    expect(outPlay).toContain('USD');
    expect(outEur).toContain('€');
    expect(outEur).toContain('EUR');
  });

  it('should handle showdown with complete cards', () => {
    // SCENARIO: Showdown with both players showing cards
    // INPUT: Complete hand with showdown actions
    // EXPECTED: Both players show cards in SHOW DOWN section
    const game: Poker.NoLimitHand = {
      variant: 'NT' as NoLimitVariant,
      minBet: 100,
      antes: [0, 0, 0, 0],
      blindsOrStraddles: [50, 100, 0, 0],
      startingStacks: [15052, 2350, 5520, 16214],
      players: ['Vicky', 'As2', 'Jevon', 'Philippe hamon'],
      actions: [
        'd dh p1 ???? #0 Vicky',
        'd dh p2 ThQs #0 As2',
        'd dh p3 ???? #0 Jevon',
        'd dh p4 ???? #0 Philippe hamon',
        'p3 f #1743069949466 Jevon',
        'p4 cbr 350 #1743069949467 Philippe hamon',
        'p1 f #1743069949468 Vicky',
        'p2 cc 350 #1743069949468 As2',
        'd db Qh9sAh',
        'p2 cbr 100 #1743069949469 As2',
        'p4 cbr 800 #1743069949470 Philippe hamon',
        'p2 cc 800 #1743069949470 As2',
        'd db 6c',
        'p2 cbr 100 #1743069949470 As2',
        'p4 cbr 2000 #1743069949471 Philippe hamon',
        'p2 cc 1200 #1743069949471 As2',
        'd db 4h',
        'p2 sm ThQs',
        'p4 sm 9dKs',
      ],
      table: '67b43cd6cb8e8306526bc926',
      hand: 39,
      seats: [3, 4, 0, 2],
      _venueIds: [
        '663fa776a939262963069559',
        '67b2bb5ea7f89f18df846dd0',
        '5e8633db5b74f20573d45ba1',
        '6491479251bf38266adc3231',
      ],
      _heroIds: [null, '67b2bb5ea7f89f18df846dd0', null, null],
      time: '2025-03-27T10:05:49.466Z',
      timestamp: 1743069949466,
      author: 'As2',
      timeLimit: 20,
      venue: 'pokerrrr',
      _managerUid: 'manager_123',
    };
    const output = stringifyPokerstarsHand(game);
    expect(output).toContain('SHOW DOWN');
    expect(output).toMatch(/Philippe hamon: mucks hand|Philippe hamon: shows/);
    expect(output).toContain('As2: shows');
  });

  it('narrates preflop only betting', () => {
    // SCENARIO: Hand ends in preflop with betting
    // INPUT: Preflop raise and call, no further action
    // EXPECTED: Only HOLE CARDS section, no FLOP
    const game = {
      variant: 'NT' as NoLimitVariant,
      minBet: 10,
      antes: [0, 0],
      blindsOrStraddles: [5, 10],
      startingStacks: [100, 100],
      players: ['A', 'B'],
      actions: ['d dh p1 AhKh', 'd dh p2 QsJs', 'p1 cbr 20', 'p2 cc'],
      table: 't',
      hand: 1,
      seats: [1, 2],
      time: '2025-01-01T00:00:00Z',
      currency: 'USD',
    };
    const out = stringifyPokerstarsHand(game);
    expect(out).toContain('*** HOLE CARDS ***');
    expect(out).not.toContain('*** FLOP ***');
    expect(out).toContain('A: raises $10 to $20');
    expect(out).toContain('B: calls $1');
  });

  it('narrates flop action with fold', () => {
    // SCENARIO: Flop betting with one player folding
    // INPUT: Preflop action, flop dealt, player folds to checks
    // EXPECTED: FLOP section with fold and check actions
    const game = {
      variant: 'NT' as NoLimitVariant,
      minBet: 10,
      antes: [0, 0, 0],
      blindsOrStraddles: [5, 10, 0],
      startingStacks: [100, 100, 100],
      players: ['A', 'B', 'C'],
      actions: [
        'd dh p1 AhKh',
        'd dh p2 QsJs',
        'd dh p3 9c9d',
        'p3 cc 10',
        'p1 cc 10',
        'p2 cc 10',
        'd db 2c3c4c',
        'p1 f',
        'p2 cc',
        'p3 cc',
      ],
      table: 't',
      hand: 2,
      seats: [1, 2, 3],
      time: '2025-01-01T00:00:00Z',
      currency: 'USD',
    };
    const out = stringifyPokerstarsHand(game);
    expect(out).toContain('*** FLOP *** [2c 3c 4c]');
    expect(out).toContain('A: folds');
    expect(out).toContain('B: checks');
    expect(out).toContain('C: checks');
  });

  it('narrates turn betting sequence', () => {
    // SCENARIO: Turn with bet/call sequence
    // INPUT: Action through turn with betting
    // EXPECTED: TURN section showing bet and call
    const game = {
      variant: 'NT' as NoLimitVariant,
      minBet: 10,
      antes: [0, 0, 0],
      blindsOrStraddles: [5, 10, 0],
      startingStacks: [100, 100, 100],
      players: ['A', 'B', 'C'],
      actions: [
        'd dh p1 AhKh',
        'd dh p2 QsJs',
        'd dh p3 9c9d',
        'p3 cbr 20',
        'p1 cc',
        'p2 cc',
        'd db 2c3c4c',
        'p1 cc',
        'p2 cbr 20',
        'p3 cc',
        'p1 cc',
        'd db 5c',
        'p1 f',
        'p2 cc',
        'p3 cc',
      ],
      table: 't',
      hand: 3,
      seats: [1, 2, 3],
      time: '2025-01-01T00:00:00Z',
      currency: 'USD',
    };
    const out = stringifyPokerstarsHand(game);
    expect(out).toContain('*** TURN *** [2c 3c 4c] [5c]');
    expect(out).toContain('B: bets $20');
    expect(out).toContain('C: calls $20');
  });

  it('narrates flop all-in with uncalled bet', () => {
    // SCENARIO: Player goes all-in on flop, opponent folds
    // INPUT: Flop bet of 90 (all-in), fold
    // EXPECTED: Uncalled bet returned message
    const game = {
      variant: 'NT' as NoLimitVariant,
      minBet: 10,
      antes: [0, 0],
      blindsOrStraddles: [5, 10],
      startingStacks: [100, 100],
      players: ['A', 'B'],
      actions: [
        'd dh p1 AhKh',
        'd dh p2 QsJs',
        'p1 cc',
        'p2 cc',
        'd db 2c3c4c',
        'p2 cbr 90',
        'p1 f',
      ],
      table: 't',
      hand: 4,
      seats: [1, 2],
      time: '2025-01-01T00:00:00Z',
      currency: 'USD',
    };
    const out = stringifyPokerstarsHand(game);
    expect(out).toContain('*** FLOP *** [2c 3c 4c]');
    expect(out).toContain('B: bets $90');
    expect(out).toContain('A: folds');
    expect(out).toMatch(/Uncalled bet/);
  });

  it('narrates complete hand with showdown', () => {
    // SCENARIO: Full hand through river with showdown
    // INPUT: All streets with final showdown
    // EXPECTED: SHOW DOWN section with both hands revealed
    const game = {
      variant: 'NT' as NoLimitVariant,
      minBet: 10,
      antes: [0, 0],
      blindsOrStraddles: [5, 10],
      startingStacks: [100, 100],
      players: ['A', 'B'],
      actions: [
        'd dh p1 AhKh',
        'd dh p2 QsJs',
        'p1 cc',
        'p2 cc',
        'd db 2c3c4c',
        'p2 cbr 20',
        'p1 cc',
        'd db 5c',
        'p2 cc',
        'p1 cc',
        'd db 6c',
        'p2 cc',
        'p1 cc',
        'p2 sm AhKh',
        'p1 sm QsJs',
      ],
      table: 't',
      hand: 5,
      seats: [1, 2],
      time: '2025-01-01T00:00:00Z',
      currency: 'USD',
    };
    const out = stringifyPokerstarsHand(game);
    expect(out).toContain('*** SHOW DOWN ***');
    expect(out).toMatch(/A: shows/);
    expect(out).toMatch(/B: shows/);
    expect(out).toContain('Total pot');
  });

  it('handles hand with no actions', () => {
    // SCENARIO: Hand dealt but no actions taken
    // INPUT: Empty actions array
    // EXPECTED: Basic structure without board or collection
    const game: Poker.NoLimitHand = {
      variant: 'NT',
      minBet: 10,
      antes: [0, 0],
      blindsOrStraddles: [5, 10],
      startingStacks: [100, 100],
      players: ['A', 'B'],
      actions: [],
      table: 't',
      hand: 6,
      seats: [1, 2],
      time: '2025-01-01T00:00:00Z',
      currency: 'USD',
    };
    const out = stringifyPokerstarsHand(game);
    expect(out).toContain('*** SUMMARY ***');
    expect(out).not.toContain('*** FLOP ***');
    expect(out).not.toContain('collected');
  });
});

describe.concurrent('timezone handling', () => {
  it('should handle EDT timezone', () => {
    // SCENARIO: Hand with EDT timezone
    // INPUT: Hand with timeZone set to 'EDT'
    // EXPECTED: Preserves EDT in output
    const game: Poker.NoLimitHand = {
      variant: 'NT' as NoLimitVariant,
      minBet: 2,
      antes: [0, 0],
      blindsOrStraddles: [1, 2],
      startingStacks: [100, 100],
      players: ['Player1', 'Player2'],
      actions: ['d dh p1 AhKh', 'd dh p2 QsQd', 'p1 f'],
      table: 'TestTable',
      hand: 123456,
      seats: [1, 2],
      time: '2025-03-27T10:05:49.466Z',
      timeZone: 'EDT',
      currency: 'USD',
      venue: 'PokerStars',
    };

    const output = stringifyPokerstarsHand(game);
    expect(output).toContain('EDT');
    expect(output).toContain('PokerStars Hand #123456');
  });

  it('should handle MSK timezone', () => {
    // SCENARIO: Hand with Moscow timezone
    // INPUT: Hand with timeZone set to 'MSK'
    // EXPECTED: Preserves MSK in output
    const game: Poker.NoLimitHand = {
      variant: 'NT' as NoLimitVariant,
      minBet: 2,
      antes: [0, 0],
      blindsOrStraddles: [1, 2],
      startingStacks: [100, 100],
      players: ['Player1', 'Player2'],
      actions: ['d dh p1 ????', 'd dh p2 ????', 'p1 f'],
      table: 'TestTable',
      hand: 789012,
      seats: [1, 2],
      time: '2025-03-27T10:05:49.466Z',
      timeZone: 'MSK',
      currency: 'USD',
    };

    const output = stringifyPokerstarsHand(game);
    expect(output).toContain('MSK');
  });

  it('should handle unknown timezone gracefully', () => {
    // SCENARIO: Hand with unknown/invalid timezone
    // INPUT: Hand with timeZone set to 'XYZ' (unknown)
    // EXPECTED: Falls back to UTC formatting but preserves XYZ label
    const game: Poker.NoLimitHand = {
      variant: 'NT' as NoLimitVariant,
      minBet: 2,
      antes: [0, 0],
      blindsOrStraddles: [1, 2],
      startingStacks: [100, 100],
      players: ['Player1', 'Player2'],
      actions: ['d dh p1 ????', 'd dh p2 ????', 'p1 f'],
      table: 'TestTable',
      hand: 345678,
      seats: [1, 2],
      time: '2025-03-27T10:05:49.466Z',
      timeZone: 'XYZ',
      currency: 'USD',
    };

    const output = stringifyPokerstarsHand(game);
    expect(output).toContain('XYZ'); // Should preserve the label
  });

  it('should handle missing timezone (default to UTC)', () => {
    // SCENARIO: Hand with no timezone specified
    // INPUT: Hand without timeZone field
    // EXPECTED: Defaults to UTC
    const game: Poker.NoLimitHand = {
      variant: 'NT' as NoLimitVariant,
      minBet: 2,
      antes: [0, 0],
      blindsOrStraddles: [1, 2],
      startingStacks: [100, 100],
      players: ['Player1', 'Player2'],
      actions: ['d dh p1 ????', 'd dh p2 ????', 'p1 f'],
      table: 'TestTable',
      hand: 111111,
      seats: [1, 2],
      time: '2025-03-27T10:05:49.466Z',
      currency: 'USD',
    };

    const output = stringifyPokerstarsHand(game);
    expect(output).toContain('UTC');
  });

  it('should preserve timezone in roundtrip conversion', () => {
    // SCENARIO: Parse PokerStars hand with timezone and convert back
    // INPUT: PokerStars format with EST timezone
    // EXPECTED: Timezone preserved through parse->narrate->parse cycle
    const fixture = `PokerStars Hand #12345: Hold'em No Limit ($1/$2 USD) - 2024/12/19 12:23:15 EST
Table 'TestTable' 2-max Seat #1 is the button
Seat 1: Player1 ($100 in chips)
Seat 2: Player2 ($100 in chips)
Player1: posts small blind $1
Player2: posts big blind $2
*** HOLE CARDS ***
Player1: folds
Player2 collected $2 from pot
*** SUMMARY ***
Total pot $2 | Rake $0
Seat 1: Player1 (button) (small blind) folded before Flop
Seat 2: Player2 (big blind) collected ($2)`;

    const parsed = parseHand(fixture);
    expect(parsed.timeZone).toBe('EST');

    const narrated = stringifyPokerstarsHand(parsed);
    expect(narrated).toContain('EST');

    const reparsed = parseHand(narrated);
    expect(reparsed.timeZone).toBe('EST');
  });

  it('should handle all common poker room timezones', () => {
    // SCENARIO: Test various common timezones used by poker sites
    // INPUT: Different timezone values
    // EXPECTED: All timezones are preserved in output
    const timezones = ['PST', 'PDT', 'CST', 'CDT', 'GMT', 'BST', 'CET', 'CEST'];

    timezones.forEach(tz => {
      const game: Poker.NoLimitHand = {
        variant: 'NT' as NoLimitVariant,
        minBet: 2,
        antes: [0, 0],
        blindsOrStraddles: [1, 2],
        startingStacks: [100, 100],
        players: ['P1', 'P2'],
        actions: ['d dh p1 ????', 'd dh p2 ????', 'p1 f'],
        table: 'Table',
        hand: 999,
        seats: [1, 2],
        time: '2025-01-01T12:00:00.000Z',
        timeZone: tz,
        currency: 'USD',
      };

      const output = stringifyPokerstarsHand(game);
      expect(output).toContain(tz);
    });
  });

  it('should handle IANA timezone format', () => {
    // SCENARIO: Hand with IANA timezone format (e.g., America/New_York)
    // INPUT: Hand with timeZone as 'America/New_York'
    // EXPECTED: Formats correctly and shows appropriate abbreviation
    const game: Poker.NoLimitHand = {
      variant: 'NT' as NoLimitVariant,
      minBet: 2,
      antes: [0, 0],
      blindsOrStraddles: [1, 2],
      startingStacks: [100, 100],
      players: ['Player1', 'Player2'],
      actions: ['d dh p1 ????', 'd dh p2 ????', 'p1 f'],
      table: 'TestTable',
      hand: 555555,
      seats: [1, 2],
      time: '2025-03-27T10:05:49.466Z',
      timeZone: 'America/New_York',
      currency: 'USD',
    };

    const output = stringifyPokerstarsHand(game);
    // Should show the location part as abbreviation
    expect(output).toContain('New_York');
  });

  it('should use hand.year/month/day/time when available', () => {
    // SCENARIO: Hand with explicit date components from PokerStars parser
    // INPUT: Hand with year, month, day, time fields set
    // EXPECTED: Uses these fields directly without conversion
    const game: Poker.NoLimitHand = {
      variant: 'NT' as NoLimitVariant,
      minBet: 2,
      antes: [0, 0],
      blindsOrStraddles: [1, 2],
      startingStacks: [100, 100],
      players: ['Player1', 'Player2'],
      actions: ['d dh p1 ????', 'd dh p2 ????', 'p1 f'],
      table: 'TestTable',
      hand: 777777,
      seats: [1, 2],
      year: 2017,
      month: 8,
      day: 8,
      time: '23:16:30',
      timeZone: 'MSK',
      currency: 'USD',
      venue: 'PokerStars',
    };

    const output = stringifyPokerstarsHand(game);
    expect(output).toContain('2017/08/08 23:16:30 MSK');
  });
});

describe.concurrent(
  'describeHand',
  () => {
    it('should describe high card', () => {
      // SCENARIO: Hand with no pairs or better combinations
      // INPUT: As Kd with low unconnected board
      // EXPECTED: Returns '(high card Ace)'
      expect(describeHand(['As', 'Kd'], ['2c', '5h', '9d', 'Jc', '3s'])).toContain('high card Ace');
    });
    it('should describe one pair', () => {
      // SCENARIO: Hand with exactly one pair
      // INPUT: Pocket aces with unpaired board
      // EXPECTED: Returns '(a pair of Aces)'
      expect(describeHand(['As', 'Ad'], ['2c', '5h', '9d', 'Jc', '3s'])).toContain(
        'a pair of Aces'
      );
    });
    it('should describe two pair', () => {
      // SCENARIO: Hand with two pairs
      // INPUT: Pocket aces with paired board (2s)
      // EXPECTED: Returns '(two pair, Aces and Deuces)'
      expect(describeHand(['As', 'Ad'], ['2c', '2h', '9d', 'Jc', '3s'])).toContain(
        'two pair, Aces and Deuces'
      );
    });
    it('should describe three of a kind', () => {
      // SCENARIO: Hand with three of a kind
      // INPUT: One deuce in hand, two on board
      // EXPECTED: Returns '(three of a kind, Deuces)'
      expect(describeHand(['2s', 'Qd'], ['4c', '2h', '2d', 'Jc', '3s'])).toContain(
        'three of a kind, Deuces'
      );
    });
    it('should describe straight', () => {
      // SCENARIO: Hand making a straight
      // INPUT: A-K with Q-J-T-9-8 board
      // EXPECTED: Returns '(a straight, Ace)'
      expect(describeHand(['As', 'Kd'], ['Qh', 'Jc', 'Th', '9d', '8s'])).toContain(
        'a straight, Ace'
      );
    });
    it('should describe flush', () => {
      // SCENARIO: Hand with five cards of same suit
      // INPUT: As Ks with three more spades on board
      // EXPECTED: Returns '(a flush, Ace high)'
      expect(describeHand(['As', 'Ks'], ['Qs', 'Js', '9s', '3s', '2d'])).toContain(
        'a flush, Ace high'
      );
    });
    it('should describe full house', () => {
      // SCENARIO: Hand with full house
      // INPUT: Pocket aces with trip deuces on board
      // EXPECTED: Returns '(a full house, Deuces full of Aces)'
      expect(describeHand(['As', 'Ad'], ['2c', '2h', '2d', 'Jc', '3s'])).toContain(
        'a full house, Deuces full of Aces'
      );
    });
    it('should describe four of a kind', () => {
      // SCENARIO: Hand with four of a kind
      // INPUT: Pocket aces with all four deuces on board
      // EXPECTED: Returns '(four of a kind, Deuces)'
      expect(describeHand(['As', 'Ad'], ['2c', '2h', '2d', '2s', '3s'])).toContain(
        'four of a kind, Deuces'
      );
    });
    it('should describe straight flush', () => {
      // SCENARIO: Hand with straight flush
      // INPUT: As Ks with Qs-Js-Ts-9s on board
      // EXPECTED: Returns '(a straight flush, Ace)'
      expect(describeHand(['As', 'Ks'], ['Qs', 'Js', 'Ts', '9s', '2d'])).toContain(
        'a straight flush, Ace'
      );
    });
    it('should describe quads', () => {
      // SCENARIO: Hand with four aces (alternate test)
      // INPUT: Pocket aces with two more aces on board
      // EXPECTED: Returns '(four of a kind, Aces)'
      expect(describeHand(['As', 'Ac'], ['Js', 'Ad', 'Ts', 'Ac'])).toContain(
        'four of a kind, Aces'
      );
    });
  },
  10000
);

describe.concurrent('roundtrip known fixtures', () => {
  pokerstarsFixtures.forEach(fixture => {
    test(fixture.title, () => {
      const phh = parseHand(fixture.input);
      expect(phh).toEqual(fixture.output);
      const narrative = stringifyPokerstarsHand(phh);
      const phhRoundtrip = parseHand(narrative);
      expect(phhRoundtrip).toEqual(phh);
    });
  });
});

describe.concurrent('roundtrip narrative -> phh -> narrative -> phh', () => {
  it('should roundtrip a hand', () => {
    const fixture = `PokerStars Hand #253925843587:  Hold'em No Limit ($0.50/$1 USD) - 2024/12/19 12:23:15 ET
Table 'Caubeta' 6-max Seat #2 is the button
Seat 1: Supermegopro ($175.22 in chips)
Seat 2: Aescul@pius ($100 in chips)
Seat 3: CichiChanMarian ($107.62 in chips)
Seat 4: worker0k ($105.48 in chips)
Seat 5: InteRRio ($100 in chips)
Seat 6: lymo1951 ($113.96 in chips)
CichiChanMarian: posts small blind $0.50
worker0k: posts big blind $1
*** HOLE CARDS ***
InteRRio: folds
lymo1951: folds
Supermegopro: folds
Aescul@pius: folds
CichiChanMarian: raises $2 to $3
worker0k: calls $2
*** FLOP *** [9h 9c 6s]
CichiChanMarian: checks
worker0k: bets $1.88
CichiChanMarian: folds
Uncalled bet ($1.88) returned to worker0k
worker0k collected $5.70 from pot
*** SUMMARY ***
Total pot $6 | Rake $0.30
Board [9h 9c 6s]
Seat 1: Supermegopro folded before Flop (didn't bet)
Seat 2: Aescul@pius (button) folded before Flop (didn't bet)
Seat 3: CichiChanMarian (small blind) folded on the Flop
Seat 4: worker0k (big blind) collected ($5.70)
Seat 5: InteRRio folded before Flop (didn't bet)
Seat 6: lymo1951 folded before Flop (didn't bet)`;

    const phh = parseHand(fixture);
    const narrative = stringifyPokerstarsHand(phh);
    const phhRoundtrip = parseHand(narrative);
    expect(phhRoundtrip).toEqual(phh);
  });

  fixtures.forEach(fixture => {
    test(fixture, () => {
      const phh = parseHand(fixture);
      const narrative = stringifyPokerstarsHand(phh);
      const phhRoundtrip = parseHand(narrative);
      expect(phhRoundtrip).toEqual(phh);
    });
  });
});
