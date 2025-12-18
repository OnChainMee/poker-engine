import type { HandFixture } from '../../../types';

export const fixture: HandFixture = {
  title: '17-all-in-showdown',
  description: 'Tests hand with all-in, showdown, and a two pair win',
  input: `
PokerStars Hand #254023448401:  Hold'em No Limit ($0.50/$1.00 USD) - 2024/12/25 16:00:53 ET
Table 'Aludra II' 6-max Seat #2 is the button
Seat 1: rapperas2307 ($83.78 in chips)
Seat 2: Arturo0399 ($36.49 in chips)
Seat 3: whitecillar3 ($125.63 in chips)
Seat 4: Joe_Carlos ($123.45 in chips)
Seat 5: zerotohero72 ($245.09 in chips)
Seat 6: LuckyShikari ($103.52 in chips)
whitecillar3: posts small blind $0.50
Joe_Carlos: posts big blind $1
*** HOLE CARDS ***
zerotohero72: folds
LuckyShikari: folds
rapperas2307: folds
Arturo0399: raises $1.50 to $2.50
whitecillar3: raises $7.50 to $10
Joe_Carlos: folds
Arturo0399: calls $7.50
*** FLOP *** [2d 9h 2c]
whitecillar3: bets $5
Arturo0399: raises $21.49 to $26.49 and is all-in
whitecillar3: calls $21.49
*** TURN *** [2d 9h 2c] [Jh]
*** RIVER *** [2d 9h 2c Jh] [Tc]
*** SHOW DOWN ***
whitecillar3: shows [Ah Ks] (a pair of Deuces)
Arturo0399: shows [Jd Qs] (two pair, Jacks and Deuces)
Arturo0399 collected $71.48 from pot
*** SUMMARY ***
Total pot $73.98 | Rake $2.50
Board [2d 9h 2c Jh Tc]
Seat 1: rapperas2307 folded before Flop (didn't bet)
Seat 2: Arturo0399 (button) showed [Jd Qs] and won ($71.48) with two pair, Jacks and Deuces
Seat 3: whitecillar3 (small blind) showed [Ah Ks] and lost with a pair of Deuces
Seat 4: Joe_Carlos (big blind) folded before Flop
Seat 5: zerotohero72 folded before Flop (didn't bet)
Seat 6: LuckyShikari folded before Flop (didn't bet)
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'd dh p6 ????',
      'p5 f',
      'p6 f',
      'p1 f',
      'p2 cbr 2.5',
      'p3 cbr 10',
      'p4 f',
      'p2 cc',
      'd db 2d9h2c',
      'p3 cbr 5',
      'p2 cbr 26.49',
      'p3 cc',
      'd db Jh',
      'd db Tc',
      'p3 sm AhKs',
      'p2 sm JdQs',
    ],
    antes: [0, 0, 0, 0, 0, 0],
    blindsOrStraddles: [0, 0, 0.5, 1, 0, 0],
    currency: 'USD',
    day: 25,
    hand: 254023448401,
    minBet: 1,
    month: 12,
    players: [
      'rapperas2307',
      'Arturo0399',
      'whitecillar3',
      'Joe_Carlos',
      'zerotohero72',
      'LuckyShikari',
    ],
    rake: 2.5,
    seatCount: 6,
    seats: [1, 2, 3, 4, 5, 6],
    startingStacks: [83.78, 36.49, 125.63, 123.45, 245.09, 103.52],
    table: 'Aludra II',
    time: '2024-12-25T16:00:53',
    timeZone: 'ET',
    totalPot: 73.98,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2024,
    timestamp: 1735160453000,
  },
  game: {
    smallBlindIndex: 2,
    bigBlindIndex: 3,
    players: [
      {
        name: 'rapperas2307',
        stack: 83.78,
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
        name: 'Arturo0399',
        stack: 71.48,
        position: 1,
        cards: ['Jd', 'Qs'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 36.49,
        isAllIn: true,
        hasShownCards: true,
        rake: 0,
        winnings: 71.48,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'whitecillar3',
        stack: 89.14,
        position: 2,
        cards: ['Ah', 'Ks'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 36.49,
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
        name: 'Joe_Carlos',
        stack: 122.45,
        position: 3,
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
        name: 'zerotohero72',
        stack: 245.09,
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
        name: 'LuckyShikari',
        stack: 103.52,
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
    board: ['2d', '9h', '2c', 'Jh', 'Tc'],
    pot: 71.48,
    street: 'river',
    buttonIndex: 1,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 7,
    isBettingComplete: true,
    lastAction: 'p3 sh AhKs',
    lastBetAction: 'p2 cbr 26.49',
    lastPlayerAction: 'p3 sh AhKs',
    isComplete: true,
    rake: 2.5,
    rakePercentage: 0,
    table: 'Aludra II',
    isRunOut: false,
    hand: 254023448401,
    bigBlind: 1,
    stats: [],
    isShowdown: true,
    nextPlayerIndex: -1,
    gameTimestamp: expect.any(Number),
    lastTimestamp: expect.any(Number),
  },
};
