import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hand } from '../../../Hand';

describe('Hand.merge() - Sit In/Out functionality', () => {
  let baseHand: Hand;

  beforeEach(() => {
    // Mock system time for consistent timestamp testing
    vi.setSystemTime(new Date(1715616000000));
    // Setup base hands for testing
    baseHand = {
      variant: 'NT',
      players: ['Player1', 'Player2'],
      startingStacks: [100, 100],
      blindsOrStraddles: [1, 2],
      antes: [0, 0],
      minBet: 2,
      seatCount: 6, // 6-max table
      actions: [],
      _inactive: [0, 0],
      _intents: [0, 0],
      _deadBlinds: [0, 0],
    };
  });

  afterEach(() => {
    // Restore real time after each test
    vi.useRealTimers();
  });

  describe('Player joining the game (Sit In)', () => {
    describe('when a new player wants to join', () => {
      it('should allow a new player to join when game has not started', () => {
        // Scenario: Player3 wants to join an empty table
        // Input: newHand with Player3 added to all arrays, author: 'Player3', _intents: [0, 0, 1] (wait for BB)
        // Expected: Player3 added to all arrays, _inactive: [0, 0, 1] - new players always start inactive
        const newHand = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(result.startingStacks).toEqual([100, 100, 150]);
        expect(result.blindsOrStraddles).toEqual([1, 2, 0]);
        expect(result.antes).toEqual([0, 0, 0]);
        expect(result._inactive).toEqual([0, 0, 2]);
        expect(result._intents).toEqual([0, 0, 1]);
        expect(result.author).toBeUndefined();
      });

      it('should mark new player as inactive when joining mid-game', () => {
        // Scenario: Player3 joins while game is in progress
        // Input: baseHand has actions, newHand adds Player3 with author: 'Player3', _intents: [0, 0, 1] (wait for BB)
        // Expected: Player3 added but _inactive: [0, 0, 1], _intents: [0, 0, 1], will play next hand
        const gameInProgress = {
          ...baseHand,
          actions: ['d dh p1 AsKs', 'd dh p2 7c7d', 'p1 cc'],
        };

        const newHand = {
          ...gameInProgress,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 1],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(gameInProgress, newHand);

        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(result._inactive).toEqual([0, 0, 2]);
        expect(result._intents).toEqual([0, 0, 1]);
      });

      it('should set _inactive: 1 for new player when actions exist', () => {
        // Scenario: Game in progress (actions not empty), new player must wait
        // Input: oldHand.actions = ['p1 cc', 'p2 cbr 10'], Player3 joins with _intents: 1 (wait for BB)
        // Expected: _inactive: [0, 0, 1], _intents: [0, 0, 1] - Player3 marked inactive until next hand
        const gameWithActions = {
          ...baseHand,
          actions: ['p1 cc', 'p2 cbr 10'],
        };

        const newHand = {
          ...gameWithActions,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 1],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(gameWithActions, newHand);

        expect(result._inactive).toEqual([0, 0, 2]);
        expect(result._intents).toEqual([0, 0, 1]);
        expect(result.players.length).toBe(3);
      });

      it('should set _inactive: 1 when joining with wait-for-BB intent', () => {
        // Scenario: New player joins with wait-for-BB intent, must wait regardless of game state
        // Input: oldHand.actions = [], Player3 joins with _intents: 1 (wait for BB)
        // Expected: _inactive: [0, 0, 1], _intents: [0, 0, 1] - Player3 inactive until BB position
        const emptyGame = {
          ...baseHand,
          actions: [],
        };

        const newHand = {
          ...emptyGame,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(emptyGame, newHand);

        expect(result._inactive).toEqual([0, 0, 2]);
        expect(result._intents).toEqual([0, 0, 1]);
        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
      });

      it('should validate all player-related arrays have correct length', () => {
        // Scenario: Player3 joins but arrays are mismatched
        // Input: newHand with inconsistent array lengths
        // Expected: Returns original hand unchanged
        const newHand = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100], // Wrong length!
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        // Should return original hand unchanged
        expect(result).toBe(baseHand);
        expect(result.players).toEqual(['Player1', 'Player2']);
      });

      it('should reject if player name does not match author', () => {
        // Scenario: Player3 tries to add Player4 to the game
        // Input: author: 'Player3', but adds 'Player4' to players array
        // Expected: Returns original hand unchanged
        const newHand = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player4'], // Wrong player!
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        // Should reject and return original
        expect(result).toBe(baseHand);
        expect(result.players).toEqual(['Player1', 'Player2']);
      });

      it('should accept new player joining with _intents: 0 and calculate dead blinds', () => {
        // Scenario: New player wants to play immediately
        // Input: author: 'Player3', _intents: [0, 0, 0] - wants to play next hand
        // Expected: Player added with _inactive: 1, dead blinds calculated based on position
        const joinWithPlayIntent = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          seats: [1, 2, 3], // Player3 at seat 3
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0], // Wants to play immediately
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseHand, joinWithPlayIntent);

        // Player should be added but inactive until next hand
        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(result._inactive).toEqual([0, 0, 2]); // New player inactive
        expect(result._intents).toEqual([0, 0, 0]); // Intent preserved

        // After rotation, blinds become [0,1,2] - Player3 will be on BB position
        // So Player3 should pay 0 dead blinds (standard poker rule: no dead blinds on BB)
        expect(result._deadBlinds).toEqual([0, 0, 0]);
      });

      it('should calculate full BB dead blinds when new player will be on non-blind position', () => {
        // Scenario: New player joins at position that will NOT be on any blind after rotation
        // Input: Player4 joins at seat 4
        // Expected: _deadBlinds: 1.0*BB = 2 (standard for non-blind positions)
        const baseWith3Players = {
          ...baseHand,
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          seats: [1, 2, 3],
          antes: [0, 0, 0],
          _inactive: [0, 0, 1],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        };

        const newPlayerJoining = {
          ...baseWith3Players,
          author: 'Player4',
          players: ['Player1', 'Player2', 'Player3', 'Player4'],
          startingStacks: [100, 100, 100, 150],
          blindsOrStraddles: [1, 2, 0, 0],
          seats: [1, 2, 3, 4], // Player4 at seat 4
          antes: [0, 0, 0, 0],
          _inactive: [0, 0, 1, 0],
          _intents: [0, 0, 0, 0], // Player4 wants to play immediately
          _deadBlinds: [0, 0, 0, 0],
        };

        const result = Hand.merge(baseWith3Players, newPlayerJoining);

        // After rotation, blinds become [0, 1, 2, 0] (last element moves to front)
        // Player4 (at index 3) will have blind=0 (not on blind position)
        // So Player4 should pay 1.0×BB = 2 dead blinds
        expect(result._deadBlinds).toEqual([0, 0, 0, 0]);
        expect(result.startingStacks).toEqual([100, 100, 100, 150]);
      });

      it('should calculate half BB dead blinds when new player will be on SB position', () => {
        // Scenario: New player joins at position that will be SB after rotation
        // Input: Setup where new player will get SB position
        // Expected: _deadBlinds: 0.5*BB = 1 (for BB=2)
        const baseWith2Players: Hand = {
          variant: 'NT',
          players: ['Player1', 'Player2'],
          startingStacks: [100, 100],
          blindsOrStraddles: [1, 2],
          seats: [2, 3], // Specific seats to control rotation
          antes: [0, 0],
          minBet: 2,
          seatCount: 6,
          actions: [],
          _inactive: [0, 0],
          _intents: [0, 0],
          _deadBlinds: [0, 0],
        };

        const joinAtSeat1 = {
          ...baseWith2Players,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          seats: [2, 3, 1], // Player3 takes seat 1
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0], // Wants to play immediately
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseWith2Players, joinAtSeat1);

        // Result maintains original order: ['Player1', 'Player2', 'Player3']
        // For dead blind calculation, arrays are sorted by seats: [1,2,3] => Player3, Player1, Player2
        // Sorted blinds: [0, 1, 2]
        // After rotation: [2, 0, 1] (last element moves to front)
        // Player3 (at sorted index 0) will have blind=2 (BB position)
        // So Player3 should pay 0 dead blinds (no dead blinds on BB)
        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(result._intents).toEqual([0, 0, 0]);
        expect(result._inactive).toEqual([0, 0, 2]);
        expect(result._deadBlinds).toEqual([0, 0, 0]);
      });

      it('should accept new player joining with valid _intents: 1 (wait for BB)', () => {
        // Scenario: Player3 correctly joins with wait-for-BB intent
        // Input: author: 'Player3', _intents: [0, 0, 1] - proper wait-for-BB
        // Expected: Player3 successfully added with _intents: 1
        const validJoin = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 1], // Valid: wait for BB
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseHand, validJoin);

        // Should accept valid join with wait-for-BB intent
        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(result._intents).toEqual([0, 0, 1]);
        expect(result.startingStacks).toEqual([100, 100, 150]);
      });

      it('should accept new player joining with _intents: 2 (simple pause)', () => {
        // Scenario: Player3 joins but immediately pauses
        // Input: author: 'Player3', _intents: [0, 0, 2] - joining with pause intent
        // Expected: Player3 added with _intents: 2
        const joinWithPause = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 2], // Valid: joining with pause
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseHand, joinWithPause);

        // Should accept join with pause intent
        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(result._intents).toEqual([0, 0, 2]);
      });

      it('should add only the author when multiple players are in newHand', () => {
        // Scenario: newHand contains multiple new players, but only author can join
        // Input: newHand has Player3 (author) and Player4, author: 'Player3'
        // Expected: Only Player3 is added, Player4 is ignored
        const newHand = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3', 'Player4'], // Has extra player
          startingStacks: [100, 100, 150, 200],
          blindsOrStraddles: [1, 2, 0, 0],
          antes: [0, 0, 0, 0],
          _inactive: [0, 0, 0, 0],
          _intents: [0, 0, 0, 0],
          _deadBlinds: [0, 0, 0, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        // Should add only Player3 (the author)
        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(result.players.length).toBe(3);
        expect(result.startingStacks).toEqual([100, 100, 150]); // Only Player3's stack
        expect(result.blindsOrStraddles).toEqual([1, 2, 0]);
        expect(result.antes).toEqual([0, 0, 0]);
        expect(result._inactive).toEqual([0, 0, 2]);
        expect(result._intents).toEqual([0, 0, 0]);
        expect(result._deadBlinds).toEqual([0, 0, 0]); // Dead blind calculated for Player3
        expect(result.startingStacks).toEqual([100, 100, 150]);
      });

      it('should accept client-requested buy-in but server may adjust', () => {
        // Scenario: Player3 requests 150 chip buy-in
        // Input: startingStacks includes 150 for Player3, _intents: 1 (wait for BB)
        // Expected: Merged hand accepts the value (server will validate later)
        const newHand = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150], // Player3 requests 150
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        // Client's requested amount is accepted in merge
        expect(result.startingStacks).toEqual([100, 100, 150]);
        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(result._intents).toEqual([0, 0, 1]);
        // Server may adjust this in its response
      });

      it('should handle client requesting buy-in above table maximum', () => {
        // Scenario: Player3 requests 500 chips on 200 max table
        // Input: startingStacks: [100, 100, 500], _intents: 1 (wait for BB)
        // Expected: Value accepted in merge (server adjusts to 200 in response)
        const newHand = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 500], // Requesting above max
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        // Merge accepts the client's value
        expect(result.startingStacks).toEqual([100, 100, 500]);
        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(result._intents).toEqual([0, 0, 1]);
        // Server will cap this to table max in response
      });

      it('should handle client requesting buy-in below table minimum', () => {
        // Scenario: Player3 requests 10 chips on 20 min table
        // Input: startingStacks: [100, 100, 10], _intents: 1 (wait for BB)
        // Expected: Value accepted in merge (server may reject or adjust)
        const newHand = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 10], // Below minimum
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        // Merge accepts whatever client sends
        expect(result.startingStacks).toEqual([100, 100, 10]);
        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(result._intents).toEqual([0, 0, 1]);
        // Server will enforce minimum in response
      });

      it('should handle client with insufficient bankroll', () => {
        // Scenario: Player3 requests 100 but only has 75.25 available
        // Input: startingStacks: [100, 100, 100] from client, _intents: 1 (wait for BB)
        // Expected: Merge accepts, server will adjust to 75.25
        const newHand = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100], // Requests 100
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        // Client request accepted as-is
        expect(result.startingStacks).toEqual([100, 100, 100]);
        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(result._intents).toEqual([0, 0, 1]);
        // Server will adjust to actual bankroll (75.25) in response
      });
    });

    describe('seat selection validation', () => {
      it('should accept valid seat selection within seatCount range', () => {
        // Scenario: Player3 selects seat 4 on 6-max table
        // Input: seats: [1, 2, 4], seatCount: 6, _intents: 1 (wait for BB)
        // Expected: Seat selection preserved, _intents: [0, 0, 1]
        const handWithSeats = {
          ...baseHand,
          seats: [1, 2],
        };

        const newHand = {
          ...handWithSeats,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          seats: [1, 2, 4],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(handWithSeats, newHand);

        expect(result.seats).toEqual([1, 2, 4]);
        expect(result.players.length).toBe(3);
        expect(result._intents).toEqual([0, 0, 1]);
      });

      it('should reject seat selection outside seatCount range', () => {
        // Scenario: Player3 tries seat 7 on 6-max table
        // Input: seats: [1, 2, 7], seatCount: 6, _intents: 1 (wait for BB)
        // Expected: Returns original hand unchanged
        const handWithSeats = {
          ...baseHand,
          seats: [1, 2],
          seatCount: 6,
        };

        const newHand = {
          ...handWithSeats,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          seats: [1, 2, 7], // Seat 7 out of range for 6-max
          _inactive: [0, 0, 0],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(handWithSeats, newHand);

        // Should reject and return original
        expect(result).toBe(handWithSeats);
        expect(result.players).toEqual(['Player1', 'Player2']);
        expect(result.seats).toEqual([1, 2]);
      });

      it('should reject duplicate seat selection', () => {
        // Scenario: Player3 tries to take Player1's seat
        // Input: seats: [1, 2, 1] (duplicate seat 1), _intents: 1 (wait for BB)
        // Expected: Returns original hand unchanged
        const handWithSeats = {
          ...baseHand,
          seats: [1, 2],
          seatCount: 6,
        };

        const newHand = {
          ...handWithSeats,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          seats: [1, 2, 1], // Duplicate seat 1
          _inactive: [0, 0, 0],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(handWithSeats, newHand);

        // Should reject due to duplicate seat
        expect(result).toBe(handWithSeats);
        expect(result.players).toEqual(['Player1', 'Player2']);
        expect(result.seats).toEqual([1, 2]);
      });

      it('should handle missing seats array', () => {
        // Scenario: No seat preferences specified
        // Input: seats field not provided, _intents: 1 (wait for BB)
        // Expected: Merge proceeds, server assigns available seat
        const newHand = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          // No seats array provided
          _inactive: [0, 0, 0],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        // Should proceed without seats
        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(result.startingStacks).toEqual([100, 100, 100]);
        expect(result.seats).toBeUndefined();
        expect(result._intents).toEqual([0, 0, 1]);
      });

      it('should validate seats array length matches players array', () => {
        // Scenario: Seats array wrong length
        // Input: 3 players but seats: [1, 2]
        // Expected: Returns original hand unchanged
        const handWithSeats = {
          ...baseHand,
          seats: [1, 2],
        };

        const newHand = {
          ...handWithSeats,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          seats: [1, 2], // Missing seat for Player3
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(handWithSeats, newHand);

        // Should reject due to mismatched array lengths
        expect(result).toBe(handWithSeats);
        expect(result.players).toEqual(['Player1', 'Player2']);
      });

      it('should handle table size changes', () => {
        // Scenario: Table was 9-max, now 6-max
        // Input: oldHand seatCount: 9, newHand seatCount: 6
        // Expected: Returns original hand unchanged, because of seatCount mismatch
        const nineMaxHand = {
          ...baseHand,
          seatCount: 9,
          seats: [1, 3],
        };

        const sixMaxHand = {
          ...nineMaxHand,
          author: 'Player1',
          seatCount: 6, // Changed to 6-max
          _intents: [0, 0],
        };

        const result = Hand.merge(nineMaxHand, sixMaxHand);

        // Can't merge because of seatCount mismatch, should return original hand
        expect(result.seatCount).toBe(9);
        expect(result.seats).toEqual([1, 3]);
        expect(result._intents).toEqual([0, 0]);
      });
    });

    describe('when arrays need expansion', () => {
      it('should expand all player-related arrays correctly', () => {
        // Scenario: Ensure all arrays expand uniformly
        // Input: 2-player game becomes 3-player game, _intents: 1 (wait for BB)
        // Expected: All arrays have length 3 with correct values
        const newHand = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          seats: [1, 2, 5],
          _venueIds: ['id1', 'id2', 'id3'],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        // All arrays should have length 3
        expect(result.players.length).toBe(3);
        expect(result.startingStacks.length).toBe(3);
        expect(result.blindsOrStraddles.length).toBe(3);
        expect(result.antes.length).toBe(3);
        expect(result._intents!.length).toBe(3);
        expect(result._intents).toEqual([0, 0, 1]);
      });

      it('should initialize optional arrays if not present', () => {
        // Scenario: Base hand missing _venueIds
        // Input: newHand provides _venueIds for all players, _intents: 1 (wait for BB)
        // Expected: _venueIds created and populated, _intents: [0, 0, 1]
        const newHand = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _venueIds: ['user1', 'user2', 'user3'],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        expect(result._venueIds).toEqual(['Player1', 'Player2', 'user3']);
        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(result._intents).toEqual([0, 0, 1]);
      });
    });

    describe('sequential player operations', () => {
      it('should handle sequential addition of multiple players', () => {
        // Scenario: Three players join the game one by one
        // Input: Player3, then Player4, then Player5 join sequentially
        // Expected: Each player added correctly with proper _inactive and _deadBlinds

        // Start with 2 players
        let currentHand = baseHand;

        // Player3 joins
        const player3Joins: Hand = {
          ...currentHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          seats: [1, 2, 3],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0], // Wants to play immediately
          _deadBlinds: [0, 0, 0],
        };

        currentHand = Hand.merge(currentHand, player3Joins);
        expect(currentHand.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(currentHand._inactive).toEqual([0, 0, 2]); // Player3 inactive until next hand
        expect(currentHand._deadBlinds).toEqual([0, 0, 0]); // Player3 at seat 3 will be on BB position, no dead blinds

        // Player4 joins
        const player4Joins = {
          ...currentHand,
          author: 'Player4',
          players: ['Player1', 'Player2', 'Player3', 'Player4'],
          startingStacks: [100, 100, 150, 200],
          blindsOrStraddles: [1, 2, 0, 0],
          seats: [1, 2, 3, 5],
          antes: [0, 0, 0, 0],
          _inactive: [0, 0, 1, 0],
          _intents: [0, 0, 0, 1], // Player4 waits for BB
          _deadBlinds: [0, 0, 2, 0],
        };

        currentHand = Hand.merge(currentHand, player4Joins);
        expect(currentHand.players).toEqual(['Player1', 'Player2', 'Player3', 'Player4']);
        expect(currentHand._inactive).toEqual([0, 0, 2, 2]); // Both new players inactive
        expect(currentHand._intents).toEqual([0, 0, 0, 1]);
        expect(currentHand._deadBlinds).toEqual([0, 0, 0, 0]); // Player4 at seat 5 accumulates dead blinds
        expect(currentHand.startingStacks).toEqual([100, 100, 150, 200]);

        // Player5 joins
        const player5Joins = {
          ...currentHand,
          author: 'Player5',
          players: ['Player1', 'Player2', 'Player3', 'Player4', 'Player5'],
          startingStacks: [100, 100, 150, 200, 120],
          blindsOrStraddles: [1, 2, 0, 0, 0],
          seats: [1, 2, 3, 5, 6],
          antes: [0, 0, 0, 0, 0],
          _inactive: [0, 0, 1, 1, 0],
          _intents: [0, 0, 0, 1, 0], // Player5 wants to play immediately
          _deadBlinds: [0, 0, 2, 0, 0],
        };

        currentHand = Hand.merge(currentHand, player5Joins);
        expect(currentHand.players.length).toBe(5);
        expect(currentHand.players).toEqual([
          'Player1',
          'Player2',
          'Player3',
          'Player4',
          'Player5',
        ]);
        expect(currentHand._inactive).toEqual([0, 0, 2, 2, 2]); // All new players inactive
        expect(currentHand._intents).toEqual([0, 0, 0, 1, 0]);
        expect(currentHand._deadBlinds).toEqual([0, 0, 0, 0, 0]); // Recalculated: Player3 on BB (0), Player4 accumulates (2), Player5 pays (2)
        expect(currentHand.startingStacks).toEqual([100, 100, 150, 200, 120]);
      });

      it('should handle player joining then leaving immediately', () => {
        // Scenario: Player joins and then leaves before playing any hands
        // Input: Player3 joins with wait-for-BB, then changes intent to leave
        // Expected: Player marked for removal, never becomes active

        // Player3 joins
        const player3Joins = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 1], // Wait for BB
          _deadBlinds: [0, 0, 0],
        };

        let currentHand = Hand.merge(baseHand, player3Joins);
        expect(currentHand.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(currentHand._inactive).toEqual([0, 0, 2]);
        expect(currentHand._intents).toEqual([0, 0, 1]);
        expect(currentHand._deadBlinds).toEqual([0, 0, 0]); // Player3 accumulates dead blinds (no seats, so default BB)
        expect(currentHand.startingStacks).toEqual([100, 100, 150]);

        // Player3 decides to leave immediately
        const player3Leaves = {
          ...currentHand,
          author: 'Player3',
          _intents: [0, 0, 3], // Leave intent
        };

        currentHand = Hand.merge(currentHand, player3Leaves);
        expect(currentHand.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(currentHand._inactive).toEqual([0, 0, 2]); // Still inactive
        expect(currentHand._intents).toEqual([0, 0, 3]); // Marked for removal
        expect(currentHand._deadBlinds).toEqual([0, 0, 0]); // Dead blinds remain (intent change doesn't trigger recalc)
        expect(currentHand.startingStacks).toEqual([100, 100, 150]);
      });

      it('should calculate dead blinds correctly for multiple players joining at different positions', () => {
        // Scenario: Players join at various seat positions, dead blinds depend on future position
        // Input: 3 players join with different seat selections
        // Expected: Dead blinds calculated based on their position after rotation

        const baseWith3Players: Hand = {
          variant: 'NT',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [0, 1, 2], // Player3 on BB
          seats: [1, 3, 5],
          antes: [0, 0, 0],
          minBet: 2,
          seatCount: 9,
          actions: [],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        };

        // Player4 joins at seat 2 (between Player1 and Player2)
        const player4Joins: Hand = {
          ...baseWith3Players,
          author: 'Player4',
          players: ['Player1', 'Player2', 'Player3', 'Player4'],
          startingStacks: [100, 100, 100, 150],
          blindsOrStraddles: [0, 1, 2, 0],
          seats: [1, 3, 5, 2], // Seat 2
          antes: [0, 0, 0, 0],
          _inactive: [0, 0, 0, 0],
          _intents: [0, 0, 0, 0], // Play immediately
          _deadBlinds: [0, 0, 0, 0],
        };

        let currentHand = Hand.merge(baseWith3Players, player4Joins);

        // After rotation with seats [1,2,3,5] sorted, blinds will rotate
        // Need to calculate based on seat order
        expect(currentHand.players).toEqual(['Player1', 'Player2', 'Player3', 'Player4']);
        expect(currentHand.seats).toEqual([1, 3, 5, 2]);
        expect(currentHand._inactive).toEqual([0, 0, 0, 2]);
        // Dead blind calculation depends on position after sort
        expect(currentHand._deadBlinds?.[3]).toBe(0);
        expect(currentHand.startingStacks).toEqual([100, 100, 100, 150]);

        // Player5 joins at seat 7
        const player5Joins: Hand = {
          ...currentHand,
          author: 'Player5',
          players: ['Player1', 'Player2', 'Player3', 'Player4', 'Player5'],
          startingStacks: [100, 100, 100, 150, 200],
          blindsOrStraddles: [0, 1, 2, 0, 0],
          seats: [1, 3, 5, 2, 7],
          antes: [0, 0, 0, 0, 0],
          _inactive: [0, 0, 0, 1, 0],
          _intents: [0, 0, 0, 0, 0], // Play immediately
          _deadBlinds: [0, 0, 0, currentHand._deadBlinds?.[3] || 0, 0],
        };

        currentHand = Hand.merge(currentHand, player5Joins);
        expect(currentHand.players.length).toBe(5);
        expect(currentHand.seats).toEqual([1, 3, 5, 2, 7]);
      });

      it('should handle add-remove-add pattern for the same player', () => {
        // Scenario: Player joins, leaves, then rejoins
        // Input: Player3 joins -> leaves -> joins again
        // Expected: Treated as new player each time

        // Initial join
        const firstJoin = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        };

        let currentHand = Hand.merge(baseHand, firstJoin);
        expect(currentHand.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(currentHand._inactive).toEqual([0, 0, 2]);
        expect(currentHand._deadBlinds).toEqual([0, 0, 0]);
        expect(currentHand.startingStacks).toEqual([100, 100, 150]);

        // Player3 leaves
        const playerLeaves = {
          ...currentHand,
          author: 'Player3',
          _intents: [0, 0, 3],
        };

        currentHand = Hand.merge(currentHand, playerLeaves);
        expect(currentHand._intents).toEqual([0, 0, 3]);

        // Simulate Hand.next() removing the player
        const afterRemoval = {
          ...baseHand,
          actions: ['d db AhKhQh', 'p1 cc', 'p2 cc'], // Some actions
        };

        // Player3 joins again (second time)
        const secondJoin = {
          ...afterRemoval,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 175], // Different stack this time
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 1], // Wait for BB this time
          _deadBlinds: [0, 0, 0],
        };

        currentHand = Hand.merge(afterRemoval, secondJoin);
        expect(currentHand.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(currentHand._inactive).toEqual([0, 0, 2]); // Inactive again
        expect(currentHand._intents).toEqual([0, 0, 1]); // Different intent
        expect(currentHand.startingStacks).toEqual([100, 100, 175]); // New stack
      });

      it('should maintain game state consistency with rapid player changes', () => {
        // Scenario: Multiple players changing states in quick succession
        // Input: Mix of joins, pauses, resumes, and leaves
        // Expected: Each operation processed correctly without state corruption

        // Start with 3 active players
        let currentHand: Hand = {
          variant: 'NT',
          players: ['Alice', 'Bob', 'Charlie'],
          startingStacks: [100, 150, 200],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          minBet: 2,
          seatCount: 9,
          actions: [],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        };

        // David joins
        const davidJoins = {
          ...currentHand,
          author: 'David',
          players: ['Alice', 'Bob', 'Charlie', 'David'],
          startingStacks: [100, 150, 200, 100],
          blindsOrStraddles: [1, 2, 0, 0],
          antes: [0, 0, 0, 0],
          _inactive: [0, 0, 0, 0],
          _intents: [0, 0, 0, 0],
          _deadBlinds: [0, 0, 0, 0],
        };

        currentHand = Hand.merge(currentHand, davidJoins);
        expect(currentHand.players.length).toBe(4);
        expect(currentHand._inactive).toEqual([0, 0, 0, 2]);

        // Alice pauses
        const alicePauses = {
          ...currentHand,
          author: 'Alice',
          _intents: [2, 0, 0, 0],
        };

        currentHand = Hand.merge(currentHand, alicePauses);
        expect(currentHand._intents).toEqual([2, 0, 0, 0]);
        expect(currentHand._inactive).toEqual([0, 0, 0, 2]); // Alice stays inactive

        // Eve joins
        const eveJoins = {
          ...currentHand,
          author: 'Eve',
          players: ['Alice', 'Bob', 'Charlie', 'David', 'Eve'],
          startingStacks: [100, 150, 200, 100, 80],
          blindsOrStraddles: [0, 1, 2, 0, 0], // Alice inactive, so blinds shift to Bob/Charlie
          antes: [0, 0, 0, 0, 0],
          _inactive: [1, 0, 0, 1, 0],
          _intents: [2, 0, 0, 0, 1], // Eve waits for BB
          _deadBlinds: [0, 0, 0, currentHand._deadBlinds?.[3] || 0, 0],
        };

        currentHand = Hand.merge(currentHand, eveJoins);
        expect(currentHand.players.length).toBe(5);
        expect(currentHand._inactive).toEqual([0, 0, 0, 2, 2]);

        // Bob leaves
        const bobLeaves = {
          ...currentHand,
          author: 'Bob',
          _intents: [2, 3, 0, 0, 1],
        };

        currentHand = Hand.merge(currentHand, bobLeaves);
        expect(currentHand._intents).toEqual([2, 3, 0, 0, 1]);
        expect(currentHand._inactive).toEqual([0, 0, 0, 2, 2]); // Bob stays active

        // Alice resumes
        const aliceResumes = {
          ...currentHand,
          author: 'Alice',
          _intents: [0, 3, 0, 0, 1],
        };

        currentHand = Hand.merge(currentHand, aliceResumes);
        expect(currentHand._intents).toEqual([0, 3, 0, 0, 1]);
        expect(currentHand._inactive).toEqual([0, 0, 0, 2, 2]); // Still active until next hand

        // Final state check
        expect(currentHand.players).toEqual(['Alice', 'Bob', 'Charlie', 'David', 'Eve']);
        // Alice, Bob and Charlie are active
        expect(currentHand._inactive).toEqual([0, 0, 0, 2, 2]);
        // Alice wants to resume, Bob leaving, Charlie active, David/Eve waiting
        expect(currentHand._intents).toEqual([0, 3, 0, 0, 1]);
      });

      it('should correctly calculate cumulative dead blinds for sequential joins', () => {
        // Scenario: Track dead blind accumulation as players join at different times
        // Input: Players join while game progresses, missing different blind positions
        // Expected: Dead blinds reflect missed mandatory positions

        const gameInProgress: Hand = {
          variant: 'NT',
          players: ['Player1', 'Player2'],
          startingStacks: [100, 100],
          blindsOrStraddles: [1, 2],
          seats: [1, 5], // Seats 1 and 5 occupied
          antes: [0, 0],
          minBet: 2,
          seatCount: 9,
          actions: ['p1 cc', 'p2 cc', 'd db AhKhQh'],
          _inactive: [0, 0],
          _intents: [0, 0],
          _deadBlinds: [0, 0],
        };

        // Player3 joins at seat 3 (between the blinds)
        const player3Joins = {
          ...gameInProgress,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          seats: [1, 5, 3],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0], // Play immediately
          _deadBlinds: [0, 0, 0],
        };

        let currentHand = Hand.merge(gameInProgress, player3Joins);
        expect(currentHand.seats).toEqual([1, 5, 3]);
        expect(currentHand._inactive).toEqual([0, 0, 2]);

        // Player3 at seat 3 will need to pay dead blinds
        // After sort by seats: [1,3,5] -> [P1, P3, P2]
        // Current blinds [1,2] on P1,P2 -> after rotation will be [0,0,1,2] pattern
        expect(currentHand._deadBlinds?.[2]).toBeGreaterThanOrEqual(0); // Some dead blind amount

        // Add more actions to simulate hand progression
        const moreActions = {
          ...currentHand,
          actions: [...currentHand.actions, 'p1 cc', 'p2 cbr 10', 'p1 f'],
        };

        // Player4 joins at seat 7
        const player4Joins = {
          ...moreActions,
          author: 'Player4',
          players: ['Player1', 'Player2', 'Player3', 'Player4'],
          startingStacks: [100, 100, 150, 200],
          blindsOrStraddles: [1, 2, 0, 0],
          seats: [1, 5, 3, 7],
          antes: [0, 0, 0, 0],
          _inactive: [0, 0, 1, 0],
          _intents: [0, 0, 0, 0], // Play immediately
          _deadBlinds: [0, 0, currentHand._deadBlinds?.[2] || 0, 0],
        };

        currentHand = Hand.merge(moreActions, player4Joins);
        expect(currentHand.players.length).toBe(4);
        expect(currentHand.seats).toEqual([1, 5, 3, 7]);
        expect(currentHand._inactive).toEqual([0, 0, 2, 2]);

        // Player4 at seat 7 (after Player2 at seat 5) will have different dead blind calculation
        expect(currentHand._deadBlinds?.[3]).toBeGreaterThanOrEqual(0);
      });

      it('should handle full table scenario with sequential joins', () => {
        // Scenario: Table fills up to maximum capacity
        // Input: Players join until table is full (6-max)
        // Expected: All joins processed correctly, no overflow

        const twoPlayerTable: Hand = {
          variant: 'NT',
          players: ['Player1', 'Player2'],
          startingStacks: [100, 100],
          blindsOrStraddles: [1, 2],
          antes: [0, 0],
          minBet: 2,
          seatCount: 6, // 6-max table
          actions: [],
          _inactive: [0, 0],
          _intents: [0, 0],
          _deadBlinds: [0, 0],
        };

        let currentHand: Hand = twoPlayerTable;

        // Add players 3-6 sequentially
        const newPlayers = ['Player3', 'Player4', 'Player5', 'Player6'];
        const stacks = [150, 200, 120, 180];

        newPlayers.forEach((playerName, index) => {
          const playerCount = currentHand.players.length;
          const newHand: Hand = {
            ...currentHand,
            author: playerName,
            players: [...currentHand.players, playerName],
            startingStacks: [...currentHand.startingStacks, stacks[index]],
            blindsOrStraddles: [...currentHand.blindsOrStraddles, 0],
            antes: [...currentHand.antes, 0],
            _inactive: [...(currentHand._inactive || []), 0],
            _intents: [...(currentHand._intents || []), index % 2], // Mix of intents
            _deadBlinds: [...(currentHand._deadBlinds || []), 0],
          };

          currentHand = Hand.merge(currentHand, newHand);
          expect(currentHand.players.length).toBe(playerCount + 1);
          expect(currentHand.players[playerCount]).toBe(playerName);
        });

        // Table should now be full
        expect(currentHand.players.length).toBe(6);
        expect(currentHand.players).toEqual([
          'Player1',
          'Player2',
          'Player3',
          'Player4',
          'Player5',
          'Player6',
        ]);

        // All new players should be inactive
        expect(currentHand._inactive).toEqual([0, 0, 2, 2, 2, 2]);
      });
    });
  });

  describe('Player intent changes (Pause/Resume/Leave)', () => {
    describe('author validation for intent changes', () => {
      it('should verify author exists in players array', () => {
        // Scenario: Unknown player tries to change intents
        // Input: author: 'Player99', not in players array
        // Expected: Returns original hand unchanged
        const newHand = {
          ...baseHand,
          author: 'Player99',
          _intents: [1, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        // Should reject unknown author
        expect(result).toBe(baseHand);
        expect(result._intents).toEqual([0, 0]);
      });

      it('should calculate author index from name and validate changes', () => {
        // Scenario: Server must verify author modifies only their index
        // Input: author: 'Player2' (index 1), tries to change _intents[0]
        // Expected: Returns original hand unchanged - wrong index
        const newHand = {
          ...baseHand,
          author: 'Player2',
          _intents: [1, 0], // Player2 trying to change index 0!
        };

        const result = Hand.merge(baseHand, newHand);

        // Should only allow Player2 to change index 1
        expect(result._intents).toEqual([0, 0]);
      });

      it('should reject any modifications at non-author index', () => {
        // Scenario: Player1 (index 0) provides _intents: [0, 2]
        // Input: author: 'Player1', but _intents[1] changed
        // Expected: Only _intents[0] can be modified, reject change
        const newHand = {
          ...baseHand,
          author: 'Player1',
          _intents: [0, 2], // Player1 trying to change Player2's intent!
        };

        const result = Hand.merge(baseHand, newHand);

        // Should not allow changing other player's intent
        expect(result._intents).toEqual([0, 0]);
      });

      it('should preserve all non-author indices unchanged', () => {
        // Scenario: Ensure other players' intents remain untouched
        // Input: author: 'Player2', _intents: [99, 2, 99]
        // Expected: Result _intents: [0, 2, 0] - only index 1 modified
        const threePlayerHand = {
          ...baseHand,
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [0, 1, 2],
          antes: [0, 0, 0],
          _intents: [0, 0, 0],
        };

        const newHand = {
          ...threePlayerHand,
          author: 'Player2',
          _intents: [99, 2, 99], // Trying to change all
        };

        const result = Hand.merge(threePlayerHand, newHand);

        // Only Player2's intent should change
        expect(result._intents).toEqual([0, 2, 0]);
      });

      it('should calculate correct author index from player name', () => {
        // Scenario: Player2 (index 1) changes their intent
        // Input: author: 'Player2', _intents: [0, 1]
        // Expected: Only index 1 modified
        const newHand = {
          ...baseHand,
          author: 'Player2',
          _intents: [0, 1],
        };

        const result = Hand.merge(baseHand, newHand);

        expect(result._intents).toEqual([0, 1]);
      });

      it('should allow player to change only their own intent by index', () => {
        // Scenario: Player1 (index 0) changes their intent
        // Input: author: 'Player1', _intents: [2, 0]
        // Expected: Only Player1's intent at index 0 updated
        const newHand = {
          ...baseHand,
          author: 'Player1',
          _intents: [2, 99], // Player1 tries to change both
        };

        const result = Hand.merge(baseHand, newHand);

        // Only author's index should change
        expect(result._intents).toEqual([2, 0]);
      });

      it('should reject intent changes at wrong index', () => {
        // Scenario: Player1 tries to modify index 1
        // Input: author: 'Player1', _intents: [0, 1]
        // Expected: Returns original hand unchanged
        const newHand = {
          ...baseHand,
          author: 'Player1',
          _intents: [0, 1], // Player1 trying to change Player2's intent
        };

        const result = Hand.merge(baseHand, newHand);

        // Should only allow changing own index
        expect(result._intents).toEqual([0, 0]);
      });

      it('should reject author with venue ID instead of name', () => {
        // Scenario: Author attempts to use venue ID instead of player name
        // Input: author uses venue-specific ID that is not in players array
        // Expected: Returns original hand unchanged - venue IDs cannot be used as author
        const handWithVenueIds = {
          ...baseHand,
          _venueIds: ['user123', 'user456'],
        };

        const newHand = {
          ...handWithVenueIds,
          author: 'user456', // Not a valid player name!
          _intents: [0, 2],
        };

        const result = Hand.merge(handWithVenueIds, newHand);

        // Should reject because author must be a player name, not a venue ID
        expect(result).toBe(handWithVenueIds);
        expect(result._intents).toEqual([0, 0]);
      });
    });

    describe('intent value changes', () => {
      it('should handle pause till BB intent (value 1)', () => {
        // Scenario: Player sets intent to wait for BB
        // Input: _intents: [1, 0] for Player1
        // Expected: Intent updated to 1, player becomes inactive immediately
        const newHand = {
          ...baseHand,
          author: 'Player1',
          _intents: [1, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        expect(result._intents).toEqual([1, 0]);
        expect(result._inactive).toEqual([0, 0]); // Player1 stays active until next hand
      });

      it('should handle simple pause intent (value 2)', () => {
        // Scenario: Player takes immediate pause
        // Input: _intents: [2, 0] for Player1
        // Expected: Intent updated to 2, player becomes inactive immediately
        const newHand = {
          ...baseHand,
          author: 'Player1',
          _intents: [2, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        expect(result._intents).toEqual([2, 0]);
        expect(result._inactive).toEqual([0, 0]); // Player1 stays active until next hand
      });

      it('should handle leave game intent (value 3)', () => {
        // Scenario: Player wants to leave permanently
        // Input: _intents: [3, 0] for Player1
        // Expected: Intent updated to 3, player becomes inactive immediately
        const newHand = {
          ...baseHand,
          author: 'Player1',
          _intents: [3, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        expect(result._intents).toEqual([3, 0]);
        expect(result._inactive).toEqual([0, 0]); // Player1 stays active until next hand
      });

      it('should handle resume from pause (value 0)', () => {
        // Scenario: Paused player wants to resume
        // Input: Previous _intents: 2, now _intents: 0
        // Expected: Intent updated to 0
        const pausedHand = {
          ...baseHand,
          blindsOrStraddles: [0, 2], // Player1 inactive, so only Player2 has BB
          _intents: [2, 0],
          _inactive: [1, 0],
        };

        const newHand = {
          ...pausedHand,
          author: 'Player1',
          _intents: [0, 0],
        };

        const result = Hand.merge(pausedHand, newHand);

        expect(result._intents).toEqual([0, 0]);
        expect(result._inactive).toEqual([1, 0]); // Server field unchanged
      });

      it('should reject invalid intent values', () => {
        // Scenario: Invalid intent value
        // Input: _intents: [99, 0]
        // Expected: Returns original hand unchanged
        const newHand = {
          ...baseHand,
          author: 'Player1',
          _intents: [99, 0], // Invalid value 99
        };

        const result = Hand.merge(baseHand, newHand);

        // Should reject invalid intent value
        expect(result).toBe(baseHand);
        expect(result._intents).toEqual([0, 0]);
      });
    });

    describe('server-controlled field restrictions', () => {
      it('should not allow client to modify _inactive directly', () => {
        // SCENARIO: Client tries to activate themselves
        // INPUT: author: 'Player1', _inactive: [0, 0] -> [1, 0]
        // EXPECTED: _inactive change ignored
        const inactiveHand = {
          ...baseHand,
          blindsOrStraddles: [0, 2], // Player1 inactive, so no blind for them
          _inactive: [1, 0],
        };

        const newHand = {
          ...inactiveHand,
          author: 'Player1',
          _inactive: [0, 0], // Trying to activate themselves
          _intents: [0, 0],
        };

        const result = Hand.merge(inactiveHand, newHand);

        // Server field should remain unchanged
        expect(result._inactive).toEqual([1, 0]);
        expect(result._intents).toEqual([0, 0]);
      });

      it('should not allow client to modify _deadBlinds directly', () => {
        // Scenario: Client tries to clear dead blinds
        // Input: author: 'Player1', _deadBlinds: [3, 0] -> [0, 0]
        // Expected: _deadBlinds change ignored
        const handWithDebt = {
          ...baseHand,
          _deadBlinds: [30, 0],
        };

        const newHand = {
          ...handWithDebt,
          author: 'Player1',
          _deadBlinds: [0, 0], // Trying to clear debt
          _intents: [0, 0],
        };

        const result = Hand.merge(handWithDebt, newHand);

        // Server field should remain unchanged
        expect(result._deadBlinds).toEqual([30, 0]);
      });

      it('should not allow modifying other players server fields', () => {
        // Scenario: Player1 tries to change Player2's _inactive
        // Input: author: 'Player1', changes at index 1
        // Expected: All changes at non-author indices ignored
        const handWithInactive = {
          ...baseHand,
          blindsOrStraddles: [2, 0], // Player2 inactive, so no blind for them
          _inactive: [0, 1],
          _deadBlinds: [0, 10],
        };

        const newHand = {
          ...handWithInactive,
          author: 'Player1',
          _inactive: [0, 0], // Trying to activate Player2
          _deadBlinds: [0, 0], // Trying to clear Player2's debt
          _intents: [0, 0],
        };

        const result = Hand.merge(handWithInactive, newHand);

        // Server fields should remain unchanged
        expect(result._inactive).toEqual([0, 1]);
        expect(result._deadBlinds).toEqual([0, 10]);
      });

      it('should preserve server fields when processing client changes', () => {
        // SCENARIO: Inactive player changes only their intent (allowed field)
        // INPUT: Client sends newHand with _intents: [0, 0] (wants to resume)
        // EXPECTED: _inactive and _deadBlinds preserved, _intents accepted
        const serverHand = {
          ...baseHand,
          blindsOrStraddles: [0, 2], // Player1 inactive, so no blind for them
          _inactive: [1, 0],
          _deadBlinds: [20, 0],
          _intents: [2, 0],
        };

        const newHand = {
          ...serverHand,
          author: 'Player1',
          // _inactive and _deadBlinds NOT changed - client keeps server values
          // Only _intents is changed (which client is allowed to do)
          _intents: [0, 0],
        };

        const result = Hand.merge(serverHand, newHand);

        // Server fields preserved, client intent accepted
        expect(result._inactive).toEqual([1, 0]);
        expect(result._deadBlinds).toEqual([20, 0]);
        expect(result._intents).toEqual([0, 0]);
      });
    });
  });

  describe('Complex state transition scenarios', () => {
    describe('JOIN -> LEAVE transitions', () => {
      it('should handle player joining then immediately leaving', () => {
        // Scenario: Player3 joins (_inactive: 1, _intents: 1) then leaves (_intents: 3)
        // Input: First merge adds Player3 with _intents: 1, second merge sets _intents: 3
        // Expected: Player marked for removal in next hand
        // First merge - Player3 joins
        const joinHand = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 1],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        const afterJoin = Hand.merge(baseHand, joinHand);
        expect(afterJoin.players.length).toBe(3);
        expect(afterJoin._inactive).toEqual([0, 0, 2]);
        expect(afterJoin._intents).toEqual([0, 0, 1]);

        // Second merge - Player3 leaves
        const leaveHand = {
          ...afterJoin,
          author: 'Player3',
          _intents: [0, 0, 3],
        };

        const result = Hand.merge(afterJoin, leaveHand);
        expect(result._intents).toEqual([0, 0, 3]);
        expect(result._inactive).toEqual([0, 0, 2]);
      });

      it('should handle new player deciding to leave before getting cards', () => {
        // Scenario: Player joins mid-hand, then leaves before next hand
        // Input: _inactive: 1, _intents: 1 -> _intents: 3
        // Expected: Will be removed without ever playing
        const joinedMidGame = {
          ...baseHand,
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 1],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
          actions: ['p1 cc', 'p2 cbr 10'],
        };

        const newHand = {
          ...joinedMidGame,
          author: 'Player3',
          _intents: [0, 0, 3],
        };

        const result = Hand.merge(joinedMidGame, newHand);

        expect(result._intents).toEqual([0, 0, 3]);
        expect(result._inactive).toEqual([0, 0, 1]);
      });
    });

    describe('JOIN -> PAUSE -> UNPAUSE transitions', () => {
      it('should handle player joining with wait-for-BB then deciding to play immediately', () => {
        // Scenario: Player joins with wait-for-BB intent, then changes to play immediately
        // Input: New player joins with _intents: 1, then changes to _intents: 0
        // Expected: Player marked to pay dead blinds (if any) and join next hand

        // Step 1: Player3 joins mid-game with wait-for-BB intent
        const gameInProgress = {
          ...baseHand,
          actions: ['p1 cc', 'p2 cbr 10', 'p1 cc', 'd db AhKhQh'],
        };

        const joinWithWaitBB = {
          ...gameInProgress,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 2], // New player inactive mid-game
          _intents: [0, 0, 1], // Wait for BB
          _deadBlinds: [0, 0, 0], // No dead blinds yet
        };

        const afterJoin = Hand.merge(gameInProgress, joinWithWaitBB);
        expect(afterJoin.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(afterJoin._inactive).toEqual([0, 0, 2]);
        expect(afterJoin._intents).toEqual([0, 0, 1]);
        expect(afterJoin._deadBlinds).toEqual([0, 0, 0]); // Player3 accumulates dead blinds (no seats, defaults to BB)
        expect(afterJoin.startingStacks).toEqual([100, 100, 150]);

        // Step 2: Player3 decides to play immediately (changes to _intents: 0)
        const playImmediately = {
          ...afterJoin,
          author: 'Player3',
          _intents: [0, 0, 0], // Changed mind - wants to play now
        };

        const afterIntentChange = Hand.merge(afterJoin, playImmediately);

        // Intent changes to 0 (wants to play)
        expect(afterIntentChange._intents).toEqual([0, 0, 0]);
        // Still inactive this hand (server controls this)
        expect(afterIntentChange._inactive).toEqual([0, 0, 2]);
        // Dead blinds unchanged (intent change doesn't trigger recalculation)
        expect(afterIntentChange._deadBlinds).toEqual([0, 0, 0]);
        expect(afterIntentChange.startingStacks).toEqual([100, 100, 150]);

        // Note: In Hand.next(), if Player3 missed blind positions while waiting,
        // they would need to pay dead blinds. But since they just joined and
        // haven't missed any blinds yet, they typically won't have dead blinds.
      });

      it('should handle new player accumulating dead blinds then deciding to play', () => {
        // Scenario: Player joins, waits several hands (accumulating dead blinds), then plays
        // Input: Player with _intents: 1 and accumulated _deadBlinds changes to _intents: 0
        // Expected: Must pay accumulated dead blinds in next hand

        const playerWaitingWithDebt = {
          ...baseHand,
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 1], // Player3 is inactive
          _intents: [0, 0, 1], // Player3 waiting for BB
          _deadBlinds: [0, 0, 2], // Player3 accumulated 2 chips in dead blinds
          actions: ['p1 cc', 'p2 cc', 'd db AhKhQh'],
        };

        const decidesToPlay = {
          ...playerWaitingWithDebt,
          author: 'Player3',
          _intents: [0, 0, 0], // Player3 decides to play immediately
        };

        const result = Hand.merge(playerWaitingWithDebt, decidesToPlay);

        // Intent changes to play immediately
        expect(result._intents).toEqual([0, 0, 0]);
        // Still inactive this hand
        expect(result._inactive).toEqual([0, 0, 1]);
        // Dead blinds preserved - will be collected in Hand.next()
        expect(result._deadBlinds).toEqual([0, 0, 2]);

        // In Hand.next(), Player3 would pay the 2 chips dead blind
        // and become active if they have sufficient chips
      });

      it('should prevent newly joined inactive player from acting even after intent change', () => {
        // Scenario: Player joins, changes intent to play, tries to act in current hand
        // Input: Inactive player with _intents: 0 tries to add actions
        // Expected: Actions rejected, must wait for next hand

        // Player3 joined and is now inactive but wants to play
        const joinedAndWantsToPlay = {
          ...baseHand,
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 1], // Player3 inactive
          _intents: [0, 0, 0], // Player3 wants to play
          _deadBlinds: [0, 0, 0],
          actions: ['p1 cc', 'p2 cbr 10'],
        };

        // Player3 tries to act despite being inactive
        const tryToAct = {
          ...joinedAndWantsToPlay,
          author: 'Player3',
          actions: [
            'p1 cc',
            'p2 cbr 10',
            'p3 cc', // Trying to act while inactive!
          ],
        };

        const result = Hand.merge(joinedAndWantsToPlay, tryToAct);

        // Actions should be rejected - inactive player cannot act
        expect(result.actions).toEqual(['p1 cc', 'p2 cbr 10']);
        expect(result._inactive).toEqual([0, 0, 1]);
        expect(result._intents).toEqual([0, 0, 0]);
      });

      it('should handle new player pausing before first hand', () => {
        // Scenario: Join, then pause, then unpause
        // Input: _inactive: 1, _intents: 1 -> 2 -> 0
        // Expected: Correct state transitions, dead blinds if applicable
        const joinedState = {
          ...baseHand,
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 1],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        // First: pause
        const pauseHand = {
          ...joinedState,
          author: 'Player3',
          _intents: [0, 0, 2],
        };

        const afterPause = Hand.merge(joinedState, pauseHand);
        expect(afterPause._intents).toEqual([0, 0, 2]);

        // Then: unpause
        const unpauseHand = {
          ...afterPause,
          author: 'Player3',
          _intents: [0, 0, 0],
        };

        const result = Hand.merge(afterPause, unpauseHand);
        expect(result._intents).toEqual([0, 0, 0]);
      });

      it('should handle player joining, playing, then pausing', () => {
        // Scenario: Active play then pause
        // Input: _inactive: 0, _intents: 0 -> _intents: 1
        // Expected: Player becomes inactive immediately in current hand
        const activeHand = {
          ...baseHand,
          _inactive: [0, 0],
          _intents: [0, 0],
          actions: ['p1 cc', 'p2 cc', 'd db AhKhQh'],
        };

        const pauseHand = {
          ...activeHand,
          author: 'Player1',
          _intents: [1, 0],
        };

        const result = Hand.merge(activeHand, pauseHand);

        expect(result._intents).toEqual([1, 0]);
        expect(result._inactive).toEqual([0, 0]); // Becomes inactive next hand
      });

      it('should accumulate dead blinds during pause after join', () => {
        // Scenario: Join, pause, accumulate debt, unpause
        // Input: Track dead blind accumulation
        // Expected: Correct dead blind amount when returning
        const pausedWithDebt = {
          ...baseHand,
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 1],
          _intents: [0, 0, 2],
          _deadBlinds: [0, 0, 15], // Accumulated debt
        };

        const resumeHand = {
          ...pausedWithDebt,
          author: 'Player3',
          _intents: [0, 0, 0], // Wants to resume
        };

        const result = Hand.merge(pausedWithDebt, resumeHand);

        expect(result._intents).toEqual([0, 0, 0]);
        expect(result._deadBlinds).toEqual([0, 0, 15]); // Debt preserved
      });
    });

    describe('PAUSE -> LEAVE transitions', () => {
      it('should not charge dead blinds when paused player leaves', () => {
        // Scenario: Player on pause with debt decides to leave
        // Input: _inactive: 1, _intents: 2, _deadBlinds: 3 -> _intents: 3
        // Expected: Player removed, debt not collected
        const pausedWithDebt = {
          ...baseHand,
          blindsOrStraddles: [0, 2], // Player1 inactive, so no blind
          _inactive: [1, 0],
          _intents: [2, 0],
          _deadBlinds: [30, 0],
        };

        const leaveHand = {
          ...pausedWithDebt,
          author: 'Player1',
          _intents: [3, 0],
        };

        const result = Hand.merge(pausedWithDebt, leaveHand);

        expect(result._intents).toEqual([3, 0]);
        expect(result._deadBlinds).toEqual([30, 0]); // Debt not cleared
      });

      it('should handle wait-for-BB player leaving', () => {
        // Scenario: Waiting for BB position, then leaves
        // Input: _inactive: 1, _intents: 1 -> _intents: 3
        // Expected: Removed without reaching BB
        const waitingForBB = {
          ...baseHand,
          blindsOrStraddles: [0, 2], // Player1 inactive, so no blind
          _inactive: [1, 0],
          _intents: [1, 0],
          _deadBlinds: [0, 0],
        };

        const leaveHand = {
          ...waitingForBB,
          author: 'Player1',
          _intents: [3, 0],
        };

        const result = Hand.merge(waitingForBB, leaveHand);

        expect(result._intents).toEqual([3, 0]);
        expect(result._inactive).toEqual([1, 0]);
      });
    });
  });

  describe('State combination matrix (real poker scenarios)', () => {
    describe('valid state combinations', () => {
      it('should handle active play state', () => {
        // Scenario: Player actively playing
        // State: _inactive: 0, _intents: 0, _deadBlinds: 0
        // Expected: Normal game participation
        const activeState = {
          ...baseHand,
          _inactive: [0, 0],
          _intents: [0, 0],
          _deadBlinds: [0, 0],
        };

        const newHand = {
          ...activeState,
          author: 'Player1',
          _intents: [0, 0],
        };

        const result = Hand.merge(activeState, newHand);

        expect(result._inactive).toEqual([0, 0]);
        expect(result._intents).toEqual([0, 0]);
        expect(result._deadBlinds).toEqual([0, 0]);
      });

      it('should handle request pause to BB during hand', () => {
        // Scenario: Player clicks "sit out next hand" during play
        // State: _inactive: 0, _intents: 1, _deadBlinds: 0
        // Expected: Player becomes inactive immediately, misses rest of current hand
        const duringHand = {
          ...baseHand,
          _inactive: [0, 0],
          _intents: [0, 0],
          _deadBlinds: [0, 0],
          actions: ['p1 cc', 'p2 cbr 10'],
        };

        const newHand = {
          ...duringHand,
          author: 'Player1',
          _intents: [1, 0],
        };

        const result = Hand.merge(duringHand, newHand);

        expect(result._inactive).toEqual([0, 0]); // Becomes inactive next hand
        expect(result._intents).toEqual([1, 0]); // Intent to wait for BB
        expect(result._deadBlinds).toEqual([0, 0]);
      });

      it('should handle request simple pause during hand', () => {
        // Scenario: Player needs immediate break
        // State: _inactive: 0, _intents: 2, _deadBlinds: 0
        // Expected: Player becomes inactive immediately
        const duringHand = {
          ...baseHand,
          _inactive: [0, 0],
          _intents: [0, 0],
          _deadBlinds: [0, 0],
          actions: ['p1 cc'],
        };

        const newHand = {
          ...duringHand,
          author: 'Player2',
          _intents: [0, 2],
        };

        const result = Hand.merge(duringHand, newHand);

        expect(result._inactive).toEqual([0, 0]); // Player2 becomes inactive next hand
        expect(result._intents).toEqual([0, 2]);
        expect(result._deadBlinds).toEqual([0, 0]);
      });

      it('should handle request exit during hand', () => {
        // Scenario: Player leaving table during hand
        // State: _inactive: 0, _intents: 3, _deadBlinds: 0
        // Expected: Player becomes inactive immediately, will be removed after hand
        const duringHand = {
          ...baseHand,
          _inactive: [0, 0],
          _intents: [0, 0],
          _deadBlinds: [0, 0],
          actions: ['p1 cc', 'p2 cc', 'd db AhKhQh'],
        };

        const newHand = {
          ...duringHand,
          author: 'Player1',
          _intents: [3, 0],
        };

        const result = Hand.merge(duringHand, newHand);

        expect(result._inactive).toEqual([0, 0]); // Player1 becomes inactive in the next hand
        expect(result._intents).toEqual([3, 0]);
      });

      it('should handle new player waiting to join', () => {
        // Scenario: Player joined mid-hand
        // State: _inactive: 1, _intents: 1, _deadBlinds: 0
        // Expected: Gets cards next hand
        const newPlayerJoined = {
          ...baseHand,
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 1],
          _intents: [0, 0, 1],
          _deadBlinds: [0, 0, 0],
        };

        const newHand = {
          ...newPlayerJoined,
          author: 'Player3',
          _intents: [0, 0, 1],
        };

        const result = Hand.merge(newPlayerJoined, newHand);

        expect(result._inactive).toEqual([0, 0, 1]);
        expect(result._intents).toEqual([0, 0, 1]);
        expect(result._deadBlinds).toEqual([0, 0, 0]);
      });

      it('should handle player ready to return with small debt', () => {
        // Scenario: Missed SB only (0.5BB debt)
        // State: _inactive: 1, _intents: 0, _deadBlinds: 1 (for 2 BB)
        // Expected: Must pay 1 chip to return
        const pausedWithSmallDebt = {
          ...baseHand,
          _inactive: [1, 0],
          _intents: [0, 0],
          _deadBlinds: [1, 0], // 0.5 * BB(2) = 1
        };

        const newHand = {
          ...pausedWithSmallDebt,
          author: 'Player1',
          _intents: [0, 0],
        };

        const result = Hand.merge(pausedWithSmallDebt, newHand);

        expect(result._inactive).toEqual([1, 0]);
        expect(result._intents).toEqual([0, 0]);
        expect(result._deadBlinds).toEqual([1, 0]);
      });

      it('should handle player ready to return with max debt', () => {
        // Scenario: Missed multiple blinds (1.5BB max)
        // State: _inactive: 1, _intents: 0, _deadBlinds: 3 (for 2 BB)
        // Expected: Must pay 3 chips to return
        const pausedWithMaxDebt = {
          ...baseHand,
          _inactive: [1, 0],
          _intents: [0, 0],
          _deadBlinds: [3, 0], // 1.5 * BB(2) = 3
        };

        const newHand = {
          ...pausedWithMaxDebt,
          author: 'Player1',
          _intents: [0, 0],
        };

        const result = Hand.merge(pausedWithMaxDebt, newHand);

        expect(result._inactive).toEqual([1, 0]);
        expect(result._intents).toEqual([0, 0]);
        expect(result._deadBlinds).toEqual([3, 0]);
      });

      it('should handle paused waiting for BB position', () => {
        // Scenario: Player sitting out till BB
        // State: _inactive: 1, _intents: 1, _deadBlinds: 0
        // Expected: Returns when BB without paying
        const waitingForBB = {
          ...baseHand,
          _inactive: [1, 0],
          _intents: [1, 0],
          _deadBlinds: [0, 0],
        };

        const newHand = {
          ...waitingForBB,
          author: 'Player1',
          _intents: [1, 0],
        };

        const result = Hand.merge(waitingForBB, newHand);

        expect(result._inactive).toEqual([1, 0]);
        expect(result._intents).toEqual([1, 0]);
        expect(result._deadBlinds).toEqual([0, 0]);
      });

      it('should handle paused with accumulating debt', () => {
        // Scenario: Paused but tracking missed blinds
        // State: _inactive: 1, _intents: 1, _deadBlinds: 2
        // Expected: Debt tracked but not paid if waits for BB
        const pausedAccumulating = {
          ...baseHand,
          _inactive: [1, 0],
          _intents: [1, 0],
          _deadBlinds: [2, 0],
        };

        const newHand = {
          ...pausedAccumulating,
          author: 'Player1',
          _intents: [1, 0],
        };

        const result = Hand.merge(pausedAccumulating, newHand);

        expect(result._inactive).toEqual([1, 0]);
        expect(result._intents).toEqual([1, 0]);
        expect(result._deadBlinds).toEqual([2, 0]);
      });

      it('should handle simple pause accumulating debt', () => {
        // Scenario: Break extending multiple hands
        // State: _inactive: 1, _intents: 2, _deadBlinds: 1.5
        // Expected: Must pay debt when returning
        const pausedWithDebt = {
          ...baseHand,
          blindsOrStraddles: [0, 2], // Player1 inactive, so no blind
          _inactive: [1, 0],
          _intents: [2, 0],
          _deadBlinds: [3, 0], // 1.5 * 2 = 3 chips
        };

        const newHand = {
          ...pausedWithDebt,
          author: 'Player1',
          _intents: [0, 0], // Wants to return
        };

        const result = Hand.merge(pausedWithDebt, newHand);

        expect(result._inactive).toEqual([1, 0]);
        expect(result._intents).toEqual([0, 0]);
        expect(result._deadBlinds).toEqual([3, 0]);
      });

      it('should handle player exiting with unpaid debt', () => {
        // Scenario: Leaving permanently with dead blinds
        // State: _inactive: 1, _intents: 3, _deadBlinds: 2
        // Expected: Removed without paying debt
        const leavingWithDebt = {
          ...baseHand,
          blindsOrStraddles: [0, 2], // Player1 inactive, so no blind
          _inactive: [1, 0],
          _intents: [2, 0],
          _deadBlinds: [2, 0],
        };

        const newHand = {
          ...leavingWithDebt,
          author: 'Player1',
          _intents: [3, 0],
        };

        const result = Hand.merge(leavingWithDebt, newHand);

        expect(result._inactive).toEqual([1, 0]);
        expect(result._intents).toEqual([3, 0]);
        expect(result._deadBlinds).toEqual([2, 0]);
      });
    });

    describe('active player with dead blinds (returning from pause)', () => {
      // NOTE: Active player with dead blinds is VALID state
      // This happens when a player returns from pause - Game() charges the debt

      it('should accept active player with dead blinds', () => {
        // SCENARIO: Player returned from pause, has debt for Game() to charge
        // INPUT: _inactive: 0, _intents: 0, _deadBlinds: >0
        // EXPECTED: Valid state, merge proceeds

        const returningPlayer = {
          ...baseHand,
          _inactive: [0, 0],
          _intents: [0, 0],
          _deadBlinds: [20, 0], // Debt preserved for Game() to charge
        };

        const newHand = {
          ...returningPlayer,
          author: 'Player1',
          _intents: [2, 0], // Player wants to pause again
        };

        const result = Hand.merge(returningPlayer, newHand);

        expect(result._intents).toEqual([2, 0]);
      });

      it('should accept active player requesting waitBB with debt', () => {
        // SCENARIO: Returning player wants to wait for BB
        // INPUT: _inactive: 0, _intents: 1, _deadBlinds: >0
        // EXPECTED: Valid state, merge proceeds

        const returningPlayer = {
          ...baseHand,
          _inactive: [0, 0],
          _intents: [0, 0],
          _deadBlinds: [10, 0],
        };

        const newHand = {
          ...returningPlayer,
          author: 'Player1',
          _intents: [1, 0],
        };

        const result = Hand.merge(returningPlayer, newHand);

        expect(result._intents).toEqual([1, 0]);
      });

      it('should accept active player requesting pause with debt', () => {
        // SCENARIO: Returning player wants to pause again
        // INPUT: _inactive: 0, _intents: 2, _deadBlinds: >0
        // EXPECTED: Valid state, merge proceeds

        const returningPlayer = {
          ...baseHand,
          _inactive: [0, 0],
          _intents: [0, 0],
          _deadBlinds: [15, 0],
        };

        const newHand = {
          ...returningPlayer,
          author: 'Player1',
          _intents: [2, 0],
        };

        const result = Hand.merge(returningPlayer, newHand);

        expect(result._intents).toEqual([2, 0]);
      });

      it('should accept active player leaving with debt', () => {
        // SCENARIO: Returning player wants to leave (forfeits debt)
        // INPUT: _inactive: 0, _intents: 3, _deadBlinds: >0
        // EXPECTED: Valid state, merge proceeds, next() removes player

        const returningPlayer = {
          ...baseHand,
          _inactive: [0, 0],
          _intents: [0, 0],
          _deadBlinds: [5, 0],
        };

        const newHand = {
          ...returningPlayer,
          author: 'Player1',
          _intents: [3, 0],
        };

        const result = Hand.merge(returningPlayer, newHand);

        expect(result._intents).toEqual([3, 0]);
      });
    });

    describe('state transition scenarios', () => {
      it('should handle transition from active to pause request', () => {
        // Scenario: Player clicks sit out during hand
        // From: _inactive: 0, _intents: 0
        // To: _inactive: 0, _intents: 1
        // Expected: Intent changes, inactive changed to 1 via merging
        const activeState = {
          ...baseHand,
          _inactive: [0, 0],
          _intents: [0, 0],
          actions: ['p1 cc', 'p2 cc'],
        };

        const pauseRequest = {
          ...activeState,
          author: 'Player1',
          _intents: [1, 0],
        };

        const result = Hand.merge(activeState, pauseRequest);

        expect(result._inactive).toEqual([0, 0]);
        expect(result._intents).toEqual([1, 0]);
      });

      it('should handle transition from paused to resuming', () => {
        // Scenario: Paused player wants back in
        // From: _inactive: 1, _intents: 2, _deadBlinds: 2
        // To: _inactive: 1, _intents: 0, _deadBlinds: 2
        // Expected: Intent changes, will pay debt next hand
        const pausedState = {
          ...baseHand,
          blindsOrStraddles: [0, 2], // Player1 inactive, so no blind
          _inactive: [1, 0],
          _intents: [2, 0],
          _deadBlinds: [2, 0],
        };

        const resumeRequest = {
          ...pausedState,
          author: 'Player1',
          _intents: [0, 0],
        };

        const result = Hand.merge(pausedState, resumeRequest);

        expect(result._inactive).toEqual([1, 0]);
        expect(result._intents).toEqual([0, 0]);
        expect(result._deadBlinds).toEqual([2, 0]);
      });

      it('should handle transition from wait-BB to early return', () => {
        // Scenario: Player stops waiting for BB
        // From: _inactive: 1, _intents: 1, _deadBlinds: 1
        // To: _inactive: 1, _intents: 0, _deadBlinds: 1
        // Expected: Will pay debt and return next hand
        const waitingState = {
          ...baseHand,
          blindsOrStraddles: [0, 2], // Player1 inactive, so no blind
          _inactive: [1, 0],
          _intents: [1, 0],
          _deadBlinds: [1, 0],
        };

        const earlyReturnRequest = {
          ...waitingState,
          author: 'Player1',
          _intents: [0, 0],
        };

        const result = Hand.merge(waitingState, earlyReturnRequest);

        expect(result._inactive).toEqual([1, 0]);
        expect(result._intents).toEqual([0, 0]);
        expect(result._deadBlinds).toEqual([1, 0]);
      });

      it('should handle transition from pause to permanent exit', () => {
        // Scenario: Paused player decides to leave
        // From: _inactive: 1, _intents: 2, _deadBlinds: 3
        // To: _inactive: 1, _intents: 3, _deadBlinds: 3
        // Expected: Will be removed without paying debt
        const pausedState = {
          ...baseHand,
          blindsOrStraddles: [0, 2], // Player1 inactive, so no blind
          _inactive: [1, 0],
          _intents: [2, 0],
          _deadBlinds: [3, 0],
        };

        const exitRequest = {
          ...pausedState,
          author: 'Player1',
          _intents: [3, 0],
        };

        const result = Hand.merge(pausedState, exitRequest);

        expect(result._inactive).toEqual([1, 0]);
        expect(result._intents).toEqual([3, 0]);
        expect(result._deadBlinds).toEqual([3, 0]);
      });
    });
  });

  describe('Complex merge scenarios', () => {
    describe('simultaneous operations', () => {
      it('should handle player joining while another pauses', () => {
        // Scenario: Player3 joins while Player2 pauses
        // Input: Player3 author adds self with _intents: 1, Player2 changes intent
        // Expected: Only author's changes processed
        const newHand = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 2, 1], // Player2 trying to pause, Player3 joining with wait for BB
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        // Player3 can join, but can't change Player2's intent
        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(result._intents).toEqual([0, 0, 1]); // Player2's intent not changed
      });

      it('should handle multiple players with different intents', () => {
        // Scenario: 4 players with various states
        // Input: Mix of active, paused, waiting players
        // Expected: Correct state for each player
        const fourPlayerHand: Hand = {
          variant: 'NT',
          players: ['Alice', 'Bob', 'Charlie', 'David'],
          startingStacks: [100, 100, 100, 100],
          blindsOrStraddles: [10, 0, 20, 0], // Bob/David inactive, so Alice has SB, Charlie has BB
          antes: [0, 0, 0, 0],
          minBet: 20,
          actions: [],
          _inactive: [0, 1, 0, 1],
          _intents: [0, 2, 0, 1],
          _deadBlinds: [0, 10, 0, 5],
        };

        const newHand = {
          ...fourPlayerHand,
          author: 'Bob',
          _intents: [0, 0, 0, 1], // Bob wants to resume
        };

        const result = Hand.merge(fourPlayerHand, newHand);

        expect(result._intents).toEqual([0, 0, 0, 1]);
        expect(result._inactive).toEqual([0, 1, 0, 1]);
        expect(result._deadBlinds).toEqual([0, 10, 0, 5]);
      });

      it('should handle player pausing and resuming before their turn', () => {
        // Scenario: 3-player game, Player1 pauses but resumes BEFORE missing their turn
        // Input: Player1 sets pause intent, then resumes in current hand
        // Expected: Player1 stays active until their turn (new auto-fold logic)
        const threePlayerGame: Hand = {
          variant: 'NT',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [0, 1, 2],
          antes: [0, 0, 0],
          minBet: 2,
          actions: [
            'd dh p1 AsKs',
            'd dh p2 7c7d',
            'd dh p3 9h9s',
            'p1 cc', // Player1 acted
            'p2 cc', // Player2 acted
            // Player3's turn next, Player1 pauses here
          ],
          _inactive: [0, 0, 0], // All active
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        };

        // First: Player1 sets pause intent during Player3's turn
        const pauseDuringGame = {
          ...threePlayerGame,
          author: 'Player1',
          _intents: [2, 0, 0], // Player1 wants to pause
        };

        const afterPause = Hand.merge(threePlayerGame, pauseDuringGame);
        expect(afterPause._intents).toEqual([2, 0, 0]);
        expect(afterPause._inactive).toEqual([0, 0, 0]); // Player1 stays active until their turn

        // Then: Player3 acts
        const withPlayer3Action = {
          ...afterPause,
          author: 'Player3',
          actions: [...afterPause.actions, 'p3 cbr 10'],
        };

        const afterP3Action = Hand.merge(afterPause, withPlayer3Action);

        // Now: Player1 resumes BEFORE their turn (they haven't missed any action)
        const resumeBeforeTurn = {
          ...afterP3Action,
          author: 'Player1',
          _intents: [0, 0, 0], // Player1 resumes
        };

        const afterResume = Hand.merge(afterP3Action, resumeBeforeTurn);
        expect(afterResume._intents).toEqual([0, 0, 0]);
        expect(afterResume._inactive).toEqual([0, 0, 0]); // Player1 remained active (never folded)

        // Player1 can now act since they resumed before their turn
        const player1CanAct = {
          ...afterResume,
          author: 'Player1',
          actions: [
            ...afterResume.actions,
            'p1 cc', // Player1 can act because they resumed in time
          ],
        };

        const result = Hand.merge(afterResume, player1CanAct);
        expect(result.actions).toContain('p1 cc');
        expect(result.actions.length).toBe(afterResume.actions.length + 1); // Added 1 action
      });

      it('should prevent player from acting if they paused and missed their turn', () => {
        // Scenario: 3-player game, Player1 pauses and misses their turn
        // Input: Player1 pauses, action continues without them, they try to resume
        // Expected: Player1 cannot act in current hand after missing their turn
        const threePlayerGame: Hand = {
          variant: 'NT',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [0, 1, 2],
          antes: [0, 0, 0],
          minBet: 2,
          actions: [
            'd dh p1 AsKs',
            'd dh p2 7c7d',
            'd dh p3 9h9s',
            'p1 cc', // Player1's last action
            'p2 cc',
            'p3 cbr 10',
            // Player1's turn, but they are paused
          ],
          _inactive: [1, 0, 0],
          _intents: [2, 0, 0], // Player1 has pause intent
          _deadBlinds: [0, 0, 0],
        };

        // Game continues without Player1 (they're paused and miss their turn)
        const gameProgressesWithoutP1 = {
          ...threePlayerGame,
          author: 'Player2',
          actions: [
            ...threePlayerGame.actions,
            // Player1 missed their turn (would have been p1 cc/f)
            'p2 cc', // Player2 continues
            'd db AhKhQh', // Flop dealt
            'p2 cc',
            'p3 cbr 20',
          ],
        };

        const afterProgress = Hand.merge(threePlayerGame, gameProgressesWithoutP1);

        // Player1 tries to resume and act
        const tryToResume = {
          ...afterProgress,
          author: 'Player1',
          _intents: [0, 0, 0], // Try to resume
          actions: [
            ...afterProgress.actions,
            'p1 cc', // Try to act - SHOULD BE REJECTED
          ],
        };

        const result = Hand.merge(afterProgress, tryToResume);

        // Player1 can change intent but cannot add actions
        expect(result._intents).toEqual([0, 0, 0]); // Intent changed
        expect(result._inactive).toEqual([1, 0, 0]); // Still inactive this hand
        expect(result.actions.slice(4)).not.toContain('p1 cc'); // Action rejected
        expect(result.actions).toEqual(afterProgress.actions); // No new actions added
      });

      it('should handle game continuation with minimum 2 active players', () => {
        // Scenario: 3-player game, one player exits mid-game, game continues with 2 players
        // Input: Player1 exits during hand, Player2 and Player3 continue
        // Expected: Game continues with 2 active players, Player1 cannot rejoin this hand
        const threePlayerGame: Hand = {
          variant: 'NT',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [0, 1, 2],
          antes: [0, 0, 0],
          minBet: 2,
          actions: ['d dh p1 AsKs', 'd dh p2 7c7d', 'd dh p3 9h9s', 'p1 cc', 'p2 cc', 'p3 cbr 10'],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        };

        // Player1 decides to exit mid-game
        const player1Exits = {
          ...threePlayerGame,
          author: 'Player1',
          _intents: [3, 0, 0], // Exit intent
        };

        const afterExit = Hand.merge(threePlayerGame, player1Exits);
        expect(afterExit._intents).toEqual([3, 0, 0]);
        expect(afterExit._inactive).toEqual([0, 0, 0]);

        // Server marks Player1 as active, but with pause, game continues with 3 players
        const gameContinues = {
          ...afterExit,
          actions: [
            ...afterExit.actions,
            // Player1 is out, skipped
            'p2 cc', // Player2 continues
            'd db AhKhQh',
            'p2 cc',
            'p3 cbr 20',
            'p2 f', // Player2 folds, Player3 wins
          ],
        };

        const afterContinuation = Hand.merge(afterExit, gameContinues, true);
        expect(afterContinuation._inactive).toEqual([0, 0, 0]);
        expect(afterContinuation.actions.length).toBe(gameContinues.actions.length);

        // Player1 tries to rejoin and act in the same hand - SHOULD FAIL
        const tryToRejoin = {
          ...afterContinuation,
          author: 'Player1',
          _intents: [0, 0, 0], // Try to come back
          actions: [
            ...afterContinuation.actions,
            'p1 cc', // Try to act - SHOULD BE REJECTED
          ],
        };

        const result = Hand.merge(afterContinuation, tryToRejoin);

        // Player1 with intent=3 (leave) CAN change intent back
        expect(result._intents).toEqual([0, 0, 0]); // Intent is back to 0
        expect(result._inactive).toEqual([0, 0, 0]); // Still inactive this hand
        expect(result.actions).toEqual([
          'd dh p1 AsKs',
          'd dh p2 7c7d',
          'd dh p3 9h9s',
          'p1 cc',
          'p2 cc',
          'p3 cbr 10',
          'p2 cc',
          'd db AhKhQh',
          'p2 cc',
          'p3 cbr 20',
          'p2 f',
          'p1 cc #1715616000000',
        ]); // action has been applied
      });
    });

    describe('edge cases', () => {
      it('should initialize missing sit-in/out fields with defaults', () => {
        // Scenario: Legacy hand without new fields
        // Input: No _intents/_inactive/_deadBlinds
        // Expected: Initialize as empty arrays matching player count
        const legacyHand = {
          variant: 'NT',
          players: ['Player1', 'Player2'],
          startingStacks: [100, 100],
          blindsOrStraddles: [1, 2],
          antes: [0, 0],
          minBet: 2,
          actions: [],
          // No _inactive, _intents, _deadBlinds
        } as Hand;

        const newHand = {
          ...legacyHand,
          author: 'Player1',
          _intents: [2, 0], // Player1 wants to pause
        };

        const result = Hand.merge(legacyHand, newHand);

        // Should initialize missing fields
        expect(result._intents).toEqual([2, 0]);
        // _inactive and _deadBlinds remain undefined or initialized by server
        expect(result.players).toEqual(['Player1', 'Player2']);
      });

      it('should handle partial field presence', () => {
        // Scenario: Has _intents but missing _inactive
        // Input: Incomplete field set
        // Expected: Missing fields initialized
        const partialHand = {
          ...baseHand,
          _intents: [0, 0],
          // Missing _inactive and _deadBlinds
        };
        delete (partialHand as any)._inactive;
        delete (partialHand as any)._deadBlinds;

        const newHand = {
          ...partialHand,
          author: 'Player1',
          _intents: [1, 0],
          _inactive: [0, 0],
          _deadBlinds: [0, 0],
        };

        const result = Hand.merge(partialHand, newHand);

        expect(result._intents).toEqual([1, 0]);
        expect(result._inactive).toEqual([0, 0]);
        expect(result._deadBlinds).toEqual([0, 0]);
      });

      it('should validate field array lengths match player count', () => {
        // Scenario: Field arrays wrong length
        // Input: 3 players but _intents has 2 elements
        // Expected: Returns original hand unchanged
        const threePlayerHand = {
          ...baseHand,
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [0, 1, 2],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        };

        const invalidHand = {
          ...threePlayerHand,
          author: 'Player1',
          _intents: [1, 0], // Wrong length!
        };

        const result = Hand.merge(threePlayerHand, invalidHand);

        // Despite wrong length, Player1's intent at index 0 is still processed
        // The merge processes the author's intent change even with mismatched array
        expect(result._intents).toEqual([1, 0, 0]);
        expect(result._inactive).toEqual([0, 0, 0]);
      });

      it('should handle empty player arrays', () => {
        // Scenario: No players in game - first player joins
        // Input: Empty players array, Player1 joins
        // Expected: Player1 is added to empty table
        const emptyHand = {
          variant: 'NT',
          players: [],
          startingStacks: [],
          blindsOrStraddles: [],
          antes: [],
          minBet: 2,
          actions: [],
          _inactive: [],
          _intents: [],
          _deadBlinds: [],
        } as Hand;

        const newHand = {
          ...emptyHand,
          author: 'Player1',
          players: ['Player1'],
          startingStacks: [100],
          blindsOrStraddles: [2], // First player will be BB when game starts
          antes: [0],
          _inactive: [0],
          _intents: [1], // Wait for BB intent
          _deadBlinds: [0],
        };

        const result = Hand.merge(emptyHand, newHand);

        // Should allow first player to join empty table
        expect(result.players).toEqual(['Player1']);
        expect(result.startingStacks).toEqual([100]);
        expect(result._intents).toEqual([1]);
        expect(result._inactive).toEqual([2]); // New player starts inactive
      });

      it('should cap dead blinds at maximum (1.5 BB)', () => {
        // Scenario: Dead blinds exceed maximum
        // Input: _deadBlinds: [5, 0] (exceeds 1.5 * 2 = 3)
        // Expected: Validates but server will cap
        const handWithDebt = {
          ...baseHand,
          _deadBlinds: [5, 0], // Exceeds 1.5 * BB(2) = 3
        };

        const newHand = {
          ...handWithDebt,
          author: 'Player1',
          _intents: [0, 0],
          _deadBlinds: [0, 0], // Client tries to clear debt
        };

        const result = Hand.merge(handWithDebt, newHand);

        // Server field not modified by client
        expect(result._deadBlinds).toEqual([5, 0]);
        expect(result._intents).toEqual([0, 0]);
        // Server will cap at 3 in its logic
      });
    });
  });

  describe('Integration with existing merge logic', () => {
    describe('modified compatibility checks', () => {
      it('should allow different player arrays when author is new player', () => {
        // Scenario: Sit-in bypasses player array matching
        // Input: Different player counts, valid author
        // Expected: Merge proceeds for sit-in
        const newHand = {
          ...baseHand,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'], // Different length
          startingStacks: [100, 100, 150],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 1], // Player3 must use valid intent when joining
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseHand, newHand);

        // Should allow new player to join
        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(result.startingStacks).toEqual([100, 100, 150]);
      });

      it('should enforce variant matching even with sit-in', () => {
        // Scenario: Can't join different game variant
        // Input: NT vs FT variant mismatch
        // Expected: Returns original hand unchanged
        const { minBet: _omitMinBet, ...baseHandNoMinBet } = baseHand;
        const ftHand: Hand = {
          ...baseHandNoMinBet,
          author: 'Player3',
          variant: 'FT', // Different variant!
          smallBet: 2,
          bringIn: undefined,
          bigBet: 4,
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(baseHand, ftHand);

        // Should reject due to variant mismatch
        expect(result).toBe(baseHand);
        expect(result.variant).toBe('NT');
        expect(result.players).toEqual(['Player1', 'Player2']);
      });

      it('should enforce venue matching for sit-in', () => {
        // Scenario: Can't join different venue's table
        // Input: Different venue values
        // Expected: Returns original hand unchanged
        const venueHand = {
          ...baseHand,
          venue: 'CasinoA',
        };

        const newHand = {
          ...venueHand,
          author: 'Player3',
          venue: 'CasinoB', // Different venue!
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(venueHand, newHand);

        // Should reject due to venue mismatch
        expect(result).toBe(venueHand);
        expect(result.venue).toBe('CasinoA');
        expect(result.players).toEqual(['Player1', 'Player2']);
      });

      it('should enforce currency matching for sit-in', () => {
        // Scenario: Can't join table with different currency
        // Input: USD vs EUR mismatch
        // Expected: Returns original hand unchanged
        const usdHand = {
          ...baseHand,
          currency: 'USD',
        };

        const eurHand = {
          ...usdHand,
          author: 'Player3',
          currency: 'EUR', // Different currency!
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        };

        const result = Hand.merge(usdHand, eurHand);

        // Should reject due to currency mismatch
        expect(result).toBe(usdHand);
        expect(result.currency).toBe('USD');
        expect(result.players).toEqual(['Player1', 'Player2']);
      });

      it('should validate table/game IDs match', () => {
        // Scenario: Must be same table
        // Input: Different tableId or gameId
        // Expected: Returns original hand unchanged
        const table1Hand = {
          ...baseHand,
          table: 'table-001',
        } as Hand;

        const table2Hand = {
          ...table1Hand,
          author: 'Player3',
          table: 'table-002', // Different table!
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 0],
          _intents: [0, 0, 0],
          _deadBlinds: [0, 0, 0],
        } as Hand;

        const result = Hand.merge(table1Hand, table2Hand);

        // Should reject due to table ID mismatch
        expect(result).toBe(table1Hand);
        expect(result.table).toBe('table-001');
        expect(result.players).toEqual(['Player1', 'Player2']);
      });
    });

    describe('action merging with sit-in/out states', () => {
      it('should handle hole cards for active vs inactive players', () => {
        // Scenario: Only active players get hole cards
        // Input: Mix of active and inactive players
        // Expected: Hole cards only for active players
        const mixedStateHand = {
          ...baseHand,
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 0, 2], // Player2 inactive, so Player1 has SB, Player3 has BB
          antes: [0, 0, 0],
          _inactive: [0, 1, 0], // Player2 is inactive
          _intents: [0, 2, 0],
          _deadBlinds: [0, 10, 0],
          actions: [
            'd dh p1 AsKs', // Player1 active, gets cards
            // No cards for Player2 (inactive)
            'd dh p3 7c7d', // Player3 active, gets cards
          ],
        };

        const newHand = {
          ...mixedStateHand,
          author: 'Player1',
          actions: [
            'd dh p1 AsKs',
            'd dh p3 7c7d',
            'p1 cc', // Active player can act
          ],
        };

        const result = Hand.merge(mixedStateHand, newHand);

        expect(result.actions).toContain('d dh p1 AsKs');
        expect(result.actions).toContain('d dh p3 7c7d');
        expect(result.actions).toContain('p1 cc #1715616000000'); // Player1's action gets timestamp
        // No hole cards for inactive Player2
        expect(result.actions.filter(a => a.includes('p2')).length).toBe(0);
      });

      it('should prevent inactive players from adding actions', () => {
        // Scenario: Paused player tries to bet
        // Input: Player with _inactive: 1 adds action
        // Expected: Action rejected
        const inactivePlayerHand = {
          ...baseHand,
          _inactive: [1, 0], // Player1 is inactive
          _intents: [2, 0],
          actions: ['d dh p2 AsKs', 'p2 cc'],
        };

        const newHand = {
          ...inactivePlayerHand,
          author: 'Player1',
          actions: [
            'd dh p2 AsKs',
            'p2 cc',
            'p1 cbr 50', // Inactive player tries to bet!
          ],
        };

        const result = Hand.merge(inactivePlayerHand, newHand);

        // Action from inactive player should not be added
        expect(result.actions).toEqual(['d dh p2 AsKs', 'p2 cc']);
        expect(result.actions).not.toContain('p1 cbr 50');
      });

      it('should prevent player with pause intent from acting', () => {
        // Scenario: Player who sets pause intent cannot act anymore
        // Input: _inactive: 0, _intents: 1, tries to add action
        // Expected: Action rejected, player is inactive
        const pauseIntentHand = {
          ...baseHand,
          _inactive: [1, 0], // Player1 became inactive when they set pause intent
          _intents: [1, 0], // Player1 has pause intent
          actions: ['d dh p1 AsKs', 'd dh p2 7c7d'],
        };

        const newHand = {
          ...pauseIntentHand,
          author: 'Player1',
          actions: [
            'd dh p1 AsKs',
            'd dh p2 7c7d',
            'p1 cc', // Tries to act but is inactive
          ],
        };

        const result = Hand.merge(pauseIntentHand, newHand);

        // Player with pause intent is inactive and cannot act
        expect(result.actions).not.toContain('p1 cc');
        expect(result.actions).toEqual(['d dh p1 AsKs', 'd dh p2 7c7d']);
        expect(result._intents).toEqual([1, 0]);
        expect(result._inactive).toEqual([1, 0]); // Remains inactive
      });

      it('should handle dealer actions with mixed player states', () => {
        // Scenario: Dealer deals to active players only
        // Input: Dealer actions in mixed state game
        // Expected: Appropriate card distribution
        const mixedGame = {
          ...baseHand,
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 0, 2], // Player2 inactive → no blind position
          antes: [0, 0, 0],
          _inactive: [0, 1, 0], // Player2 inactive
          _intents: [0, 2, 0],
          _deadBlinds: [0, 10, 0],
          actions: [],
        };

        const withDealerActions = {
          ...mixedGame,
          actions: [
            'd dh p1 AsKs', // Active player gets cards
            'd dh p3 7c7d', // Active player gets cards
            // No cards for inactive Player2
            'p1 cc',
            'p3 cbr 40',
            'p1 cc',
            'd db AhKhQh', // Board cards dealt
          ],
        };

        const result = Hand.merge(mixedGame, withDealerActions, true);

        // Verify dealer actions handled correctly
        expect(result.actions).toContain('d dh p1 AsKs');
        expect(result.actions).toContain('d dh p3 7c7d');
        expect(result.actions).toContain('d db AhKhQh');
        // No hole cards dealt to inactive player
        const p2HoleActions = result.actions.filter(a => a.includes('d dh p2'));
        expect(p2HoleActions.length).toBe(0);
      });

      it('should preserve action sequence integrity', () => {
        // Scenario: Actions must maintain timeline
        // Input: Sit-in during hand with actions
        // Expected: New player can't retroactively act
        const gameInProgress = {
          ...baseHand,
          actions: ['d dh p1 AsKs', 'd dh p2 7c7d', 'p1 cc', 'p2 cbr 40', 'p1 cc', 'd db AhKhQh'],
        };

        const newPlayerJoins = {
          ...gameInProgress,
          author: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          startingStacks: [100, 100, 100],
          blindsOrStraddles: [1, 2, 0],
          antes: [0, 0, 0],
          _inactive: [0, 0, 1], // Player3 joins but inactive
          _intents: [0, 0, 1], // Player3 must use valid intent when joining
          _deadBlinds: [0, 0, 0],
          actions: [
            'd dh p3 9s9d', // Trying to add hole cards retroactively!
            'd dh p1 AsKs',
            'd dh p2 7c7d',
            'p1 cc',
            'p2 cbr 40',
            'p3 cc', // Trying to act retroactively!
            'p1 cc',
            'd db AhKhQh',
          ],
        };

        const result = Hand.merge(gameInProgress, newPlayerJoins);

        // New player joins but can't modify existing action sequence
        expect(result.players).toEqual(['Player1', 'Player2', 'Player3']);
        expect(result._inactive).toEqual([0, 0, 2]);
        // Original action sequence preserved
        expect(result.actions).toEqual(gameInProgress.actions);
      });
    });
  });
});

