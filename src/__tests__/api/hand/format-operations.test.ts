import { describe, expect, it } from 'vitest';
import * as Poker from '../../../index';
import { BASE_HAND, BASE_HAND_PARSED, BASE_HAND_POKERSTARS } from './fixtures/baseHand';

/**
 * Format Operations Tests for Hand API
 *
 * Purpose: Test Hand format conversion including:
 * 1. Parse from different formats (json, pokerstars)
 * 2. Serialize to different formats
 * 3. Round-trip validation
 *
 * Uses BASE_HAND, BASE_HAND_PARSED, and BASE_HAND_POKERSTARS fixtures
 */
describe('Hand Format Operations', () => {
  describe('Format parse methods', () => {
    it('should parse Hand from JSON string using Format.JSON.parse', () => {
      const jsonString = JSON.stringify(BASE_HAND);
      const parsed = Poker.Format.JSON.parse(jsonString);

      expect(parsed.variant).toBe(BASE_HAND.variant);
      expect(parsed.players).toEqual(BASE_HAND.players);
      expect(parsed.actions).toEqual(BASE_HAND.actions);
    });

    it('should parse Hand from PokerStars format using Format.Pokerstars.parse', () => {
      const parsed = Poker.Format.Pokerstars.parse(BASE_HAND_POKERSTARS);

      expect(parsed.variant).toBe(BASE_HAND_PARSED.variant);
      expect(parsed.players).toEqual(BASE_HAND_PARSED.players);
      expect(parsed.startingStacks).toEqual(BASE_HAND_PARSED.startingStacks);
      expect(parsed.blindsOrStraddles).toEqual(BASE_HAND_PARSED.blindsOrStraddles);
      expect(parsed.actions).toEqual(BASE_HAND_PARSED.actions);
      expect(parsed.venue).toBe('PokerStars');
      expect(parsed.currency).toBe('USD');
      expect(parsed.rake).toBe(0.86);
    });

    it('should handle parsed PokerStars hand with all metadata using Format.JSON.parse', () => {
      const jsonString = JSON.stringify(BASE_HAND_PARSED);
      const parsed = Poker.Format.JSON.parse(jsonString);

      expect(parsed.venue).toBe('PokerStars');
      expect(parsed.currency).toBe('USD');
      expect(parsed.timestamp).toBe(1735165507000);
      expect(parsed.timeZone).toBe('UTC');
      expect(parsed.rake).toBe(0.86);
      expect(parsed.totalPot).toBe(17.24);
      expect(parsed.seatCount).toBe(6);
      expect(parsed.table).toBe('Vaticana II');
      expect(parsed.hand).toBe(254024998080);
    });

    it('should handle hands with private fields using Format.JSON.parse', () => {
      const handWithPrivates = {
        ...BASE_HAND,
        _venueIds: ['id1', 'id2', 'id3'],
        _customField: 'test',
      };
      const jsonString = JSON.stringify(handWithPrivates);
      const parsed = Poker.Format.JSON.parse(jsonString);

      expect(parsed._venueIds).toEqual(['id1', 'id2', 'id3']);
      expect(parsed._customField).toBe('test');
    });
  });

  describe('Format serialize methods', () => {
    it('should serialize Hand to JSON string using Format.JSON.stringify', () => {
      const serialized = Poker.Format.JSON.stringify(BASE_HAND);
      const parsed = JSON.parse(serialized);

      expect(parsed.variant).toBe(BASE_HAND.variant);
      expect(parsed.players).toEqual(BASE_HAND.players);
      expect(parsed.actions).toEqual(BASE_HAND.actions);
    });

    it('should serialize parsed PokerStars hand to JSON using Format.JSON.stringify', () => {
      const serialized = Poker.Format.JSON.stringify(BASE_HAND_PARSED);
      const parsed = JSON.parse(serialized);

      expect(parsed.venue).toBe('PokerStars');
      expect(parsed.players).toEqual(BASE_HAND_PARSED.players);
      expect(parsed.rake).toBe(0.86);
      expect(parsed.actions).toEqual(BASE_HAND_PARSED.actions);
    });

    it('should serialize to PokerStars format using Format.Pokerstars.stringify', () => {
      const serialized = Poker.Format.Pokerstars.stringify(BASE_HAND_PARSED);

      // Should contain key PokerStars format elements
      expect(serialized).toContain('PokerStars Hand #');
      expect(serialized).toContain("Hold'em No Limit");
      expect(serialized).toContain('*** HOLE CARDS ***');
      expect(serialized).toContain('*** FLOP ***');
      expect(serialized).toContain('*** TURN ***');
      expect(serialized).toContain('*** RIVER ***');
      expect(serialized).toContain('*** SHOW DOWN ***');
      expect(serialized).toContain('*** SUMMARY ***');
    });

    it('should preserve all fields including private ones using Format.JSON.stringify', () => {
      const handWithPrivates = {
        ...BASE_HAND,
        _venueIds: ['id1', 'id2', 'id3'],
        _heroIds: ['hero1', null, 'hero3'],
      };

      const serialized = Poker.Format.JSON.stringify(handWithPrivates);
      const parsed = JSON.parse(serialized);

      expect(parsed._venueIds).toEqual(['id1', 'id2', 'id3']);
      expect(parsed._heroIds).toEqual(['hero1', null, 'hero3']);
    });
  });

  describe('Round-trip Operations', () => {
    it('should preserve Hand through parse->serialize cycle using Format.JSON', () => {
      const serialized = Poker.Format.JSON.stringify(BASE_HAND);
      const parsed = Poker.Format.JSON.parse(serialized);
      const serializedAgain = Poker.Format.JSON.stringify(parsed);

      expect(serializedAgain).toBe(serialized);
    });

    it('should preserve complex Hand structures using Format.JSON', () => {
      const complexHand = {
        ...BASE_HAND,
        venue: 'TestVenue',
        table: 'table-123',
        _venueIds: ['id1', 'id2', 'id3'],
        rake: 5,
        currency: 'USD',
      };

      const serialized = Poker.Format.JSON.stringify(complexHand);
      const parsed = Poker.Format.JSON.parse(serialized);

      expect(parsed).toEqual(complexHand);
    });

    it('should handle PokerStars format round-trip', () => {
      // Parse from PokerStars format
      const parsed = Poker.Format.Pokerstars.parse(BASE_HAND_POKERSTARS);

      // Serialize to JSON and back
      const jsonSerialized = Poker.Format.JSON.stringify(parsed);
      const parsedFromJson = Poker.Format.JSON.parse(jsonSerialized);

      // Should preserve all fields
      expect(parsedFromJson.players).toEqual(parsed.players);
      expect(parsedFromJson.actions).toEqual(parsed.actions);
      expect(parsedFromJson.rake).toBe(parsed.rake);
      expect(parsedFromJson.venue).toBe(parsed.venue);
    });

    it('should handle empty actions array using Format.JSON', () => {
      const handWithNoActions = {
        ...BASE_HAND,
        actions: [],
      };

      const serialized = Poker.Format.JSON.stringify(handWithNoActions);
      const parsed = Poker.Format.JSON.parse(serialized);

      expect(parsed.actions).toEqual([]);
    });
  });
});
