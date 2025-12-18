/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import { HandFixture } from '../testHandFixture';

export const fixture: HandFixture = {
  title: '08-flop-bet-uncalled',
  description: `A hand featuring a flop bet that goes uncalled.
    Interesting aspects:
    - Preflop raise and call
    - Flop bet that goes uncalled
    - Shows proper handling of uncalled bet return
    - Demonstrates pot and rake calculation
    - Tests handling of hidden hole cards`,
  input: `
PokerStars Home Game Hand #218536763033: {Club #3225207}  Hold'em No Limit (50/100) - 2020/09/17 15:03:01 ET
Table 'fun time' 9-max (Play Money) Seat #5 is the button
Seat 1: dddocky (9971 in chips)
Seat 2: Duke Croix (8650 in chips)
Seat 3: color_singleton (7487 in chips)
Seat 5: Klemtonius (12372 in chips)
Seat 9: HighCardJasper (10656 in chips)
HighCardJasper: posts small blind 50
dddocky: posts big blind 100
*** HOLE CARDS ***
Dealt to Duke Croix [8d 5d]
Duke Croix: folds
color_singleton: folds
Klemtonius: calls 100
HighCardJasper: calls 50
dddocky: checks
*** FLOP *** [3h 7s Tc]
HighCardJasper: checks
dddocky: checks
Klemtonius: checks
*** TURN *** [3h 7s Tc] [6d]
HighCardJasper: checks
dddocky: checks
Klemtonius: bets 100
HighCardJasper: calls 100
dddocky: calls 100
*** RIVER *** [3h 7s Tc 6d] [5s]
HighCardJasper: checks
dddocky: checks
Klemtonius: checks
*** SHOW DOWN ***
HighCardJasper: shows [Qh Jh] (high card Queen)
dddocky: shows [4h Qd] (a straight, Three to Seven)
Klemtonius: mucks hand
dddocky collected 567 from pot
*** SUMMARY ***
Total pot 600 | Rake 33
Board [3h 7s Tc 6d 5s]
Seat 1: dddocky (big blind) showed [4h Qd] and won (567) with a straight, Three to Seven
Seat 2: Duke Croix folded before Flop (didn't bet)
Seat 3: color_singleton folded before Flop (didn't bet)
Seat 5: Klemtonius (button) mucked [7c 9d]
Seat 9: HighCardJasper (small blind) showed [Qh Jh] and lost with high card Queen
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 8d5d',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'p2 f',
      'p3 f',
      'p4 cc',
      'p5 cc',
      'p1 cc',
      'd db 3h7sTc',
      'p5 cc',
      'p1 cc',
      'p4 cc',
      'd db 6d',
      'p5 cc',
      'p1 cc',
      'p4 cbr 100',
      'p5 cc',
      'p1 cc',
      'd db 5s',
      'p5 cc',
      'p1 cc',
      'p4 cc',
      'p5 sm QhJh',
      'p1 sm 4hQd',
      'p4 sm 7c9d',
    ],
    antes: [0, 0, 0, 0, 0],
    blindsOrStraddles: [100, 0, 0, 0, 50],
    currency: 'PLAY',
    day: 17,
    hand: 218536763033,
    minBet: 100,
    month: 9,
    players: ['dddocky', 'Duke Croix', 'color_singleton', 'Klemtonius', 'HighCardJasper'],
    rake: 33,
    seatCount: 9,
    seats: [1, 2, 3, 5, 9],
    startingStacks: [9971, 8650, 7487, 12372, 10656],
    table: 'fun time',
    time: '2020-09-17T15:03:01',
    timeZone: 'ET',
    totalPot: 600,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2020,
    timestamp: 1600369381000,
  },
  game: {
    smallBlindIndex: 4,
    bigBlindIndex: 0,
    variant: 'NT',
    venue: 'PokerStars',
    players: [
      {
        name: 'dddocky',
        stack: 10338,
        cards: ['4h', 'Qd'],
        roundBet: 0,
        totalBet: 200,
        hasActed: true,
        hasFolded: false,
        isAllIn: false,
        hasShownCards: true,
        rake: 0,
        winnings: 0,
        position: 0,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'Duke Croix',
        stack: 8650,
        cards: ['8d', '5d'],
        roundBet: 0,
        totalBet: 0,
        hasActed: true,
        hasFolded: true,
        isAllIn: false,
        hasShownCards: null,
        rake: 0,
        winnings: 0,
        position: 1,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'color_singleton',
        stack: 7487,
        cards: ['??', '??'],
        roundBet: 0,
        totalBet: 0,
        hasActed: true,
        hasFolded: true,
        isAllIn: false,
        hasShownCards: null,
        rake: 0,
        winnings: 0,
        position: 2,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'Klemtonius',
        stack: 12172,
        cards: ['7c', '9d'],
        roundBet: 0,
        totalBet: 200,
        hasActed: true,
        hasFolded: false,
        isAllIn: false,
        hasShownCards: true,
        rake: 0,
        winnings: 0,
        position: 3,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'HighCardJasper',
        stack: 10456,
        cards: ['Qh', 'Jh'],
        roundBet: 0,
        totalBet: 200,
        hasActed: true,
        hasFolded: false,
        isAllIn: false,
        hasShownCards: true,
        rake: 0,
        winnings: 0,
        position: 4,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
    ],
    board: ['3h', '7s', 'Tc', '6d', '5s'],
    bet: 0,
    bigBlind: 100,
    buttonIndex: 3,
    street: 'river',
    isBettingComplete: true,
    isComplete: true,
    usedCards: 15,
    rake: 33,
    rakePercentage: 0,
    seed: undefined,
    stats: [],
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
    lastAction: 'p4 sm 7c9d',
    lastPlayerAction: 'p4 cc',
    lastBetAction: undefined,
    pot: 567,
    table: '1',
    isRunOut: false,
    hand: 8,
    isShowdown: false,
  },
};
