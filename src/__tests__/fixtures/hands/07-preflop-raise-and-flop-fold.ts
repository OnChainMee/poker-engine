/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import { HandFixture } from '../testHandFixture';

export const fixture: HandFixture = {
  title: '07-preflop-raise-and-flop-fold',
  description: `A hand featuring a significant preflop raise followed by a flop bet.
    Interesting aspects:
    - Large preflop raise with multiple callers
    - Significant flop bet wins without showdown
    - Shows proper handling of uncalled bets
    - Demonstrates tracking of pot size with rake
    - Tests handling of hidden hole cards when winner doesn't show`,
  input: `
PokerStars Home Game Hand #218536734398: {Club #3225207}  Hold'em No Limit (50/100) - 2020/09/17 15:02:31 ET
Table 'fun time' 9-max (Play Money) Seat #3 is the button
Seat 1: dddocky (10071 in chips)
Seat 2: Duke Croix (9150 in chips)
Seat 3: color_singleton (7487 in chips)
Seat 5: Klemtonius (11371 in chips)
Seat 9: HighCardJasper (10756 in chips)
Klemtonius: posts small blind 50
HighCardJasper: posts big blind 100
*** HOLE CARDS ***
Dealt to Duke Croix [Kd Qs]
dddocky: calls 100
Duke Croix: raises 400 to 500
color_singleton: folds
Klemtonius: calls 450
HighCardJasper: folds
dddocky: folds
*** FLOP *** [Jd Ac 7c]
Klemtonius: bets 567
Duke Croix: folds
Uncalled bet (567) returned to Klemtonius
Klemtonius collected 1134 from pot
Klemtonius: doesn't show hand
*** SUMMARY ***
Total pot 1200 | Rake 66
Board [Jd Ac 7c]
Seat 1: dddocky folded before Flop
Seat 2: Duke Croix folded on the Flop
Seat 3: color_singleton (button) folded before Flop (didn't bet)
Seat 5: Klemtonius (small blind) collected (1134)
Seat 9: HighCardJasper (big blind) folded before Flop
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 KdQs',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'p1 cc',
      'p2 cbr 500',
      'p3 f',
      'p4 cc',
      'p5 f',
      'p1 f',
      'd db JdAc7c',
      'p4 cbr 567',
      'p2 f',
    ],
    antes: [0, 0, 0, 0, 0],
    blindsOrStraddles: [0, 0, 0, 50, 100],
    currency: 'PLAY',
    day: 17,
    hand: 218536734398,
    minBet: 100,
    month: 9,
    players: ['dddocky', 'Duke Croix', 'color_singleton', 'Klemtonius', 'HighCardJasper'],
    rake: 66,
    seatCount: 9,
    seats: [1, 2, 3, 5, 9],
    startingStacks: [10071, 9150, 7487, 11371, 10756],
    table: 'fun time',
    time: '2020-09-17T15:02:31',
    timeZone: 'ET',
    totalPot: 1200,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2020,
    timestamp: 1600369351000,
  },
  game: {
    smallBlindIndex: 3,
    bigBlindIndex: 4,
    players: [
      {
        name: 'dddocky',
        stack: 9971,
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
        stack: 8650,
        position: 1,
        cards: ['Kd', 'Qs'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 500,
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
        name: 'Klemtonius',
        stack: 12505,
        position: 3,
        cards: ['??', '??'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 500,
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
    ],
    board: ['Jd', 'Ac', '7c'],
    street: 'flop',
    buttonIndex: 2,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 13,
    isBettingComplete: true,
    lastAction: 'p2 f',
    lastBetAction: 'p4 cbr 567',
    lastPlayerAction: 'p2 f',
    isComplete: true,
    rake: 66,
    pot: 1134,
    rakePercentage: 0,
    table: '1',
    isRunOut: false,
    hand: 7,
    bigBlind: 100,
    minBet: 100,
    lastCompleteBet: 100,
    seatCount: 9,
    isPlayable: true,
    stats: [],
    isShowdown: false,
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
  },
};
