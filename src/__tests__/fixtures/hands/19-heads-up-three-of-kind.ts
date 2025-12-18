import type { HandFixture } from '../../../types';

export const fixture: HandFixture = {
  title: '19-heads-up-three-of-kind',
  description: 'Tests a heads-up hand with three of a kind win',
  input: `
PokerStars Hand #254023460879:  Hold'em No Limit ($0.50/$1.00 USD) - 2024/12/25 16:01:43 ET
Table 'Transvaalia II' 6-max Seat #4 is the button
Seat 4: NOTfishON ($100 in chips)
Seat 5: JoraZakaryan ($10 in chips)
NOTfishON: posts small blind $0.50
JoraZakaryan: posts big blind $1
*** HOLE CARDS ***
NOTfishON: calls $0.50
JoraZakaryan: raises $2 to $3
NOTfishON: calls $2
*** FLOP *** [Js 5d Jh]
JoraZakaryan: bets $2.85
NOTfishON: calls $2.85
*** TURN *** [Js 5d Jh] [2c]
JoraZakaryan: bets $4.15 and is all-in
NOTfishON: calls $4.15
*** RIVER *** [Js 5d Jh 2c] [3d]
*** SHOW DOWN ***
JoraZakaryan: shows [Ts Tc] (two pair, Jacks and Tens)
NOTfishON: shows [8c Jd] (three of a kind, Jacks)
NOTfishON collected $19 from pot
*** SUMMARY ***
Total pot $20 | Rake $1
Board [Js 5d Jh 2c 3d]
Seat 4: NOTfishON (button) (small blind) showed [8c Jd] and won ($19) with three of a kind, Jacks
Seat 5: JoraZakaryan (big blind) showed [Ts Tc] and lost with two pair, Jacks and Tens
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'p1 cc',
      'p2 cbr 3',
      'p1 cc',
      'd db Js5dJh',
      'p2 cbr 2.85',
      'p1 cc',
      'd db 2c',
      'p2 cbr 4.15',
      'p1 cc',
      'd db 3d',
      'p2 sm TsTc',
      'p1 sm 8cJd',
    ],
    antes: [0, 0],
    blindsOrStraddles: [0.5, 1],
    currency: 'USD',
    day: 25,
    hand: 254023460879,
    minBet: 1,
    month: 12,
    players: ['NOTfishON', 'JoraZakaryan'],
    rake: 1,
    seatCount: 6,
    seats: [4, 5],
    startingStacks: [100, 10],
    table: 'Transvaalia II',
    time: '2024-12-25T16:01:43',
    timeZone: 'ET',
    totalPot: 20,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2024,
    timestamp: 1735160503000,
  },
  game: {
    players: [
      {
        name: 'NOTfishON',
        stack: 109,
        position: 0,
        cards: ['8c', 'Jd'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 10,
        isAllIn: false,
        hasShownCards: true,
        rake: 0,
        winnings: 19,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'JoraZakaryan',
        stack: 0,
        position: 1,
        cards: ['Ts', 'Tc'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 10,
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
    ],
    board: ['Js', '5d', 'Jh', '2c', '3d'],
    pot: 19,
    street: 'river',
    buttonIndex: 0,
    smallBlindIndex: 0,
    bigBlindIndex: 1,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 7,
    isBettingComplete: true,
    lastAction: 'p1 sm 8cJd',
    lastBetAction: 'p2 cbr 4.15',
    lastPlayerAction: 'p1 sm 8cJd',
    isComplete: true,
    rake: 1,
    rakePercentage: 0,
    table: 'Transvaalia II',
    isRunOut: false,
    hand: 254023460879,
    bigBlind: 1,
    stats: [],
    isShowdown: true,
    nextPlayerIndex: -1,
    gameTimestamp: expect.any(Number),
    lastTimestamp: expect.any(Number),
  },
};
