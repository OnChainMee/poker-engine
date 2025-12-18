/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import { HandFixture } from '../testHandFixture';

export const fixture: HandFixture = {
  title: '04-flush-vs-pair-showdown',
  description: `A complex hand featuring a flush draw completion and large river raise.
    Interesting aspects:
    - Multiple streets of betting with significant raises
    - Flush draw completes on the river
    - Large river raise and call
    - Shows proper handling of mucked hands in showdown
    - Demonstrates complex pot and rake calculation`,
  input: `
PokerStars Home Game Hand #218543112617: {Club #3225207}  Hold'em No Limit (50/100) - 2020/09/17 17:57:57 ET
Table 'fun time' 9-max (Play Money) Seat #1 is the button
Seat 1: dddocky (4768 in chips)
Seat 2: Duke Croix (8950 in chips)
Seat 3: color_singleton (10000 in chips)
Seat 5: Klemtonius (68607 in chips)
Seat 9: HighCardJasper (18608 in chips)
Duke Croix: posts small blind 50
color_singleton: posts big blind 100
*** HOLE CARDS ***
Dealt to Duke Croix [Td 8s]
Klemtonius: raises 100 to 200
HighCardJasper: calls 200
dddocky: folds
Duke Croix: folds
color_singleton: calls 100
*** FLOP *** [Kc 6c 8c]
color_singleton: checks
Klemtonius: bets 543
HighCardJasper: calls 543
dddocky: folds
color_singleton: folds
*** TURN *** [Kc 6c 8c] [2s]
Klemtonius: checks
HighCardJasper: checks
*** RIVER *** [Kc 6c 8c 2s] [9c]
Klemtonius: bets 1830
HighCardJasper: raises 5730 to 7560
Klemtonius: calls 5730
*** SHOW DOWN ***
HighCardJasper: shows [Jh Ac] (a flush, Ace high)
Klemtonius: mucks hand
HighCardJasper collected 16118 from pot
*** SUMMARY ***
Total pot 17056 | Rake 938
Board [Kc 6c 8c 2s 9c]
Seat 1: dddocky (button) folded on the Flop
Seat 2: Duke Croix (small blind) folded before Flop
Seat 3: color_singleton (big blind) folded on the Flop
Seat 5: Klemtonius mucked [Qc Th]
Seat 9: HighCardJasper showed [Jh Ac] and won (16118) with a flush, Ace high
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 Td8s',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'p4 cbr 200',
      'p5 cc',
      'p1 f',
      'p2 f',
      'p3 cc',
      'd db Kc6c8c',
      'p3 cc',
      'p4 cbr 543',
      'p5 cc',
      'p3 f',
      'd db 2s',
      'p4 cc',
      'p5 cc',
      'd db 9c',
      'p4 cbr 1830',
      'p5 cbr 7560',
      'p4 cc',
      'p5 sm JhAc',
      'p4 sm QcTh',
    ],
    antes: [0, 0, 0, 0, 0],
    blindsOrStraddles: [0, 50, 100, 0, 0],
    currency: 'PLAY',
    day: 17,
    hand: 218543112617,
    minBet: 100,
    month: 9,
    players: ['dddocky', 'Duke Croix', 'color_singleton', 'Klemtonius', 'HighCardJasper'],
    rake: 938,
    seatCount: 9,
    seats: [1, 2, 3, 5, 9],
    startingStacks: [4768, 8950, 10000, 68607, 18608],
    table: 'fun time',
    time: '2020-09-17T17:57:57',
    timeZone: 'ET',
    totalPot: 17056,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2020,
    timestamp: 1600379877000,
  },
  game: {
    smallBlindIndex: 1,
    bigBlindIndex: 2,
    players: [
      {
        name: 'dddocky',
        stack: 4768,
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
        stack: 8900,
        position: 1,
        cards: ['Td', '8s'],
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
        name: 'color_singleton',
        stack: 9800,
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
        stack: 60304,
        position: 3,
        cards: ['Qc', 'Th'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 8303,
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
        name: 'HighCardJasper',
        stack: 26423,
        position: 4,
        cards: ['Jh', 'Ac'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 8303,
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
    board: ['Kc', '6c', '8c', '2s', '9c'],
    street: 'river',
    buttonIndex: 0,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 15,
    isBettingComplete: true,
    lastAction: 'p4 sm QcTh',
    lastBetAction: 'p5 cbr 7560',
    lastPlayerAction: 'p4 cc',
    isComplete: true,
    rake: 938,
    pot: 16118,
    rakePercentage: 0,
    table: '1',
    isRunOut: false,
    hand: 4,
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
