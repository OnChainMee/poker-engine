/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import { HandFixture } from '../testHandFixture';

export const fixture: HandFixture = {
  title: '05-pair-of-aces-showdown',
  description: `A hand featuring preflop raise and multiple streets of betting.
    Interesting aspects:
    - Preflop raise with multiple callers
    - Player times out during action
    - Multiple streets of betting with moderate sizing
    - Ace on turn changes dynamics
    - Shows proper handling of mucked hands at showdown
    - Demonstrates proper tracking of betting rounds`,
  input: `
PokerStars Home Game Hand #218536676856: {Club #3225207}  Hold'em No Limit (50/100) - 2020/09/17 15:00:47 ET
Table 'fun time' 9-max (Play Money) Seat #1 is the button
Seat 1: dddocky (10171 in chips)
Seat 2: Duke Croix (9250 in chips)
Seat 3: color_singleton (8687 in chips)
Seat 5: Klemtonius (11371 in chips)
Seat 9: HighCardJasper (9877 in chips)
Duke Croix: posts small blind 50
color_singleton: posts big blind 100
*** HOLE CARDS ***
Dealt to Duke Croix [Kd 6h]
Klemtonius: folds
HighCardJasper: calls 100
dddocky: calls 100
Duke Croix: calls 50
color_singleton: raises 200 to 300
HighCardJasper: calls 200
dddocky: folds
Duke Croix has timed out
Duke Croix: folds
*** FLOP *** [Jh 4d Qd]
color_singleton: checks
HighCardJasper: checks
*** TURN *** [Jh 4d Qd] [Ad]
color_singleton: checks
HighCardJasper: bets 300
color_singleton: calls 300
*** RIVER *** [Jh 4d Qd Ad] [9c]
color_singleton: checks
HighCardJasper: bets 400
color_singleton: calls 400
*** SHOW DOWN ***
HighCardJasper: shows [Th Ac] (a pair of Aces)
color_singleton: mucks hand
HighCardJasper collected 2079 from pot
*** SUMMARY ***
Total pot 2200 | Rake 121
Board [Jh 4d Qd Ad 9c]
Seat 1: dddocky (button) folded before Flop
Seat 2: Duke Croix (small blind) folded before Flop
Seat 3: color_singleton (big blind) mucked [3s As]
Seat 5: Klemtonius folded before Flop (didn't bet)
Seat 9: HighCardJasper showed [Th Ac] and won (2079) with a pair of Aces
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 Kd6h',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'p4 f',
      'p5 cc',
      'p1 cc',
      'p2 cc',
      'p3 cbr 300',
      'p5 cc',
      'p1 f',
      'p2 f',
      'd db Jh4dQd',
      'p3 cc',
      'p5 cc',
      'd db Ad',
      'p3 cc',
      'p5 cbr 300',
      'p3 cc',
      'd db 9c',
      'p3 cc',
      'p5 cbr 400',
      'p3 cc',
      'p5 sm ThAc',
      'p3 sm 3sAs',
    ],
    antes: [0, 0, 0, 0, 0],
    blindsOrStraddles: [0, 50, 100, 0, 0],
    currency: 'PLAY',
    day: 17,
    hand: 218536676856,
    minBet: 100,
    month: 9,
    players: ['dddocky', 'Duke Croix', 'color_singleton', 'Klemtonius', 'HighCardJasper'],
    rake: 121,
    seatCount: 9,
    seats: [1, 2, 3, 5, 9],
    startingStacks: [10171, 9250, 8687, 11371, 9877],
    table: 'fun time',
    time: '2020-09-17T15:00:47',
    timeZone: 'ET',
    totalPot: 2200,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2020,
    timestamp: 1600369247000,
  },
  game: {
    smallBlindIndex: 1,
    bigBlindIndex: 2,
    players: [
      {
        name: 'dddocky',
        stack: 10071,
        position: 0,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 100,
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
        cards: ['Kd', '6h'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 100,
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
        stack: 7687,
        position: 2,
        cards: ['3s', 'As'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 1000,
        isAllIn: false,
        hasShownCards: true,
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
        stack: 11371,
        position: 3,
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
        name: 'HighCardJasper',
        stack: 10956,
        position: 4,
        cards: ['Th', 'Ac'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 1000,
        isAllIn: false,
        hasShownCards: true,
        rake: 0,
        winnings: 0,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
    ],
    board: ['Jh', '4d', 'Qd', 'Ad', '9c'],
    street: 'river',
    buttonIndex: 0,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 15,
    isBettingComplete: true,
    lastAction: 'p3 sm 3sAs',
    lastBetAction: 'p5 cbr 400',
    lastPlayerAction: 'p3 cc',
    isComplete: true,
    rake: 121,
    pot: 2079,
    rakePercentage: 0,
    table: '1',
    isRunOut: false,
    hand: 5,
    bigBlind: 100,
    stats: [],
    isShowdown: false,
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
  },
};
