/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import { HandFixture } from '../testHandFixture';

export const fixture: HandFixture = {
  title: '09-three-diamond-flop-quick-fold',
  description: `A hand featuring a monotone flop that leads to quick action.
    Interesting aspects:
    - Three diamonds on flop changes dynamics
    - Quick bet and fold sequence
    - Shows proper handling of uncalled bets
    - Demonstrates tracking of pot size with rake
    - Tests handling of hidden hole cards in quick fold situation`,
  input: `
PokerStars Home Game Hand #218536795492: {Club #3225207}  Hold'em No Limit (50/100) - 2020/09/17 15:03:55 ET
Table 'fun time' 9-max (Play Money) Seat #9 is the button
Seat 1: dddocky (10338 in chips)
Seat 2: Duke Croix (8650 in chips)
Seat 3: color_singleton (7487 in chips)
Seat 5: Klemtonius (12172 in chips)
Seat 9: HighCardJasper (10456 in chips)
dddocky: posts small blind 50
Duke Croix: posts big blind 100
*** HOLE CARDS ***
Dealt to Duke Croix [Ad 7s]
color_singleton: folds
Klemtonius: raises 100 to 200
HighCardJasper: folds
dddocky: folds
Duke Croix: calls 100
*** FLOP *** [5d 4d 7d]
Duke Croix: bets 300
Klemtonius: folds
Uncalled bet (300) returned to Duke Croix
Duke Croix collected 425 from pot
*** SUMMARY ***
Total pot 450 | Rake 25
Board [5d 4d 7d]
Seat 1: dddocky (small blind) folded before Flop
Seat 2: Duke Croix (big blind) collected (425)
Seat 3: color_singleton folded before Flop (didn't bet)
Seat 5: Klemtonius folded on the Flop
Seat 9: HighCardJasper (button) folded before Flop (didn't bet)
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 Ad7s',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'p3 f',
      'p4 cbr 200',
      'p5 f',
      'p1 f',
      'p2 cc',
      'd db 5d4d7d',
      'p2 cbr 300',
      'p4 f',
    ],
    antes: [0, 0, 0, 0, 0],
    blindsOrStraddles: [50, 100, 0, 0, 0],
    currency: 'PLAY',
    day: 17,
    hand: 218536795492,
    minBet: 100,
    month: 9,
    players: ['dddocky', 'Duke Croix', 'color_singleton', 'Klemtonius', 'HighCardJasper'],
    rake: 25,
    seatCount: 9,
    seats: [1, 2, 3, 5, 9],
    startingStacks: [10338, 8650, 7487, 12172, 10456],
    table: 'fun time',
    time: '2020-09-17T15:03:55',
    timeZone: 'ET',
    totalPot: 450,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2020,
    timestamp: 1600369435000,
  },
  game: {
    smallBlindIndex: 0,
    bigBlindIndex: 1,
    players: [
      {
        name: 'dddocky',
        stack: 9871,
        position: 0,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 50,
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
        stack: 8975,
        position: 1,
        cards: ['Ad', '7s'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 300,
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
        stack: 12172,
        position: 3,
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
        name: 'HighCardJasper',
        stack: 10606,
        position: 4,
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
    ],
    board: ['5d', '4d', '7d'],
    pot: 425,
    street: 'flop',
    buttonIndex: 4,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 15,
    isBettingComplete: true,
    lastAction: 'p4 f',
    lastBetAction: 'p2 cbr 300',
    lastPlayerAction: 'p4 f',
    isComplete: true,
    rake: 25,
    rakePercentage: 0,
    table: '1',
    isRunOut: false,
    hand: 9,
    bigBlind: 100,
    stats: [],
    isShowdown: false,
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
  },
};
