import { Game } from '../../Game';
import { calculateHandStrength, getRankCategory } from '../../game/evaluation';
import { compareHands } from '../../game/showdown';
import { finalizeStacks } from '../../game/stacks';
import type { Card, Player } from '../../types';

/**
 * Utility to create a Player with default values.
 * Allows overriding specific properties via `partialProps`.
 */
export function makePlayer(partialProps: Partial<Player>): Player {
  return {
    isInactive: false,
    rake: 0,
    name: 'unknown',
    stack: 0,
    totalBet: 0,
    hasFolded: false,
    hasShownCards: false,
    cards: [] as Card[],
    isAllIn: false,
    position: 0,
    hasActed: false,
    roundBet: 0,
    roundAction: null,
    winnings: 0,
    returns: 0,
    totalInvestments: 0,
    roundInvestments: 0,
    ...partialProps,
  };
}

/**
 * Utility to create a Game with default values.
 * Allows overriding specific properties via `partialProps`.
 * Calculates pot from totalBet of all players.
 */
export function makeGame(partialProps: Partial<Game>): Game {
  const defaultGame: Game = {
    venue: 'virtual',
    table: 'new',
    hand: 0,
    bigBlind: 0,
    stats: [],
    variant: 'NT',
    bet: 0,
    smallBlindIndex: 0,
    bigBlindIndex: 1,
    usedCards: 0,
    buttonIndex: 0,
    players: [],
    board: [] as Card[],
    pot: 0,
    street: 'river',
    isComplete: false,
    isBettingComplete: true,
    isShowdown: false,
    isRunOut: false,
    nextPlayerIndex: -1,
    gameTimestamp: Date.now(),
    minBet: 0,
    lastCompleteBet: 0,
    seatCount: 9,
    isPlayable: true,
  };

  const game = { ...defaultGame, ...partialProps };
  // Only auto-calc pot if it wasn't explicitly provided
  if (partialProps.pot === undefined) {
    game.pot = game.players.reduce((sum, player) => sum + player.totalBet, 0);
  }
  return game;
}

