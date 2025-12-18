/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import { HandFixture } from '../../..';

export const fixture: HandFixture = {
  title: '02-preflop-raise-and-turn-bet',
  description: `A hand featuring an all-in situation with a flush draw completion.
    Interesting aspects:
    - All-in preflop with caller
    - Multiple players folding to all-in
    - Flush draw completing on turn
    - Shows proper handling of all-in player state
    - Demonstrates pot and rake calculation with all-in situation`,
  input: `
PokerStars Home Game Hand #218536545619: {Club #3225207}  Hold'em No Limit (50/100) - 2020/09/17 14:55:50 ET
Table 'fun time' 9-max (Play Money) Seat #3 is the button
Seat 1: dddocky (9839 in chips)
Seat 2: Duke Croix (9450 in chips)
Seat 3: color_singleton (9400 in chips)
Seat 5: Klemtonius (11904 in chips)
Seat 9: HighCardJasper (9189 in chips)
Klemtonius: posts small blind 50
HighCardJasper: posts big blind 100
*** HOLE CARDS ***
Dealt to Duke Croix [Ad 5s]
dddocky: folds
Duke Croix: raises 200 to 300
color_singleton: folds
Klemtonius: folds
HighCardJasper: calls 200
*** FLOP *** [5h Qh Jh]
HighCardJasper: checks
Duke Croix: checks
*** TURN *** [5h Qh Jh] [2s]
HighCardJasper: bets 300
Duke Croix: folds
Uncalled bet (300) returned to HighCardJasper
HighCardJasper collected 614 from pot
HighCardJasper: doesn't show hand
*** SUMMARY ***
Total pot 650 | Rake 36
Board [5h Qh Jh 2s]
Seat 1: dddocky folded before Flop (didn't bet)
Seat 2: Duke Croix folded on the Turn
Seat 3: color_singleton (button) folded before Flop (didn't bet)
Seat 5: Klemtonius (small blind) folded before Flop
Seat 9: HighCardJasper (big blind) collected (614)
`,
  output: {
    venue: 'PokerStars',
    table: 'fun time',
    seats: [1, 2, 3, 5, 9],
    actions: [
      'd dh p1 ????',
      'd dh p2 Ad5s',
      'd dh p3 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'p1 f',
      'p2 cbr 300',
      'p3 f',
      'p4 f',
      'p5 cc',
      'd db 5hQhJh',
      'p5 cc',
      'p2 cc',
      'd db 2s',
      'p5 cbr 300',
      'p2 f',
    ],
    antes: [0, 0, 0, 0, 0],
    blindsOrStraddles: [0, 0, 0, 50, 100],
    currency: 'PLAY',
    day: 17,
    hand: 218536545619,
    minBet: 100,
    month: 9,
    players: ['dddocky', 'Duke Croix', 'color_singleton', 'Klemtonius', 'HighCardJasper'],
    rake: 36,
    seatCount: 9,
    startingStacks: [9839, 9450, 9400, 11904, 9189],
    time: '2020-09-17T14:55:50',
    timeZone: 'ET',
    totalPot: 650,
    variant: 'NT',
    year: 2020,
    timestamp: 1600368950000,
  },
  game: {
    smallBlindIndex: 3,
    bigBlindIndex: 4,
    variant: 'NT',
    venue: 'PokerStars',
    players: [
      {
        name: 'dddocky',
        stack: 9839,
        cards: ['??', '??'],
        roundBet: 0,
        totalBet: 0,
        hasActed: true,
        hasFolded: true,
        isAllIn: false,
        hasShownCards: null,
        position: 0,
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
        stack: 9150,
        cards: ['Ad', '5s'],
        roundBet: 0,
        totalBet: 300,
        hasActed: true,
        hasFolded: true,
        isAllIn: false,
        hasShownCards: null,
        position: 1,
        rake: 0,
        winnings: 0,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'color_singleton',
        stack: 9400,
        cards: ['??', '??'],
        roundBet: 0,
        totalBet: 0,
        hasActed: true,
        hasFolded: true,
        isAllIn: false,
        hasShownCards: null,
        position: 2,
        rake: 0,
        winnings: 0,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'Klemtonius',
        stack: 11854,
        cards: ['??', '??'],
        roundBet: 0,
        totalBet: 50,
        hasActed: true,
        hasFolded: true,
        isAllIn: false,
        hasShownCards: null,
        position: 3,
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
        stack: 9503,
        cards: ['??', '??'],
        roundBet: 0,
        totalBet: 600,
        hasActed: true,
        hasFolded: false,
        isAllIn: false,
        hasShownCards: null,
        position: 4,
        rake: 0,
        winnings: 0,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
    ],
    board: ['5h', 'Qh', 'Jh', '2s'],
    bet: 0,
    bigBlind: 100,
    buttonIndex: 2,
    street: 'turn',
    isBettingComplete: true,
    isComplete: true,
    usedCards: 14,
    rake: 36,
    rakePercentage: 0,
    seed: undefined,
    stats: [],
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
    lastAction: 'p2 f',
    lastPlayerAction: 'p2 f',
    lastBetAction: 'p5 cbr 300',
    pot: 614,
    table: '1',
    isRunOut: false,
    hand: 2,
    isShowdown: false,
  },
};
