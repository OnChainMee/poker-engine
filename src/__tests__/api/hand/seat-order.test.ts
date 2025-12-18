import { beforeEach, describe, expect, it } from 'vitest';
import { Hand } from '../../../Hand';
import { fixture as fivePlayerCompletedHandFixture } from '../../fixtures/hands/07-preflop-raise-and-flop-fold';
import { NoLimitHand } from '../../../types';
describe('Hand.next() seat-driven ordering', () => {
  let threePlayerCompletedHand: NoLimitHand;
  let fivePlayerCompletedHand: NoLimitHand;
  beforeEach(() => {
    fivePlayerCompletedHand = JSON.parse(JSON.stringify(fivePlayerCompletedHandFixture.output));
    threePlayerCompletedHand = {
      variant: 'NT',
      antes: [0.5, 0.5, 0.5],
      blindsOrStraddles: [1, 2, 0],
      minBet: 2,
      startingStacks: [154.4, 601.3, 558.15],
      actions: [
        'd dh p1 ????',
        'd dh p2 ????',
        'd dh p3 ????',
        'p3 cbr 6',
        'p1 cc',
        'p2 cc',
        'd db 9d3s6d',
        'p1 cc',
        'p2 cc',
        'p3 cbr 16',
        'p1 cc',
        'p2 f',
        'd db 6s',
        'p1 cc',
        'p3 cc',
        'd db Kh',
        'p1 cc',
        'p3 cc',
        'p1 sm KdJd',
        'p3 sm ????',
      ],
      venue: 'Absolute Poker',
      time: '01:44:18',
      day: 7,
      month: 7,
      year: 2009,
      hand: 3038278826,
      seats: [2, 3, 6],
      table: 'LAZY ST',
      players: ['Alice', 'Bob', 'Charlie'],
    };
  });
  describe.concurrent('Seat ordering fundamentals', () => {
    it('should maintain arrays unchanged when seats are already ascending', () => {
      // Scenario: Seats already in ascending order [1, 2, 3]
      // Input: Completed hand with seats: [1, 2, 3], players: ['Alice', 'Bob', 'Charlie'],
      //        finishingStacks: [100, 200, 300], blindsOrStraddles: [0, 1, 2]
      // Expected: After Hand.next(), no sorting occurs:
      //           seats: [1, 2, 3], players: ['Alice', 'Bob', 'Charlie'],
      //           startingStacks: [100, 200, 300], blindsOrStraddles: [2, 0, 1] (rotated only)

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1, 2, 3],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(nextHand.startingStacks).toEqual([100, 200, 300]);
      expect(nextHand.blindsOrStraddles).toEqual([2, 0, 1]); // Rotated only
    });

    it('should sort all arrays by seat order when seats not ascending', () => {
      // Scenario: Seats not in ascending order [3, 1, 2]
      // Input: Completed hand with seats: [3, 1, 2], players: ['Alice', 'Bob', 'Charlie'],
      //        finishingStacks: [300, 100, 200], blindsOrStraddles: [0, 1, 2],
      //        _inactive: [0, 1, 0], _intents: [0, 0, 2], _venueIds: ['alice@v', 'bob@v', 'charlie@v']
      // Expected: After Hand.next(), all arrays sorted by seat order + state transitions:
      //           seats: [1, 2, 3], players: ['Bob', 'Charlie', 'Alice'],
      //           startingStacks: [100, 200, 300],
      //           After sort: [1, 2, 0] → rotate: [0, 1, 2] → skip-inactive shifts blinds
      //           Charlie (idx 1) is inactive, so SB shifts to Alice, BB shifts to Bob
      //           blindsOrStraddles: [2, 0, 1] (Bob=BB, Charlie=0, Alice=SB)
      //           _inactive: [0, 1, 0] (Bob returns, Charlie pauses), _intents: [0, 2, 0],
      //           _venueIds: ['bob@v', 'charlie@v', 'alice@v']

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [300, 100, 200],
        blindsOrStraddles: [0, 1, 2],
        _inactive: [0, 1, 0],
        _intents: [0, 0, 2],
        _venueIds: ['alice@v', 'bob@v', 'charlie@v'],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Bob', 'Charlie', 'Alice']);
      expect(nextHand.startingStacks).toEqual([100, 200, 300]);
      // With skip-inactive: Charlie inactive at SB → SB shifts to Alice, BB shifts to Bob
      expect(nextHand.blindsOrStraddles).toEqual([2, 0, 1]); // Bob=BB(2), Charlie=0, Alice=SB(1)
      // After state transitions: Bob returns (inactive->0), Charlie pauses (inactive->1), Alice stays active
      expect(nextHand._inactive).toEqual([0, 1, 0]);
      expect(nextHand._intents).toEqual([0, 2, 0]);
      expect(nextHand._venueIds).toEqual(['bob@v', 'charlie@v', 'alice@v']);
    });

    it('should handle missing seats field as sequential seating', () => {
      // Scenario: No seats field present in hand
      // Input: Completed hand with 3 players, no seats array defined,
      //        players: ['Alice', 'Bob', 'Charlie'], finishingStacks: [100, 200, 300]
      // Expected: After Hand.next(), no sorting performed (implicit seats [1, 2, 3]),
      //           players: ['Alice', 'Bob', 'Charlie'], startingStacks: [100, 200, 300]

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: undefined,
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };
      delete completedHand.seats;

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toBeUndefined();
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(nextHand.startingStacks).toEqual([100, 200, 300]);
    });

    it('should correctly handle arrays with non-ascending seat gaps', () => {
      // Scenario: Seats with gaps that need sorting
      // Input: Completed hand with seats: [7, 1, 9, 3], players: ['Alice', 'Bob', 'Charlie', 'Dave'],
      //        finishingStacks: [100, 200, 300, 400]
      // Expected: After Hand.next(), sorted to seats: [1, 3, 7, 9],
      //           players: ['Bob', 'Dave', 'Alice', 'Charlie'],
      //           startingStacks: [200, 400, 100, 300]

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [7, 1, 9, 3],
        players: ['Alice', 'Bob', 'Charlie', 'Dave'],
        finishingStacks: [100, 200, 300, 400],
        startingStacks: [100, 200, 300, 400],
        blindsOrStraddles: [0, 1, 2, 0],
        antes: [0, 0, 0, 0],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 3, 7, 9]);
      expect(nextHand.players).toEqual(['Bob', 'Dave', 'Alice', 'Charlie']);
      expect(nextHand.startingStacks).toEqual([200, 400, 100, 300]);
    });

    it('should handle duplicate seat numbers by ignoring seats array', () => {
      // Scenario: Invalid duplicate seats [1, 2, 2, 3]
      // Input: Completed hand with duplicate seat numbers, seats: [1, 2, 2, 3],
      //        players: ['Alice', 'Bob', 'Charlie', 'Dave']
      // Expected: After Hand.next(), invalid seats ignored, no sorting,
      //           arrays unchanged (treated as no seats field)

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1, 2, 2, 3],
        players: ['Alice', 'Bob', 'Charlie', 'Dave'],
        finishingStacks: [100, 200, 300, 400],
        startingStacks: [100, 200, 300, 400],
        blindsOrStraddles: [0, 1, 2, 0],
        antes: [0, 0, 0, 0],
      };

      const nextHand = Hand.next(completedHand);

      // Invalid seats replaced with sequential [1, 2, 3, 4]
      expect(nextHand.seats).toEqual([1, 2, 3, 4]);
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie', 'Dave']);
      // No sorting happened, just rotation
      expect(nextHand.blindsOrStraddles).toEqual([0, 0, 1, 2]);
    });

    it('should NEVER rotate seat assignments', () => {
      // Scenario: Seats always stay in ascending order, never rotate
      // Input: Completed hand with seats: [1, 2, 3], call Hand.next() multiple times
      // Expected: After each Hand.next(), seats remain [1, 2, 3], only blinds/antes rotate

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1, 2, 3],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand1 = Hand.next(completedHand);
      expect(nextHand1.seats).toEqual([1, 2, 3]);
      expect(nextHand1.blindsOrStraddles).toEqual([2, 0, 1]);

      const nextHand2 = Hand.next({ ...nextHand1, finishingStacks: nextHand1.startingStacks });
      expect(nextHand2.seats).toEqual([1, 2, 3]);
      expect(nextHand2.blindsOrStraddles).toEqual([1, 2, 0]);

      const nextHand3 = Hand.next({ ...nextHand2, finishingStacks: nextHand2.startingStacks });
      expect(nextHand3.seats).toEqual([1, 2, 3]);
      expect(nextHand3.blindsOrStraddles).toEqual([0, 1, 2]);
    });

    it('should handle seats array modified during hand progression', () => {
      // Scenario: Seats should only be sorted at Hand.next(), not during hand
      // Input: Hand with actions already started, attempt to modify seats mid-hand
      // Expected: Seat sorting only applies when calling Hand.next() on completed hand

      const handInProgress = {
        ...threePlayerCompletedHand,
        seats: [2, 1, 3],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: undefined, // Not completed
        actions: threePlayerCompletedHand.actions.slice(0, 5), // Partial actions
      };

      // Modifying seats during hand doesn't affect anything
      handInProgress.seats = [3, 2, 1];

      // Complete the hand
      const completedHand = {
        ...handInProgress,
        finishingStacks: [100, 200, 300],
      };

      const nextHand = Hand.next(completedHand);

      // Sorting happens based on seats at completion
      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Charlie', 'Bob', 'Alice']);
    });

    it('should handle partially invalid seats array', () => {
      // Scenario: Mixed valid/invalid seat values
      // Input: Completed hand with seats: [1, 2.5, 3] (one non-integer),
      //        players: ['Alice', 'Bob', 'Charlie']
      // Expected: After Hand.next(), entire seats array replaced with sequential,
      //           no sorting performed

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1, 2.5, 3],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      // Invalid seats replaced with sequential [1, 2, 3]
      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
      // No sorting, just rotation
      expect(nextHand.blindsOrStraddles).toEqual([2, 0, 1]);
    });

    it('should reject non-integer seat values', () => {
      // Scenario: Seats must be integers
      // Input: Completed hand with seats: [1.0, 2.5, 3.7], players: ['Alice', 'Bob', 'Charlie']
      // Expected: After Hand.next(), seats invalid (2.5 and 3.7 not integers), replaced with sequential

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1.0, 2.5, 3.7],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      // Invalid seats replaced with sequential [1, 2, 3]
      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(nextHand.blindsOrStraddles).toEqual([2, 0, 1]);
    });

    it('should reject seats outside valid range [1-9]', () => {
      // Scenario: Seats must be in poker table range
      // Input: Completed hand with seats: [0, 5, 10], players: ['Alice', 'Bob', 'Charlie']
      // Expected: After Hand.next(), seats invalid (0 < 1, 10 > 9), replaced with sequential

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [0, 5, 10],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      // Invalid seats replaced with sequential [1, 2, 3]
      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(nextHand.blindsOrStraddles).toEqual([2, 0, 1]);
    });
  });

  describe('Blind rotation with fixed seat positions', () => {
    it('should rotate blinds while keeping seats in ascending order', () => {
      // Scenario: Button moves, seats stay fixed in ascending order
      // Input: Completed hand with seats: [1, 2, 3], blinds: [0, 10, 20]
      // Expected: After Hand.next(), seats remain [1, 2, 3], blinds rotate to [20, 0, 10]
      //           Only blind values rotate, seat assignments never change

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1, 2, 3],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.blindsOrStraddles).toEqual([2, 0, 1]);
    });

    it('should rotate blinds correctly after seat reordering', () => {
      // Scenario: Seats reordered first, then blinds rotated
      // Input: Completed hand with seats: [3, 1, 2], blinds: [0, 1, 2],
      //        players: ['Alice', 'Bob', 'Charlie'], finishingStacks: [300, 100, 200]
      // Expected: Step 1 - Sort by seats: seats: [1, 2, 3], blinds: [1, 2, 0],
      //                    players: ['Bob', 'Charlie', 'Alice'], stacks: [100, 200, 300]
      //           Step 2 - Rotate blinds: blinds: [0, 1, 2], seats stay [1, 2, 3]
      //           Final: seats: [1, 2, 3], players: ['Bob', 'Charlie', 'Alice'],
      //                  startingStacks: [100, 200, 300], blindsOrStraddles: [0, 1, 2]

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [300, 100, 200],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Bob', 'Charlie', 'Alice']);
      expect(nextHand.startingStacks).toEqual([100, 200, 300]);
      expect(nextHand.blindsOrStraddles).toEqual([0, 1, 2]); // After sort: [1, 2, 0], then rotated: [0, 1, 2]
    });

    it('should rotate antes while keeping seats fixed', () => {
      // Scenario: Antes rotate with blinds, seats remain in ascending order
      // Input: Completed hand with seats: [1, 3, 5] (gaps but ascending), antes: [1, 2, 3]
      // Expected: After Hand.next(), seats stay [1, 3, 5], antes rotate to [3, 1, 2]

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1, 3, 5],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
        antes: [1, 2, 3],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 3, 5]);
      expect(nextHand.antes).toEqual([3, 1, 2]);
    });

    it('should handle straddles with seat ordering', () => {
      // Scenario: Straddle positions with non-sequential but ascending seats
      // Input: Completed hand with seats: [2, 5, 8] (ascending with gaps), blindsOrStraddles: [1, 2, 4]
      // Expected: After Hand.next(), seats stay [2, 5, 8], blindsOrStraddles rotate to [1, 2, 4]

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [2, 5, 8],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [1, 2, 4],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([2, 5, 8]);
      expect(nextHand.blindsOrStraddles).toEqual([4, 1, 2]);
    });
  });

  describe('Seat ordering with player removal', () => {
    it('should sort arrays before removing players', () => {
      // Scenario: Order matters - sort THEN remove
      // Input: Completed hand with seats: [3, 1, 2], finishingStacks: [100, 0, 200],
      //        players: ['Alice', 'Bob', 'Charlie']
      // Expected: Step 1 - Sort: seats: [1, 2, 3], stacks: [0, 200, 100], players: ['Bob', 'Charlie', 'Alice']
      //           Step 2 - Remove seat 1 (0 chips): seats: [2, 3], players: ['Charlie', 'Alice']

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 0, 200],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      // After sort: [1, 2, 3] -> ['Bob', 'Charlie', 'Alice']
      // After removal of Bob (0 chips): [2, 3] -> ['Charlie', 'Alice']
      expect(nextHand.seats).toEqual([2, 3]);
      expect(nextHand.players).toEqual(['Charlie', 'Alice']);
      expect(nextHand.startingStacks).toEqual([200, 100]);
    });

    it('should remove multiple players and keep seat order', () => {
      // Scenario: Remove multiple broke/leaving players
      // Input: Completed hand with seats: [2, 4, 6, 8], finishingStacks: [100, 0, 150, 0]
      // Expected: After Hand.next(), seats: [2, 6], all arrays have 2 elements
      //           Original seat numbers preserved

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [2, 4, 6, 8],
        players: ['Alice', 'Bob', 'Charlie', 'Dave'],
        finishingStacks: [100, 0, 150, 0],
        startingStacks: [100, 100, 150, 100],
        blindsOrStraddles: [0, 1, 2, 0],
        antes: [0, 0, 0, 0],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([2, 6]);
      expect(nextHand.players).toEqual(['Alice', 'Charlie']);
      expect(nextHand.startingStacks).toEqual([100, 150]);
      expect(nextHand.players.length).toBe(2);
      expect(nextHand.startingStacks.length).toBe(2);
      expect(nextHand.blindsOrStraddles.length).toBe(2);
    });

    it('should handle removal after seat reordering', () => {
      // Scenario: Sort seats first, then remove broke players
      // Input: Completed hand with seats: [5, 1, 3], finishingStacks: [200, 0, 150]
      // Expected: First sort to seats: [1, 3, 5], stacks: [0, 150, 200]
      //           Then remove broke player at seat 1, result seats: [3, 5]

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [5, 1, 3],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [200, 0, 150],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      // After sort: [1, 3, 5] -> ['Bob', 'Charlie', 'Alice'] with stacks [0, 150, 200]
      // After removal of Bob (0 chips): [3, 5] -> ['Charlie', 'Alice']
      expect(nextHand.seats).toEqual([3, 5]);
      expect(nextHand.players).toEqual(['Charlie', 'Alice']);
      expect(nextHand.startingStacks).toEqual([150, 200]);
    });

    it('should return empty hand when all players removed', () => {
      // Scenario: All players broke or leaving
      // Input: Completed hand with seats: [1, 2, 3], finishingStacks: [0, 0, 0]
      // Expected: After Hand.next(), all arrays empty, new hand/seed generated

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1, 2, 3],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [0, 0, 0],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.players).toEqual([]);
      expect(nextHand.startingStacks).toEqual([]);
      expect(nextHand.blindsOrStraddles).toEqual([]);
      expect(nextHand.seats).toEqual([]);
      expect(nextHand.seed).toBeDefined();
      expect(nextHand.seed).not.toBe(completedHand.seed);
    });

    it('should remove players with insufficient chips for blinds', () => {
      // Scenario: Player cannot afford upcoming blind after rotation
      // Input: Completed hand with seats: [1, 2, 3], finishingStacks: [5, 100, 200]
      //        blindsOrStraddles: [0, 1, 10], after rotation: [10, 0, 1]
      //        Alice would need 10 but only has 5 chips
      // Expected: After Hand.next(), Alice removed, seats: [2, 3]

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1, 2, 3],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [5, 100, 200],
        blindsOrStraddles: [0, 1, 10], // After rotation Alice would need 10
      };

      const nextHand = Hand.next(completedHand);

      // Alice can't afford blind of 10 with only 5 chips
      expect(nextHand.seats).toEqual([2, 3]);
      expect(nextHand.players).toEqual(['Bob', 'Charlie']);
    });
  });

  describe('Optional arrays sorting with seats', () => {
    it('should sort _inactive array with seat reordering', () => {
      // Scenario: _inactive array follows players through seat sort and state transitions
      // Input: Completed hand with seats: [3, 1, 2], _inactive: [1, 0, 0],
      //        players: ['Alice', 'Bob', 'Charlie']
      // After sort: seats: [1, 2, 3], _inactive: [0, 0, 1] (Bob, Charlie, Alice)
      // After state transitions: Alice (inactive=1, intent=0) returns → all become active

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
        _inactive: [1, 0, 0],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Bob', 'Charlie', 'Alice']);
      // Alice returns to active since she can afford it
      expect(nextHand._inactive).toEqual([0, 0, 0]);
    });

    it('should sort _intents array with seat reordering', () => {
      // Scenario: _intents array follows players through seat sort
      // Input: Completed hand with seats: [3, 1, 2], _intents: [0, 2, 1],
      //        players: ['Alice', 'Bob', 'Charlie']
      // Expected: After Hand.next() sort to seats: [1, 2, 3],
      //           _intents: [2, 1, 0] (intents follow players to new positions)

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
        _intents: [0, 2, 1],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Bob', 'Charlie', 'Alice']);
      expect(nextHand._intents).toEqual([2, 1, 0]);
    });

    it('should sort _deadBlinds array with seat reordering', () => {
      // Scenario: _deadBlinds array follows players through seat sort
      // Input: Completed hand with seats: [3, 1, 2], _deadBlinds: [1.5, 0, 0.5],
      //        players: ['Alice', 'Bob', 'Charlie'] - all ACTIVE
      // Expected: After Hand.next() sort to seats: [1, 2, 3],
      //           For ACTIVE players, dead blinds were already charged by Game()
      //           so stacks unchanged and _deadBlinds reset to 0

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
        _deadBlinds: [1.5, 0, 0.5], // For active players, these were already paid
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Bob', 'Charlie', 'Alice']);
      // Stacks unchanged - dead blinds were already paid by Game()
      expect(nextHand.startingStacks).toEqual([200, 300, 100]);
      expect(nextHand._deadBlinds).toEqual([0, 0, 0]);
    });

    it('should handle undefined optional arrays during sort', () => {
      // Scenario: Some optional arrays undefined, initialized then sorted and state transitions
      // Input: Completed hand with seats: [3, 1, 2], _inactive: undefined, _intents: [0, 1, 2]
      // After init: _inactive: [0, 0, 0]
      // After sort: _intents: [1, 2, 0], _inactive: [0, 0, 0]
      // After transitions: Bob (intent=1) and Charlie (intent=2) become inactive

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
        _intents: [0, 1, 2],
        _inactive: undefined,
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Bob', 'Charlie', 'Alice']);
      expect(nextHand._intents).toEqual([1, 2, 0]);
      // Bob and Charlie become inactive due to their intents
      expect(nextHand._inactive).toEqual([1, 1, 0]);
    });

    it('should sort all optional arrays consistently', () => {
      // Scenario: All optional arrays present and sorted together
      // Input: Completed hand with seats: [3, 1, 2], all optional arrays defined
      // Expected: After Hand.next() sort to [1, 2, 3], all arrays maintain player relationships

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
        _inactive: [1, 0, 0],
        _intents: [2, 1, 0],
        _deadBlinds: [3, 0, 1],
        _venueIds: ['alice@v', 'bob@v', 'charlie@v'],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Bob', 'Charlie', 'Alice']);
      // Bob becomes inactive (intent=1), Charlie stays active, Alice stays inactive (intent=2)
      expect(nextHand._inactive).toEqual([1, 0, 1]);
      expect(nextHand._intents).toEqual([1, 0, 2]);
      expect(nextHand._deadBlinds).toEqual([0, 0, 3]);
      expect(nextHand._venueIds).toEqual(['bob@v', 'charlie@v', 'alice@v']);
    });
  });

  describe('Complex array sorting scenarios', () => {
    it('should handle sort + remove + rotate in correct order', () => {
      // Scenario: Verify exact order of operations
      // Input: Completed hand with 4 players, seats: [4, 1, 3, 2], finishingStacks: [100, 50, 200, 0],
      //        blindsOrStraddles: [0, 1, 2, 0], players: ['Alice', 'Bob', 'Charlie', 'Dave']
      // Expected: Step 1 - Sort to seats: [1, 2, 3, 4], players: ['Bob', 'Dave', 'Charlie', 'Alice'],
      //                    stacks: [50, 0, 200, 100], blinds: [1, 0, 2, 0]
      //           Step 2 - Remove seat 2 (0 chips): seats: [1, 3, 4], stacks: [50, 200, 100]
      //           Step 3 - Rotate blinds: [0, 1, 2]

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [4, 1, 3, 2],
        players: ['Alice', 'Bob', 'Charlie', 'Dave'],
        finishingStacks: [100, 50, 200, 0],
        startingStacks: [100, 50, 200, 50],
        blindsOrStraddles: [0, 1, 2, 0],
        antes: [0, 0, 0, 0],
      };

      const nextHand = Hand.next(completedHand);

      // After sort: [1, 2, 3, 4] -> ['Bob', 'Dave', 'Charlie', 'Alice']
      // After remove Dave (0 chips): [1, 3, 4] -> ['Bob', 'Charlie', 'Alice']
      // After rotate blinds from [1, 2, 0]: [0, 1, 2]
      expect(nextHand.seats).toEqual([1, 3, 4]);
      expect(nextHand.players).toEqual(['Bob', 'Charlie', 'Alice']);
      expect(nextHand.startingStacks).toEqual([50, 200, 100]);
      expect(nextHand.blindsOrStraddles).toEqual([0, 1, 2]);
    });

    it('should preserve _venueIds array through sorting', () => {
      // Scenario: Venue IDs follow players through seat sort
      // Input: Completed hand with 3 players, seats: [3, 1, 2],
      //        _venueIds: ['alice@venue', 'bob@venue', 'charlie@venue'],
      //        players: ['Alice', 'Bob', 'Charlie']
      // Expected: After Hand.next() sort to seats: [1, 2, 3],
      //           _venueIds: ['bob@venue', 'charlie@venue', 'alice@venue'],
      //           players: ['Bob', 'Charlie', 'Alice']

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
        _venueIds: ['alice@venue', 'bob@venue', 'charlie@venue'],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Bob', 'Charlie', 'Alice']);
      expect(nextHand._venueIds).toEqual(['bob@venue', 'charlie@venue', 'alice@venue']);
    });

    it('should handle heads-up with non-consecutive seats', () => {
      // Scenario: Two players with gap in seat numbers
      // Input: Completed hand with 2 players, seats: [3, 7],
      //        players: ['Alice', 'Bob'], finishingStacks: [100, 200]
      // Expected: After Hand.next(), seats remain [3, 7] (already ascending),
      //           no sorting needed, arrays unchanged except blind rotation

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 7],
        players: ['Alice', 'Bob'],
        finishingStacks: [100, 200],
        startingStacks: [100, 200],
        blindsOrStraddles: [1, 2],
        antes: [0, 0],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([3, 7]);
      expect(nextHand.players).toEqual(['Alice', 'Bob']);
      expect(nextHand.startingStacks).toEqual([100, 200]);
      expect(nextHand.blindsOrStraddles).toEqual([1, 2]); // Rotated
    });

    it('should synchronize ALL arrays during sort', () => {
      // Scenario: Verify complete array synchronization
      // Input: Use fivePlayerCompletedHand with seats: [5, 1, 3, 2, 4],
      //        all arrays defined (players, stacks, blinds, antes, _intents, _inactive, _deadBlinds, _venueIds)
      // Expected: After Hand.next() sort to [1, 2, 3, 4, 5],
      //           every array element at index i belongs to same player

      const completedHand = {
        ...fivePlayerCompletedHand,
        minBet: 2,
        seats: [5, 1, 3, 2, 4],
        players: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve'],
        finishingStacks: [500, 100, 300, 200, 400],
        blindsOrStraddles: [0, 1, 2, 0, 0],
        antes: [0.5, 0.5, 0.5, 0.5, 0.5],
        _inactive: [0, 1, 0, 0, 1],
        _intents: [0, 2, 1, 0, 3],
        _deadBlinds: [0, 1, 0, 0.5, 0],
        _venueIds: ['alice@v', 'bob@v', 'charlie@v', 'dave@v', 'eve@v'],
      };

      const nextHand = Hand.next(completedHand);

      // After sort to [1, 2, 3, 4, 5]: ['Bob', 'Dave', 'Charlie', 'Eve', 'Alice']
      // Eve is removed (intent 3)
      // Bob stays inactive (paused), Charlie becomes inactive (wait for BB)
      // Bob: inactive with debt=1, preserved for Game()
      // Dave: active, debt=0.5 was already paid by Game(), so cleared to 0
      // Charlie becomes inactive, no accumulation (intent=1, wait for BB)
      // Alice: active, no dead blinds
      expect(nextHand.seats).toEqual([1, 2, 3, 5]);
      expect(nextHand.players).toEqual(['Bob', 'Dave', 'Charlie', 'Alice']);
      // Dave's stack unchanged - his dead blinds were already paid by Game()
      expect(nextHand.startingStacks).toEqual([100, 200, 300, 500]);
      expect(nextHand._inactive).toEqual([1, 0, 1, 0]);
      expect(nextHand._intents).toEqual([2, 0, 1, 0]);
      // Bob preserves debt (inactive), Dave's debt cleared (was active)
      expect(nextHand._deadBlinds).toEqual([1, 0, 1, 0]);
      expect(nextHand._venueIds).toEqual(['bob@v', 'dave@v', 'charlie@v', 'alice@v']);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle single player remaining with seat preservation', () => {
      // Scenario: Only one player left after removals
      // Input: Completed hand with 3 players, seats: [2, 5, 8], finishingStacks: [0, 0, 150]
      // Expected: After Hand.next(), single player at seat 8, all arrays length 1, seat: [8]

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [2, 5, 8],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [0, 0, 150],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([8]);
      expect(nextHand.players).toEqual(['Charlie']);
      expect(nextHand.startingStacks).toEqual([150]);
      expect(nextHand.players.length).toBe(1);
    });

    it('should handle maximum dead blinds with seat ordering', () => {
      // Scenario: Dead blinds cap at 1.5 BB, player returns with debt preserved for Game()
      // Input: Completed hand with 3 players, seats: [1, 3, 5], _deadBlinds: [0, 3, 0] (BB=2, max=3)
      //        Bob is inactive with intent=0 (wants to return) and can afford it
      // Expected: After Hand.next(), Bob returns, dead blinds preserved for Game() to charge

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1, 3, 5],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2], // BB = 2
        _deadBlinds: [0, 3, 0], // Already at max (1.5 * 2 = 3)
        _inactive: [0, 1, 0],
        _intents: [0, 0, 0], // Bob wants to return
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 3, 5]);
      // Bob returns, dead blinds preserved for Game() to charge
      expect(nextHand._deadBlinds![1]).toBe(3); // Debt preserved for Game()
      expect(nextHand._inactive![1]).toBe(0); // Bob is now active
    });

    it('should handle empty antes array with seat ordering', () => {
      // Scenario: No antes but seats need sorting
      // Input: Completed hand with 3 players, seats: [3, 1, 2], antes: undefined
      // Expected: After sort to [1, 2, 3], antes created as [0, 0, 0] or remains undefined

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
        antes: undefined,
      } as any;

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Bob', 'Charlie', 'Alice']);
      expect(nextHand.antes).toEqual([0, 0, 0]); // Created with defaults
    });

    it('should validate array length consistency after seat ordering', () => {
      // Scenario: Ensure all arrays have same length after operations
      // Input: Completed hand with 3 players, seats: [4, 2, 6], all player arrays present
      // Expected: After sort to [2, 4, 6] and Hand.next(), all arrays.length === 3

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [4, 2, 6],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
        antes: [0.5, 0.5, 0.5],
        _inactive: [0, 0, 0],
        _intents: [0, 0, 0],
        _deadBlinds: [0, 0, 0],
        _venueIds: ['alice@v', 'bob@v', 'charlie@v'],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([2, 4, 6]);
      expect(nextHand.players.length).toBe(3);
      expect(nextHand.startingStacks.length).toBe(3);
      expect(nextHand.blindsOrStraddles.length).toBe(3);
      expect(nextHand.antes.length).toBe(3);
      expect(nextHand._inactive?.length).toBe(3);
      expect(nextHand._intents?.length).toBe(3);
      expect(nextHand._deadBlinds?.length).toBe(3);
      expect(nextHand._venueIds?.length).toBe(3);
    });

    it('should handle seat overflow beyond table limits', () => {
      // Scenario: Seat numbers exceed valid poker range [1-9]
      // Input: Completed hand with 3 players, seats: [1, 3, 10]
      // Expected: Invalid seats (10 > 9), seats array ignored, no sorting performed

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1, 3, 10],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      // Invalid seats replaced with sequential [1, 2, 3]
      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(nextHand.blindsOrStraddles).toEqual([2, 0, 1]); // Just rotated
    });

    it('should preserve hand metadata through seat reordering', () => {
      // Scenario: Non-player fields unaffected by seat sort
      // Input: Completed hand with 3 players, seats: [3, 1, 2], variant: 'NT', venue: 'Test', currency: 'USD'
      // Expected: After sort to [1, 2, 3], only player arrays sorted, metadata unchanged

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
        variant: 'NT',
        venue: 'Test',
        currency: 'USD',
      } as any;

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Bob', 'Charlie', 'Alice']);
      expect(nextHand.variant).toBe('NT');
      expect(nextHand.venue).toBe('Test');
      expect(nextHand.currency).toBe('USD');
    });
  });

  describe('Sort order verification', () => {
    it('should apply sort BEFORE any other operations', () => {
      // Scenario: Sort must happen first
      // Input: Completed hand with 3 players, seats: [3, 1, 2],
      //        finishingStacks: [100, 0, 200], players: ['Alice', 'Bob', 'Charlie']
      // Expected: FIRST sort all arrays by seats to [1, 2, 3],
      //           THEN apply removals, THEN rotate blinds

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 0, 200],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      // After sort: [1, 2, 3] -> ['Bob', 'Charlie', 'Alice'] with [0, 200, 100]
      // After remove Bob (0 chips): [2, 3] -> ['Charlie', 'Alice']
      // After rotate: blinds go from [2, 1] to [1, 2]
      expect(nextHand.seats).toEqual([2, 3]);
      expect(nextHand.players).toEqual(['Charlie', 'Alice']);
      expect(nextHand.startingStacks).toEqual([200, 100]);
      expect(nextHand.blindsOrStraddles).toEqual([1, 2]);
    });

    it('should sort all arrays in single pass', () => {
      // Scenario: All arrays sorted together atomically
      // Input: Completed hand with 4 players, seats: [4, 2, 1, 3],
      //        multiple arrays defined
      // Expected: After sort to [1, 2, 3, 4], verify all arrays sorted in sync,
      //           no array sorted independently

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [4, 2, 1, 3],
        players: ['Alice', 'Bob', 'Charlie', 'Dave'],
        finishingStacks: [400, 200, 100, 300],
        startingStacks: [400, 200, 100, 300],
        blindsOrStraddles: [0, 1, 2, 0],
        antes: [1, 1, 1, 1],
        _inactive: [1, 0, 0, 1],
        _intents: [3, 1, 0, 2],
      };

      const nextHand = Hand.next(completedHand);

      // After sort to [1, 2, 3, 4]: Charlie, Bob, Dave, Alice
      // Alice (intent=3) is removed, leaving 3 players
      // Before rotation, blinds: [2, 1, 0] (Charlie=BB, Bob=SB, Dave=0)
      // After rotation: [0, 2, 1] (Charlie=0, Bob=BB, Dave=SB)
      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Charlie', 'Bob', 'Dave']);
      expect(nextHand.startingStacks).toEqual([100, 200, 300]);
      // Bob has intent=1 and is now at BB position, so returns to active with intent cleared!
      // Dave stays inactive (intent=2)
      expect(nextHand._inactive).toEqual([0, 0, 1]);
      expect(nextHand._intents).toEqual([0, 0, 2]);
    });

    it('should maintain array relationships through sort', () => {
      // Scenario: Player data stays together
      // Input: Completed hand with seats: [3, 1, 2],
      //        player 'Bob' at seat 1 with stack 100, blind 1, intent 2
      // Expected: After sort, Bob's data moves together to index 0

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [300, 100, 200],
        blindsOrStraddles: [0, 1, 2],
        _intents: [0, 2, 1],
      };

      const nextHand = Hand.next(completedHand);

      // Bob was at index 1 (seat 1), moves to index 0 after sort
      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players[0]).toBe('Bob');
      expect(nextHand.startingStacks[0]).toBe(100);
      expect(nextHand._intents![0]).toBe(2);
    });
  });

  describe('Stack array sorting', () => {
    it('should sort finishingStacks with seat order', () => {
      // Scenario: Stacks follow players through sort
      // Input: Completed hand with 3 players, seats: [3, 1, 2],
      //        finishingStacks: [300, 100, 200], players: ['Alice', 'Bob', 'Charlie']
      // Expected: After Hand.next() sort to seats: [1, 2, 3],
      //           startingStacks: [100, 200, 300] (Bob's 100, Charlie's 200, Alice's 300)

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [300, 100, 200],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Bob', 'Charlie', 'Alice']);
      expect(nextHand.startingStacks).toEqual([100, 200, 300]);
    });

    it('should maintain stack-player relationship', () => {
      // Scenario: Each player keeps their chips
      // Input: Completed hand with seats: [2, 1],
      //        players: ['Alice', 'Bob'], finishingStacks: [200, 100]
      // Expected: After sort to [1, 2], Bob at seat 1 has 100,
      //           Alice at seat 2 has 200

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [2, 1],
        players: ['Alice', 'Bob'],
        finishingStacks: [200, 100],
        startingStacks: [200, 100],
        blindsOrStraddles: [1, 2],
        antes: [0, 0],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2]);
      expect(nextHand.players).toEqual(['Bob', 'Alice']);
      expect(nextHand.startingStacks).toEqual([100, 200]);
    });
  });

  describe('Array validation with seat sorting', () => {
    it('should reject seats with mismatched length', () => {
      // Scenario: Seats array must match players array length
      // Input: Completed hand with 3 players: ['Alice', 'Bob', 'Charlie'],
      //        but seats: [1, 2, 3, 4] (4 seats for 3 players)
      // Expected: After Hand.next(), seats invalid, no sorting performed

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1, 2, 3, 4], // 4 seats
        players: ['Alice', 'Bob', 'Charlie'], // 3 players
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      // Invalid seats replaced with sequential [1, 2, 3]
      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(nextHand.blindsOrStraddles).toEqual([2, 0, 1]); // Just rotated
    });

    it('should validate all arrays have same length after sort', () => {
      // Scenario: Array consistency check
      // Input: Completed hand with seats: [3, 1, 2], 3 players, all arrays defined
      // Expected: After Hand.next() and sort, all arrays.length === 3

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
        antes: [0.5, 0.5, 0.5],
        _inactive: [0, 0, 0],
        _intents: [0, 0, 0],
        _deadBlinds: [0, 0, 0],
      };

      const nextHand = Hand.next(completedHand);

      const arrayLength = nextHand.players.length;
      expect(nextHand.startingStacks.length).toBe(arrayLength);
      expect(nextHand.blindsOrStraddles.length).toBe(arrayLength);
      expect(nextHand.antes.length).toBe(arrayLength);
      expect(nextHand._inactive?.length).toBe(arrayLength);
      expect(nextHand._intents?.length).toBe(arrayLength);
      expect(nextHand._deadBlinds?.length).toBe(arrayLength);
    });

    it('should handle missing array elements gracefully', () => {
      // Scenario: Incomplete optional arrays
      // Input: Completed hand with 3 players, seats: [3, 1, 2],
      //        _intents: [0, 1] (only 2 elements instead of 3)
      // Expected: Handle error or use defaults, maintain consistency

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
        _intents: [0, 1], // Missing one element
      };

      const nextHand = Hand.next(completedHand);

      // Should handle gracefully, possibly with default values
      expect(nextHand.players.length).toBe(3);
      expect(nextHand._intents).toBeDefined();
      expect(nextHand._intents?.length).toBe(3);
    });
  });

  describe('Seat persistence and new player joining', () => {
    it('should maintain seat assignments across multiple hands', () => {
      // Scenario: Seats persist without renumbering
      // Input: Completed hand with 3 players, seats: [2, 5, 8],
      //        players: ['Alice', 'Bob', 'Charlie']
      // Expected: After Hand.next(), seats remain [2, 5, 8],
      //           players stay at same seat numbers

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [2, 5, 8],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([2, 5, 8]);
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should preserve seat gaps (no compression)', () => {
      // Scenario: Gaps in seat numbers preserved
      // Input: Completed hand with 3 players, seats: [1, 5, 9]
      // Expected: After Hand.next(), seats remain [1, 5, 9],
      //           NOT compressed to [1, 2, 3]

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1, 5, 9],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 5, 9]);
      expect(nextHand.seats).not.toEqual([1, 2, 3]);
    });

    it('should allow new player to take specific unoccupied seat', () => {
      // Scenario: New player joins at specific seat
      // Input: Hand with 3 players at seats: [1, 3, 5],
      //        new player 'Dave' wants seat 4 with 100 chips
      // Expected: After join, seats: [1, 3, 4, 5] (stays sorted),
      //           players: ['Alice', 'Bob', 'Dave', 'Charlie'],
      //           startingStacks: [100, 200, 100, 300]

      const currentHand = {
        ...threePlayerCompletedHand,
        seats: [1, 3, 5],
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
        finishingStacks: undefined, // Not completed yet
      };

      const handWithNewPlayer = Hand.join(currentHand, {
        playerName: 'Dave',
        buyIn: 100,
        seat: 4,
      });

      expect(handWithNewPlayer.seats).toEqual([1, 3, 5, 4]);
      expect(handWithNewPlayer.players).toEqual(['Alice', 'Bob', 'Charlie', 'Dave']);
      expect(handWithNewPlayer.startingStacks).toEqual([100, 200, 300, 100]);
    });

    it('should prevent player from taking occupied seat', () => {
      // Scenario: Seat collision prevention
      // Input: Hand with seats: [1, 3, 5], new player tries to take seat 3
      // Expected: Join rejected, hand unchanged

      const currentHand = {
        ...threePlayerCompletedHand,
        seats: [1, 3, 5],
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
        finishingStacks: undefined,
      };

      const result = Hand.join(currentHand, {
        playerName: 'Dave',
        buyIn: 100,
        seat: 3, // Already occupied
      });

      // Hand unchanged
      expect(result).toEqual(currentHand);
      expect(result.players.length).toBe(3);
    });
  });

  describe('Seat validation [1-9 integers only]', () => {
    it('should handle minimum valid seat number', () => {
      // Scenario: Seat 1 is minimum valid seat number
      // Input: Completed hand with 3 players, seats: [1, 2, 3]
      // Expected: After Hand.next(), normal processing, seats remain valid [1, 2, 3]

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1, 2, 3],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should handle maximum valid seat number', () => {
      // Scenario: Seat 9 is maximum valid seat number
      // Input: Completed hand with 3 players, seats: [7, 8, 9]
      // Expected: After Hand.next(), normal processing, seats remain valid [7, 8, 9]

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [7, 8, 9],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([7, 8, 9]);
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should handle full range of seats', () => {
      // Scenario: All possible seats used (max 9-player table)
      // Input: Completed hand with 9 players, seats: [1, 2, 3, 4, 5, 6, 7, 8, 9]
      // Expected: After Hand.next(), all 9 seats valid, normal processing

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        players: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
        finishingStacks: [100, 200, 300, 400, 500, 600, 700, 800, 900],
        startingStacks: [100, 200, 300, 400, 500, 600, 700, 800, 900],
        blindsOrStraddles: [0, 1, 2, 0, 0, 0, 0, 0, 0],
        antes: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(nextHand.players.length).toBe(9);
    });

    it('should enforce seat uniqueness within valid range', () => {
      // Scenario: No duplicate seats allowed
      // Input: Completed hand with 4 players, seats: [1, 2, 2, 3] (duplicate seat 2)
      // Expected: Invalid configuration, seats ignored, no sorting performed

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1, 2, 2, 3],
        players: ['Alice', 'Bob', 'Charlie', 'Dave'],
        finishingStacks: [100, 200, 300, 400],
        startingStacks: [100, 200, 300, 400],
        blindsOrStraddles: [0, 1, 2, 0],
        antes: [0, 0, 0, 0],
      };

      const nextHand = Hand.next(completedHand);

      // Invalid seats replaced with sequential [1, 2, 3, 4]
      expect(nextHand.seats).toEqual([1, 2, 3, 4]);
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie', 'Dave']);
    });

    it('should reject non-integer seat values', () => {
      // Scenario: Seats must be integers, not decimals or strings
      // Input: Completed hand with 3 players, seats: [1.5, 2, 3] or ['1', 2, 3]
      // Expected: Invalid configuration, seats replaced with sequential

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1.5, 2, 3],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      // Invalid seats replaced with sequential [1, 2, 3]
      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should reject negative seat values', () => {
      // Scenario: Seats must be positive integers
      // Input: Completed hand with 3 players, seats: [-1, 2, 3]
      // Expected: Invalid configuration, seats replaced with sequential

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [-1, 2, 3],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      // Invalid seats replaced with sequential [1, 2, 3]
      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should reject zero as seat value', () => {
      // Scenario: Seat numbering starts at 1, not 0
      // Input: Completed hand with 3 players, seats: [0, 1, 2]
      // Expected: Invalid configuration (0 not in range [1-9]), seats replaced

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [0, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      // Invalid seats replaced with sequential [1, 2, 3]
      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should validate seats are integers not floats', () => {
      // Scenario: Seats must be whole numbers
      // Input: Completed hand with seats: [1, 2, 3.0] (3.0 is float representation)
      // Expected: Valid if 3.0 passes Number.isInteger() check

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [1, 2, 3.0],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      // 3.0 is considered an integer by Number.isInteger()
      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
    });
  });

  describe('Array consistency after seat sorting', () => {
    it('should verify players array maintains name consistency', () => {
      // Scenario: Player names follow seat order
      // Input: Completed hand with 3 players, seats: [3, 1, 2], players: ['Alice', 'Bob', 'Charlie']
      // Expected: After sort to [1, 2, 3], players: ['Bob', 'Charlie', 'Alice']

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Bob', 'Charlie', 'Alice']);
    });

    it('should verify startingStacks match sorted player positions', () => {
      // Scenario: Stack amounts follow seat order
      // Input: Completed hand with 3 players, seats: [2, 1, 3], finishingStacks: [200, 100, 300]
      // Expected: After sort to [1, 2, 3], next hand startingStacks: [100, 200, 300]

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [2, 1, 3],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [200, 100, 300],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.startingStacks).toEqual([100, 200, 300]);
    });

    it('should verify blindsOrStraddles maintain game logic after sort', () => {
      // Scenario: Blind values correctly positioned after sort
      // Input: Completed hand with 3 players, seats: [3, 1, 2], blinds: [2, 0, 1]
      // Expected: After sort to [1, 2, 3], blinds: [0, 1, 2], then rotate correctly

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [2, 0, 1],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      // After sort: [0, 1, 2], then rotated: [2, 0, 1]
      expect(nextHand.blindsOrStraddles).toEqual([2, 0, 1]);
    });

    it('should verify _venueIds preserve player identity through sort', () => {
      // Scenario: Venue IDs stay with correct players
      // Input: Completed hand with 2 players, seats: [2, 1], _venueIds: ['player2@venue', 'player1@venue']
      // Expected: After sort to [1, 2], _venueIds: ['player1@venue', 'player2@venue']

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [2, 1],
        players: ['Alice', 'Bob'],
        finishingStacks: [200, 100],
        startingStacks: [200, 100],
        blindsOrStraddles: [1, 2],
        antes: [0, 0],
        _venueIds: ['alice@venue', 'bob@venue'],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2]);
      expect(nextHand.players).toEqual(['Bob', 'Alice']);
      expect(nextHand._venueIds).toEqual(['bob@venue', 'alice@venue']);
    });

    it('should verify all arrays undefined handling with seat sort', () => {
      // Scenario: Optional arrays may be undefined
      // Input: Completed hand with 2 players, seats: [2, 1], some optional arrays undefined
      // Expected: After sort to [1, 2], undefined arrays remain undefined, defined arrays sorted

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [2, 1],
        players: ['Alice', 'Bob'],
        finishingStacks: [200, 100],
        startingStacks: [200, 100],
        blindsOrStraddles: [1, 2],
        antes: [0, 0],
        _venueIds: undefined,
        _intents: [0, 1],
        _inactive: undefined,
        _deadBlinds: undefined,
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2]);
      expect(nextHand.players).toEqual(['Bob', 'Alice']);
      expect(nextHand._intents).toEqual([1, 0]);
      // Bob becomes inactive (intent=1 wait for BB), Alice stays active
      expect(nextHand._inactive).toEqual([1, 0]);
      // Bob with intent=1 on SB after rotation, accumulates 0.5×BB = 1
      expect(nextHand._deadBlinds).toEqual([1, 0]);
    });
  });

  describe('Complex seat sorting scenarios', () => {
    it('should sort completely random seat order', () => {
      // Scenario: Random seat order needs full sort
      // Input: Use fivePlayerCompletedHand with seats: [9, 5, 1, 3, 7],
      //        players: ['A', 'B', 'C', 'D', 'E']
      // Expected: After Hand.next(), seats: [1, 3, 5, 7, 9],
      //           players: ['C', 'D', 'B', 'E', 'A']

      const completedHand = {
        ...fivePlayerCompletedHand,
        minBet: 2,
        seats: [9, 5, 1, 3, 7],
        players: ['A', 'B', 'C', 'D', 'E'],
        finishingStacks: [900, 500, 100, 300, 700],
        blindsOrStraddles: [0, 0, 1, 2, 0],
        antes: [0, 0, 0, 0, 0],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 3, 5, 7, 9]);
      expect(nextHand.players).toEqual(['C', 'D', 'B', 'E', 'A']);
      expect(nextHand.startingStacks).toEqual([100, 300, 500, 700, 900]);
    });

    it('should reverse descending seat order', () => {
      // Scenario: Descending seats need complete reversal
      // Input: Completed hand with 4 players, seats: [8, 6, 4, 2],
      //        all arrays in descending seat order
      // Expected: After Hand.next(), seats: [2, 4, 6, 8],
      //           all arrays completely reversed

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [8, 6, 4, 2],
        players: ['Alice', 'Bob', 'Charlie', 'Dave'],
        finishingStacks: [800, 600, 400, 200],
        startingStacks: [800, 600, 400, 200],
        blindsOrStraddles: [0, 0, 1, 2],
        antes: [0, 0, 0, 0],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([2, 4, 6, 8]);
      expect(nextHand.players).toEqual(['Dave', 'Charlie', 'Bob', 'Alice']);
      expect(nextHand.startingStacks).toEqual([200, 400, 600, 800]);
    });

    it('should handle maximum 9-player table', () => {
      // Scenario: Full table with all seats occupied
      // Input: 9 players with seats: [6, 2, 9, 1, 5, 3, 7, 4, 8]
      // Expected: After Hand.next(), seats: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      //           all 9 arrays sorted accordingly

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [6, 2, 9, 1, 5, 3, 7, 4, 8],
        players: ['F', 'B', 'I', 'A', 'E', 'C', 'G', 'D', 'H'],
        finishingStacks: [600, 200, 900, 100, 500, 300, 700, 400, 800],
        startingStacks: [600, 200, 900, 100, 500, 300, 700, 400, 800],
        blindsOrStraddles: [0, 1, 2, 0, 0, 0, 0, 0, 0],
        antes: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(nextHand.players).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);
      expect(nextHand.startingStacks).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900]);
    });
  });

  describe('Blind array sorting and rotation', () => {
    it('should sort blinds array before rotation', () => {
      // Scenario: Blinds must be sorted with seats before rotating
      // Input: Completed hand with seats: [5, 1, 3], blinds: [2, 0, 1],
      //        players: ['Alice', 'Bob', 'Charlie']
      // Expected: Step 1 - Sort to seats: [1, 3, 5], blinds: [0, 1, 2]
      //           Step 2 - Rotate blinds: [2, 0, 1]

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [5, 1, 3],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [2, 0, 1],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 3, 5]);
      expect(nextHand.players).toEqual(['Bob', 'Charlie', 'Alice']);
      // After sort: [0, 1, 2], then rotated: [2, 0, 1]
      expect(nextHand.blindsOrStraddles).toEqual([2, 0, 1]);
    });

    it('should handle complex blind positions after sort', () => {
      // Scenario: Multi-player blind sorting
      // Input: Use fivePlayerCompletedHand with seats: [9, 1, 5, 3, 7],
      //        blinds: [0, 1, 2, 0, 0]
      // Expected: After sort to [1, 3, 5, 7, 9], blinds: [1, 0, 2, 0, 0],
      //           then rotate to [0, 1, 0, 2, 0]

      const completedHand = {
        ...fivePlayerCompletedHand,
        minBet: 2,
        seats: [9, 1, 5, 3, 7],
        players: ['A', 'B', 'C', 'D', 'E'],
        finishingStacks: [900, 100, 500, 300, 700],
        blindsOrStraddles: [0, 1, 2, 0, 0],
        antes: [0, 0, 0, 0, 0],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 3, 5, 7, 9]);
      // After sort: [1, 0, 2, 0, 0], then rotated: [0, 1, 0, 2, 0]
      expect(nextHand.blindsOrStraddles).toEqual([0, 1, 0, 2, 0]);
    });
  });

  describe('Complete array synchronization', () => {
    it('should sort ALL defined arrays atomically', () => {
      // Scenario: All arrays sorted together in single operation
      // Input: Use fivePlayerCompletedHand with seats: [5, 3, 1, 2, 4],
      //        define all possible arrays
      // Expected: After Hand.next() sort to [1, 2, 3, 4, 5],
      //           verify each player's data stays together across all arrays

      const completedHand = {
        ...fivePlayerCompletedHand,
        seats: [5, 3, 1, 2, 4],
        players: ['Eve', 'Charlie', 'Alice', 'Bob', 'Dave'],
        finishingStacks: [500, 300, 100, 200, 400],
        blindsOrStraddles: [0, 0, 1, 2, 0],
        antes: [0.5, 0.5, 0.5, 0.5, 0.5],
        _inactive: [1, 0, 0, 0, 1],
        _intents: [2, 1, 0, 0, 3],
        _deadBlinds: [1, 0, 0, 0, 0.5],
        _venueIds: ['eve@v', 'charlie@v', 'alice@v', 'bob@v', 'dave@v'],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3, 5]);
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie', 'Eve']);
      expect(nextHand.startingStacks).toEqual([100, 200, 300, 500]);
      expect(nextHand._venueIds).toEqual(['alice@v', 'bob@v', 'charlie@v', 'eve@v']);
    });

    it('should handle mix of defined and undefined arrays', () => {
      // Scenario: Sort defined arrays, initialize undefined ones
      // Input: seats: [3, 1, 2], _intents/inactive: undefined, _deadBlinds defined
      // Expected: Arrays sorted by seat, undefined arrays initialized to defaults

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [3, 1, 2],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [100, 200, 300],
        blindsOrStraddles: [0, 1, 2],
        _intents: undefined,
        _inactive: undefined,
        _deadBlinds: [1, 0, 0.5],
        _venueIds: ['alice@v', 'bob@v', 'charlie@v'],
      };

      const nextHand = Hand.next(completedHand);

      expect(nextHand.seats).toEqual([1, 2, 3]);
      expect(nextHand.players).toEqual(['Bob', 'Charlie', 'Alice']);
      // Stacks = finishingStacks (sorted)
      expect(nextHand.startingStacks).toEqual([200, 300, 100]);
      // Active players: debt cleared (Game() charges it)
      expect(nextHand._deadBlinds).toEqual([0, 0, 0]);
      expect(nextHand._venueIds).toEqual(['bob@v', 'charlie@v', 'alice@v']);
      // Undefined arrays initialized to defaults
      expect(nextHand._intents).toEqual([0, 0, 0]);
      expect(nextHand._inactive).toEqual([0, 0, 0]);
    });
  });

  describe('Removal after seat sorting', () => {
    it('should remove players AFTER sorting arrays', () => {
      // Scenario: Sort must complete before removal
      // Input: Completed hand with seats: [5, 1, 3], finishingStacks: [150, 0, 200],
      //        players: ['Alice', 'Bob', 'Charlie']
      // Expected: Step 1 - Sort to seats: [1, 3, 5], stacks: [0, 200, 150]
      //           Step 2 - Remove seat 1, result: seats: [3, 5]

      const completedHand = {
        ...threePlayerCompletedHand,
        seats: [5, 1, 3],
        players: ['Alice', 'Bob', 'Charlie'],
        finishingStacks: [150, 0, 200],
        blindsOrStraddles: [0, 1, 2],
      };

      const nextHand = Hand.next(completedHand);

      // After sort: [1, 3, 5] -> ['Bob', 'Charlie', 'Alice'] with [0, 200, 150]
      // After removal of Bob (0 chips): [3, 5] -> ['Charlie', 'Alice']
      expect(nextHand.seats).toEqual([3, 5]);
      expect(nextHand.players).toEqual(['Charlie', 'Alice']);
      expect(nextHand.startingStacks).toEqual([200, 150]);
    });

    it('should handle multiple removals after sort', () => {
      // Scenario: Remove multiple players post-sort
      // Input: 5 players with seats: [5, 2, 4, 1, 3],
      //        finishingStacks: [100, 0, 200, 0, 150]
      // Expected: After sort and removal of 0-chip players,
      //           seats: [3, 4, 5], 3 players remain

      const completedHand = {
        ...fivePlayerCompletedHand,
        seats: [5, 2, 4, 1, 3],
        players: ['A', 'B', 'C', 'D', 'E'],
        finishingStacks: [100, 0, 200, 0, 150],
        blindsOrStraddles: [0, 1, 2, 0, 0],
        antes: [0, 0, 0, 0, 0],
      };

      const nextHand = Hand.next(completedHand);

      // After sort: [1, 2, 3, 4, 5] -> ['D', 'B', 'E', 'C', 'A']
      // with stacks: [0, 0, 150, 200, 100]
      // After removal of D and B (0 chips): [3, 4, 5] -> ['E', 'C', 'A']
      expect(nextHand.seats).toEqual([3, 4, 5]);
      expect(nextHand.players).toEqual(['E', 'C', 'A']);
      expect(nextHand.startingStacks).toEqual([150, 200, 100]);
      expect(nextHand.players.length).toBe(3);
    });
  });
});
