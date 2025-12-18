/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import { HandFixture } from '../testHandFixture';

export const fixture: HandFixture = {
  title: '06-small-turn-bet-takes-it-down',
  description: `A hand featuring a small turn bet that wins without showdown.
    Interesting aspects:
    - Multiple players seeing flop
    - Small bet relative to pot wins the hand
    - Shows proper handling of uncalled bets
    - Demonstrates tracking of pot size with rake
    - Tests handling of hidden hole cards`,
  input: `
PokerStars Home Game Hand #218536710696: {Club #3225207}  Hold'em No Limit (50/100) - 2020/09/17 15:01:50 ET
Table 'fun time' 9-max (Play Money) Seat #2 is the button
Seat 1: dddocky (10071 in chips)
Seat 2: Duke Croix (9150 in chips)
Seat 3: color_singleton (7687 in chips)
Seat 5: Klemtonius (11371 in chips)
Seat 9: HighCardJasper (10956 in chips)
color_singleton: posts small blind 50
Klemtonius: posts big blind 100
*** HOLE CARDS ***
Dealt to Duke Croix [Qc 4c]
HighCardJasper: calls 100
dddocky: folds
Duke Croix: folds
color_singleton: calls 50
Klemtonius: raises 100 to 200
HighCardJasper: calls 100
color_singleton: calls 100
*** FLOP *** [Ah Ad 3s]
color_singleton: checks
Klemtonius: checks
HighCardJasper: checks
*** TURN *** [Ah Ad 3s] [Qs]
color_singleton: checks
Klemtonius: bets 100
HighCardJasper: folds
color_singleton: folds
Uncalled bet (100) returned to Klemtonius
Klemtonius collected 567 from pot
Klemtonius: doesn't show hand
*** SUMMARY ***
Total pot 600 | Rake 33
Board [Ah Ad 3s Qs]
Seat 1: dddocky folded before Flop (didn't bet)
Seat 2: Duke Croix (button) folded before Flop (didn't bet)
Seat 3: color_singleton (small blind) folded on the Turn
Seat 5: Klemtonius (big blind) collected (567)
Seat 9: HighCardJasper folded on the Turn
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 Qc4c',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'p5 cc',
      'p1 f',
      'p2 f',
      'p3 cc',
      'p4 cbr 200',
      'p5 cc',
      'p3 cc',
      'd db AhAd3s',
      'p3 cc',
      'p4 cc',
      'p5 cc',
      'd db Qs',
      'p3 cc',
      'p4 cbr 100',
      'p5 f',
      'p3 f',
    ],
    antes: [0, 0, 0, 0, 0],
    blindsOrStraddles: [0, 0, 50, 100, 0],
    currency: 'PLAY',
    day: 17,
    hand: 218536710696,
    minBet: 100,
    month: 9,
    players: ['dddocky', 'Duke Croix', 'color_singleton', 'Klemtonius', 'HighCardJasper'],
    rake: 33,
    seatCount: 9,
    seats: [1, 2, 3, 5, 9],
    startingStacks: [10071, 9150, 7687, 11371, 10956],
    table: 'fun time',
    time: '2020-09-17T15:01:50',
    timeZone: 'ET',
    totalPot: 600,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2020,
    timestamp: 1600369310000,
  },
  game: {
    smallBlindIndex: 2,
    bigBlindIndex: 3,
    players: [
      {
        name: 'dddocky',
        stack: 10071,
        position: 0,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 0,
        isAllIn: false,
        hasShownCards: null,
        rake: 0,
        winnings: 0,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'Duke Croix',
        stack: 9150,
        position: 1,
        cards: ['Qc', '4c'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 0,
        isAllIn: false,
        hasShownCards: null,
        rake: 0,
        winnings: 0,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'color_singleton',
        stack: 7487,
        position: 2,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 200,
        isAllIn: false,
        hasShownCards: null,
        rake: 0,
        winnings: 0,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'Klemtonius',
        stack: 11838,
        position: 3,
        cards: ['??', '??'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 200,
        isAllIn: false,
        hasShownCards: null,
        rake: 0,
        winnings: 0,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'HighCardJasper',
        stack: 10656,
        position: 4,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 200,
        isAllIn: false,
        hasShownCards: null,
        rake: 0,
        winnings: 0,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
    ],
    board: ['Ah', 'Ad', '3s', 'Qs'],
    street: 'turn',
    buttonIndex: 1,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 14,
    isBettingComplete: true,
    lastAction: 'p3 f',
    lastBetAction: 'p4 cbr 100',
    lastPlayerAction: 'p3 f',
    isComplete: true,
    rake: 33,
    pot: 567,
    rakePercentage: 0,
    table: '1',
    isRunOut: false,
    hand: 6,
    bigBlind: 100,
    stats: [],
    isShowdown: false,
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
  },
};
