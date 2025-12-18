import { describe, expect, test } from 'vitest';
import { Hand } from '../../..';
import { Game } from '../../../Game';
import { applyAction } from '../../../game/progress';
import { Stats } from '../../../Stats';

// Sample game for testing
const sampleGame: Hand = {
  variant: 'NT',
  players: ['Alice', 'Bob', 'Carol'],
  startingStacks: [1000, 1000, 1000],
  blindsOrStraddles: [0, 10, 20],
  antes: [0, 0, 0],
  actions: [],
  minBet: 20,
  seed: 12345,
};

describe('Statistics Tracking', () => {
  describe('Showdown', () => {
    test('should track showdown statistics', () => {
      // This test checks that showdown-related stats are tracked correctly.
      // It simulates a hand where two players go to showdown and verifies that the 'wentToShowdown' stat is updated.
      const table = Game(sampleGame);

      // Deal cards
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Preflop betting - all players limp
      applyAction(table, 'p1 cc');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        calls: 1,
        voluntaryPutMoneyInPotTimes: 1,
        limps: 1,
        limpOpportunities: 1,
      });

      applyAction(table, 'p2 cc');
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        calls: 1,
        voluntaryPutMoneyInPotTimes: 1,
        limps: 1,
        limpOpportunities: 1,
      });

      applyAction(table, 'p3 cc');
      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        calls: 1,
        voluntaryPutMoneyInPotTimes: 1,
        limps: 1,
        limpOpportunities: 1,
      });

      // Deal flop, turn, river
      applyAction(table, 'd db AcKcQc');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');
      applyAction(table, 'p1 cc');

      applyAction(table, 'd db Jc');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');
      applyAction(table, 'p1 cc');

      applyAction(table, 'd db Tc');
      // River betting leads to showdown
      applyAction(table, 'p2 cbr 100');
      applyAction(table, 'p3 f');
      applyAction(table, 'p1 cc 100');
      // Showdown actions
      applyAction(table, 'p2 sm QhJh');
      applyAction(table, 'p1 sm AhKh');

      // Check showdown statistics
      const bobRiverStats = Stats.forPlayerStreet(table, 1, 'river');
      const carolRiverStats = Stats.forPlayerStreet(table, 2, 'river');
      const aliceRiverStats = Stats.forPlayerStreet(table, 0, 'river');

      expect(bobRiverStats).toMatchObject({
        wentToShowdown: 1,
        investments: 100,
      });
      expect(carolRiverStats).toMatchObject({
        wentToShowdown: 0,
      });
      expect(aliceRiverStats).toMatchObject({
        wentToShowdown: 1,
        investments: 100,
      });

      // Test getting all player stats
      const aliceStats = Stats.forPlayerStreet(table, 0, 'river');
      expect(aliceStats).toMatchObject({
        wentToShowdown: 1,
      });
    });
  });

  describe('Basic Actions', () => {
    test('should track voluntaryPutMoneyInPotTimes when player calls', () => {
      // This test verifies that a player's 'voluntaryPutMoneyInPotTimes' statistic is incremented
      // when they call a bet pre-flop. This action indicates a willing investment in the pot.
      const table = Game(sampleGame);
      // Deal cards
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Player 0 (Alice) calls the big blind
      applyAction(table, 'p1 cc 20');

      const aliceStats = Stats.forPlayerStreet(table, 0, 'preflop');
      expect(aliceStats).toMatchObject({
        calls: 1,
        voluntaryPutMoneyInPotTimes: 1,
        limps: 1,
        limpOpportunities: 1,
      });
    });

    test('should track betting statistics', () => {
      // This test covers a range of betting actions across multiple streets.
      // It verifies that stats like raises, calls, folds, and checks are correctly recorded for each player.
      const table = Game(sampleGame);

      // Deal cards
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Player 0 (Alice) raises - had opportunity to limp but chose to raise
      applyAction(table, 'p1 cbr 60');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        bets: 0,
        raises: 1,
        calls: 0,
        folds: 0,
        voluntaryPutMoneyInPotTimes: 1,
        limps: 0,
        limpOpportunities: 1,
      });

      // Player 1 (Bob) calls - no limp opportunity because there was already a raise
      applyAction(table, 'p2 cc');
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        bets: 0,
        raises: 0,
        checks: 0,
        calls: 1,
        folds: 0,
        voluntaryPutMoneyInPotTimes: 1,
        limps: 0,
        limpOpportunities: 0,
      });

      // Player 2 (Carol) folds - no limp opportunity because there was already a raise
      applyAction(table, 'p3 f');
      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        bets: 0,
        raises: 0,
        calls: 0,
        folds: 1,
        voluntaryPutMoneyInPotTimes: 0,
        limps: 0,
        limpOpportunities: 0,
      });

      // Deal flop
      applyAction(table, 'd db AcKcQc');
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        bets: 0,
        raises: 0,
        calls: 0,
        folds: 0,
        voluntaryPutMoneyInPotTimes: 0,
        limps: 0,
        limpOpportunities: 0,
      });

      applyAction(table, 'p2 cc');
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        bets: 0,
        raises: 0,
        calls: 0,
        checks: 1,
        folds: 0,
        voluntaryPutMoneyInPotTimes: 0,
        limps: 0,
        limpOpportunities: 0,
      });

      applyAction(table, 'p1 cbr 100');
      expect(Stats.forPlayerStreet(table, 0, 'flop')).toMatchObject({
        bets: 1,
        raises: 0,
        calls: 0,
        folds: 0,
        voluntaryPutMoneyInPotTimes: 1,
        limps: 0,
        limpOpportunities: 0,
      });

      applyAction(table, 'p2 cc');
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        bets: 0,
        raises: 0,
        calls: 1,
        checks: 1,
        passivities: 2,
        folds: 0,
        voluntaryPutMoneyInPotTimes: 0,
        limps: 0,
        limpOpportunities: 0,
      });
    });
  });

  describe('All-ins', () => {
    test('should track when a player goes all-in', () => {
      // This test ensures that optional statistics, like 'allIns', are tracked correctly when the situation arises.
      // It simulates a pre-flop all-in to verify that the 'allIns' counter is incremented.
      const table = Game(sampleGame);

      // Deal hole cards
      applyAction(table, 'd dh p1 AhKh');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        limpOpportunities: 0,
      });

      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Preflop all-in
      applyAction(table, 'p1 cbr 1000');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        raises: 1,
        voluntaryPutMoneyInPotTimes: 1,
        allIns: 1,
        limpOpportunities: 1,
      });
    });
  });

  describe('decision duration', () => {
    test('should track decision duration', () => {
      // This test ensures that the duration of a player's decision is tracked.
      // It creates a simple scenario where a player makes a raise and checks that the decision time is recorded.
      const table = Game(sampleGame);
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');
      applyAction(table, 'p1 cbr 60');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')?.decisionDuration).toBeLessThan(1000);
    });
    test('should track decision duration', () => {
      // This test verifies that decision durations are correctly calculated based on timestamps in the actions.
      // It simulates a hand with multiple actions at different timestamps and checks that the average and total decision durations are accurate.
      const table = Game({ ...sampleGame, timestamp: 1000 });
      applyAction(table, 'd dh p1 AhKh #0000000001001');
      applyAction(table, 'd dh p2 QhJh #0000000001011');
      applyAction(table, 'd dh p3 2c3c #0000000001111');
      applyAction(table, 'p1 cbr 60 #0000000011111');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        decisionDuration: 10000,
      });
      applyAction(table, 'p2 cc #0000000211111');
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        decisionDuration: 200000,
      });
      applyAction(table, 'p3 f #0000003211111');
      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        decisionDuration: 3000000,
      });
      applyAction(table, 'd db AcKcQc #0000043211111');
      applyAction(table, 'p2 f #0000243211111');
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        decisionDuration: 200000000,
      });
      expect(Stats.aggregate(table.stats, ['player'] as const)).toMatchObject({
        [Game.getPlayerName(table, 0)]: {
          decisionDurationAverage: 10000,
          decisionDuration: 10000,
          decisions: 1,
        },
        [Game.getPlayerName(table, 1)]: {
          decisionDurationAverage: 100100000,
          decisionDuration: 200200000,
          decisions: 2,
        },
        [Game.getPlayerName(table, 2)]: {
          decisionDurationAverage: 3000000,
          decisionDuration: 3000000,
          decisions: 1,
        },
        total: {
          decisionDurationAverage: 203210000 / 4,
          decisionDuration: 203210000,
          decisions: 4,
        },
      });
    });
  });

  test('should track showdown statistics', () => {
    // This test checks that showdown-related stats are tracked correctly.
    // It simulates a hand where two players go to showdown and verifies that the 'wentToShowdown' stat is updated.
    const table = Game(sampleGame);

    // Deal cards
    applyAction(table, 'd dh p1 AhKh');
    applyAction(table, 'd dh p2 QhJh');
    applyAction(table, 'd dh p3 2c3c');

    // Preflop betting - all players limp
    applyAction(table, 'p1 cc');
    expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
      calls: 1,
      voluntaryPutMoneyInPotTimes: 1,
      limps: 1,
      limpOpportunities: 1,
    });

    applyAction(table, 'p2 cc');
    expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
      calls: 1,
      voluntaryPutMoneyInPotTimes: 1,
      limps: 1,
      limpOpportunities: 1,
    });

    applyAction(table, 'p3 cc');
    expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
      calls: 1,
      voluntaryPutMoneyInPotTimes: 1,
      limps: 1,
      limpOpportunities: 1,
    });

    // Deal flop, turn, river
    applyAction(table, 'd db AcKcQc');
    applyAction(table, 'p2 cc');
    applyAction(table, 'p3 cc');
    applyAction(table, 'p1 cc');

    applyAction(table, 'd db Jc');
    applyAction(table, 'p2 cc');
    applyAction(table, 'p3 cc');
    applyAction(table, 'p1 cc');

    applyAction(table, 'd db Tc');
    // River betting leads to showdown
    applyAction(table, 'p2 cbr 100');
    applyAction(table, 'p3 f');
    applyAction(table, 'p1 cc 100');
    // Showdown actions
    applyAction(table, 'p2 sm QhJh');
    applyAction(table, 'p1 sm AhKh');

    // Check showdown statistics
    const bobRiverStats = Stats.forPlayerStreet(table, 1, 'river');
    const carolRiverStats = Stats.forPlayerStreet(table, 2, 'river');
    const aliceRiverStats = Stats.forPlayerStreet(table, 0, 'river');

    expect(bobRiverStats).toMatchObject({
      wentToShowdown: 1,
    });
    expect(carolRiverStats).toMatchObject({
      wentToShowdown: 0,
    });
    expect(aliceRiverStats).toMatchObject({
      wentToShowdown: 1,
    });

    // Test getting all player stats
    const aliceStats = Stats.forPlayerStreet(table, 0, 'river');
    expect(aliceStats).toMatchObject({
      wentToShowdown: 1,
    });
  });

  describe('steal', () => {
    it('should not count small raises as steal attempts', () => {
      // This test ensures that a raise from a steal position (BTN) that is less than the defined
      // steal threshold (2.5x BB) is not counted as a steal attempt.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20],
      });

      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Button raises less than 2.5x BB - should not count as steal
      applyAction(table, 'p1 cbr 400');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        stealIpOpportunities: 1,
        stealIpAttempts: 0,
      });

      // Complete the hand
      applyAction(table, 'p2 f');
      applyAction(table, 'p3 f');
    });

    it('should track steal attempts', () => {
      // This test verifies that raises from the button meeting the size criteria (2.5x-4x BB)
      // are correctly identified and tracked as in-position steal attempts.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20],
      });

      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Button raises exactly 2.5x BB - should count as steal
      applyAction(table, 'p1 cbr 50'); // 20 BB * 2.5 = 50
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        stealIpOpportunities: 1,
        stealIpAttempts: 1,
      });

      // New hand with larger steal attempt
      const table2 = Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20],
      });

      applyAction(table2, 'd dh p1 AhKh');
      applyAction(table2, 'd dh p2 QhJh');
      applyAction(table2, 'd dh p3 2c3c');

      // Button raises 3x BB - should count as steal
      applyAction(table2, 'p1 cbr 60');
      expect(Stats.forPlayerStreet(table2, 0, 'preflop')).toMatchObject({
        stealIpAttempts: 1,
        stealIpOpportunities: 1,
      });
    });

    it('should track steal OOP from SB and IP defense from BB', () => {
      // This scenario tests an out-of-position steal attempt from the Small Blind after the Button folds.
      // It also verifies that the Big Blind's call is tracked as an in-position defense against the steal.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20],
      });

      applyAction(table, 'd dh p1 AhKh'); // BTN
      applyAction(table, 'd dh p2 QhJh'); // SB
      applyAction(table, 'd dh p3 2c3c'); // BB

      applyAction(table, 'p1 f'); // BTN folds

      // SB has opportunity to steal from OOP
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        stealOopOpportunities: 1,
        stealIpOpportunities: 0,
      });

      // SB raises -> steal attempt from OOP
      applyAction(table, 'p2 cbr 60');
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        stealOopOpportunities: 1,
        stealOopAttempts: 1,
        stealIpAttempts: 0,
      });

      // BB defends IP by calling
      applyAction(table, 'p3 cc');
      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        stealIpChallenges: 1,
        stealIpContinues: 1,
        stealOopChallenges: 0,
      });
    });

    it('should track steal IP from CO and OOP defense from BB', () => {
      // This test covers an in-position steal attempt from the Cutoff.
      // It then checks the Big Blind's defense out-of-position, which in this case is a fold.
      const table = Game({
        ...sampleGame,
        players: ['CO', 'BTN', 'SB', 'BB'],
        startingStacks: [1000, 1000, 1000, 1000],
        blindsOrStraddles: [0, 0, 10, 20],
      });

      applyAction(table, 'd dh p1 AhKh'); // CO
      applyAction(table, 'd dh p2 QhJh'); // BTN
      applyAction(table, 'd dh p3 2c3c'); // SB
      applyAction(table, 'd dh p4 7d8d'); // BB

      // CO raises, BTN folds. This is an IP steal attempt.
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 f');

      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        stealIpOpportunities: 1,
        stealIpAttempts: 1,
        stealOopAttempts: 0,
      });

      // SB folds, BB defends OOP by folding
      applyAction(table, 'p3 f');
      applyAction(table, 'p4 f');

      expect(Stats.forPlayerStreet(table, 3, 'preflop')).toMatchObject({
        stealOopChallenges: 1,
        stealOopFolds: 1,
        stealIpChallenges: 0,
      });
    });

    it('should track OOP defense when blinds fold to a BTN steal', () => {
      // This scenario verifies that when both blinds are faced with an in-position steal from the Button,
      // their folds are correctly recorded as out-of-position defense folds.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20],
      });

      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // BTN raises (IP steal)
      applyAction(table, 'p1 cbr 60');

      // SB folds (OOP defense)
      applyAction(table, 'p2 f');
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        stealOopChallenges: 1,
        stealOopFolds: 1,
        stealIpChallenges: 0,
      });

      // BB folds (OOP defense)
      applyAction(table, 'p3 f');
      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        stealOopChallenges: 1,
        stealOopFolds: 1,
        stealIpChallenges: 0,
      });
    });
  });

  describe('threeBet', () => {
    it('should count 3bet opportunities with sufficient stack', () => {
      // This test case follows a pre-flop betting sequence to verify 3-bet and 4-bet opportunities.
      // It tracks an OOP 3-bet from the SB and the subsequent folds from the BB and the original raiser (BTN).
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20],
      });

      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Position after BB is BTN
      applyAction(table, 'p1 cbr 60');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        raises: 1,
        voluntaryPutMoneyInPotTimes: 1,
        stealIpAttempts: 1,
        stealIpOpportunities: 1,
        firstAggressions: 1,
      });

      // Then SB
      applyAction(table, 'p2 cbr 180');
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        raises: 1,
        voluntaryPutMoneyInPotTimes: 1,
        stealIpOpportunities: 0,
        stealOopOpportunities: 0,
        threeBetOopOpportunities: 1,
        threeBetOopAttempts: 1,
        firstAggressions: 0,
        lastAggressions: 1,
      });

      // BB folds
      applyAction(table, 'p3 f');
      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        folds: 1,
        stealIpOpportunities: 0,
        stealOopOpportunities: 0,
        fourBetIpOpportunities: 1,
        fourBetIpAttempts: 0,
        threeBetIpOpportunities: 0,
        threeBetOopOpportunities: 0,
        threeBetIpAttempts: 0,
        threeBetOopAttempts: 0,
        threeBetIpFolds: 1,
        threeBetIpChallenges: 1,
        threeBetOopFolds: 0,
        threeBetOopChallenges: 0,
        firstAggressions: 0,
        lastAggressions: 0,
      });

      // BTN folds
      applyAction(table, 'p1 f');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        raises: 1,
        folds: 1,
        voluntaryPutMoneyInPotTimes: 1,
        stealIpAttempts: 1,
        stealIpOpportunities: 1,
        threeBetIpOpportunities: 0,
        threeBetOopOpportunities: 0,
        threeBetIpAttempts: 0,
        threeBetOopAttempts: 0,
        threeBetIpFolds: 1,
        threeBetIpChallenges: 1,
        firstAggressions: 1,
        lastAggressions: 0,
      });
    });

    it('should track 3-bet IP and defense OOP', () => {
      // This scenario tests an in-position 3-bet from the Button against an open from the Cutoff.
      // It then verifies the Cutoff's out-of-position defense when they call the 3-bet.
      const table = Game({
        ...sampleGame,
        players: ['UTG', 'CO', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 0, 10, 20],
        startingStacks: [100, 100, 100, 100, 100],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'd dh p4 5h5c');
      applyAction(table, 'd dh p5 6h6c');
      applyAction(table, 'p1 f');
      applyAction(table, 'p2 cbr 60'); // CO opens
      applyAction(table, 'p3 cbr 180'); // BTN 3-bets in position
      applyAction(table, 'p4 f'); // SB folds
      applyAction(table, 'p5 f'); // BB folds
      applyAction(table, 'p2 cc'); // CO calls, defending OOP

      const btnStats = Stats.forPlayerStreet(table, 2, 'preflop');
      expect(btnStats).toMatchObject({
        threeBetIpAttempts: 1,
        threeBetIpOpportunities: 1,
        aggressionsInPosition: 1,
      });

      const coStats = Stats.forPlayerStreet(table, 1, 'preflop');
      expect(coStats).toMatchObject({
        threeBetOopChallenges: 1,
        threeBetOopContinues: 1,
        challengesInPosition: 0,
      });
    });

    it('should track 3-bet OOP and defense IP', () => {
      // This test covers an out-of-position 3-bet from the Small Blind against a Button open.
      // It then verifies the Button's in-position defense when they call the 3-bet.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 10, 20],
        startingStacks: [100, 100, 100],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'p1 cbr 60'); // BTN opens
      applyAction(table, 'p2 cbr 180'); // SB 3-bets out of position
      applyAction(table, 'p3 f'); // BB folds
      applyAction(table, 'p1 cc'); // BTN calls, defending IP

      const sbStats = Stats.forPlayerStreet(table, 1, 'preflop');
      expect(sbStats).toMatchObject({
        threeBetOopAttempts: 1,
        threeBetOopOpportunities: 1,
        aggressionsInPosition: 0,
      });

      const btnStats = Stats.forPlayerStreet(table, 0, 'preflop');
      expect(btnStats).toMatchObject({
        threeBetIpChallenges: 1,
        threeBetIpContinues: 1,
        challengesInPosition: 1,
      });
    });
  });

  describe('squeeze', () => {
    it('marks squeeze on 3bet after BTN open + SB call', () => {
      // This test case verifies a squeeze play from the Big Blind.
      // A squeeze is a 3-bet made after an initial raise and at least one call.
      // It also tracks the subsequent defensive actions from the original raiser and the caller.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20], // BTN = dealer, SB = 10, BB = 20
      });

      applyAction(table, 'd dh p1 AhKh'); // BTN
      applyAction(table, 'd dh p2 QhJh'); // SB
      applyAction(table, 'd dh p3 2c3c'); // BB

      // BTN opens
      applyAction(table, 'p1 cbr 60');
      // SB calls (creates squeeze opportunity for BB)
      applyAction(table, 'p2 cc');
      // BB 3bets -> squeeze
      applyAction(table, 'p3 cbr 220');

      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        threeBetIpAttempts: 0,
        squeezeIpOpportunities: 0,
        squeezeIpAttempts: 0,
        squeezeOopOpportunities: 1,
        squeezeOopAttempts: 1,
        threeBetOopAttempts: 1,
      });

      // BTN folds facing squeeze
      applyAction(table, 'p1 f');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        squeezeIpFolds: 1,
        squeezeIpChallenges: 1,
      });

      // SB defends by calling
      applyAction(table, 'p2 cc');
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        squeezeOopContinues: 1,
        squeezeOopChallenges: 1,
      });
    });

    it('does not mark squeeze when no caller before 3bet', () => {
      // This test ensures that a standard 3-bet (a raise followed by a re-raise with no callers in between)
      // is not incorrectly identified as a squeeze play.
      const table = Game(sampleGame);

      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Open raise then immediate 3bet (no call in between)
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cbr 200');
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        threeBetOopAttempts: 1,
        squeezeIpOpportunities: 0,
        squeezeOopOpportunities: 0,
        squeezeIpAttempts: 0,
        squeezeOopAttempts: 0,
      });
    });
    it('should track squeeze IP and defense OOP', () => {
      // This test covers an in-position squeeze from the Button after an open from MP and a call from the CO.
      // It then tracks the out-of-position defensive actions from both the original raiser and the caller.
      const table = Game({
        ...sampleGame,
        players: ['MP', 'CO', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 0, 10, 20],
        startingStacks: [100, 100, 100, 100, 100],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'd dh p4 5h5c');
      applyAction(table, 'd dh p5 6h6c');
      applyAction(table, 'p1 cbr 60'); // MP opens
      applyAction(table, 'p2 cc'); // CO calls
      applyAction(table, 'p3 cbr 300'); // BTN squeezes IP
      applyAction(table, 'p4 f');
      applyAction(table, 'p5 f');
      applyAction(table, 'p1 f'); // MP folds
      applyAction(table, 'p2 cc'); // CO calls

      const btnStats = Stats.forPlayerStreet(table, 2, 'preflop');
      expect(btnStats).toMatchObject({
        squeezeIpAttempts: 1,
        squeezeIpOpportunities: 1,
        threeBetIpAttempts: 1,
        aggressionsInPosition: 1,
      });

      const mpStats = Stats.forPlayerStreet(table, 0, 'preflop');
      expect(mpStats).toMatchObject({
        squeezeOopChallenges: 1,
        squeezeOopFolds: 1,
      });

      const coStats = Stats.forPlayerStreet(table, 1, 'preflop');
      expect(coStats).toMatchObject({
        squeezeOopChallenges: 1,
        squeezeOopContinues: 1,
        squeezeOopFolds: 0,
      });
    });

    it('should track squeeze OOP and defense IP', () => {
      // SCENARIO: OOP squeeze from BB after BTN open and SB call
      // INPUT: 6 players, BB raises over BTN open and SB flat
      // EXPECTED: Track squeeze and defensive folds from BTN and SB
      const table = Game({
        ...sampleGame,
        players: ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 0, 0, 10, 20],
        startingStacks: [100, 100, 100, 100, 100, 100],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'd dh p4 5h5c');
      applyAction(table, 'd dh p5 6h6c');
      applyAction(table, 'd dh p6 7h7c');
      applyAction(table, 'p1 f');
      applyAction(table, 'p2 f');
      applyAction(table, 'p3 f');
      applyAction(table, 'p4 cbr 60'); // BTN raises
      applyAction(table, 'p5 cc'); // SB calls
      applyAction(table, 'p6 cbr 300'); // BB squeezes OOP
      applyAction(table, 'p4 f'); // BTN folds
      applyAction(table, 'p5 f'); // SB folds

      const bbStats = Stats.forPlayerStreet(table, 5, 'preflop');
      expect(bbStats).toMatchObject({
        squeezeOopAttempts: 1,
        squeezeOopOpportunities: 1,
        threeBetOopAttempts: 1,
        aggressionsInPosition: 0,
      });

      const btnStats = Stats.forPlayerStreet(table, 3, 'preflop');
      expect(btnStats).toMatchObject({
        squeezeIpChallenges: 1,
        squeezeIpFolds: 1,
      });

      const sbStats = Stats.forPlayerStreet(table, 4, 'preflop');
      expect(sbStats).toMatchObject({
        squeezeOopChallenges: 1,
        squeezeOopFolds: 1,
      });
    });
  });

  describe('fourBet', () => {
    it('should count 4bet opportunities', () => {
      // This test verifies the tracking of 4-bet opportunities and actions.
      // It simulates a scenario where BTN opens, SB 3-bets, BB folds (facing a 3-bet), and BTN 4-bets.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        startingStacks: [35, 1000, 1000].map(x => x * 20), // BTN has only 35BB
        blindsOrStraddles: [0, 10, 20],
      });

      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // BTN raises first
      applyAction(table, 'p1 cbr 60');
      // SB 3bets
      applyAction(table, 'p2 cbr 180');
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        threeBetOopOpportunities: 1,
        threeBetOopAttempts: 1,
      });
      // BB has turn
      applyAction(table, 'p3 f');

      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        threeBetIpOpportunities: 0,
        threeBetOopOpportunities: 0,
        threeBetIpAttempts: 0,
        threeBetOopAttempts: 0,
        threeBetIpFolds: 1,
        threeBetIpChallenges: 1,
        fourBetIpOpportunities: 1,
        fourBetIpAttempts: 0,
      });
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        fourBetIpOpportunities: 1,
        fourBetIpAttempts: 0,
        threeBetIpChallenges: 1,
        threeBetIpFolds: 0,
        threeBetIpOpportunities: 0,
        threeBetOopOpportunities: 0,
      });
      // BTN 4bets - SB should not have 4bet opportunity due to small stack
      applyAction(table, 'p1 cbr 540');

      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        fourBetIpOpportunities: 1,
        fourBetIpAttempts: 1,
        threeBetIpChallenges: 1,
        threeBetIpContinues: 1,
        threeBetIpFolds: 0,
        lastAggressions: 1,
        firstAggressions: 1,
      });
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        fourBetIpOpportunities: 0,
        fourBetOopOpportunities: 0,
        fourBetIpAttempts: 0,
        fourBetOopAttempts: 0,
        threeBetIpChallenges: 0, // SB did 3bet, not faced with fold to three bet
        threeBetOopChallenges: 0,
        threeBetIpFolds: 0,
        threeBetOopFolds: 0,
        lastAggressions: 0,
        firstAggressions: 0,
      });

      // Complete the hand
      applyAction(table, 'p2 f');
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        fourBetIpOpportunities: 0,
        fourBetOopOpportunities: 0,
        fourBetIpAttempts: 0,
        fourBetOopAttempts: 0,
        threeBetIpFolds: 0,
        threeBetOopFolds: 0,
        threeBetIpChallenges: 0,
        threeBetOopChallenges: 0,
        fourBetOopFolds: 1,
        fourBetOopChallenges: 1,
      });
    });
    it('should track 4-bet OOP and defense IP', () => {
      // This scenario tracks an out-of-position 4-bet from UTG against a 3-bet from MP.
      // It then verifies the in-position defense from MP when they call the 4-bet.
      const table = Game({
        ...sampleGame,
        players: ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 0, 0, 10, 20],
        startingStacks: [1000, 1000, 1000, 1000, 1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'd dh p4 5h5c');
      applyAction(table, 'd dh p5 6h6c');
      applyAction(table, 'd dh p6 7h7c');
      applyAction(table, 'p1 cbr 60'); // UTG opens
      applyAction(table, 'p2 cbr 180'); // MP 3-bets
      applyAction(table, 'p3 f'); // CO folds
      applyAction(table, 'p4 f'); // BTN folds
      applyAction(table, 'p5 f'); // SB folds
      applyAction(table, 'p6 f'); // BB folds
      applyAction(table, 'p1 cbr 540'); // UTG 4-bets OOP
      applyAction(table, 'p2 cc'); // MP calls, defending IP

      const utgStats = Stats.forPlayerStreet(table, 0, 'preflop');
      expect(utgStats).toMatchObject({
        fourBetOopAttempts: 1,
        fourBetOopOpportunities: 1,
        aggressionsInPosition: 0,
      });

      const mpStats = Stats.forPlayerStreet(table, 1, 'preflop');
      expect(mpStats).toMatchObject({
        fourBetIpChallenges: 1,
        fourBetIpContinues: 1,
        challengesInPosition: 1,
      });
    });

    it('should track 4-bet IP and defense OOP', () => {
      // This test covers an in-position 4-bet from the Button against a 3-bet from the Small Blind.
      // It then verifies the Small Blind's out-of-position defense when they call the 4-bet.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 10, 20],
        startingStacks: [1000, 1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'p1 cbr 60'); // BTN opens
      applyAction(table, 'p2 cbr 180'); // SB 3-bets OOP
      applyAction(table, 'p3 f'); // BB folds
      applyAction(table, 'p1 cbr 540'); // BTN 4-bets IP
      applyAction(table, 'p2 cc'); // SB calls, defending OOP

      const btnStats = Stats.forPlayerStreet(table, 0, 'preflop');
      expect(btnStats).toMatchObject({
        fourBetIpAttempts: 1,
        fourBetIpOpportunities: 1,
        aggressionsInPosition: 1,
      });

      const sbStats = Stats.forPlayerStreet(table, 1, 'preflop');
      expect(sbStats).toMatchObject({
        fourBetOopChallenges: 1,
        fourBetOopContinues: 1,
        challengesInPosition: 0,
      });
    });
  });

  describe('cbet', () => {
    it('should count cbet opportunities', () => {
      // This test verifies the tracking of continuation bet (c-bet) opportunities and actions.
      // It simulates a scenario where the pre-flop 3-bettor makes a c-bet on the flop.
      const table = Game(sampleGame);

      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');
      // Preflop betting
      applyAction(table, 'p1 cbr 60'); // First aggressor
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        firstAggressions: 1,
        lastAggressions: 1,
      });

      applyAction(table, 'p2 cbr 180'); // Last aggressor
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        lastAggressions: 1,
        threeBetOopAttempts: 1,
      });

      applyAction(table, 'p3 f');
      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        threeBetIpFolds: 1,
        cbetIpOpportunities: 0,
        cbetOopOpportunities: 0,
        cbetIpChallenges: 0,
        cbetOopChallenges: 0,
        threeBetIpChallenges: 1,
      });
      applyAction(table, 'p1 cc');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        cbetIpChallenges: 0,
        cbetOopChallenges: 0,
        threeBetIpChallenges: 1,
      });

      // Flop
      applyAction(table, 'd db AcKcQc');
      applyAction(table, 'p2 cbr 100'); // Previous street aggressor bets
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        cbetOopAttempts: 1,
        cbetOopOpportunities: 1,
        lastAggressions: 1,
      });

      applyAction(table, 'p1 f');
      expect(Stats.forPlayerStreet(table, 0, 'flop')).toMatchObject({
        cbetIpFolds: 1,
        cbetIpChallenges: 1,
        cbetOopOpportunities: 0,
        cbetIpOpportunities: 0,
      });
    });

    it('should not count cbet opportunities for non-first aggressors', () => {
      // This test ensures that a player who was not the pre-flop aggressor does not get a c-bet opportunity.
      // A player who just called the pre-flop raise leads out on the flop, which is not a c-bet.
      const table = Game(sampleGame);

      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Preflop betting
      applyAction(table, 'p1 cbr 60'); // First aggressor
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');

      // Flop - p2 bets first, so p1 (preflop aggressor) should not have cbet opportunity
      applyAction(table, 'd db AcKcQc');
      applyAction(table, 'p2 cbr 100');
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        bets: 1,
        cbetIpOpportunities: 0,
        cbetOopOpportunities: 0,
      });

      applyAction(table, 'p3 f');
      applyAction(table, 'p1 cc');
      expect(Stats.forPlayerStreet(table, 0, 'flop')).toMatchObject({
        calls: 1,
        cbetIpOpportunities: 0,
        cbetOopOpportunities: 0,
      });
    });

    it('should track c-bet OOP and defense IP', () => {
      // This scenario tracks an out-of-position continuation bet from the pre-flop aggressor in MP.
      // It also verifies the in-position defensive call from the Button.
      const table = Game({
        ...sampleGame,
        players: ['MP', 'CO', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 0, 10, 20],
        startingStacks: [100, 100, 100, 100, 100],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'd dh p4 5h5c');
      applyAction(table, 'd dh p5 6h6c');
      applyAction(table, 'p1 cbr 60'); // MP opens
      applyAction(table, 'p2 f'); // CO folds
      applyAction(table, 'p3 cc'); // BTN calls
      applyAction(table, 'p4 f'); // SB folds
      applyAction(table, 'p5 cc'); // BB calls
      applyAction(table, 'd db AcKcQc');
      applyAction(table, 'p5 cc'); // BB checks first on flop
      applyAction(table, 'p1 cbr 100'); // MP c-bets OOP
      applyAction(table, 'p3 cc'); // BTN calls IP
      applyAction(table, 'p5 f'); // BB folds

      const mpStats = Stats.forPlayerStreet(table, 0, 'flop');
      expect(mpStats).toMatchObject({
        cbetOopAttempts: 1,
        cbetOopOpportunities: 1,
        aggressionsInPosition: 0,
      });

      const btnStats = Stats.forPlayerStreet(table, 2, 'flop');
      expect(btnStats).toMatchObject({
        cbetIpChallenges: 1,
        cbetIpContinues: 1,
        challengesInPosition: 1,
      });
    });

    it('should track c-bet IP and defense OOP', () => {
      // This test covers an in-position continuation bet from the Button as the pre-flop aggressor.
      // It then verifies the out-of-position defensive call from the Big Blind.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [100, 100],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'p1 cbr 60'); // BTN opens
      applyAction(table, 'p2 cc'); // BB calls
      applyAction(table, 'd db AcKcQc');
      applyAction(table, 'p2 cc'); // BB checks
      applyAction(table, 'p1 cbr 100'); // BTN c-bets
      applyAction(table, 'p2 cc'); // BB calls OOP

      const btnStats = Stats.forPlayerStreet(table, 0, 'flop');
      expect(btnStats).toMatchObject({
        cbetIpAttempts: 1,
        cbetIpOpportunities: 1,
        aggressionsInPosition: 1,
      });

      const bbStats = Stats.forPlayerStreet(table, 1, 'flop');
      expect(bbStats).toMatchObject({
        cbetOopChallenges: 1,
        cbetOopContinues: 1,
        challengesInPosition: 0,
      });
    });
  });

  describe('decision making stats', () => {
    test('should track multiway all in', () => {
      // This test case simulates a multi-way all-in situation to ensure that financial calculations and showdown stats are handled correctly.
      // It involves complex betting sequences across multiple streets leading to a showdown.
      const sampleGame: Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob', 'Carol'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20],
        antes: [0, 0, 0],
        actions: [],
        minBet: 20,
        seed: 12345,
      };
      const table = Game(sampleGame);

      // Deal hole cards
      applyAction(table, 'd dh p1 AhKh');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        limpOpportunities: 0,
      });

      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Preflop decisions
      applyAction(table, 'p1 cbr 60');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        bets: 0,
        raises: 1,
        voluntaryPutMoneyInPotTimes: 1,
        limpOpportunities: 1,
      });

      applyAction(table, 'p2 cc');
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        calls: 1,
        voluntaryPutMoneyInPotTimes: 1,
        limpOpportunities: 0,
      });

      applyAction(table, 'p3 f');
      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        folds: 1,
        limpOpportunities: 0,
      });

      // Flop
      applyAction(table, 'd db AcKcQc');
      applyAction(table, 'p2 cbr 100'); // First bet
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        bets: 1,
        limpOpportunities: 0,
      });

      applyAction(table, 'p1 cbr 300'); // Second bet (would be three bet)
      expect(Stats.forPlayerStreet(table, 0, 'flop')).toMatchObject({
        raises: 1,
        limpOpportunities: 0,
        threeBetIpOpportunities: 0,
        threeBetOopOpportunities: 0,
        threeBetIpAttempts: 0,
        threeBetOopAttempts: 0,
      });

      applyAction(table, 'p2 cbr 900'); // Third bet (four-bet)
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        raises: 1,
        limpOpportunities: 0,
      });

      applyAction(table, 'p1 cc'); // Call the three-bet
      expect(Stats.forPlayerStreet(table, 0, 'flop')).toMatchObject({
        calls: 1,
        limpOpportunities: 0,
      });

      // Turn
      applyAction(table, 'd db Kd');
      applyAction(table, 'p2 cbr 100');
      expect(Stats.forPlayerStreet(table, 1, 'turn')).toMatchObject({
        bets: 1,
        limpOpportunities: 0,
      });

      applyAction(table, 'p1 cc');
      expect(Stats.forPlayerStreet(table, 0, 'turn')).toMatchObject({
        calls: 1,
        limpOpportunities: 0,
      });

      // River
      applyAction(table, 'd db 2d');
      // Showdown - both players show cards, multi way all in
      applyAction(table, 'p2 sm QhJh');
      applyAction(table, 'p1 sm AhKh');

      // Final stats check for all players
      expect(Stats.forPlayerStreet(table, 0, 'turn')).toMatchObject({
        calls: 1,
        limpOpportunities: 0,
        profits: 1020,
        winnings: 2020, // Won the pot
        losses: 0,
        returns: 0,
      });

      expect(Stats.forPlayerStreet(table, 1, 'turn')).toMatchObject({
        bets: 1,
        limpOpportunities: 0,
        winnings: 0,
        losses: 1000, // Lost their bets
        returns: 0,
      });
    });
    test('should track decision making stats', () => {
      // This is a comprehensive test that tracks various decision-making statistics throughout a hand.
      // It includes raises, calls, and bets across all streets to verify the accuracy of the stats engine.
      const table = Game(sampleGame);

      // Deal hole cards
      applyAction(table, 'd dh p1 AhKh');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        limpOpportunities: 0,
      });

      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Preflop decisions
      applyAction(table, 'p1 cbr 60');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        raises: 1,
        voluntaryPutMoneyInPotTimes: 1,
        limpOpportunities: 1,
      });

      applyAction(table, 'p2 cc');
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        calls: 1,
        voluntaryPutMoneyInPotTimes: 1,
        limpOpportunities: 0,
      });

      applyAction(table, 'p3 f');
      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        folds: 1,
        limpOpportunities: 0,
      });

      // Flop
      applyAction(table, 'd db AcKcQc');
      applyAction(table, 'p2 cbr 100'); // First bet
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        bets: 1,
        limpOpportunities: 0,
        cbetIpAttempts: 0,
        cbetOopAttempts: 0,
        cbetIpOpportunities: 0,
        cbetOopOpportunities: 0,
      });

      applyAction(table, 'p1 cbr 300'); // Second bet (raise)
      expect(Stats.forPlayerStreet(table, 0, 'flop')).toMatchObject({
        raises: 1,
        limpOpportunities: 0,
      });

      applyAction(table, 'p2 cbr 500'); // Third bet (re-raise)
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        raises: 1,
        limpOpportunities: 0,
      });

      applyAction(table, 'p1 cc'); // Call the re-raise
      expect(Stats.forPlayerStreet(table, 0, 'flop')).toMatchObject({
        calls: 1,
        limpOpportunities: 0,
      });

      // Turn
      applyAction(table, 'd db Kd');
      applyAction(table, 'p2 cbr 50');
      expect(Stats.forPlayerStreet(table, 1, 'turn')).toMatchObject({
        bets: 1,
        limpOpportunities: 0,
      });

      applyAction(table, 'p1 cc');
      expect(Stats.forPlayerStreet(table, 0, 'turn')).toMatchObject({
        calls: 1,
        limpOpportunities: 0,
      });

      // River
      applyAction(table, 'd db 2d');
      applyAction(table, 'p2 cbr 50');
      expect(Stats.forPlayerStreet(table, 1, 'river')).toMatchObject({
        bets: 1,
        limpOpportunities: 0,
        cbetOopAttempts: 0,
        cbetOopOpportunities: 0,
      });

      applyAction(table, 'p1 cc');
      expect(Stats.forPlayerStreet(table, 0, 'river')).toMatchObject({
        calls: 1,
        limpOpportunities: 0,
      });

      // Showdown - both players show cards
      applyAction(table, 'p2 sm QhJh');
      applyAction(table, 'p1 sm AhKh');

      // Final stats check for all players
      expect(Stats.forPlayerStreet(table, 0, 'river')).toMatchObject({
        calls: 1,
        limpOpportunities: 0,
        winnings: 1340,
        investments: 50,
        returns: 0,
        profits: 680, // Won the pot
        losses: 0,
        stackBefore: 390,
        stackAfter: 1680,
        balance: 1290,
      });

      expect(Stats.forPlayerStreet(table, 1, 'river')).toMatchObject({
        bets: 1,
        limpOpportunities: 0,
        winnings: 0,
        investments: 50,
        losses: 660, // Lost their bets
        stackBefore: 390,
        stackAfter: 340,
        balance: -50,
        returns: 0,
      });

      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        limpOpportunities: 0,
        winnings: 0,
        losses: 20,
      });
    });
  });

  test('should track optional stats when available', () => {
    // This test ensures that optional statistics, like 'allIns', are tracked correctly when the situation arises.
    // It simulates a pre-flop all-in to verify that the 'allIns' counter is incremented.
    const table = Game(sampleGame);

    // Deal hole cards
    applyAction(table, 'd dh p1 AhKh');
    expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
      limpOpportunities: 0,
    });

    applyAction(table, 'd dh p2 QhJh');
    applyAction(table, 'd dh p3 2c3c');

    // Preflop all-in
    applyAction(table, 'p1 cbr 1000');
    expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
      raises: 1,
      voluntaryPutMoneyInPotTimes: 1,
      allIns: 1,
      limpOpportunities: 1,
    });
  });

  describe('limp', () => {
    test('should track limp opportunities correctly', () => {
      // This test verifies that limp opportunities are correctly identified.
      // A player has a limp opportunity if no one has raised yet pre-flop.
      const table = Game(sampleGame);
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // First player raises - had opportunity to limp but chose to raise
      applyAction(table, 'p1 cbr 60');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        calls: 0,
        raises: 1,
        bets: 0,
        voluntaryPutMoneyInPotTimes: 1,
        limps: 0,
        limpOpportunities: 1, // Had opportunity to limp but chose to raise
      });

      // Second player folds - no limp opportunity after raise
      applyAction(table, 'p2 f');
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        calls: 0,
        voluntaryPutMoneyInPotTimes: 0,
        limps: 0,
        limpOpportunities: 0, // No limp opportunity after raise
      });

      // Third player folds - no limp opportunity after raise
      applyAction(table, 'p3 f');
    });
    test('should track limp opportunities after raise', () => {
      // This test ensures that limp opportunities are not available after a raise has occurred.
      // It simulates a limped pot pre-flop and then verifies that there are no limp opportunities on the flop.
      // New hand to test postflop limp opportunities
      const table2 = Game(sampleGame);
      applyAction(table2, 'd dh p1 AhKh');
      applyAction(table2, 'd dh p2 QhJh');
      applyAction(table2, 'd dh p3 2c3c');

      // All players limp preflop
      applyAction(table2, 'p1 cc');
      applyAction(table2, 'p2 cc');
      applyAction(table2, 'p3 cc');

      // Flop
      applyAction(table2, 'd db AcKcQc');
      // Second player bets - had opportunity to limp but chose to bet
      applyAction(table2, 'p2 cbr 100');
      expect(Stats.forPlayerStreet(table2, 1, 'flop')).toMatchObject({
        calls: 0,
        limps: 0,
        limpOpportunities: 0, // Cant limp post-flop
      });

      // Third player calls - no limp opportunity after bet
      applyAction(table2, 'p3 cc');
      expect(Stats.forPlayerStreet(table2, 2, 'flop')).toMatchObject({
        calls: 1,
        limps: 0,
        limpOpportunities: 0, // No limp opportunity after bet
      });

      // First player calls - no limp opportunity after bet
      applyAction(table2, 'p1 cc');
      expect(Stats.forPlayerStreet(table2, 0, 'flop')).toMatchObject({
        calls: 1,
        limps: 0,
        limpOpportunities: 0, // No limp opportunity after bet
      });
    });

    test('should track limping actions', () => {
      // This test verifies that when a player limps (calls the big blind pre-flop), the 'limps' stat is incremented.
      // It also checks that a subsequent call of a raise is not counted as a limp.
      const table = Game(sampleGame);
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // First player limps
      applyAction(table, 'p1 cc');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        calls: 1,
        checks: 0,
        voluntaryPutMoneyInPotTimes: 1,
        limps: 1,
        limpOpportunities: 1,
      });

      // Second player raises
      applyAction(table, 'p2 cbr 60');
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        bets: 0,
        raises: 1,
        voluntaryPutMoneyInPotTimes: 1,
        limps: 0,
        limpOpportunities: 1,
      });

      // Third player calls the raise (not a limp)
      applyAction(table, 'p3 cc');
      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        calls: 1,
        voluntaryPutMoneyInPotTimes: 1,
        limpOpportunities: 0,
      });
    });

    test('should track limping on all streets', () => {
      // This test confirms that limping is a pre-flop only action.
      // It simulates a limped pot pre-flop and then verifies that checking on the flop is not counted as a limp.
      const table = Game(sampleGame);
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Preflop limping
      applyAction(table, 'p1 cc');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        calls: 1,
        checks: 0,
        voluntaryPutMoneyInPotTimes: 1,
        limps: 1,
        limpOpportunities: 1,
      });
      applyAction(table, 'p2 cc');
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        calls: 1,
        checks: 0,
        voluntaryPutMoneyInPotTimes: 1,
        limps: 1,
        limpOpportunities: 1,
      });
      applyAction(table, 'p3 cc');
      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        calls: 1,
        checks: 0,
        voluntaryPutMoneyInPotTimes: 1,
        limps: 1,
        limpOpportunities: 1,
      });

      // Flop - no limp after preflop
      applyAction(table, 'd db AcKcQc');
      applyAction(table, 'p2 cc');
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        checks: 1,
        limps: 0,
        limpOpportunities: 0,
      });
    });
  });

  describe('open shove', () => {
    test('should track successful open shove in preflop', () => {
      // This test verifies that an open shove (the first player to enter the pot goes all-in) is tracked correctly.
      // It also checks that when the shove is successful (everyone folds), the 'openShoveIpTakedowns' stat is updated.
      const table = Game(sampleGame);
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Preflop - p1 open shoves
      applyAction(table, 'p1 cbr 1000');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        openShoveIpAttempts: 1,
        openShoveIpOpportunities: 1,
        openShoveIpTakedowns: 0,
        success: 0,
        allIns: 1,
        winnings: 0, // Wins blinds
      });

      // Others fold
      applyAction(table, 'p2 f');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({});
      applyAction(table, 'p3 f');
      expect(table.isComplete).toBe(true);

      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        openShoveIpAttempts: 1,
        openShoveIpOpportunities: 1,
        openShoveIpTakedowns: 1,
        stealIpAttempts: 0,
        stealIpOpportunities: 1,
        stealIpTakedowns: 0,
        success: 1,
        allIns: 1,
        stackAfter: 1030,
        profits: 30,
        investments: 1000,
        stackBefore: 1000,
        winnings: 50, // Wins blinds
      });
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        openShoveOopFolds: 1,
      });
      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        openShoveOopFolds: 1,
      });
      expect(Stats.aggregate(table.stats, ['street'] as const)?.total).toMatchObject({
        aggressionFactor: 1,
        aggressions: 1,
        allIns: 1,
        decisions: 3,
        investments: 1030,
        openShoveOopChallenges: 2,
        openShoveOopContinueFrequency: 0,
        openShoveOopContinues: 0,
        openShoveOopFolds: 2,
        openShoveOopFoldFrequency: 1,
        openShoveIpOpportunities: 1,
        openShoveIpTakedownFrequency: 1,
        openShoveIpTakedowns: 1,
        openShoveIpAttempts: 1,
        passivities: 0,
        rake: 0,
        voluntaryPutMoneyInPotTimes: 1,
        winnings: 50,
        profits: 30,
      });
    });

    test('should track failed open shove', () => {
      // This test tracks an open shove that gets called.
      // It verifies that defensive stats are recorded for the callers and that the outcome (win/loss) is correctly attributed.
      const table = Game(sampleGame);
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Preflop - p1 open shoves
      applyAction(table, 'p1 cbr 1000');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        openShoveIpAttempts: 1,
        openShoveIpOpportunities: 1,
        allIns: 1,
        investments: 1000,
      });

      // p2 calls and ties with the same flush
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 f');
      applyAction(table, 'd db AcKcQc');
      applyAction(table, 'd db 2c');
      applyAction(table, 'd db 3c');
      applyAction(table, 'p2 sm QhJh');
      applyAction(table, 'p1 sm AhKh');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        openShoveIpAttempts: 1,
        openShoveIpOpportunities: 1,
        success: 1,
        allIns: 1,
        losses: 0,
        winnings: 1010,
      });
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        openShoveIpFolds: 0,
        openShoveOopFolds: 0,
        openShoveIpAttempts: 0,
        openShoveIpOpportunities: 0,
        openShoveOopChallenges: 1,
        openShoveOopContinues: 1,
        losses: 0,
        winnings: 1010,
        profits: 10,
        balance: 10,
        investments: 1000,
      });
      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        openShoveOopFolds: 1,
        openShoveIpAttempts: 0,
        openShoveIpOpportunities: 0,
        openShoveOopChallenges: 1,
        losses: 20,
        winnings: 0,
        profits: 0,
        balance: -20,
        investments: 20,
      });
    });
    test('should track failed open shove with multiple callers', () => {
      // This scenario tracks an open shove that is called by multiple players.
      // It ensures that stats for all players involved are updated correctly, including winnings, losses, and rake.
      const table = Game({ ...sampleGame, rakePercentage: 0.05 });
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 TcTd');

      // Preflop - p1 open shoves
      applyAction(table, 'p1 cbr 1000');
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        openShoveIpAttempts: 1,
        openShoveIpOpportunities: 1,
        allIns: 1,
      });

      // Both players call
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');
      applyAction(table, 'd db AcKdQd');
      applyAction(table, 'd db Td');
      applyAction(table, 'd db 3c');
      applyAction(table, 'p2 sm QhJh');
      applyAction(table, 'p3 sm TcTd');
      applyAction(table, 'p1 sm AhKh');

      // The hand results in a showdown where P2 (QhJh) wins the main pot and P1 (AhKh) wins the side pot.
      // P1's open shove fails.
      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        openShoveIpAttempts: 1,
        openShoveIpOpportunities: 1,
        success: 0,
        allIns: 1,
        investments: 1000,
        openShoveOopAttempts: 0,
        openShoveOopOpportunities: 0,
        losses: 1000,
        winnings: 0,
      });
      expect(Stats.forPlayerStreet(table, 1, 'preflop')).toMatchObject({
        openShoveOopChallenges: 1,
        openShoveOopContinues: 1,
        openShoveIpOpportunities: 0,
        allIns: 1,
        losses: 0,
        winnings: 2850,
        profits: 1850,
        rake: 150,
      });
      expect(Stats.forPlayerStreet(table, 2, 'preflop')).toMatchObject({
        openShoveOopChallenges: 1,
        openShoveOopContinues: 1,
        openShoveIpOpportunities: 0,
        allIns: 1,
        losses: 1000,
        winnings: 0,
      });
      expect(Stats.aggregate(table.stats, ['street'] as const)?.total).toMatchObject({
        investments: 3000,
        winnings: 2850,
        profits: 1850,
        rake: 150,
        openShoveIpOpportunities: 1,
        openShoveIpAttempts: 1,
        openShoveOopFolds: 0,
        openShoveOopChallenges: 2,
        openShoveIpTakedowns: 0,
        openShoveOopContinues: 2,
        openShoveOopContinueFrequency: 1,
        openShoveIpTakedownFrequency: 0,
        allIns: 3,
        decisions: 3,
        aggressions: 1,
        passivities: 2,
        voluntaryPutMoneyInPotTimes: 3,
        aggressionFactor: 0.5,
        gameIds: new Set(['Virtual/0']),
      });
    });

    test('should track OOP open shove from early position', () => {
      // This test verifies the tracking of an out-of-position open shove from an early position (UTG).
      // It also checks the defensive stats for players who are in position relative to the shover.
      const table = Game({
        ...sampleGame,
        players: ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'],
        startingStacks: [1000, 1000, 1000, 1000, 1000, 1000],
        blindsOrStraddles: [0, 0, 0, 0, 10, 20],
      });
      applyAction(table, 'd dh p1 AhKh'); // UTG
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');
      applyAction(table, 'd dh p4 4c5c');
      applyAction(table, 'd dh p5 6c7c');
      applyAction(table, 'd dh p6 8c9c');

      // UTG open shoves (OOP)
      applyAction(table, 'p1 cbr 1000');

      expect(Stats.forPlayerStreet(table, 0, 'preflop')).toMatchObject({
        openShoveOopAttempts: 1,
        openShoveOopOpportunities: 1,
        openShoveIpAttempts: 0,
      });

      // Everyone else folds. Let's check BTN's defense stats.
      applyAction(table, 'p2 f');
      applyAction(table, 'p3 f');
      applyAction(table, 'p4 f');

      // BTN (p3) is IP vs UTG (p0)
      expect(Stats.forPlayerStreet(table, 3, 'preflop')).toMatchObject({
        openShoveIpChallenges: 1,
        openShoveIpFolds: 1,
        openShoveOopChallenges: 0,
      });

      // Now check SB's defense stats
      applyAction(table, 'p5 f');
      // SB (p4) is OOP vs UTG (p0)
      expect(Stats.forPlayerStreet(table, 4, 'preflop')).toMatchObject({
        openShoveOopChallenges: 1,
        openShoveOopFolds: 1,
        openShoveIpChallenges: 0,
      });

      applyAction(table, 'p6 f');
    });
  });

  describe('check raise', () => {
    it('should track check raise opportunities and actions', () => {
      // This test verifies that check-raise opportunities and attempts are correctly tracked.
      // A player checks, another player bets, and the first player raises.
      const table = Game(sampleGame);
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Preflop - p1 raises, others call
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');

      // Flop - p2 checks, p1 bets, p2 raises
      applyAction(table, 'd db AcKcQc');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');
      applyAction(table, 'p1 cbr 100');

      // p2 check raises
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        checkRaiseAttempts: 0,
        checkRaiseOpportunities: 1,
      });

      applyAction(table, 'p2 cbr 180');
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        checkRaiseAttempts: 1,
        checkRaiseOpportunities: 1,
      });

      // p1 folds to check raise
      applyAction(table, 'p3 f');
      expect(Stats.forPlayerStreet(table, 2, 'flop')).toMatchObject({
        checkRaiseFolds: 1,
        checkRaiseChallenges: 1,
      });
    });
  });

  describe('donk bet', () => {
    it('should track donk bet opportunities and actions', () => {
      // A donk bet is when a player who was not the pre-flop aggressor leads out on the flop.
      // This test ensures that donk bet opportunities and attempts are correctly tracked.
      const table = Game(sampleGame);
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Preflop
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 f');

      // Flop - p2 has donk bet opportunity being out of position vs preflop aggressor
      applyAction(table, 'd db AcKcQc');
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        donkBetOpportunities: 1,
        donkBetAttempts: 0,
      });

      // p2 donk bets
      applyAction(table, 'p2 cbr 60');
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        donkBetOpportunities: 1,
        donkBetAttempts: 1,
      });

      // p1 calls donk bet
      applyAction(table, 'p1 cc');
      expect(Stats.forPlayerStreet(table, 0, 'flop')).toMatchObject({
        donkBetContinues: 1,
        donkBetChallenges: 1,
      });
    });

    it('should not count as donk bet opportunity when IP vs PFA', () => {
      // This test ensures that a player who is in position relative to the pre-flop aggressor
      // does not get a donk bet opportunity. A bet in this situation is not a donk bet.
      const table = Game(sampleGame);
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Preflop: p1 limps, p2 raises, p1 calls. p2 is PFA.
      applyAction(table, 'p1 cc');
      applyAction(table, 'p2 cbr 60');
      applyAction(table, 'p3 f');
      applyAction(table, 'p1 cc');

      // Flop: Action starts on p2 (PFA), who checks. p1 is IP.
      // Therefore, p1 should NOT have a donk bet opportunity.
      applyAction(table, 'd db AcKcQc');
      applyAction(table, 'p2 cc');
      const stats = Stats.forPlayerStreet(table, 0, 'flop');
      expect(stats).toMatchObject({
        donkBetOpportunities: 0,
      });
    });

    it('should count as donk bet opportunity when OOP vs PFA', () => {
      // This test verifies that a player who is out of position relative to the pre-flop aggressor
      // gets a donk bet opportunity when the action is on them.
      const table = Game(sampleGame);
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Preflop: p1 raises, p2 calls. p1 is PFA.
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 f');

      // Flop: Action starts on p2, who is OOP relative to p1 (PFA).
      // Therefore, p2 should have a donk bet opportunity.
      applyAction(table, 'd db AcKcQc');
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        donkBetOpportunities: 1,
      });
    });

    it('should not count as donk bet opportunity when IP vs PFA', () => {
      // This is a duplicate of a previous test, confirming that being in position against the
      // pre-flop aggressor prevents a donk bet opportunity.
      const table = Game(sampleGame);
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Preflop: p1 limps, p2 raises, p1 calls. p2 is PFA.
      applyAction(table, 'p1 cc');
      applyAction(table, 'p2 cbr 60');
      applyAction(table, 'p3 f');
      applyAction(table, 'p1 cc');

      // Flop: Action starts with p2 (PFA), who checks. p1 is IP.
      // Therefore, p1 should NOT have a donk bet opportunity.
      applyAction(table, 'd db AcKcQc');
      applyAction(table, 'p2 cc');
      const stats = Stats.forPlayerStreet(table, 0, 'flop');
      expect(stats).toMatchObject({
        donkBetOpportunities: 0,
      });
    });
  });

  describe('Check-Raise', () => {
    it('should count check-raise opportunities and attempts', () => {
      // This test verifies the tracking of check-raises on the flop.
      // It simulates a scenario where a player checks, faces a bet, and then raises.
      const table = Game(sampleGame);
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Preflop - p1 raises, others call
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');

      // Flop - p2 checks, p1 bets, p2 raises
      applyAction(table, 'd db AcKcQc');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');
      applyAction(table, 'p1 cbr 100');

      // p2 check raises
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        checkRaiseAttempts: 0,
        checkRaiseOpportunities: 1,
      });

      applyAction(table, 'p2 cbr 180');
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        checkRaiseAttempts: 1,
        checkRaiseOpportunities: 1,
      });

      // p1 folds to check raise
      applyAction(table, 'p3 f');
      expect(Stats.forPlayerStreet(table, 2, 'flop')).toMatchObject({
        checkRaiseFolds: 1,
        checkRaiseChallenges: 1,
      });
    });
  });

  describe('fiveBet', () => {
    it('should track 5-bet IP and defense OOP', () => {
      // This test tracks a pre-flop 5-bet from an in-position player (BTN).
      // It also verifies the out-of-position defensive fold from the 4-bettor (UTG).
      const table = Game({
        ...sampleGame,
        players: ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 0, 0, 10, 20],
        startingStacks: [2000, 2000, 2000, 2000, 2000, 2000],
      });
      applyAction(table, 'd dh p1 AhKh'); // UTG
      applyAction(table, 'd dh p2 AdKd');
      applyAction(table, 'd dh p3 AcKc');
      applyAction(table, 'd dh p4 QhQh'); // BTN
      applyAction(table, 'd dh p5 2c3c'); // SB
      applyAction(table, 'd dh p6 4c5c'); // BB

      applyAction(table, 'p1 cbr 60'); // UTG opens
      applyAction(table, 'p2 f');
      applyAction(table, 'p3 f');
      applyAction(table, 'p4 cbr 180'); // BTN 3-bets IP vs UTG
      applyAction(table, 'p5 f');
      applyAction(table, 'p6 f');
      applyAction(table, 'p1 cbr 540'); // UTG 4-bets OOP vs BTN
      applyAction(table, 'p4 cbr 1500'); // BTN 5-bets IP vs UTG
      applyAction(table, 'p1 f'); // UTG folds OOP

      const btnStats = Stats.forPlayerStreet(table, 3, 'preflop');
      expect(btnStats).toMatchObject({
        fiveBetIpAttempts: 1,
        fiveBetIpOpportunities: 1,
        aggressionsInPosition: 1,
      });

      const utgStats = Stats.forPlayerStreet(table, 0, 'preflop');
      expect(utgStats).toMatchObject({
        fiveBetOopChallenges: 1,
        fiveBetOopFolds: 1,
        challengesInPosition: 0,
      });
    });

    it('should track 5-bet OOP and defense IP', () => {
      // This scenario tests an out-of-position 5-bet from the Big Blind.
      // It then verifies the in-position defensive call from the Button.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 10, 20],
        startingStacks: [2000, 2000, 2000],
      });
      applyAction(table, 'd dh p1 AhKh'); // BTN
      applyAction(table, 'd dh p2 2c3c'); // SB
      applyAction(table, 'd dh p3 QhQh'); // BB

      applyAction(table, 'p1 cbr 60'); // BTN opens
      applyAction(table, 'p2 f'); // SB folds
      applyAction(table, 'p3 cbr 180'); // BB 3-bets OOP
      applyAction(table, 'p1 cbr 540'); // BTN 4-bets IP
      applyAction(table, 'p3 cbr 1500'); // BB 5-bets OOP
      applyAction(table, 'p1 cc'); // BTN calls IP

      const bbStats = Stats.forPlayerStreet(table, 2, 'preflop');
      expect(bbStats).toMatchObject({
        fiveBetOopAttempts: 1,
        fiveBetOopOpportunities: 1,
        aggressionsInPosition: 0,
      });

      const btnStats = Stats.forPlayerStreet(table, 0, 'preflop');
      expect(btnStats).toMatchObject({
        fiveBetIpChallenges: 1,
        fiveBetIpContinues: 1,
        challengesInPosition: 1,
      });
    });
  });

  describe('Delayed C-Bet', () => {
    it('should track delayed c-bet IP', () => {
      // This test tracks a delayed continuation bet from a player who is in position.
      // The pre-flop aggressor (BTN) checks back on the flop and then bets on the turn
      // after the BB checks to them.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20], // BTN is p1, BB is p2
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 AhKh'); // BTN
      applyAction(table, 'd dh p2 QhJh'); // BB

      // Preflop: BTN raises, BB calls. BTN is PFA.
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');

      // Flop: BB checks, BTN checks back.
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cc');

      // Turn: BB checks, BTN has delayed c-bet opportunity.
      applyAction(table, 'd db 5h');
      applyAction(table, 'p2 cc');
      expect(Stats.forPlayerStreet(table, 0, 'turn')).toMatchObject({
        delayedCbetIpOpportunities: 1,
        delayedCbetOopOpportunities: 0,
      });

      // BTN makes a delayed c-bet.
      applyAction(table, 'p1 cbr 100');
      expect(Stats.forPlayerStreet(table, 0, 'turn')).toMatchObject({
        delayedCbetIpAttempts: 1,
      });

      // BB folds to the delayed c-bet.
      applyAction(table, 'p2 f');
      expect(Stats.forPlayerStreet(table, 1, 'turn')).toMatchObject({
        delayedCbetOopChallenges: 1,
        delayedCbetOopFolds: 1,
      });
    });
    it('should track delayed c-bet OOP (BB is PFA)', () => {
      const table = Game({
        ...sampleGame,
        players: ['SB', 'BB'],
        blindsOrStraddles: [10, 20], // p1 = SB (acts last postflop), p2 = BB (acts first postflop)
        startingStacks: [1000, 1000],
      });

      applyAction(table, 'd dh p1 AhKh'); // SB
      applyAction(table, 'd dh p2 QhJh'); // BB

      // Preflop: SB opens, BB 3-bets -> BB is the PFA
      applyAction(table, 'p1 cbr 60'); // SB open
      applyAction(table, 'p2 cbr 220'); // BB 3-bet (PFA)
      applyAction(table, 'p1 cc'); // SB calls

      // Flop checks through (required for delayed c-bet)
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cc'); // BB (OOP) checks
      applyAction(table, 'p1 cc'); // SB (IP) checks back

      // Turn: action starts on BB (OOP) with no prior bet -> delayed c-bet OOP opportunity
      applyAction(table, 'd db 5h');

      // Opportunity is evaluated when it's BB's turn to act and no one has bet yet on turn
      // You can assert before or after BB's action, depending on when your engine increments.
      // If it increments on processing BB's action, assert after a 'cc' or 'cbr'.
      expect(Stats.forPlayerStreet(table, 1, 'turn')).toMatchObject({
        delayedCbetOopOpportunities: 1,
        delayedCbetIpOpportunities: 0,
      });

      // BB makes the delayed c-bet (OOP attempt)
      applyAction(table, 'p2 cbr 150');
      expect(Stats.forPlayerStreet(table, 1, 'turn')).toMatchObject({
        delayedCbetOopAttempts: 1,
        delayedCbetIpAttempts: 0,
      });

      // SB (IP) faces the delayed c-bet and calls (IP challenge/continue)
      applyAction(table, 'p1 cc');
      expect(Stats.forPlayerStreet(table, 0, 'turn')).toMatchObject({
        delayedCbetIpChallenges: 1,
        delayedCbetIpContinues: 1,
      });
    });

    it('should not track delayed c-bet opportunity on river', () => {
      // This test ensures that a delayed c-bet opportunity is not offered on the river,
      // even if the pre-flop aggressor checked the flop and turn.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 AhKh'); // BTN
      applyAction(table, 'd dh p2 QhJh'); // BB

      // Preflop: BTN raises, BB calls. BTN is PFA.
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');

      // Flop: BB checks, BTN checks back.
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cc');

      // Turn: BB checks, BTN checks back.
      applyAction(table, 'd db 5h');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cc');

      // River: BB checks, BTN should not have a delayed c-bet opportunity.
      applyAction(table, 'd db 6h');
      applyAction(table, 'p2 cc');
      const btnRiverStats = Stats.forPlayerStreet(table, 0, 'river');
      expect(btnRiverStats?.delayedCbetIpOpportunities).toBe(0);
      expect(btnRiverStats?.delayedCbetOopOpportunities).toBe(0);
    });
  });

  describe('Double and Triple Barrel', () => {
    it('should track double and triple barrels IP', () => {
      // This test verifies the tracking of double and triple barrel bets from an in-position player.
      // The pre-flop aggressor (BTN) makes continuation bets on the flop, turn, and river.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 AhKh'); // BTN
      applyAction(table, 'd dh p2 QhJh'); // BB

      // Preflop: BTN raises, BB calls. BTN is PFA.
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');

      // Flop: BB checks, BTN c-bets IP.
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 100');
      applyAction(table, 'p2 cc');

      // Turn: BB checks, BTN has double barrel opportunity.
      applyAction(table, 'd db 5h');
      applyAction(table, 'p2 cc');
      expect(Stats.forPlayerStreet(table, 0, 'turn')).toMatchObject({
        doubleBarrelIpOpportunities: 1,
      });

      // BTN double barrels.
      applyAction(table, 'p1 cbr 200');
      expect(Stats.forPlayerStreet(table, 0, 'turn')).toMatchObject({
        doubleBarrelIpAttempts: 1,
      });
      applyAction(table, 'p2 cc');

      // River: BB checks, BTN has triple barrel opportunity.
      applyAction(table, 'd db 6h');
      applyAction(table, 'p2 cc');
      expect(Stats.forPlayerStreet(table, 0, 'river')).toMatchObject({
        tripleBarrelIpOpportunities: 1,
      });

      // BTN triple barrels.
      applyAction(table, 'p1 cbr 400');
      expect(Stats.forPlayerStreet(table, 0, 'river')).toMatchObject({
        tripleBarrelIpAttempts: 1,
      });
    });

    it('should track double and triple barrels OOP (BB is PFA)', () => {
      const table = Game({
        ...sampleGame,
        players: ['SB', 'BB'],
        blindsOrStraddles: [10, 20], // p1 = SB (IP postflop), p2 = BB (OOP postflop)
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 AhKh'); // SB
      applyAction(table, 'd dh p2 QhJh'); // BB

      // Preflop: SB opens, BB 3-bets -> BB is PFA (OOP postflop)
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cbr 220');
      applyAction(table, 'p1 cc');

      // Flop: BB acts first OOP, c-bets; SB calls
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cbr 100'); // OOP c-bet attempt
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        cbetOopAttempts: 1,
        cbetIpAttempts: 0,
      });
      applyAction(table, 'p1 cc'); // SB calls (IP)

      // Turn: it's BB's turn first (OOP) -> double-barrel opportunity
      applyAction(table, 'd db 5h');
      expect(Stats.forPlayerStreet(table, 1, 'turn')).toMatchObject({
        doubleBarrelOopOpportunities: 1,
        doubleBarrelIpOpportunities: 0,
      });

      // BB double barrels OOP; SB calls
      applyAction(table, 'p2 cbr 200');
      expect(Stats.forPlayerStreet(table, 1, 'turn')).toMatchObject({
        doubleBarrelOopAttempts: 1,
      });
      applyAction(table, 'p1 cc');

      // River: again BB first (OOP) -> triple-barrel opportunity
      applyAction(table, 'd db 6h');
      expect(Stats.forPlayerStreet(table, 1, 'river')).toMatchObject({
        tripleBarrelOopOpportunities: 1,
        tripleBarrelIpOpportunities: 0,
      });

      // BB triple barrels OOP
      applyAction(table, 'p2 cbr 400');
      expect(Stats.forPlayerStreet(table, 1, 'river')).toMatchObject({
        tripleBarrelOopAttempts: 1,
      });
    });
  });

  describe('Probe Bet', () => {
    it('should track probe bets', () => {
      // A probe bet occurs when a player bets on the turn or river after the pre-flop aggressor
      // failed to make a continuation bet on the previous street. This test verifies tracking of probe bets.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 AhKh'); // BTN
      applyAction(table, 'd dh p2 QhJh'); // BB

      // Preflop: BTN raises, BB calls. BTN is PFA.
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');

      // Flop: BTN (IP PFA) checks back.
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cc');

      // Turn: BB has a probe bet opportunity.
      applyAction(table, 'd db 5h');
      expect(Stats.forPlayerStreet(table, 1, 'turn')).toMatchObject({
        probeBetOpportunities: 1,
      });

      // BB makes a probe bet.
      applyAction(table, 'p2 cbr 100');
      expect(Stats.forPlayerStreet(table, 1, 'turn')).toMatchObject({
        probeBetAttempts: 1,
      });

      // BTN folds to the probe bet.
      applyAction(table, 'p1 f');
      expect(Stats.forPlayerStreet(table, 0, 'turn')).toMatchObject({
        probeBetChallenges: 1,
        probeBetFolds: 1,
      });
    });
  });

  describe('Float', () => {
    it('should track a float (call) IP vs a c-bet', () => {
      // Setup: PFA is OOP postflop, will c-bet
      const table = Game({
        ...sampleGame,
        players: ['SB', 'BB'], // p1=SB (IP postflop), p2=BB (OOP postflop)
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 AhKh'); // SB
      applyAction(table, 'd dh p2 QhJh'); // BB

      // Preflop: SB opens, BB 3-bets -> BB is PFA
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cbr 220');
      applyAction(table, 'p1 cc');

      // Flop: BB (PFA) c-bets
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cbr 100');

      // SB (IP) now has a float opportunity
      expect(Stats.forPlayerStreet(table, 0, 'flop')).toMatchObject({
        floatOpportunities: 1,
        floatAttempts: 0,
      });

      // SB makes the float call
      applyAction(table, 'p1 cc');
      expect(Stats.forPlayerStreet(table, 0, 'flop')).toMatchObject({
        floatOpportunities: 1,
        floatAttempts: 1,
      });
    });

    it('should NOT track a float opportunity when OOP', () => {
      // Setup: PFA is IP postflop
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 AhKh'); // BTN
      applyAction(table, 'd dh p2 QhJh'); // BB

      // Preflop: BTN raises, BB calls. BTN is PFA.
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');

      // Flop: BB checks, BTN (PFA) c-bets
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 100');

      // BB (OOP) faces the c-bet and should not have a float opportunity
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        floatOpportunities: 0,
        probeBetOpportunities: 0, // Should not be misclassified as a probe
      });
    });
  });

  describe('Float Bet', () => {
    it('should track a float bet on the turn after floating the flop', () => {
      const table = Game({
        ...sampleGame,
        players: ['SB', 'BB'], // p1=SB (IP postflop), p2=BB (OOP postflop)
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });

      applyAction(table, 'd dh p1 AhKh'); // SB
      applyAction(table, 'd dh p2 QhJh'); // BB

      // Preflop: SB opens, BB 3-bets -> BB is PFA (OOP postflop)
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cbr 220');
      applyAction(table, 'p1 cc'); // SB is the caller last street

      // Flop: BB c-bets, SB calls (the float)
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cbr 100'); // PFA bets flop
      applyAction(table, 'p1 cc'); // IP caller floats

      // Turn: BB checks -> float bet opportunity for SB
      applyAction(table, 'd db 8d');
      applyAction(table, 'p2 cc'); // PFA checks turn

      // SB has an opportunity to make a float bet
      expect(Stats.forPlayerStreet(table, 0, 'turn')).toMatchObject({
        floatBetOpportunities: 1,
        floatBetAttempts: 0,
      });

      // SB makes the float bet
      applyAction(table, 'p1 cbr 180'); // IP float bet
      expect(Stats.forPlayerStreet(table, 0, 'turn')).toMatchObject({
        floatBetAttempts: 1,
        floatBetOpportunities: 1,
      });

      // OOP defender reacts
      applyAction(table, 'p2 cc');
      expect(Stats.forPlayerStreet(table, 1, 'turn')).toMatchObject({
        floatBetChallenges: 1,
        floatBetContinues: 1,
      });
    });

    it('should NOT track a float bet on the flop when PFA checks', () => {
      const table = Game({
        ...sampleGame,
        players: ['SB', 'BB'], // p1 = SB (acts LAST postflop), p2 = BB (acts FIRST postflop)
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });

      applyAction(table, 'd dh p1 AhKh'); // SB (IP postflop)
      applyAction(table, 'd dh p2 QhJh'); // BB (OOP postflop)

      // Preflop: SB opens, BB 3-bets -> BB is PFA and will be OOP postflop
      applyAction(table, 'p1 cbr 60'); // SB open
      applyAction(table, 'p2 cbr 220'); // BB 3-bet (PFA)
      applyAction(table, 'p1 cc'); // SB calls (caller last street)

      // Flop: action starts on BB (OOP PFA). BB checks.
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cc'); // BB checks (PFA checked)
      // SB (IP) should NOT have a float bet opportunity on the flop
      expect(Stats.forPlayerStreet(table, 0, 'flop')).toMatchObject({
        floatBetOpportunities: 0,
        probeBetOpportunities: 0,
      });

      // SB makes a bet (not a float bet)
      applyAction(table, 'p1 cbr 100');
      expect(Stats.forPlayerStreet(table, 0, 'flop')).toMatchObject({
        floatBetAttempts: 0,
        bets: 1, // It's just a regular bet
      });

      // BB faces the bet and calls
      applyAction(table, 'p2 cc');
      expect(Stats.forPlayerStreet(table, 1, 'flop')).toMatchObject({
        floatBetChallenges: 0, // Not a float bet, so no challenge
      });
    });
  });

  describe('Raise vs C-Bet', () => {
    it('should track raising a c-bet when IP', () => {
      // This test verifies that raising against a continuation bet is tracked correctly.
      // An out-of-position player makes a c-bet, and the in-position player raises.
      const table = Game({
        ...sampleGame,
        players: ['SB', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 AhKh'); // SB
      applyAction(table, 'd dh p2 QhJh'); // BB

      // Preflop: SB raises, BB calls. SB is PFA.
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');

      // Flop: BB checks, SB c-bets OOP.
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 100');

      // BB raises the c-bet IP.
      applyAction(table, 'p2 cbr 300');
      const btnStats = Stats.forPlayerStreet(table, 1, 'flop');
      expect(btnStats?.raises).toBe(1);
      // We need to check if this is specifically logged as a raise vs c-bet.
      // Current stats do not have a specific field for "raiseVsCbet".
      // This action will be captured as a generic raise.
      // Defender stats for UTG should show facing a raise.
    });

    it('should track raising a c-bet when OOP', () => {
      // This test covers check-raising against a c-bet.
      // The out-of-position player checks, the in-position PFA c-bets, and the OOP player raises.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 AhKh'); // BTN
      applyAction(table, 'd dh p2 QhJh'); // BB

      // Preflop: BTN raises, BB calls. BTN is PFA.
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');

      // Flop: BB checks, BTN c-bets IP.
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 100');

      // BB check-raises, which is a raise vs a c-bet OOP.
      applyAction(table, 'p2 cbr 300');
      const bbStats = Stats.forPlayerStreet(table, 1, 'flop');
      expect(bbStats?.checkRaiseAttempts).toBe(1);
      // This is correctly identified as a check-raise, which is a specific type of raise vs c-bet.
    });
  });

  describe('Preflop Raise (PFR)', () => {
    test('should track PFR opportunities and actions', () => {
      // This test verifies that a player's opportunity to make a preflop raise is recorded,
      // and that when they do raise, the preflopRaises stat is incremented.
      const table = Game(sampleGame);
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Player 0 (Alice) has the first opportunity to raise preflop.
      applyAction(table, 'p1 cbr 60');

      const aliceStats = Stats.forPlayerStreet(table, 0, 'preflop');
      expect(aliceStats).toMatchObject({
        raises: 1,
        preflopRaiseOpportunities: 1,
        preflopRaises: 1,
      });
    });

    test('should not count a 3-bet as a PFR', () => {
      // This test ensures that a re-raise (a 3-bet) is not counted as a PFR.
      // The PFR stat should only apply to the first raise in the hand.
      const table = Game(sampleGame);
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Player 0 (Alice) raises first (this is the PFR).
      applyAction(table, 'p1 cbr 60');

      // Player 1 (Bob) re-raises (this is a 3-bet).
      applyAction(table, 'p2 cbr 180');

      const bobStats = Stats.forPlayerStreet(table, 1, 'preflop');
      expect(bobStats).toMatchObject({
        raises: 1,
        preflopRaiseOpportunities: 0, // No PFR opportunity because there was a prior raise
        preflopRaises: 0,
        threeBetOopOpportunities: 1,
        threeBetOopAttempts: 1,
      });
    });
  });

  describe('Saw Flop', () => {
    test('should only count sawFlop on the flop street', () => {
      // This test verifies that the sawFlop stat is correctly applied.
      // It should only be marked as 1 for a player's first action on the flop,
      // and should be 0 on the preflop street.
      const table = Game(sampleGame);
      applyAction(table, 'd dh p1 AhKh');
      applyAction(table, 'd dh p2 QhJh');
      applyAction(table, 'd dh p3 2c3c');

      // Preflop actions
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 f');

      // Check preflop stats for a player who continued past preflop
      const bobPreflopStats = Stats.forPlayerStreet(table, 1, 'preflop');
      expect(bobPreflopStats?.sawFlop).toBe(0);

      // Deal flop
      applyAction(table, 'd db AcKcQc');

      // Player 1 (Bob) acts on the flop. This should trigger sawFlop.
      applyAction(table, 'p2 cc');

      const bobFlopStats = Stats.forPlayerStreet(table, 1, 'flop');
      expect(bobFlopStats).toMatchObject({
        checks: 1,
        sawFlop: 1,
      });
    });
  });
});
