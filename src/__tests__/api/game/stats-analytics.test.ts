import { describe, expect, it } from 'vitest';
import * as Poker from '../../../index';

/**
 * Statistics Analytics Tests for Game API
 *
 * Purpose: Test Game methods that provide analytics and statistics:
 * 1. getStats - Returns per-player statistics formatted for database insertion
 * 2. getStatsRow - Builds a stats row in canonical order for a player/street
 *
 * These methods are part of Game's analytics provider responsibility
 */
describe('Game Statistics Analytics', () => {
  const BASE_HAND: Partial<Poker.Hand> = {
    variant: 'NT',
    players: ['Alice', 'Bob', 'Charlie'],
    startingStacks: [1000, 1000, 1000],
    blindsOrStraddles: [10, 20, 0],
    minBet: 20,
    antes: [0, 0, 0],
    actions: ['d dh p1 AsKs', 'd dh p2 QdQc', 'd dh p3 7h2c'],
  };

  describe('Stats', () => {
    it('should return formatted string matrix for database insertion', () => {
      const hand = Poker.Hand(BASE_HAND);
      const game = Poker.Game(hand);
      const stats = Poker.Stats(game);

      // Should return a array of objects
      expect(Array.isArray(stats)).toBe(true);
      expect(stats[0]).toMatchObject({
        player: 'Alice',
        street: 'preflop',
      });
    });
  });

  describe('Stats.getStatsRow', () => {
    it('should build canonical order for player/street data', () => {
      const hand = Poker.Hand(BASE_HAND);
      const game = Poker.Game(hand);

      expect(Array.isArray(Poker.Stats.getRows(game)[0])).toBe(true);
    });
  });
});
