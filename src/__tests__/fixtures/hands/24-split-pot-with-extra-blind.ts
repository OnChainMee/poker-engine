import type { HandFixture } from '../../../types';

export const fixture: HandFixture = {
  title: '24-split-pot-with-extra-blind',
  description: 'Tests a hand with extra blind posting and split pot with identical pairs',
  input: `
PokerStars Hand #254024795583:  Hold'em No Limit ($0.50/$1.00 USD) - 2024/12/25 17:13:52 ET
Table 'Patricia II' 6-max Seat #4 is the button
Seat 1: XneferX ($210.82 in chips)
Seat 2: Joker007r ($123.64 in chips)
Seat 3: macca1470 ($25.54 in chips)
Seat 4: illarins ($120.73 in chips)
Seat 5: K.Antagonist ($335.10 in chips)
Seat 6: Alinyr ($283.50 in chips)
K.Antagonist: posts small blind $0.50
Alinyr: posts big blind $1
macca1470: posts small & big blinds $1.50
*** HOLE CARDS ***
XneferX: folds
Joker007r: folds
macca1470: raises $1 to $2
illarins: raises $3.50 to $5.50
K.Antagonist: folds
Alinyr: folds
macca1470: raises $19.54 to $25.04 and is all-in
illarins: calls $19.54
*** FLOP *** [4s 5d Qc]
*** TURN *** [4s 5d Qc] [Kh]
*** RIVER *** [4s 5d Qc Kh] [Th]
*** SHOW DOWN ***
macca1470: shows [6h 6d] (a pair of Sixes)
illarins: shows [6c 6s] (a pair of Sixes)
macca1470 collected $24.79 from pot
illarins collected $24.79 from pot
*** SUMMARY ***
Total pot $52.08 | Rake $2.50
Board [4s 5d Qc Kh Th]
Seat 1: XneferX folded before Flop (didn't bet)
Seat 2: Joker007r folded before Flop (didn't bet)
Seat 3: macca1470 showed [6h 6d] and won ($24.79) with a pair of Sixes
Seat 4: illarins (button) showed [6c 6s] and won ($24.79) with a pair of Sixes
Seat 5: K.Antagonist (small blind) folded before Flop
Seat 6: Alinyr (big blind) folded before Flop
`,
  output: {
    _deadBlinds: [0, 0, 0.5, 0, 0, 0],
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'd dh p6 ????',
      'p1 f',
      'p2 f',
      'p3 cbr 2',
      'p4 cbr 5.5',
      'p5 f',
      'p6 f',
      'p3 cbr 25.04',
      'p4 cc',
      'd db 4s5dQc',
      'd db Kh',
      'd db Th',
      'p3 sm 6h6d',
      'p4 sm 6c6s',
    ],
    antes: [0, 0, 0, 0, 0, 0],
    blindsOrStraddles: [0, 0, 1, 0, 0.5, 1],
    currency: 'USD',
    day: 25,
    hand: 254024795583,
    minBet: 1,
    month: 12,
    players: ['XneferX', 'Joker007r', 'macca1470', 'illarins', 'K.Antagonist', 'Alinyr'],
    rake: 2.5,
    seatCount: 6,
    seats: [1, 2, 3, 4, 5, 6],
    startingStacks: [210.82, 123.64, 25.54, 120.73, 335.1, 283.5],
    table: 'Patricia II',
    time: '2024-12-25T17:13:52',
    timeZone: 'ET',
    totalPot: 52.08,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2024,
    timestamp: 1735164832000,
  },
  game: {
    players: [
      {
        name: 'XneferX',
        stack: 210.82,
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
        name: 'Joker007r',
        stack: 123.64,
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
        name: 'macca1470',
        stack: 25.29,
        position: 2,
        cards: ['6h', '6d'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 25.04,
        isAllIn: true,
        hasShownCards: true,
        rake: 0,
        winnings: 24.79,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'illarins',
        stack: 119.98,
        position: 3,
        cards: ['6c', '6s'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 25.04,
        isAllIn: false,
        hasShownCards: true,
        rake: 0,
        winnings: 24.79,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'K.Antagonist',
        stack: 334.6,
        position: 4,
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
        name: 'Alinyr',
        stack: 282.5,
        position: 5,
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
    ],
    board: ['4s', '5d', 'Qc', 'Kh', 'Th'],
    street: 'river',
    buttonIndex: 3,
    smallBlindIndex: 4,
    bigBlindIndex: 5,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 9,
    isBettingComplete: true,
    lastAction: 'p4 sm 6c6s',
    lastBetAction: 'p3 cbr 25.04',
    lastPlayerAction: 'p4 sm 6c6s',
    isComplete: true,
    rake: 2.5,
    pot: 49.58,
    rakePercentage: 0,
    table: 'Patricia II',
    hand: 254024795583,
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
