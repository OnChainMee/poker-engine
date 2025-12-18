/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import { HandFixture } from '../testHandFixture';

export const fixture: HandFixture = {
  title: '12-check-raise-on-paired-board',
  description: `A hand featuring a check-raise on a paired board.
    Interesting aspects:
    - Multiple players seeing flop
    - Check-raise on turn with paired board
    - River bet and raise sequence
    - Shows proper handling of chat messages
    - Tests handling of uncalled bets
    - Demonstrates proper tracking of pot and rake`,
  input: `
PokerStars Home Game Hand #209488466412: {Zoj Club}  Hold'em No Limit (250/500) - 2020/02/23 18:37:30 ET
Table '9man 50-1 ring nlhe' 9-max (Play Money) Seat #1 is the button
Seat 1: busta_nutz11 (49605 in chips)
Seat 2: markson823 (27376 in chips)
Seat 4: TyxoSaveMe (54950 in chips)
Seat 5: Ianarky420 (54400 in chips)
Seat 6: SpiritMolecule (40250 in chips)
Seat 9: 2EASE (42965 in chips)
markson823: posts small blind 250
TyxoSaveMe: posts big blind 500
*** HOLE CARDS ***
Dealt to TyxoSaveMe [7s 2d]
TyxoSaveMe said, "cd bane gl"
Ianarky420: folds
SpiritMolecule: calls 500
2EASE: calls 500
busta_nutz11: calls 500
markson823: calls 250
TyxoSaveMe: checks
*** FLOP *** [4c 8c 5h]
markson823: checks
TyxoSaveMe: checks
SpiritMolecule: checks
2EASE: checks
busta_nutz11: checks
*** TURN *** [4c 8c 5h] [8s]
markson823: bets 2362
busta_nutz11 said, "lol"
TyxoSaveMe: folds
SpiritMolecule: calls 2362
2EASE: folds
busta_nutz11: folds
*** RIVER *** [4c 8c 5h 8s] [Ad]
markson823: bets 3413
SpiritMolecule: raises 3413 to 6826
markson823: folds
Uncalled bet (3413) returned to SpiritMolecule
SpiritMolecule collected 13277 from pot
*** SUMMARY ***
Total pot 14050 | Rake 773
Board [4c 8c 5h 8s Ad]
Seat 1: busta_nutz11 (button) folded on the Turn
Seat 2: markson823 (small blind) folded on the River
Seat 4: TyxoSaveMe (big blind) folded on the Turn
Seat 5: Ianarky420 folded before Flop (didn't bet)
Seat 6: SpiritMolecule collected (13277)
Seat 9: 2EASE folded on the Turn
`,
  output: {
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p3 7s2d',
      'd dh p4 ????',
      'd dh p5 ????',
      'd dh p6 ????',
      'p3 m cd bane gl',
      'p4 f',
      'p5 cc',
      'p6 cc',
      'p1 cc',
      'p2 cc',
      'p3 cc',
      'd db 4c8c5h',
      'p2 cc',
      'p3 cc',
      'p5 cc',
      'p6 cc',
      'p1 cc',
      'd db 8s',
      'p2 cbr 2362',
      'p1 m lol',
      'p3 f',
      'p5 cc',
      'p6 f',
      'p1 f',
      'd db Ad',
      'p2 cbr 3413',
      'p5 cbr 6826',
      'p2 f',
    ],
    antes: [0, 0, 0, 0, 0, 0],
    blindsOrStraddles: [0, 250, 500, 0, 0, 0],
    currency: 'PLAY',
    day: 23,
    hand: 209488466412,
    minBet: 500,
    month: 2,
    players: ['busta_nutz11', 'markson823', 'TyxoSaveMe', 'Ianarky420', 'SpiritMolecule', '2EASE'],
    rake: 773,
    seatCount: 9,
    seats: [1, 2, 4, 5, 6, 9],
    startingStacks: [49605, 27376, 54950, 54400, 40250, 42965],
    table: '9man 50-1 ring nlhe',
    time: '2020-02-23T18:37:30',
    timeZone: 'ET',
    totalPot: 14050,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2020,
    timestamp: 1582501050000,
  },
  game: {
    smallBlindIndex: 1,
    bigBlindIndex: 2,
    players: [
      {
        name: 'busta_nutz11',
        stack: 49105,
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
        stack: 21351,
        position: 1,
        cards: ['??', '??'],
        hasFolded: true,
        hasActed: true,
        roundBet: 0,
        totalBet: 6025,
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
        stack: 54450,
        position: 2,
        cards: ['7s', '2d'],
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
        name: 'Ianarky420',
        stack: 54400,
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
        name: 'SpiritMolecule',
        stack: 50114,
        position: 4,
        cards: ['??', '??'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 9688,
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
        stack: 42465,
        position: 5,
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
    board: ['4c', '8c', '5h', '8s', 'Ad'],
    pot: 13277,
    street: 'river',
    buttonIndex: 0,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 17,
    isBettingComplete: true,
    lastAction: 'p2 f',
    lastBetAction: 'p5 cbr 6826',
    lastPlayerAction: 'p2 f',
    isComplete: true,
    rake: 773,
    rakePercentage: 0,
    table: '1',
    isRunOut: false,
    hand: 12,
    bigBlind: 100,
    stats: [],
    isShowdown: false,
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
  },
};
