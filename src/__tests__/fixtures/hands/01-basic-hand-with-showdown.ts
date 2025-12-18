/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import { HandFixture } from '../../..';

export const fixture: HandFixture = {
  title: '01-basic-hand-with-showdown',
  description: `A basic hand that demonstrates full betting action through showdown.
    Interesting aspects:
    - Multiple streets of betting with raises
    - Player shows winning hand with pair of aces
    - Other player mucks losing hand but cards are known
    - Demonstrates rake calculation
    - Shows proper tracking of bets and position through multiple streets`,
  input: `
PokerStars Home Game Hand #218536444875: {Club #3225207}  Hold'em No Limit (50/100) - 2020/09/17 14:52:46 ET
Table 'fun time' 9-max (Play Money) Seat #1 is the button
Seat 1: dddocky (10000 in chips)
Seat 2: Duke Croix (10000 in chips)
Seat 9: HighCardJasper (10000 in chips)
color_singleton joins the table at seat #3
Klemtonius joins the table at seat #5
Duke Croix: posts small blind 50
HighCardJasper: posts big blind 100
*** HOLE CARDS ***
Dealt to Duke Croix [7s 9c]
dddocky: calls 100
Duke Croix: calls 50
HighCardJasper: checks
*** FLOP *** [9d 6d Ad]
Duke Croix: checks
HighCardJasper: bets 100
dddocky: raises 100 to 200
Duke Croix: folds
HighCardJasper: calls 100
*** TURN *** [9d 6d Ad] [Th]
HighCardJasper: checks
dddocky: bets 100
HighCardJasper: calls 100
*** RIVER *** [9d 6d Ad Th] [3c]
HighCardJasper: checks
dddocky: bets 100
HighCardJasper: calls 100
*** SHOW DOWN ***
dddocky: shows [4d Ac] (a pair of Aces)
HighCardJasper: mucks hand
dddocky collected 1039 from pot
*** SUMMARY ***
Total pot 1100 | Rake 61
Board [9d 6d Ad Th 3c]
Seat 1: dddocky (button) showed [4d Ac] and won (1039) with a pair of Aces
Seat 2: Duke Croix (small blind) folded on the Flop
Seat 9: HighCardJasper (big blind) mucked [2c Kd]
`,
  output: {
    variant: 'NT',
    venue: 'PokerStars',
    table: 'fun time',
    antes: [0, 0, 0],
    blindsOrStraddles: [0, 50, 100],
    startingStacks: [10000, 10000, 10000],
    players: ['dddocky', 'Duke Croix', 'HighCardJasper'],
    time: '2020-09-17T14:52:46',
    timeZone: 'ET',
    seats: [1, 2, 9],
    actions: [
      'd dh p1 ????',
      'd dh p2 7s9c',
      'd dh p3 ????',
      'p1 cc',
      'p2 cc',
      'p3 cc',
      'd db 9d6dAd',
      'p2 cc',
      'p3 cbr 100',
      'p1 cbr 200',
      'p2 f',
      'p3 cc',
      'd db Th',
      'p3 cc',
      'p1 cbr 100',
      'p3 cc',
      'd db 3c',
      'p3 cc',
      'p1 cbr 100',
      'p3 cc',
      'p1 sm 4dAc',
      'p3 sm 2cKd',
    ],
    currency: 'PLAY',
    seatCount: 9,
    minBet: 100,
    day: 17,
    month: 9,
    year: 2020,
    hand: 218536444875,
    rake: 61,
    totalPot: 1100,
    timestamp: 1600368766000,
  },
  game: {
    smallBlindIndex: 1,
    bigBlindIndex: 2,
    players: [
      {
        name: 'dddocky',
        stack: 10539,
        position: 0,
        cards: ['4d', 'Ac'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 500,
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
        name: 'Duke Croix',
        stack: 9900,
        position: 1,
        cards: ['7s', '9c'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 100,
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
        name: 'HighCardJasper',
        stack: 9500,
        position: 2,
        cards: ['2c', 'Kd'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 500,
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
    ],
    board: ['9d', '6d', 'Ad', 'Th', '3c'],
    street: 'river',
    buttonIndex: 0,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 11,
    isBettingComplete: true,
    lastAction: 'p3 sm 2cKd',
    lastBetAction: 'p1 cbr 100',
    lastPlayerAction: 'p3 cc',
    isComplete: true,
    rake: 61,
    pot: 1039,
    rakePercentage: 0,
    table: '1',
    isRunOut: false,
    hand: 1,
    bigBlind: 100,
    minBet: 100,
    lastCompleteBet: 100,
    seatCount: 9,
    isPlayable: true,
    stats: [],
    isShowdown: false,
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
  },
};
