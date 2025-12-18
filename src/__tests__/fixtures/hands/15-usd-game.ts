/**
 * @instructions This is a test fixture for validating USD hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import { HandFixture } from '../../..';

export const fixture: HandFixture = {
  title: '15-usd-game',
  description: `A basic USD hand that demonstrates preflop and flop action.
    Interesting aspects:
    - USD currency with decimals
    - 6-max table
    - Multiple preflop folds
    - Uncalled bet return
    - Rake calculation in USD`,
  input: `PokerStars Hand #254023437528:  Hold'em No Limit ($0.50/$1.00 USD) - 2024/12/25 16:00:02 ET
Table 'Euaimon II' 6-max Seat #5 is the button
Seat 1: Alinyr ($123.72 in chips)
Seat 2: kars0n ($100 in chips)
Seat 3: weerdee_bg ($101.16 in chips)
Seat 4: I.Slow.AA ($126.51 in chips)
Seat 5: mikel929292 ($75.16 in chips)
Seat 6: XneferX ($100.50 in chips)
XneferX: posts small blind $0.50
Alinyr: posts big blind $1
*** HOLE CARDS ***
kars0n: folds
weerdee_bg: folds
I.Slow.AA: raises $1 to $2
mikel929292: calls $2
XneferX: folds
Alinyr: folds
*** FLOP *** [3s Js 7d]
I.Slow.AA: checks
mikel929292: bets $4.22
I.Slow.AA: folds
Uncalled bet ($4.22) returned to mikel929292
mikel929292 collected $5.15 from pot
*** SUMMARY ***
Total pot $5.50 | Rake $0.35
Board [3s Js 7d]
Seat 1: Alinyr (big blind) folded before Flop
Seat 2: kars0n folded before Flop (didn't bet)
Seat 3: weerdee_bg folded before Flop (didn't bet)
Seat 4: I.Slow.AA folded on the Flop
Seat 5: mikel929292 (button) collected ($5.15)
Seat 6: XneferX (small blind) folded before Flop`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'd dh p6 ????',
      'p2 f',
      'p3 f',
      'p4 cbr 2',
      'p5 cc',
      'p6 f',
      'p1 f',
      'd db 3sJs7d',
      'p4 cc',
      'p5 cbr 4.22',
      'p4 f',
    ],
    antes: [0, 0, 0, 0, 0, 0],
    blindsOrStraddles: [1, 0, 0, 0, 0, 0.5],
    currency: 'USD',
    day: 25,
    hand: 254023437528,
    minBet: 1,
    month: 12,
    players: ['Alinyr', 'kars0n', 'weerdee_bg', 'I.Slow.AA', 'mikel929292', 'XneferX'],
    rake: 0.35,
    seatCount: 6,
    seats: [1, 2, 3, 4, 5, 6],
    startingStacks: [123.72, 100, 101.16, 126.51, 75.16, 100.5],
    table: 'Euaimon II',
    time: '2024-12-25T16:00:02',
    timeZone: 'ET',
    totalPot: 5.5,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2024,
    timestamp: 1735160402000,
  },
  game: {
    smallBlindIndex: 5,
    bigBlindIndex: 0,
    players: [
      {
        name: 'Alinyr',
        stack: 122.72,
        position: 0,
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
        name: 'kars0n',
        stack: 100,
        position: 1,
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
        name: 'weerdee_bg',
        stack: 101.16,
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
        name: 'I.Slow.AA',
        stack: 124.51,
        position: 3,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 2,
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
        name: 'mikel929292',
        stack: 78.31,
        position: 4,
        cards: ['??', '??'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 2,
        isAllIn: false,
        hasShownCards: null,
        rake: 0.35,
        winnings: 5.15,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'XneferX',
        stack: 100,
        position: 5,
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
    ],
    board: ['3s', 'Js', '7d'],
    pot: 5.15,
    street: 'flop',
    buttonIndex: 4,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 3,
    isBettingComplete: true,
    lastAction: 'p4 f',
    lastBetAction: 'p5 cbr 4.22',
    lastPlayerAction: 'p4 f',
    isComplete: true,
    rake: 0.35,
    rakePercentage: 0,
    table: 'Euaimon II',
    isRunOut: false,
    hand: 254023437528,
    bigBlind: 1,
    stats: [],
    isShowdown: false,
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
  },
};
