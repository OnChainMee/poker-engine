/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import type { HandFixture } from '../testHandFixture';

export const fixture: HandFixture = {
  title: '29-timeout-fold-river',
  description: `A hand featuring player timing out and folding on the river.
    Interesting aspects:
    - Multiple timeout notifications in hand history
    - Player folds after timeout on river
    - Pot awarded without showdown
    - Uncalled bet returned to player`,
  input: `PokerStars Hand #252308736199:  Hold'em No Limit ($0.50/$1.00 USD) - 2024/09/05 18:30:28 ET
Table 'Jole II' 6-max Seat #1 is the button
Seat 1: murtazg ($100 in chips)
Seat 2: shootingGRID ($100 in chips)
Seat 3: andutu34 ($100 in chips)
Seat 4: XneferX ($246.95 in chips)
Seat 5: AlexPinsk1 ($130.88 in chips)
Seat 6: Learto1x2bet ($61.94 in chips)
shootingGRID: posts small blind $0.50
andutu34: posts big blind $1
*** HOLE CARDS ***
XneferX: folds
AlexPinsk1: folds
Learto1x2bet: calls $1
murtazg: folds
shootingGRID: folds
andutu34: checks
*** FLOP *** [5h 2c Ts]
andutu34: checks
Learto1x2bet: checks
*** TURN *** [5h 2c Ts] [Jh]
andutu34 has timed out
andutu34: checks
Learto1x2bet: checks
*** RIVER *** [5h 2c Ts Jh] [3d]
andutu34 has timed out
andutu34: checks
andutu34 has timed out
andutu34: folds
Uncalled bet ($2) returned to Learto1x2bet
Learto1x2bet collected $2.38 from pot
*** SUMMARY ***
Total pot $2.50 | Rake $0.12
Board [5h 2c Ts Jh 3d]
Seat 1: murtazg (button) folded before Flop (didn't bet)
Seat 2: shootingGRID (small blind) folded before Flop
Seat 3: andutu34 (big blind) folded on the River
Seat 4: XneferX folded before Flop (didn't bet)
Seat 5: AlexPinsk1 folded before Flop (didn't bet)
Seat 6: Learto1x2bet collected ($2.38)`,
  output: {
    variant: 'NT',
    venue: 'PokerStars',
    antes: [0, 0, 0, 0, 0, 0],
    blindsOrStraddles: [0, 0.5, 1, 0, 0, 0],
    startingStacks: [100, 100, 100, 246.95, 130.88, 61.94],
    players: ['murtazg', 'shootingGRID', 'andutu34', 'XneferX', 'AlexPinsk1', 'Learto1x2bet'],
    time: '2024-09-05T14:30:28',
    timeZone: 'ET',
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'd dh p6 ????',
      'p4 f',
      'p5 f',
      'p6 cc',
      'p1 f',
      'p2 f',
      'p3 cc',
      'd db 5h2cTs',
      'p3 cc',
      'p6 cc',
      'd db Jh',
      'p3 cc',
      'p6 cc',
      'd db 3d',
      'p3 cc',
      'p3 f',
    ],
    currency: 'USD',
    seatCount: 6,
    day: 5,
    month: 9,
    year: 2024,
    hand: 252308736199,
    rake: 0.12,
    totalPot: 2.5,
    minBet: 1.0,
  },
  game: {
    players: [
      {
        name: 'murtazg',
        stack: 100,
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
        name: 'shootingGRID',
        stack: 99.5,
        position: 1,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 0.5,
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
        name: 'andutu34',
        stack: 99,
        position: 2,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 1,
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
        name: 'XneferX',
        stack: 246.95,
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
        name: 'AlexPinsk1',
        stack: 130.88,
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
      {
        name: 'Learto1x2bet',
        stack: 63.32,
        position: 5,
        cards: ['??', '??'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 1,
        isAllIn: false,
        hasShownCards: null,
        rake: 0,
        winnings: 2.38,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
    ],
    board: ['5h', '2c', 'Ts', 'Jh', '3d'],
    street: 'river',
    buttonIndex: 0,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 11,
    isBettingComplete: true,
    lastAction: 'p3 f',
    lastBetAction: '',
    lastPlayerAction: 'p3 f',
    isComplete: true,
    rake: 0.12,
    pot: 2.38,
    rakePercentage: 0,
    table: 'Jole II',
    hand: 29,
    isRunOut: false,
    bigBlind: 1,
    minBet: 1,
    lastCompleteBet: 1,
    seatCount: 9,
    isPlayable: true,
    stats: [],
    isShowdown: false,
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
    smallBlindIndex: 1,
    bigBlindIndex: 2,
  },
};
