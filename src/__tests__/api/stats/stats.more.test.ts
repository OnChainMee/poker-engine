import { describe, expect, it } from 'vitest';
import { Hand } from '../../..';
import { Game } from '../../../Game';
import { Stats } from '../../../Stats';
import { applyAction } from '../../../game/progress';

// A sample game definition to be used as a base for tests.
const sampleGame: Hand = {
  variant: 'NT',
  players: [],
  startingStacks: [],
  blindsOrStraddles: [],
  antes: [],
  actions: [],
  minBet: 20,
  seed: 12345,
};

describe('Positional & Maneuver Stat Tracking', () => {
  describe('Fundamentals', () => {
    it('1) should correctly determine IP/OOP order heads-up (SB IP, BB OOP)', () => {
      // Setup: Heads-up game with SB and BB.
      // Action: SB opens, BB calls.
      // Assert: On the flop, confirm that SB is correctly identified as In Position (IP)
      // and BB is Out of Position (OOP) for any relevant stat opportunities (e.g., c-bet).
      const table = Game({
        ...sampleGame,
        players: ['SB', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');
      applyAction(table, 'd db 4c5c6d');
      // Flop: In a HU pot, the BB is OOP and acts first; SB is IP and acts last.
      applyAction(table, 'p2 cc'); // BB checks

      const sbFlopStats = Stats.forPlayerStreet(table, 0, 'flop');
      expect(sbFlopStats).toMatchObject({ cbetIpOpportunities: 1, cbetOopOpportunities: 0 });

      const bbFlopStats = Stats.forPlayerStreet(table, 1, 'flop');
      expect(bbFlopStats).toMatchObject({ cbetIpOpportunities: 0, cbetOopOpportunities: 0 });
    });
    it('2A) should give NO flop c-bet opp when PFA is all-in preflop (multiway to HU)', () => {
      // Setup: 4-handed. SB short and becomes last aggressor by shoving.
      const table = Game({
        ...sampleGame,
        players: ['UTG', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 10, 20],
        startingStacks: [1000, 1000, 220, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'd dh p4 5h5c');

      // Preflop: UTG opens, BTN calls, SB (short) shoves = last aggressor; BB folds; UTG & BTN call.
      applyAction(table, 'p1 cbr 60'); // UTG open
      applyAction(table, 'p2 cc'); // BTN call
      applyAction(table, 'p3 cbr 220'); // SB all-in (last aggressor)
      applyAction(table, 'p4 f'); // BB fold
      applyAction(table, 'p1 cc'); // UTG call
      applyAction(table, 'p2 cc'); // BTN call

      // Flop: PFA (SB) is all-in → nobody can c-bet.
      applyAction(table, 'd db Ac7c2d');

      const utgFlop = Stats.forPlayerStreet(table, 0, 'flop');
      const btnFlop = Stats.forPlayerStreet(table, 1, 'flop');
      expect(utgFlop?.cbetIpOpportunities).toBe(0);
      expect(utgFlop?.cbetOopOpportunities).toBe(0);
      expect(btnFlop).toBeUndefined();
    });
    it('2B) should give UTG an OOP flop c-bet opp after re-taking last aggression preflop', () => {
      // Setup: same seats; UTG becomes LAST aggressor by 4-betting over SB shove.
      const table = Game({
        ...sampleGame,
        players: ['UTG', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 10, 20],
        startingStacks: [1000, 1000, 220, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'd dh p4 5h5c');

      // Preflop line: UTG open, BTN call, SB shove, BB fold, UTG re-raises (takes PFA), BTN continues.
      applyAction(table, 'p1 cbr 60'); // UTG open
      applyAction(table, 'p2 cc'); // BTN call
      applyAction(table, 'p3 cbr 220'); // SB all-in
      applyAction(table, 'p4 f'); // BB fold
      applyAction(table, 'p1 cbr 500'); // UTG 4-bet covering SB → UTG is LAST aggressor (PFA)
      applyAction(table, 'p2 cc'); // BTN continues

      // Flop: button is p2; acting order skips SB (all-in), skips BB (folded), lands on UTG first → OOP vs BTN.
      applyAction(table, 'd db Ac7c2d');

      const utgFlop = Stats.forPlayerStreet(table, 0, 'flop');
      expect(utgFlop?.cbetOopOpportunities).toBe(1);
      expect(utgFlop?.cbetIpOpportunities).toBe(0);

      const btnFlop = Stats.forPlayerStreet(table, 1, 'flop');
      expect(btnFlop).toBeUndefined();
    });

    it.skip('3) should adjust projected preflop order with a straddle', () => {
      // Setup: 4-handed with a live UTG straddle; BTN is the dealer.
      // Seats:  p1=UTG(straddle), p2=BTN, p3=SB, p4=BB
      const table = Game({
        ...sampleGame,
        players: ['UTG', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [40, 0, 10, 20], // UTG posts 40 (live straddle)
        startingStacks: [1000, 1000, 1000, 1000],
      });

      // Deal
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'd dh p4 5h5c');

      // --- Preflop order starts with UTG, then proceeds clockwise. ---
      applyAction(table, 'p1 cbr 120'); // UTG raises their own straddle.
      applyAction(table, 'p2 cc'); // BTN calls.
      applyAction(table, 'p3 f'); // SB folds.
      applyAction(table, 'p4 f'); // BB folds.

      applyAction(table, 'd db 2c3c4d');
      // Flop: Action starts with the first active player to the left of the button, which is UTG.
      // UTG was the PFA and is OOP vs BTN, giving them an OOP c-bet opportunity.
      const utgFlopStats = Stats.forPlayerStreet(table, 0, 'flop');
      expect(utgFlopStats).toMatchObject({ cbetOopOpportunities: 1, cbetIpOpportunities: 0 });
    });
  });

  describe('Preflop Maneuvers', () => {
    it('4) should track steal attempts from CO/BTN/SB with size thresholds', () => {
      // Setup: Three separate hands with a CO open-raise.
      // Action A: CO raises less than 2.5x BB.
      // Action B: CO raises exactly 2.5x BB.
      // Action C: CO raises more than 4x BB.
      // Assert A: A raise < 2.5x BB should not count as a steal attempt.
      // Assert B & C: Raises >= 2.5x should count as a steal attempt.
      const tableA = Game({
        ...sampleGame,
        players: ['CO', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 10, 20],
        startingStacks: [1000, 1000, 1000, 1000],
      });
      applyAction(tableA, 'd dh p1 2h2c');
      applyAction(tableA, 'd dh p2 3h3c');
      applyAction(tableA, 'd dh p3 4h4c');
      applyAction(tableA, 'd dh p4 5h5c');
      applyAction(tableA, 'p1 cbr 45'); // CO < 2.5x

      const coStatsA = Stats.forPlayerStreet(tableA, 0, 'preflop');
      expect(coStatsA).toMatchObject({ stealIpOpportunities: 1, stealIpAttempts: 0 });

      const tableB = Game({
        ...sampleGame,
        players: ['CO', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 10, 20],
        startingStacks: [1000, 1000, 1000, 1000],
      });
      applyAction(tableB, 'd dh p1 2h2c');
      applyAction(tableB, 'd dh p2 3h3c');
      applyAction(tableB, 'd dh p3 4h4c');
      applyAction(tableB, 'd dh p4 5h5c');
      applyAction(tableB, 'p1 cbr 50'); // CO = 2.5x

      const coStatsB = Stats.forPlayerStreet(tableB, 0, 'preflop');
      expect(coStatsB).toMatchObject({ stealIpOpportunities: 1, stealIpAttempts: 1 });

      const tableC = Game({
        ...sampleGame,
        players: ['CO', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 10, 20],
        startingStacks: [1000, 1000, 1000, 1000],
      });
      applyAction(tableC, 'd dh p1 2h2c');
      applyAction(tableC, 'd dh p2 3h3c');
      applyAction(tableC, 'd dh p3 4h4c');
      applyAction(tableC, 'd dh p4 5h5c');
      applyAction(tableC, 'p1 cbr 90'); // CO > 4x

      const coStatsC = Stats.forPlayerStreet(tableC, 0, 'preflop');
      expect(coStatsC).toMatchObject({ stealIpOpportunities: 1, stealIpAttempts: 0 }); // Fails because raise size is > 4bb
    });

    it('5) should identify an SB open as an OOP steal attempt vs BB', () => {
      // Setup: 3-handed, folds to SB.
      // Action: SB open-raises, BB folds.
      // Assert: SB's action is an OOP steal attempt and takedown. BB faces an OOP steal and folds.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 10, 20],
        startingStacks: [1000, 1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'p1 f');
      applyAction(table, 'p2 cbr 60');
      applyAction(table, 'p3 f');

      const sbStats = Stats.forPlayerStreet(table, 1, 'preflop');
      expect(sbStats).toMatchObject({
        stealOopOpportunities: 1,
        stealOopAttempts: 1,
        stealOopTakedowns: 1,
      });

      const bbStats = Stats.forPlayerStreet(table, 2, 'preflop');
      expect(bbStats).toMatchObject({
        stealOopChallenges: 0,
        stealOopFolds: 0,
        stealIpChallenges: 1,
        stealIpFolds: 1,
      });
    });

    it('6) should detect a squeeze vs an original raiser and one or more callers', () => {
      // Setup: UTG opens, CO calls.
      // Action: BB 3-bets.
      // Assert: BB's action is a squeeze attempt (and a 3-bet). UTG and CO face a squeeze.
      const table = Game({
        ...sampleGame,
        players: ['UTG', 'CO', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 0, 10, 20],
        startingStacks: [1000, 1000, 1000, 1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'd dh p4 5h5c');
      applyAction(table, 'd dh p5 6h6c');
      applyAction(table, 'p1 cbr 60'); // UTG
      applyAction(table, 'p2 cc'); // CO
      applyAction(table, 'p3 f');
      applyAction(table, 'p4 f');
      applyAction(table, 'p5 cbr 260'); // BB

      const bbStats = Stats.forPlayerStreet(table, 4, 'preflop');
      expect(bbStats).toMatchObject({
        squeezeOopOpportunities: 1,
        squeezeOopAttempts: 1,
        threeBetOopAttempts: 1,
      });

      // UTG and CO now face a squeeze
      const utgStats = Stats.forPlayerStreet(table, 0, 'preflop');
      expect(utgStats).toMatchObject({ squeezeIpChallenges: 1 });

      applyAction(table, 'p1 cc');

      const coStats = Stats.forPlayerStreet(table, 1, 'preflop');
      expect(coStats).toMatchObject({ squeezeIpChallenges: 1, squeezeOopChallenges: 0 });
    });

    it('7) should track cold 3-bet and cold 4-bet opportunities', () => {
      // Setup: UTG opens, MP calls, then CO cold 3-bets. BB then cold 4-bets.
      // Action: UTG opens, MP calls, CO 3-bets, folds to BB, who 4-bets.
      // Assert: CO's action is a cold 3-bet. BB's action is a cold 4-bet.
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
      applyAction(table, 'p1 cbr 60'); // UTG Open
      applyAction(table, 'p2 cc'); // MP Call
      applyAction(table, 'p3 cbr 240'); // CO Cold 3-bet
      applyAction(table, 'p4 f'); // BTN Fold
      applyAction(table, 'p5 f'); // SB Fold
      applyAction(table, 'p6 cbr 720'); // BB Cold 4-bet

      const coStats = Stats.forPlayerStreet(table, 2, 'preflop');
      expect(coStats).toMatchObject({ threeBetIpAttempts: 1 });

      const bbStats = Stats.forPlayerStreet(table, 5, 'preflop');
      expect(bbStats).toMatchObject({ fourBetOopAttempts: 1 });
    });

    it('8) should not provide a 3-bet/4-bet opportunity when raising is closed', () => {
      // Setup: CO opens, BTN calls, SB shoves all-in for less than a legal raise.
      // Action: Action is on the BB and then returns to the CO.
      // Assert: No player should have a 3-bet or 4-bet opportunity, as the raise was not reopened.
      const table = Game({
        ...sampleGame,
        players: ['CO', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 10, 20],
        startingStacks: [1000, 1000, 95, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'd dh p4 5h5c');
      applyAction(table, 'p1 cbr 60'); // CO
      applyAction(table, 'p2 cc'); // BTN
      applyAction(table, 'p3 cbr 95'); // SB all-in, not a full raise
      applyAction(table, 'p4 cc'); // BB calls
      applyAction(table, 'p1 cc'); // CO can only call

      const bbStats = Stats.forPlayerStreet(table, 3, 'preflop');
      expect(bbStats).toMatchObject({ threeBetOopOpportunities: 0, fourBetOopOpportunities: 0 });

      const coStats = Stats.forPlayerStreet(table, 0, 'preflop');
      expect(coStats).toMatchObject({ fourBetOopOpportunities: 0, raises: 1 }); // Initial raise
    });

    it('9) should increment both maneuver and shove counters for 3-bet/4-bet shoves', () => {
      // Setup: BTN opens, SB 3-bet shoves, BTN 4-bet shoves over the top.
      // Action: BTN opens, SB shoves, BTN re-shoves.
      // Assert: SB's action increments both threeBetOopAttempts and shoveOopAttempts.
      // BTN's action increments both fourBetIpAttempts and shoveIpAttempts.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 10, 20],
        startingStacks: [2000, 1000, 2000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'p1 cbr 60'); // BTN
      applyAction(table, 'p2 cbr 1000'); // SB 3-bet shove
      applyAction(table, 'p3 f'); // BB folds
      applyAction(table, 'p1 cbr 2000'); // BTN 4-bet shove

      const sbStats = Stats.forPlayerStreet(table, 1, 'preflop');
      expect(sbStats).toMatchObject({ threeBetOopAttempts: 1, shoveOopAttempts: 1 });

      const btnStats = Stats.forPlayerStreet(table, 0, 'preflop');
      expect(btnStats).toMatchObject({ fourBetIpAttempts: 1, shoveIpAttempts: 1 });
    });

    it('10) should track 5-bet opportunities and attempts', () => {
      // Setup: Standard preflop war.
      // Action: UTG opens, BTN 3-bets, UTG 4-bets, BTN 5-bets, UTG folds.
      // Assert: BTN has a 5-bet IP opportunity and attempt. UTG faces a 5-bet OOP and folds.
      const table = Game({
        ...sampleGame,
        players: ['UTG', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 10, 20],
        startingStacks: [2000, 2000, 2000, 2000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'd dh p4 5h5c');
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cbr 180');
      applyAction(table, 'p3 f');
      applyAction(table, 'p4 f');
      applyAction(table, 'p1 cbr 540');
      applyAction(table, 'p2 cbr 1100');
      applyAction(table, 'p1 f');

      const btnStats = Stats.forPlayerStreet(table, 1, 'preflop');
      expect(btnStats).toMatchObject({ fiveBetIpOpportunities: 1, fiveBetIpAttempts: 1 });

      const utgStats = Stats.forPlayerStreet(table, 0, 'preflop');
      expect(utgStats).toMatchObject({ fiveBetOopChallenges: 1, fiveBetOopFolds: 1 });
    });
  });

  describe('Postflop — Aggression Maneuvers', () => {
    it('11) should identify flop c-bet opportunities OOP and IP in a HU pot', () => {
      // Setup Case 1 (OOP PFA): SB opens, BB 3-bets, SB calls. BB is PFA and OOP postflop.
      // Assert: On flop, BB has a cbetOopOpportunities.
      const tableOop = Game({
        ...sampleGame,
        players: ['SB', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(tableOop, 'd dh p1 2h2c');
      applyAction(tableOop, 'd dh p2 3h3c');
      applyAction(tableOop, 'p1 cbr 60');
      applyAction(tableOop, 'p2 cbr 220');
      applyAction(tableOop, 'p1 cc');
      applyAction(tableOop, 'd db 4c5c6d');
      applyAction(tableOop, 'p2 cbr 100');

      const bbStatsOop = Stats.forPlayerStreet(tableOop, 1, 'flop');
      expect(bbStatsOop).toMatchObject({ cbetOopOpportunities: 1, cbetOopAttempts: 1 });

      // Setup Case 2 (IP PFA): BTN opens, BB calls. BTN is PFA and IP postflop.
      // Assert: On flop, after BB checks, BTN has a cbetIpOpportunities.
      const tableIp = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(tableIp, 'd dh p1 2h2c');
      applyAction(tableIp, 'd dh p2 3h3c');
      applyAction(tableIp, 'p1 cbr 60');
      applyAction(tableIp, 'p2 cc');
      applyAction(tableIp, 'd db 4c5c6d');
      applyAction(tableIp, 'p2 cc');
      applyAction(tableIp, 'p1 cbr 100');
      // Flop: BB is in the blinds and OOP, so they act first.
      const btnStatsIp = Stats.forPlayerStreet(tableIp, 0, 'flop');
      expect(btnStatsIp).toMatchObject({ cbetIpOpportunities: 1, cbetIpAttempts: 1 });
    });

    it('12) should not give a c-bet opportunity if a non-PFA leads out (donks)', () => {
      // Setup: MP opens, BB defends.
      // Action: On the flop, BB leads out with a bet.
      // Assert: BB's action is a donk bet. MP (the PFA) should have cbet*Opportunities: 0.
      const table = Game({
        ...sampleGame,
        players: ['MP', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 10, 20],
        startingStacks: [1000, 1000, 1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'd dh p4 4h4c');
      // Preflop: Action starts to the left of the big blind, which is MP.
      applyAction(table, 'p1 cbr 60'); // MP
      applyAction(table, 'p2 f');
      applyAction(table, 'p3 f');
      applyAction(table, 'p4 cc'); // BB calls
      applyAction(table, 'd db Ac7c2d');
      // Flop: Action is on BB, who is OOP.
      applyAction(table, 'p4 cbr 100'); // BB donks

      const bbStats = Stats.forPlayerStreet(table, 3, 'flop');
      expect(bbStats).toMatchObject({ donkBetOpportunities: 1, donkBetAttempts: 1 });

      const mpStats = Stats.forPlayerStreet(table, 0, 'flop');
      expect(mpStats).toMatchObject({
        cbetIpOpportunities: 0,
        cbetOopOpportunities: 0,
        donkBetChallenges: 1,
      });
    });

    it('13) should track delayed c-bet on turn when flop was checked through (IP & OOP)', () => {
      // Setup IP PFA: BTN raises, BB calls. Flop is checked by both.
      // Action: On turn, BB checks.
      // Assert: BTN has a delayedCbetIpOpportunities.
      const tableIp = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(tableIp, 'd dh p1 2h2c');
      applyAction(tableIp, 'd dh p2 3h3c');
      applyAction(tableIp, 'p1 cbr 60');
      applyAction(tableIp, 'p2 cc');
      applyAction(tableIp, 'd db 2c3c4d');
      applyAction(tableIp, 'p2 cc');
      applyAction(tableIp, 'p1 cc');
      applyAction(tableIp, 'd db 5h');
      // Turn: BB is OOP and acts first.
      applyAction(tableIp, 'p2 cc');
      applyAction(tableIp, 'p1 cbr 100');

      const btnStats = Stats.forPlayerStreet(tableIp, 0, 'turn');
      expect(btnStats).toMatchObject({ delayedCbetIpOpportunities: 1, delayedCbetIpAttempts: 1 });
    });

    it('14) should not give a delayed c-bet opportunity if another player bets first on the turn', () => {
      // Setup: HU. p1 = BTN/SB (acts first preflop, last postflop), p2 = BB (acts last preflop, first postflop).
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });

      // Deal
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');

      // Preflop: BTN opens, BB calls. BTN is PFA.
      expect(table.nextPlayerIndex).toBe(0); // BTN acts first preflop in HU
      applyAction(table, 'p1 cbr 60'); // BTN raise
      expect(table.nextPlayerIndex).toBe(1); // BB to act
      applyAction(table, 'p2 cc'); // BB call

      // Flop: BB (OOP) acts first; checks. BTN (PFA/IP) checks back → flop checks through.
      applyAction(table, 'd db 2c3c4d');
      expect(table.nextPlayerIndex).toBe(1); // BB first on flop
      applyAction(table, 'p2 cc'); // BB check
      expect(table.nextPlayerIndex).toBe(0); // BTN to act
      applyAction(table, 'p1 cc'); // BTN check-back

      // Turn: BB acts first again. If BB LEADS, BTN cannot have delayed-cbet opportunity.
      applyAction(table, 'd db 5h');
      expect(table.nextPlayerIndex).toBe(1); // BB first on turn

      // Assert BEFORE BB acts: no delayed-cbet opportunity has been granted to BTN
      expect(Stats.forPlayerStreet(table, 0, 'turn')).toBeUndefined();

      // BB leads the turn → this is a PROBE bet attempt (since PFA skipped flop cbet).
      applyAction(table, 'p2 cbr 150');

      // Assert probe classification for BB; still no delayed-cbet for BTN
      expect(Stats.forPlayerStreet(table, 1, 'turn')).toMatchObject({
        probeBetAttempts: 1,
        probeBetOpportunities: 1,
      });
      expect(Stats.forPlayerStreet(table, 0, 'turn')).toMatchObject({
        delayedCbetIpOpportunities: 0,
        delayedCbetIpAttempts: 0,
      });

      // Optional defender reaction to validate challenge stats
      applyAction(table, 'p1 f'); // BTN folds to the probe
      expect(Stats.forPlayerStreet(table, 0, 'turn')).toMatchObject({
        probeBetChallenges: 1,
        probeBetFolds: 1,
      });
    });

    it('15) should track double and triple barrels in a continuous chain', () => {
      // Setup: BTN is PFA IP.
      // Action: BTN c-bets flop, bets turn, and bets river.
      // Assert: On the turn, BTN has a doubleBarrelIpOpportunities and attempt.
      // On the river, BTN has a tripleBarrelIpOpportunities and attempt.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 100'); // C-bet
      applyAction(table, 'p2 cc');
      applyAction(table, 'd db 5h');
      // Turn: BB is OOP and acts first.
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 250'); // Double barrel
      applyAction(table, 'p2 cc');
      applyAction(table, 'd db 6h');
      // River: BB is OOP and acts first.
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 400'); // Triple barrel

      const btnFlopStats = Stats.forPlayerStreet(table, 0, 'flop');
      expect(btnFlopStats).toMatchObject({ cbetIpAttempts: 1 });

      const btnTurnStats = Stats.forPlayerStreet(table, 0, 'turn');
      expect(btnTurnStats).toMatchObject({
        doubleBarrelIpOpportunities: 1,
        doubleBarrelIpAttempts: 1,
      });

      const btnRiverStats = Stats.forPlayerStreet(table, 0, 'river');
      expect(btnRiverStats).toMatchObject({
        tripleBarrelIpOpportunities: 1,
        tripleBarrelIpAttempts: 1,
      });
    });

    it('16) should not track double/triple barrels if the aggressor skipped a street', () => {
      // Setup: BTN is PFA IP.
      // Action: BTN c-bets flop, checks turn, then bets river.
      // Assert: On the river, the bet is not a triple barrel; tripleBarrel*Opportunities should be 0.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 100'); // C-bet
      applyAction(table, 'p2 cc');
      applyAction(table, 'd db 5h');
      // Turn: BB is OOP and acts first.
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cc'); // Check turn
      applyAction(table, 'd db 6h');
      // River: BB is OOP and acts first.
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 400'); // Not a triple barrel

      const btnRiverStats = Stats.forPlayerStreet(table, 0, 'river');
      expect(btnRiverStats).toMatchObject({
        tripleBarrelIpOpportunities: 0,
        tripleBarrelIpAttempts: 0,
      });
    });
  });

  describe('Postflop — Donk / Probe / Float', () => {
    it('17) should identify a donk bet as always OOP vs the PFA', () => {
      // Setup: BTN is PFA IP.
      // Action: On the flop, the BB (OOP) leads out with a bet.
      // Assert: BB's bet is a donkBetAttempt. It should not be a c-bet.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cbr 100');
      // Flop: BB is OOP and acts first.
      const bbStats = Stats.forPlayerStreet(table, 1, 'flop');
      expect(bbStats).toMatchObject({ donkBetOpportunities: 1, donkBetAttempts: 1 });

      const btnStats = Stats.forPlayerStreet(table, 0, 'flop');
      expect(btnStats).toMatchObject({ cbetIpOpportunities: 0 });
    });

    it('18) should identify a probe bet as always OOP when PFA skipped the prior street', () => {
      // Setup: BTN is PFA. Flop is checked through.
      // Action: On the turn, BB (OOP) leads out with a bet.
      // Assert: BB's bet is a probeBetAttempt.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cc');
      applyAction(table, 'd db 5h');
      // Turn: BB is OOP and acts first.
      applyAction(table, 'p2 cbr 120');

      const bbStats = Stats.forPlayerStreet(table, 1, 'turn');
      expect(bbStats).toMatchObject({ probeBetOpportunities: 1, probeBetAttempts: 1 });
    });

    it('19) should track a float (the call) IP vs a c-bet', () => {
      // Setup: BB is PFA and OOP postflop (HU).
      // Action: On flop, BB c-bets, and SB (IP) calls.
      // Assert: SB's call is a floatAttempt.
      const table = Game({
        ...sampleGame,
        players: ['SB', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cbr 220'); // BB is PFA
      applyAction(table, 'p1 cc');
      applyAction(table, 'd db 2c3c4d');
      // Flop: BB is PFA and OOP, acts first.
      applyAction(table, 'p2 cbr 100');
      applyAction(table, 'p1 cc');

      const sbStats = Stats.forPlayerStreet(table, 0, 'flop');
      expect(sbStats).toMatchObject({ floatOpportunities: 1, floatAttempts: 1 });
    });

    it('20) should not track float opportunities for OOP calls', () => {
      // Setup: BTN is PFA and IP.
      // Action: On flop, BTN c-bets, BB (OOP) calls.
      // Assert: BB has floatOpportunities: 0.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');
      applyAction(table, 'd db 2c3c4d');
      // Flop: BB is OOP and acts first.
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 100');
      applyAction(table, 'p2 cc');

      const bbStats = Stats.forPlayerStreet(table, 1, 'flop');
      expect(bbStats).toMatchObject({ floatOpportunities: 0, floatAttempts: 0 });
    });

    it('21) should track a float bet on the turn after floating the flop', () => {
      // Setup: BB is PFA (OOP postflop, HU), SB (IP) floats the flop.
      // Action: On the turn, BB checks, SB bets.
      // Assert: SB's bet is a floatBetAttempt. BB faces a floatBetChallenge.
      const table = Game({
        ...sampleGame,
        players: ['SB', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cbr 220'); // BB is PFA
      applyAction(table, 'p1 cc');
      applyAction(table, 'd db 2c3c4d');
      // Flop: BB is PFA and OOP, acts first.
      applyAction(table, 'p2 cbr 100');
      applyAction(table, 'p1 cc'); // Float call
      applyAction(table, 'd db 8d');
      // Turn: BB is PFA and OOP, acts first.
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 180'); // Float bet

      const sbStats = Stats.forPlayerStreet(table, 0, 'turn');
      expect(sbStats).toMatchObject({ floatBetOpportunities: 1, floatBetAttempts: 1 });

      const bbStats = Stats.forPlayerStreet(table, 1, 'turn');
      expect(bbStats).toMatchObject({ floatBetChallenges: 1 });
    });

    it('22) should (or should not) track a river float bet', () => {
      // Setup: Like the float bet test, but the turn is checked through.
      // Action: On the river, BB checks, SB bets.
      // Assert: Depending on engine logic, this is either a floatBetAttempt or just a regular bet.
      // Check that floatBet* stats are 0 if not supported on the river.
      const table = Game({
        ...sampleGame,
        players: ['SB', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cbr 220');
      applyAction(table, 'p1 cc');
      applyAction(table, 'd db 2c3c4d');
      // Flop: BB is PFA and OOP, acts first.
      applyAction(table, 'p2 cbr 100');
      applyAction(table, 'p1 cc');
      applyAction(table, 'd db 8d');
      // Turn: BB is PFA and OOP, acts first.
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cc');
      applyAction(table, 'd db 9d');
      // River: BB is PFA and OOP, acts first.
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 300');

      const sbStats = Stats.forPlayerStreet(table, 0, 'river');
      expect(sbStats).toMatchObject({ floatBetOpportunities: 0, floatBetAttempts: 0 });
    });

    it('23) should classify an OOP bet after a PFA check as a probe, not a float bet', () => {
      // Setup: BTN is PFA. Flop checks through.
      // Action: On the turn, BB (OOP) bets.
      // Assert: BB's bet is a probeBetAttempt, and floatBetAttempts is 0.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');
      applyAction(table, 'd db 2c3c4d');
      // Flop: BB is OOP and acts first.
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cc');
      applyAction(table, 'd db 5h');
      // Turn: BB is OOP and acts first.
      applyAction(table, 'p2 cbr 120');

      const bbStats = Stats.forPlayerStreet(table, 1, 'turn');
      expect(bbStats).toMatchObject({ probeBetAttempts: 1, floatBetAttempts: 0 });
    });
  });

  describe('Defensive Stats', () => {
    it('24) should log separate squeeze challenges for OR and caller(s)', () => {
      // Setup: UTG opens, CO calls, BB squeezes.
      // Action: UTG folds, CO calls.
      // Assert: UTG has squeezeOopChallenges:1 and squeezeOopFolds:1.
      // CO has squeezeIpChallenges:1 and squeezeIpContinues:1.
      const table = Game({
        ...sampleGame,
        players: ['UTG', 'CO', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 0, 10, 20],
        startingStacks: [1000, 1000, 1000, 1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'd dh p4 5h5c');
      applyAction(table, 'd dh p5 6h6c');
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 f');
      applyAction(table, 'p4 f');
      applyAction(table, 'p5 cbr 260');
      applyAction(table, 'p1 f');
      applyAction(table, 'p2 cc');
      // BB = squeezer, OOP attempt
      const bbStats = Stats.forPlayerStreet(table, 4, 'preflop');
      expect(bbStats).toMatchObject({
        squeezeOopAttempts: 1,
      });

      // UTG faced the squeeze and FOLDED → IP challenge vs BB
      const utgStats = Stats.forPlayerStreet(table, 0, 'preflop');
      expect(utgStats).toMatchObject({
        squeezeIpChallenges: 1,
        squeezeIpFolds: 1,
        squeezeIpContinues: 0,
        // and make sure the OOP variants stay 0
        squeezeOopChallenges: 0,
        squeezeOopFolds: 0,
        squeezeOopContinues: 0,
      });

      // CO faced the squeeze and CONTINUED → IP challenge vs BB
      const coStats = Stats.forPlayerStreet(table, 1, 'preflop');
      expect(coStats).toMatchObject({
        squeezeIpChallenges: 1,
        squeezeIpFolds: 0,
        squeezeIpContinues: 1,
      });
    });

    it('25) should correctly assign 4-bet defense challenges', () => {
      // Setup: UTG opens, CO 3-bets, UTG 4-bets, CO calls.
      const table = Game({
        ...sampleGame,
        players: ['UTG', 'CO', 'BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 0, 0, 10, 20],
        startingStacks: [1000, 1000, 1000, 1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      applyAction(table, 'd dh p4 5h5c');
      applyAction(table, 'd dh p5 6h6c');
      // Preflop: Action starts to the left of the big blind, which is UTG.
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cbr 180');
      applyAction(table, 'p3 f');
      applyAction(table, 'p4 f');
      applyAction(table, 'p5 f');
      applyAction(table, 'p1 cbr 540');
      applyAction(table, 'p2 cc');

      const coStats = Stats.forPlayerStreet(table, 1, 'preflop');
      expect(coStats).toMatchObject({
        fourBetIpChallenges: 1,
        fourBetIpContinues: 1,
        fourBetIpFolds: 0,
      });
    });

    it('26) should record exactly one defense outcome (fold or continue) per challenge', () => {
      // Setup: Any scenario where a player faces a raise (e.g., a 3-bet).
      // Action: The player folds.
      // Assert: The player's stats show ...Folds:1 and ...Continues:0.
      // The total must be Challenges = Folds + Continues.
      const table = Game({
        ...sampleGame,
        players: ['UTG', 'BTN'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cbr 180');
      applyAction(table, 'p1 f');

      const utgStats = Stats.forPlayerStreet(table, 0, 'preflop');
      expect(utgStats).toMatchObject({
        threeBetIpChallenges: 1,
        threeBetIpFolds: 1,
        threeBetIpContinues: 0,
        threeBetOopChallenges: 0,
        threeBetOopFolds: 0,
        threeBetOopContinues: 0,
      });
    });
  });

  describe('Side Pots, Rake, and Showdown', () => {
    it('29) should award a takedown for a successful preflop steal or open-shove', () => {
      // Setup: 3-handed.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 10, 20],
        startingStacks: [1000, 1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');
      // Preflop: Action starts on the BTN.
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 f');
      applyAction(table, 'p3 f');

      const btnStats = Stats.forPlayerStreet(table, 0, 'preflop');
      expect(btnStats).toMatchObject({ stealIpTakedowns: 1 });
    });

    it('30) should only count tabling cards as wentToShowdown, not mucking', () => {
      // Setup: 3-way pot to the river.
      // Action: A player is called on the river, sees they are beat, and mucks.
      // Assert: The two players who tabled their hands have wentToShowdown:1. The mucking player has wentToShowdown:0.
      const table = Game({
        ...sampleGame,
        players: ['P1', 'P2', 'P3'],
        blindsOrStraddles: [0, 10, 20],
        startingStacks: [1000, 1000, 1000],
      });
      applyAction(table, 'd dh p1 AsAc'); // P1
      applyAction(table, 'd dh p2 KsKc'); // P2
      applyAction(table, 'd dh p3 QsQc'); // P3

      // Preflop
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');
      // Flop
      applyAction(table, 'd db 2h7d8c');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');
      applyAction(table, 'p1 cbr 100');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');
      // Turn
      applyAction(table, 'd db 9s');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');
      applyAction(table, 'p1 cc');
      // River
      applyAction(table, 'd db Ts');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');
      applyAction(table, 'p1 cbr 200');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p3 cc');

      // Showdown
      applyAction(table, 'p1 sm AsAc');
      applyAction(table, 'p2 sm KsKc');
      applyAction(table, 'p3 sm'); // P3 mucks
      // P3 does not act ('sm'), thus mucks.

      const p1Stats = Stats.forPlayerStreet(table, 0, 'river');
      expect(p1Stats).toMatchObject({ wentToShowdown: 1, investments: 200 });
      const p2Stats = Stats.forPlayerStreet(table, 1, 'river');
      expect(p2Stats).toMatchObject({ wentToShowdown: 1, investments: 200 });
      const p3Stats = Stats.forPlayerStreet(table, 2, 'river');
      expect(p3Stats).toMatchObject({ wentToShowdown: 0, investments: 200 });
    });
  });

  describe('More Coverage for Your Existing Areas', () => {
    it('33) should deny a c-bet opportunity in a multiway pot if another player acts first', () => {
      // Setup: 3-handed. Seat mapping by blinds:
      // players: ['UTG', 'BTN', 'BB'] with blindsOrStraddles [0,10,20]
      // => p2 is SB (10), p3 is BB (20), p1 has 0 and is effectively the Button.
      // We'll make p1 ('UTG' label, actually BTN seat) the PFA preflop.
      const table = Game({
        ...sampleGame,
        players: ['UTG', 'BTN', 'BB'],
        blindsOrStraddles: [0, 10, 20],
        startingStacks: [1000, 1000, 1000],
      });

      // Deal
      applyAction(table, 'd dh p1 2h2c'); // p1 (Button seat)
      applyAction(table, 'd dh p2 3h3c'); // p2 (SB)
      applyAction(table, 'd dh p3 4h4c'); // p3 (BB)

      // Preflop: p1 opens (PFA), p2 calls, p3 calls → multiway to flop
      applyAction(table, 'p1 cbr 60'); // PFA
      applyAction(table, 'p2 cc'); // SB call
      applyAction(table, 'p3 cc'); // BB call

      // Flop: action starts with the first active player to left of the button → SB (p2), then BB (p3), then p1 last.
      applyAction(table, 'd db Ac7c2d');

      // SB must act before BB can "lead"; SB checks to maintain proper order.
      applyAction(table, 'p2 cc'); // SB check

      // BB now leads into the PFA before the PFA has a chance to act → this is a DONK bet.
      applyAction(table, 'p3 cbr 100'); // BB donk

      // Assertions:
      // 1) PFA (p1) did NOT get a c-bet opportunity on the flop because someone else bet first.
      expect(Stats.forPlayerStreet(table, 0, 'flop')).toMatchObject({
        cbetIpOpportunities: 0,
        cbetOopOpportunities: 0,
      });

      // 2) BB's lead is classified as a donk bet (OOP vs PFA, acting before PFA).
      expect(Stats.forPlayerStreet(table, 2, 'flop')).toMatchObject({
        donkBetOpportunities: 1,
        donkBetAttempts: 1,
      });

      // Optional: continue the hand to record defender stats
      applyAction(table, 'p1 f'); // PFA folds to donk
      expect(Stats.forPlayerStreet(table, 0, 'flop')).toMatchObject({
        donkBetChallenges: 1,
        donkBetFolds: 1,
        investments: 0,
      });
      applyAction(table, 'p2 f'); // SB folds, hand ends
    });

    it('34) should not offer a delayed c-bet opportunity on the river', () => {
      // Setup: Flop and turn are checked through by the PFA.
      // Action: On the river, the action is on the PFA.
      // Assert: The PFA has delayedCbet*Opportunities:0.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'p1 cbr 60');
      applyAction(table, 'p2 cc');
      applyAction(table, 'd db 2c3c4d');
      // Flop: BB is OOP and acts first.
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cc');
      applyAction(table, 'd db 5h');
      // Turn: BB is OOP and acts first.
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cc');
      applyAction(table, 'd db 6h');
      // River: BB is OOP and acts first.

      const btnStats = Stats.forPlayerStreet(table, 1, 'river');
      expect(btnStats).toMatchObject({
        delayedCbetIpOpportunities: 0,
        delayedCbetOopOpportunities: 0,
        investments: 0,
      });
    });

    it('35) should correctly classify shoves under the open shove vs re-raise shove taxonomy', () => {
      // Setup Hand A: First player to act preflop shoves.
      // Assert A: This is an openShoveAttempt and a shoveAttempt.
      const tableOpen = Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 10, 20],
        startingStacks: [1000, 1000, 1000],
      });
      applyAction(tableOpen, 'd dh p1 2h2c');
      applyAction(tableOpen, 'd dh p2 3h3c');
      applyAction(tableOpen, 'd dh p3 4h4c');
      applyAction(tableOpen, 'p1 cbr 1000');

      const btnStatsOpen = Stats.forPlayerStreet(tableOpen, 0, 'preflop');
      expect(btnStatsOpen).toMatchObject({
        openShoveIpAttempts: 1,
        shoveIpAttempts: 1,
        investments: 1000,
      }); // It's an OPEN shove, also a shove

      // Setup Hand B: A player open-raises, another player re-raises all-in.
      // Assert B: This is a threeBet*Attempt and a shove*Attempt, but NOT an openShove*Attempt.
      const table3b = Game({
        ...sampleGame,
        players: ['BTN', 'SB', 'BB'],
        blindsOrStraddles: [0, 10, 20],
        startingStacks: [1000, 1000, 1000],
      });
      applyAction(table3b, 'd dh p1 2h2c');
      applyAction(table3b, 'd dh p2 3h3c');
      applyAction(table3b, 'd dh p3 4h4c');
      applyAction(table3b, 'p1 cbr 60');
      applyAction(table3b, 'p2 cbr 1000');

      const sbStats3b = Stats.forPlayerStreet(table3b, 1, 'preflop');
      expect(sbStats3b).toMatchObject({
        threeBetOopAttempts: 1,
        shoveOopAttempts: 1,
        openShoveOopAttempts: 0,
        investments: 1000,
      });
    });
  });

  describe('Double and Triple Barrel', () => {
    it('should track double and triple barrel challenges, folds, and takedowns', () => {
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

      // Flop: BB checks, BTN c-bets IP, BB calls.
      applyAction(table, 'd db 2c3c4d');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 100');
      applyAction(table, 'p2 cc');

      // Turn: BB checks, BTN double barrels, BB calls.
      applyAction(table, 'd db 5h');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 200'); // Double barrel

      const btnTurnStats = Stats.forPlayerStreet(table, 0, 'turn');
      expect(btnTurnStats).toMatchObject({
        doubleBarrelIpOpportunities: 1,
        doubleBarrelIpAttempts: 1,
      });

      const bbTurnStatsBeforeCall = Stats.forPlayerStreet(table, 1, 'turn');
      expect(bbTurnStatsBeforeCall).toMatchObject({
        doubleBarrelOopChallenges: 1, // This will fail before the fix
        doubleBarrelOopContinues: 0,
        doubleBarrelIpFolds: 0,
      });

      applyAction(table, 'p2 cc');
      const bbTurnStatsAfterCall = Stats.forPlayerStreet(table, 1, 'turn');
      expect(bbTurnStatsAfterCall).toMatchObject({
        doubleBarrelOopChallenges: 1,
        doubleBarrelOopContinues: 1, // This will fail before the fix
        doubleBarrelIpFolds: 0,
      });

      // River: BB checks, BTN triple barrels, BB folds.
      applyAction(table, 'd db 6h');
      applyAction(table, 'p2 cc');
      applyAction(table, 'p1 cbr 400'); // Triple barrel

      const btnRiverStats = Stats.forPlayerStreet(table, 0, 'river');
      expect(btnRiverStats).toMatchObject({
        tripleBarrelIpOpportunities: 1,
        tripleBarrelIpAttempts: 1,
      });

      const bbRiverStatsBeforeFold = Stats.forPlayerStreet(table, 1, 'river');
      expect(bbRiverStatsBeforeFold).toMatchObject({
        tripleBarrelOopChallenges: 1, // This will fail before the fix
        tripleBarrelOopContinues: 0,
        tripleBarrelIpFolds: 0,
      });

      applyAction(table, 'p2 f');
      const bbRiverStatsAfterFold = Stats.forPlayerStreet(table, 1, 'river');
      expect(bbRiverStatsAfterFold).toMatchObject({
        tripleBarrelOopChallenges: 1,
        tripleBarrelOopContinues: 0,
        tripleBarrelOopFolds: 1, // This will fail before the fix
      });

      // Check takedown
      const btnRiverStatsAfterTakedown = Stats.forPlayerStreet(table, 0, 'river');
      expect(btnRiverStatsAfterTakedown).toMatchObject({
        tripleBarrelIpTakedowns: 1, // This will fail before the fix
      });
    });
  });
});
