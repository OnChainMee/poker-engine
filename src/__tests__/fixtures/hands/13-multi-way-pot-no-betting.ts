/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import { HandFixture } from '../testHandFixture';

export const fixture: HandFixture = {
  title: '13-multi-way-pot-no-betting',
  description: `A hand featuring a multi-way pot with no betting action.
    Interesting aspects:
    - Multiple players seeing all streets
    - Check-down through all streets
    - Shows proper handling of chat messages
    - Tests handling of mucked hands at showdown
    - Demonstrates proper tracking of pot and rake
    - Tests handling of revealed mucked hands`,
  input: `
PokerStars Hand #174088855475:  Hold'em No Limit (50/100) - 2017/08/08 23:16:30 MSK [2017/08/08 16:16:30 ET]
Table 'Euphemia II' 6-max (Play Money) Seat #3 is the button
Seat 1: adevlupec (53368 in chips)
Seat 2: Dette32 (10845 in chips)
Seat 3: Drug08 (9686 in chips)
Seat 4: FluffyStutt (11326 in chips)
FluffyStutt: posts small blind 50
adevlupec: posts big blind 100
*** HOLE CARDS ***
Dealt to FluffyStutt [2h Ks]
FluffyStutt said, "nh"
Dette32: calls 100
Drug08: calls 100
FluffyStutt: folds
adevlupec: checks
*** FLOP *** [8h 7s 8d]
adevlupec: checks
Dette32: checks
Drug08: checks
*** TURN *** [8h 7s 8d] [Th]
adevlupec: checks
Dette32: checks
Drug08: checks
*** RIVER *** [8h 7s 8d Th] [2c]
adevlupec: checks
Dette32: checks
Drug08: checks
*** SHOW DOWN ***
adevlupec: shows [Qs Ts] (two pair, Tens and Eights)
Dette32: mucks hand
Drug08: mucks hand
adevlupec collected 332 from pot
*** SUMMARY ***
Total pot 350 | Rake 18
Board [8h 7s 8d Th 2c]
Seat 1: adevlupec (big blind) showed [Qs Ts] and won (332) with two pair, Tens and Eights
Seat 2: Dette32 mucked [5s Kc]
Seat 3: Drug08 (button) mucked [4d 6h]
Seat 4: FluffyStutt (small blind) folded before Flop
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p3 ????',
      'd dh p4 2hKs',
      'p4 m nh',
      'p2 cc',
      'p3 cc',
      'p4 f',
      'p1 cc',
      'd db 8h7s8d',
      'p1 cc',
      'p2 cc',
      'p3 cc',
      'd db Th',
      'p1 cc',
      'p2 cc',
      'p3 cc',
      'd db 2c',
      'p1 cc',
      'p2 cc',
      'p3 cc',
      'p1 sm QsTs',
      'p2 sm 5sKc',
      'p3 sm 4d6h',
    ],
    antes: [0, 0, 0, 0],
    blindsOrStraddles: [100, 0, 0, 50],
    currency: 'PLAY',
    day: 8,
    hand: 174088855475,
    minBet: 100,
    month: 8,
    players: ['adevlupec', 'Dette32', 'Drug08', 'FluffyStutt'],
    rake: 18,
    seatCount: 6,
    seats: [1, 2, 3, 4],
    startingStacks: [53368, 10845, 9686, 11326],
    table: 'Euphemia II',
    time: '2017-08-08T23:16:30',
    timeZone: 'MSK',
    totalPot: 350,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2017,
    timestamp: 1502223390000,
  },
  game: {
    smallBlindIndex: 3,
    bigBlindIndex: 1,
    players: [
      {
        name: 'adevlupec',
        stack: 53600,
        position: 0,
        cards: ['Qs', 'Ts'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 100,
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
        name: 'Dette32',
        stack: 10745,
        position: 1,
        cards: ['5s', 'Kc'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 100,
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
        name: 'Drug08',
        stack: 9586,
        position: 2,
        cards: ['4d', '6h'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 100,
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
        name: 'FluffyStutt',
        stack: 11276,
        position: 3,
        cards: ['2h', 'Ks'],
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
    ],
    board: ['8h', '7s', '8d', 'Th', '2c'],
    pot: 332,
    street: 'river',
    buttonIndex: 2,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 13,
    isBettingComplete: true,
    lastAction: 'p3 sm 4d6h',
    lastBetAction: undefined,
    lastPlayerAction: 'p3 sm 4d6h',
    isComplete: true,
    rake: 18,
    rakePercentage: 0,
    table: '1',
    isRunOut: false,
    hand: 13,
    bigBlind: 100,
    stats: [],
    isShowdown: false,
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
  },
};
