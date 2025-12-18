import type { HandFixture } from '../../../types';

export const fixture: HandFixture = {
  title: '23-split-pot-with-antes',
  description: 'Tests a hand with antes and a split pot outcome',
  input: `
PokerStars Hand #254024513963:  Hold'em No Limit ($0.50/$1.00 USD) - 2024/12/25 16:57:36 ET
Table 'Koronis' 6-max Seat #1 is the button
Seat 1: Ysiven ($106.82 in chips)
Seat 2: kevpolley ($85.40 in chips)
Seat 4: Christianzt1 ($143.33 in chips)
Seat 5: JociBalboaa ($187.57 in chips)
Seat 6: whitecillar3 ($124.07 in chips)
kevpolley: posts small blind $0.50
Christianzt1: posts big blind $1
Ysiven: posts the ante $0.20
kevpolley: posts the ante $0.20
Christianzt1: posts the ante $0.20
JociBalboaa: posts the ante $0.20
whitecillar3: posts the ante $0.20
*** HOLE CARDS ***
JociBalboaa: folds
whitecillar3: folds
Ysiven: raises $1.50 to $2.50
kevpolley: calls $2
Christianzt1: raises $10.50 to $13
Ysiven: raises $93.62 to $106.62 and is all-in
kevpolley: folds
Christianzt1: calls $93.62
*** FLOP *** [7h Th Kc]
*** TURN *** [7h Th Kc] [Tc]
*** RIVER *** [7h Th Kc Tc] [8c]
*** SHOW DOWN ***
Christianzt1: shows [Kd Ah] (two pair, Kings and Tens)
Ysiven: shows [Kh Ac] (two pair, Kings and Tens)
Christianzt1 collected $107.12 from pot
Ysiven collected $107.12 from pot
*** SUMMARY ***
Total pot $216.74 | Rake $2.50
Board [7h Th Kc Tc 8c]
Seat 1: Ysiven (button) showed [Kh Ac] and won ($107.12) with two pair, Kings and Tens
Seat 2: kevpolley (small blind) folded before Flop
Seat 4: Christianzt1 (big blind) showed [Kd Ah] and won ($107.12) with two pair, Kings and Tens
Seat 5: JociBalboaa folded before Flop (didn't bet)
Seat 6: whitecillar3 folded before Flop (didn't bet)
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'p4 f',
      'p5 f',
      'p1 cbr 2.5',
      'p2 cc',
      'p3 cbr 13',
      'p1 cbr 106.62',
      'p2 f',
      'p3 cc',
      'd db 7hThKc',
      'd db Tc',
      'd db 8c',
      'p3 sm KdAh',
      'p1 sm KhAc',
    ],
    antes: [0.2, 0.2, 0.2, 0.2, 0.2],
    blindsOrStraddles: [0, 0.5, 1, 0, 0],
    currency: 'USD',
    day: 25,
    hand: 254024513963,
    minBet: 1,
    month: 12,
    players: ['Ysiven', 'kevpolley', 'Christianzt1', 'JociBalboaa', 'whitecillar3'],
    rake: 2.5,
    seatCount: 6,
    seats: [1, 2, 4, 5, 6],
    startingStacks: [106.82, 85.4, 143.33, 187.57, 124.07],
    table: 'Koronis',
    time: '2024-12-25T16:57:36',
    timeZone: 'ET',
    totalPot: 216.74,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2024,
    timestamp: 1735163856000,
  },
  game: {
    players: [
      {
        name: 'Ysiven',
        stack: 107.12,
        position: 0,
        cards: ['Kh', 'Ac'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 106.82,
        isAllIn: true,
        hasShownCards: true,
        rake: 0,
        winnings: 107.12,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'kevpolley',
        stack: 82.7,
        position: 1,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 2.7,
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
        stack: 143.63,
        position: 2,
        cards: ['Kd', 'Ah'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 107.82,
        isAllIn: false,
        hasShownCards: true,
        rake: 0,
        winnings: 107.12,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'JociBalboaa',
        stack: 187.37,
        position: 3,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 0.2,
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
        name: 'whitecillar3',
        stack: 123.87,
        position: 4,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 0.2,
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
    board: ['7h', 'Th', 'Kc', 'Tc', '8c'],
    street: 'river',
    buttonIndex: 0,
    smallBlindIndex: 1,
    bigBlindIndex: 2,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 9,
    isBettingComplete: true,
    lastAction: 'p1 sm KhAc',
    lastBetAction: 'p1 cbr 106.62',
    lastPlayerAction: 'p1 sm KhAc',
    isComplete: true,
    rake: 2.5,
    pot: 214.24,
    rakePercentage: 0,
    table: 'Koronis',
    hand: 254024513963,
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
