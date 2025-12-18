import type { HandFixture } from '../../../types';

export const fixture: HandFixture = {
  title: '16-sitting-out',
  description: 'Tests that players who are sitting out are properly marked and filtered',
  input: `
PokerStars Hand #224987652133: Hold'em No Limit ($0.25/$0.50) - 2023/04/10 12:34:56 ET
Table 'Cygnus III' 6-max Seat #5 is the button
Seat 1: Player1 ($50.00 in chips)
Seat 2: Player2 ($100.00 in chips) is sitting out
Seat 3: Player3 ($75.25 in chips)
Seat 4: Player4 ($45.75 in chips)
Seat 5: Player5 ($110.30 in chips)
Seat 6: Player6 ($60.45 in chips)
Player6: posts small blind $0.25
Player1: posts big blind $0.50
*** HOLE CARDS ***
Dealt to Player5 [Ah Kh]
Player3: folds
Player4: calls $0.50
Player5: raises $1.50 to $2.00
Player6: folds
Player1: calls $1.50
Player4: calls $1.50
*** FLOP *** [2d 7c Jh]
Player1: checks
Player4: checks
Player5: bets $3.25
Player1: folds
Player4: calls $3.25
*** TURN *** [2d 7c Jh] [Qs]
Player4: checks
Player5: bets $6.75
Player4: folds
Uncalled bet ($6.75) returned to Player5
Player5 collected $12.50 from pot
*** SUMMARY ***
Total pot $13.25 | Rake $0.75
Board [2d 7c Jh Qs]
Seat 1: Player1 (big blind) folded on the Flop
Seat 2: Player2 is sitting out
Seat 3: Player3 folded before Flop (didn't bet)
Seat 4: Player4 folded on the Turn
Seat 5: Player5 (button) collected ($12.50)
Seat 6: Player6 (small blind) folded before Flop
`,
  output: {
    _inactive: [0, 1, 0, 0, 0, 0],
    actions: [
      'd dh p1 ????',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 AhKh',
      'd dh p6 ????',
      'p3 f',
      'p4 cc',
      'p5 cbr 2',
      'p6 f',
      'p1 cc',
      'p4 cc',
      'd db 2d7cJh',
      'p1 cc',
      'p4 cc',
      'p5 cbr 3.25',
      'p1 f',
      'p4 cc',
      'd db Qs',
      'p4 cc',
      'p5 cbr 6.75',
      'p4 f',
    ],
    antes: [0, 0, 0, 0, 0, 0],
    blindsOrStraddles: [0.5, 0, 0, 0, 0, 0.25],
    currency: 'USD',
    day: 10,
    hand: 224987652133,
    minBet: 0.5,
    month: 4,
    players: ['Player1', 'Player2', 'Player3', 'Player4', 'Player5', 'Player6'],
    rake: 0.75,
    seatCount: 6,
    seats: [1, 2, 3, 4, 5, 6],
    startingStacks: [50, 100, 75.25, 45.75, 110.3, 60.45],
    table: 'Cygnus III',
    time: '2023-04-10T12:34:56',
    timeZone: 'ET',
    totalPot: 13.25,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2023,
    timestamp: 1681144496000,
  },
  game: {
    smallBlindIndex: 5,
    bigBlindIndex: 0,
    players: [
      {
        name: 'Player1',
        stack: 48,
        position: 0,
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
        name: 'Player2',
        stack: 100,
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
        name: 'Player3',
        stack: 75.25,
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
        name: 'Player4',
        stack: 40.5,
        position: 3,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 5.25,
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
        name: 'Player5',
        stack: 117.3,
        position: 4,
        cards: ['Ah', 'Kh'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 5.25,
        isAllIn: false,
        hasShownCards: null,
        rake: 0.75,
        winnings: 12.5,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'Player6',
        stack: 60.2,
        position: 5,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 0.25,
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
    board: ['2d', '7c', 'Jh', 'Qs'],
    pot: 12.5,
    street: 'turn',
    buttonIndex: 4,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 6,
    isBettingComplete: true,
    lastAction: 'p4 f',
    lastBetAction: 'p5 cbr 6.75',
    lastPlayerAction: 'p4 f',
    isComplete: true,
    rake: 0.75,
    rakePercentage: 0,
    table: 'Cygnus III',
    isRunOut: false,
    hand: 224987652133,
    bigBlind: 0.5,
    stats: [],
    isShowdown: false,
    nextPlayerIndex: -1,
    gameTimestamp: expect.any(Number),
    lastTimestamp: expect.any(Number),
  },
};
