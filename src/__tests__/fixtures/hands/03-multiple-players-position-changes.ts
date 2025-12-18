/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import { HandFixture } from '../testHandFixture';

export const fixture: HandFixture = {
  title: '03-multiple-players-position-changes',
  description: `A complex hand with multiple position changes and a large multiway pot.
    Interesting aspects:
    - Five players involved in the hand
    - Multiple position changes with button, SB, BB
    - Large multiway pot with multiple callers
    - Demonstrates proper position tracking
    - Shows handling of uncalled bet return
    - Winner doesn't show cards`,
  input: `
PokerStars Home Game Hand #218536523116: {Club #3225207}  Hold'em No Limit (50/100) - 2020/09/17 14:54:58 ET
Table 'fun time' 9-max (Play Money) Seat #2 is the button
Seat 1: dddocky (10039 in chips)
Seat 2: Duke Croix (9650 in chips)
Seat 3: color_singleton (9600 in chips)
Seat 5: Klemtonius (11159 in chips)
Seat 9: HighCardJasper (9389 in chips)
color_singleton: posts small blind 50
Klemtonius: posts big blind 100
*** HOLE CARDS ***
Dealt to Duke Croix [9s 7s]
HighCardJasper: calls 100
dddocky: calls 100
Duke Croix: calls 100
color_singleton: calls 50
Klemtonius: raises 100 to 200
HighCardJasper: calls 100
dddocky: calls 100
Duke Croix: calls 100
color_singleton: calls 100
*** FLOP *** [2c 8c 3d]
color_singleton: checks
Klemtonius: bets 945
HighCardJasper: folds
dddocky: folds
Duke Croix: folds
color_singleton: folds
Uncalled bet (945) returned to Klemtonius
Klemtonius collected 945 from pot
Klemtonius: doesn't show hand
*** SUMMARY ***
Total pot 1000 | Rake 55
Board [2c 8c 3d]
Seat 1: dddocky folded on the Flop
Seat 2: Duke Croix (button) folded on the Flop
Seat 3: color_singleton (small blind) folded on the Flop
Seat 5: Klemtonius (big blind) collected (945)
Seat 9: HighCardJasper folded on the Flop
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 9s7s',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'p5 cc',
      'p1 cc',
      'p2 cc',
      'p3 cc',
      'p4 cbr 200',
      'p5 cc',
      'p1 cc',
      'p2 cc',
      'p3 cc',
      'd db 2c8c3d',
      'p3 cc',
      'p4 cbr 945',
      'p5 f',
      'p1 f',
      'p2 f',
      'p3 f',
    ],
    antes: [0, 0, 0, 0, 0],
    blindsOrStraddles: [0, 0, 50, 100, 0],
    currency: 'PLAY',
    day: 17,
    hand: 218536523116,
    minBet: 100,
    month: 9,
    players: ['dddocky', 'Duke Croix', 'color_singleton', 'Klemtonius', 'HighCardJasper'],
    rake: 55,
    seatCount: 9,
    seats: [1, 2, 3, 5, 9],
    startingStacks: [10039, 9650, 9600, 11159, 9389],
    table: 'fun time',
    time: '2020-09-17T14:54:58',
    timeZone: 'ET',
    totalPot: 1000,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2020,
    timestamp: 1600368898000,
  },
  game: {
    smallBlindIndex: 2,
    bigBlindIndex: 3,
    players: [
      {
        name: 'dddocky',
        stack: 9839,
        position: 0,
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
        name: 'Duke Croix',
        stack: 9450,
        position: 1,
        cards: ['9s', '7s'],
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
        name: 'color_singleton',
        stack: 9400,
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
        stack: 11904,
        position: 3,
        cards: ['??', '??'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 1145,
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
        stack: 9189,
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
    board: ['2c', '8c', '3d'],
    street: 'flop',
    buttonIndex: 1,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 13,
    isBettingComplete: true,
    lastAction: 'p3 f',
    lastBetAction: 'p4 cbr 945',
    lastPlayerAction: 'p3 f',
    isComplete: true,
    rake: 55,
    pot: 945,
    rakePercentage: 0,
    table: '1',
    isRunOut: false,
    hand: 3,
    bigBlind: 100,
    stats: [],
    isShowdown: false,
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
  },
};
