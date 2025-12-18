import { describe, expect, it } from 'vitest';
import { compareHands } from '../../game/showdown';

describe('compareHands', () => {
  it('compares high card hands correctly', () => {
    // 7 distinct ranks, no pairs, no straights, no flushes

    // Higher card wins
    expect(
      compareHands(
        // Highest card = King
        ['Kh', 'Qd', '9s', '7c', '5h', '3d', '2s'],
        // Highest card = Queen
        ['Qh', 'Jd', '9s', '7c', '5h', '3d', '2s']
      )
    ).toBeGreaterThan(0);

    expect(
      compareHands(
        // Reverse order
        ['Qh', 'Jd', '9s', '7c', '5h', '3d', '2s'],
        ['Kh', 'Qd', '9s', '7c', '5h', '3d', '2s']
      )
    ).toBeLessThan(0);

    // Same high card, second-highest card decides
    expect(
      compareHands(
        // Highest cards = K, Q
        ['Kh', 'Qd', '9s', '7c', '5h', '3d', '2s'],
        // Highest cards = K, J (lower second card)
        ['Kh', 'Jd', '9s', '7c', '5h', '3d', '2s']
      )
    ).toBeGreaterThan(0);

    expect(
      compareHands(
        // Reverse
        ['Kh', 'Jd', '9s', '7c', '5h', '3d', '2s'],
        ['Kh', 'Qd', '9s', '7c', '5h', '3d', '2s']
      )
    ).toBeLessThan(0);

    // Exact same cards = tie
    expect(
      compareHands(
        ['Kh', 'Qd', '9s', '7c', '5h', '3d', '2s'],
        ['Kh', 'Qd', '9s', '7c', '5h', '3d', '2s']
      )
    ).toBe(0);
  });

  it('compares pair hands correctly', () => {
    // Make sure we only have exactly one pair in each hand

    // Higher pair wins
    expect(
      compareHands(
        // Pair of 8s
        ['8h', '8d', 'Qh', 'Js', '9c', '5d', '2s'],
        // Pair of 7s
        ['7h', '7d', 'Qh', 'Js', '9c', '5d', '2s']
      )
    ).toBeGreaterThan(0);

    expect(
      compareHands(
        // Reverse
        ['7h', '7d', 'Qh', 'Js', '9c', '5d', '2s'],
        ['8h', '8d', 'Qh', 'Js', '9c', '5d', '2s']
      )
    ).toBeLessThan(0);

    // Same pair, kicker decides
    expect(
      compareHands(
        // Pair of 8s, highest kicker = Queen
        ['8h', '8d', 'Qh', 'Js', '9c', '6d', '2s'],
        // Pair of 8s, highest kicker = Jack
        ['8h', '8d', 'Jh', 'Ts', '9c', '6d', '2s']
      )
    ).toBeGreaterThan(0);

    // Same pair and same kickers = tie
    expect(
      compareHands(
        // Pair of 8s, exact same other cards
        ['8h', '8d', 'Qh', 'Js', '9c', '6d', '2s'],
        ['8h', '8d', 'Qh', 'Js', '9c', '6d', '2s']
      )
    ).toBe(0);
  });

  it('compares two pair hands correctly', () => {
    // Exactly two distinct pairs per hand

    // Higher top pair wins
    expect(
      compareHands(
        // Two pairs: 8s and 7s
        ['8h', '8d', '7h', '7d', 'Qc', 'Js', '2s'],
        // Two pairs: 7s and 6s
        ['7h', '7d', '6h', '6d', 'Qc', 'Js', '2s']
      )
    ).toBeGreaterThan(0);

    // Same top pair, higher second pair wins
    expect(
      compareHands(
        // Top pair of 8s, second pair of 7s
        ['8h', '8d', '7h', '7d', 'Qc', 'Js', '2s'],
        // Top pair of 8s, second pair of 6s
        ['8h', '8d', '6h', '6d', 'Qc', 'Js', '2s']
      )
    ).toBeGreaterThan(0);

    // Same two pairs, kicker decides
    expect(
      compareHands(
        // 8s and 7s, kicker = Q
        ['8h', '8d', '7h', '7d', 'Qc', 'Js', '2s'],
        // 8s and 7s, kicker = J
        ['8h', '8d', '7h', '7d', 'Jc', 'Ts', '2s']
      )
    ).toBeGreaterThan(0);

    // Same two pairs and same kicker = tie
    expect(
      compareHands(
        ['8h', '8d', '7h', '7d', 'Qc', 'Js', '2s'],
        ['8h', '8d', '7h', '7d', 'Qc', 'Js', '2s']
      )
    ).toBe(0);
  });

  it('compares three of a kind hands correctly', () => {
    // Exactly three of a kind, ensure no extra pairs

    // Higher three of a kind wins
    expect(
      compareHands(
        // Three 8s
        ['8h', '8d', '8c', 'Qh', 'Js', '5d', '2s'],
        // Three 7s
        ['7h', '7d', '7c', 'Qh', 'Js', '5d', '2s']
      )
    ).toBeGreaterThan(0);

    // Same three of a kind, higher kicker wins
    expect(
      compareHands(
        // Three 8s, top kicker Q
        ['8h', '8d', '8c', 'Qh', 'Js', '5d', '2s'],
        // Three 8s, top kicker J
        ['8h', '8d', '8c', 'Jh', 'Ts', '5d', '2s']
      )
    ).toBeGreaterThan(0);

    // Same three of a kind and same kickers = tie
    expect(
      compareHands(
        ['8h', '8d', '8c', 'Qh', 'Js', '5d', '2s'],
        ['8h', '8d', '8c', 'Qh', 'Js', '5d', '2s']
      )
    ).toBe(0);
  });

  it('compares straight and flush hands correctly', () => {
    // Make sure the "straight" sets are actual straights, and flushes are actual flushes

    // Straight beats high card
    expect(
      compareHands(
        // Straight: 5-6-7-8-9
        ['9h', '8d', '7s', '6h', '5c', '2d', '3s'],
        // High card (no pair, no straight)
        ['Kh', 'Jd', '9s', '7c', '5h', '3d', '2s']
      )
    ).toBeGreaterThan(0);

    // Higher straight wins (9-high straight vs 8-high straight)
    expect(
      compareHands(
        // 5-6-7-8-9
        ['9h', '8d', '7s', '6h', '5c', '2d', '3s'],
        // 4-5-6-7-8
        ['8h', '7d', '6s', '5h', '4c', '2d', '3s']
      )
    ).toBeGreaterThan(0);

    // Flush beats straight
    expect(
      compareHands(
        // Flush: 5 hearts (9h, 8h, 7h, 6h, 4h)
        ['9h', '8h', '7h', '6h', '4h', '2d', '3s'],
        // Straight but not a flush
        ['9s', '8d', '7c', '6h', '5c', '2d', '3s']
      )
    ).toBeGreaterThan(0);

    // Higher flush wins (9-high flush vs 8-high flush)
    expect(
      compareHands(
        // 9-high flush
        ['9h', '8h', '7h', '6h', '4h', '2d', '3s'],
        // 8-high flush
        ['8h', '7h', '6h', '5h', '3h', '2d', '3s']
      )
    ).toBeGreaterThan(0);
  });

  it('compares full house and four of a kind hands correctly', () => {
    // Full house vs flush, etc.

    // Full house beats flush
    expect(
      compareHands(
        // Full house: 8-8-8 + 7-7
        ['8h', '8d', '8c', '7h', '7d', '2s', '3c'],
        // Flush: 5 hearts
        ['9h', '8h', '7h', '6h', '4h', '2d', '3s']
      )
    ).toBeGreaterThan(0);

    // Higher three in full house wins (8s vs 7s)
    expect(
      compareHands(
        ['8h', '8d', '8c', '7h', '7d', '2s', '3c'],
        ['7h', '7d', '7c', '8h', '8d', '2s', '3c']
      )
    ).toBeGreaterThan(0);

    // Same three, higher pair in full house
    expect(
      compareHands(
        // 8-8-8 + 7-7
        ['8h', '8d', '8c', '7h', '7d', '2s', '3c'],
        // 8-8-8 + 6-6
        ['8h', '8d', '8c', '6h', '6d', '2s', '3c']
      )
    ).toBeGreaterThan(0);

    // Four of a kind beats full house
    expect(
      compareHands(
        // Four 8s
        ['8h', '8d', '8c', '8s', '7d', '2c', '3h'],
        // Full house (7-7-7 + 8-8)
        ['7h', '7d', '7c', '8h', '8d', '2s', '3c']
      )
    ).toBeGreaterThan(0);

    // Higher four of a kind wins (8s vs 7s)
    expect(
      compareHands(
        ['8h', '8d', '8c', '8s', '2d', '3c', '4h'],
        ['7h', '7d', '7c', '7s', '8d', '2s', '3c']
      )
    ).toBeGreaterThan(0);
  });

  it('compares straight flush and royal flush hands correctly', () => {
    // Straight flush, royal flush, etc.

    // Straight flush beats four of a kind
    expect(
      compareHands(
        // Royal flush in hearts (A-K-Q-J-10 all hearts)
        ['Ah', 'Kh', 'Qh', 'Jh', 'Th', '2h', '3h'],
        // Four of a kind
        ['8s', '8d', '8c', '8h', '7d', '2c', '3s']
      )
    ).toBeGreaterThan(0);

    // Higher straight flush wins (A-high vs K-high)
    expect(
      compareHands(
        // A-K-Q-J-10 hearts
        ['Ah', 'Kh', 'Qh', 'Jh', 'Th', '2h', '3h'],
        // K-Q-J-10-9 hearts
        ['Kh', 'Qh', 'Jh', 'Th', '9h', '2h', '3h']
      )
    ).toBeGreaterThan(0);

    // Royal flush ties with royal flush (different suits)
    expect(
      compareHands(
        ['Ah', 'Kh', 'Qh', 'Jh', 'Th', '2h', '3h'],
        ['Ad', 'Kd', 'Qd', 'Jd', 'Td', '2d', '3d']
      )
    ).toBe(0);
  });

  it('handles edge cases correctly', () => {
    // Ace can be low in a straight (A-2-3-4-5)

    // A-2-3-4-5 (Ace is low) vs 2-3-4-5-6 (higher straight)
    expect(
      compareHands(
        ['Ah', '2d', '3s', '4h', '5c', '7d', '8s'], // Actually a 5-high straight
        ['6h', '5d', '4s', '3h', '2c', '7d', '8s'] // 6-high straight
      )
    ).toBeLessThan(0);

    // Identical 7-card hands
    expect(
      compareHands(
        ['8h', '7d', '6s', '5h', '4c', '2d', '3s'],
        ['8h', '7d', '6s', '5h', '4c', '2d', '3s']
      )
    ).toBe(0);
  });
});
