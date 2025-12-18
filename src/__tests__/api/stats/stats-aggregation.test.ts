import { describe, expect, test } from 'vitest';
import { parseHand } from '../../../formats/pokerstars/parse';
import { Game } from '../../../Game';
import { applyAction } from '../../../game/progress';
import { getPokerMetrics } from '../../../stats/metrics';
import { fixtures } from '../../fixtures/hands';

describe('Stats Aggregation', () => {
  test('should correctly aggregate metrics from raw stats', () => {
    // Create a game with a sample hand
    const game = Game({
      minBet: 20,
      hand: 12345,
      variant: 'NT',
      players: ['Alice', 'Bob', 'Carol'],
      startingStacks: [1000, 1000, 1000],
      blindsOrStraddles: [0, 10, 20],
      antes: [0, 0, 0],
      actions: [],
      bigBlind: 20,
      seed: 12345,
    });

    // Deal cards
    applyAction(game, 'd dh p1 AhKh');
    applyAction(game, 'd dh p2 QhJh');
    applyAction(game, 'd dh p3 2c3c');

    // Preflop betting
    applyAction(game, 'p1 cbr 60'); // Alice raises
    applyAction(game, 'p2 cbr 180'); // Bob 3-bets
    applyAction(game, 'p3 f'); // Carol folds
    applyAction(game, 'p1 cc'); // Alice calls

    // Flop
    applyAction(game, 'd db AcKcQc');
    applyAction(game, 'p2 cbr 200'); // Bob c-bets
    applyAction(game, 'p1 f'); // Alice folds

    // Get metrics for all players
    const metrics = getPokerMetrics(game.stats, ['player', 'street'] as const);

    // Verify Alice's metrics (player 0)
    expect(metrics[Game.getPlayerName(game, 0)]).toMatchObject({
      preflop: {
        gameIds: new Set(['Virtual/12345']),
        // Core stats
        raises: 1,
        calls: 1,
        folds: 0,
        checks: 0,
        bets: 0,
        // Core frequencies
        limpOpportunities: 1,
        limps: 0,
        limpFrequency: 0, // Had opportunity but raised instead
        aggressionFactor: 1, // 1 raise / 1 call
        aggressionFrequency: 0.5, // 1 raise / (1 raise + 1 call)

        // Betting frequencies
        threeBetFrequency: 0, // No 3bet opportunities
        fourBetFrequency: 0, // 0 four-bets / 1 opportunity
        stealFrequency: 1, // 1 steal / 1 opportunity
      },
      flop: {
        gameIds: new Set(['Virtual/12345']),
        // Core stats
        raises: 0,
        calls: 0,
        folds: 1,
        checks: 0,
        bets: 0,
        aggressionFactor: 0, // No aggressive actions
        aggressionFrequency: 0, // 0 / (0 + 0 + 1 fold)
        cbetFrequency: 0, // No cbet opportunities
      },
      total: {
        // Core stats
        raises: 1,
        calls: 1,
        folds: 1,
        checks: 0,
        bets: 0,
        gameIds: new Set(['Virtual/12345']),
        aggressionFactor: 1, // 1 raise / 1 call across all streets
        aggressionFrequency: 1 / 3, // 1 raise / (1 raise + 1 call + 1 fold)
      },
    });

    // Verify Bob's metrics (player 1)
    expect(metrics[Game.getPlayerName(game, 1)]).toMatchObject({
      preflop: {
        // Core stats
        raises: 1,
        calls: 0,
        folds: 0,
        checks: 0,
        bets: 0,

        // Frequencies
        limpFrequency: 0, // No limp opportunities after raise
        aggressionFactor: 1, // 1 raise / 0 calls
        aggressionFrequency: 1, // 1 raise / 1 total action
        threeBetFrequency: 1, // 1 three-bet / 1 opportunity
      },
      flop: {
        // Core stats
        raises: 0,
        calls: 0,
        folds: 0,
        checks: 0,
        bets: 1,

        // Frequencies
        aggressionFactor: 1, // 1 bet / 0 calls
        aggressionFrequency: 1, // 1 bet / 1 total action
        cbetFrequency: 1, // 1 cbet / 1 opportunity
      },
      total: {
        // Core stats
        raises: 1,
        calls: 0,
        folds: 0,
        checks: 0,
        bets: 1,

        // Frequencies
        gameIds: new Set(['Virtual/12345']),
        aggressionFactor: 2, // 2 aggressive actions / 0 calls
        aggressionFrequency: 1, // 2 aggressive actions / 2 total actions
      },
    });

    // Verify Carol's metrics (player 2)
    expect(metrics[Game.getPlayerName(game, 2)]).toMatchObject({
      preflop: {
        // Core stats
        raises: 0,
        calls: 0,
        folds: 1,
        checks: 0,
        bets: 0,

        limpFrequency: 0, // No limp opportunities after raise
        aggressionFactor: 0, // 0 aggressive actions
        aggressionFrequency: 0, // 0 aggressive / (0 + 1 fold)
        threeBetFrequency: 0, // 0 three-bets / 1 opportunity
      },
      total: {
        // Core stats
        raises: 0,
        calls: 0,
        folds: 1,
        checks: 0,
        bets: 0,

        aggressionFactor: 0, // No aggressive actions
        aggressionFrequency: 0, // 0 aggressive / 1 total action
      },
    });

    // Verify total metrics across all players
    expect(metrics.total).toMatchObject({
      aggressionFactor: 3,
      aggressionFrequency: 0.5,
      calls: 1,
      cbetFrequency: 1,
      donkBetFrequency: 0,
      fourBetFrequency: 0,
      limpFrequency: 0,
      stealFrequency: 1,
      threeBetOpportunities: 1,
      threeBetAttempts: 1,
      threeBetFrequency: 1,
    });
  });

  describe.skip('should correctly aggregate metrics from raw stats', () => {
    it('should parse 1 fixture', () => {
      const hand = parseHand(fixtures[0].input);
      const game = Game(hand);
      const stats = getPokerMetrics(game.stats, ['player', 'street'] as const);
      expect(stats).toMatchObject({
        total: {
          // Core stats
          bets: 3,
          calls: 6,
          checks: 3,
          folds: 1,
          raises: 1,
          allIns: 0,

          // Stack and money
          stackBefore: 0,
          stackAfter: 0,
          investments: 10,
          winnings: 539,
          losses: 600,
          rake: 61,
          profits: 539,

          won: 1,
          lost: 2,

          // Frequencies
          aggressionFactor: 2 / 3,
          aggressionFrequency: 4 / 11,
          voluntaryPutMoneyInPotTimes: 7,

          // Limping
          limps: 6,
          limpOpportunities: 9,
          limpFrequency: 6 / 9,

          // 3-betting
          threeBets: 1,
          threeBetOpportunities: 3,
          threeBetChallenges: 2,
          threeBetFrequency: 1 / 3,
          threeBetSuccessFrequency: 1,
          threeBetDefenses: 0,
          threeBetDefenseFrequency: 0,

          // 4-betting
          fourBetFolds: 0,
          fourBetFrequency: 0,
          fourBetOpportunities: 2,
          fourBetSuccessFrequency: 0,

          // Continuation betting
          cbetFolds: 0,
          cbetFrequency: 1,
          cbetOpportunities: 2,
          cbetSuccessFrequency: 1,

          // Check-raising
          checkRaiseFolds: 0,
          checkRaiseFrequency: 0,
          checkRaiseOpportunities: 3,
          checkRaiseSuccessFrequency: 0,

          // Donk betting
          donkBetFolds: 0,
          donkBetFrequency: 0,
          donkBetOpportunities: 2,
          donkBetSuccessFrequency: 0,

          // Stealing
          stealFolds: 0,
          stealFrequency: 0,
          stealOpportunities: 1,
          stealSuccessFrequency: 0,

          // Open shoving
          openShoveFolds: 0,
          openShoveFrequency: 3 / 10,
          openShoveOpportunities: 10,
          openShoveSuccessFrequency: 2 / 3,
          openShoveDefenses: 1,

          // Showdown
          wentToShowdown: 0,
          wonAtShowdown: 1,
          wonWithoutShowdown: 0,

          // Misc
          bigBlind: 0,
          gameIds: new Set(['fun time-218536444875']),
        },
      });
    });
    it.skip('should parse 14 fixtures', () => {
      const stats = getPokerMetrics(
        fixtures.slice(0, 14).flatMap(fixture => {
          return Game(parseHand(fixture.input)).stats;
        }),
        ['street']
      );
      expect(stats).toMatchObject({
        total: {
          aggressions: 32,
          allIns: 1,
          balance: -18.333999999999996,
          bets: 21,
          calls: 65,
          cbetSuccessFrequency: 0.6666666666666666,
          checkRaiseSuccessFrequency: 0,
          checks: 58,
          donkBetOpportunities: 16,
          donkBetSuccessFrequency: 1,
          donkBetSuccesses: 2,
          donkBets: 2,
          folds: 51,
          investments: 370.50399999999996,
          losses: 183.282,
          openShoveSuccessFrequency: 0.5357142857142857,
          passivities: 123,
          profits: 164.94799999999998,
          raises: 11,
          rake: 18.334,
          stealFolds: 5,
          stealFrequency: 0.08695652173913043,
          stealSuccessFrequency: 0,
          steals: 2,
          wentToShowdown: 0,
          winnings: 164.94799999999998,
          wonAtShowdown: 6,
          wonWithoutShowdown: 8,
          gameCount: 14,
        },
        preflop: {
          bets: 0,
          calls: 50,
          checks: 0,
          folds: 26,
          limps: 38,
        },
        flop: {
          bets: 6,
          calls: 3,
          checks: 34,
          folds: 9,
          limps: 34,
        },
      });
    });
  });
});