describe('Side-pot logic with 5 board cards and 2 player cards', () => {
  it('heads_up_showdown', () => {
    const game = makeGame({
      players: [
        makePlayer({
          name: 'p0',
          totalBet: 100,
          hasShownCards: true,
          cards: ['As', 'Kd'] as Card[],
        }),
        makePlayer({
          name: 'p1',
          totalBet: 100,
          hasShownCards: true,
          cards: ['Ah', 'Ad'] as Card[],
        }),
      ],
      board: ['2h', 'Jd', '4c', '5h', '9s'] as Card[],
    });

    const finishingStacks = finalizeStacks(game, compareHands);
    expect(finishingStacks[0]).toBe(0);
    expect(finishingStacks[1]).toBe(200);
  });

  it('winners_folded', () => {
    const game = makeGame({
      players: [
        makePlayer({
          name: 'p0',
          totalBet: 50,
          hasFolded: true,
          cards: ['Ac', 'Kc'] as Card[],
        }),
        makePlayer({
          name: 'p1',
          totalBet: 100,
          hasShownCards: true,
          cards: ['Kh', 'Kd'] as Card[],
        }),
        makePlayer({
          name: 'p2',
          totalBet: 75,
          hasFolded: true,
          cards: ['9d', '9c'] as Card[],
        }),
        makePlayer({
          name: 'p3',
          totalBet: 100,
          hasShownCards: true,
          cards: ['7h', '7s'] as Card[],
        }),
      ],
      board: ['2h', '3d', '4c', '5h', 'Ks'] as Card[],
    });

    const finishingStacks = finalizeStacks(game, compareHands);
    expect(finishingStacks[0]).toBe(0);
    expect(finishingStacks[1]).toBe(325);
    expect(finishingStacks[2]).toBe(0);
    expect(finishingStacks[3]).toBe(0);
  });

  it('multiway_pot_split', () => {
    const game = makeGame({
      players: [
        makePlayer({
          name: 'p0',
          totalBet: 100,
          hasShownCards: true,
          cards: ['Kh', 'Kd'] as Card[],
        }),
        makePlayer({
          name: 'p1',
          totalBet: 100,
          hasShownCards: true,
          cards: ['Ks', 'Kc'] as Card[],
        }),
        makePlayer({
          name: 'p2',
          totalBet: 100,
          hasShownCards: true,
          cards: ['Ah', '2s'] as Card[],
        }),
      ],
      board: ['2h', 'Qd', '4c', '5h', '9s'] as Card[],
    });

    const finishingStacks = finalizeStacks(game, compareHands);
    expect(finishingStacks[0]).toBe(150);
    expect(finishingStacks[1]).toBe(150);
    expect(finishingStacks[2]).toBe(0);
  });

  it('multiway_winner_takes_all', () => {
    const game = makeGame({
      players: [
        makePlayer({
          name: 'p0',
          totalBet: 200,
          hasShownCards: true,
          cards: ['As', 'Ks'] as Card[],
        }),
        makePlayer({
          name: 'p1',
          totalBet: 150,
          isAllIn: true,
          hasShownCards: true,
          cards: ['Kh', 'Kc'] as Card[],
        }),
        makePlayer({
          name: 'p2',
          totalBet: 200,
          hasShownCards: true,
          cards: ['Qs', 'Qh'] as Card[],
        }),
        makePlayer({
          name: 'p3',
          totalBet: 100,
          isAllIn: true,
          hasShownCards: true,
          cards: ['7h', '7s'] as Card[],
        }),
        makePlayer({
          name: 'p4',
          totalBet: 50,
          hasFolded: true,
          cards: ['Ac', 'Ad'] as Card[],
        }),
      ],
      board: ['Td', '2d', 'Qd', 'Kd', '7h'] as Card[],
    });

    const finalizedStacks = finalizeStacks(game, compareHands);
    const values = game.players.map((p, i) => ({
      category: getRankCategory(
        calculateHandStrength(game.players[i].cards.concat(game.board) as Card[])
      ),
      strength: calculateHandStrength(game.players[i].cards.concat(game.board) as Card[]),
      cards: game.players[i].cards.concat(game.board),
      stack: p.stack,
      finalStack: finalizedStacks[i],
      totalBet: p.totalBet,
    }));
    expect(values.map(v => v.totalBet)).toEqual([200, 150, 200, 100, 50]);
    expect(values.map(v => v.finalStack)).toEqual([0, 600, 100, 0, 0]);
  });

  describe('uncalled bets', () => {
    it('should return uncalled portion without rake', () => {
      const game = makeGame({
        players: [
          makePlayer({
            name: 'p0',
            totalBet: 1000,
            hasShownCards: true,
            hasActed: true,
            cards: ['As', 'Ks'] as Card[],
          }),
          makePlayer({
            name: 'p1',
            totalBet: 500,
            hasShownCards: true,
            hasActed: true,
            isAllIn: true,
            cards: ['Kh', 'Kc'] as Card[],
          }),
          makePlayer({
            name: 'p2',
            totalBet: 500,
            hasShownCards: true,
            hasActed: true,
            cards: ['Qs', 'Qh'] as Card[],
            isAllIn: true,
          }),
        ],
        board: ['2h', '3d', '4c', '5h', '9s'] as Card[],
        street: 'river',
        rakePercentage: 0.05,
        isBettingComplete: true,
      });

      const finishingStacks = finalizeStacks(game, compareHands);
      expect(finishingStacks).toEqual([1925, 0, 0]);
    });

    it('should handle a single uncalled bet correctly', () => {
      const game = makeGame({
        players: [
          makePlayer({
            name: 'p0',
            totalBet: 3000,
            hasShownCards: true,
            hasActed: true,
            cards: ['As', 'Ks'] as Card[],
          }),
          makePlayer({
            name: 'p1',
            totalBet: 1000,
            hasShownCards: true,
            hasActed: true,
            isAllIn: true,
            cards: ['Kh', 'Kc'] as Card[],
          }),
          makePlayer({
            name: 'p2',
            totalBet: 1000,
            hasShownCards: true,
            hasActed: true,
            isAllIn: true,
            cards: ['Qs', 'Qh'] as Card[],
          }),
        ],
        board: ['2h', '3d', '4c', '5h', '9s'] as Card[],
        street: 'river',
        rakePercentage: 0.05,
        isBettingComplete: true,
      });

      const finishingStacks = finalizeStacks(game, compareHands);

      // Validate results
      expect(finishingStacks).toEqual([4850, 0, 0]); // Player 0 wins everything
    });

    it('should return uncalled bet when everyone folds', () => {
      const game = makeGame({
        players: [
          makePlayer({
            name: 'p0',
            totalBet: 1000,
            hasShownCards: null,
            cards: ['As', 'Ks'] as Card[],
          }),
          makePlayer({
            name: 'p1',
            totalBet: 500,
            hasFolded: true,
            cards: ['Kh', 'Kc'] as Card[],
          }),
          makePlayer({
            name: 'p2',
            totalBet: 500,
            hasFolded: true,
            cards: ['Qs', 'Qh'] as Card[],
          }),
        ],
        board: ['2d', '3d', '4c', '5h', '9s'] as Card[],
        rakePercentage: 0.05,
      });

      const finishingStacks = finalizeStacks(game, compareHands);

      // p0 should get all bets back without rake since everyone folded
      expect(finishingStacks[0]).toBe(2000); // Full pot without rake
      expect(finishingStacks[1]).toBe(0);
      expect(finishingStacks[2]).toBe(0);
    });
    it('should handle uncalled bet with multiple side pots', () => {
      const game = makeGame({
        players: [
          makePlayer({
            name: 'p0',
            totalBet: 3000,
            hasShownCards: true,
            cards: ['As', 'Ks'] as Card[],
          }),
          makePlayer({
            name: 'p1',
            totalBet: 2000,
            isAllIn: true,
            hasShownCards: true,
            cards: ['Kh', 'Kc'] as Card[],
          }),
          makePlayer({
            name: 'p2',
            totalBet: 1000,
            isAllIn: true,
            hasShownCards: true,
            cards: ['Qs', 'Qh'] as Card[],
          }),
        ],
        board: ['2h', '3d', '4c', '5h', '9s'] as Card[],
        rakePercentage: 0.05,
      });

      const finishingStacks = finalizeStacks(game, compareHands);

      expect(finishingStacks[0]).toBe(5750); // p0 wins everything, 100 is lost due to rake in split pot
      expect(finishingStacks[1]).toBe(0); // p1 loses
      expect(finishingStacks[2]).toBe(0); // p2 loses
    });
  });

  describe('rake rules', () => {
    it('should not take rake when hand ends preflop (no flop, no drop)', () => {
      const game = makeGame({
        players: [
          makePlayer({
            name: 'p0',
            totalBet: 1000,
            hasShownCards: null,
            cards: ['As', 'Ks'] as Card[],
          }),
          makePlayer({
            name: 'p1',
            totalBet: 500,
            hasFolded: true,
            cards: ['Kh', 'Kc'] as Card[],
          }),
          makePlayer({
            name: 'p2',
            totalBet: 500,
            hasFolded: true,
            cards: ['Qs', 'Qh'] as Card[],
          }),
        ],
        board: [] as Card[],
        street: 'preflop',
        rakePercentage: 0.05,
      });

      const finishingStacks = finalizeStacks(game, compareHands);

      // p0 should get entire pot without rake since hand ended preflop
      expect(finishingStacks[0]).toBe(2000);
      expect(finishingStacks[1]).toBe(0);
      expect(finishingStacks[2]).toBe(0);
    });

    it('should take rake when hand ends postflop', () => {
      const game = makeGame({
        players: [
          makePlayer({
            name: 'p0',
            totalBet: 1000,
            hasShownCards: true,
            cards: ['As', 'Ks'] as Card[],
          }),
          makePlayer({
            name: 'p1',
            totalBet: 1000,
            hasShownCards: true,
            cards: ['Kh', 'Kc'] as Card[],
          }),
        ],
        board: ['2h', '3d', '8c', '5h', '9s'] as Card[],
        street: 'river',
        rakePercentage: 0.05,
      });

      const finishingStacks = finalizeStacks(game, compareHands);

      // Total pot is 2000, rake is 5% = 100
      // Winner should get 1900
      expect(finishingStacks[1]).toBe(1900);
      expect(finishingStacks[0]).toBe(0);
    });
  });

  it('should account for dead blinds/money not in totalBets', () => {
    const game = makeGame({
      players: [
        makePlayer({
          name: 'p0',
          totalBet: 100,
          hasShownCards: true,
          cards: ['As', 'Ks'] as Card[], // straight A-5
        }),
        makePlayer({
          name: 'p1',
          totalBet: 100,
          hasShownCards: true,
          cards: ['Kh', 'Kc'] as Card[], // pair
        }),
      ],
      board: ['2h', '3d', '4c', '5h', '9s'] as Card[],
      pot: 250, // 200 from bets + 50 dead money
    });

    const finishingStacks = finalizeStacks(game, compareHands);
    expect(finishingStacks[0]).toBe(250); // Winner takes all (250)
    expect(finishingStacks[1]).toBe(0);
  });
});
