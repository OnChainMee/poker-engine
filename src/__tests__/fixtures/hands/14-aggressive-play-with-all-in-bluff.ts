/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import { HandFixture } from '../testHandFixture';

export const fixture: HandFixture = {
  title: '14-aggressive-play-with-all-in-bluff',
  description: `A hand featuring aggressive betting culminating in an all-in bluff.
    Interesting aspects:
    - Multiple streets of betting
    - Escalating bet sizes
    - River all-in bluff
    - Shows proper handling of uncalled bets
    - Tests handling of hidden hole cards when winner doesn't show
    - Demonstrates proper tracking of pot and rake`,
  input: `
PokerStars Hand #174088919486:  Hold'em No Limit (50/100) - 2017/08/08 23:17:57 MSK [2017/08/08 16:17:57 ET]
Table 'Euphemia II' 6-max (Play Money) Seat #4 is the button
Seat 1: adevlupec (53600 in chips)
Seat 2: Dette32 (10745 in chips)
Seat 3: Drug08 (9586 in chips)
Seat 4: FluffyStutt (11276 in chips)
yanksea will be allowed to play after the button
adevlupec: posts small blind 50
Dette32: posts big blind 100
*** HOLE CARDS ***
Dealt to FluffyStutt [8s Qc]
Drug08: calls 100
FluffyStutt: calls 100
adevlupec: folds
Dette32: checks
*** FLOP *** [8c Qh 4c]
Dette32: checks
Drug08: checks
FluffyStutt: bets 332
Dette32: folds
Drug08: calls 332
*** TURN *** [8c Qh 4c] [Ac]
Drug08: checks
FluffyStutt: bets 963
Drug08: calls 963
*** RIVER *** [8c Qh 4c Ac] [Td]
Drug08: checks
FluffyStutt: bets 9881 and is all-in
Drug08: folds
Uncalled bet (9881) returned to FluffyStutt
FluffyStutt collected 2793 from pot
FluffyStutt: doesn't show hand
*** SUMMARY ***
Total pot 2940 | Rake 147
Board [8c Qh 4c Ac Td]
Seat 1: adevlupec (small blind) folded before Flop
Seat 2: Dette32 (big blind) folded on the Flop
Seat 3: Drug08 folded on the River
Seat 4: FluffyStutt (button) collected (2793)
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p3 ????',
      'd dh p4 8sQc',
      'p3 cc',
      'p4 cc',
      'p1 f',
      'p2 cc',
      'd db 8cQh4c',
      'p2 cc',
      'p3 cc',
      'p4 cbr 332',
      'p2 f',
      'p3 cc',
      'd db Ac',
      'p3 cc',
      'p4 cbr 963',
      'p3 cc',
      'd db Td',
      'p3 cc',
      'p4 cbr 9881',
      'p3 f',
    ],
    antes: [0, 0, 0, 0],
    blindsOrStraddles: [50, 100, 0, 0],
    currency: 'PLAY',
    day: 8,
    hand: 174088919486,
    minBet: 100,
    month: 8,
    players: ['adevlupec', 'Dette32', 'Drug08', 'FluffyStutt'],
    rake: 147,
    seatCount: 6,
    seats: [1, 2, 3, 4],
    startingStacks: [53600, 10745, 9586, 11276],
    table: 'Euphemia II',
    time: '2017-08-08T23:17:57',
    timeZone: 'MSK',
    totalPot: 2940,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2017,
    timestamp: 1502223477000,
  },
  game: {
    smallBlindIndex: 0,
    bigBlindIndex: 1,
    players: [
      {
        name: 'adevlupec',
        stack: 53550,
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
        name: 'Dette32',
        stack: 10645,
        position: 1,
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
        name: 'Drug08',
        stack: 8191,
        position: 2,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 1395,
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
        name: 'FluffyStutt',
        stack: 13069,
        position: 3,
        cards: ['8s', 'Qc'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 1395,
        isAllIn: true,
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
    board: ['8c', 'Qh', '4c', 'Ac', 'Td'],
    pot: 2793,
    street: 'river',
    buttonIndex: 3,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 13,
    isBettingComplete: true,
    lastAction: 'p3 f',
    lastBetAction: 'p4 cbr 9881',
    lastPlayerAction: 'p3 f',
    isComplete: true,
    rake: 147,
    rakePercentage: 0,
    table: '1',
    isRunOut: false,
    hand: 14,
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
