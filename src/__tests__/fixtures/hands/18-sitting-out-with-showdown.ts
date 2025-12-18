import type { HandFixture } from '../../../types';

export const fixture: HandFixture = {
  title: '18-sitting-out-with-showdown',
  description: 'Tests hand with one player sitting out and a showdown with three of a kind win',
  input: `
PokerStars Hand #254023453133:  Hold'em No Limit ($0.50/$1.00 USD) - 2024/12/25 16:01:12 ET
Table 'Patricia II' 6-max Seat #6 is the button
Seat 2: Be_castelo1 ($0.05 in chips) is sitting out
Seat 1: XneferX ($199.02 in chips)
Seat 3: macca1470 ($35.77 in chips)
Seat 4: illarins ($100.20 in chips)
Seat 5: K.Antagonist ($288.93 in chips)
Seat 6: Ship4545 ($39.37 in chips)
XneferX: posts small blind $0.50
macca1470: posts big blind $1
*** HOLE CARDS ***
illarins: folds
K.Antagonist: folds
Ship4545: raises $2 to $3
XneferX: folds
macca1470: calls $2
*** FLOP *** [8s Ac 7c]
macca1470: checks
Ship4545: bets $3.09
macca1470: calls $3.09
*** TURN *** [8s Ac 7c] [9h]
macca1470: checks
Ship4545: bets $12.05
macca1470: calls $12.05
*** RIVER *** [8s Ac 7c 9h] [Ah]
macca1470: checks
Ship4545: bets $21.23 and is all-in
macca1470: calls $17.63 and is all-in
Uncalled bet ($3.60) returned to Ship4545
*** SHOW DOWN ***
Ship4545: shows [As Js] (three of a kind, Aces)
macca1470: shows [9c 6s] (two pair, Aces and Nines)
Ship4545 collected $69.54 from pot
*** SUMMARY ***
Total pot $72.04 | Rake $2.50
Board [8s Ac 7c 9h Ah]
Seat 2: Be_castelo1
Seat 1: XneferX (small blind) folded before Flop
Seat 3: macca1470 (big blind) showed [9c 6s] and lost with two pair, Aces and Nines
Seat 4: illarins folded before Flop (didn't bet)
Seat 5: K.Antagonist folded before Flop (didn't bet)
Seat 6: Ship4545 (button) showed [As Js] and won ($69.54) with three of a kind, Aces
`,
  output: {
    _inactive: [0, 1, 0, 0, 0, 0],
    actions: [
      'd dh p1 ????',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'd dh p6 ????',
      'p4 f',
      'p5 f',
      'p6 cbr 3',
      'p1 f',
      'p3 cc',
      'd db 8sAc7c',
      'p3 cc',
      'p6 cbr 3.09',
      'p3 cc',
      'd db 9h',
      'p3 cc',
      'p6 cbr 12.05',
      'p3 cc',
      'd db Ah',
      'p3 cc',
      'p6 cbr 21.23',
      'p3 cc 17.63',
      'p6 sm AsJs',
      'p3 sm 9c6s',
    ],
    antes: [0, 0, 0, 0, 0, 0],
    blindsOrStraddles: [0.5, 0, 1, 0, 0, 0],
    currency: 'USD',
    day: 25,
    hand: 254023453133,
    minBet: 1,
    month: 12,
    players: ['XneferX', 'Be_castelo1', 'macca1470', 'illarins', 'K.Antagonist', 'Ship4545'],
    rake: 2.5,
    seatCount: 6,
    seats: [2, 1, 3, 4, 5, 6],
    startingStacks: [199.02, 0.05, 35.77, 100.2, 288.93, 39.37],
    table: 'Patricia II',
    time: '2024-12-25T16:01:12',
    timeZone: 'ET',
    totalPot: 72.04,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2024,
    timestamp: 1735160472000,
  },
  game: {
    smallBlindIndex: 0,
    bigBlindIndex: 2,
    players: [
      {
        name: 'XneferX',
        stack: 198.52,
        position: 0,
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
        name: 'Be_castelo1',
        stack: 0.05,
        position: 1,
        cards: [],
        hasFolded: false,
        hasActed: false,
        roundBet: 0,
        totalBet: 0,
        isAllIn: false,
        hasShownCards: null,
        rake: 0,
        winnings: 0,
        isInactive: true,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'macca1470',
        stack: 0,
        position: 2,
        cards: ['9c', '6s'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 35.77,
        isAllIn: true,
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
        name: 'illarins',
        stack: 100.2,
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
        name: 'K.Antagonist',
        stack: 288.93,
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
        name: 'Ship4545',
        stack: 73.14,
        position: 5,
        cards: ['As', 'Js'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 35.77,
        isAllIn: true,
        hasShownCards: true,
        rake: 0,
        winnings: 69.54,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
    ],
    board: ['8s', 'Ac', '7c', '9h', 'Ah'],
    pot: 69.54,
    street: 'river',
    buttonIndex: 5,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 7,
    isBettingComplete: true,
    lastAction: 'p3 sm 9c6s',
    lastBetAction: 'p6 cbr 21.23',
    lastPlayerAction: 'p3 sm 9c6s',
    isComplete: true,
    rake: 2.5,
    rakePercentage: 0,
    table: 'Patricia II',
    isRunOut: false,
    hand: 254023453133,
    bigBlind: 1,
    minBet: 1,
    lastCompleteBet: 1,
    seatCount: 9,
    isPlayable: true,
    stats: [],
    isShowdown: true,
    nextPlayerIndex: -1,
    gameTimestamp: expect.any(Number),
    lastTimestamp: expect.any(Number),
  },
};
