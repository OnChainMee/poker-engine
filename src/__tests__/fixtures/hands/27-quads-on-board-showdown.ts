import type { HandFixture } from '../../../types';

export const fixture: HandFixture = {
  title: '27-quads-on-board-showdown',
  description: 'Tests a hand with quads on the board and multiple players at showdown',
  input: `
PokerStars Hand #252367859118:  Hold'em No Limit ($0.50/$1.00 USD) - 2024/09/09 14:17:58 ET
Table 'Deneb II' 6-max Seat #4 is the button
Seat 1: blistein ($100 in chips)
Seat 2: JUANS2 ($100 in chips)
Seat 3: Ace.WolFF ($101.68 in chips)
Seat 4: Mr_Dick666 ($149.45 in chips)
Seat 5: ChronoPlay ($71.12 in chips)
Seat 6: whlzor ($212.64 in chips)
ChronoPlay: posts small blind $0.50
whlzor: posts big blind $1
*** HOLE CARDS ***
blistein: raises $1.20 to $2.20
JUANS2: raises $5.30 to $7.50
Ace.WolFF: calls $7.50
Mr_Dick666: folds
ChronoPlay: folds
whlzor: folds
blistein: calls $5.30
*** FLOP *** [2c 2d Ah]
blistein: checks
JUANS2: checks
Ace.WolFF: checks
*** TURN *** [2c 2d Ah] [Kc]
blistein: checks
JUANS2: checks
Ace.WolFF: checks
*** RIVER *** [2c 2d Ah Kc] [2s]
blistein: checks
JUANS2: checks
Ace.WolFF: checks
*** SHOW DOWN ***
blistein: shows [6d 6s] (a full house, Deuces full of Sixes)
JUANS2: shows [Kd Jd] (a full house, Deuces full of Kings)
Ace.WolFF: mucks hand
JUANS2 collected $22.80 from pot
*** SUMMARY ***
Total pot $24 | Rake $1.20
Board [2c 2d Ah Kc 2s]
Seat 1: blistein showed [6d 6s] and lost with a full house, Deuces full of Sixes
Seat 2: JUANS2 showed [Kd Jd] and won ($22.80) with a full house, Deuces full of Kings
Seat 3: Ace.WolFF mucked
Seat 4: Mr_Dick666 (button) folded before Flop (didn't bet)
Seat 5: ChronoPlay (small blind) folded before Flop
Seat 6: whlzor (big blind) folded before Flop
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'd dh p6 ????',
      'p1 cbr 2.2',
      'p2 cbr 7.5',
      'p3 cc',
      'p4 f',
      'p5 f',
      'p6 f',
      'p1 cc',
      'd db 2c2dAh',
      'p1 cc',
      'p2 cc',
      'p3 cc',
      'd db Kc',
      'p1 cc',
      'p2 cc',
      'p3 cc',
      'd db 2s',
      'p1 cc',
      'p2 cc',
      'p3 cc',
      'p1 sm 6d6s',
      'p2 sm KdJd',
      'p3 sm',
    ],
    antes: [0, 0, 0, 0, 0, 0],
    blindsOrStraddles: [0, 0, 0, 0, 0.5, 1],
    currency: 'USD',
    day: 9,
    hand: 252367859118,
    minBet: 1,
    month: 9,
    players: ['blistein', 'JUANS2', 'Ace.WolFF', 'Mr_Dick666', 'ChronoPlay', 'whlzor'],
    rake: 1.2,
    seatCount: 6,
    seats: [1, 2, 3, 4, 5, 6],
    startingStacks: [100, 100, 101.68, 149.45, 71.12, 212.64],
    table: 'Deneb II',
    time: '2024-09-09T14:17:58',
    timeZone: 'ET',
    totalPot: 24,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2024,
    timestamp: 1725905878000,
  },
  game: {
    players: [
      {
        name: 'blistein',
        stack: 92.5,
        position: 0,
        cards: ['6d', '6s'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 7.5,
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
        name: 'JUANS2',
        stack: 115.3,
        position: 1,
        cards: ['Kd', 'Jd'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 7.5,
        isAllIn: false,
        hasShownCards: true,
        rake: 0,
        winnings: 22.8,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'Ace.WolFF',
        stack: 94.18,
        position: 2,
        cards: ['??', '??'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 7.5,
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
        name: 'Mr_Dick666',
        stack: 149.45,
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
        name: 'ChronoPlay',
        stack: 70.62,
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
        name: 'whlzor',
        stack: 211.64,
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
    board: ['2c', '2d', 'Ah', 'Kc', '2s'],
    street: 'river',
    buttonIndex: 3,
    smallBlindIndex: 4,
    bigBlindIndex: 5,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 7,
    isBettingComplete: true,
    lastAction: 'p3 muck',
    lastBetAction: 'p1 cbr 2.2',
    lastPlayerAction: 'p3 muck',
    isComplete: true,
    rake: 1.2,
    pot: 22.8,
    rakePercentage: 0,
    table: 'Deneb II',
    hand: 252367859118,
    isRunOut: false,
    bigBlind: 1,
    stats: [],
    isShowdown: true,
    nextPlayerIndex: -1,
    gameTimestamp: expect.any(Number),
    lastTimestamp: expect.any(Number),
  },
};
