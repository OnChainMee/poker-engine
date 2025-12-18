import { describe, expect, it } from 'vitest';
import { Hand } from '../../Hand';
import { getActionCards } from '../../game/position';

const BASE_HAND = {
  variant: 'NT' as const,
  minBet: 20,
  hand: 1,
  antes: [0, 0, 0],
  blindsOrStraddles: [10, 20, 0],
  startingStacks: [1000, 1000, 1000],
  players: ['Hero', 'Villain', 'BB'],
  actions: [],
};
let hand: Hand;

beforeEach(() => {
  // Mock system time for consistent timestamp testing
  vi.setSystemTime(new Date(1715616000000));
  hand = Hand(BASE_HAND);
});

afterEach(() => {
  // Restore real time after each test
  vi.useRealTimers();
});

describe('mergeGames', () => {
  it('appends unique actions from the new game after common prefix', () => {
    // Using real poker actions with proper author
    const oldHand = Hand({ ...hand, actions: ['p1 cc', 'p2 cc'] });
    const newHand = Hand({
      ...hand,
      author: 'BB', // BB is p3, adding their action
      actions: ['p1 cc', 'p2 cc', 'p3 cbr 100', 'p1 f'],
    });

    // Note: 'p3 cbr 100', 'p1 f' won't be added because BB (p3) cannot submit any other player's action
    const merged = Hand.merge(oldHand, newHand);

    // Merge failed, because BB (p3) cannot submit any other player's action
    expect(merged.actions).toEqual(['p1 cc', 'p2 cc']);
  });

  it('appends actions when using allowUnsafeMerge for generic testing', () => {
    const oldHand = Hand({ ...hand, actions: ['a1', 'a2'] });
    const newHand = Hand({ ...hand, actions: ['a1', 'a2', 'a3', 'a4'] });

    // Use allowUnsafeMerge for generic test actions
    const merged = Hand.merge(oldHand, newHand, true);

    // Merge succeeded, because allowUnsafeMerge is true
    // and all actions are allowed
    expect(merged.actions).toEqual(['a1', 'a2', 'a3', 'a4']);
  });

  it('always removes author field from merged hands', () => {
    // Test with different authors - using real poker actions with 3 players
    const oldHand = Hand({ ...hand, author: 'Hero', actions: ['p1 cc'] });
    const newHand = Hand({ ...hand, author: 'Villain', actions: ['p1 cc', 'p2 cbr 100'] });

    const merged = Hand.merge(oldHand, newHand);

    expect(merged.author).toBeUndefined();
    expect(merged.actions).toEqual(['p1 cc', 'p2 cbr 100 #1715616000000']); // Villain's action gets timestamp

    // Test with same authors
    const oldHand2 = Hand({ ...hand, author: 'BB', actions: ['p1 cc', 'p2 cc'] });
    const newHand2 = Hand({ ...hand, author: 'BB', actions: ['p1 cc', 'p2 cc', 'p3 cbr 100'] });

    const merged2 = Hand.merge(oldHand2, newHand2);

    expect(merged2.author).toBeUndefined();
    expect(merged2.actions).toEqual(['p1 cc', 'p2 cc', 'p3 cbr 100 #1715616000000']); // BB's action gets timestamp

    // Test with only one having author
    const oldHand3 = Hand({ ...hand, actions: ['p3 cc'] });
    const newHand3 = Hand({ ...hand, author: 'Hero', actions: ['p3 cc', 'p1 cbr 100'] });

    const merged3 = Hand.merge(oldHand3, newHand3);

    expect(merged3.author).toBeUndefined();
    expect(merged3.actions).toEqual(['p3 cc', 'p1 cbr 100 #1715616000000']); // Hero's action gets timestamp
  });

  it('keeps later duplicate actions that represent distinct events', () => {
    const baseActions = [
      'd dh p1 Qc9s',
      'd dh p2 9c3d',
      'd dh p3 3h9d',
      'p3 cc',
      'p1 cc',
      'p2 cc',
      'd db Kh4dKs',
    ];

    const oldHand = Hand({ ...hand, actions: baseActions });
    const newHand = Hand({
      ...hand,
      author: 'Hero', // Hero is p1, adding their check
      actions: [...baseActions, 'p1 cc'],
    });

    const merged = Hand.merge(oldHand, newHand);

    expect(merged.actions).toEqual([...baseActions, 'p1 cc #1715616000000']); // Hero's action gets timestamp
  });

  describe('card visibility merging', () => {
    it('preserves real cards when merging with hidden cards', () => {
      // Server has real cards, client has hidden cards for other players
      const serverActions = ['d dh p1 AcKs', 'd dh p2 QhJd', 'd dh p3 Tc9h'];

      // Client perspective from p1 - knows own cards, others are hidden
      const clientActions = ['d dh p1 AcKs', 'd dh p2 ????', 'd dh p3 ????'];

      const serverHand = Hand({ ...hand, actions: serverActions });
      const clientHand = Hand({ ...hand, actions: clientActions });

      const merged = Hand.merge(serverHand, clientHand);

      // Should preserve server's real cards
      expect(merged.actions).toEqual(serverActions);
    });

    it('fills in missing card information when new hand has real cards', () => {
      // Old state has hidden cards
      const oldActions = ['d dh p1 ????', 'd dh p2 QhJd', 'd dh p3 Tc9h'];

      // New state reveals p1's cards
      const newActions = ['d dh p1 AcKs', 'd dh p2 QhJd', 'd dh p3 Tc9h'];

      const oldHand = Hand({ ...hand, actions: oldActions });
      const newHand = Hand({ ...hand, actions: newActions });

      const merged = Hand.merge(oldHand, newHand);

      // Should use new hand's real cards to fill in missing info
      expect(merged.actions).toEqual(newActions);
    });

    it('keeps authoritative cards when both have real but conflicting cards', () => {
      // Old (authoritative) has one set of real cards
      const oldActions = ['d dh p1 AcKs', 'd dh p2 QhJd', 'd dh p3 Tc9h'];

      // New has different real cards (shouldn't happen in practice but handles edge case)
      const newActions = [
        'd dh p1 2c3s', // Different cards!
        'd dh p2 QhJd',
        'd dh p3 Tc9h',
      ];

      const oldHand = Hand({ ...hand, actions: oldActions });
      const newHand = Hand({ ...hand, actions: newActions });

      const merged = Hand.merge(oldHand, newHand);

      // Should keep old (authoritative) cards
      expect(getActionCards(merged.actions[0])).toEqual(['Ac', 'Ks']);
      expect(getActionCards(merged.actions[1])).toEqual(['Qh', 'Jd']);
      expect(getActionCards(merged.actions[2])).toEqual(['Tc', '9h']);
    });

    it('maintains consistency when both have hidden cards', () => {
      // Both states have hidden cards
      const oldActions = ['d dh p1 AcKs', 'd dh p2 ????', 'd dh p3 ????'];

      const newActions = ['d dh p1 AcKs', 'd dh p2 ????', 'd dh p3 ????'];

      const oldHand = Hand({ ...hand, actions: oldActions });
      const newHand = Hand({ ...hand, actions: newActions });

      const merged = Hand.merge(oldHand, newHand);

      // Should keep old hand's version
      expect(merged.actions).toEqual(oldActions);
    });

    it('correctly merges hands with mixed card visibility and additional actions', () => {
      // Complex scenario with card visibility and new actions
      const serverActions = ['d dh p1 AcKs', 'd dh p2 QhJd', 'd dh p3 Tc9h', 'p3 cc', 'p1 r 100'];

      // Client sees own cards, others hidden, and adds new action
      const clientActions = [
        'd dh p1 AcKs',
        'd dh p2 ????',
        'd dh p3 ????',
        'p3 cc',
        'p1 r 100',
        'p2 f', // New action from client (Villain folds)
      ];

      const serverHand = Hand({ ...hand, actions: serverActions });
      const clientHand = Hand({
        ...hand,
        author: 'Villain', // Villain is p2, adding their fold
        actions: clientActions,
      });

      const merged = Hand.merge(serverHand, clientHand);

      // Should preserve server's real cards and add new action
      expect(merged.actions).toEqual([
        'd dh p1 AcKs',
        'd dh p2 QhJd',
        'd dh p3 Tc9h',
        'p3 cc',
        'p1 r 100',
        'p2 f #1715616000000', // Villain's action gets timestamp
      ]);
    });

    it('handles equivalent hole card actions with same player and card count', () => {
      // Test the equivalence logic for hole cards
      const oldActions = ['d dh p1 AcKs', 'd dh p2 ????', 'p1 cc'];

      const newActions = [
        'd dh p1 AcKs',
        'd dh p2 ????', // Same hidden cards
        'p1 cc',
        'p2 cc', // New action
      ];

      const oldHand = Hand({ ...hand, actions: oldActions });
      const newHand = Hand({
        ...hand,
        author: 'Villain', // Villain is p2, adding their check
        actions: newActions,
      });

      const merged = Hand.merge(oldHand, newHand);

      expect(merged.actions).toEqual([
        'd dh p1 AcKs',
        'd dh p2 ????',
        'p1 cc',
        'p2 cc #1715616000000',
      ]); // Villain's action gets timestamp
    });
  });

  describe('security and author validation', () => {
    it('rejects actions from non-author players', () => {
      const oldHand = Hand({ ...hand, actions: ['p1 cc', 'p2 cc'] });
      const newHand = Hand({
        ...hand,
        hand: 1,
        author: 'Hero', // Hero is p1
        actions: ['p1 cc', 'p2 cc', 'p2 cbr 100'], // Trying to add p2's action
      });

      const merged = Hand.merge(oldHand, newHand);

      // Should reject p2's action since Hero (p1) cannot submit it
      expect(merged.actions).toEqual(['p1 cc', 'p2 cc']);
    });

    it('allows messages from any player', () => {
      const oldHand = Hand({ ...hand, actions: ['p1 cc'] });
      const newHand = Hand({
        ...hand,
        author: 'Hero', // Hero is p1
        actions: [
          'p1 cc',
          'p2 m "Nice hand!"', // Message from p2
          'p3 m "Good luck!"', // Message from p3
          'p1 cbr 100', // Hero's action
        ],
      });

      const merged = Hand.merge(oldHand, newHand);

      // Messages should be allowed even from non-author players
      expect(merged.actions).toEqual([
        'p1 cc',
        'p2 m "Nice hand!"',
        'p3 m "Good luck!"',
        'p1 cbr 100 #1715616000000', // Hero's action gets timestamp
      ]);
    });

    it('requires allowUnsafeMerge for dealer actions', () => {
      const oldHand = Hand({ ...hand, actions: ['p1 cc', 'p2 cc', 'p3 cc'] });

      // Try to add board cards without allowUnsafeMerge
      const newHand1 = Hand({
        ...hand,
        author: undefined, // Server has no author
        actions: ['p1 cc', 'p2 cc', 'p3 cc', 'd db AhKhQh'],
      });

      const merged1 = Hand.merge(oldHand, newHand1);
      expect(merged1.actions).toEqual(['p1 cc', 'p2 cc', 'p3 cc']); // Rejected

      // Now with allowUnsafeMerge
      const merged2 = Hand.merge(oldHand, newHand1, true);
      expect(merged2.actions).toEqual(['p1 cc', 'p2 cc', 'p3 cc', 'd db AhKhQh']); // Accepted
    });

    it('ignores allowUnsafeMerge when author is set (security enforcement)', () => {
      const oldHand = Hand({ ...hand, actions: ['p1 cc', 'p2 cc', 'p3 cc'] });

      // Try to add dealer actions with author set AND allowUnsafeMerge=true
      const newHandWithAuthor = Hand({
        ...hand,
        author: 'Hero', // Author is set
        actions: ['p1 cc', 'p2 cc', 'p3 cc', 'd db AhKhQh'],
      });

      // Even with allowUnsafeMerge=true, dealer actions should be rejected when author is set
      const merged = Hand.merge(oldHand, newHandWithAuthor, true);
      expect(merged.actions).toEqual(['p1 cc', 'p2 cc', 'p3 cc']); // Rejected despite allowUnsafeMerge=true

      // Also test with hole cards
      const oldHand2 = Hand({ ...hand, actions: [] });
      const newHandWithHoleCards = Hand({
        ...hand,
        author: 'Villain', // Author is set
        actions: ['d dh p1 AcKs', 'd dh p2 QhJd', 'd dh p3 Tc9h'],
      });

      const merged2 = Hand.merge(oldHand2, newHandWithHoleCards, true);
      expect(merged2.actions).toEqual([]); // Rejected despite allowUnsafeMerge=true
    });

    it('handles multiple players requiring separate merges', () => {
      let gameState = Hand({ ...hand, actions: [] });

      // Hero's action
      const heroAction = Hand({ ...hand, author: 'Hero', actions: ['p1 cc'] });
      gameState = Hand.merge(gameState, heroAction);
      expect(gameState.actions).toEqual(['p1 cc #1715616000000']); // Hero's action gets timestamp

      // Villain's action
      const villainAction = Hand({ ...hand, author: 'Villain', actions: ['p1 cc', 'p2 cbr 100'] });
      gameState = Hand.merge(gameState, villainAction);
      expect(gameState.actions).toEqual(['p1 cc #1715616000000', 'p2 cbr 100 #1715616000000']); // Villain's action also gets timestamp

      // BB's action
      const bbAction = Hand({ ...hand, author: 'BB', actions: ['p1 cc', 'p2 cbr 100', 'p3 f'] });
      gameState = Hand.merge(gameState, bbAction);
      expect(gameState.actions).toEqual([
        'p1 cc #1715616000000',
        'p2 cbr 100 #1715616000000',
        'p3 f #1715616000000',
      ]); // BB's action also gets timestamp
    });
  });
});
