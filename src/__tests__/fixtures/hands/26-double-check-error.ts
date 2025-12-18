import type { HandFixture } from '../../../types';

export const fixture: HandFixture = {
  title: '26-double-check-error',
  description: 'Tests a hand with an error where a player checks twice on the flop',
  input: `
PokerStars Hand #252365953358:  Hold'em No Limit ($0.50/$1.00 USD) - 2024/09/09 12:21:23 ET
Table 'Agnia' 6-max Seat #2 is the button
Seat 1: beshece11harf ($100 in chips)
Seat 2: Mr_Dick666 ($100 in chips)
Seat 3: guirib8ir0 ($100 in chips)
Seat 4: horvab ($78.26 in chips)
Seat 5: ruSSotron ($283.06 in chips)
Seat 6: MaRKiToScoK ($126.12 in chips)
guirib8ir0: posts small blind $0.50
horvab: posts big blind $1
*** HOLE CARDS ***
ruSSotron: raises $1.50 to $2.50
MaRKiToScoK: calls $2.50
beshece11harf: folds
Mr_Dick666: calls $2.50
guirib8ir0: folds
horvab: calls $1.50
*** FLOP *** [6d 8d Js]
horvab: checks
ruSSotron: checks
horvab: checks
ruSSotron: bets $7.49
MaRKiToScoK: folds
Mr_Dick666: folds
horvab: folds
Uncalled bet ($7.49) returned to ruSSotron
ruSSotron collected $9.98 from pot
*** SUMMARY ***
Total pot $10.50 | Rake $0.52
Board [6d 8d Js]
Seat 1: beshece11harf folded before Flop (didn't bet)
Seat 2: Mr_Dick666 (button) folded on the Flop
Seat 3: guirib8ir0 (small blind) folded before Flop
Seat 4: horvab (big blind) folded on the Flop
Seat 5: ruSSotron collected ($9.98)
Seat 6: MaRKiToScoK folded on the Flop
`,
  output: {
    variant: 'NT',
    venue: 'PokerStars',
    players: ['beshece11harf', 'Mr_Dick666', 'guirib8ir0', 'horvab', 'ruSSotron', 'MaRKiToScoK'],
    startingStacks: [100, 100, 100, 78.26, 283.06, 126.12],
    blindsOrStraddles: [0, 0, 0.5, 1, 0, 0],
    antes: [0, 0, 0, 0, 0, 0],
    minBet: 1,
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'd dh p6 ????',
      'p5 cbr 2.5',
      'p6 cc',
      'p1 f',
      'p2 cc',
      'p3 f',
      'p4 cc',
      'd db 6d8dJs',
      'p4 cc',
      'p5 cc',
      'p4 cc',
      'p5 cbr 7.49',
      'p6 f',
      'p2 f',
      'p4 f',
    ],
    time: '2024-09-09T08:21:23',
    day: 9,
    month: 9,
    year: 2024,
    timeZone: 'ET',
    currency: 'USD',
    hand: 252365953358,
    rake: 0.52,
    totalPot: 10.5,
    seatCount: 6,
  },
  game: {
    players: [
      {
        name: 'beshece11harf',
        stack: 100,
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
        name: 'Mr_Dick666',
        stack: 97.5,
        position: 1,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 2.5,
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
        name: 'guirib8ir0',
        stack: 99.5,
        position: 2,
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
        name: 'horvab',
        stack: 75.76,
        position: 3,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 2.5,
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
        name: 'ruSSotron',
        stack: 290.05,
        position: 4,
        cards: ['??', '??'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 2.5,
        isAllIn: false,
        hasShownCards: null,
        rake: 0,
        winnings: 9.98,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'MaRKiToScoK',
        stack: 123.62,
        position: 5,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 2.5,
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
    board: ['6d', '8d', 'Js'],
    street: 'flop',
    buttonIndex: 1,
    smallBlindIndex: 2,
    bigBlindIndex: 3,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 3,
    isBettingComplete: true,
    lastAction: 'p4 f',
    lastBetAction: 'p5 cbr 7.49',
    lastPlayerAction: 'p4 f',
    isComplete: true,
    rake: 0.52,
    pot: 9.98,
    rakePercentage: 0,
    table: 'Agnia',
    hand: 252365953358,
    isRunOut: false,
    bigBlind: 1,
    stats: [],
    isShowdown: false,
    nextPlayerIndex: -1,
    gameTimestamp: expect.any(Number),
    lastTimestamp: expect.any(Number),
  },
};
