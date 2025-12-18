import type { Hand } from '../../../../Hand';
import { FixedLimitHand, NoLimitHand } from '../../../../types';

/**
 * Base hand fixture for creating consistent Game states
 * This represents a typical mid-hand scenario with various player states
 */
export const NO_LIMIT_HAND: NoLimitHand = {
  variant: 'NT',
  players: ['Alice', 'Bob', 'Charlie', 'David'],
  startingStacks: [1000, 1500, 800, 1200],
  blindsOrStraddles: [10, 20, 0, 0],
  antes: [0, 0, 0, 0],
  minBet: 20,
  actions: [
    'd dh p1 AsKs',
    'd dh p2 7h2d',
    'd dh p3 QhQc',
    'd dh p4 JdTd',
    'p3 cbr 60', // Charlie raises to 60
    'p4 cc 60', // David calls 60
    'p1 f', // Alice folds
    'p2 f', // Bob folds
    'd db AhKhQd', // Flop
  ],
  seed: 12345,
  timeLimit: 30,
  rake: 0,
  rakePercentage: 0.05,
  currency: 'USD',
  table: 'test-table-1',
  hand: 1,
};

export const FIXED_LIMIT_HAND: FixedLimitHand = {
  variant: 'FT',
  players: ['Alice', 'Bob', 'Charlie', 'David'],
  startingStacks: [1000, 1500, 800, 1200],
  blindsOrStraddles: [10, 20, 0, 0],
  antes: [0, 0, 0, 0],
  smallBet: 10,
  bigBet: 20,
  actions: [
    'd dh p1 AsKs',
    'd dh p2 7h2d',
    'd dh p3 QhQc',
    'd dh p4 JdTd',
    'p3 cbr 60', // Charlie raises to 60
    'p4 cc 60', // David calls 60
    'p1 f', // Alice folds
    'p2 f', // Bob folds
    'd db AhKhQd', // Flop
  ],
  seed: 12345,
  timeLimit: 30,
  rake: 0,
  rakePercentage: 0.05,
  currency: 'USD',
  table: 'test-table-1',
  hand: 1,
};

/**
 * Hand in showdown state - multiple players after final betting
 */
export const SHOWDOWN_HAND: Hand = {
  ...NO_LIMIT_HAND,
  actions: [
    ...NO_LIMIT_HAND.actions,
    'p3 cc', // Charlie checks
    'p4 cc', // David checks
    'd db Td', // Turn
    'p3 cc', // Charlie checks
    'p4 cbr 100', // David bets 100
    'p3 cc 100', // Charlie calls
    'd db 9s', // River
    'p3 cc', // Charlie checks
    'p4 cc', // David checks
    'p3 sm QhQc', // Charlie shows
    'p4 sm JdTd', // David shows
    // Now in showdown with Charlie and David
  ],
};

/**
 * Completed hand with finishing data
 */
export const COMPLETED_HAND: Hand = {
  ...SHOWDOWN_HAND,
  antes: [0, 0, 0, 0],
  blindsOrStraddles: [10, 20, 0, 0],
  actions: [...SHOWDOWN_HAND.actions],
  finishingStacks: [990, 1480, 1000, 1030],
  winnings: [0, 0, 200, 0],
  totalPot: 470,
};

/**
 * Hand with author perspective set (personalized view)
 */
export const PERSONALIZED_HAND: Hand = {
  ...NO_LIMIT_HAND,
  author: 'Alice',
  antes: [0, 0, 0, 0],
  blindsOrStraddles: [10, 20, 0, 0],
  actions: [
    'd dh p1 AsKs', // Alice can see her cards
    'd dh p2 ????', // Hidden from Alice
    'd dh p3 ????', // Hidden from Alice
    'd dh p4 ????', // Hidden from Alice
    'p3 cbr 60',
    'p4 cc 60',
    'p1 f',
    'p2 f',
    'd db AhKhQd',
  ],
  seed: undefined, // Removed in personalized view
  _venueIds: undefined, // Removed in personalized view
};

/**
 * Minimal hand for edge case testing
 */
export const MINIMAL_HAND: Hand = {
  variant: 'NT',
  players: ['Alice', 'Bob'],
  antes: [0, 0],
  startingStacks: [1000, 1000],
  blindsOrStraddles: [10, 20],
  minBet: 20,
  actions: [],
};
