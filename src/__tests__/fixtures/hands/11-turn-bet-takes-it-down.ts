/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import { HandFixture } from '../testHandFixture';

export const fixture: HandFixture = {
  title: '11-turn-bet-takes-it-down',
  description: `A hand featuring a turn bet that wins without showdown.
    Interesting aspects:
    - Multiple players seeing flop
    - Check through on flop
    - Turn bet wins without showdown
    - Shows proper handling of chat messages
    - Tests handling of hidden hole cards when winner doesn't show
    - Demonstrates proper tracking of uncalled bets`,
  input: `
PokerStars Home Game Hand #209488539959: {Zoj Club}  Hold'em No Limit (250/500) - 2020/02/23 18:40:01 ET
Table '9man 50-1 ring nlhe' 9-max (Play Money) Seat #4 is the button
Seat 1: busta_nutz11 (48105 in chips)
Seat 2: markson823 (21101 in chips)
Seat 4: TyxoSaveMe (50324 in chips)
Seat 5: Ianarky420 (53900 in chips)
Seat 6: SpiritMolecule (47252 in chips)
Seat 7: bbanee (26035 in chips)
Seat 8: The_Spy_Fly215 (29500 in chips)
Seat 9: 2EASE (41965 in chips)
Ianarky420: posts small blind 250
SpiritMolecule: posts big blind 500
*** HOLE CARDS ***
Dealt to TyxoSaveMe [3d 4d]
bbanee: folds
The_Spy_Fly215: folds
2EASE: folds
busta_nutz11: calls 500
markson823: calls 500
TyxoSaveMe: calls 500
Ianarky420: calls 250
SpiritMolecule: checks
*** FLOP *** [4h Kd Ac]
Ianarky420: checks
SpiritMolecule: checks
busta_nutz11: checks
markson823: checks
TyxoSaveMe said, "nice hand"
TyxoSaveMe: checks
*** TURN *** [4h Kd Ac] [6d]
Ianarky420: checks
SpiritMolecule: checks
busta_nutz11: checks
markson823: checks
TyxoSaveMe: bets 1181
Ianarky420: folds
busta_nutz11 said, "im a vegan"
SpiritMolecule: folds
busta_nutz11: folds
markson823: folds
Uncalled bet (1181) returned to TyxoSaveMe
TyxoSaveMe collected 2362 from pot
TyxoSaveMe: doesn't show hand
*** SUMMARY ***
Total pot 2500 | Rake 138
Board [4h Kd Ac 6d]
Seat 1: busta_nutz11 folded on the Turn
Seat 2: markson823 folded on the Turn
Seat 4: TyxoSaveMe (button) collected (2362)
Seat 5: Ianarky420 (small blind) folded on the Turn
Seat 6: SpiritMolecule folded before Flop (didn't bet)
Seat 7: bbanee folded before Flop (didn't bet)
Seat 8: The_Spy_Fly215 folded before Flop (didn't bet)
Seat 9: 2EASE folded before Flop (didn't bet)
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p3 3d4d',
      'd dh p4 ????',
      'd dh p5 ????',
      'd dh p6 ????',
      'd dh p7 ????',
      'd dh p8 ????',
      'p6 f',
      'p7 f',
      'p8 f',
      'p1 cc',
      'p2 cc',
      'p3 cc',
      'p4 cc',
      'p5 cc',
      'd db 4hKdAc',
      'p4 cc',
      'p5 cc',
      'p1 cc',
      'p2 cc',
      'p3 m nice hand',
      'p3 cc',
      'd db 6d',
      'p4 cc',
      'p5 cc',
      'p1 cc',
      'p2 cc',
      'p3 cbr 1181',
      'p4 f',
      'p1 m im a vegan',
      'p5 f',
      'p1 f',
      'p2 f',
    ],
    antes: [0, 0, 0, 0, 0, 0, 0, 0],
    blindsOrStraddles: [0, 0, 0, 250, 500, 0, 0, 0],
    currency: 'PLAY',
    day: 23,
    hand: 209488539959,
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
    rake: 138,
    seatCount: 9,
    seats: [1, 2, 4, 5, 6, 7, 8, 9],
    startingStacks: [48105, 21101, 50324, 53900, 47252, 26035, 29500, 41965],
    table: '9man 50-1 ring nlhe',
    time: '2020-02-23T18:40:01',
    timeZone: 'ET',
    totalPot: 2500,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2020,
    timestamp: 1582501201000,
  },
  game: {
    smallBlindIndex: 3,
    bigBlindIndex: 4,
    players: [
      {
        name: 'busta_nutz11',
        stack: 47605,
        position: 0,
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
        name: 'markson823',
        stack: 20601,
        position: 1,
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
        name: 'TyxoSaveMe',
        stack: 52367,
        position: 2,
        cards: ['3d', '4d'],
        hasFolded: false,
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
        name: 'Ianarky420',
        stack: 53650,
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
        stack: 46752,
        position: 4,
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
        name: 'bbanee',
        stack: 26035,
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
      {
        name: 'The_Spy_Fly215',
        stack: 29500,
        position: 6,
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
        name: '2EASE',
        stack: 41965,
        position: 7,
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
    board: ['4h', 'Kd', 'Ac', '6d'],
    pot: 2362,
    street: 'turn',
    buttonIndex: 2,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 20,
    isBettingComplete: true,
    lastAction: 'p2 f',
    lastBetAction: 'p3 cbr 1181',
    lastPlayerAction: 'p2 f',
    isComplete: true,
    rake: 138,
    rakePercentage: 0,
    table: '1',
    isRunOut: false,
    hand: 11,
    bigBlind: 100,
    stats: [],
    isShowdown: false,
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
  },
};
