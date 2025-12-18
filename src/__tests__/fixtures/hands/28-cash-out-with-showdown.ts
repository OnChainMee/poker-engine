/**
 * @instructions This is a test fixture for validating hand parsing and state tracking.
 * The input hand text should never be modified. All other values should match the types
 * and follow the game state correctly.
 */

import type { HandFixture } from '../testHandFixture';

export const fixture: HandFixture = {
  title: '28-cash-out-with-showdown',
  description: `A hand featuring a cash out after showdown and a player sitting out.
    Interesting aspects:
    - Player sitting out
    - Extra blinds posted
    - Showdown with cash out feature
    - Full hand with all streets
    - Partial all-in situation`,
  input: `PokerStars Hand #252334725632:  Hold'em No Limit ($0.50/$1.00 USD) - 2024/09/07 14:10:12 ET
Table 'Boliviana' 6-max Seat #6 is the button
Seat 3: aby100 ($141.21 in chips) is sitting out
Seat 1: rao999 ($101 in chips)
Seat 2: Twistenko ($102.38 in chips)
Seat 4: barbardakas ($10 in chips)
Seat 5: Sis_o_Ruen ($95 in chips)
Seat 6: nnh1984 ($14.66 in chips)
rao999: posts small blind $0.50
Twistenko: posts big blind $1
aby100: sits out
barbardakas: posts small & big blinds $1.50
*** HOLE CARDS ***
barbardakas: checks
Sis_o_Ruen: folds
nnh1984: calls $1
rao999: folds
Twistenko: checks
*** FLOP *** [8s Jh 2s]
Twistenko: checks
barbardakas: checks
nnh1984: bets $3.80
Twistenko: folds
barbardakas: raises $4.20 to $8
nnh1984: raises $4.20 to $12.20
barbardakas: calls $0.50 and is all-in
Uncalled bet ($3.70) returned to nnh1984
*** TURN *** [8s Jh 2s] [2d]
*** RIVER *** [8s Jh 2s 2d] [9c]
*** SHOW DOWN ***
barbardakas: shows [Th Qs] (a straight, Eight to Queen)
nnh1984: shows [Kd 8c] (two pair, Eights and Deuces)
barbardakas cashed out the hand for $8.01 | Cash Out Fee $0.16
*** SUMMARY ***
Total pot $21 | Rake $1.05
Board [8s Jh 2s 2d 9c]
Seat 3: aby100
Seat 1: rao999 (small blind) folded before Flop
Seat 2: Twistenko (big blind) folded on the Flop
Seat 4: barbardakas showed [Th Qs] and won ($19.95) with a straight, Eight to Queen (pot not awarded as player cashed out)
Seat 5: Sis_o_Ruen folded before Flop (didn't bet)
Seat 6: nnh1984 (button) showed [Kd 8c] and lost with two pair, Eights and Deuces`,
  output: {
    _deadBlinds: [0, 0, 0, 0.5, 0, 0],
    _inactive: [0, 0, 1, 0, 0, 0],
    actions: [
      'd dh p1 ????',
      'd dh p2 ????',
      'd dh p4 ????',
      'd dh p5 ????',
      'd dh p6 ????',
      'p4 cc',
      'p5 f',
      'p6 cc',
      'p1 f',
      'p2 cc',
      'd db 8sJh2s',
      'p2 cc',
      'p4 cc',
      'p6 cbr 3.8',
      'p2 f',
      'p4 cbr 8',
      'p6 cbr 12.2',
      'p4 cc 0.5',
      'd db 2d',
      'd db 9c',
      'p4 sm ThQs',
      'p6 sm Kd8c',
    ],
    antes: [0, 0, 0, 0, 0, 0],
    blindsOrStraddles: [0.5, 1, 0, 1, 0, 0],
    currency: 'USD',
    day: 7,
    hand: 252334725632,
    minBet: 1,
    month: 9,
    players: ['rao999', 'Twistenko', 'aby100', 'barbardakas', 'Sis_o_Ruen', 'nnh1984'],
    rake: 1.05,
    seatCount: 6,
    seats: [3, 1, 2, 4, 5, 6],
    startingStacks: [101, 102.38, 141.21, 10, 95, 14.66],
    table: 'Boliviana',
    time: '2024-09-07T14:10:12',
    timeZone: 'ET',
    totalPot: 21,
    variant: 'NT',
    venue: 'PokerStars',
    year: 2024,
    timestamp: 1725732612000,
  },
  game: {
    players: [
      {
        name: 'rao999',
        stack: 100.5,
        position: 0,
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
        name: 'Twistenko',
        stack: 101.38,
        position: 1,
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
        name: 'aby100',
        stack: 141.21,
        position: 2,
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
        name: 'barbardakas',
        stack: 0,
        position: 3,
        cards: ['Th', 'Qs'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 10,
        isAllIn: true,
        hasShownCards: true,
        rake: 0,
        winnings: 19.95,
        isInactive: false,
        returns: 0,
        totalInvestments: 0,
        roundInvestments: 0,
        roundAction: null,
      },
      {
        name: 'Sis_o_Ruen',
        stack: 95,
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
        name: 'nnh1984',
        stack: 6.16,
        position: 5,
        cards: ['Kd', '8c'],
        hasFolded: false,
        hasActed: true,
        roundBet: 0,
        totalBet: 8.5,
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
    board: ['8s', 'Jh', '2s', '2d', '9c'],
    street: 'river',
    buttonIndex: 5,
    bet: 0,
    variant: 'NT',
    venue: 'PokerStars',
    usedCards: 13,
    isBettingComplete: true,
    lastAction: 'p4 co 8.01',
    lastBetAction: 'p6 cbr 12.2',
    lastPlayerAction: 'p4 co 8.01',
    isComplete: true,
    rake: 1.05,
    pot: 19.95,
    rakePercentage: 0,
    table: 'Boliviana',
    hand: 28,
    bigBlind: 1,
    minBet: 1,
    lastCompleteBet: 1,
    seatCount: 9,
    isPlayable: true,
    stats: [],
    isShowdown: true,
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
    smallBlindIndex: 0,
    bigBlindIndex: 1,
    isRunOut: false,
  },
};
