/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import type { HandFixture } from '../testHandFixture';

export const fixture: HandFixture = {
  title: '31-preflop-everyone-folds',
  description: `A simple hand where everyone folds to a preflop raise.
    Interesting aspects:
    - Preflop raise wins without further action
    - No rake taken
    - No flop or further streets dealt
    - Simple action sequence`,
  input: `PokerStars Hand #249074114628:  Hold'em No Limit ($0.50/$1.00 USD) - 2024/02/24 17:35:26 ET
Table 'Humason III' 6-max Seat #5 is the button
Seat 1: pocketgulls ($101.50 in chips)
Seat 2: MatiasCampos :v ($290.39 in chips)
Seat 3: dokl93 ($122.32 in chips)
Seat 4: MrNeverLucky4 ($100 in chips)
Seat 5: tann2k ($213.44 in chips)
Seat 6: kwazer7 ($130.68 in chips)
kwazer7: posts small blind $0.50
pocketgulls: posts big blind $1
*** HOLE CARDS ***
MatiasCampos :v: raises $2 to $3
dokl93: folds
MrNeverLucky4: folds
tann2k: folds
kwazer7: folds
pocketgulls: folds
Uncalled bet ($2) returned to MatiasCampos :v
MatiasCampos :v collected $2.50 from pot
*** SUMMARY ***
Total pot $2.50 | Rake $0
Seat 1: pocketgulls (big blind) folded before Flop
Seat 2: MatiasCampos :v collected ($2.50)
Seat 3: dokl93 folded before Flop (didn't bet)
Seat 4: MrNeverLucky4 folded before Flop (didn't bet)
Seat 5: tann2k (button) folded before Flop (didn't bet)
Seat 6: kwazer7 (small blind) folded before Flop`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'd dh p6 ????',
      'p2 cbr 3',
      'p3 f',
      'p4 f',
      'p5 f',
      'p6 f',
      'p1 f',
    ],
    antes: [0, 0, 0, 0, 0, 0],
    blindsOrStraddles: [1, 0, 0, 0, 0, 0.5],
    currency: 'USD',
    day: 24,
    hand: 249074114628,
    minBet: 1,
    month: 2,
    players: ['pocketgulls', 'MatiasCampos :v', 'dokl93', 'MrNeverLucky4', 'tann2k', 'kwazer7'],
    rake: 0,
    seatCount: 6,
    seats: [1, 2, 3, 4, 5, 6],
    startingStacks: [101.5, 290.39, 122.32, 100, 213.44, 130.68],
    table: 'Humason III',
    time: '2024-02-24T17:35:26',
    timeZone: 'ET',
    totalPot: 2.5,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2024,
    timestamp: 1708814126000,
  },
  game: {
    players: [
      {
        name: 'pocketgulls',
        stack: 100.5,
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
        name: 'MatiasCampos :v',
        stack: 289.89,
        position: 1,
        cards: ['??', '??'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 1,
        isAllIn: false,
        hasShownCards: null,
        rake: 0,
        winnings: 2.5,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'dokl93',
        stack: 122.32,
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
        name: 'MrNeverLucky4',
        stack: 100,
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
        name: 'tann2k',
        stack: 213.44,
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
        name: 'kwazer7',
        stack: 130.18,
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
    board: [],
    street: 'preflop',
    buttonIndex: 4,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 12,
    isBettingComplete: true,
    lastAction: 'p1 f',
    lastBetAction: 'p2 cbr 3',
    lastPlayerAction: 'p1 f',
    isComplete: true,
    rake: 0,
    pot: 2.5,
    rakePercentage: 0,
    table: 'Humason III',
    hand: 31,
    isRunOut: false,
    bigBlind: 1,
    stats: [],
    isShowdown: false,
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
    smallBlindIndex: 5,
    bigBlindIndex: 0,
  },
};
