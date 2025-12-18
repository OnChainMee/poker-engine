import { describe, expect, it } from 'vitest';
import { getActionPlayerIndex, getActionType } from '../../../game/position';
import * as Poker from '../../../index';

/**
 * Edge Cases Tests for Hand.advance with Player State Management
 *
 * Tests focus on player joining, pausing, and state transitions during game flow
 * Uses Hand methods (joinHand, pauseHand, quitHand, etc.) and merge for state changes
 */

beforeEach(() => {
  vi.setSystemTime(new Date(1715616000000));
});

afterEach(() => {
  vi.useRealTimers();
});
describe('Hand.advance - Player State Edge Cases', () => {
  describe('Empty table scenarios', () => {
    it('should not advance when table is completely empty', () => {
      // SCENARIO: Empty table with no players
      // INPUT: Hand with no players
      // EXPECTED: advance() returns unchanged hand (waits for players)
      const emptyHand = Poker.Hand({
        variant: 'NT',
        players: [],
        startingStacks: [],
        blindsOrStraddles: [],
        antes: [],
        minBet: 20,
        actions: [],
        seed: 12345,
      });

      const advanced = Poker.Hand.advance(emptyHand);

      // Should return unchanged - waiting for players
      expect(advanced.actions).toHaveLength(0);
      expect(advanced.players).toHaveLength(0);
      expect(Poker.Hand.isEqual(advanced, emptyHand)).toBe(true);
    });

    it('should wait when single player joins empty table', () => {
      // SCENARIO: First player joins empty table
      // INPUT: Empty hand -> player joins with joinHand
      // EXPECTED: Player is inactive with intent 2, hand waits for second player
      const emptyHand = Poker.Hand({
        variant: 'NT',
        players: [],
        startingStacks: [],
        blindsOrStraddles: [],
        antes: [],
        minBet: 20,
        actions: [],
        seed: 12345,
      });

      // Alice joins the table
      const withAlice = Poker.Hand.join(emptyHand, {
        playerName: 'Alice',
        buyIn: 1000,
      });

      // Merge to simulate server processing
      const serverHand = Poker.Hand.merge(emptyHand, withAlice, true);

      const advanced = Poker.Hand.advance(serverHand);

      // Should have Alice but not start game
      expect(advanced.players).toEqual(['Alice']);
      expect(advanced._intents).toEqual([0]); // Ready to play
      expect(advanced._inactive).toEqual([2]); // But inactive (new player)
      expect(advanced.actions).toHaveLength(0); // No actions yet
    });
  });

  describe('Single player scenarios', () => {
    it('should start game when second player joins', () => {
      // SCENARIO: Second player joins table with one waiting player
      // INPUT: 1 player waiting -> second player joins
      // EXPECTED: Both players activate and game starts

      // Start with one player
      const onePlayerHand = Poker.Hand({
        variant: 'NT',
        players: ['Alice'],
        startingStacks: [1000],
        blindsOrStraddles: [0], // Alice inactive = 0 blind
        antes: [0],
        minBet: 20,
        _inactive: [1],
        _intents: [0], // Ready to play
        _deadBlinds: [0],
        actions: [],
        seed: 12345,
      });

      // Bob joins
      const withBob = Poker.Hand.join(onePlayerHand, {
        playerName: 'Bob',
        buyIn: 1000,
      });

      // Server merges the hands
      const mergedHand = Poker.Hand.merge(onePlayerHand, withBob, true);

      // Advance should activate both players and start
      const advanced = Poker.Hand.advance(mergedHand);

      // Both should be active now
      expect(advanced._inactive).toEqual([0, 0]);
      expect(advanced._deadBlinds).toEqual([0, 0]);
      expect(advanced.actions.length).toBeGreaterThan(0); // Game started
      expect(getActionType(advanced.actions[0])).toBe('dh'); // Dealing hole cards
    });

    it('should handle player with waitForBB intent when second joins', () => {
      // SCENARIO: Player waiting for BB, second player joins
      // INPUT: Alice with waitForBB intent, Bob joins
      // EXPECTED: Both become active and start playing

      const aliceWaiting = Poker.Hand({
        variant: 'NT',
        players: ['Alice'],
        startingStacks: [1000],
        blindsOrStraddles: [0], // Alice inactive = 0 blind
        antes: [0],
        minBet: 20,
        _inactive: [1],
        _intents: [1], // waitForBB
        _deadBlinds: [0],
        actions: [],
        seed: 12345,
      });

      // Set Alice to resume (intent 0) first
      const aliceResumed = Poker.Hand.resume(aliceWaiting, 'Alice');

      // Bob joins
      const withBob = Poker.Hand.join(aliceResumed, {
        playerName: 'Bob',
        buyIn: 1000,
      });

      const mergedHand = Poker.Hand.merge(aliceResumed, withBob, true);
      const advanced = Poker.Hand.advance(mergedHand);

      // Both should be active
      expect(advanced._inactive).toEqual([0, 0]);
      expect(advanced.actions.length).toBeGreaterThan(0);
    });
  });

  describe('Player joining mid-game', () => {
    it('should keep new player inactive when joining active game', () => {
      // SCENARIO: New player joins during active hand
      // INPUT: Active 2-player game, third player joins
      // EXPECTED: New player stays inactive without dead blinds (will pay in next hand)

      const activeGame = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [10, 20],
        antes: [0, 0],
        minBet: 20,
        _inactive: [0, 0],
        _intents: [0, 0],
        _deadBlinds: [0, 0],
        actions: ['d dh p1 AsKs', 'd dh p2 7c7d', 'p1 cc'],
        seed: 12345,
      });

      // Charlie joins
      const withCharlie = Poker.Hand.join(activeGame, {
        playerName: 'Charlie',
        buyIn: 1000,
      });

      // Server processes the join
      const mergedHand = Poker.Hand.merge(activeGame, withCharlie, true);

      // Advance the game
      const advanced = Poker.Hand.advance(mergedHand);

      // Charlie should remain inactive
      expect(advanced.players).toContain('Charlie');
      expect(advanced._intents?.[2]).toBe(0);
      expect(advanced._inactive?.[2]).toBe(2); // Charlie is inactive
      expect(advanced._deadBlinds?.[2]).toBe(0); // Will have to pay dead blinds next hand

      // Game should NOT continue automatically - waiting for Bob's action (p2)
      // After 'p1 cc', it's Bob's turn to act, so advance doesn't add any actions
      expect(advanced.actions).toEqual(activeGame.actions);
    });

    it('should handle multiple players joining simultaneously', () => {
      // SCENARIO: Multiple players join at once
      // INPUT: Active 2-player game, 2 new players join
      // EXPECTED: New players inactive, game continues

      const activeGame = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [10, 20],
        antes: [0, 0],
        minBet: 20,
        _inactive: [0, 0],
        _intents: [0, 0],
        _deadBlinds: [0, 0],
        actions: ['d dh p1 AsKs', 'd dh p2 7c7d'],
        seed: 12345,
      });

      // Charlie joins
      const withCharlie = Poker.Hand.join(activeGame, {
        playerName: 'Charlie',
        buyIn: 1500,
      });

      // David joins
      const withDavid = Poker.Hand.join(withCharlie, {
        playerName: 'David',
        buyIn: 2000,
      });

      // Server merges both joins
      const merged1 = Poker.Hand.merge(activeGame, withCharlie, true);
      const merged2 = Poker.Hand.merge(merged1, withDavid, true);

      const advanced = Poker.Hand.advance(merged2);

      // Both new players should be inactive
      expect(advanced.players).toHaveLength(4);
      expect(advanced._inactive?.[2]).toBe(2); // Charlie inactive
      expect(advanced._inactive?.[3]).toBe(2); // David inactive
      expect(advanced._deadBlinds?.[2]).toBe(0);
      expect(advanced._deadBlinds?.[3]).toBe(0);
    });
  });

  describe('Player pausing during game', () => {
    it('should continue the hand when a player pauses in a 2-player game', () => {
      // SCENARIO: 2-player game, one pauses mid-hand post-flop
      // INPUT: Active game post-flop, Bob pauses
      // EXPECTED: Hand continues normally, Bob is not auto-folded and can finish the hand.

      const activeGame = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob'],
        startingStacks: [990, 980],
        blindsOrStraddles: [10, 20],
        antes: [0, 0],
        minBet: 20,
        _inactive: [0, 0],
        _intents: [0, 0],
        _deadBlinds: [0, 0],
        actions: ['d dh p1 AsKs', 'd dh p2 7c7d', 'p1 cc 10', 'p2 cc', 'd db 2c3c4c'],
        seed: 12345,
        author: undefined,
      });

      // Post-flop, it's Bob's turn (BB). Bob decides to pause for the next hand. Bob will play this hand to the end.
      const bobPaused = Poker.Hand.pause(activeGame, 'Bob');
      const mergedHand = Poker.Hand.merge(activeGame, bobPaused, false);
      expect(mergedHand._intents?.[1]).toBe(2); // Verify Bob's intent is to pause
      // Bob checks.
      const bobChecks = Poker.Hand.applyAction(
        mergedHand,
        Poker.Command.check(Poker.Game(mergedHand), 'Bob')
      );

      // The hand should not be complete, it's now Bob's turn.
      expect(Poker.Hand.isComplete(bobChecks)).toBe(false);

      // Bob, despite having paused, can still check.
      const aliceChecks = Poker.Hand.applyAction(
        bobChecks,
        Poker.Command.check(Poker.Game(bobChecks), 'Alice')
      );

      // Betting round is done. Hand is still in progress.
      expect(Poker.Hand.isComplete(aliceChecks)).toBe(false);

      // Advance the game to deal the turn.
      const afterTurn = Poker.Hand.advance(aliceChecks);
      expect(Poker.Hand.isComplete(afterTurn)).toBe(false);

      // Play it out to showdown.
      const aliceChecksTurn = Poker.Hand.applyAction(
        afterTurn,
        Poker.Command.check(Poker.Game(afterTurn), 'Bob')
      );
      const bobChecksTurn = Poker.Hand.applyAction(
        aliceChecksTurn,
        Poker.Command.check(Poker.Game(aliceChecksTurn), 'Alice')
      );
      const afterRiver = Poker.Hand.advance(bobChecksTurn);

      const aliceChecksRiver = Poker.Hand.applyAction(
        afterRiver,
        Poker.Command.check(Poker.Game(afterRiver), 'Bob')
      );
      const bobChecksRiver = Poker.Hand.applyAction(
        aliceChecksRiver,
        Poker.Command.check(Poker.Game(aliceChecksRiver), 'Alice')
      );

      // Advance to showdown.
      const finalHand = Poker.Hand.advance(bobChecksRiver);

      // Now the hand should be complete.
      expect(Poker.Hand.isComplete(finalHand)).toBe(true);
      expect(finalHand.finishingStacks).toBeDefined();
      // Bob's intent to pause should persist for the next hand.
      expect(finalHand._intents?.[1]).toBe(2);
    });

    it('should continue when player pauses in 3+ player game', () => {
      // SCENARIO: 3-player game, one pauses
      // INPUT: Active 3-player game, Charlie pauses
      // EXPECTED: Game continues with all 3 players for the current hand

      const threePlayerGame = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20],
        antes: [0, 0, 0],
        minBet: 20,
        _inactive: [0, 0, 0],
        _intents: [0, 0, 0],
        _deadBlinds: [0, 0, 0],
        actions: ['d dh p1 AsKs', 'd dh p2 7c7d', 'd dh p3 QhQd', 'p1 cc', 'p2 cc', 'p3 cc'],
        seed: 12345,
        author: undefined,
      });

      // Charlie pauses
      const charliePaused = Poker.Hand.pause(threePlayerGame, 'Charlie');
      const mergedHand = Poker.Hand.merge(threePlayerGame, charliePaused, false);
      expect(mergedHand._intents?.[2]).toBe(2);

      // First advance - dealer should deal flop
      let advanced = Poker.Hand.advance(mergedHand);
      expect(advanced.actions.length).toBeGreaterThan(threePlayerGame.actions.length);

      // After flop, it's Bob's turn first (p2, small blind) - add check
      const bobCheck = Poker.Command.check(Poker.Game(advanced), 'Bob');
      advanced = Poker.Hand.applyAction(advanced, bobCheck);

      // Now it's Charlie's turn (p3, big blind). He should be able to act.
      const charlieCheck = Poker.Command.check(Poker.Game(advanced), 'Charlie');
      advanced = Poker.Hand.applyAction(advanced, charlieCheck);

      // Charlie should not have been folded.
      const charlieFold = advanced.actions.find(
        action => getActionType(action) === 'f' && getActionPlayerIndex(action) === 2
      );
      expect(charlieFold).toBeUndefined();
      expect(advanced._inactive?.[2]).toBe(0);

      // Now it's Alice's turn (p1) - add check
      const aliceCheck = Poker.Command.check(Poker.Game(advanced), 'Alice');
      advanced = Poker.Hand.applyAction(advanced, aliceCheck);

      // Advance for turn card
      advanced = Poker.Hand.advance(advanced);

      // Bob checks turn
      const bobCheckTurn = Poker.Command.check(Poker.Game(advanced), 'Bob');
      advanced = Poker.Hand.applyAction(advanced, bobCheckTurn);

      // Charlie checks turn
      const charlieCheckTurn = Poker.Command.check(Poker.Game(advanced), 'Charlie');
      advanced = Poker.Hand.applyAction(advanced, charlieCheckTurn);

      // Alice checks turn
      const aliceCheckTurn = Poker.Command.check(Poker.Game(advanced), 'Alice');
      advanced = Poker.Hand.applyAction(advanced, aliceCheckTurn);

      // Advance for river card
      advanced = Poker.Hand.advance(advanced);

      // Bob checks river
      const bobCheckRiver = Poker.Command.check(Poker.Game(advanced), 'Bob');
      advanced = Poker.Hand.applyAction(advanced, bobCheckRiver);

      // Charlie checks river
      const charlieCheckRiver = Poker.Command.check(Poker.Game(advanced), 'Charlie');
      advanced = Poker.Hand.applyAction(advanced, charlieCheckRiver);

      // Alice checks river
      const aliceCheckRiver = Poker.Command.check(Poker.Game(advanced), 'Alice');
      advanced = Poker.Hand.applyAction(advanced, aliceCheckRiver);

      // Advance to showdown
      advanced = Poker.Hand.advance(advanced);

      // Game should complete with Alice and Bob
      expect(Poker.Hand.isComplete(advanced)).toBe(true);
    });
  });

  describe('Player quitting scenarios', () => {
    it('should handle player quitting mid-game', () => {
      // SCENARIO: Player quits during hand
      // INPUT: 3-player game, one quits
      // EXPECTED: Player marked with intent 3, game continues

      const activeGame = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20],
        antes: [0, 0, 0],
        minBet: 20,
        _inactive: [0, 0, 0],
        _intents: [0, 0, 0],
        _deadBlinds: [0, 0, 0],
        actions: ['d dh p1 AsKs', 'd dh p2 7c7d', 'd dh p3 QhQd'],
        seed: 12345,
        author: undefined,
      });

      // Bob quits
      const bobQuit = Poker.Hand.quit(activeGame, 'Bob');

      // Server processes
      const mergedHand = Poker.Hand.merge(activeGame, bobQuit, false);

      // Advance
      const advanced = Poker.Hand.advance(mergedHand);

      // Bob should have quit intent
      expect(advanced._intents?.[1]).toBe(3);

      // Game should NOT continue automatically - waiting for Alice's action (p1)
      // After dealing hole cards, it's Alice's turn to act, advance doesn't add actions
      expect(advanced.actions).toEqual(activeGame.actions);
      expect(advanced._inactive?.[1]).toBe(0); // Bob stays active until his turn
    });

    it('should handle multiple players quitting leaving one', async () => {
      // SCENARIO: Multiple players quit leaving one
      // INPUT: 3-player game, 1 quit, 1 paused(from the next hand)
      // EXPECTED: Hand is finished using timeout for both players (quit intent doesn't auto-fold)

      const activeGame = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20],
        antes: [0, 0, 0],
        minBet: 20,
        timeLimit: 3,
        _inactive: [0, 0, 0],
        _intents: [0, 0, 0],
        _deadBlinds: [0, 0, 0],
        actions: [
          'd dh p1 AsKs #1715616000000',
          'd dh p2 7c7d #1715616000000',
          'd dh p3 QhQd #1715616000000',
        ],
        seed: 12345,
        author: undefined,
      });

      // Bob quits
      const bobQuit = Poker.Hand.quit(activeGame, 'Bob');
      const merged1 = Poker.Hand.merge(activeGame, bobQuit, false);

      // Charlie pauses
      const charliePaused = Poker.Hand.pause(merged1, 'Charlie');
      const merged2 = Poker.Hand.merge(merged1, charliePaused, false);

      // Advance should not finish, waiting for Charlie's action
      const advanced = Poker.Hand.advance(merged2);

      // Should not be complete, allowing Charlie to play started game to the end
      expect(Poker.Hand.isComplete(advanced)).toBe(false);

      // Set system time to ensure Alice's call gets a consistent timestamp
      vi.setSystemTime(new Date(1715616001000)); // 1 second after deal
      // Alice must call (can't check preflop with BB=20)
      const aliceCalls = Poker.Hand.applyAction(
        { ...advanced, author: 'Alice' },
        Poker.Command.call(Poker.Game(advanced), 'Alice')
      );
      const merged3 = Poker.Hand.merge(advanced, aliceCalls, false);

      // Set time far into future to trigger Bob's timeout
      vi.setSystemTime(new Date(1717616000000));

      // Bob folds due to timeout (not auto-fold - quit intent doesn't auto-fold)
      const advanced2 = Poker.Hand.advance(merged3);

      // Advance time again for Charlie's timeout (time must pass since Bob's fold)
      vi.setSystemTime(new Date(1718616000000));

      // Charlie folds due to timeout
      const advanced3 = Poker.Hand.advance(advanced2);
      expect(Poker.Hand.isComplete(advanced3)).toBe(true);
      expect(advanced3.winnings).toEqual([50, 0, 0]);
    });
  });

  describe('Complex state transitions', () => {
    it('should handle player resuming after pause', () => {
      // SCENARIO: Paused player resumes
      // INPUT: Player was paused, sets intent to resume
      // EXPECTED: Player stays inactive until next hand

      const gameWithPaused = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [20, 10, 0], // Alice=BB, Bob=SB, Charlie=0 (inactive)
        antes: [0, 0, 0],
        minBet: 20,
        _inactive: [0, 0, 1], // Charlie paused
        _intents: [0, 0, 2], // Charlie has pause intent
        _deadBlinds: [0, 0, 20],
        actions: ['d dh p1 AsKs', 'd dh p2 7c7d'],
        seed: 12345,
        author: undefined,
      });

      // Charlie resumes
      const charlieResumed = Poker.Hand.resume(gameWithPaused, 'Charlie');
      const merged = Poker.Hand.merge(gameWithPaused, charlieResumed, false);

      const advanced = Poker.Hand.advance(merged);

      // Charlie should have resume intent but stay inactive
      expect(advanced._intents?.[2]).toBe(0); // Intent to resume
      expect(advanced._inactive?.[2]).toBe(1); // But still inactive this hand
      expect(advanced._deadBlinds?.[2]).toBe(20); // Dead blinds preserved
    });

    it('should handle waitForBB correctly', () => {
      // SCENARIO: Player sets waitForBB intent
      // INPUT: Active player wants to wait for BB
      // EXPECTED: Player can still act (no auto-fold), waitForBB only affects next hand

      const activeGame = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20],
        antes: [0, 0, 0],
        minBet: 20,
        _inactive: [0, 0, 0],
        _intents: [0, 0, 0],
        _deadBlinds: [0, 0, 0],
        actions: [],
        seed: 12345,
        author: undefined,
      });

      // Alice wants to wait for BB
      const aliceWaitBB = Poker.Hand.waitForBB(activeGame, 'Alice');
      let merged = Poker.Hand.merge(activeGame, aliceWaitBB, false);

      // Should have the intent set
      expect(merged._intents?.[0]).toBe(1);
      expect(merged._inactive?.[0]).toBe(0);

      // Advance deals cards, Alice is next to act (no auto-fold with new behavior)
      let advanced = Poker.Hand.advance(merged);
      const game = Poker.Game(advanced);
      expect(game.nextPlayerIndex).toBe(0); // Alice is next to act

      // Alice folds explicitly (not auto-fold - she can still act)
      const aliceFolds = Poker.Hand.applyAction(
        { ...advanced, author: 'Alice' },
        Poker.Command.fold(game, 'Alice')
      );
      merged = Poker.Hand.merge(advanced, aliceFolds, false);
      advanced = Poker.Hand.advance(merged);

      // Bob checks (calls 10 more to match BB)
      const bobChecks = Poker.Hand.applyAction(
        { ...advanced, author: 'Bob' },
        Poker.Command.check(Poker.Game(advanced), 'Bob')
      );
      merged = Poker.Hand.merge(advanced, bobChecks, false);
      advanced = Poker.Hand.advance(merged);

      // Charlie folds
      const charlieFolds = Poker.Hand.applyAction(
        { ...advanced, author: 'Charlie' },
        Poker.Command.fold(Poker.Game(advanced), 'Charlie')
      );

      merged = Poker.Hand.merge(advanced, charlieFolds, false);
      advanced = Poker.Hand.advance(merged);
      expect(Poker.Hand.isComplete(advanced)).toBe(true);
      expect(advanced.winnings).toEqual([0, 40, 0]);
    });
  });

  describe('Dead blinds scenarios', () => {
    it('should when player joins he have no dead blinds', () => {
      // SCENARIO: Player joins active table
      // INPUT: 2-player game, new player joins
      // EXPECTED: New player have no dead blinds in this hand

      const activeGame = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [10, 20],
        antes: [0, 0],
        minBet: 20,
        _inactive: [0, 0],
        _intents: [0, 0],
        _deadBlinds: [0, 0],
        actions: ['d dh p1 AsKs', 'd dh p2 7c7d'],
        seed: 12345,
      });

      // Charlie joins
      const withCharlie = Poker.Hand.join(activeGame, {
        playerName: 'Charlie',
        buyIn: 1000,
      });

      const merged = Poker.Hand.merge(activeGame, withCharlie, true);

      // Charlie should have dead blinds, but only in the next hand
      expect(merged._deadBlinds?.[2]).toBe(0);
      expect(merged._inactive?.[2]).toBe(2);
    });

    it('should preserve dead blinds for inactive players', () => {
      // SCENARIO: Inactive player with dead blinds
      // INPUT: Player inactive with dead blinds
      // EXPECTED: Dead blinds preserved through advance

      const gameWithInactive = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [20, 10, 0], // Alice=BB (shifted), Bob=SB, Charlie=0 (inactive)
        antes: [0, 0, 0],
        minBet: 20,
        _inactive: [0, 0, 1],
        _intents: [0, 0, 2], // Charlie paused
        _deadBlinds: [0, 0, 30],
        actions: ['d dh p1 AsKs', 'd dh p2 7c7d'],
        seed: 12345,
      });

      const advanced = Poker.Hand.advance(gameWithInactive);

      // Dead blinds should be preserved
      expect(advanced._deadBlinds?.[2]).toBe(30);
      expect(advanced._inactive?.[2]).toBe(1);
    });
  });

  describe('Edge cases with empty and single player', () => {
    it('should activate players when enough join with intents to play', () => {
      // SCENARIO: Multiple just joined players become ready to play
      // INPUT: 2 just joined players ready to play, 1 waiting for BB
      // EXPECTED: 2 players are being activated and game starts, 1 player stays inactive

      const allInactive = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 0, 0], // All inactive = 0 blinds
        antes: [0, 0, 0],
        minBet: 20,
        _inactive: [2, 2, 2],
        _intents: [0, 0, 1], // Alice and Bob ready to play, Charlie waiting for BB
        _deadBlinds: [20, 10, 0],
        actions: [],
        seed: 12345,
      });

      const advanced = Poker.Hand.advance(allInactive);

      // Alice and Bob activate, Charlie stays inactive (waitForBB)
      expect(advanced._inactive).toEqual([0, 0, 2]); // Charlie stays inactive
      expect(advanced._deadBlinds).toEqual([0, 0, 0]); // Dead blinds cleared
      expect(advanced.actions.length).toBeGreaterThan(0); // Game starts with 2 players
    });

    it('should activate waitForBB player when minimum players available', () => {
      // SCENARIO: Minimum players for game with waitForBB intent
      // INPUT: 3 inactive players - Alice ready (intent 0), Bob waitForBB (intent 1), Charlie paused (intent 2)
      // EXPECTED: Alice and Bob activate (Bob despite waitForBB since minimum players met), Charlie stays inactive

      const notEnoughReady = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 0, 0], // All inactive = 0 blinds
        antes: [0, 0, 0],
        minBet: 20,
        _inactive: [1, 1, 1],
        _intents: [0, 1, 2], // Only Alice ready
        _deadBlinds: [20, 10, 0],
        actions: [],
        seed: 12345,
      });

      const advanced = Poker.Hand.advance(notEnoughReady);

      // Alice and Bob should activate (Bob activates despite waitForBB intent to meet minimum)
      expect(advanced._inactive).toEqual([0, 0, 1]); // Charlie stays inactive
      expect(advanced._intents).toEqual([0, 0, 2]); // Intents for Charlie preserved
      expect(advanced.actions).toHaveLength(2); // Game starts with hole cards dealt
    });
  });
});

