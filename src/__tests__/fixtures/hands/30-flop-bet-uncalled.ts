/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import type { HandFixture } from '../testHandFixture';

export const fixture: HandFixture = {
  title: '30-flop-bet-uncalled',
  description: `A hand featuring a preflop 3-bet and uncalled flop bet.
    Interesting aspects:
    - Preflop 3-bet and call
    - Paired board on flop
    - Substantial flop bet that goes uncalled
    - Hand ends on flop without showdown`,
  input: `PokerStars Hand #252659467309:  Hold'em No Limit ($0.50/$1.00 USD) - 2024/09/27 16:45:54 ET
Table 'Benguella III' 6-max Seat #5 is the button
Seat 1: MaikonAll ($139.63 in chips)
Seat 2: CMACK7777 ($111.41 in chips)
Seat 3: 1Kidneywonder ($122.77 in chips)
Seat 4: Riesa82 ($102.88 in chips)
Seat 5: zulginn ($136.82 in chips)
Seat 6: tintin641 ($245.27 in chips)
tintin641: posts small blind $0.50
MaikonAll: posts big blind $1
*** HOLE CARDS ***
CMACK7777: folds
1Kidneywonder: raises $2 to $3
Riesa82: folds
zulginn: raises $6 to $9
tintin641: folds
MaikonAll: folds
1Kidneywonder: calls $6
*** FLOP *** [Kh 6h 6c]
zulginn: bets $34.50
1Kidneywonder: folds
Uncalled bet ($34.50) returned to zulginn
zulginn collected $75.84 from pot
*** SUMMARY ***
Total pot $78.34 | Rake $2.50
Board [Kh 6h 6c]
Seat 1: MaikonAll (big blind) folded before Flop
Seat 2: CMACK7777 folded before Flop (didn't bet)
Seat 3: 1Kidneywonder folded on the Flop
Seat 4: Riesa82 folded before Flop (didn't bet)
Seat 5: zulginn (button) collected ($75.84)
Seat 6: tintin641 (small blind) folded before Flop`,
  output: {
    variant: 'NT',
    venue: 'PokerStars',
    antes: [0, 0, 0, 0, 0, 0],
    blindsOrStraddles: [1, 0, 0, 0, 0, 0.5],
    startingStacks: [139.63, 111.41, 122.77, 102.88, 136.82, 245.27],
    players: ['MaikonAll', 'CMACK7777', '1Kidneywonder', 'Riesa82', 'zulginn', 'tintin641'],
    time: '2024-09-27T12:45:54',
    timeZone: 'ET',
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'd dh p6 ????',
      'p2 f',
      'p3 cbr 3',
      'p4 f',
      'p5 cbr 9',
      'p6 f',
      'p1 f',
      'p3 cc',
      'd db Kh6h6c',
      // missing p3 cc
      'p5 cbr 34.5',
      'p3 f',
    ],
    currency: 'USD',
    seatCount: 6,
    day: 27,
    month: 9,
    year: 2024,
    hand: 252659467309,
    rake: 2.5,
    totalPot: 78.34,
    minBet: 1.0,
  },
  game: {
    players: [
      {
        name: 'MaikonAll',
        stack: 138.63,
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
        name: 'CMACK7777',
        stack: 111.41,
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
        name: '1Kidneywonder',
        stack: 113.77,
        position: 2,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 9,
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
        name: 'Riesa82',
        stack: 102.88,
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
        name: 'zulginn',
        stack: 194.66,
        position: 4,
        cards: ['??', '??'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 9,
        isAllIn: false,
        hasShownCards: null,
        rake: 0,
        winnings: 75.84,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'tintin641',
        stack: 244.77,
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
    board: ['Kh', '6h', '6c'],
    street: 'flop',
    buttonIndex: 4,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 9,
    isBettingComplete: true,
    lastAction: 'p3 f',
    lastBetAction: 'p5 cbr 34.5',
    lastPlayerAction: 'p3 f',
    isComplete: true,
    rake: 2.5,
    pot: 75.84,
    rakePercentage: 0,
    table: 'Benguella III',
    hand: 30,
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
    smallBlindIndex: 5,
    bigBlindIndex: 0,
  },
};
