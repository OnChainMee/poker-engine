import type { HandFixture } from '../../../types';

export const fixture: HandFixture = {
  title: '22-straight-vs-straight-with-cashout',
  description: 'Tests a hand with identical straights and a cash out feature',
  input: `
PokerStars Hand #254023624902:  Hold'em No Limit ($0.50/$1.00 USD) - 2024/12/25 16:10:32 ET
Table 'Pamina II' 6-max Seat #1 is the button
Seat 1: michasia ($101.50 in chips)
Seat 3: Ysiven ($225.87 in chips)
Seat 6: Bigkipper14 ($38.50 in chips)
Ysiven: posts small blind $0.50
Bigkipper14: posts big blind $1
*** HOLE CARDS ***
michasia: folds
Ysiven: raises $2 to $3
Bigkipper14: calls $2
*** FLOP *** [7h 9d 6d]
Ysiven: checks
Bigkipper14: bets $5.70
Ysiven: raises $33.30 to $39
Bigkipper14: calls $29.80 and is all-in
Uncalled bet ($3.50) returned to Ysiven
*** TURN *** [7h 9d 6d] [8h]
*** RIVER *** [7h 9d 6d 8h] [Ts]
illarins joins the table at seat #2
*** SHOW DOWN ***
Ysiven: shows [Ad As] (a straight, Six to Ten)
Bigkipper14: shows [7s 6s] (a straight, Six to Ten)
Ysiven collected $38 from pot
Bigkipper14 cashed out the hand for $51.68 | Cash Out Fee $1.05
*** SUMMARY ***
Total pot $77 | Rake $1
Board [7h 9d 6d 8h Ts]
Seat 1: michasia (button) folded before Flop (didn't bet)
Seat 3: Ysiven (small blind) showed [Ad As] and won ($38) with a straight, Six to Ten
Seat 6: Bigkipper14 (big blind) showed [7s 6s] and won ($38) with a straight, Six to Ten (pot not awarded as player cashed out)
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p3 ????',
      'p1 f',
      'p2 cbr 3',
      'p3 cc',
      'd db 7h9d6d',
      'p2 cc',
      'p3 cbr 5.7',
      'p2 cbr 39',
      'p3 cc 29.8',
      'd db 8h',
      'd db Ts',
      'p2 sm AdAs',
      'p3 sm 7s6s',
    ],
    antes: [0, 0, 0],
    blindsOrStraddles: [0, 0.5, 1],
    currency: 'USD',
    day: 25,
    hand: 254023624902,
    minBet: 1,
    month: 12,
    players: ['michasia', 'Ysiven', 'Bigkipper14'],
    rake: 1,
    seatCount: 6,
    seats: [1, 3, 6],
    startingStacks: [101.5, 225.87, 38.5],
    table: 'Pamina II',
    time: '2024-12-25T16:10:32',
    timeZone: 'ET',
    totalPot: 77,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2024,
    timestamp: 1735161032000,
  },
  game: {
    players: [
      {
        name: 'michasia',
        stack: 101.5,
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
        name: 'Ysiven',
        stack: 260.37,
        position: 1,
        cards: ['Ad', 'As'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 38.5,
        isAllIn: false,
        hasShownCards: true,
        rake: 0,
        winnings: 38,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'Bigkipper14',
        stack: 51.68,
        position: 2,
        cards: ['7s', '6s'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 38.5,
        isAllIn: true,
        hasShownCards: true,
        rake: 0,
        winnings: 38,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
    ],
    board: ['7h', '9d', '6d', '8h', 'Ts'],
    street: 'river',
    buttonIndex: 0,
    smallBlindIndex: 1,
    bigBlindIndex: 2,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 7,
    isBettingComplete: true,
    lastAction: 'p3 sm 7s6s',
    lastBetAction: 'p2 cbr 39',
    lastPlayerAction: 'p3 sm 7s6s',
    isComplete: true,
    rake: 1,
    pot: 76,
    rakePercentage: 0,
    table: 'Pamina II',
    hand: 254023624902,
    isRunOut: false,
    bigBlind: 1,
    stats: [],
    isShowdown: true,
    nextPlayerIndex: -1,
    gameTimestamp: expect.any(Number),
    lastTimestamp: expect.any(Number),
  },
};