describe('Hand.advance simplification', () => {
  describe('quit should NOT auto-fold', () => {
    it('should NOT auto-fold when player quits during their turn', () => {
      // SCENARIO: Player quits during active game, it's their turn
      // INPUT: Alice (SB) and Bob (BB) playing, preflop, Alice's turn, Alice quits
      // EXPECTED: advance() should NOT auto-fold for Alice - she continues playing
      //           (fold should only happen on timeout, not on quit intent)

      // Setup: 2-player game, preflop, Alice's turn to act
      let hand = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [10, 20],
        antes: [0, 0],
        minBet: 20,
        actions: [],
        _inactive: [0, 0],
        _intents: [0, 0],
        _deadBlinds: [0, 0],
        seed: 12345,
      });

      // Start the game - deal cards
      hand = Poker.Hand.advance(hand);
      expect(hand.actions.length).toBeGreaterThan(0); // Cards dealt

      // Verify it's Alice's turn (SB acts first preflop in heads-up)
      let game = Poker.Game(hand);
      expect(game.nextPlayerIndex).toBe(0); // Alice's turn

      // Alice quits (sets intent to 3)
      const aliceQuit = Poker.Hand.quit({ ...hand, author: 'Alice' });
      hand = Poker.Hand.merge(hand, aliceQuit, false);
      expect(hand._intents).toEqual([3, 0]); // Alice wants to quit

      // Count actions before advance
      const actionsBefore = hand.actions.length;

      // advance() should NOT auto-fold for Alice
      hand = Poker.Hand.advance(hand);

      // Actions should be unchanged - no auto-fold added
      expect(hand.actions.length).toBe(actionsBefore);

      // Game should still be waiting for Alice's action
      game = Poker.Game(hand);
      expect(game.nextPlayerIndex).toBe(0); // Still Alice's turn
      expect(Poker.Hand.isComplete(hand)).toBe(false); // Game not complete
    });

    it('should NOT auto-fold when player with quit intent is not next to act', () => {
      // SCENARIO: Alice quits, but it's Bob's turn
      // INPUT: Alice and Bob playing, Alice already called, Bob's turn, Alice quits
      // EXPECTED: advance() should NOT interfere - Bob's turn continues

      let hand = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [10, 20],
        antes: [0, 0],
        minBet: 20,
        actions: [],
        _inactive: [0, 0],
        _intents: [0, 0],
        _deadBlinds: [0, 0],
        seed: 12345,
      });

      // Start game
      hand = Poker.Hand.advance(hand);

      // Alice calls (completes SB to BB)
      let game = Poker.Game(hand);
      const aliceCall = Poker.Command.call(game, 0);
      hand = Poker.Hand.applyAction(hand, aliceCall);

      // Now it's Bob's turn
      game = Poker.Game(hand);
      expect(game.nextPlayerIndex).toBe(1); // Bob's turn

      // Alice quits (even though it's not her turn)
      const aliceQuit = Poker.Hand.quit({ ...hand, author: 'Alice' });
      hand = Poker.Hand.merge(hand, aliceQuit, false);
      expect(hand._intents).toEqual([3, 0]); // Alice wants to quit

      const actionsBefore = hand.actions.length;

      // advance() should not add any actions
      hand = Poker.Hand.advance(hand);

      // No auto-fold should be added
      expect(hand.actions.length).toBe(actionsBefore);

      // Still Bob's turn
      game = Poker.Game(hand);
      expect(game.nextPlayerIndex).toBe(1);
    });
  });

  describe('quit should NOT auto-complete game', () => {
    it('should NOT auto-complete when one player has quit intent', () => {
      // SCENARIO: Alice quits, Bob is only "continuing" player
      // INPUT: Alice and Bob playing, Alice quits (intent=3), Bob's turn
      // EXPECTED: Game should NOT auto-complete - Bob should act normally

      let hand = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [10, 20],
        antes: [0, 0],
        minBet: 20,
        actions: [],
        _inactive: [0, 0],
        _intents: [0, 0],
        _deadBlinds: [0, 0],
        seed: 12345,
      });

      // Start game
      hand = Poker.Hand.advance(hand);

      // Alice calls
      let game = Poker.Game(hand);
      const aliceCall = Poker.Command.call(game, 0);
      hand = Poker.Hand.applyAction(hand, aliceCall);

      // Alice quits
      const aliceQuit = Poker.Hand.quit({ ...hand, author: 'Alice' });
      hand = Poker.Hand.merge(hand, aliceQuit, false);
      expect(hand._intents).toEqual([3, 0]); // Alice wants to quit

      // Now Bob is the only "continuing" player (Alice has intent=3)
      // But game should NOT auto-complete

      const actionsBefore = hand.actions.length;
      hand = Poker.Hand.advance(hand);

      // Game should NOT be auto-completed
      expect(Poker.Hand.isComplete(hand)).toBe(false);

      // Bob should still need to act
      game = Poker.Game(hand);
      expect(game.nextPlayerIndex).toBe(1); // Bob's turn

      // No auto-actions should be added
      expect(hand.actions.length).toBe(actionsBefore);
    });
  });
});