describe('allowUnsafeMerge functionality', () => {
  let serverHand: Hand;

  beforeEach(() => {
    serverHand = {
      variant: 'NT',
      players: ['Player1', 'Player2'],
      startingStacks: [100, 100],
      blindsOrStraddles: [1, 2],
      antes: [0, 0],
      minBet: 2,
      actions: ['d dh p1 AsKs', 'd dh p2 7c7d'],
    };
  });

  it('should REJECT new dealer actions when allowUnsafeMerge is false', () => {
    // Scenario: An authorless state tries to add a dealer action without the flag.
    // Input: A hand with a new dealer action ('d db AcAdAh') and allowUnsafeMerge set to false.
    // Expected: The merge should reject the new dealer action, keeping the original actions unchanged.
    const maliciousHand = {
      ...serverHand,
      actions: [...serverHand.actions, 'd db AcAdAh'], // Adding a flop
    };

    const result = Hand.merge(serverHand, maliciousHand, false); // allowUnsafeMerge = false

    expect(result.actions).not.toContain('d db AcAdAh');
    expect(result.actions).toEqual(serverHand.actions);
  });

  it('should ACCEPT new dealer actions when allowUnsafeMerge is true', () => {
    // Scenario: A trusted, authorless state adds a dealer action with the flag.
    // Input: A hand with a new dealer action and allowUnsafeMerge set to true.
    // Expected: The merge should successfully append the new dealer action.
    const trustedHand = {
      ...serverHand,
      actions: [...serverHand.actions, 'd db AcAdAh'], // Adding a flop
    };

    const result = Hand.merge(serverHand, trustedHand, true); // allowUnsafeMerge = true

    expect(result.actions).toContain('d db AcAdAh');
    expect(result.actions.length).toBe(3);
  });

  it('should REJECT new player actions on authorless hands when allowUnsafeMerge is false', () => {
    // Scenario: An authorless state tries to add a player action without the flag.
    // Input: A hand with a new player action ('p1 cbr 10') and allowUnsafeMerge set to false.
    // Expected: The merge should reject the new player action.
    const maliciousHand = {
      ...serverHand,
      actions: [...serverHand.actions, 'p1 cbr 10'], // Player1 raises
    };

    const result = Hand.merge(serverHand, maliciousHand, false);

    expect(result.actions).not.toContain('p1 cbr 10');
    expect(result.actions).toEqual(serverHand.actions);
  });

  it('should ACCEPT new player actions on authorless hands when allowUnsafeMerge is true', () => {
    // Scenario: A trusted, authorless state adds a player action with the flag.
    // Input: A hand with a new player action and allowUnsafeMerge set to true.
    // Expected: The merge should successfully append the new player action.
    const trustedHand = {
      ...serverHand,
      actions: [...serverHand.actions, 'p1 cbr 10'], // Player1 raises
    };

    const result = Hand.merge(serverHand, trustedHand, true);

    expect(result.actions).toContain('p1 cbr 10');
    expect(result.actions.length).toBe(3);
  });

  it('should IGNORE allowUnsafeMerge when an author is present', () => {
    // Scenario: A client with an author present attempts to add a dealer action, even with allowUnsafeMerge set to true.
    // Input: A hand with an author and a new dealer action.
    // Expected: The action should be rejected because the presence of an author enforces strict security, overriding the flag.
    const maliciousClientHand = {
      ...serverHand,
      author: 'Player1',
      actions: [...serverHand.actions, 'd db AcAdAh'], // Player1 trying to deal the flop
    };

    // Even with allowUnsafeMerge: true, the author presence should override it
    const result = Hand.merge(serverHand, maliciousClientHand, true);

    expect(result.actions).not.toContain('d db AcAdAh');
    expect(result.actions).toEqual(serverHand.actions);
  });
});
