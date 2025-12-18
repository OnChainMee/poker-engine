/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import { HandFixture } from '../testHandFixture';

export const fixture: HandFixture = {
  title: '10-flush-draw-completion',
  description: `A hand featuring a flush draw that completes on the turn.
    Interesting aspects:
    - Multiple big blind postings
    - Trips on flop with flush draw
    - Turn completes flush draw
    - River raise and call
    - Shows proper handling of mucked hands
    - Tests handling of multiple big blinds`,
  input: `
PokerStars Home Game Hand #209488505059: {Zoj Club}  Hold'em No Limit (250/500) - 2020/02/23 18:38:46 ET
Table '9man 50-1 ring nlhe' 9-max (Play Money) Seat #2 is the button
Seat 1: busta_nutz11 (48105 in chips)
Seat 2: markson823 (20601 in chips)
Seat 4: TyxoSaveMe (50324 in chips)
Seat 5: Ianarky420 (53900 in chips)
Seat 6: SpiritMolecule (47252 in chips)
Seat 7: bbanee (26035 in chips)
Seat 8: The_Spy_Fly215 (30000 in chips)
Seat 9: 2EASE (42465 in chips)
TyxoSaveMe: posts small blind 250
Ianarky420: posts big blind 500
bbanee: posts big blind 500
The_Spy_Fly215: posts big blind 500
*** HOLE CARDS ***
Dealt to TyxoSaveMe [7s 9h]
SpiritMolecule: folds
bbanee: checks
The_Spy_Fly215: checks
2EASE: calls 500
busta_nutz11: calls 500
markson823: folds
TyxoSaveMe: calls 250
Ianarky420: checks
*** FLOP *** [Tc 7c 7d]
TyxoSaveMe: checks
Ianarky420: checks
bbanee: checks
The_Spy_Fly215: checks
2EASE: checks
busta_nutz11: checks
*** TURN *** [Tc 7c 7d] [Ac]
TyxoSaveMe: bets 500
Ianarky420: folds
bbanee: calls 500
The_Spy_Fly215: folds
2EASE: folds
busta_nutz11: calls 500
*** RIVER *** [Tc 7c 7d Ac] [4h]
TyxoSaveMe: bets 500
bbanee: raises 2626 to 3126
busta_nutz11: folds
TyxoSaveMe: calls 2626
*** SHOW DOWN ***
bbanee: shows [8c Qc] (a flush, Ace high)
TyxoSaveMe: mucks hand
bbanee collected 10161 from pot
*** SUMMARY ***
Total pot 10752 | Rake 591
Board [Tc 7c 7d Ac 4h]
Seat 1: busta_nutz11 folded on the River
Seat 2: markson823 (button) folded before Flop (didn't bet)
Seat 4: TyxoSaveMe (small blind) mucked [7s 9h]
Seat 5: Ianarky420 (big blind) folded on the Turn
Seat 6: SpiritMolecule folded before Flop (didn't bet)
Seat 7: bbanee showed [8c Qc] and won (10161) with a flush, Ace high
Seat 8: The_Spy_Fly215 folded on the Turn
Seat 9: 2EASE folded on the Turn
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p3 7s9h',
      'd dh p4 ????',
      'd dh p5 ????',
      'd dh p6 ????',
      'd dh p7 ????',
      'd dh p8 ????',
      'p5 f',
      'p6 cc',
      'p7 cc',
      'p8 cc',
      'p1 cc',
      'p2 f',
      'p3 cc',
      'p4 cc',
      'd db Tc7c7d',
      'p3 cc',
      'p4 cc',
      'p6 cc',
      'p7 cc',
      'p8 cc',
      'p1 cc',
      'd db Ac',
      'p3 cbr 500',
      'p4 f',
      'p6 cc',
      'p7 f',
      'p8 f',
      'p1 cc',
      'd db 4h',
      'p3 cbr 500',
      'p6 cbr 3126',
      'p1 f',
      'p3 cc',
      'p6 sm 8cQc',
      'p3 sm 7s9h',
    ],
    antes: [0, 0, 0, 0, 0, 0, 0, 0],
    blindsOrStraddles: [0, 0, 250, 500, 0, 500, 500, 0],
    currency: 'PLAY',
    day: 23,
    hand: 209488505059,
    minBet: 500,
    month: 2,
    players: [
      'busta_nutz11',
      'markson823',
      'TyxoSaveMe',
      'Ianarky420',
      'SpiritMolecule',
      'bbanee',
      'The_Spy_Fly215',
      '2EASE',
    ],
    rake: 591,
    seatCount: 9,
    seats: [1, 2, 4, 5, 6, 7, 8, 9],
    startingStacks: [48105, 20601, 50324, 53900, 47252, 26035, 30000, 42465],
    table: '9man 50-1 ring nlhe',
    time: '2020-02-23T18:38:46',
    timeZone: 'ET',
    totalPot: 10752,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2020,
    timestamp: 1582501126000,
  },
  game: {
    smallBlindIndex: 2,
    bigBlindIndex: 3,
    players: [
      {
        name: 'busta_nutz11',
        stack: 47105,
        position: 0,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 1000,
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
        name: 'markson823',
        stack: 20601,
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
        name: 'TyxoSaveMe',
        stack: 46448,
        position: 2,
        cards: ['7s', '9h'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 3876,
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
        name: 'Ianarky420',
        stack: 53400,
        position: 3,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 500,
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
        name: 'SpiritMolecule',
        stack: 47252,
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
        name: 'bbanee',
        stack: 32070,
        position: 5,
        cards: ['8c', 'Qc'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 4126,
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
        name: 'The_Spy_Fly215',
        stack: 29500,
        position: 6,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 500,
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
        name: '2EASE',
        stack: 41965,
        position: 7,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 500,
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
    board: ['Tc', '7c', '7d', 'Ac', '4h'],
    pot: 10161,
    street: 'river',
    buttonIndex: 1,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 21,
    isBettingComplete: true,
    lastAction: 'p3 sm 7s9h',
    lastBetAction: 'p6 cbr 3126',
    lastPlayerAction: 'p3 cc',
    isComplete: true,
    rake: 591,
    rakePercentage: 0,
    table: '1',
    isRunOut: false,
    hand: 10,
    bigBlind: 100,
    stats: [],
    isShowdown: false,
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
  },
};
