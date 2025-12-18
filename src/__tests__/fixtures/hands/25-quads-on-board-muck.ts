import type { HandFixture } from '../../../types';

export const fixture: HandFixture = {
  title: '25-quads-on-board-muck',
  description: 'Tests a hand with quads on the board and one player mucking at showdown',
  input: `
PokerStars Hand #254024998080:  Hold'em No Limit ($0.50/$1.00 USD) - 2024/12/25 17:25:07 ET
Table 'Vaticana II' 6-max Seat #3 is the button
Seat 1: XneferX ($124.04 in chips)
Seat 2: goggy100 ($54.53 in chips)
Seat 3: tintin641 ($100 in chips)
Seat 4: Christianzt1 ($125.11 in chips)
Seat 5: Une73 ($62.79 in chips)
Seat 6: kekoccc ($100 in chips)
Christianzt1: posts small blind $0.50
Une73: posts big blind $1
*** HOLE CARDS ***
kekoccc: folds
XneferX: folds
goggy100: folds
tintin641: folds
Christianzt1: raises $2 to $3
Une73: calls $2
*** FLOP *** [Qd 2h 2s]
Christianzt1: bets $1.42
Une73: calls $1.42
*** TURN *** [Qd 2h 2s] [2c]
Christianzt1: checks
Une73: bets $4.20
Christianzt1: calls $4.20
*** RIVER *** [Qd 2h 2s 2c] [5s]
Christianzt1: checks
Une73: checks
*** SHOW DOWN ***
Christianzt1: shows [Qh 9h] (a full house, Deuces full of Queens)
Une73: mucks hand
Christianzt1 collected $16.38 from pot
*** SUMMARY ***
Total pot $17.24 | Rake $0.86
Board [Qd 2h 2s 2c 5s]
Seat 1: XneferX folded before Flop (didn't bet)
Seat 2: goggy100 folded before Flop (didn't bet)
Seat 3: tintin641 (button) folded before Flop (didn't bet)
Seat 4: Christianzt1 (small blind) showed [Qh 9h] and won ($16.38) with a full house, Deuces full of Queens
Seat 5: Une73 (big blind) mucked
Seat 6: kekoccc folded before Flop (didn't bet)
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'd dh p6 ????',
      'p6 f',
      'p1 f',
      'p2 f',
      'p3 f',
      'p4 cbr 3',
      'p5 cc',
      'd db Qd2h2s',
      'p4 cbr 1.42',
      'p5 cc',
      'd db 2c',
      'p4 cc',
      'p5 cbr 4.2',
      'p4 cc',
      'd db 5s',
      'p4 cc',
      'p5 cc',
      'p4 sm Qh9h',
      'p5 sm',
    ],
    antes: [0, 0, 0, 0, 0, 0],
    blindsOrStraddles: [0, 0, 0, 0.5, 1, 0],
    currency: 'USD',
    day: 25,
    hand: 254024998080,
    minBet: 1,
    month: 12,
    players: ['XneferX', 'goggy100', 'tintin641', 'Christianzt1', 'Une73', 'kekoccc'],
    rake: 0.86,
    seatCount: 6,
    seats: [1, 2, 3, 4, 5, 6],
    startingStacks: [124.04, 54.53, 100, 125.11, 62.79, 100],
    table: 'Vaticana II',
    time: '2024-12-25T17:25:07',
    timeZone: 'ET',
    totalPot: 17.24,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2024,
    timestamp: 1735165507000,
  },
  game: {
    players: [
      {
        name: 'XneferX',
        stack: 124.04,
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
        name: 'goggy100',
        stack: 54.53,
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
        name: 'tintin641',
        stack: 100,
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
        name: 'Christianzt1',
        stack: 132.37,
        position: 3,
        cards: ['Qh', '9h'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 8.62,
        isAllIn: false,
        hasShownCards: true,
        rake: 0,
        winnings: 16.38,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'Une73',
        stack: 54.17,
        position: 4,
        cards: ['??', '??'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 8.62,
        isAllIn: false,
        hasShownCards: false,
        rake: 0,
        winnings: 0,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'kekoccc',
        stack: 100,
        position: 5,
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
    board: ['Qd', '2h', '2s', '2c', '5s'],
    street: 'river',
    buttonIndex: 2,
    smallBlindIndex: 3,
    bigBlindIndex: 4,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 7,
    isBettingComplete: true,
    lastAction: 'p5 muck',
    lastBetAction: 'p5 cbr 4.2',
    lastPlayerAction: 'p5 muck',
    isComplete: true,
    rake: 0.86,
    pot: 16.38,
    rakePercentage: 0,
    table: 'Vaticana II',
    hand: 254024998080,
    isRunOut: false,
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
