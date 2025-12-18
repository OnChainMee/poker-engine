import { describe, expect, test } from 'vitest';
import { Game } from '../../Game';
import type { Hand } from '../../Hand';
import { parseHand } from '../../formats/pokerstars/parse';

export interface HandFixture {
  title: string;
  description: string;
  input: string;
  output: Hand;
  game: Game;
}

/**
 * Helper function to run tests for a hand fixture.
 * This ensures stack traces point to the fixture file instead of the test entry point.
 */
export function testHandFixture(fixture: HandFixture) {
  describe(fixture.title, () => {
    test('parseHand', () => {
      const hand = parseHand(fixture.input);
      expect(hand).toEqual(fixture.output);
    });

    test('createGame', () => {
      const hand = parseHand(fixture.input);
      expect(Game(hand, hand.actions)).toEqual(fixture.game);
    });
  });
}
