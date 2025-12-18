import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as Poker from '../../../index';
import { BASE_HAND } from './fixtures/baseHand';

/**
 * Data Transformation Tests for Hand API
 *
 * Purpose: Test Hand methods that transform data structures:
 * 1. merge - Intelligently merges two hand states, combining actions
 * 2. isEqual - Compares hands for equality using deep JSON comparison
 * 3. personalize - Returns hand from specific player's perspective
 *
 * Uses BASE_HAND as reference
 */
describe('Hand Data Transformation', () => {
  beforeEach(() => {
    // Mock system time for consistent timestamp testing
    vi.setSystemTime(new Date(1715616000000));
  });

  afterEach(() => {
    // Restore real time after each test
    vi.useRealTimers();
  });
  describe('Hand.merge', () => {
    // Core hole card processing tests
    it('should preserve known cards over hidden cards', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['d dh p1 AsKs', 'd dh p2 ????', 'p1 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Bob', // Bob is p2
        actions: ['d dh p1 ????', 'd dh p2 QhQd', 'p1 cc', 'p2 f'],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should preserve known cards from both hands
      expect(merged.actions[0]).toBe('d dh p1 AsKs');
      expect(merged.actions[1]).toBe('d dh p2 QhQd');
      expect(merged.actions[2]).toBe('p1 cc');
      expect(merged.actions[3]).toBe('p2 f #1715616000000'); // Bob's action gets timestamp
      expect(merged.author).toBeUndefined();
      expect(merged.actions).toEqual([
        'd dh p1 AsKs',
        'd dh p2 QhQd',
        'p1 cc',
        'p2 f #1715616000000',
      ]);
    });

    it('should handle sorted card comparison for hole cards', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['d dh p1 KsAs'], // Cards in one order
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice', // Alice is p1
        actions: ['d dh p1 AsKs'], // Same cards, different order
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should recognize as same cards after sorting
      expect(merged.actions).toEqual(['d dh p1 KsAs']);
    });

    // Dealer action validation tests
    it('should reject dealer hole actions in remaining without allowUnsafeMerge', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc', 'p2 f'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc', 'p2 f', 'd dh p3 AsKs'],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should reject and return hand1
      expect(merged).toEqual(hand1);
    });

    it('should reject dealer board actions in remaining without allowUnsafeMerge', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc', 'p2 f'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc', 'p2 f', 'd db AhKhQd'],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should reject and return hand1
      expect(merged).toEqual(hand1);
    });

    it('should allow dealer actions with allowUnsafeMerge=true', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc', 'd dh p2 AsKs', 'd db AhKhQd'],
      });

      const merged = Poker.Hand.merge(hand1, hand2, true);

      expect(merged.actions).toEqual(['p1 cc', 'd dh p2 AsKs', 'd db AhKhQd']);
    });

    it('should process multiple hole cards correctly', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['d dh p1 ????', 'd dh p2 JhJd', 'd dh p3 ????', 'p1 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        actions: ['d dh p1 AsKs', 'd dh p2 ????', 'd dh p3 QhQd', 'p1 cc', 'p2 f'],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      expect(merged.actions[0]).toBe('d dh p1 AsKs'); // From hand2
      expect(merged.actions[1]).toBe('d dh p2 JhJd'); // From hand1
      expect(merged.actions[2]).toBe('d dh p3 QhQd'); // From hand2
      expect(merged.actions[3]).toBe('p1 cc');
    });

    it('should handle hole cards with empty card specification', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['d dh p1', 'p1 cc'], // No cards specified
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Bob',
        actions: ['d dh p1 AsKs', 'p1 cc', 'p2 f'],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should use cards from hand2
      expect(merged.actions[0]).toBe('d dh p1 AsKs');
      expect(merged.actions[1]).toBe('p1 cc');
      expect(merged.author).toBeUndefined();
      expect(merged.actions).toEqual(['d dh p1 AsKs', 'p1 cc', 'p2 f #1715616000000']); // Bob's action gets timestamp
    });

    // Edge cases and special scenarios
    it('should handle different hand numbers by rejecting merge', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        hand: 5,
        actions: ['p1 f', 'p2 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        hand: 3,
        actions: ['p1 cbr 100', 'p2 f'],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should return hand1 unchanged due to incompatible hand numbers
      expect(merged).toEqual(hand1);
      expect(merged.hand).toBe(5);
      expect(merged.actions).toEqual(['p1 f', 'p2 cc']);
    });

    it('should allow non-dealer actions in remaining', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice',
        actions: ['p1 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Bob',
        actions: ['p1 cc', 'p2 cbr 100'], // Bob actions
      });

      let mergedHand = Poker.Hand.merge(hand1, hand2);

      const hand3 = Poker.Hand({
        ...BASE_HAND,
        author: 'Charlie',
        actions: ['p1 cc', 'p2 cbr 100', 'p2 m "GL HF"', 'p3 f'], // Charlie actions
      });

      mergedHand = Poker.Hand.merge(hand2, hand3);

      // Should allow merge with regular actions
      expect(mergedHand.actions).toEqual([
        'p1 cc',
        'p2 cbr 100',
        'p2 m "GL HF"',
        'p3 f #1715616000000',
      ]); // Charlie's action gets timestamp
    });

    it('should handle empty actions arrays', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: [],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        actions: [],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      expect(merged.actions).toEqual([]);
    });

    it('should merge when hand1 has empty actions', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: [],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice',
        actions: ['p1 f'],
      });

      let mergedHand = Poker.Hand.merge(hand1, hand2);

      const hand3 = Poker.Hand({
        ...BASE_HAND,
        author: 'Bob',
        actions: ['p1 f', 'p2 cc'],
      });

      mergedHand = Poker.Hand.merge(mergedHand, hand3);
      expect(mergedHand.actions).toEqual(['p1 f #1715616000000', 'p2 cc #1715616000000']); // Both actions have timestamps
    });

    it('should merge when hand2 has empty actions', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cbr 50', 'p2 f'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        actions: [],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      expect(merged.actions).toEqual(['p1 cbr 50', 'p2 f']);
    });

    it('should handle complex real-world merge with dealer actions', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['d dh p1 AsKs', 'd dh p2 ????', 'p1 cc', 'p2 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        actions: [
          'd dh p1 ????',
          'd dh p2 QhQd',
          'p1 cc',
          'p2 cc',
          'p3 f',
          'd db AhKhQd', // Board cards in remaining
        ],
      });

      // Without allowUnsafeMerge - should reject due to board cards
      const merged1 = Poker.Hand.merge(hand1, hand2);
      expect(merged1).toMatchObject({
        ...hand1,
        author: undefined,
        actions: ['d dh p1 AsKs', 'd dh p2 QhQd', 'p1 cc', 'p2 cc'],
      });

      // With allowUnsafeMerge
      const merged2 = Poker.Hand.merge(hand1, hand2, true);
      expect(merged2.actions).toEqual([
        'd dh p1 AsKs',
        'd dh p2 QhQd',
        'p1 cc',
        'p2 cc',
        'p3 f',
        'd db AhKhQd',
      ]);
    });

    it('should handle hole cards with sorted comparison', () => {
      // Cards in different order but same cards
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['d dh p1 KsAs'], // Cards in one order
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        actions: ['d dh p1 AsKs'], // Same cards, different order
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should recognize as same cards after sorting
      expect(merged.actions).toEqual(['d dh p1 KsAs']); // Keeps hand1's order
    });

    it('should handle multiple hole card actions for different players', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['d dh p1 ????', 'd dh p2 QhQd', 'd dh p3 ????', 'p1 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Bob',
        actions: ['d dh p1 AsKs', 'd dh p2 ????', 'd dh p3 JhJd', 'p1 cc', 'p2 f'],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should merge hole cards preserving visibility
      expect(merged.actions[0]).toBe('d dh p1 AsKs');
      expect(merged.actions[1]).toBe('d dh p2 QhQd');
      expect(merged.actions[2]).toBe('d dh p3 JhJd');
      expect(merged.actions[3]).toBe('p1 cc');
      expect(merged.actions[4]).toBe('p2 f #1715616000000'); // Bob's action gets timestamp
    });

    it('should always remove author field from merged result', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 f'],
        author: 'Alice',
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 f', 'p2 cc'],
        author: 'Bob',
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Author should always be undefined in merged result
      expect(merged.author).toBeUndefined();
      expect(merged.actions).toEqual(['p1 f', 'p2 cc #1715616000000']); // Bob's action gets timestamp
    });

    it('should reject merge when structural fields differ', () => {
      // Different _venueIds
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        _venueIds: ['id1', 'id2', 'id3'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        _venueIds: ['id1', 'id2', 'id4'], // Different ID
      });

      const merged = Poker.Hand.merge(hand1, hand2);
      expect(merged).toEqual(hand1);

      // Different antes
      const hand3 = Poker.Hand({
        ...BASE_HAND,
        antes: [5, 5, 5],
      });

      const hand4 = Poker.Hand({
        ...BASE_HAND,
        antes: [10, 10, 10],
      });

      const merged2 = Poker.Hand.merge(hand3, hand4);
      expect(merged2).toEqual(hand3);
    });

    it('should handle empty hole card slots correctly', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: [
          'd dh p1', // No cards specified
          'p1 cc',
        ],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Bob',
        actions: ['d dh p1 AsKs', 'p1 cc', 'p2 f'],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should use cards from hand2
      expect(merged.actions[0]).toBe('d dh p1 AsKs');
      expect(merged.actions[1]).toBe('p1 cc');
      expect(merged.actions[2]).toBe('p2 f #1715616000000'); // Bob's action gets timestamp
    });

    it('should handle stud variant merging correctly', () => {
      const hand1 = Poker.Hand({
        variant: 'F7S',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [0, 0],
        smallBet: 10,
        bigBet: 20,
        bringIn: 5,
        actions: ['p1 cc'],
        antes: [0, 0],
      });

      const hand2 = Poker.Hand({
        variant: 'F7S',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [0, 0],
        smallBet: 10,
        bigBet: 20,
        bringIn: 10, // Different bring-in
        actions: ['p1 cc', 'p2 cbr 20'],
        antes: [0, 0],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should reject due to different bringIn
      expect(merged).toEqual(hand1);
    });
  });

  describe('Hand.merge security tests (Action Diff Security - Step 6)', () => {
    it('should reject actions from non-author players in diff', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc', 'p2 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice', // Alice is p1
        actions: [
          'p1 cc',
          'p2 cc',
          'p2 cbr 100', // Bob's action, but Alice is author
          'p3 f', // Charlie's action, but Alice is author
        ],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should reject because Alice (p1) cannot submit actions for p2 and p3
      expect(merged).toEqual(hand1);
      expect(merged.actions).toEqual(['p1 cc', 'p2 cc']);
    });

    it('should allow only author actions in diff', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc', 'p2 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Bob', // Bob is p2
        actions: [
          'p1 cc',
          'p2 cc',
          'p3 cc', // Charlie's action
          'p1 cbr 100', // Alice's action
          'p2 cbr 200', // Bob's action - should be allowed
        ],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should reject because Bob (p2) cannot submit actions for p1 and p3
      expect(merged).toEqual(hand1);
      expect(merged.actions).toEqual(['p1 cc', 'p2 cc']);
    });

    it('should allow messages from any player in diff', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc', 'p2 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice', // Alice is p1
        actions: [
          'p1 cc',
          'p2 cc',
          'p2 m "Good luck!"', // Message from Bob
          'p3 m "Have fun!"', // Message from Charlie
          'p1 cbr 100', // Alice's action
        ],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Messages should be allowed even from non-author players
      expect(merged.actions).toEqual([
        'p1 cc',
        'p2 cc',
        'p2 m "Good luck!"',
        'p3 m "Have fun!"',
        'p1 cbr 100 #1715616000000', // Alice's action gets timestamp
      ]);
      expect(merged.author).toBeUndefined();
    });

    it('should prevent impersonation attempts', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc', 'p2 cc', 'p3 cc'],
      });

      // Alice tries to impersonate Bob
      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice', // Alice is p1
        actions: [
          'p1 cc',
          'p2 cc',
          'p3 cc',
          'p2 cbr 100', // Trying to act as Bob
        ],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should reject impersonation attempt
      expect(merged).toEqual(hand1);
      expect(merged.actions).not.toContain('p2 cbr 100');
    });

    it('should handle author index correctly when author is not first player', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Charlie', // Charlie is p3 (index 2)
        actions: [
          'p1 cc',
          'p3 cc', // Charlie's action
          'p1 cbr 100', // Alice's action - causes rejection of all remaining
        ],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should reject all remaining actions because there's a non-author action
      expect(merged.actions).toEqual(['p1 cc']);
    });

    it('should reject all non-author actions except messages', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Bob', // Bob is p2
        actions: [
          'p1 cc',
          'p1 cbr 100', // Alice's action - causes rejection of all remaining
          'p2 cbr 200', // Bob's action
          'p3 f', // Charlie's action
          'p1 m "Nice!"', // Message from Alice
          'p3 m "GG"', // Message from Charlie
        ],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should reject all remaining actions because there's a non-author non-message action
      expect(merged.actions).toEqual(['p1 cc']);
    });

    it('should handle undefined author (server state)', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: undefined, // No author (server state)
        actions: ['p1 cc', 'p2 cc', 'p3 f'],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // When author is undefined, getAuthorPlayerIndex returns -1
      // This means no player matches, so non-message actions are rejected
      expect(merged).toEqual(hand1);
    });

    it('should not allow author actions with allowUnsafeMerge even with other players actions', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice',
        actions: [
          'p1 cc',
          'p2 cc', // Bob's action
          'p3 f', // Charlie's action
          'p1 cbr 100', // Alice's action
        ],
      });

      const merged = Poker.Hand.merge(hand1, hand2, true);

      // With allowUnsafeMerge, all actions should be accepted
      expect(merged.actions).toEqual(hand1.actions);
    });

    it('should ensure author field manipulation prevention', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc'],
        author: 'Bob', // Old hand has Bob as author
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice', // New hand claims Alice as author
        actions: [
          'p1 cc',
          'p2 cc', // Bob's action - causes rejection of all remaining
          'p1 cbr 100', // Alice's action
        ],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Author field should always be removed from result
      expect(merged.author).toBeUndefined();

      // Should reject all remaining because there's a non-author action
      expect(merged.actions).toEqual(['p1 cc']);
    });

    it('should handle missing author in new hand', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        // No author field
        actions: ['p1 cc', 'p2 cc', 'p3 f'],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Without author, no player actions should be added (getAuthorPlayerIndex returns -1)
      expect(merged).toEqual(hand1);
    });

    it('should handle author not in players list', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'David', // Not in players list
        actions: ['p1 cc', 'p2 cc'],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Author not in players means getAuthorPlayerIndex returns -1
      expect(merged).toEqual(hand1);
    });

    it('should handle combined attack vectors', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc', 'p2 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice',
        actions: [
          'p1 cc',
          'p2 cc',
          'p2 cbr 100', // Impersonation attempt
          'd db AhKhQd', // Dealer action attempt
          'p3 f', // Another impersonation
          'p1 cbr 200', // Valid author action
        ],
      });

      // Without allowUnsafeMerge - should block both attacks
      const merged1 = Poker.Hand.merge(hand1, hand2);
      expect(merged1).toEqual(hand1);

      // With allowUnsafeMerge - should not allow merge with author even with allowUnsafeMerge is true
      const merged2 = Poker.Hand.merge(hand1, hand2, true);
      expect(merged2).toEqual(hand1);
    });

    it('should allow complex valid merge scenario', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['d dh p1 ????', 'd dh p2 ????', 'p1 cc', 'p2 cc'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Charlie',
        actions: [
          'd dh p1 AsKs', // Revealing cards
          'd dh p2 QhQd', // Revealing cards
          'p1 cc',
          'p2 cc',
          'p3 cbr 100', // Charlie's valid action
          'p1 m "Nice bet!"', // Message from Alice
          'p2 m "Thinking..."', // Message from Bob
        ],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should merge cards, Charlie's action, and all messages
      expect(merged.actions).toEqual([
        'd dh p1 AsKs',
        'd dh p2 QhQd',
        'p1 cc',
        'p2 cc',
        'p3 cbr 100',
        'p1 m "Nice bet!"',
        'p2 m "Thinking..." #1715616000000', // Last action gets timestamp (messages don't prevent timestamp)
      ]);
      expect(merged.author).toBeUndefined();
    });
  });

  describe('Hand.merge action sequence validation edge cases', () => {
    it('should reject when newHand has fewer actions than oldHand', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc', 'p2 cc', 'p3 f', 'p1 cbr 100'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice',
        actions: ['p1 cc', 'p2 cc'], // Shorter sequence
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should return oldHand unchanged when newHand is shorter
      expect(merged).toEqual(hand1);
      expect(merged.actions.length).toBe(4);
    });

    it('should handle prefix length edge case in getCommonActions', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc', 'p2 cc', 'p3 f'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Bob',
        actions: ['p1 cc', 'p2 cc'], // Shorter than hand1
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // When prefixLen <= oldActions.length, getCommonActions returns oldActions
      expect(merged).toEqual(hand1);
      expect(merged.actions).toEqual(['p1 cc', 'p2 cc', 'p3 f']);
    });

    it('should reject when actions diverge in the middle', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: ['p1 cc', 'p2 cc', 'p3 f'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Bob',
        actions: ['p1 cc', 'p2 f', 'p3 cc'], // Different from position 1
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should return oldHand when sequences diverge
      expect(merged).toEqual(hand1);
    });

    it('should handle exact same action sequences', () => {
      const actions = ['p1 cc', 'p2 cc', 'p3 f', 'd db AhKhQd'];
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: [...actions],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice',
        actions: [...actions],
      });

      const merged = Poker.Hand.merge(hand1, hand2);

      // Should return same actions but without author
      expect(merged.actions).toEqual(actions);
      expect(merged.author).toBeUndefined();
    });
  });

  describe('Hand.merge real-world game progression', () => {
    it('should build complete game from empty to finished using only merge()', () => {
      // Start with empty game
      let gameState = Poker.Hand({
        ...BASE_HAND,
        actions: [],
      });

      // Step 1: Dealer deals hole cards (server/dealer action with allowUnsafeMerge)
      const dealHoleCards = Poker.Hand({
        ...BASE_HAND,
        author: undefined, // Server has no author
        actions: [
          'd dh p1 6c5h #1756734331690',
          'd dh p2 Jc2s #1756734331691',
          'd dh p3 Tc3c #1756734331691',
        ],
      });
      gameState = Poker.Hand.merge(gameState, dealHoleCards, true);
      expect(gameState.actions.length).toBe(3);
      expect(Poker.Hand.isComplete(gameState)).toBe(false);

      // Step 2: Alice calls
      const aliceCall1 = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice',
        actions: [
          'd dh p1 6c5h #1756734331690',
          'd dh p2 ???? #1756734331691', // Alice doesn't know Bob's cards
          'd dh p3 ???? #1756734331691', // Alice doesn't know Charlie's cards
          'p1 cc #1756734331691',
        ],
      });
      gameState = Poker.Hand.merge(gameState, aliceCall1);
      expect(gameState.actions.length).toBe(4);
      expect(gameState.actions[3]).toBe('p1 cc #1715616000000'); // Timestamp gets replaced with mocked time

      // Step 3: Bob calls
      const bobCall1 = Poker.Hand({
        ...BASE_HAND,
        author: 'Bob',
        actions: [
          'd dh p1 ???? #1756734331690',
          'd dh p2 Jc2s #1756734331691',
          'd dh p3 ???? #1756734331691',
          'p1 cc #1756734331691',
          'p2 cc #1756734331691',
        ],
      });
      gameState = Poker.Hand.merge(gameState, bobCall1);
      expect(gameState.actions.length).toBe(5);

      // Step 4: Charlie calls
      const charlieCall1 = Poker.Hand({
        ...BASE_HAND,
        author: 'Charlie',
        actions: [
          'd dh p1 ???? #1756734331690',
          'd dh p2 ???? #1756734331691',
          'd dh p3 Tc3c #1756734331691',
          'p1 cc #1756734331691',
          'p2 cc #1756734331691',
          'p3 cc #1756734331691',
        ],
      });
      gameState = Poker.Hand.merge(gameState, charlieCall1);
      expect(gameState.actions.length).toBe(6);

      // Step 5: Dealer deals flop (server action with allowUnsafeMerge)
      const dealFlop = Poker.Hand({
        ...BASE_HAND,
        author: undefined,
        actions: [
          'd dh p1 6c5h #1756734331690',
          'd dh p2 Jc2s #1756734331691',
          'd dh p3 Tc3c #1756734331691',
          'p1 cc #1756734331691',
          'p2 cc #1756734331691',
          'p3 cc #1756734331691',
          'd db 8s2dJs #1756734331691',
        ],
      });
      gameState = Poker.Hand.merge(gameState, dealFlop, true);
      expect(gameState.actions.length).toBe(7);

      // Step 6: Bob checks
      const bobCheck = Poker.Hand({
        ...BASE_HAND,
        author: 'Bob',
        actions: [...gameState.actions.slice(0, 7), 'p2 cc #1756734331692'],
      });
      gameState = Poker.Hand.merge(gameState, bobCheck);
      expect(gameState.actions.length).toBe(8);

      // Step 7: Charlie checks
      const charlieCheck = Poker.Hand({
        ...BASE_HAND,
        author: 'Charlie',
        actions: [...gameState.actions.slice(0, 8), 'p3 cc #1756734331692'],
      });
      gameState = Poker.Hand.merge(gameState, charlieCheck);
      expect(gameState.actions.length).toBe(9);

      // Step 8: Alice checks
      const aliceCheck = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice',
        actions: [...gameState.actions.slice(0, 9), 'p1 cc #1756734331692'],
      });
      gameState = Poker.Hand.merge(gameState, aliceCheck);
      expect(gameState.actions.length).toBe(10);

      // Step 9: Dealer deals turn
      const dealTurn = Poker.Hand({
        ...BASE_HAND,
        author: undefined,
        actions: [...gameState.actions.slice(0, 10), 'd db Kh #1756734331692'],
      });
      gameState = Poker.Hand.merge(gameState, dealTurn, true);
      expect(gameState.actions.length).toBe(11);

      // Steps 10-12: All players check on turn
      const bobCheckTurn = Poker.Hand({
        ...BASE_HAND,
        author: 'Bob',
        actions: [...gameState.actions.slice(0, 11), 'p2 cc #1756734331692'],
      });
      gameState = Poker.Hand.merge(gameState, bobCheckTurn);

      const charlieCheckTurn = Poker.Hand({
        ...BASE_HAND,
        author: 'Charlie',
        actions: [...gameState.actions.slice(0, 12), 'p3 cc #1756734331692'],
      });
      gameState = Poker.Hand.merge(gameState, charlieCheckTurn);

      const aliceCheckTurn = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice',
        actions: [...gameState.actions.slice(0, 13), 'p1 cc #1756734331692'],
      });
      gameState = Poker.Hand.merge(gameState, aliceCheckTurn);
      expect(gameState.actions.length).toBe(14);

      // Step 13: Dealer deals river
      const dealRiver = Poker.Hand({
        ...BASE_HAND,
        author: undefined,
        actions: [...gameState.actions.slice(0, 14), 'd db Qd #1756734331692'],
      });
      gameState = Poker.Hand.merge(gameState, dealRiver, true);
      expect(gameState.actions.length).toBe(15);

      // Steps 14-16: All players check on river
      const bobCheckRiver = Poker.Hand({
        ...BASE_HAND,
        author: 'Bob',
        actions: [...gameState.actions.slice(0, 15), 'p2 cc #1756734331692'],
      });
      gameState = Poker.Hand.merge(gameState, bobCheckRiver);

      const charlieCheckRiver = Poker.Hand({
        ...BASE_HAND,
        author: 'Charlie',
        actions: [...gameState.actions.slice(0, 16), 'p3 cc #1756734331692'],
      });
      gameState = Poker.Hand.merge(gameState, charlieCheckRiver);

      const aliceCheckRiver = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice',
        actions: [...gameState.actions.slice(0, 17), 'p1 cc #1756734331692'],
      });
      gameState = Poker.Hand.merge(gameState, aliceCheckRiver);
      expect(gameState.actions.length).toBe(18);

      // Step 17: Showdown - players show cards
      const bobShow = Poker.Hand({
        ...BASE_HAND,
        author: 'Bob',
        actions: [...gameState.actions.slice(0, 18), 'p2 sm Jc2s #1756734331692'],
      });
      gameState = Poker.Hand.merge(gameState, bobShow);

      const charlieShow = Poker.Hand({
        ...BASE_HAND,
        author: 'Charlie',
        actions: [...gameState.actions.slice(0, 19), 'p3 sm Tc3c #1756734331692'],
      });
      gameState = Poker.Hand.merge(gameState, charlieShow);

      const aliceShow = Poker.Hand({
        ...BASE_HAND,
        author: 'Alice',
        actions: [...gameState.actions.slice(0, 20), 'p1 sm 6c5h #1756734331692'],
      });
      gameState = Poker.Hand.merge(gameState, aliceShow);

      // Final verification
      expect(gameState.actions.length).toBe(21);
      // Expected actions with mocked timestamps where applicable
      const expectedActions = [
        'd dh p1 6c5h #1756734331690',
        'd dh p2 Jc2s #1756734331691',
        'd dh p3 Tc3c #1756734331691',
        'p1 cc #1715616000000', // Replaced with mocked timestamp
        'p2 cc #1715616000000', // Replaced with mocked timestamp
        'p3 cc #1715616000000', // Replaced with mocked timestamp
        'd db 8s2dJs #1756734331691',
        'p2 cc #1715616000000', // Replaced with mocked timestamp
        'p3 cc #1715616000000', // Replaced with mocked timestamp
        'p1 cc #1715616000000', // Replaced with mocked timestamp
        'd db Kh #1756734331692',
        'p2 cc #1715616000000', // Replaced with mocked timestamp
        'p3 cc #1715616000000', // Replaced with mocked timestamp
        'p1 cc #1715616000000', // Replaced with mocked timestamp
        'd db Qd #1756734331692',
        'p2 cc #1715616000000', // Replaced with mocked timestamp
        'p3 cc #1715616000000', // Replaced with mocked timestamp
        'p1 cc #1715616000000', // Replaced with mocked timestamp
        'p2 sm Jc2s #1715616000000', // Replaced with mocked timestamp
        'p3 sm Tc3c #1715616000000', // Replaced with mocked timestamp
        'p1 sm 6c5h #1715616000000', // Replaced with mocked timestamp
      ];
      expect(gameState.actions).toEqual(expectedActions);
      expect(gameState.author).toBeUndefined(); // Author always removed after merge

      // Verify hole cards were properly merged
      expect(gameState.actions[0]).toBe('d dh p1 6c5h #1756734331690');
      expect(gameState.actions[1]).toBe('d dh p2 Jc2s #1756734331691');
      expect(gameState.actions[2]).toBe('d dh p3 Tc3c #1756734331691');

      // To make it complete, we'd need to call Hand.finish() which adds finishingStacks
      // But since we're testing only merge(), the game progresses correctly to showdown
    });
  });

  describe('Hand.merge helper function coverage', () => {
    // Test areHandsCompatible() through various incompatibility scenarios
    describe('compatibility checks', () => {
      it('should reject merge when variants differ', () => {
        // hand1: NT variant, minBet=20 → BB=20, SB=10
        const hand1 = Poker.Hand({ ...BASE_HAND, variant: 'NT' } as Poker.Hand);
        // hand2: FT variant, smallBet=20 → BB=20, SB=10
        const hand2 = Poker.Hand({
          ...BASE_HAND,
          variant: 'FT',
          smallBet: 20,
          bigBet: 40,
          bringIn: undefined,
          minBet: undefined,
        });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);
      });

      it('should reject merge when venues differ', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND, venue: 'pokerstars' });
        const hand2 = Poker.Hand({ ...BASE_HAND, venue: 'ggpoker' });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);
      });

      it('should reject merge when currencies differ', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND, currency: 'USD' });
        const hand2 = Poker.Hand({ ...BASE_HAND, currency: 'EUR' });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);
      });

      it('should reject merge when table IDs differ', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND, table: 'table-1' });
        const hand2 = Poker.Hand({ ...BASE_HAND, table: 'table-2' });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);
      });

      it('should reject merge when hand IDs differ', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND, hand: 1 });
        const hand2 = Poker.Hand({ ...BASE_HAND, hand: 2 });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);
      });

      it('should reject merge when seeds differ', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND, seed: 12345 });
        const hand2 = Poker.Hand({ ...BASE_HAND, seed: 67890 });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);
      });

      it('should reject merge when player arrays differ', () => {
        // minBet=20 → BB=20, SB=10 (heads-up: [SB, BB])
        const hand1 = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob'],
          startingStacks: [1000, 1000],
          blindsOrStraddles: [10, 20],
          antes: [0, 0],
        });
        const hand2 = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Charlie'],
          startingStacks: [1000, 1000],
          blindsOrStraddles: [10, 20],
          antes: [0, 0],
        });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);
      });

      it('should reject merge when starting stacks differ', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND, startingStacks: [1000, 1000, 1000] });
        const hand2 = Poker.Hand({ ...BASE_HAND, startingStacks: [2000, 2000, 2000] });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);
      });

      it('should reject merge when blinds differ', () => {
        // hand1: minBet=20 → BB=20, SB=10
        const hand1 = Poker.Hand({ ...BASE_HAND, blindsOrStraddles: [0, 10, 20] });
        // hand2: minBet=50 → BB=50, SB=25
        const hand2 = Poker.Hand({ ...BASE_HAND, blindsOrStraddles: [0, 25, 50], minBet: 50 });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);
      });

      it('should reject merge when antes differ', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND, antes: [5, 5, 5] });
        const hand2 = Poker.Hand({ ...BASE_HAND, antes: [10, 10, 10] });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);
      });

      it('should reject merge when _venueIds differ', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND, _venueIds: ['id1', 'id2', 'id3'] });
        const hand2 = Poker.Hand({ ...BASE_HAND, _venueIds: ['id1', 'id2', 'id4'] });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);
      });

      it('should reject merge when minBet differs in NT games', () => {
        // hand1: minBet=20 → BB=20, SB=10
        const hand1 = Poker.Hand({ ...BASE_HAND, variant: 'NT', minBet: 20 });
        // hand2: minBet=40 → BB=40, SB=20
        const hand2 = Poker.Hand({ ...BASE_HAND, variant: 'NT', minBet: 40, blindsOrStraddles: [0, 20, 40] });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);
      });

      it('should reject merge when smallBet/bigBet differ in FT games', () => {
        // hand1: smallBet=20 → BB=20, SB=10
        const hand1 = Poker.Hand({
          variant: 'FT',
          players: ['A', 'B'],
          startingStacks: [1000, 1000],
          blindsOrStraddles: [10, 20],
          smallBet: 20,
          bigBet: 40,
          actions: [],
          antes: [0, 0],
        });
        // hand2: smallBet=40 → BB=40, SB=20
        const hand2 = Poker.Hand({
          variant: 'FT',
          players: ['A', 'B'],
          startingStacks: [1000, 1000],
          blindsOrStraddles: [20, 40],
          smallBet: 40,
          bigBet: 80,
          actions: [],
          antes: [0, 0],
        });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged).toEqual(hand1);
      });

      it('should allow merge when only optional fields differ', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND });
        const hand2 = Poker.Hand({ ...BASE_HAND, optionalField: 'value' } as any);

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged.actions).toEqual(BASE_HAND.actions);
      });

      it('should allow merge when critical fields are undefined in one hand', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND });
        const hand2 = Poker.Hand({ ...BASE_HAND, hand: undefined });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged.actions).toEqual(BASE_HAND.actions);
      });
    });

    // Test findCommonPrefixLength() through prefix scenarios
    describe('common prefix detection', () => {
      it('should find full prefix when actions are identical', () => {
        const actions = ['p1 cc', 'p2 f', 'p3 cbr 100'];
        const hand1 = Poker.Hand({ ...BASE_HAND, actions });
        const hand2 = Poker.Hand({ ...BASE_HAND, actions });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged.actions).toEqual(actions);
      });

      it('should handle hole cards in common prefix', () => {
        const hand1 = Poker.Hand({
          ...BASE_HAND,
          actions: ['d dh p1 AcKs', 'd dh p2 ????', 'p1 cc'],
        });
        const hand2 = Poker.Hand({
          ...BASE_HAND,
          author: 'Bob',
          actions: ['d dh p1 AcKs', 'd dh p2 QhJd', 'p1 cc', 'p2 f'],
        });

        const merged = Poker.Hand.merge(hand1, hand2);
        // Should preserve known cards and detect common prefix correctly
        expect(merged.actions).toEqual([
          'd dh p1 AcKs',
          'd dh p2 QhJd',
          'p1 cc',
          'p2 f #1715616000000',
        ]); // Bob's action gets timestamp
      });

      it('should not treat hole cards for different players as equivalent', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND, actions: ['d dh p1 AcKs'] });
        const hand2 = Poker.Hand({ ...BASE_HAND, actions: ['d dh p1 AcKs', 'd dh p2 AcKs'] });

        const merged = Poker.Hand.merge(hand1, hand2, true);
        expect(merged.actions).toEqual(['d dh p1 AcKs', 'd dh p2 AcKs']);
      });

      it('should not treat hole cards with different real cards as equivalent', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND, actions: ['d dh p1 AcKs'] });
        const hand2 = Poker.Hand({ ...BASE_HAND, actions: ['d dh p1 QhJd'] });

        const merged = Poker.Hand.merge(hand1, hand2);
        // When both have different real cards, they're not equivalent, so no common prefix
        // Old action is kept, new action with conflicting cards is deduplicated
        expect(merged.actions).toEqual(['d dh p1 AcKs']);
      });

      it('should handle empty action arrays', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND, actions: [] });
        const hand2 = Poker.Hand({ ...BASE_HAND, author: 'Alice', actions: ['p1 cc'] });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged.actions).toEqual(['p1 cc #1715616000000']); // Alice's action gets timestamp
      });
    });

    // Test selectBestAction() through card visibility scenarios
    describe('card visibility preference', () => {
      it('should prefer real cards over hidden cards from old hand', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND, actions: ['d dh p1 AcKs'] });
        const hand2 = Poker.Hand({ ...BASE_HAND, actions: ['d dh p1 ????'] });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged.actions).toEqual(['d dh p1 AcKs']);
      });

      it('should use real cards from new hand when old has hidden', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND, actions: ['d dh p1 ????'] });
        const hand2 = Poker.Hand({ ...BASE_HAND, actions: ['d dh p1 AcKs'] });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged.actions).toEqual(['d dh p1 AcKs']);
      });

      it('should keep old authoritative cards when both have real cards', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND, actions: ['d dh p1 AcKs'] });
        const hand2 = Poker.Hand({ ...BASE_HAND, actions: ['d dh p1 QhJd'] });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged.actions[0]).toBe('d dh p1 AcKs');
      });

      it('should keep old when both have hidden cards', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND, actions: ['d dh p1 ????'] });
        const hand2 = Poker.Hand({ ...BASE_HAND, actions: ['d dh p1 ????'] });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged.actions).toEqual(['d dh p1 ????']);
      });

      it('should not affect non-hole-card actions', () => {
        const hand1 = Poker.Hand({ ...BASE_HAND, actions: ['p1 cc'] });
        const hand2 = Poker.Hand({ ...BASE_HAND, actions: ['p1 cc'] });

        const merged = Poker.Hand.merge(hand1, hand2);
        expect(merged.actions).toEqual(['p1 cc']);
      });
    });
  });

  describe('Hand.isEqual', () => {
    it('should compare identical hands as equal', () => {
      const hand1 = Poker.Hand(BASE_HAND);
      const hand2 = Poker.Hand(BASE_HAND);

      expect(Poker.Hand.isEqual(hand1, hand2)).toBe(true);
    });

    it('should detect differences in actions', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        actions: BASE_HAND.actions.slice(0, 5),
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        actions: BASE_HAND.actions.slice(0, 6),
      });

      expect(Poker.Hand.isEqual(hand1, hand2)).toBe(false);
    });

    it('should detect differences in player data', () => {
      const hand1 = Poker.Hand(BASE_HAND);

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        players: ['Alice', 'Bob', 'David'], // Changed Charlie to David
      });

      expect(Poker.Hand.isEqual(hand1, hand2)).toBe(false);
    });

    it('should detect differences in numeric fields', () => {
      // hand1: minBet=20 → BB=20, SB=10
      const hand1 = Poker.Hand(BASE_HAND);

      // hand2: minBet=30 → BB=30, SB=15
      const hand2 = Poker.Hand({
        ...BASE_HAND,
        minBet: 30,
        blindsOrStraddles: [0, 15, 30],
      });

      expect(Poker.Hand.isEqual(hand1, hand2)).toBe(false);
    });

    it('should handle hands with private fields', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        _venueIds: ['id1', 'id2', 'id3'],
      });

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        _venueIds: ['id1', 'id2', 'id3'],
      });

      expect(Poker.Hand.isEqual(hand1, hand2)).toBe(true);

      const hand3 = Poker.Hand({
        ...BASE_HAND,
        _venueIds: ['id1', 'id2', 'id4'], // Different ID
      });

      expect(Poker.Hand.isEqual(hand1, hand3)).toBe(false);
    });

    it('should use deep JSON serialization comparison', () => {
      const hand1 = Poker.Hand({
        ...BASE_HAND,
        metadata: { nested: { value: 1 } },
      } as any);

      const hand2 = Poker.Hand({
        ...BASE_HAND,
        metadata: { nested: { value: 1 } },
      } as any);

      const hand3 = Poker.Hand({
        ...BASE_HAND,
        metadata: { nested: { value: 2 } },
      } as any);

      expect(Poker.Hand.isEqual(hand1, hand2)).toBe(true);
      expect(Poker.Hand.isEqual(hand1, hand3)).toBe(false);
    });
  });

  describe('Hand.personalize', () => {
    it('should return full hand when no player specified', () => {
      const hand = Poker.Hand(BASE_HAND);
      const personalized = Poker.Hand.personalize(hand);

      expect(personalized).toEqual(hand);
    });

    it('should hide other players hole cards', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        actions: [
          'd dh p1 AsKs #1700000000000',
          'd dh p2 QhQd #1700000001000',
          'd dh p3 JhJd #1700000002000',
        ],
      });

      const aliceView = Poker.Hand.personalize(hand, 'Alice');

      // Alice should see her cards
      expect(aliceView.actions[0]).toBe('d dh p1 AsKs #1700000000000');

      // But not others' cards
      expect(aliceView.actions[1]).toBe('d dh p2 ???? #1700000001000');
      expect(aliceView.actions[2]).toBe('d dh p3 ???? #1700000002000');
    });

    it('should show cards that were shown at showdown', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        actions: [
          'd dh p1 AsKs #1700000000000',
          'd dh p2 QhQd #1700000001000',
          'p1 sm AsKs #1700000010000', // Player 1 shows
          'p2 sm QhQd #1700000011000', // Player 2 shows
        ],
      });

      const bobView = Poker.Hand.personalize(hand, 'Bob');

      // Bob sees his own cards
      expect(bobView.actions[1]).toBe('d dh p2 QhQd #1700000001000');

      // Bob doesn't see Alice's hole cards initially
      expect(bobView.actions[0]).toBe('d dh p1 ???? #1700000000000');

      // But sees shown cards
      expect(bobView.actions[2]).toBe('p1 sm AsKs #1700000010000');
      expect(bobView.actions[3]).toBe('p2 sm QhQd #1700000011000');
    });

    it('should work with numeric player identifier', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        actions: ['d dh p1 AsKs #1700000000000', 'd dh p2 QhQd #1700000001000'],
      });

      const player0View = Poker.Hand.personalize(hand, 0);

      // Player 0 (Alice) sees her cards
      expect(player0View.actions[0]).toBe('d dh p1 AsKs #1700000000000');
      // But not player 1's cards
      expect(player0View.actions[1]).toBe('d dh p2 ???? #1700000001000');
    });

    it('should preserve all other actions unchanged', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        actions: [
          'd dh p1 AsKs #1700000000000',
          'p1 cbr 60 #1700000005000',
          'd db AhKh7d #1700000006000',
          'p1 f #1700000007000',
        ],
      });

      const bobView = Poker.Hand.personalize(hand, 'Bob');

      // Hole cards hidden
      expect(bobView.actions[0]).toBe('d dh p1 ???? #1700000000000');

      // All other actions unchanged
      expect(bobView.actions[1]).toBe('p1 cbr 60 #1700000005000');
      expect(bobView.actions[2]).toBe('d db AhKh7d #1700000006000');
      expect(bobView.actions[3]).toBe('p1 f #1700000007000');
    });

    it('should set author field to perspective player', () => {
      const hand = Poker.Hand(BASE_HAND);

      const aliceView = Poker.Hand.personalize(hand, 'Alice');
      expect(aliceView.author).toBe('Alice');

      const bobView = Poker.Hand.personalize(hand, 1);
      expect(bobView.author).toBe('Bob');
    });
  });

  describe('Integration: merge() to next() flow for Sit In/Out', () => {
    describe('player join flow through merge and next', () => {
      it('should handle player joining mid-hand via merge then activating via next', () => {
        // Scenario: Complete join flow
        // Step 1: merge() adds Player3 with _inactive: 1 (game in progress)
        // Step 2: next() activates Player3 (_inactive: 0) if chips sufficient
        // Expected: Player gets cards in new hand

        const ongoingHand = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob'],
          startingStacks: [1000, 1000],
          blindsOrStraddles: [10, 20],
          actions: ['d dh p1 AsKs', 'd dh p2 QhQd', 'p2 cc', 'p1 cc'],
          _inactive: [0, 0],
          _intents: [0, 0],
        });

        const joinRequest = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 1000, 1500],
          blindsOrStraddles: [10, 20, 0],
          _intents: [0, 0, 1],
          _inactive: [0, 0, 1],
          author: 'Charlie',
        });

        const merged = Poker.Hand.merge(ongoingHand, joinRequest);
        expect(merged.players).toEqual(['Alice', 'Bob', 'Charlie']);
        expect(merged._inactive).toEqual([0, 0, 2]);
        expect(merged._intents).toEqual([0, 0, 1]);

        const completed = {
          ...merged,
          finishingStacks: [980, 1020, 1500],
          winnings: [0, 40, 0],
        };

        const nextHand = Poker.Hand.next(completed);
        expect(nextHand.players).toContain('Charlie');
        expect(nextHand._inactive?.[nextHand.players.indexOf('Charlie')]).toBe(0);
        expect(nextHand._intents?.[nextHand.players.indexOf('Charlie')]).toBe(0);
      });

      it('should handle insufficient chips preventing activation', () => {
        // Scenario: Join but can't afford blinds
        // Step 1: merge() adds player with 5 chips
        // Step 2: next() removes player (needs 20 for BB)
        // Expected: Player removed before getting cards

        const ongoingHand = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob'],
          startingStacks: [1000, 1000],
          blindsOrStraddles: [10, 20],
          _inactive: [0, 0],
          _intents: [0, 0],
        });

        const joinRequest = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 1000, 5],
          blindsOrStraddles: [10, 20, 0],
          _intents: [0, 0, 1],
          _inactive: [0, 0, 1],
          author: 'Charlie',
        });

        const merged = Poker.Hand.merge(ongoingHand, joinRequest);
        expect(merged.players).toContain('Charlie');

        const completed = {
          ...merged,
          finishingStacks: [990, 1010, 5],
          winnings: [0, 30, 0],
        };

        const nextHand = Poker.Hand.next(completed);
        expect(Poker.Hand.isComplete(completed)).toBe(true);
        expect(nextHand.players).not.toContain('Charlie');
        expect(nextHand.players).toEqual(['Alice', 'Bob']);
      });

      it('should preserve buy-in through merge to next', () => {
        // Scenario: Buy-in amount flows through
        // Step 1: merge() accepts client's buy-in amount
        // Step 2: next() uses that as starting stack
        // Expected: Correct stack in new hand

        const ongoingHand = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob'],
          startingStacks: [1000, 1000],
          blindsOrStraddles: [10, 20],
        });

        const joinRequest = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 1000, 2500],
          blindsOrStraddles: [10, 20, 0],
          _intents: [0, 0, 1],
          _inactive: [0, 0, 1],
          author: 'Charlie',
        });

        const merged = Poker.Hand.merge(ongoingHand, joinRequest);
        expect(merged.startingStacks[2]).toBe(2500);

        const completed = {
          ...merged,
          finishingStacks: [990, 1010, 2500],
          winnings: [0, 30, 0],
        };

        const nextHand = Poker.Hand.next(completed);
        const charlieIdx = nextHand.players.indexOf('Charlie');
        expect(nextHand.startingStacks[charlieIdx]).toBe(2500);
      });
    });

    describe('pause and return flow', () => {
      it('should handle player pausing via merge then accumulating dead blinds via next', () => {
        // SCENARIO->INPUT->EXPECTED
        // Scenario: Player already inactive and already has dead blinds, will miss another blind
        // Input: Alice inactive, has 10 dead blinds (missed SB before), will be on BB after rotation
        // Expected: Alice accumulates additional 1.0*BB = 20, total becomes 30 (capped at 1.5*BB)

        const activeHand = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 990, 980], // Bob paid SB, Charlie paid BB
          blindsOrStraddles: [0, 10, 20], // Alice UTG, Bob SB, Charlie BB
          actions: ['d dh p1 AsKs', 'd dh p2 QhQd', 'd dh p3 JhJd'],
          _inactive: [1, 0, 0], // Alice ALREADY inactive
          _intents: [2, 0, 0], // Alice remains paused
          _deadBlinds: [10, 0, 0], // Alice already has 10 dead blinds (missed SB before)
        });

        // No merge needed - Alice already paused from before
        const completed = {
          ...activeHand,
          finishingStacks: [1000, 990, 1010],
          winnings: [0, 0, 30],
        };

        const nextHand = Poker.Hand.next(completed);
        // Theoretical rotation: [20, 0, 10], Alice will miss BB position (20)
        // With skip-inactive: Alice inactive at BB, blinds shift to active players
        // Button at Bob (idx 1), SB → Charlie (idx 2), BB → Bob (idx 1)? No - SB at Charlie, BB at Bob
        // Actually: Button at idx 1, next active for SB is idx 2 (Charlie), next active for BB is idx 1 (Bob)
        expect(nextHand.blindsOrStraddles).toEqual([0, 20, 10]); // Alice=0, Bob=BB, Charlie=SB
        // Dead blinds still use theoretical positions: Alice misses BB
        expect(nextHand._deadBlinds).toEqual([30, 0, 0]); // 10 + 20 = 30 (max 1.5*BB)
        expect(nextHand._inactive).toEqual([1, 0, 0]);
      });

      it('should handle player posting SB then pausing - no dead blinds', () => {
        // Scenario: Posted blind before pause (from spec)
        // Step 1: Player posts SB, then merge() with _intents: 1
        // Step 2: next() rotates blinds: [0,10,20] -> [20,0,10]
        // Step 3: Bob will NOT be on blind position, so no dead blinds
        // Expected: _deadBlinds remains 0

        const activeHand = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 990, 980], // Bob posted 10, Charlie posted 20
          blindsOrStraddles: [0, 10, 20],
          actions: [
            'd dh p1 AsKs',
            'd dh p2 QhQd',
            'd dh p3 JhJd',
            'p1 cc', // After blinds
          ],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        });

        const pauseRequest = Poker.Hand({
          ...activeHand,
          _intents: [0, 1, 0], // Bob pauses after posting SB
          author: 'Bob',
        });

        const merged = Poker.Hand.merge(activeHand, pauseRequest);
        expect(merged._intents).toEqual([0, 1, 0]);

        const completed = {
          ...merged,
          finishingStacks: [970, 990, 1010],
          winnings: [0, 0, 50],
        };

        const nextHand = Poker.Hand.next(completed);
        // After rotation: blinds [20,0,10], Bob at position 1 with blind=0
        // Bob will NOT miss a blind position, so no dead blinds
        expect(nextHand._deadBlinds).toEqual([0, 0, 0]);
        expect(nextHand._inactive).toEqual([0, 1, 0]);
      });

      it('should handle pause at non-blind position - no accumulation', () => {
        // SCENARIO->INPUT->EXPECTED
        // Scenario: Player pauses when not on blind, but after rotation will be on BB
        // Input: Alice on UTG position, pauses (blind positions: [0, 10, 20])
        // Expected: After rotation [20, 0, 10], Alice on BB, accumulates 20 dead blinds

        const activeHand = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 990, 980], // Bob paid SB, Charlie paid BB
          blindsOrStraddles: [0, 10, 20], // Alice UTG, Bob SB, Charlie BB
          actions: ['d dh p1 AsKs', 'd dh p2 QhQd', 'd dh p3 JhJd'],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        });

        const pauseRequest = Poker.Hand({
          ...activeHand,
          _intents: [2, 0, 0], // Alice (UTG) pauses
          author: 'Alice',
        });

        const merged = Poker.Hand.merge(activeHand, pauseRequest);
        expect(merged._intents).toEqual([2, 0, 0]);
        expect(merged._inactive).toEqual([0, 0, 0]);

        const completed = {
          ...merged,
          finishingStacks: [1000, 990, 1010],
          winnings: [0, 0, 30],
        };

        const nextHand = Poker.Hand.next(completed);
        // Theoretical rotation: [20, 0, 10], Alice on BB position and will miss it
        // With skip-inactive: Alice inactive at BB, blinds shift to active players
        // Button at Bob (idx 1), SB → Charlie (idx 2), BB → Bob (idx 1)
        expect(nextHand.blindsOrStraddles).toEqual([0, 20, 10]); // Alice=0, Bob=BB, Charlie=SB
        expect(nextHand._deadBlinds).toEqual([20, 0, 0]); // Alice accumulates 1.0*BB = 20 (theoretical)
        expect(nextHand._inactive).toEqual([1, 0, 0]);
      });
    });

    describe('complex multi-hand flows', () => {
      it('should handle join -> pause -> return -> leave sequence', () => {
        // Scenario: Full lifecycle
        // Hand 1: Join via merge (_inactive: 1)
        // Hand 2: Activated via next, then pause via merge
        // Hand 3: Return with dead blinds via next
        // Hand 4: Leave via merge, removed via next
        // Expected: Correct state at each step

        // Hand 1: Start with 2 players
        const hand1 = Poker.Hand({
          ...BASE_HAND,
          hand: 1,
          players: ['Alice', 'Bob'],
          startingStacks: [1000, 1000],
          blindsOrStraddles: [10, 20],
          _inactive: [0, 0],
          _intents: [0, 0],
        });

        // Charlie joins
        const joinRequest = Poker.Hand({
          ...BASE_HAND,
          hand: 1,
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 1000, 1500],
          blindsOrStraddles: [10, 20, 0],
          _intents: [0, 0, 1],
          _inactive: [0, 0, 1],
          author: 'Charlie',
        });

        const hand1Merged = Poker.Hand.merge(hand1, joinRequest);
        expect(hand1Merged._inactive).toEqual([0, 0, 2]);

        // Complete hand 1
        const hand1Complete = {
          ...hand1Merged,
          finishingStacks: [990, 1010, 1500],
          winnings: [0, 30, 0],
        };

        // Hand 2: Charlie activated
        const hand2 = Poker.Hand.next(hand1Complete);
        expect(hand2._inactive).toEqual([0, 0, 0]);
        expect(hand2.players).toContain('Charlie');

        // Charlie pauses in hand 2
        const pauseRequest = Poker.Hand({
          ...hand2,
          _intents: [0, 0, 2],
          author: 'Charlie',
        });

        const hand2Merged = Poker.Hand.merge(hand2, pauseRequest);
        expect(hand2Merged._inactive).toEqual([0, 0, 0]);

        const hand2Complete = {
          ...hand2Merged,
          finishingStacks: [980, 1020, 1500],
          winnings: [0, 40, 0],
        };

        // Hand 3: Charlie has dead blinds
        const hand3 = Poker.Hand.next(hand2Complete);
        expect(hand3._deadBlinds?.[2]).toBeGreaterThan(0);

        // Charlie returns
        const returnRequest = Poker.Hand({
          ...hand3,
          _intents: [0, 0, 0],
          author: 'Charlie',
        });

        const hand3Merged = Poker.Hand.merge(hand3, returnRequest);
        const hand3Complete = {
          ...hand3Merged,
          finishingStacks: [970, 1030, 1500],
          winnings: [0, 50, 0],
        };

        // Hand 4: Charlie wants to leave
        const hand4 = Poker.Hand.next(hand3Complete);
        const leaveRequest = Poker.Hand({
          ...hand4,
          _intents: [0, 0, 3],
          author: 'Charlie',
        });

        const hand4Merged = Poker.Hand.merge(hand4, leaveRequest);
        const hand4Complete = {
          ...hand4Merged,
          finishingStacks: [960, 1040, 1500],
          winnings: [0, 40, 0],
        };

        // Hand 5: Charlie removed
        const hand5 = Poker.Hand.next(hand4Complete);
        expect(hand5.players).not.toContain('Charlie');
        expect(hand5.players).toEqual(['Alice', 'Bob']);
      });

      it('should handle multiple players with different states', () => {
        // Scenario: Mixed table states
        // Player1: Active throughout
        // Player2: Pauses then returns
        // Player3: Joins then leaves
        // Expected: Each player's state tracked correctly

        // Start with 2 active players
        const hand1 = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob'],
          startingStacks: [1000, 1000],
          blindsOrStraddles: [10, 20],
          _inactive: [0, 0],
          _intents: [0, 0],
          _deadBlinds: [0, 0],
        });

        // Bob pauses
        const bobPause = Poker.Hand({
          ...hand1,
          _intents: [0, 2],
          author: 'Bob',
        });

        const merged1 = Poker.Hand.merge(hand1, bobPause);
        expect(merged1._intents).toEqual([0, 2]);
        expect(merged1._inactive).toEqual([0, 0]);

        // Charlie joins while Bob is paused
        // Note: Bob paused in _intents but still active in _inactive for current hand
        // Charlie joins as new player (_inactive: 2)
        const charlieJoin = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 1000, 1500],
          blindsOrStraddles: [10, 20, 0], // Active players have blinds, new player has 0
          _intents: [0, 2, 1],
          _inactive: [0, 0, 2], // Alice & Bob active, Charlie new
          _deadBlinds: [0, 0, 0],
          author: 'Charlie',
        });

        const merged2 = Poker.Hand.merge(merged1, charlieJoin);
        expect(merged2.players).toEqual(['Alice', 'Bob', 'Charlie']);
        expect(merged2._inactive).toEqual([0, 0, 2]);

        const complete1 = {
          ...merged2,
          finishingStacks: [1010, 1000, 1500],
          winnings: [30, 0, 0],
        };

        // Next hand: Charlie active, Bob still paused
        const hand2 = Poker.Hand.next(complete1);
        expect(hand2._inactive).toEqual([0, 1, 0]);
        expect(hand2._deadBlinds?.[1]).toBeGreaterThanOrEqual(0);

        // Bob returns, Charlie leaves
        const bobReturn = Poker.Hand({
          ...hand2,
          _intents: [0, 0, 0],
          author: 'Bob',
        });

        const merged3 = Poker.Hand.merge(hand2, bobReturn);
        const charlieLeave = Poker.Hand({
          ...merged3,
          _intents: [0, 0, 3],
          author: 'Charlie',
        });

        const merged4 = Poker.Hand.merge(merged3, charlieLeave);
        expect(merged4._intents).toEqual([0, 0, 3]);

        const complete2 = {
          ...merged4,
          finishingStacks: [1000, 990, 1510],
          winnings: [0, 0, 30],
        };

        // Next hand: Alice and Bob active, Charlie removed
        const hand3 = Poker.Hand.next(complete2);
        expect(hand3.players).toEqual(['Alice', 'Bob']);
        expect(hand3._inactive).toEqual([0, 0]);
      });
    });

    describe('dead blind specific flows from spec', () => {
      it('should implement exact accumulation pattern from spec', () => {
        // Scenario: Track accumulation over 3 hands
        // Hand 1: Miss SB -> +0.5BB (10 chips for BB=20)
        // Hand 2: Miss BB -> +1.0BB (20 chips, total 30)
        // Hand 3: Miss SB -> capped at 1.5BB (stays 30)
        // Expected: 0 -> 10 -> 30 -> 30

        // Initial hand: Player on SB position, pauses
        const hand1 = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 1000, 1000],
          blindsOrStraddles: [0, 10, 20], // Bob SB, Charlie BB
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        });

        // Bob pauses
        const pauseRequest = Poker.Hand({
          ...hand1,
          _intents: [0, 2, 0],
          author: 'Bob',
        });

        const merged1 = Poker.Hand.merge(hand1, pauseRequest);
        const complete1 = {
          ...merged1,
          finishingStacks: [980, 1000, 1020],
          winnings: [0, 0, 40],
        };

        // Hand 2: After rotation [20,0,10], Bob NOT on blind position
        const hand2 = Poker.Hand.next(complete1);
        // Bob is not on a blind position, no accumulation
        expect(hand2._deadBlinds).toEqual([0, 0, 0]);

        const complete2 = {
          ...hand2,
          finishingStacks: [960, 1000, 1040],
          winnings: [0, 0, 60],
        };

        // Hand 3: After rotation [10,20,0], Bob on BB position
        const hand3 = Poker.Hand.next(complete2);
        // Bob now will miss BB position, accumulates 1.0*BB = 20
        expect(hand3._deadBlinds).toEqual([0, 20, 0]);

        const complete3 = {
          ...hand3,
          finishingStacks: [940, 1000, 1060],
          winnings: [0, 0, 80],
        };

        // Hand 4: After rotation [0,10,20], Bob on SB position
        const hand4 = Poker.Hand.next(complete3);
        // Bob will miss SB position, accumulates 0.5*BB = 10, total 30
        expect(hand4._deadBlinds).toEqual([0, 30, 0]);
      });

      it('should handle wait for BB activation', () => {
        // Scenario: Player waiting for BB position
        // Charlie at UTG with _intents: 1 (wait for BB)
        // After rotation, Charlie reaches BB and activates
        // Expected: Activation when reaching BB

        const hand1 = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 1000, 1000],
          blindsOrStraddles: [10, 20, 0], // Alice SB, Bob BB, Charlie UTG
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        });

        // Charlie wants to wait for BB
        const waitRequest = Poker.Hand({
          ...hand1,
          _intents: [0, 0, 1],
          author: 'Charlie',
        });

        const merged1 = Poker.Hand.merge(hand1, waitRequest);
        const complete1 = {
          ...merged1,
          finishingStacks: [990, 1010, 1000],
          winnings: [0, 30, 0],
        };

        // Hand 2: After rotation [0,10,20], Charlie is at BB position
        const hand2 = Poker.Hand.next(complete1);
        const charlieIdx = hand2.players.indexOf('Charlie');

        // Charlie should be activated at BB
        expect(hand2.blindsOrStraddles[charlieIdx]).toBe(20); // BB position
        expect(hand2._inactive?.[charlieIdx]).toBe(0); // Active now
        expect(hand2._deadBlinds?.[charlieIdx]).toBe(0); // No dead blinds for wait-for-BB
        expect(hand2._intents?.[charlieIdx]).toBe(0); // Intent cleared
      });

      it('should handle early return with exact debt calculation', () => {
        // Scenario: Return with partial debt
        // Accumulated 0.5BB in dead blinds
        // Returns before BB position
        // Expected: Pay exactly 10 chips (for BB=20)

        const hand1 = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 1000, 1000],
          blindsOrStraddles: [10, 0, 20], // Bob inactive → skipped, Alice=SB, Charlie=BB
          _inactive: [0, 1, 0], // Bob paused
          _intents: [0, 2, 0],
          _deadBlinds: [0, 10, 0], // Bob has 0.5*BB debt
        });

        // Bob returns early
        const returnRequest = Poker.Hand({
          ...hand1,
          _intents: [0, 0, 0],
          author: 'Bob',
        });

        const merged = Poker.Hand.merge(hand1, returnRequest);
        const complete = {
          ...merged,
          finishingStacks: [980, 1000, 1020],
          winnings: [0, 0, 40],
        };

        const nextHand = Poker.Hand.next(complete);
        // Bob's stack unchanged, debt preserved for Game() to charge
        expect(nextHand.startingStacks[1]).toBe(1000); // Stack unchanged
        expect(nextHand._deadBlinds?.[1]).toBe(10); // Debt preserved for Game()
        expect(nextHand._inactive?.[1]).toBe(0); // Active
      });

      it('should handle leave without paying debt', () => {
        // Scenario: _intents: 3 with debt
        // Has _deadBlinds: 30
        // Leaves table permanently
        // Expected: Removed without collecting debt

        const hand1 = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 1000, 1000],
          blindsOrStraddles: [10, 0, 20], // Bob inactive → skipped, Alice=SB, Charlie=BB
          _inactive: [0, 1, 0], // Bob paused
          _intents: [0, 2, 0],
          _deadBlinds: [0, 30, 0], // Bob has max debt
        });

        // Bob leaves
        const leaveRequest = Poker.Hand({
          ...hand1,
          _intents: [0, 3, 0],
          author: 'Bob',
        });

        const merged = Poker.Hand.merge(hand1, leaveRequest);
        const complete = {
          ...merged,
          finishingStacks: [990, 1000, 1010],
          winnings: [0, 0, 30],
        };

        const nextHand = Poker.Hand.next(complete);
        // Bob removed without paying debt
        expect(nextHand.players).not.toContain('Bob');
        expect(nextHand.players).toEqual(['Alice', 'Charlie']);
      });
    });

    describe('edge case flows', () => {
      it('should handle all players leaving simultaneously', () => {
        // Scenario: Mass exit
        // All players _intents: 3 via merge
        // next() attempts to process
        // Expected: Error or special handling

        const activeHand = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 1000, 1000],
          blindsOrStraddles: [0, 10, 20],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
        });

        // Everyone wants to leave
        const aliceLeave = Poker.Hand({
          ...activeHand,
          _intents: [3, 0, 0],
          author: 'Alice',
        });

        const merged1 = Poker.Hand.merge(activeHand, aliceLeave);

        const bobLeave = Poker.Hand({
          ...merged1,
          _intents: [3, 3, 0],
          author: 'Bob',
        });

        const merged2 = Poker.Hand.merge(merged1, bobLeave);

        const charlieLeave = Poker.Hand({
          ...merged2,
          _intents: [3, 3, 3],
          author: 'Charlie',
        });

        const merged3 = Poker.Hand.merge(merged2, charlieLeave);
        expect(merged3._intents).toEqual([3, 3, 3]);

        const complete = {
          ...merged3,
          finishingStacks: [1000, 1000, 1000],
          winnings: [0, 0, 0],
        };

        const nextHand = Poker.Hand.next(complete);
        // All players removed
        expect(nextHand.players).toEqual([]);
        expect(nextHand.startingStacks).toEqual([]);
        expect(nextHand._inactive).toEqual([]);
        expect(nextHand._intents).toEqual([]);
      });

      it('should handle insufficient players after removals', () => {
        // Scenario: Below minimum players
        // 3 players -> 2 leave -> 1 remaining
        // Expected: Cannot create next hand

        const hand1 = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 1000, 1000],
          blindsOrStraddles: [0, 10, 20],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
        });

        // Bob and Charlie want to leave
        const bobLeave = Poker.Hand({
          ...hand1,
          _intents: [0, 3, 0],
          author: 'Bob',
        });

        const merged1 = Poker.Hand.merge(hand1, bobLeave);

        const charlieLeave = Poker.Hand({
          ...merged1,
          _intents: [0, 3, 3],
          author: 'Charlie',
        });

        const merged2 = Poker.Hand.merge(merged1, charlieLeave);

        const complete = {
          ...merged2,
          finishingStacks: [1030, 985, 985],
          winnings: [60, 0, 0],
        };

        const nextHand = Poker.Hand.next(complete);
        // Only Alice remains
        expect(nextHand.players).toEqual(['Alice']);
        expect(nextHand.startingStacks).toEqual([1030]);
      });

      it('should handle state validation between operations', () => {
        // SCENARIO: Active player with dead blinds (returning from pause)
        // INPUT: _inactive: [0, 0, 0], _deadBlinds: [0, 20, 0]
        // EXPECTED: Valid state - Game() will charge the debt

        // Active player with dead blinds is VALID when returning from pause
        // Game() constructor charges the debt when hand starts
        const returningPlayerHand = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 1000, 1000],
          blindsOrStraddles: [0, 10, 20],
          _inactive: [0, 0, 0], // Active (Bob just returned)
          _intents: [0, 0, 0],
          _deadBlinds: [0, 20, 0], // Bob's debt preserved for Game() to charge
        });

        const pauseRequest = Poker.Hand({
          ...returningPlayerHand,
          _intents: [0, 2, 0], // Bob wants to pause again
          author: 'Bob',
        });

        // Merge should accept - active with deadBlinds is valid for returning players
        const merged = Poker.Hand.merge(returningPlayerHand, pauseRequest);
        expect(merged._intents).toEqual([0, 2, 0]);

        // Inactive player with dead blinds - classic case
        const inactiveWithDebt = Poker.Hand({
          ...BASE_HAND,
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [1000, 1000, 1000],
          blindsOrStraddles: [10, 0, 20], // Bob inactive → skipped, Alice=SB, Charlie=BB
          _inactive: [0, 1, 0], // Inactive
          _intents: [0, 2, 0],
          _deadBlinds: [0, 20, 0], // Valid with inactive
        });

        const returnRequest = Poker.Hand({
          ...inactiveWithDebt,
          _intents: [0, 0, 0], // Bob returns
          author: 'Bob',
        });

        const mergedReturn = Poker.Hand.merge(inactiveWithDebt, returnRequest);
        expect(mergedReturn._intents).toEqual([0, 0, 0]);
        expect(mergedReturn._inactive).toEqual([0, 1, 0]); // Bob stays inactive until next hand
      });
    });
  });

  describe('Hand.start', () => {
    // NOTE: Tests use raw Hand objects to bypass validation that requires SB/BB
    // This allows testing start() logic which assigns blinds to hands without them

    it('should assign SB and BB to first two active players (3 players)', () => {
      // SCENARIO: Standard start with 3 players
      // INPUT: 3 active players with chips, no blinds assigned
      // EXPECTED: [SB, BB, 0] = [10, 20, 0]
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 0, 0],
        antes: [0, 0, 0],
        actions: [],
        minBet: 20,
        _inactive: [0, 0, 0],
      };

      const started = Poker.Hand.start(hand);

      expect(started.blindsOrStraddles).toEqual([10, 20, 0]);
    });

    it('should assign SB when only BB is set', () => {
      // SCENARIO: New player joins game with only BB set
      // INPUT: blindsOrStraddles: [0, 20]
      // EXPECTED: blindsOrStraddles: [10, 20]
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [0, 20],
        antes: [0, 0],
        actions: [],
        minBet: 20,
        _inactive: [0, 0],
      };

      const started = Poker.Hand.start(hand);

      expect(started.blindsOrStraddles).toEqual([10, 20]);
    });

    it('should assign SB and BB correctly in heads-up (2 players)', () => {
      // SCENARIO: Heads-up game - button = SB
      // INPUT: 2 active players with chips
      // EXPECTED: [SB, BB] = [10, 20]
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [0, 0],
        antes: [0, 0],
        actions: [],
        minBet: 20,
        _inactive: [0, 0],
      };

      const started = Poker.Hand.start(hand);

      expect(started.blindsOrStraddles).toEqual([10, 20]);
    });

    it('should assign SB and BB correctly with 4+ players', () => {
      // SCENARIO: Full table with 4 players
      // INPUT: 4 active players with chips
      // EXPECTED: [SB, BB, 0, 0] = [10, 20, 0, 0]
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie', 'Dan'],
        startingStacks: [1000, 1000, 1000, 1000],
        blindsOrStraddles: [0, 0, 0, 0],
        antes: [0, 0, 0, 0],
        actions: [],
        minBet: 20,
        _inactive: [0, 0, 0, 0],
      };

      const started = Poker.Hand.start(hand);

      expect(started.blindsOrStraddles).toEqual([10, 20, 0, 0]);
    });

    it('should preserve correct blinds when already assigned', () => {
      // SCENARIO: Blinds already correctly set
      // INPUT: Hand with blinds [10, 20, 0]
      // EXPECTED: Same blinds [10, 20, 0]
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [10, 20, 0],
        antes: [0, 0, 0],
        actions: [],
        minBet: 20,
        _inactive: [0, 0, 0],
      };

      const started = Poker.Hand.start(hand);

      expect(started.blindsOrStraddles).toEqual([10, 20, 0]);
    });

    it('should return unchanged hand if less than 2 active players', () => {
      // SCENARIO: Not enough players to start
      // INPUT: Only 1 active player
      // EXPECTED: Unchanged hand
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 0, 0],
        antes: [0, 0, 0],
        actions: [],
        minBet: 20,
        _inactive: [0, 1, 1],
      };

      const started = Poker.Hand.start(hand);

      expect(started.blindsOrStraddles).toEqual([0, 0, 0]);
      expect(started).toEqual(hand);
    });

    it('should skip inactive players when assigning blinds', () => {
      // SCENARIO: First player is sitting out
      // INPUT: _inactive: [1, 0, 0] - Alice sitting out
      // EXPECTED: [0, SB, BB] = [0, 10, 20]
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 0, 0],
        antes: [0, 0, 0],
        actions: [],
        minBet: 20,
        _inactive: [1, 0, 0],
      };

      const started = Poker.Hand.start(hand);

      expect(started.blindsOrStraddles).toEqual([0, 10, 20]);
    });

    it('should throw validation error when minBet is 0 for NT variant', () => {
      // SCENARIO: Invalid minBet value for No-Limit variant
      // INPUT: minBet: 0
      // EXPECTED: Throws validation error - NT requires positive minBet
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 0, 0],
        antes: [0, 0, 0],
        actions: [],
        minBet: 0,
        _inactive: [0, 0, 0],
      };

      expect(() => Poker.Hand.start(hand)).toThrow('No-limit variant NT requires positive minBet');
    });

    it('should calculate SB as minBet / 2', () => {
      // SCENARIO: SB = BB / 2 calculation
      // INPUT: minBet: 20
      // EXPECTED: SB = 10, BB = 20
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 0, 0],
        antes: [0, 0, 0],
        actions: [],
        minBet: 20,
        _inactive: [0, 0, 0],
      };

      const started = Poker.Hand.start(hand);

      expect(started.blindsOrStraddles[0]).toBe(10); // SB
      expect(started.blindsOrStraddles[1]).toBe(20); // BB
    });

    it('should skip new players (_inactive: 2) when assigning blinds', () => {
      // SCENARIO: New player in second position
      // INPUT: _inactive: [0, 2, 0] - Bob is new
      // EXPECTED: [SB, 0, BB] = [10, 0, 20]
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 0, 0],
        antes: [0, 0, 0],
        actions: [],
        minBet: 20,
        _inactive: [0, 2, 0],
      };

      const started = Poker.Hand.start(hand);

      expect(started.blindsOrStraddles).toEqual([10, 0, 20]);
    });

    it('should be idempotent - multiple calls return same result', () => {
      // SCENARIO: Calling start() multiple times
      // INPUT: Fresh hand
      // EXPECTED: Same result each time
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 0, 0],
        antes: [0, 0, 0],
        actions: [],
        minBet: 20,
        _inactive: [0, 0, 0],
      };

      const started1 = Poker.Hand.start(hand);
      const started2 = Poker.Hand.start(started1);
      const started3 = Poker.Hand.start(started2);

      expect(started1.blindsOrStraddles).toEqual([10, 20, 0]);
      expect(started2.blindsOrStraddles).toEqual([10, 20, 0]);
      expect(started3.blindsOrStraddles).toEqual([10, 20, 0]);
    });

    it('should skip players with zero chips when assigning blinds', () => {
      // SCENARIO: Player with zero stack is skipped
      // INPUT: Alice has 0 chips, Bob and Charlie have chips
      // EXPECTED: [0, SB, BB] = [0, 10, 20]
      const hand: Poker.Hand = {
        variant: 'NT',
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [0, 1000, 1000],
        blindsOrStraddles: [0, 0, 0],
        antes: [0, 0, 0],
        actions: [],
        minBet: 20,
        _inactive: [0, 0, 0],
      };

      const started = Poker.Hand.start(hand);

      expect(started.blindsOrStraddles).toEqual([0, 10, 20]);
    });
  });
});
