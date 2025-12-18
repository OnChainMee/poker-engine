import { describe, expect, it } from 'vitest';
import {
  getActionAmount,
  getActionCards,
  getActionPlayerIndex,
  getActionTimestamp,
  getActionType,
} from '../../../game/position';
import * as Poker from '../../../index';
import { BASE_HAND } from './fixtures/baseHand';

/**
 * Construction Tests for Hand API
 *
 * Purpose: Test Hand constructor behavior including:
 * 1. Basic construction from partial data
 * 2. Variant-specific defaults
 * 3. Minimal valid hand creation
 *
 * Uses BASE_HAND as reference for expected structures
 */
describe('Hand Construction', () => {
  describe('Basic Construction', () => {
    it('should construct Hand from complete data', () => {
      const hand = Poker.Hand(BASE_HAND);

      expect(hand.variant).toBe('NT');
      expect(hand.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(hand.startingStacks).toEqual([1000, 1000, 1000]);
      expect(hand.blindsOrStraddles).toEqual([0, 10, 20]);
      expect(hand.minBet).toBe(20);
      expect(hand.seed).toBe(12345);
      expect(hand.actions).toHaveLength(21);
    });

    it('should construct Hand from minimal data', () => {
      const minimal = Poker.Hand({
        variant: 'NT',
        players: ['Alice'],
        startingStacks: [1000],
        blindsOrStraddles: [10],
        antes: [0],
        minBet: 20,
      });

      expect(minimal.variant).toBe('NT');
      expect(minimal.players).toEqual(['Alice']);
      expect(minimal.startingStacks).toEqual([1000]);
    });

    it('should preserve empty arrays', () => {
      const hand = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [10, 20],
        actions: [],
        antes: [],
        minBet: 20,
      });

      expect(hand.actions).toEqual([]);
      expect(hand.antes).toEqual([]);
    });
  });

  describe('Optional Field Handling', () => {
    it('should preserve optional metadata fields', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        venue: 'TestVenue',
        table: 'table-123',
        gameId: 'game-456',
        hand: 42,
        author: 'Alice',
        currency: 'USD',
        timeLimit: 30,
      } as any);

      expect(hand.venue).toBe('TestVenue');
      expect(hand.table).toBe('table-123');
      expect(hand.hand).toBe(42);
      expect(hand.author).toBe('Alice');
      expect(hand.currency).toBe('USD');
      expect(hand.timeLimit).toBe(30);
    });

    it('should preserve private venue fields', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        _venueIds: ['alice123', 'bob456', 'charlie789'],
        _heroIds: ['hero1', null, 'hero3'],
        _customData: { some: 'data' },
      });

      expect(hand._venueIds).toEqual(['alice123', 'bob456', 'charlie789']);
      expect(hand._heroIds).toEqual(['hero1', null, 'hero3']);
      expect(hand._customData).toEqual({ some: 'data' });
    });
  });

  describe('Action Preservation', () => {
    it('should preserve complete action sequences with all components', () => {
      const hand = Poker.Hand(BASE_HAND);

      expect(hand.actions).toHaveLength(21);

      // Verify first action: deal hole cards to player 1
      const firstAction = hand.actions[0];
      expect(getActionType(firstAction)).toBe('dh');
      expect(getActionPlayerIndex(firstAction)).toBe(0); // 0-based
      expect(getActionCards(firstAction)).toEqual(['6c', '5h']);
      expect(getActionTimestamp(firstAction)).toBe(1756734331690);

      // Verify player action: p1 call/check
      const playerAction = hand.actions[3];
      expect(getActionType(playerAction)).toBe('cc');
      expect(getActionPlayerIndex(playerAction)).toBe(0); // 0-based
      expect(getActionTimestamp(playerAction)).toBe(1756734331691);

      // Verify dealer board action
      const boardAction = hand.actions[6];
      expect(getActionType(boardAction)).toBe('db');
      expect(getActionCards(boardAction)).toEqual(['8s', '2d', 'Js']);
      expect(getActionTimestamp(boardAction)).toBe(1756734331691);

      // Verify showdown action
      const showAction = hand.actions[18];
      expect(getActionType(showAction)).toBe('sm');
      expect(getActionPlayerIndex(showAction)).toBe(1); // 0-based
      expect(getActionCards(showAction)).toEqual(['Jc', '2s']);
      expect(getActionTimestamp(showAction)).toBe(1756734331692);

      // Verify last action
      const lastAction = hand.actions[hand.actions.length - 1];
      expect(getActionType(lastAction)).toBe('sm');
      expect(getActionPlayerIndex(lastAction)).toBe(0); // 0-based
      expect(getActionCards(lastAction)).toEqual(['6c', '5h']);
    });

    it('should handle hands with no actions', () => {
      const hand = Poker.Hand({
        ...BASE_HAND,
        actions: [],
      });

      expect(hand.actions).toEqual([]);
    });

    it('should preserve action timestamps and amounts correctly', () => {
      const handWithTimestamps = Poker.Hand({
        variant: 'NT',
        players: ['Alice', 'Bob'],
        startingStacks: [1000, 1000],
        blindsOrStraddles: [10, 20],
        antes: [0, 0],
        minBet: 20,
        actions: [
          'd dh p1 AsKs #1700000000000',
          'd dh p2 QhQd #1700000001000',
          'p1 cbr 60 #1700000005000',
          'p2 cc 60 #1700000008000',
        ],
      });

      // Verify first deal action
      const deal1 = handWithTimestamps.actions[0];
      expect(getActionTimestamp(deal1)).toBe(1700000000000);
      expect(getActionCards(deal1)).toEqual(['As', 'Ks']);

      // Verify second deal action
      const deal2 = handWithTimestamps.actions[1];
      expect(getActionTimestamp(deal2)).toBe(1700000001000);
      expect(getActionCards(deal2)).toEqual(['Qh', 'Qd']);

      // Verify bet action with amount
      const betAction = handWithTimestamps.actions[2];
      expect(getActionType(betAction)).toBe('cbr');
      expect(getActionAmount(betAction)).toBe(60);
      expect(getActionTimestamp(betAction)).toBe(1700000005000);

      // Verify call action with amount
      const callAction = handWithTimestamps.actions[3];
      expect(getActionType(callAction)).toBe('cc');
      expect(getActionAmount(callAction)).toBe(60);
      expect(getActionTimestamp(callAction)).toBe(1700000008000);
    });
  });
});
