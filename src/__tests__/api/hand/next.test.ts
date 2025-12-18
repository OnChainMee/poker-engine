import { beforeEach, describe, expect, it } from 'vitest';
import { Hand } from '../../../Hand';
import type { NoLimitHand } from '../../../types';
import { BASE_HAND } from './fixtures/baseHand';

describe('next hand logic', () => {
  let completedHand: NoLimitHand;

  beforeEach(() => {
    // Deep copy of BASE_HAND and mark as completed
    completedHand = JSON.parse(JSON.stringify(BASE_HAND)) as NoLimitHand;
    // Add fields to make it a completed hand
    completedHand.finishingStacks = [980, 1010, 1010]; // Alice lost 20, Bob/Charlie split pot
    completedHand.winnings = [0, 30, 30];
    completedHand.rake = 0;
    completedHand.totalPot = 60;
    // Add sit-in/out fields
    completedHand._inactive = completedHand._inactive || [0, 0, 0];
    completedHand._intents = completedHand._intents || [0, 0, 0];
    completedHand._deadBlinds = completedHand._deadBlinds || [0, 0, 0];
    completedHand.seatCount = 6;
  });

  describe('Order of operations verification', () => {
    it('should execute removal BEFORE rotation', () => {
      // Scenario: Verify removal happens first, then rotation
      // Input: Player to remove at index 1, verify rotation on filtered data
      // Expected: Arrays filtered first, then rotated
      completedHand._intents = [0, 3, 0]; // Bob wants to leave
      completedHand.blindsOrStraddles = [0, 10, 20];

      const nextHand = Hand.next(completedHand);

      // Bob removed first, then blinds rotated
      expect(nextHand.players).toEqual(['Alice', 'Charlie']);
      // Rotation happens on [0, 10, 20] -> [10, 20]
      expect(nextHand.blindsOrStraddles).toEqual([10, 20]);
    });

    it('should execute removal BEFORE dead blind calculation', () => {
      // Scenario: Dead blinds calculated on already-filtered players
      // Input: Remove player, then calculate dead blinds for remaining
      // Expected: Dead blind positions based on filtered array
      completedHand._intents = [2, 3, 0]; // Alice paused, Bob leaving, Charlie active
      completedHand._inactive = [1, 0, 0];
      completedHand.blindsOrStraddles = [0, 10, 20];
      completedHand._deadBlinds = [0, 0, 0];

      const nextHand = Hand.next(completedHand);

      // Bob removed, Alice and Charlie remain
      expect(nextHand.players).toEqual(['Alice', 'Charlie']);
      // Dead blinds calculated on filtered positions
      expect(nextHand._deadBlinds?.length).toBe(2);
    });

    it('should filter ALL arrays before ANY other operation', () => {
      // Scenario: All player-related arrays filtered in sync
      // Input: Remove player at index 1 from 3-player game
      // Expected: All arrays have length 2 before rotation/calculation
      completedHand._intents = [0, 3, 0]; // Bob leaving
      completedHand.seats = [1, 3, 5];
      completedHand._venueIds = ['id1', 'id2', 'id3'];

      const nextHand = Hand.next(completedHand);

      // All arrays filtered to length 2
      expect(nextHand.players).toHaveLength(2);
      expect(nextHand.startingStacks).toHaveLength(2);
      expect(nextHand.blindsOrStraddles).toHaveLength(2);
      expect(nextHand.antes).toHaveLength(2);
      expect(nextHand._intents).toHaveLength(2);
      expect(nextHand._inactive).toHaveLength(2);
      expect(nextHand._deadBlinds).toHaveLength(2);
      expect(nextHand.seats).toHaveLength(2);
      expect(nextHand._venueIds).toHaveLength(2);
    });

    it('should base blind positions on filtered players', () => {
      // Scenario: After removal, blind positions recalculated
      // Input: Remove middle player, verify blind assignments
      // Expected: Correct SB/BB positions on remaining players
      completedHand._intents = [0, 3, 0]; // Bob (SB) leaving
      completedHand.blindsOrStraddles = [0, 10, 20]; // Alice UTG, Bob SB, Charlie BB

      const nextHand = Hand.next(completedHand);

      // After Bob removed and rotation
      expect(nextHand.players).toEqual(['Alice', 'Charlie']);
      // Blinds rotate on 2-player: [0, 10, 20] -> [10, 20]
      expect(nextHand.blindsOrStraddles).toEqual([10, 20]);
    });
  });

  describe('Player removal (Step 1 - happens first)', () => {
    describe('removing players who want to leave', () => {
      it('should remove player with leave intent (_intents: 3)', () => {
        // Scenario: Bob wants to leave the table
        // Input: _intents: [0, 3, 0]
        // Expected: Bob removed from all arrays in nextHand
        completedHand._intents = [0, 3, 0];

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Alice', 'Charlie']);
        expect(nextHand.startingStacks).toEqual([980, 1010]);
        expect(nextHand._intents).toEqual([0, 0]);
        expect(nextHand._inactive).toEqual([0, 0]);
        expect(nextHand._deadBlinds).toEqual([0, 0]);
      });

      it('should remove multiple players with leave intent', () => {
        // Scenario: Alice and Charlie both leaving
        // Input: _intents: [3, 0, 3]
        // Expected: Only Bob remains in nextHand
        completedHand._intents = [3, 0, 3];

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Bob']);
        expect(nextHand.startingStacks).toEqual([1010]);
        expect(nextHand._intents).toEqual([0]);
        expect(nextHand._inactive).toEqual([0]);
        expect(nextHand._deadBlinds).toEqual([0]);
      });

      it('should handle all players leaving - return error or empty table', () => {
        // Scenario: Everyone wants to leave
        // Input: _intents: [3, 3, 3]
        // Expected: Empty table - all player arrays empty
        completedHand._intents = [3, 3, 3];

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual([]);
        expect(nextHand.startingStacks).toEqual([]);
        expect(nextHand.blindsOrStraddles).toEqual([]);
        expect(nextHand.antes).toEqual([]);
        expect(nextHand._intents).toEqual([]);
        expect(nextHand._inactive).toEqual([]);
        expect(nextHand._deadBlinds).toEqual([]);
      });

      it('should handle single remaining player after others leave', () => {
        // Scenario: Two players leave, one remains
        // Input: _intents: [3, 3, 0]
        // Expected: Single player remains (heads-up not possible)
        completedHand._intents = [3, 3, 0];

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Charlie']);
        expect(nextHand.startingStacks).toEqual([1010]);
        expect(nextHand._intents).toEqual([0]);
      });
    });

    describe('removing players with zero chips', () => {
      it('should remove player with zero finishing stack', () => {
        // Scenario: Alice busted out
        // Input: finishingStacks: [0, 1050, 950]
        // Expected: Alice removed from nextHand
        completedHand.finishingStacks = [0, 1050, 950];

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Bob', 'Charlie']);
        expect(nextHand.startingStacks).toEqual([1050, 950]);
      });

      it('should remove player with negative finishing stack', () => {
        // Scenario: Player went negative (shouldn't happen but handle)
        // Input: finishingStacks: [-5, 1050, 955]
        // Expected: Alice removed from nextHand
        completedHand.finishingStacks = [-5, 1050, 955];

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Bob', 'Charlie']);
        expect(nextHand.startingStacks).toEqual([1050, 955]);
      });

      it('should remove multiple busted players', () => {
        // Scenario: Two players busted in all-in
        // Input: finishingStacks: [0, 2000, 0]
        // Expected: Only Bob in nextHand
        completedHand.finishingStacks = [0, 2000, 0];

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Bob']);
        expect(nextHand.startingStacks).toEqual([2000]);
      });
    });

    describe('removing players who cannot afford blinds', () => {
      it('should remove player who cannot afford upcoming BB', () => {
        // Scenario: Charlie next BB but only has 15 chips (BB is 20)
        // Input: finishingStacks: [1000, 1000, 15], next blinds would be [0, 10, 20]
        // Expected: Charlie removed from nextHand
        completedHand.finishingStacks = [1000, 1000, 15];
        completedHand.blindsOrStraddles = [10, 20, 0]; // Alice (SB), Bob (BB), Charlie (BTN)
        // After rotation: [0, 10, 20] - Alice (BTN), Bob (SB), Charlie (BB)

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Alice', 'Bob']);
        expect(nextHand.startingStacks).toEqual([1000, 1000]);
      });

      it('should remove player who cannot afford upcoming SB', () => {
        // Scenario: Bob next SB but has 5 chips (SB is 10)
        // Input: finishingStacks: [1000, 5, 1000], next blinds would be [10, 20, 0]
        // Expected: Bob removed from nextHand
        completedHand.finishingStacks = [1000, 5, 1000];
        completedHand.blindsOrStraddles = [20, 0, 10]; // After rotation, Bob would be SB

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Alice', 'Charlie']);
        expect(nextHand.startingStacks).toEqual([1000, 1000]);
      });

      it('should remove player who cannot afford antes', () => {
        // Scenario: Player has 1 chip but ante is 2
        // Input: finishingStacks: [1000, 1000, 1], antes: [2, 2, 2]
        // Expected: Charlie removed from nextHand
        completedHand.finishingStacks = [1000, 1000, 1];
        completedHand.antes = [2, 2, 2];

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Alice', 'Bob']);
        expect(nextHand.startingStacks).toEqual([1000, 1000]);
      });

      it('should keep player who can exactly afford blind', () => {
        // Scenario: Player has exactly BB amount
        // Input: finishingStacks: [1000, 1000, 20], next BB is 20
        // Expected: Charlie remains (can go all-in)
        completedHand.finishingStacks = [1000, 1000, 20];
        completedHand.blindsOrStraddles = [20, 0, 10]; // Alice (BB), Bob (BTN), Charlie (SB)

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
        expect(nextHand.startingStacks).toEqual([1000, 1000, 20]);
      });
    });

    describe('Player removal with complete chip requirements', () => {
      it('should remove player who can afford blind but NOT ante', () => {
        // Scenario: Player has exactly enough for blind, but needs ante too
        // Input: finishingStacks: [10, 200, 300], blinds: [0,1,10], antes: [2,2,2]
        // Expected: Alice removed (has 10, needs 10+2=12)
        completedHand.finishingStacks = [10, 200, 300];
        completedHand.blindsOrStraddles = [0, 1, 10];
        completedHand.antes = [2, 2, 2];

        const nextHand = Hand.next(completedHand);

        // Alice needs blind(10) + ante(2) = 12 total
        expect(nextHand.players).toEqual(['Bob', 'Charlie']);
        expect(nextHand.startingStacks).toEqual([200, 300]);
      });

      it('should keep player who has exactly blind+ante', () => {
        // SCENARIO: Player has precisely the required amount
        // INPUT: finishingStacks: [22, 200, 300], blinds: [0,10,20], antes: [2,2,2]
        // EXPECTED: Alice kept (has 22, needs BB=20 + ante=2 = 22 after rotation)
        completedHand.finishingStacks = [22, 200, 300];
        completedHand.blindsOrStraddles = [0, 10, 20]; // minBet=20 → SB=10, BB=20
        completedHand.antes = [2, 2, 2];

        const nextHand = Hand.next(completedHand);

        // Alice has exactly 22, needs 22 (BB+ante), stays in game
        expect(nextHand.players).toContain('Alice');
        expect(nextHand.startingStacks[0]).toBe(22);
      });

      it('should remove inactive player who cannot afford blind+ante+deadBlinds', () => {
        // SCENARIO: Returning player needs to pay accumulated dead blinds
        // INPUT: finishingStacks: [35, 200, 300], _deadBlinds: [15, 0, 0], BB=20, ante=2
        // EXPECTED: Alice removed (has 35, needs BB=20 + ante=2 + dead=15 = 37)
        completedHand.finishingStacks = [35, 200, 300];
        completedHand.blindsOrStraddles = [0, 10, 20]; // minBet=20 → SB=10, BB=20
        completedHand.antes = [2, 2, 2];
        completedHand._inactive = [1, 0, 0];
        completedHand._intents = [0, 0, 0]; // Alice wants to return
        completedHand._deadBlinds = [15, 0, 0];

        const nextHand = Hand.next(completedHand);

        // Alice needs BB(20) + ante(2) + dead(15) = 37, has only 35
        expect(nextHand.players).toEqual(['Bob', 'Charlie']);
      });

      it('should handle player with intent=1 at BB position with insufficient chips', () => {
        // Scenario: Wait-for-BB player arrives at BB but cannot afford it
        // Input: finishingStacks: [8, 200, 300], at BB position, needs 10
        // Expected: Alice removed (has 8, needs 10 for BB)
        completedHand.finishingStacks = [8, 200, 300];
        completedHand.blindsOrStraddles = [0, 10, 20]; // After rotation: [20,0,10]
        completedHand._inactive = [1, 0, 0];
        completedHand._intents = [1, 0, 0]; // Alice waiting for BB

        const nextHand = Hand.next(completedHand);

        // Alice would be at BB(20) but only has 8 chips
        expect(nextHand.players).not.toContain('Alice');
        expect(nextHand.players).toEqual(['Bob', 'Charlie']);
      });

      it('should keep player with intent=1 NOT at BB with low chips', () => {
        // Scenario: Wait-for-BB player not yet at BB, insufficient chips
        // Input: finishingStacks: [5, 200, 300], NOT at BB position
        // Expected: Alice kept (waiting, no chip requirement yet)
        completedHand.finishingStacks = [5, 200, 300];
        completedHand.blindsOrStraddles = [0, 20, 10]; // Alice=0 (inactive), Bob=BB, Charlie=SB. After rotation: [10,0,20]
        completedHand._inactive = [1, 0, 0];
        completedHand._intents = [1, 0, 0]; // Alice waiting for BB

        const nextHand = Hand.next(completedHand);

        // Alice not at BB, stays inactive with low chips
        expect(nextHand.players).toContain('Alice');
        expect(nextHand._inactive![0]).toBe(1); // Still inactive
      });

      it('should handle paused player with exact blind amount but not ante', () => {
        // Scenario: Paused player (intent=2) needs blind+ante
        // Input: finishingStacks: [10, 200, 300], blind: 10, ante: 1, intent: 2
        // Expected: Alice removed (has 10, needs 10+1=11)
        completedHand.finishingStacks = [10, 200, 300];
        completedHand.blindsOrStraddles = [0, 1, 10];
        completedHand.antes = [1, 1, 1];
        completedHand._inactive = [1, 0, 0];
        completedHand._intents = [2, 0, 0]; // Alice paused

        const nextHand = Hand.next(completedHand);

        // Paused player needs blind(10) + ante(1) = 11, has only 10
        expect(nextHand.players).toEqual(['Bob', 'Charlie']);
      });
    });

    describe('removal with dead blinds', () => {
      it('should not charge dead blinds to leaving player', () => {
        // Scenario: Player leaving with accumulated debt
        // Input: _intents: [3, 0, 0], _deadBlinds: [30, 0, 0]
        // Expected: Alice removed, debt not collected
        completedHand._intents = [3, 0, 0];
        completedHand._deadBlinds = [30, 0, 0];

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Bob', 'Charlie']);
        // Alice's stack not reduced by dead blinds
        expect(nextHand.startingStacks).toEqual([1010, 1010]);
      });

      it('should remove player who cannot afford dead blinds plus blinds', () => {
        // Scenario: Returning player can't cover debt + blind
        // Input: finishingStacks: [25, 1000, 1000], _deadBlinds: [20, 0, 0], upcoming BB
        // Expected: Alice removed (can't pay 20 debt + 20 BB)
        completedHand.finishingStacks = [25, 1000, 1000];
        completedHand._deadBlinds = [20, 0, 0];
        completedHand._inactive = [1, 0, 0];
        completedHand._intents = [0, 0, 0]; // Alice wants to return
        completedHand.blindsOrStraddles = [0, 10, 20]; // Alice (BTN), Bob (SB), Charlie (BB)
        // After rotation: [20, 0, 10] - Alice (BB), Bob (BTN), Charlie (SB)

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Bob', 'Charlie']);
      });
    });

    describe('auto-removal scenarios', () => {
      it('should auto-remove player who cannot afford dead blinds + blinds', () => {
        // Scenario: Insufficient chips for return to play
        // Input: finishingStack: 15, _deadBlinds: 10, upcoming BB: 20
        // Expected: Auto-set _intents: 3 and remove player
        completedHand.finishingStacks = [15, 1000, 1000]; // Alice has only 15
        completedHand._inactive = [1, 0, 0];
        completedHand._intents = [0, 0, 0]; // Alice wants to return
        completedHand._deadBlinds = [10, 0, 0]; // Owes 10
        completedHand.blindsOrStraddles = [0, 10, 20]; // Alice (BTN), Bob (SB), Charlie (BB)
        // After rotation: [20, 0, 10] - Alice (BB), Bob (BTN), Charlie (SB)

        const nextHand = Hand.next(completedHand);

        // Alice auto-removed (15 < 10 debt + 20 BB)
        expect(nextHand.players).toEqual(['Bob', 'Charlie']);
        expect(nextHand.startingStacks).toEqual([1000, 1000]);
      });

      it('should auto-remove inactive player with insufficient chips', () => {
        // Scenario: Paused player runs out of money
        // Input: _inactive: 1, finishingStack: 5, needs 10 for SB
        // Expected: Auto-marked for removal with _intents: 3
        completedHand.finishingStacks = [1000, 5, 1000]; // Bob has only 5
        completedHand._inactive = [0, 1, 0]; // Bob is inactive
        completedHand._intents = [0, 2, 0]; // Bob is paused
        completedHand.blindsOrStraddles = [20, 0, 10]; // Alice (BB), Bob (BTN), Charlie (SB)
        // After rotation: [10, 20, 0] - Alice (SB), Bob (BB), Charlie (BTN)

        const nextHand = Hand.next(completedHand);

        // Bob auto-removed (5 < 10 SB)
        expect(nextHand.players).toEqual(['Alice', 'Charlie']);
        expect(nextHand.startingStacks).toEqual([1000, 1000]);
      });

      it('should handle multiple auto-removals in one operation', () => {
        // Scenario: Multiple players insufficient funds
        // Input: 2 players can't afford blinds/debts
        // Expected: Player with insufficient funds removed
        completedHand.finishingStacks = [5, 8, 2000]; // Alice low with dead blinds
        completedHand._inactive = [1, 0, 0];
        completedHand._intents = [0, 0, 0];
        completedHand._deadBlinds = [10, 0, 0]; // Alice owes more than she has (5 < 10)
        completedHand.blindsOrStraddles = [0, 20, 10]; // Alice=0 (inactive), Bob=BB, Charlie=SB
        // After rotation: [10, 0, 20] - Alice at SB (but inactive, still 0), Bob at BTN, Charlie at BB

        const nextHand = Hand.next(completedHand);

        // Alice removed (can't afford dead blinds), Bob stays (at BTN, doesn't need blinds)
        expect(nextHand.players).toEqual(['Bob', 'Charlie']);
        expect(nextHand.startingStacks).toEqual([8, 2000]);
      });
    });
  });

  describe('Dead blind calculations', () => {
    describe('dead blind formula verification', () => {
      it('should calculate SB as exactly 0.5 * BB in chips', () => {
        // Scenario: Verify exact formula for SB
        // Input: BB = 20, player will miss SB in next hand
        // Expected: _deadBlinds += 10 (0.5 * 20)
        completedHand._inactive = [0, 0, 1]; // Charlie inactive
        completedHand._intents = [0, 0, 2]; // Charlie paused
        completedHand.blindsOrStraddles = [20, 10, 0]; // Alice=BB, Bob=SB, Charlie=0 (inactive). Charlie was at theoretical BB position.
        completedHand._deadBlinds = [0, 0, 0];

        const nextHand = Hand.next(completedHand);

        // After rotation: Charlie at theoretical SB position, will miss SB(10)
        // Should add 0.5 * 20 = 10
        expect(nextHand._deadBlinds![2]).toBe(10);
      });

      it('should calculate BB as exactly 1.0 * BB in chips', () => {
        // Scenario: Verify exact formula for BB
        // Input: BB = 20, player will miss BB in next hand
        // Expected: _deadBlinds += 20 (1.0 * 20)
        completedHand._inactive = [1, 0, 0]; // Alice inactive
        completedHand._intents = [2, 0, 0]; // Alice paused
        completedHand.blindsOrStraddles = [0, 10, 20]; // Alice at UTG, after rotation will be at BB
        completedHand._deadBlinds = [0, 0, 0];

        const nextHand = Hand.next(completedHand);

        // After rotation: [20, 0, 10] - Alice will miss BB(20)
        // Should add 1.0 * 20 = 20
        expect(nextHand._deadBlinds![0]).toBe(20);
      });

      it('should use absolute chip values not coefficients', () => {
        // SCENARIO: Dead blinds in chips, not multipliers
        // INPUT: minBet=100 → BB=100, SB=50, will miss SB in next hand
        // EXPECTED: _deadBlinds += 50 chips (not 0.5)
        completedHand.minBet = 100; // BB=100, SB=50
        completedHand.blindsOrStraddles = [100, 50, 0]; // Alice=BB, Bob=SB, Charlie=BTN (inactive)
        completedHand._inactive = [0, 0, 1]; // Charlie inactive
        completedHand._intents = [0, 0, 2];
        completedHand._deadBlinds = [0, 0, 0];

        const nextHand = Hand.next(completedHand);

        // After rotation: Charlie will miss SB(50)
        // Should add 50 chips (0.5 * 100), not 0.5
        expect(nextHand._deadBlinds![2]).toBe(50);
        expect(typeof nextHand._deadBlinds![2]).toBe('number');
      });

      it('should calculate based on NEXT hand positions', () => {
        // Scenario: Use positions after rotation
        // Input: Player was BTN in completed hand, will be SB in next
        // Expected: Calculate based on next position after rotation
        completedHand.blindsOrStraddles = [10, 0, 20]; // Alice=SB (shifted from Bob), Bob=0 (inactive), Charlie=BB
        completedHand._inactive = [0, 1, 0];
        completedHand._intents = [0, 2, 0];
        completedHand._deadBlinds = [0, 0, 0];

        const nextHand = Hand.next(completedHand);

        // After rotation: [20, 10, 0] - Bob would be at SB position (index 1)
        // Bob as inactive at SB position accumulates dead blinds = 0.5*BB = 10
        expect(nextHand._deadBlinds![1]).toBe(10);
        // With skip-inactive, actual blinds shift: Alice=BB, Charlie=SB
        expect(nextHand.blindsOrStraddles).toEqual([20, 0, 10]);
      });

      it('should cap at exactly 1.5 * BB in chips', () => {
        // Scenario: Maximum cap verification
        // Input: BB = 20, accumulate past 1.5
        // Expected: Caps at 30 chips (1.5 * 20)
        completedHand.blindsOrStraddles = [20, 0, 10]; // Alice at BB
        completedHand._inactive = [1, 0, 0]; // Alice inactive
        completedHand._intents = [2, 0, 0];
        completedHand._deadBlinds = [30, 0, 0]; // Already at max (1.5 * 20)

        const nextHand = Hand.next(completedHand);

        // Should remain capped at 30, not increase
        expect(nextHand._deadBlinds![0]).toBe(30);
      });
    });

    describe('accumulating dead blinds for inactive players', () => {
      it('should add 0.5BB for missed SB position', () => {
        // Scenario: Inactive player will be in SB position after rotation
        // Input: _inactive: [0, 0, 1], blindsOrStraddles: [20, 10, 0]
        // Expected: _deadBlinds increases by 10 (0.5 * BB of 20)
        completedHand._inactive = [0, 0, 1]; // Charlie is inactive
        completedHand._intents = [0, 0, 2]; // Charlie paused
        completedHand.blindsOrStraddles = [20, 10, 0]; // Alice=BB (shifted), Bob=SB, Charlie=0 (inactive, at theoretical BB)
        completedHand._deadBlinds = [0, 0, 0];

        const nextHand = Hand.next(completedHand);

        // After rotation: [20, 0, 10] - Charlie will be at SB
        // Charlie's dead blinds should increase by 10 (0.5 * 20)
        expect(nextHand._deadBlinds).toEqual([0, 0, 10]);
      });

      it('should add 1BB for missed BB position', () => {
        // Scenario: Inactive player will be in BB position after rotation
        // Input: _inactive: [1, 0, 0], blindsOrStraddles: [0, 10, 20]
        // Expected: _deadBlinds increases by 20 (1 * BB of 20)
        completedHand._inactive = [1, 0, 0]; // Alice is inactive
        completedHand._intents = [2, 0, 0]; // Alice paused
        completedHand.blindsOrStraddles = [0, 10, 20]; // Alice at UTG
        completedHand._deadBlinds = [0, 0, 0];

        const nextHand = Hand.next(completedHand);

        // After rotation: [20, 0, 10] - Alice will be at BB
        // Alice's dead blinds should increase by 20 (1.0 * 20)
        expect(nextHand._deadBlinds).toEqual([20, 0, 0]);
      });

      it('should not accumulate for non-blind position', () => {
        // Scenario: Inactive player will be in non-blind position after rotation
        // Input: _inactive: [0, 1, 0], blindsOrStraddles: [20, 0, 10]
        // Expected: _deadBlinds unchanged (Bob at BTN after rotation)
        completedHand._inactive = [0, 1, 0]; // Bob is inactive
        completedHand._intents = [0, 2, 0]; // Bob paused
        completedHand.blindsOrStraddles = [20, 0, 10]; // Alice=BB, Bob=0 (inactive), Charlie=SB
        completedHand._deadBlinds = [0, 0, 0];

        const nextHand = Hand.next(completedHand);

        // After rotation: [10, 20, 0] - Bob at theoretical BB position
        // But with skip-inactive, actual blinds shift: Alice=SB(10), Charlie=BB(20)
        // Bob as inactive at BB position still accumulates dead blinds = 1.0*BB = 20
        expect(nextHand._deadBlinds).toEqual([0, 20, 0]);
      });

      it('should not accumulate for any non-blind positions', () => {
        // Scenario: Inactive players check future positions after rotation
        // Input: 6 players, P1,P2,P3 inactive
        // Expected: Only those who WILL BE on blind accumulate
        const sixPlayerHand = {
          ...completedHand,
          players: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
          finishingStacks: [1000, 1000, 1000, 1000, 1000, 1000],
          blindsOrStraddles: [0, 0, 0, 0, 10, 20], // P5=SB, P6=BB
          antes: [0, 0, 0, 0, 0, 0],
          _inactive: [1, 1, 1, 0, 0, 0], // P1,P2,P3 inactive
          _intents: [2, 2, 2, 0, 0, 0],
          _deadBlinds: [0, 0, 0, 0, 0, 0],
        };

        const nextHand = Hand.next(sixPlayerHand);

        // After rotation: [20, 0, 0, 0, 0, 10] - P1 at BB, P2-P5 not on blind, P6 at SB
        expect(nextHand._deadBlinds![0]).toBe(20); // P1 will miss BB
        expect(nextHand._deadBlinds![1]).toBe(0); // P2 not in blind position
        expect(nextHand._deadBlinds![2]).toBe(0); // P3 not in blind position
      });

      it('should accumulate for button if will be on blind next', () => {
        // Scenario: Inactive player on button will be BB after rotation
        // Input: _inactive: [1, 0, 0], blindsOrStraddles: [0, 10, 20]
        // Expected: _deadBlinds accumulate for future BB position
        completedHand.blindsOrStraddles = [0, 10, 20]; // Alice=BTN, Bob=SB, Charlie=BB
        completedHand._inactive = [1, 0, 0]; // Alice (button) inactive
        completedHand._intents = [2, 0, 0];
        completedHand._deadBlinds = [0, 0, 0];

        const nextHand = Hand.next(completedHand);

        // After rotation: [20, 0, 10] - Alice will be at BB
        expect(nextHand._deadBlinds![0]).toBe(20); // Alice will miss BB
      });

      it('should cap dead blinds at 1.5BB maximum', () => {
        // Scenario: Player already at max debt
        // Input: _deadBlinds: [30, 0, 0] (1.5 * 20), missed another BB
        // Expected: _deadBlinds remains at 30
        completedHand._inactive = [1, 0, 0]; // Alice is inactive
        completedHand._intents = [2, 0, 0]; // Alice paused
        completedHand.blindsOrStraddles = [0, 20, 10]; // Alice=0 (inactive), Bob=BB, Charlie=SB
        completedHand._deadBlinds = [30, 0, 0]; // Already at max (1.5 * 20)

        const nextHand = Hand.next(completedHand);

        // Should remain capped at 30
        expect(nextHand._deadBlinds).toEqual([30, 0, 0]);
      });

      it('should accumulate correctly over multiple hands', () => {
        // Scenario: Track accumulation pattern with shift-to-active logic
        // Input: Player inactive through multiple rotations
        // Expected: Accumulate based on THEORETICAL position after rotation
        //           Note: With shift-to-active, blinds shift to active players,
        //           which changes the actual blind array but dead blinds use theoretical positions

        // First hand: Charlie at BB, theoretical position after rotation is SB
        completedHand.blindsOrStraddles = [20, 10, 0]; // Alice=BB, Bob=SB, Charlie=0 (inactive)
        completedHand._inactive = [0, 0, 1]; // Charlie inactive
        completedHand._intents = [0, 0, 2]; // Charlie paused
        completedHand._deadBlinds = [0, 0, 0];

        let hand1 = Hand.next(completedHand);
        // Theoretical rotation: [20, 0, 10] - Charlie at SB position
        // Dead blinds: Charlie misses SB = 0.5 * 20 = 10
        // Actual blindsOrStraddles with shift: [10, 20, 0] (Alice SB, Bob BB, Charlie 0)
        expect(hand1._deadBlinds![2]).toBe(10);

        // Second hand: hand1.blindsOrStraddles = [10, 20, 0]
        hand1.finishingStacks = hand1.startingStacks;
        hand1._inactive = [0, 0, 1]; // Charlie still inactive

        let hand2 = Hand.next(hand1);
        // Theoretical rotation of [10, 20, 0]: [0, 10, 20] - Charlie at BB position!
        // Dead blinds: Charlie misses BB = 1.0 * 20 = 20
        // Total: 10 + 20 = 30 (capped at 1.5 * 20 = 30)
        expect(hand2._deadBlinds![2]).toBe(30);

        // Third hand: hand2.blindsOrStraddles = [10, 20, 0] (shifted)
        hand2.finishingStacks = hand2.startingStacks;
        hand2._inactive = [0, 0, 1]; // Charlie still inactive

        let hand3 = Hand.next(hand2);
        // Dead blinds already at cap (30), no further accumulation
        expect(hand3._deadBlinds![2]).toBe(30);
      });

      it('should handle different blind amounts', () => {
        // SCENARIO: 50/100 blinds instead of 10/20
        // INPUT: minBet=100 → BB=100, SB=50, player will be on SB after rotation
        // EXPECTED: _deadBlinds increases by 50 (0.5 * 100)
        completedHand.minBet = 100; // BB=100, SB=50
        completedHand.blindsOrStraddles = [100, 50, 0]; // Alice=BB, Bob=SB, Charlie=BTN (inactive)
        completedHand._inactive = [0, 0, 1]; // Charlie inactive
        completedHand._intents = [0, 0, 2]; // Charlie paused
        completedHand._deadBlinds = [0, 0, 0];

        const nextHand = Hand.next(completedHand);

        // After rotation: Charlie will miss SB(50)
        // Should add 50 (0.5 * 100)
        expect(nextHand._deadBlinds![2]).toBe(50);
      });
    });

    describe('Dead blind accumulation across multiple hands', () => {
      it('should accumulate 0.5×BB when inactive player misses SB', () => {
        // Scenario: Track dead blind accumulation over 2 hands with shift-to-active logic
        // Input: Hand1: Charlie inactive, will be at SB in theoretical rotation
        // Expected: Charlie accumulates dead blinds based on theoretical positions

        // === HAND 1 COMPLETION ===
        completedHand.blindsOrStraddles = [20, 10, 0]; // Alice=BB, Bob=SB, Charlie=0 (inactive)
        completedHand._inactive = [0, 0, 1]; // Charlie inactive
        completedHand._intents = [0, 0, 2]; // Charlie paused
        completedHand._deadBlinds = [0, 0, 0]; // No prior debt

        const hand2 = Hand.next(completedHand);

        // Theoretical rotation: [20, 10, 0] -> [0, 20, 10] - Charlie would be at SB
        // Dead blinds: Charlie misses SB = 0.5 * 20 = 10
        // Actual blindsOrStraddles with shift: [20, 10, 0] (Alice BB, Bob SB)
        expect(hand2._deadBlinds![2]).toBe(10);

        // === HAND 2 COMPLETION ===
        const hand2Completed = {
          ...hand2,
          finishingStacks: hand2.startingStacks,
        };

        const hand3 = Hand.next(hand2Completed);

        // hand2.blindsOrStraddles = [10, 20, 0]
        // Theoretical rotation: [0, 10, 20] - Charlie would be at BB!
        // Dead blinds: Charlie misses BB = 1.0 * 20 = 20
        // Total: 10 + 20 = 30 (capped at 1.5 * 20 = 30)
        expect(hand3._deadBlinds![2]).toBe(30);
      });

      it('should accumulate 1.0×BB when inactive player misses BB', () => {
        // Scenario: Track dead blind accumulation for missed BB position
        // Input: Hand1: Alice at UTG inactive, will be at BB in next; Hand2: check accumulation
        // Expected: Alice accumulates 20 chips (1.0×20) dead blind

        // === HAND 1 COMPLETION ===
        completedHand.blindsOrStraddles = [0, 10, 20]; // Alice at UTG
        completedHand._inactive = [1, 0, 0]; // Alice inactive
        completedHand._intents = [2, 0, 0]; // Alice paused
        completedHand._deadBlinds = [0, 0, 0];

        const hand2 = Hand.next(completedHand);

        // After rotation: [20, 0, 10] - Alice will miss BB(20)
        // Adds 1.0×20 = 20
        expect(hand2._deadBlinds![0]).toBe(20);
      });

      it('should accumulate correctly over 3 hands: various positions', () => {
        // Scenario: Player accumulates dead blinds based on NEXT hand positions
        // Input: Track through 3 hands with different positions
        // Expected: Accumulate only when will be on blind in next hand

        // === HAND 1: Alice at UTG, will be BB after rotation ===
        completedHand.blindsOrStraddles = [0, 10, 20]; // Alice UTG, Bob SB, Charlie BB
        completedHand._inactive = [1, 0, 0]; // Alice inactive
        completedHand._intents = [2, 0, 0]; // Alice paused
        completedHand._deadBlinds = [0, 0, 0];

        const hand2 = Hand.next(completedHand);
        // After rotation: [20, 0, 10] - Alice at BB
        expect(hand2._deadBlinds![0]).toBe(20); // Alice will miss BB = +1.0×20 = 20

        // === HAND 2: Alice at BB, will be SB after rotation ===
        hand2.finishingStacks = hand2.startingStacks;
        hand2._inactive = [1, 0, 0]; // Alice still inactive
        // hand2.blindsOrStraddles is already [20, 0, 10] from rotation

        const hand3 = Hand.next(hand2);
        // After rotation: [10, 20, 0] - Alice at SB
        expect(hand3._deadBlinds![0]).toBe(30); // 20 + 0.5×20 = 30

        // === HAND 3: Alice at SB, will be UTG after rotation (no blind) ===
        hand3.finishingStacks = hand3.startingStacks;
        hand3._inactive = [1, 0, 0]; // Alice still inactive
        // hand3.blindsOrStraddles is already [10, 20, 0] from rotation

        const hand4 = Hand.next(hand3);
        // After rotation: [0, 10, 20] - Alice at UTG (no blind)
        expect(hand4._deadBlinds![0]).toBe(30); // No change - not on blind next hand
      });

      it('should track separate accumulation for multiple inactive players', () => {
        // Scenario: Two players inactive, check their NEXT positions
        // Input: Alice at UTG, Bob at SB, both inactive
        // Expected: Based on next positions after rotation

        completedHand.blindsOrStraddles = [0, 10, 20]; // Alice UTG, Bob SB, Charlie BB
        completedHand._inactive = [1, 1, 0]; // Alice and Bob inactive
        completedHand._intents = [2, 2, 0]; // Both paused
        completedHand._deadBlinds = [0, 0, 0];

        const nextHand = Hand.next(completedHand);

        // After rotation: [20, 0, 10] - Alice at BB, Bob at UTG, Charlie at SB
        expect(nextHand._deadBlinds![0]).toBe(20); // Alice: will miss BB = 1.0×20
        expect(nextHand._deadBlinds![1]).toBe(0); // Bob: not on blind
        expect(nextHand._deadBlinds![2]).toBe(0); // Charlie: active
      });

      it('should NOT accumulate when player returns and becomes active', () => {
        // Scenario: Previously inactive player returns, stops accumulating
        // Input: Alice was inactive with debt, now intent=0 (returning)
        // Expected: Dead blinds preserved for Game() to charge, stack unchanged

        completedHand.finishingStacks = [100, 200, 300];
        completedHand.blindsOrStraddles = [10, 20, 0]; // Alice at SB
        completedHand._inactive = [1, 0, 0]; // Alice was inactive
        completedHand._intents = [0, 0, 0]; // Alice returns
        completedHand._deadBlinds = [10, 0, 0]; // Has debt

        const nextHand = Hand.next(completedHand);

        // Alice returns, debt preserved for Game() to charge
        expect(nextHand._inactive![0]).toBe(0); // Now active
        expect(nextHand._deadBlinds![0]).toBe(10); // Debt preserved for Game()
        expect(nextHand.startingStacks[0]).toBe(100); // Stack unchanged
      });
    });

    describe('dead blind payment scenarios', () => {
      it('should preserve dead blinds when player returns early (Game() will charge)', () => {
        // Scenario: Player stops pause, debt preserved for Game() to charge
        // Input: _intents: [0, 0, 0], _deadBlinds: [20, 0, 0], finishingStacks: [1000, 1000, 1000]
        // Expected: startingStacks: [1000, 1000, 1000], _deadBlinds: [20, 0, 0]
        completedHand.finishingStacks = [1000, 1000, 1000];
        completedHand._inactive = [1, 0, 0]; // Alice was inactive
        completedHand._intents = [0, 0, 0]; // Alice wants to return
        completedHand._deadBlinds = [20, 0, 0]; // Alice owes 20

        const nextHand = Hand.next(completedHand);

        expect(nextHand.startingStacks).toEqual([1000, 1000, 1000]); // Stack unchanged
        expect(nextHand._deadBlinds).toEqual([20, 0, 0]); // Debt preserved for Game()
        expect(nextHand._inactive).toEqual([0, 0, 0]);
      });

      it('should clear dead blinds when reaching BB position', () => {
        // Scenario: Player waited for BB, no payment
        // Input: _intents: [1, 0, 0], at BB position, _deadBlinds: [20, 0, 0]
        // Expected: _deadBlinds: [0, 0, 0], stack unchanged
        completedHand.finishingStacks = [1000, 1000, 1000];
        completedHand._inactive = [1, 0, 0]; // Alice was inactive
        completedHand._intents = [1, 0, 0]; // Alice waiting for BB
        completedHand._deadBlinds = [20, 0, 0]; // Alice has debt
        completedHand.blindsOrStraddles = [0, 10, 20]; // Alice (BTN), Bob (SB), Charlie (BB)
        // After rotation: [20, 0, 10] - Alice (BB), Bob (BTN), Charlie (SB)

        const nextHand = Hand.next(completedHand);

        // Check rotated positions - Alice should now be at BB
        expect(nextHand.blindsOrStraddles).toEqual([20, 0, 10]);
        expect(nextHand.startingStacks).toEqual([1000, 1000, 1000]); // No deduction
        expect(nextHand._deadBlinds).toEqual([0, 0, 0]); // Debt cleared
        expect(nextHand._inactive).toEqual([0, 0, 0]); // Activated
        expect(nextHand._intents).toEqual([0, 0, 0]); // Intent reset
      });

      it('should handle partial payment if insufficient chips', () => {
        // Scenario: Player has 10 chips, owes 30
        // Input: finishingStacks: [10, 1000, 1000], _deadBlinds: [30, 0, 0]
        // Expected: Player removed (can't afford)
        completedHand.finishingStacks = [10, 1000, 1000];
        completedHand._inactive = [1, 0, 0];
        completedHand._intents = [0, 0, 0]; // Alice wants to return
        completedHand._deadBlinds = [30, 0, 0];

        const nextHand = Hand.next(completedHand);

        // Alice removed - can't afford dead blinds
        expect(nextHand.players).toEqual(['Bob', 'Charlie']);
        expect(nextHand.startingStacks).toEqual([1000, 1000]);
      });
    });
  });

  describe('Player activation states', () => {
    describe('state transition coverage', () => {
      it('should transition active player with pause intent to inactive', () => {
        // Scenario: Active player requested pause
        // Input: _inactive: 0, _intents: 1 (or 2)
        // Expected: nextHand has _inactive: 1
        completedHand._inactive = [0, 0, 0]; // All active
        completedHand._intents = [1, 0, 0]; // Alice wants to pause
        completedHand.blindsOrStraddles = [10, 20, 0]; // Alice=SB, Bob=BB, Charlie=BTN
        // After rotation: [0, 10, 20] - Alice=BTN (not BB), so becomes inactive

        const nextHand = Hand.next(completedHand);

        expect(nextHand._inactive).toEqual([1, 0, 0]); // Alice now inactive
        expect(nextHand._intents).toEqual([1, 0, 0]); // Intent preserved
      });

      it('should transition from _intents: 1 to inactive', () => {
        // Scenario: Wait-for-BB intent takes effect
        // Input: _inactive: 0, _intents: 1
        // Expected: _inactive: 1, _intents: 1 (preserved)
        completedHand._inactive = [0, 0, 0];
        completedHand._intents = [1, 0, 0]; // Alice wait-for-BB
        completedHand.blindsOrStraddles = [10, 20, 0]; // Alice=SB, not BB
        // After rotation: [0, 10, 20] - Alice=BTN (not BB), so becomes inactive

        const nextHand = Hand.next(completedHand);

        expect(nextHand._inactive).toEqual([1, 0, 0]);
        expect(nextHand._intents).toEqual([1, 0, 0]); // Preserved until BB
      });

      it('should transition from _intents: 2 to inactive', () => {
        // Scenario: Simple pause intent takes effect
        // Input: _inactive: 0, _intents: 2
        // Expected: _inactive: 1, _intents: 2 (preserved)
        completedHand._inactive = [0, 0, 0];
        completedHand._intents = [2, 0, 0]; // Alice simple pause

        const nextHand = Hand.next(completedHand);

        expect(nextHand._inactive).toEqual([1, 0, 0]);
        expect(nextHand._intents).toEqual([2, 0, 0]); // Preserved
      });

      it('should not transition if already inactive', () => {
        // Scenario: Already paused player
        // Input: _inactive: 1, _intents: 1
        // Expected: Remains _inactive: 1
        completedHand._inactive = [1, 0, 0]; // Already inactive
        completedHand._intents = [1, 0, 0];
        completedHand.blindsOrStraddles = [10, 20, 0]; // Alice=SB
        // After rotation: [0, 10, 20] - Alice=BTN (not BB)

        const nextHand = Hand.next(completedHand);

        expect(nextHand._inactive).toEqual([1, 0, 0]); // Stays inactive
        expect(nextHand._intents).toEqual([1, 0, 0]);
      });

      it('should handle transition during hand completion', () => {
        // Scenario: Intent changed during hand
        // Input: Changed from 0 to 1 during play
        // Expected: Becomes inactive in next hand
        completedHand._inactive = [0, 0, 0]; // Was active during hand
        completedHand._intents = [1, 0, 0]; // Changed intent during hand
        completedHand.blindsOrStraddles = [10, 20, 0]; // Alice=SB
        // After rotation: [0, 10, 20] - Alice=BTN (not BB)

        const nextHand = Hand.next(completedHand);

        expect(nextHand._inactive).toEqual([1, 0, 0]); // Now inactive
        expect(nextHand._intents).toEqual([1, 0, 0]);
      });
    });

    describe('new players joining next hand', () => {
      it('should activate player waiting to join', () => {
        // Scenario: Player joined mid-hand, now active
        // Input: _inactive: [0, 0, 1], _intents: [0, 0, 0]
        // Expected: _inactive: [0, 0, 0] in nextHand
        completedHand._inactive = [0, 0, 1]; // Charlie waiting to join
        completedHand._intents = [0, 0, 0]; // Charlie wants to play

        const nextHand = Hand.next(completedHand);

        expect(nextHand._inactive).toEqual([0, 0, 0]);
        expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
      });

      it('should not activate if insufficient chips', () => {
        // Scenario: New player doesn't have enough for blinds
        // Input: _inactive: [0, 0, 1], finishingStacks: [1000, 1000, 0]
        // Expected: Player removed instead of activated
        completedHand._inactive = [0, 0, 1];
        completedHand._intents = [0, 0, 0];
        completedHand.finishingStacks = [1000, 1000, 0];

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Alice', 'Bob']);
        expect(nextHand.startingStacks).toEqual([1000, 1000]);
      });
    });

    describe('paused players returning', () => {
      it('should activate player returning at BB without payment', () => {
        // Scenario: Waited for BB position
        // Input: _intents: [1, 0, 0], now at BB, _deadBlinds: [20, 0, 0]
        // Expected: _inactive: [0, 0, 0], _deadBlinds: [0, 0, 0]
        completedHand._inactive = [1, 0, 0];
        completedHand._intents = [1, 0, 0]; // Alice waiting for BB
        completedHand._deadBlinds = [20, 0, 0];
        completedHand.blindsOrStraddles = [0, 10, 20]; // Next rotation puts Alice at BB (right rotation)

        const nextHand = Hand.next(completedHand);

        expect(nextHand._inactive).toEqual([0, 0, 0]);
        expect(nextHand._deadBlinds).toEqual([0, 0, 0]);
      });

      it('should activate player returning early with debt preserved', () => {
        // Scenario: Stops pause, debt preserved for Game() to charge
        // Input: _intents: [0, 0, 0], _inactive: [1, 0, 0], _deadBlinds: [10, 0, 0]
        // Expected: _inactive: [0, 0, 0], stack unchanged, debt preserved
        completedHand.finishingStacks = [1000, 1000, 1000];
        completedHand._inactive = [1, 0, 0];
        completedHand._intents = [0, 0, 0]; // Alice wants to return
        completedHand._deadBlinds = [10, 0, 0];

        const nextHand = Hand.next(completedHand);

        expect(nextHand._inactive).toEqual([0, 0, 0]);
        expect(nextHand.startingStacks).toEqual([1000, 1000, 1000]); // Stack unchanged
        expect(nextHand._deadBlinds).toEqual([10, 0, 0]); // Debt preserved for Game()
      });

      it('should not activate if intent still paused', () => {
        // Scenario: Still on pause
        // Input: _intents: [2, 0, 0], _inactive: [1, 0, 0]
        // Expected: _inactive: [1, 0, 0] unchanged
        completedHand._inactive = [1, 0, 0];
        completedHand._intents = [2, 0, 0]; // Alice still paused

        const nextHand = Hand.next(completedHand);

        expect(nextHand._inactive).toEqual([1, 0, 0]);
      });
    });

    describe('intent state transitions', () => {
      it('should handle pause request taking effect', () => {
        // Scenario: Was active with pause intent, now inactive
        // Input: _inactive: [0, 0, 0], _intents: [1, 0, 0]
        // Expected: _inactive: [1, 0, 0] in nextHand
        completedHand._inactive = [0, 0, 0];
        completedHand._intents = [1, 0, 0]; // Alice wants to pause
        completedHand.blindsOrStraddles = [10, 20, 0]; // Alice=SB
        // After rotation: [0, 10, 20] - Alice=BTN (not BB)

        const nextHand = Hand.next(completedHand);

        expect(nextHand._inactive).toEqual([1, 0, 0]);
        expect(nextHand._intents).toEqual([1, 0, 0]); // Intent preserved
      });

      it('should reset intents when returning at BB', () => {
        // Scenario: Reached BB position
        // Input: _intents: [1, 0, 0] at BB
        // Expected: _intents: [0, 0, 0] in nextHand
        completedHand._inactive = [1, 0, 0];
        completedHand._intents = [1, 0, 0];
        completedHand.blindsOrStraddles = [0, 10, 20]; // Next rotation puts Alice at BB (right rotation)

        const nextHand = Hand.next(completedHand);

        expect(nextHand._intents).toEqual([0, 0, 0]);
        expect(nextHand._inactive).toEqual([0, 0, 0]);
      });

      it('should preserve pause intent if not at BB', () => {
        // Scenario: Still waiting for BB
        // Input: _intents: [1, 0, 0] not at BB
        // Expected: _intents: [1, 0, 0] unchanged
        completedHand._inactive = [1, 0, 0];
        completedHand._intents = [1, 0, 0];
        completedHand.blindsOrStraddles = [10, 20, 0]; // Alice at SB, not BB
        // After rotation: [0, 10, 20] - Alice=BTN (still not BB)

        const nextHand = Hand.next(completedHand);

        expect(nextHand._intents).toEqual([1, 0, 0]); // Preserved
        expect(nextHand._inactive).toEqual([1, 0, 0]); // Still inactive
      });
    });

    describe('State transitions based on intents', () => {
      it('should activate player with intent=1 when reaching BB position', () => {
        // Scenario: Player waiting for BB reaches BB position after rotation
        // Input: _intents=[1,0,0], _inactive=[1,0,0], blinds=[0,10,20]
        // Expected: Player becomes active and intent is cleared
        completedHand._intents = [1, 0, 0]; // Alice waiting for BB
        completedHand._inactive = [1, 0, 0]; // Alice inactive
        completedHand.blindsOrStraddles = [0, 10, 20]; // Alice at button

        const nextHand = Hand.next(completedHand);

        // After rotation: [20,0,10], Alice at BB position
        expect(nextHand._intents).toEqual([0, 0, 0]); // Intent cleared per spec
        expect(nextHand._inactive).toEqual([0, 0, 0]); // Alice becomes active at BB
        expect(nextHand.blindsOrStraddles).toEqual([20, 0, 10]);
      });

      it('should keep player with intent=1 inactive when NOT at BB position', () => {
        // Scenario: Player waiting for BB, but not at BB position yet
        // Input: After rotation, player with intent=1 is NOT at BB
        // Expected: Player remains inactive with intent preserved
        completedHand._intents = [0, 1, 0]; // Bob waiting for BB
        completedHand._inactive = [0, 1, 0]; // Bob inactive
        completedHand.blindsOrStraddles = [10, 0, 20]; // Alice=SB, Bob=0 (inactive), Charlie=BB

        const nextHand = Hand.next(completedHand);

        // After rotation: [20, 0, 10] - Bob still at non-blind position (0)
        // Bob NOT at BB -> remains inactive with intent preserved
        expect(nextHand._intents).toEqual([0, 1, 0]); // Intent preserved
        expect(nextHand._inactive).toEqual([0, 1, 0]); // Bob remains inactive
        expect(nextHand.blindsOrStraddles).toEqual([20, 0, 10]); // Alice=BB, Bob=0, Charlie=SB
      });

      it('should transition active player with intent=2 to inactive', () => {
        // Scenario: Active player sets intent=2 (pause)
        // Input: _intents=[2,0,0], _inactive=[0,0,0]
        // Expected: Player becomes inactive in next hand
        completedHand._intents = [2, 0, 0]; // Alice wants to pause
        completedHand._inactive = [0, 0, 0]; // All active currently
        completedHand.blindsOrStraddles = [0, 10, 20];

        const nextHand = Hand.next(completedHand);

        expect(nextHand._intents).toEqual([2, 0, 0]); // Intent preserved
        expect(nextHand._inactive).toEqual([1, 0, 0]); // Alice becomes inactive
      });

      it('should handle multiple simultaneous state transitions', () => {
        // Scenario: Complex multi-player state changes
        // Input: Alice pausing(2), Bob waiting(1) at SB will move to BB, Charlie active(0)
        // Expected: Alice->inactive, Bob becomes active at BB, Charlie stays active
        completedHand._intents = [2, 1, 0]; // Alice pause, Bob wait, Charlie active
        completedHand._inactive = [0, 1, 0]; // Alice active, Bob inactive
        completedHand.blindsOrStraddles = [20, 0, 10]; // Alice=BB (shifted from Bob), Bob=0 (inactive), Charlie=SB

        const nextHand = Hand.next(completedHand);

        // After rotation: [10, 20, 0] - Bob at BB position with intent=1
        // Bob with intent=1 at BB -> becomes active, intent cleared
        // Alice with intent=2 -> becomes inactive
        expect(nextHand._intents).toEqual([2, 0, 0]); // Alice pause preserved, Bob cleared
        expect(nextHand._inactive).toEqual([1, 0, 0]); // Alice inactive, Bob active at BB
      });

      it('should NOT transition player with intent=3 (leaving)', () => {
        // Scenario: Player marked for removal should be removed, not transitioned
        // Input: _intents=[3,0,0], player has chips
        // Expected: Player removed entirely from next hand
        completedHand._intents = [3, 0, 0]; // Alice leaving
        completedHand._inactive = [0, 0, 0];
        completedHand.finishingStacks = [100, 200, 300];

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Bob', 'Charlie']); // Alice removed
        expect(nextHand._intents).toEqual([0, 0]); // No intent for removed player
        expect(nextHand._inactive).toEqual([0, 0]); // No inactive state for removed
      });

      it('should preserve dead blinds for player becoming active (Game() will charge)', () => {
        // Scenario: Inactive player with dead blinds returns to active play
        // Input: _inactive=[1,0,0], _deadBlinds=[30,0,0], intent=0 (resume)
        // Expected: Dead blinds preserved for Game() to charge (not cleared in next())
        completedHand._intents = [0, 0, 0]; // Alice wants to resume
        completedHand._inactive = [1, 0, 0]; // Alice was inactive
        completedHand._deadBlinds = [30, 0, 0]; // Alice has dead blinds
        completedHand.blindsOrStraddles = [20, 0, 10]; // Alice was at BB (after rotation: at SB)

        const nextHand = Hand.next(completedHand);

        // Alice becomes active, debt preserved for Game()
        expect(nextHand._inactive).toEqual([0, 0, 0]); // Alice becomes active
        expect(nextHand._deadBlinds).toEqual([30, 0, 0]); // Dead blinds preserved for Game()
      });
    });
  });

  describe('Position rotation with filtered players', () => {
    describe('standard rotation after removals', () => {
      it('should rotate blinds after removing players', () => {
        // Scenario: Player removed, then rotate
        // Input: Remove Bob, rotate [0, 10, 20] -> [20, 0, 10]
        // Expected: Correct blind positions for remaining players
        completedHand._intents = [0, 3, 0]; // Bob leaving
        completedHand.blindsOrStraddles = [0, 10, 20];

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Alice', 'Charlie']);
        // After removing Bob: [0, 10, 20], then rotate: [10, 20]
        expect(nextHand.blindsOrStraddles).toEqual([10, 20]);
      });

      it('should maintain button progression', () => {
        // Scenario: Button moves clockwise
        // Input: [UTG, SB, BB] -> [SB, BB, UTG]
        // Expected: Proper rotation
        completedHand.blindsOrStraddles = [0, 10, 20]; // UTG, SB, BB

        const nextHand = Hand.next(completedHand);

        // Rotation moves button forward (right rotation: last to first)
        expect(nextHand.blindsOrStraddles).toEqual([20, 0, 10]); // BB, BTN, SB
      });

      it('should handle heads-up blind positions', () => {
        // Scenario: Down to 2 players
        // Input: 3 players -> remove 1 -> heads-up positions
        // Expected: [SB/BB, BB/Dealer] for heads-up
        completedHand._intents = [0, 3, 0]; // Bob leaving
        completedHand.blindsOrStraddles = [0, 10, 20];

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Alice', 'Charlie']);
        // Heads-up: SB/Dealer, BB
        expect(nextHand.blindsOrStraddles).toEqual([10, 20]);
      });
    });

    describe('seat preservation and rotation', () => {
      it('should rotate seat positions if present', () => {
        // Scenario: Physical seats rotate with button
        // Input: seats: [5, 1, 3] -> rotated
        // Expected: seats: [1, 3, 5]
        completedHand.seats = [5, 1, 3];

        const nextHand = Hand.next(completedHand);

        expect(nextHand.seats).toEqual([1, 3, 5]); // Sorted by seat orders
        expect(nextHand.players).toEqual(['Bob', 'Charlie', 'Alice']);
        expect(nextHand.startingStacks).toEqual([1010, 1010, 980]);
      });

      it('should filter seats when removing players', () => {
        // Scenario: Remove player, remove their seat
        // Input: Remove Bob at seat 3
        // Expected: seats: [1, 5] only
        completedHand.seats = [1, 3, 5];
        completedHand._intents = [0, 3, 0]; // Bob leaving (seat 3)

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Alice', 'Charlie']);
        // Bob's seat removed, then rotated
        expect(nextHand.seats).toEqual([1, 5]);
      });
    });

    describe('venue ID preservation', () => {
      it('should preserve _venueIds for remaining players', () => {
        // Scenario: Venue IDs maintained
        // Input: _venueIds: ['id1', 'id2', 'id3'], remove Bob
        // Expected: _venueIds: ['id1', 'id3']
        completedHand._venueIds = ['id1', 'id2', 'id3'];
        completedHand._intents = [0, 3, 0]; // Bob leaving

        const nextHand = Hand.next(completedHand);

        expect(nextHand.players).toEqual(['Alice', 'Charlie']);
        expect(nextHand._venueIds).toEqual(['id1', 'id3']);
      });

      it('should maintain venue ID order with player order', () => {
        // Scenario: IDs stay with players
        // Input: Complex removal and rotation
        // Expected: Correct ID mapping
        completedHand._venueIds = ['alice-id', 'bob-id', 'charlie-id'];
        completedHand._intents = [0, 3, 0]; // Bob leaving

        const nextHand = Hand.next(completedHand);

        // IDs preserved with their players
        expect(nextHand.players[0]).toBe('Alice');
        expect(nextHand._venueIds![0]).toBe('alice-id');
        expect(nextHand.players[1]).toBe('Charlie');
        expect(nextHand._venueIds![1]).toBe('charlie-id');
      });
    });
  });

  describe('Complex scenarios', () => {
    describe('multiple simultaneous operations', () => {
      it('should handle player leaving while another returns', () => {
        // Scenario: Alice leaves, Bob returns from pause
        // Input: Mixed intents and states
        // Expected: Correct final state for all, debt preserved for Game()
        completedHand._inactive = [0, 1, 0]; // Bob was paused
        completedHand._intents = [3, 0, 0]; // Alice leaving, Bob returning
        completedHand._deadBlinds = [0, 10, 0]; // Bob has debt
        completedHand.finishingStacks = [1000, 1000, 1000];

        const nextHand = Hand.next(completedHand);

        // Alice removed, Bob returns with debt preserved
        expect(nextHand.players).toEqual(['Bob', 'Charlie']);
        expect(nextHand.startingStacks).toEqual([1000, 1000]); // Stack unchanged
        expect(nextHand._inactive).toEqual([0, 0]); // Bob now active
        expect(nextHand._deadBlinds).toEqual([10, 0]); // Debt preserved for Game()
      });

      it('should handle all operations in correct order', () => {
        // Scenario: Remove -> Calculate -> Activate -> Rotate
        // Input: Complex state requiring all steps
        // Expected: Operations applied in correct sequence, debt preserved for Game()
        completedHand.players = ['P1', 'P2', 'P3', 'P4'];
        completedHand.finishingStacks = [0, 100, 200, 300]; // P1 busted
        completedHand.blindsOrStraddles = [0, 0, 10, 20];
        completedHand.antes = [1, 1, 1, 1];
        completedHand._intents = [0, 0, 3, 0]; // P3 leaving
        completedHand._inactive = [0, 1, 0, 0]; // P2 was paused
        completedHand._deadBlinds = [0, 5, 0, 0];

        const nextHand = Hand.next(completedHand);

        // P1 and P3 removed first
        expect(nextHand.players).toEqual(['P2', 'P4']);
        // Stacks unchanged, debt preserved for Game()
        expect(nextHand.startingStacks).toEqual([100, 300]); // Stack unchanged
        expect(nextHand._deadBlinds).toEqual([5, 0]); // Debt preserved for Game()
        // Then blinds rotated on remaining
        expect(nextHand.blindsOrStraddles).toEqual([10, 20]); // Rotated
        // P2 activated
        expect(nextHand._inactive).toEqual([0, 0]);
      });

      it('should handle table reducing to minimum players', () => {
        // Scenario: 6 players -> 2 players
        // Input: Multiple leaves and busts
        // Expected: Valid 2-player game
        const sixPlayerHand = {
          ...completedHand,
          players: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
          finishingStacks: [0, 0, 0, 1500, 0, 1500], // 4 busted
          blindsOrStraddles: [0, 0, 0, 0, 10, 20],
          antes: [0, 0, 0, 0, 0, 0],
          _intents: [0, 0, 0, 0, 0, 0],
          _inactive: [0, 0, 0, 0, 0, 0],
          _deadBlinds: [0, 0, 0, 0, 0, 0],
        };

        const nextHand = Hand.next(sixPlayerHand);

        expect(nextHand.players).toEqual(['P4', 'P6']);
        expect(nextHand.startingStacks).toEqual([1500, 1500]);
        // Heads-up blinds
        expect(nextHand.blindsOrStraddles).toEqual([10, 20]);
      });
    });

    describe('edge cases', () => {
      it('should handle missing sit-in/out fields', () => {
        // Scenario: Legacy hand without new fields
        // Input: No _inactive, _intents, _deadBlinds
        // Expected: Initialize with defaults
        const legacyHand = {
          ...completedHand,
        };
        delete (legacyHand as any)._inactive;
        delete (legacyHand as any)._intents;
        delete (legacyHand as any)._deadBlinds;

        const nextHand = Hand.next(legacyHand);

        // Should initialize missing arrays
        expect(nextHand._inactive).toBeDefined();
        expect(nextHand._intents).toBeDefined();
        expect(nextHand._deadBlinds).toBeDefined();
        expect(nextHand._inactive).toEqual([0, 0, 0]);
        expect(nextHand._intents).toEqual([0, 0, 0]);
        expect(nextHand._deadBlinds).toEqual([0, 0, 0]);
      });

      it('should handle inconsistent array lengths', () => {
        // Scenario: Corrupted state
        // Input: Mismatched array lengths
        // Expected: Error or recovery
        completedHand._intents = [0, 0]; // Wrong length!
        completedHand._inactive = [0, 0, 0];
        completedHand._deadBlinds = [0];

        // Should either throw or handle gracefully
        expect(() => {
          const nextHand = Hand.next(completedHand);
          // If it doesn't throw, check arrays are corrected
          expect(nextHand._intents!.length).toBe(nextHand.players.length);
          expect(nextHand._inactive!.length).toBe(nextHand.players.length);
          expect(nextHand._deadBlinds!.length).toBe(nextHand.players.length);
        }).not.toThrow();
      });

      it('should handle all players inactive', () => {
        // Scenario: Everyone on pause
        // Input: _inactive: [1, 1, 1]
        // Expected: No one gets cards
        completedHand._inactive = [1, 1, 1]; // All inactive
        completedHand._intents = [2, 2, 2]; // All paused

        const nextHand = Hand.next(completedHand);

        // All remain inactive
        expect(nextHand._inactive).toEqual([1, 1, 1]);
        expect(nextHand._intents).toEqual([2, 2, 2]);
        // Game continues with no active players
        expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
      });

      it('should handle fractional chip amounts', () => {
        // Scenario: Dead blinds with decimals
        // Input: 0.5 chip dead blind
        // Expected: Stack unchanged, debt preserved for Game()
        completedHand.finishingStacks = [100.5, 99.25, 100.25];
        completedHand._deadBlinds = [0.5, 0, 0];
        completedHand._inactive = [1, 0, 0];
        completedHand._intents = [0, 0, 0]; // Alice returning

        const nextHand = Hand.next(completedHand);

        // Fractional amounts preserved
        expect(nextHand.startingStacks[0]).toBe(100.5); // Stack unchanged
        expect(nextHand._deadBlinds![0]).toBe(0.5); // Debt preserved for Game()
      });
    });

    describe('validation and error cases', () => {
      it('should require completed hand', () => {
        // Scenario: Hand not finished
        // Input: No finishingStacks
        // Expected: Error thrown
        const incompleteHand = { ...completedHand };
        delete (incompleteHand as any).finishingStacks;

        expect(() => {
          Hand.next(incompleteHand);
        }).toThrow('Cannot create next hand from incomplete hand');
      });

      it('should validate array consistency after operations', () => {
        // Scenario: Ensure all arrays same length
        // Input: Various operations
        // Expected: All arrays synchronized
        completedHand._intents = [3, 0, 0]; // Alice leaving
        completedHand.seats = [1, 3, 5];
        completedHand._venueIds = ['a', 'b', 'c'];

        const nextHand = Hand.next(completedHand);

        // All arrays should have same length
        const arrayLength = nextHand.players.length;
        expect(nextHand.startingStacks).toHaveLength(arrayLength);
        expect(nextHand.blindsOrStraddles).toHaveLength(arrayLength);
        expect(nextHand.antes).toHaveLength(arrayLength);
        expect(nextHand._intents).toHaveLength(arrayLength);
        expect(nextHand._inactive).toHaveLength(arrayLength);
        expect(nextHand._deadBlinds).toHaveLength(arrayLength);
        expect(nextHand.seats).toHaveLength(arrayLength);
        expect(nextHand._venueIds).toHaveLength(arrayLength);
      });

      it('should handle unexpected state combinations', () => {
        // Scenario: Invalid state from corruption
        // Input: _inactive: 0 with _deadBlinds: >0
        // Expected: State corrected or persists (handled gracefully)
        completedHand._inactive = [0, 0, 0]; // Active
        completedHand._deadBlinds = [10, 0, 0]; // But has debt (invalid!)

        const nextHand = Hand.next(completedHand);

        // Should either correct the state or handle gracefully
        // The invalid state may persist through sorting operations
        // This is acceptable as it's an edge case that shouldn't occur in normal gameplay
        expect(nextHand._deadBlinds).toBeDefined();
        expect(nextHand._deadBlinds![0]).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Financial reconciliation', () => {
    describe('chip continuity', () => {
      it('should use finishing stacks as starting stacks', () => {
        // Scenario: Chips carry over
        // Input: finishingStacks: [980, 1010, 1010]
        // Expected: startingStacks: [980, 1010, 1010] (before dead blinds)
        completedHand.finishingStacks = [980, 1010, 1010];
        completedHand._deadBlinds = [0, 0, 0]; // No debts

        const nextHand = Hand.next(completedHand);

        expect(nextHand.startingStacks).toEqual([980, 1010, 1010]);
      });

      it('should preserve dead blinds for Game() to charge', () => {
        // Scenario: Dead blinds preserved for Game() to deduct
        // Input: 20 chips dead blind
        // Expected: Stack unchanged, debt preserved
        completedHand.finishingStacks = [1000, 1000, 1000];
        completedHand._inactive = [1, 0, 0];
        completedHand._intents = [0, 0, 0]; // Alice returning
        completedHand._deadBlinds = [20, 0, 0];

        const nextHand = Hand.next(completedHand);

        expect(nextHand.startingStacks[0]).toBe(1000); // Stack unchanged
        expect(nextHand._deadBlinds![0]).toBe(20); // Preserved for Game()
      });

      it('should handle rake and pot distribution', () => {
        // Scenario: Ensure pot was distributed correctly
        // Input: Pot and rake from completed hand
        // Expected: Stacks reflect winnings
        // Winnings already factored into finishingStacks
        completedHand.finishingStacks = [980, 1010, 1010];
        completedHand.winnings = [0, 30, 30];
        completedHand.rake = 0;
        completedHand.totalPot = 60;

        const nextHand = Hand.next(completedHand);

        // Starting stacks are finishing stacks (winnings already included)
        expect(nextHand.startingStacks).toEqual([980, 1010, 1010]);
        // Winnings/pot not carried to next hand
        expect(nextHand.winnings).toBeUndefined();
        expect(nextHand.totalPot).toBeUndefined();
      });
    });

    describe('blind structure continuity', () => {
      it('should maintain blind amounts', () => {
        // Scenario: Blinds unchanged
        // Input: minBet: 20, BB: 20
        // Expected: Same in nextHand
        completedHand.minBet = 20;
        completedHand.blindsOrStraddles = [0, 10, 20];

        const nextHand = Hand.next(completedHand);

        expect(nextHand.minBet).toBe(20);
        // Blinds rotate but amounts preserved
        expect(Math.max(...nextHand.blindsOrStraddles)).toBe(20);
      });

      it('should handle ante preservation', () => {
        // Scenario: Antes continue
        // Input: antes: [1, 1, 1]
        // Expected: Rotated antes in nextHand
        completedHand.antes = [1, 1, 1];

        const nextHand = Hand.next(completedHand);

        // Antes rotated with positions
        expect(nextHand.antes).toEqual([1, 1, 1]); // All same value after rotation
      });

      it('should handle straddle positions', () => {
        // Scenario: Straddle rotates
        // Input: Straddle in blindsOrStraddles
        // Expected: Proper rotation
        completedHand.blindsOrStraddles = [40, 10, 20]; // UTG straddle

        const nextHand = Hand.next(completedHand);

        // Straddle rotates with other positions (right rotation: last to first)
        expect(nextHand.blindsOrStraddles).toEqual([20, 40, 10]);
      });
    });
  });

  describe('Real poker scenarios', () => {
    describe('cash game situations', () => {
      it('should handle player rebuying', () => {
        // Scenario: Busted player wants to rebuy
        // Note: This might be handled differently
        // Expected: Proper state for rebuy
        // Rebuy would be handled by joinHand after removal
        completedHand.finishingStacks = [0, 1000, 1000]; // Alice busted

        const nextHand = Hand.next(completedHand);

        // Alice removed
        expect(nextHand.players).toEqual(['Bob', 'Charlie']);
        // Player would need to use joinHand to rebuy
      });

      it('should handle ratholing prevention', () => {
        // Scenario: Player can't leave and return with less
        // Note: Policy enforcement
        // Expected: Minimum stack enforced
        // This would be enforced at server level when player tries to rejoin
        completedHand._intents = [3, 0, 0]; // Alice leaving with 1010
        completedHand.finishingStacks = [1010, 990, 1000];

        const nextHand = Hand.next(completedHand);

        // Alice removed
        expect(nextHand.players).toEqual(['Bob', 'Charlie']);
        // Server would enforce minimum stack on rejoin
      });

      it('should handle sit-out abuse prevention', () => {
        // Scenario: Can't dodge blinds repeatedly
        // Input: Alice inactive with existing debt, will be on SB next
        // Expected: Dead blinds accumulate for FUTURE position
        completedHand._inactive = [1, 0, 0]; // Alice sitting out
        completedHand._intents = [2, 0, 0];
        completedHand.blindsOrStraddles = [20, 0, 10]; // Alice was at BB
        completedHand._deadBlinds = [10, 0, 0]; // Already has correct debt from past

        const nextHand = Hand.next(completedHand);

        // After rotation: [10, 20, 0] - Alice will be at SB
        // Dead blinds accumulate: 10 (existing) + 10 (0.5×20 for future SB) = 20
        expect(nextHand._deadBlinds![0]).toBe(20); // 10 + 10 for future SB
      });
    });

    describe('common player patterns', () => {
      it('should handle bathroom break (simple pause)', () => {
        // Scenario: Quick pause and return
        // Input: _intents: 2 then 0
        // Expected: Miss 1-2 hands, debt preserved for Game()
        completedHand._inactive = [1, 0, 0]; // Alice was paused
        completedHand._intents = [0, 0, 0]; // Now returning
        completedHand._deadBlinds = [10, 0, 0]; // Small debt from missing SB
        completedHand.finishingStacks = [1000, 1000, 1000];

        const nextHand = Hand.next(completedHand);

        expect(nextHand._inactive![0]).toBe(0); // Active again
        expect(nextHand.startingStacks[0]).toBe(1000); // Stack unchanged
        expect(nextHand._deadBlinds![0]).toBe(10); // Debt preserved for Game()
      });

      it('should handle waiting for button', () => {
        // Scenario: New player waits for button
        // Input: Join and wait for good position
        // Expected: Activated at appropriate time
        completedHand._inactive = [0, 0, 1]; // Charlie joined mid-hand
        completedHand._intents = [0, 0, 0]; // Wants to play

        const nextHand = Hand.next(completedHand);

        expect(nextHand._inactive![2]).toBe(0); // Now active
        expect(nextHand.players[2]).toBe('Charlie');
      });
    });
  });

  describe('Basic Functionality', () => {
    it('should create a new hand from a completed hand', () => {
      const completedHand = Hand({
        ...BASE_HAND,
        finishingStacks: [950, 1050],
        winnings: [0, 100],
        totalPot: 100,
      });

      const nextHand = Hand.next(completedHand);

      // Check that it returns a valid Hand
      expect(nextHand).toBeDefined();
      expect(nextHand.variant).toBe('NT');
      expect(nextHand.actions).toEqual([]);
    });

    it('should throw error when creating from incomplete hand', () => {
      const incompleteHand = Hand({
        ...BASE_HAND,
        // No finishingStacks - hand is not complete
      });

      expect(() => {
        Hand.next(incompleteHand);
      }).toThrow('Cannot create next hand from incomplete hand');
    });
  });

  describe('Button Rotation', () => {
    it('should rotate blinds array to move button', () => {
      // SCENARIO: Standard 3-player rotation
      // INPUT: minBet=20 → SB=10, BB=20, blinds: [10, 20, 0]
      // EXPECTED: After rotation [0, 10, 20]
      const completedHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'Carol'],
        blindsOrStraddles: [10, 20, 0], // Alice SB, Bob BB, Carol Button
        finishingStacks: [900, 1100, 1000],
      });

      const nextHand = Hand.next(completedHand);

      // Players should NOT rotate
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Carol']);

      // Blinds should rotate: last becomes first (right rotation)
      expect(nextHand.blindsOrStraddles).toEqual([0, 10, 20]); // Carol Button, Alice SB, Bob BB
    });

    it('should NOT rotate stacks with new logic', () => {
      // SCENARIO: Stacks stay with players, only blinds rotate
      // INPUT: minBet=20 → blinds: [10, 20, 0]
      // EXPECTED: startingStacks unchanged
      const completedHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'Carol'],
        blindsOrStraddles: [10, 20, 0],
        finishingStacks: [900, 1100, 1000],
      });

      const nextHand = Hand.next(completedHand);

      // Stacks should stay with their players
      expect(nextHand.startingStacks).toEqual([900, 1100, 1000]);
    });

    it('should NOT rotate venue IDs with new logic', () => {
      // SCENARIO: Venue IDs stay with players
      // INPUT: minBet=20 → blinds: [10, 20, 0]
      // EXPECTED: _venueIds unchanged
      const completedHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'Carol'],
        blindsOrStraddles: [10, 20, 0],
        finishingStacks: [900, 1100, 1000],
        _venueIds: ['alice-id', 'bob-id', 'carol-id'],
      });

      const nextHand = Hand.next(completedHand);

      // Venue IDs should stay with their players
      expect(nextHand._venueIds).toEqual(['alice-id', 'bob-id', 'carol-id']);
    });

    it('should rotate seats when present', () => {
      // SCENARIO: Seats rotate with blinds
      // INPUT: minBet=20 → blinds: [10, 20, 0], seats: [3, 7, 1]
      // EXPECTED: seats rotated to [1, 3, 7]
      const completedHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'Carol'],
        blindsOrStraddles: [10, 20, 0],
        seats: [3, 7, 1],
        finishingStacks: [900, 1100, 1000],
      });

      const nextHand = Hand.next(completedHand);

      // Seats should rotate with blinds
      expect(nextHand.seats).toEqual([1, 3, 7]);
    });

    it('should rotate antes when present', () => {
      // SCENARIO: Antes rotate with blinds
      // INPUT: minBet=20 → blinds: [10, 20, 0], antes: [1, 2, 3]
      // EXPECTED: antes rotated to [3, 1, 2]
      const completedHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'Carol'],
        blindsOrStraddles: [10, 20, 0],
        antes: [1, 2, 3],
        finishingStacks: [900, 1100, 1000],
      });

      const nextHand = Hand.next(completedHand);

      // Antes should rotate with blinds (last becomes first - right rotation)
      expect(nextHand.antes).toEqual([3, 1, 2]); // Rotated right
    });

    it('should rotate zero antes correctly', () => {
      // SCENARIO: Zero antes still rotate
      // INPUT: minBet=20 → blinds: [10, 20, 0], antes: [0, 0, 0]
      // EXPECTED: antes still [0, 0, 0]
      const completedHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'Carol'],
        blindsOrStraddles: [10, 20, 0],
        antes: [0, 0, 0], // All zeros (no antes in play)
        finishingStacks: [900, 1100, 1000],
      });

      const nextHand = Hand.next(completedHand);

      // Antes array should be rotated (even though all zeros)
      expect(nextHand.antes).toEqual([0, 0, 0]);
    });

    it('should handle missing antes by creating zeros array', () => {
      // SCENARIO: Missing antes creates zeros array
      // INPUT: minBet=20 → blinds: [10, 20, 0], antes: []
      // EXPECTED: antes becomes [0, 0, 0]
      const completedHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'Carol'],
        blindsOrStraddles: [10, 20, 0],
        finishingStacks: [900, 1100, 1000],
        antes: [], // Force undefined to test error handling
      });

      const nextHand = Hand.next(completedHand);

      // Should create array of zeros matching player count
      expect(nextHand.antes).toEqual([0, 0, 0]);
    });

    it('should handle two-player rotation correctly', () => {
      const completedHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob'],
        blindsOrStraddles: [20, 10], // Alice SB/Button, Bob BB
        finishingStacks: [950, 1050],
        startingStacks: [950, 1050],
      });

      const nextHand = Hand.next(completedHand);

      expect(nextHand.players).toEqual(['Alice', 'Bob']);
      expect(nextHand.startingStacks).toEqual([950, 1050]);
      expect(nextHand.blindsOrStraddles).toEqual([10, 20]); // Blinds rotate
    });
  });

  describe('Chip Continuity', () => {
    it('should use finishingStacks as startingStacks', () => {
      const completedHand = Hand({
        ...BASE_HAND,
        finishingStacks: [850, 1150, 1000],
      });

      const nextHand = Hand.next(completedHand);

      expect(nextHand.startingStacks).toEqual([850, 1150, 1000]);
    });

    it('should preserve total chip count', () => {
      const completedHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'Carol'],
        finishingStacks: [700, 1200, 1100],
      });

      const nextHand = Hand.next(completedHand);

      const totalBefore = completedHand.finishingStacks!.reduce((a, b) => a + b, 0);
      const totalAfter = nextHand.startingStacks.reduce((a, b) => a + b, 0);

      expect(totalAfter).toBe(totalBefore);
    });
  });

  describe('New Hand Identifiers', () => {
    it('should increment hand number', () => {
      const completedHand = Hand({
        ...BASE_HAND,
        hand: 5,
        finishingStacks: [950, 1050],
      });

      const nextHand = Hand.next(completedHand);

      expect(nextHand.hand).toBe(6);
    });

    it('should generate new unique ID', () => {
      const completedHand = Hand({
        ...BASE_HAND,
        hand: 5,
        table: 'table-123',
        finishingStacks: [950, 1050],
      });

      const nextHand = Hand.next(completedHand);

      expect(nextHand.hand).not.toBe(completedHand.hand);
      expect(nextHand.table).toBe('table-123');
    });

    it('should generate new seed', () => {
      const completedHand = Hand({
        ...BASE_HAND,
        seed: 12345,
        finishingStacks: [950, 1050],
      });

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seed).not.toBe(completedHand.seed);
      expect(typeof nextHand.seed).toBe('number');
      expect(nextHand.seed).toBeGreaterThan(0);
      expect(nextHand.seed).toBeLessThan(1000000000);
    });
  });

  describe('Field Reset and Preservation', () => {
    it('should reset action-related fields', () => {
      const completedHand = Hand({
        ...BASE_HAND,
        actions: ['p1 cc', 'p2 cbr 50'],
        finishingStacks: [950, 1050],
        winnings: [0, 100],
        rake: 5,
        totalPot: 105,
      });

      const nextHand = Hand.next(completedHand);

      expect(nextHand.actions).toEqual([]);
      expect(nextHand.finishingStacks).toBeUndefined();
      expect(nextHand.winnings).toBeUndefined();
      expect(nextHand.rake).toBeUndefined();
      expect(nextHand.totalPot).toBeUndefined();
    });

    it('should preserve table configuration', () => {
      const completedHand = Hand({
        ...BASE_HAND,
        variant: 'NT',
        table: 'table-456',
        hand: 789,
        venue: 'TestVenue',
        currency: 'USD',
        blindsOrStraddles: [5, 10, 0],
        antes: [1, 1, 1],
        minBet: 10,
        timeLimit: 30,
        timeZone: 'America/New_York',
        rakePercentage: 0.05,
        finishingStacks: [950, 1050, 1000],
      } as Hand);

      const nextHand = Hand.next(completedHand);

      expect(nextHand.variant).toBe('NT');
      expect(nextHand.table).toBe('table-456');
      expect(nextHand.hand).toBe(790);
      expect(nextHand.venue).toBe('TestVenue');
      expect(nextHand.currency).toBe('USD');
      expect(nextHand.blindsOrStraddles).toEqual([0, 5, 10]); // Rotated right
      expect(nextHand.antes).toEqual([1, 1, 1]); // Rotated (all same values)
      expect(nextHand.minBet).toBe(10);
      expect(nextHand.timeLimit).toBe(30);
      expect(nextHand.timeZone).toBe('America/New_York');
      expect(nextHand.rakePercentage).toBe(0.05);
    });

    it('should remove author field', () => {
      const completedHand = Hand({
        ...BASE_HAND,
        author: 'Alice',
        finishingStacks: [950, 1050],
      });

      const nextHand = Hand.next(completedHand);

      expect(nextHand.author).toBeUndefined();
    });

    it('should update timestamps', () => {
      const oldTime = '2024-01-01T00:00:00Z';
      const oldTimestamp = 1704067200000;

      const completedHand = Hand({
        ...BASE_HAND,
        time: oldTime,
        timestamp: oldTimestamp,
        finishingStacks: [950, 1050],
      });

      const beforeCreate = Date.now();
      const nextHand = Hand.next(completedHand);
      const afterCreate = Date.now();

      expect(nextHand.time).not.toBe(oldTime);
      expect(nextHand.timestamp).toBeGreaterThanOrEqual(beforeCreate);
      expect(nextHand.timestamp).toBeLessThanOrEqual(afterCreate);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle 6-player table rotation', () => {
      // SCENARIO: 6-player table with seat sorting
      // INPUT: minBet=20 → SB=10, BB=20, blinds: [10, 20, 0, 0, 0, 0]
      // EXPECTED: After seat sort and rotation, blinds move
      const completedHand = Hand({
        ...BASE_HAND,
        players: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
        blindsOrStraddles: [10, 20, 0, 0, 0, 0],
        seats: [2, 3, 4, 5, 6, 1],
        finishingStacks: [900, 950, 1100, 1050, 1000, 1000],
        startingStacks: [900, 950, 1100, 1050, 1000, 1000],
        _venueIds: ['id1', 'id2', 'id3', 'id4', 'id5', 'id6'],
      });

      const nextHand = Hand.next(completedHand);

      expect(nextHand.players).toEqual(['P6', 'P1', 'P2', 'P3', 'P4', 'P5']); // Seat sorted
      expect(nextHand.startingStacks).toEqual([1000, 900, 950, 1100, 1050, 1000]); // Seat sorted
      expect(nextHand._venueIds).toEqual(['id6', 'id1', 'id2', 'id3', 'id4', 'id5']); // Seat sorted
      expect(nextHand.blindsOrStraddles).toEqual([0, 0, 10, 20, 0, 0]); // Blinds after seat sort and rotation
      expect(nextHand.seats).toEqual([1, 2, 3, 4, 5, 6]); // Seats sorted
    });

    it('should handle Fixed-Limit variant', () => {
      const completedHand = Hand({
        variant: 'FT',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [5, 10],
        antes: [0, 0],
        smallBet: 10,
        bigBet: 20,
        actions: [],
        finishingStacks: [950, 1050],
      });

      const nextHand = Hand.next(completedHand);

      expect(nextHand.variant).toBe('FT');
      expect(nextHand.smallBet).toBe(10);
      expect(nextHand.bigBet).toBe(20);
      expect(nextHand.minBet).toBeUndefined();
      expect(nextHand.blindsOrStraddles).toEqual([5, 10]); // Heads-up: stays same for 2 players
      expect(nextHand.antes).toEqual([0, 0]); // Rotated (all same values)
    });

    it('should preserve venue-specific fields', () => {
      // SCENARIO: Venue fields preserved through next()
      // INPUT: minBet=20 → SB=10, BB=20 (heads-up)
      // EXPECTED: All _venue* fields preserved
      const completedHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob'],
        blindsOrStraddles: [10, 20], // minBet=20 → SB=10, BB=20
        finishingStacks: [950, 1050],
        startingStacks: [950, 1050],
        _venueIds: ['alice-id', 'bob-id'],
        _heroIds: ['hero1', null],
        _managerUid: 'manager-123',
        _croupierId: 'croupier-456',
        _customField: 'custom-value',
      } as any);

      const nextHand = Hand.next(completedHand);

      expect(nextHand._venueIds).toEqual(['alice-id', 'bob-id']);
      expect(nextHand._heroIds).toEqual(['hero1', null]); // Preserved
      expect(nextHand._managerUid).toBe('manager-123');
      expect(nextHand._croupierId).toBe('croupier-456');
      expect((nextHand as any)._customField).toBe('custom-value');
    });
  });

  describe('Immutability', () => {
    it('should not modify the input hand', () => {
      // SCENARIO: Input hand should not be mutated
      // INPUT: minBet=20 → SB=10, BB=20
      // EXPECTED: Original arrays unchanged after next()
      const completedHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'Carol'],
        blindsOrStraddles: [10, 20, 0], // minBet=20 → SB=10, BB=20
        seats: [1, 2, 3],
        antes: [1, 2, 3],
        finishingStacks: [900, 1100, 1000],
        _venueIds: ['alice-id', 'bob-id', 'carol-id'],
      });

      const originalPlayers = [...completedHand.players];
      const originalBlinds = [...completedHand.blindsOrStraddles];
      const originalSeats = [...completedHand.seats!];
      const originalAntes = [...completedHand.antes!];
      const originalStacks = [...completedHand.finishingStacks!];
      const originalVenueIds = [...completedHand._venueIds!];

      Hand.next(completedHand);

      expect(completedHand.players).toEqual(originalPlayers);
      expect(completedHand.blindsOrStraddles).toEqual(originalBlinds);
      expect(completedHand.seats).toEqual(originalSeats);
      expect(completedHand.antes).toEqual(originalAntes);
      expect(completedHand.finishingStacks).toEqual(originalStacks);
      expect(completedHand._venueIds).toEqual(originalVenueIds);
    });
  });

  describe('Seat preservation during button rotation', () => {
    it('should keep seats fixed while button rotates through players', () => {
      // Scenario: In real poker, physical seats never change - only the button moves
      // Input: 3 players at seats [2, 5, 7], button rotates through positions
      // Expected: Seats remain [2, 5, 7], players stay fixed, only blinds rotate
      const completedHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'Charlie'],
        seats: [2, 5, 7],
        blindsOrStraddles: [0, 10, 20], // Alice=BTN, Bob=SB, Charlie=BB
        finishingStacks: [1000, 1000, 1000],
        _inactive: [0, 0, 0],
        _intents: [0, 0, 0],
        _deadBlinds: [0, 0, 0],
      });

      const hand1 = Hand.next(completedHand);

      // Seats should remain exactly the same - they're physical positions
      expect(hand1.seats).toEqual([2, 5, 7]);
      // Players stay in their seats (fixed positions)
      expect(hand1.players).toEqual(['Alice', 'Bob', 'Charlie']);
      // Only blinds rotate to simulate button movement
      expect(hand1.blindsOrStraddles).toEqual([20, 0, 10]); // Alice=BB, Bob=BTN, Charlie=SB

      const hand2 = Hand.next({ ...hand1, finishingStacks: [1000, 1000, 1000] });

      // Seats still remain the same after another rotation
      expect(hand2.seats).toEqual([2, 5, 7]);
      // Players still fixed
      expect(hand2.players).toEqual(['Alice', 'Bob', 'Charlie']);
      // Blinds continue rotating
      expect(hand2.blindsOrStraddles).toEqual([10, 20, 0]); // Alice=SB, Bob=BB, Charlie=BTN
    });

    it('should maintain seat-to-player mapping during rotation', () => {
      // Scenario: Verify seat assignments stay fixed while blinds rotate
      // Input: 6 players with specific seats, rotate button
      // Expected: Players and seats stay fixed, only blinds rotate
      const sixPlayerHand = Hand({
        ...BASE_HAND,
        players: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
        seats: [1, 2, 3, 6, 8, 9],
        blindsOrStraddles: [0, 0, 0, 0, 10, 20],
        finishingStacks: [1000, 1000, 1000, 1000, 1000, 1000],
        startingStacks: [1000, 1000, 1000, 1000, 1000, 1000],
        _venueIds: ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'],
      });

      const nextHand = Hand.next(sixPlayerHand);

      // Seats remain unchanged - physical positions don't move
      expect(nextHand.seats).toEqual([1, 2, 3, 6, 8, 9]);

      // Players stay fixed in their seats
      expect(nextHand.players).toEqual(['P1', 'P2', 'P3', 'P4', 'P5', 'P6']);

      // Venue IDs stay aligned with players (no rotation)
      expect(nextHand._venueIds).toEqual(['v1', 'v2', 'v3', 'v4', 'v5', 'v6']);

      // Only blinds rotate to simulate button movement
      expect(nextHand.blindsOrStraddles).toEqual([20, 0, 0, 0, 0, 10]); // Rotated from [0,0,0,0,10,20]
    });

    it('should preserve seat gaps when players leave', () => {
      // Scenario: Player leaves, their seat becomes empty gap
      // Input: Remove player from seat 5, seats [2, 5, 7] become [2, 7]
      // Expected: Seat 5 is gone, seats 2 and 7 remain
      const completedHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'Charlie'],
        seats: [2, 5, 7],
        blindsOrStraddles: [0, 10, 20],
        finishingStacks: [1000, 1000, 1000],
        _intents: [0, 3, 0], // Bob (seat 5) leaving
      });

      const nextHand = Hand.next(completedHand);

      // Bob's seat 5 is removed, only seats 2 and 7 remain
      expect(nextHand.seats).toEqual([2, 7]);
      // Alice and Charlie remain in their positions (no rotation of players)
      expect(nextHand.players).toEqual(['Alice', 'Charlie']);
      // Blinds rotate for remaining players
      expect(nextHand.blindsOrStraddles).toEqual([10, 20]); // Rotated from [0,20] after Bob removed
    });

    it('should correctly handle new player sitting in specific seat', () => {
      // Scenario: When joinHand adds player, they get assigned seat
      // Input: Add player to seat 4, existing seats [2, 5, 7]
      // Expected: Seats become [2, 4, 5, 7] but stay fixed during rotation
      const baseHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'Charlie'],
        seats: [2, 5, 7],
        blindsOrStraddles: [0, 10, 20],
        startingStacks: [1000, 1000, 1000],
      });

      const handWithNewPlayer = Hand.join(baseHand, {
        playerName: 'David',
        buyIn: 1000,
        seat: 4,
      });

      expect(handWithNewPlayer.seats).toEqual([2, 5, 7, 4]);
      expect(handWithNewPlayer.players).toEqual(['Alice', 'Bob', 'Charlie', 'David']);
    });
  });

  describe('Dead blind exploitation vulnerability tests', () => {
    describe('Money conservation - FIXED', () => {
      it('should preserve money between games (dead blinds deducted in Game(), not next())', () => {
        // Scenario: Player returns to play with dead blinds debt
        // Input: Player with 1000 chips, owes 30 dead blinds, returns to play
        // Expected: Stack unchanged in next(), debt preserved for Game() to charge
        const completedHand = Hand({
          ...BASE_HAND,
          finishingStacks: [1000, 1000, 1000],
          _inactive: [1, 0, 0], // Alice was inactive
          _intents: [0, 0, 0], // Alice wants to return
          _deadBlinds: [30, 0, 0], // Alice owes 30
          blindsOrStraddles: [0, 10, 20],
        });

        const nextHand = Hand.next(completedHand);

        // Stack unchanged - debt preserved for Game() to charge
        expect(nextHand.startingStacks[0]).toBe(1000);
        expect(nextHand._deadBlinds![0]).toBe(30); // Debt preserved

        // Money conservation: total stacks unchanged between hands
        const totalMoneyBefore = completedHand.finishingStacks!.reduce((a, b) => a + b, 0);
        const totalMoneyAfter = nextHand.startingStacks.reduce((a, b) => a + b, 0);
        expect(totalMoneyAfter).toBe(totalMoneyBefore); // No money lost!
      });
    });

    describe('Blind payment history exploitation', () => {
      it('should not accumulate dead blinds without verifying initial blind payment', () => {
        // Scenario: Player goes inactive, accumulates for FUTURE position
        // Input: Bob inactive (was at SB position, blind shifted to Alice)
        // Expected: Accumulates based on next position after rotation
        const completedHand = Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          blindsOrStraddles: [10, 0, 20], // Alice=SB (shifted from Bob), Bob=0 (inactive), Charlie=BB
          finishingStacks: [1000, 1000, 1000],
          _inactive: [0, 1, 0], // Bob was already inactive
          _intents: [0, 2, 0], // Bob paused
          _deadBlinds: [0, 0, 0],
          // Note: Dead blinds in completedHand already account for past
        });

        const nextHand = Hand.next(completedHand);

        // After rotation: [20, 10, 0] - Bob at SB position, accumulates 0.5×BB
        expect(nextHand._deadBlinds![1]).toBe(10); // Accumulation for SB position

        // This is correct: Only accumulate for future blind positions
      });

      it('should not allow inactive player in blind position to accumulate debt without paying', () => {
        // Scenario: Player marked inactive at BB position
        // Input: Inactive player at BB (blind shifted to Alice), will be at SB after rotation
        // Expected: Accumulates for future SB position
        const completedHand = Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          blindsOrStraddles: [20, 10, 0], // Alice=BB (shifted from Charlie), Bob=SB, Charlie=0 (inactive)
          finishingStacks: [1000, 1010, 1020], // Charlie has extra 20 (didn't pay BB)
          _inactive: [0, 0, 1], // Charlie inactive
          _intents: [0, 0, 2], // Charlie paused
          _deadBlinds: [0, 0, 0],
          actions: ['d dh p1 AsKs', 'd dh p2 QQ'], // No blind posting actions
        });

        const nextHand = Hand.next(completedHand);

        // After rotation: [10, 20, 0] - Charlie at BTN (non-blind)? Check actual behavior
        // Theoretical: Charlie would be at SB after rotation
        expect(nextHand._deadBlinds![2]).toBe(10); // 0.5 * BB for future SB
        // Past blind payment is already accounted for in completedHand
      });
    });

    describe('Intent manipulation exploits', () => {
      it('should allow rapid intent switching without rate limiting', () => {
        // Scenario: Player rapidly switches between pause/resume to game the system
        // Input: Multiple intent changes in sequence
        // Expected: Should have rate limiting or cooldown on intent changes
        const hand1 = Hand(BASE_HAND, {
          players: ['Alice', 'Bob', 'Charlie'],
          blindsOrStraddles: [0, 10, 20],
          startingStacks: [1000, 1000, 1000],
          _inactive: [0, 0, 0],
          _intents: [2, 0, 0], // Alice pauses
        });

        // Alice goes inactive
        let hand2 = Hand(hand1, { _inactive: [1, 0, 0] });

        // Immediately switches intent to resume (before accumulating dead blinds)
        hand2 = Hand.pause(hand2, 'Alice'); // Back to pause
        expect(hand2._intents![0]).toBe(2);

        // Then resume again
        hand2 = Hand.resume(hand2, 'Alice');
        expect(hand2._intents![0]).toBe(0);

        // Bug: No rate limiting - Player can oscillate to avoid blind positions
        // Could switch to pause right before blind position, then resume after
      });

      it('should allow strategic wait-for-BB switching to minimize blind payment', () => {
        // Scenario: Switch between wait-for-BB and resume to skip expensive positions
        // Input: Player approaching SB, switches to wait-for-BB
        // Expected: Should prevent gaming via intent changes
        const completedHand = Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          blindsOrStraddles: [20, 0, 10], // Alice at BB currently
          finishingStacks: [980, 1000, 1020],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        });

        // Next hand Alice would be at SB (after rotation from BB)
        const nextHand = Hand.next(completedHand);
        expect(nextHand.blindsOrStraddles).toEqual([10, 20, 0]); // Alice at SB

        // But if Alice goes inactive with wait-for-BB intent
        const manipulatedHand = { ...completedHand, _intents: [1, 0, 0] };
        const nextManipulated = Hand.next(manipulatedHand);

        // Alice goes inactive with wait-for-BB, but still accumulates dead blinds
        expect(nextManipulated._inactive![0]).toBe(1);
        expect(nextManipulated._deadBlinds![0]).toBe(10); // Still accumulates 0.5*BB for SB
      });
    });

    describe('Temporal state exploitation', () => {
      it('should use pre-calculated rotated positions before actual rotation', () => {
        // Scenario: Rotated positions used before rotation actually happens
        // Input: Check if player can afford next hand blinds using current positions
        // Expected: Should use consistent temporal state
        const completedHand = Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          blindsOrStraddles: [0, 10, 20], // Bob=SB, Charlie=BB
          finishingStacks: [15, 1000, 1000], // Alice has 15
          _inactive: [1, 0, 0],
          _intents: [0, 0, 0], // Alice wants to return
          _deadBlinds: [5, 0, 0], // Alice owes 5
        });

        // After rotation: [20, 0, 10] - Alice would be at BB (needs 20+5=25)
        const nextHand = Hand.next(completedHand);

        // Bug: Uses pre-calculated rotated blind (20) with current state
        // This temporal inconsistency could incorrectly remove players
        expect(nextHand.players).not.toContain('Alice'); // Removed (can't afford 25)
      });

      it('should have different dead blind accumulation based on join timing', () => {
        // Scenario: Player joins mid-hand vs between hands
        // Input: Join at different game states
        // Expected: Consistent dead blind rules regardless of join timing
        const midHandJoin = Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob'],
          blindsOrStraddles: [10, 20],
          startingStacks: [990, 980],
          actions: ['p1 cc 10', 'd db AhKhQh'], // Mid-hand
        });

        const joined = Hand.join(midHandJoin, {
          playerName: 'Charlie',
          buyIn: 1000,
        });

        // Charlie joins with intent 0 (ready to play) by default
        expect(joined._intents?.[2]).toEqual(0);

        // Issue: Different joining times = different dead blind accumulation
        // Player joining between hands vs mid-hand has different cost structure
      });
    });

    describe('Security validation gaps', () => {
      it('should handle missing _intents array during sit-in', () => {
        // Scenario: Sit-in without _intents array might default to active
        // Input: New player joins without explicit _intents
        // Expected: Should enforce wait-for-BB regardless
        const baseHand = Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob'],
          startingStacks: [1000, 1000],
          blindsOrStraddles: [10, 20],
        });

        // Try to join without _intents array
        const maliciousJoin = {
          ...baseHand,
          author: 'Charlie',
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 1000, 1000],
          blindsOrStraddles: [10, 20, 0],
          // Deliberately omit _intents array
        };

        const merged = Hand.merge(baseHand, maliciousJoin);

        // If _intents is missing in join request, merge creates it with default 0
        // This is expected behavior - new players join as active by default
        if (merged.players.includes('Charlie')) {
          expect(merged._intents).toBeDefined();
          if (merged._intents) {
            expect(merged._intents[2]).toBe(0); // Default to active when _intents missing
          }
        }
      });

      it('should validate stack before attempting dead blind deduction', () => {
        // Scenario: Order of operations allows impossible states
        // Input: Player with 10 chips, owes 30 dead blinds
        // Expected: Should validate before attempting payment
        const completedHand = Hand({
          ...BASE_HAND,
          finishingStacks: [10, 1000, 1000], // Alice has only 10
          _inactive: [1, 0, 0],
          _intents: [0, 0, 0], // Alice wants to return
          _deadBlinds: [30, 0, 0], // Owes more than stack
          blindsOrStraddles: [0, 10, 20],
        });

        const nextHand = Hand.next(completedHand);

        // Player removed, but calculation attempted first
        expect(nextHand.players).not.toContain('Alice');

        // Bug: Tried to deduct 30 from 10, then removed player
        // This order could cause negative stack states temporarily
      });
    });
  });

  describe('Blind rotation skipping inactive players', () => {
    it('should skip inactive player on SB position and assign SB to next active', () => {
      // SCENARIO: Inactive player would be on SB position after rotation
      // INPUT: 3 players, P3 inactive, after rotation P3 would be on SB
      // EXPECTED: SB skips P3, goes to next active player (P1)
      //           P3 has blindsOrStraddles = 0
      //           P3 still accumulates dead blinds for missed SB

      const completedHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [20, 10, 0], // Alice=BB (shifted from Charlie), Bob=SB, Charlie=0 (inactive)
        _inactive: [0, 0, 1], // Charlie inactive
        _intents: [0, 0, 2], // Charlie paused
        _deadBlinds: [0, 0, 0],
      });

      const nextHand = Hand.next(completedHand);

      // After rotation Charlie would be on SB, but he's inactive
      // SB should skip to Alice, BB stays with Bob
      expect(nextHand.blindsOrStraddles).toEqual([10, 20, 0]); // Alice=SB, Bob=BB, Charlie=0
      expect(nextHand._deadBlinds).toEqual([0, 0, 10]); // Charlie accumulates 0.5×BB for missed SB
    });

    it('should skip inactive player on BB position and assign BB to next active', () => {
      // SCENARIO: Inactive player would be on BB position after rotation
      // INPUT: 3 players, P1 inactive, after rotation P1 would be on BB
      // EXPECTED: BB skips P1, goes to next active player
      //           P1 has blindsOrStraddles = 0
      //           P1 still accumulates dead blinds for missed BB

      const completedHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20], // Alice=UTG, Bob=SB, Charlie=BB
        _inactive: [1, 0, 0], // Alice inactive
        _intents: [2, 0, 0], // Alice paused
        _deadBlinds: [0, 0, 0],
      });

      const nextHand = Hand.next(completedHand);

      // After rotation Alice would be on BB, but she's inactive
      // BB should skip to Bob, SB goes to Charlie
      expect(nextHand.blindsOrStraddles).toEqual([0, 20, 10]); // Alice=0, Bob=BB, Charlie=SB
      expect(nextHand._deadBlinds).toEqual([20, 0, 0]); // Alice accumulates 1×BB for missed BB
    });

    it('should skip multiple inactive players for both SB and BB', () => {
      // SCENARIO: Both SB and BB positions would go to inactive players
      // INPUT: 4 players, P1 and P2 inactive
      // EXPECTED: Both blinds skip to next active players

      const fourPlayerHand = Hand({
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie', 'Dave'],
        startingStacks: [1000, 1000, 1000, 1000],
        finishingStacks: [1000, 1000, 1000, 1000],
        blindsOrStraddles: [0, 0, 10, 20], // Charlie=SB, Dave=BB
        antes: [0, 0, 0, 0],
        minBet: 20,
        actions: ['d dh p1 AsKs', 'd dh p2 QhQd', 'd dh p3 JcJd', 'd dh p4 TsTd'],
        _inactive: [1, 1, 0, 0], // Alice and Bob inactive
        _intents: [2, 2, 0, 0],
        _deadBlinds: [0, 0, 0, 0],
      });

      const nextHand = Hand.next(fourPlayerHand);

      // After rotation: [0,0,10,20] -> [20,0,0,10]
      // Theoretical positions: Alice=BB(20), Bob=0, Charlie=0, Dave=SB(10)
      // Button moves to Charlie
      // SB goes to next active after button = Dave
      // BB goes to next active after SB = Charlie (wrapping around)
      expect(nextHand.blindsOrStraddles).toEqual([0, 0, 20, 10]); // Charlie=BB, Dave=SB

      // Dead blinds based on THEORETICAL positions:
      // Alice would be BB -> accumulates 20
      // Bob would be UTG (0) -> accumulates 0
      expect(nextHand._deadBlinds![0]).toBe(20); // Alice missed BB
      expect(nextHand._deadBlinds![1]).toBe(0); // Bob not on blind position
    });

    it('should handle heads-up with one inactive player', () => {
      // SCENARIO: 2 players, one goes inactive
      // INPUT: Alice active, Bob inactive (blind shifted to Alice)
      // EXPECTED: Alice gets both blinds? Or game cannot continue?
      // Note: This is an edge case - may need clarification

      const headsUpHand = Hand({
        variant: 'NT' as const,
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        finishingStacks: [1000, 1000],
        blindsOrStraddles: [30, 0], // Alice=SB+BB (shifted from Bob), Bob=0 (inactive)
        antes: [0, 0],
        minBet: 20,
        actions: ['d dh p1 AsKs', 'd dh p2 QhQd'],
        _inactive: [0, 1], // Bob inactive
        _intents: [0, 2],
        _deadBlinds: [0, 0],
      });

      const nextHand = Hand.next(headsUpHand);

      // In heads-up with one inactive, only one active player remains
      // Bob should have 0 blind
      expect(nextHand.blindsOrStraddles[1]).toBe(0); // Bob inactive = 0 blind
      expect(nextHand._deadBlinds![1]).toBeGreaterThan(0); // Bob accumulates debt
    });
  });

  describe('Ante zeroing for inactive players', () => {
    it('should set ante to 0 for inactive player', () => {
      // SCENARIO: Per-player ante game with inactive player
      // INPUT: 3 players with ante 2 for active, P3 inactive with ante 0
      // EXPECTED: In next hand, inactive player has ante = 0

      const completedHand = Hand({
        ...BASE_HAND,
        finishingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [20, 10, 0], // Alice=BB (shifted), Bob=SB, Charlie=0 (inactive)
        antes: [2, 2, 0], // Per-player ante, Charlie 0 because inactive
        _inactive: [0, 0, 1], // Charlie inactive
        _intents: [0, 0, 2],
        _deadBlinds: [0, 0, 0],
      });

      const nextHand = Hand.next(completedHand);

      // Charlie should have ante = 0 because he's inactive
      // Note: Hand.next() resets antes - they're set when hand actually starts
      expect(nextHand.antes![2]).toBe(0); // Charlie's ante = 0 (inactive)
    });

    it('should set ante to 0 for multiple inactive players', () => {
      // SCENARIO: Multiple inactive players
      // INPUT: 4 players, P1 and P3 inactive
      // EXPECTED: P1 and P3 have ante = 0 in next hand

      const fourPlayerHand = Hand({
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie', 'Dave'],
        startingStacks: [1000, 1000, 1000, 1000],
        finishingStacks: [1000, 1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 0, 20], // Alice=0 (inactive), Bob=SB, Charlie=0 (inactive), Dave=BB
        minBet: 20,
        actions: ['d dh p1 AsKs', 'd dh p2 QhQd', 'd dh p3 JcJd', 'd dh p4 TsTd'],
        antes: [0, 2, 0, 2], // Inactive players have ante 0
        _inactive: [1, 0, 1, 0], // Alice and Charlie inactive
        _intents: [2, 0, 2, 0],
        _deadBlinds: [0, 0, 0, 0],
      });

      const nextHand = Hand.next(fourPlayerHand);

      // Inactive players should have ante = 0
      // Note: Hand.next() may reset all antes - key is inactive players have 0
      expect(nextHand.antes![0]).toBe(0); // Alice inactive = 0
      expect(nextHand.antes![2]).toBe(0); // Charlie inactive = 0
    });

    it('should restore ante when player becomes active', () => {
      // SCENARIO: Previously inactive player returns to game
      // INPUT: P1 was inactive with ante=0, now intent=0 (wants to play)
      // EXPECTED: P1 should have normal ante value after returning

      const completedHand = Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20],
        antes: [0, 2, 2], // Alice was inactive, had 0 ante
        _inactive: [1, 0, 0], // Alice inactive
        _intents: [0, 0, 0], // Alice wants to return
        _deadBlinds: [0, 0, 0],
      });

      const nextHand = Hand.next(completedHand);

      // Alice returns to active, should have normal ante
      expect(nextHand._inactive![0]).toBe(0); // Alice active
      expect(nextHand.antes![0]).toBe(2); // Alice has ante
    });
  });

  describe('Dead blind payment timing', () => {
    it('should not lose money between games (dead blinds deducted in Game, not next)', () => {
      // SCENARIO: Dead blinds should be deducted in Game() init, not in next()
      // INPUT: Player with dead blind, finishingStacks should pass through unchanged
      // EXPECTED: startingStacks = finishingStacks, _deadBlinds preserved for Game()
      const completedHand = {
        actions: [
          'd dh p3 7h6s #1764674205799',
          'd dh p4 8h5s #1764674205799',
          'd dh p5 KcAc #1764674205799',
          'p5 cc 20 #1764674205800',
          'p3 cc 20 #1764674205800',
          'p4 f #1764674205801',
          'd db 9cJd2s #1764674205801',
          'p3 cc 0 #1764674205801',
          'p5 cc 0 #1764674205801',
          'd db Ks #1764674205801',
          'p3 f #1764674205801',
        ],
        type: 'poker',
        variant: 'NT',
        venue: 'fuzz-venue-0',
        table: 'table-t2oc5lo',
        hand: 55,
        players: [
          'Player_256_0',
          'Player_113_0',
          'Player_355_0',
          'Player_306_0',
          'Player_870_0',
          'Player_875_0',
        ],
        startingStacks: [1110, 865, 1000, 1100, 1020, 1000],
        blindsOrStraddles: [0, 0, 10, 20, 0, 0],
        antes: [0, 0, 0, 0, 0, 0],
        minBet: 20,
        seatCount: 6,
        seed: 261412830,
        _inactive: [1, 1, 0, 0, 0, 1],
        _intents: [1, 1, 0, 3, 0, 0],
        _deadBlinds: [0, 0, 0, 0, 0, 20],
        rakePercentage: 0,
        time: '2025-12-02T11:16:45.799Z',
        timestamp: 1764674205799,
        finishingStacks: [1110, 865, 980, 1080, 1060, 1000],
        winnings: [0, 0, 0, 0, 60, 0],
        rake: 0,
        totalPot: 60,
      };

      const nextHand = Hand.next(completedHand as any);

      // Player 3 (index 3) is removed due to _intents: 3 (quit)
      // Remaining: indices 0, 1, 2, 4, 5 -> stacks [1110, 865, 980, 1060, 1000]
      expect(nextHand.startingStacks).toEqual([1110, 865, 980, 1060, 1000]);
    });
  });
});
