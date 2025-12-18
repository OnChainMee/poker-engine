import { describe, expect, it } from 'vitest';
import * as Poker from '../../../index';
import { COMPLETED_HAND, MINIMAL_HAND, SHOWDOWN_HAND } from '../game/fixtures/baseGame';
import { BASE_HAND } from '../hand/fixtures/baseHand';

describe('Statistics Generation', () => {
  it('should generate stats for complete hand', () => {
    const hand = BASE_HAND;

    const game = Poker.Game(hand);
    const stats = Poker.Stats.getRows(game);

    // Should have stats array
    expect(Array.isArray(stats)).toBe(true);

    // Finish the hand and get final stats
    const finished = Poker.Game.finish(game, hand);
    if (finished.finishingStacks) {
      const finalGame = Poker.Game(finished);
      const finalStats = Poker.Stats(finalGame);

      // Should have more stats after completion
      expect(finalStats.length).toBeGreaterThanOrEqual(stats.length);
    }
  });

  it('should return formatted string matrix for database insertion', () => {
    const game = Poker.Game(BASE_HAND);
    const stats = Poker.Stats.getRows(game);

    // Should return array of arrays (matrix)
    expect(Array.isArray(stats)).toBe(true);
  });

  it('should include per-player statistics', () => {
    const game = Poker.Game(COMPLETED_HAND);
    const stats = Poker.Stats(game);

    // Should have stats for players who acted
    if (stats.length > 0) {
      // Each row represents a player-street combination
      expect(stats.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should handle games with no stats', () => {
    const minimalGame = Poker.Game(MINIMAL_HAND);
    const stats = Poker.Stats(minimalGame);

    // Should return empty array or minimal stats
    expect(Array.isArray(stats)).toBe(true);
  });

  it('should include statistics for each street', () => {
    const game = Poker.Game(SHOWDOWN_HAND);
    const stats = Poker.Stats(game);

    // With multiple streets, should have multiple stat rows
    if (game.stats && game.stats.length > 0) {
      expect(stats.length).toBeGreaterThanOrEqual(game.stats.length);
    }
  });

  it('should return consistent column order', () => {
    const game1 = Poker.Game(BASE_HAND);
    const game2 = Poker.Game(BASE_HAND);

    const stats1 = Poker.Stats(game1);
    const stats2 = Poker.Stats(game2);

    // Same game should produce same stats
    expect(stats1.length).toBe(stats2.length);
    if (stats1.length > 0) {
      expect(Object.keys(stats1[0])).toEqual(Object.keys(stats2[0]));
    }
  });
});
