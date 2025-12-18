import { describe, expect, test } from 'vitest';
import { parseHand } from '../../formats/pokerstars/parse';
import { Game } from '../../Game';
import type { Player } from '../../types';
import { fixtures } from '../fixtures/hands';

describe('parseHand', () => {
  fixtures.forEach(fixture => {
    test(fixture.title, () => {
      const game = parseHand(fixture.input);
      expect(game).toEqual(fixture.output);
    });
  });
});

describe('createGame', () => {
  fixtures.forEach(fixture => {
    test(fixture.title, () => {
      const hand = parseHand(fixture.input);
      const game = Game(hand);
      // Only compare essential properties, excluding stacks, rake, and pot calculations
      const { players, board, street, buttonIndex, variant, isBettingComplete, isComplete } =
        fixture.game;

      expect({
        players: game.players.map(
          ({ name, position, cards, hasFolded, hasActed, isAllIn, hasShownCards }) => ({
            name,
            position,
            cards,
            hasFolded,
            hasActed,
            isAllIn,
            hasShownCards,
          })
        ),
        board,
        street,
        buttonIndex,
        variant,
        isBettingComplete,
        isComplete,
      }).toEqual({
        players: players.map(
          ({ name, position, cards, hasFolded, hasActed, isAllIn, hasShownCards }: Player) => ({
            name,
            position,
            cards,
            hasFolded,
            hasActed,
            isAllIn,
            hasShownCards,
          })
        ),
        board,
        street,
        buttonIndex,
        variant,
        isBettingComplete,
        isComplete,
      });
    });
  });
});
