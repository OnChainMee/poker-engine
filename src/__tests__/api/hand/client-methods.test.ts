import { beforeEach, describe, expect, it } from 'vitest';
import { Hand } from '../../../Hand';
import type { NoLimitHand } from '../../../types';

describe('Hand.joinHand - Player joining table', () => {
  let baseHand: NoLimitHand;
  let emptyTableHand: NoLimitHand;
  let midGameHand: NoLimitHand;

  beforeEach(() => {
    // Setup base hand for testing
    baseHand = {
      variant: 'NT',
      players: ['Alice', 'Bob'],
      startingStacks: [100, 100],
      blindsOrStraddles: [1, 2],
      antes: [0, 0],
      minBet: 2,
      seatCount: 6,
      actions: [],
    };

    emptyTableHand = {
      variant: 'NT',
      players: [],
      startingStacks: [],
      blindsOrStraddles: [],
      antes: [],
      minBet: 2,
      seatCount: 6,
      actions: [],
    };

    midGameHand = {
      ...baseHand,
      actions: ['d dh p1 AsKs', 'd dh p2 7c7d', 'p1 cc', 'p2 cbr 10'],
    };
  });

  describe('when player joins', () => {
    it('should add new player to all player-related arrays', () => {
      // Scenario: Charlie joins a 2-player table
      // Input: baseHand with Alice and Bob, Charlie wants to join with 150 chips
      // Expected: All arrays expanded to include Charlie, _intents: [0, 0, 0]
      const player = {
        playerName: 'Charlie',
        buyIn: 150,
      };

      const result = Hand.join(baseHand, player);

      expect(result.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(result.startingStacks).toEqual([100, 100, 150]);
      expect(result.blindsOrStraddles).toEqual([1, 2, 0]);
      expect(result.antes).toEqual([0, 0, 0]);
      expect(result._intents).toEqual([0, 0, 0]);
      expect(result._inactive).toEqual([0, 0, 2]);
      // Client sets _inactive for local operations, but server retains control via merge()
    });

    it('should preserve existing player data', () => {
      // Scenario: New player joins without affecting existing players
      // Input: Table with Alice (100) and Bob (100), Charlie joins with 150
      // Expected: Alice and Bob data unchanged, Charlie added correctly
      const player = {
        playerName: 'Charlie',
        buyIn: 150,
      };

      const result = Hand.join(baseHand, player);

      // Original players unchanged
      expect(result.players[0]).toBe('Alice');
      expect(result.players[1]).toBe('Bob');
      expect(result.startingStacks[0]).toBe(100);
      expect(result.startingStacks[1]).toBe(100);
      // New player added
      expect(result.players[2]).toBe('Charlie');
      expect(result.startingStacks[2]).toBe(150);
    });

    it('should set new player as inactive (state 2) in _inactive field', () => {
      // Scenario: Client adds new player, sets _inactive locally
      // Input: joinHand with player data, existing _inactive: [0, 0]
      // Expected: _inactive expanded with new player marked as inactive (2)
      const handWithInactive = {
        ...baseHand,
        _inactive: [0, 0],
      };

      const player = {
        playerName: 'Charlie',
        buyIn: 100,
      };

      const result = Hand.join(handWithInactive, player);

      // _inactive expanded with new player marked as inactive (state 2)
      expect(result._inactive).toEqual([0, 0, 2]);
      // _intents is set to 0 for new player (ready to play)
      expect(result._intents).toEqual([0, 0, 0]);
    });

    it('should expand _deadBlinds to match _inactive length', () => {
      // Scenario: Client adds new player, _deadBlinds must match _inactive length
      // Input: joinHand with player data
      // Expected: _deadBlinds expanded with 0 for new player (validation requirement)
      const handWithDeadBlinds = {
        ...baseHand,
        _deadBlinds: [5, 10],
      };

      const player = {
        playerName: 'Charlie',
        buyIn: 100,
      };

      const result = Hand.join(handWithDeadBlinds, player);

      // _deadBlinds expanded to match _inactive array length
      expect(result._deadBlinds).toEqual([5, 10, 0]);
      expect(result._intents).toEqual([0, 0, 0]);
    });

    it('should maintain immutability of original hand', () => {
      // Scenario: Ensure input hand is not mutated
      // Input: baseHand passed to joinHand
      // Expected: baseHand remains unchanged, new hand returned
      const originalPlayers = [...baseHand.players];
      const originalStacks = [...baseHand.startingStacks];

      const player = {
        playerName: 'Charlie',
        buyIn: 150,
      };

      const result = Hand.join(baseHand, player);

      // Original hand unchanged
      expect(baseHand.players).toEqual(originalPlayers);
      expect(baseHand.startingStacks).toEqual(originalStacks);
      // New hand has changes
      expect(result.players.length).toBe(3);
      expect(result).not.toBe(baseHand);
    });
  });

  describe('when configuring player data', () => {
    it('should accept custom buy-in amount', () => {
      // Scenario: Player specifies desired buy-in
      // Input: player object with buyIn: 250
      // Expected: startingStacks includes 250 for new player
      const player = {
        playerName: 'Charlie',
        buyIn: 250,
      };

      const result = Hand.join(baseHand, player);

      expect(result.startingStacks).toEqual([100, 100, 250]);
      expect(result.players).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should accept seat selection preference', () => {
      // Scenario: Player wants specific seat
      // Input: player object with seat: 4 on 6-max table
      // Expected: seats array includes seat 4 for new player
      const handWithSeats = {
        ...baseHand,
        seats: [1, 2],
      };

      const player = {
        playerName: 'Charlie',
        buyIn: 100,
        seat: 4,
      };

      const result = Hand.join(handWithSeats, player);

      expect(result.seats).toEqual([1, 2, 4]);
      expect(result.players).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should accept venue ID for new player', () => {
      // Scenario: Player has venue-specific ID
      // Input: player object with venueId: 'user123'
      // Expected: _venueIds array includes 'user123'
      // Note: venueId is managed by server, not provided in JoinHand
      const handWithVenueIds = {
        ...baseHand,
        _venueIds: ['alice-id', 'bob-id'],
      };

      const player = {
        playerName: 'Charlie',
        buyIn: 100,
      };

      const result = Hand.join(handWithVenueIds, player);

      // Client can't set venue ID, server will handle it
      expect(result._venueIds).toEqual(['alice-id', 'bob-id']);
      expect(result.players).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should use player name as provided', () => {
      // Scenario: Player joins with specific username
      // Input: player object with name: 'Charlie'
      // Expected: players array includes 'Charlie'
      const player = {
        playerName: 'CharliePoker123',
        buyIn: 100,
      };

      const result = Hand.join(baseHand, player);

      expect(result.players).toEqual(['Alice', 'Bob', 'CharliePoker123']);
      expect(result.players[2]).toBe('CharliePoker123');
    });
  });

  describe('when arrays need initialization', () => {
    it('should create _intents array if missing', () => {
      // Scenario: Legacy hand without _intents field
      // Input: baseHand without _intents, new player joining
      // Expected: _intents created as [0, 0, 0]
      const legacyHand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob'],
        startingStacks: [100, 100],
        blindsOrStraddles: [1, 2],
        antes: [0, 0],
        minBet: 2,
        seatCount: 6,
        actions: [],
        // No _intents field
      };

      const player = {
        playerName: 'Charlie',
        buyIn: 100,
      };

      const result = Hand.join(legacyHand, player);

      expect(result._intents).toBeDefined();
      expect(result._intents).toEqual([0, 0, 0]);
    });

    it('should expand existing _intents array', () => {
      // Scenario: Hand with existing _intents
      // Input: baseHand with _intents: [0, 2], new player joining
      // Expected: _intents becomes [0, 2, 0]
      const handWithIntents = {
        ...baseHand,
        _intents: [0, 2], // Bob is paused
      };

      const player = {
        playerName: 'Charlie',
        buyIn: 100,
      };

      const result = Hand.join(handWithIntents, player);

      expect(result._intents).toEqual([0, 2, 0]);
      expect(result.players).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should handle missing antes array', () => {
      // Scenario: Hand without antes defined
      // Input: baseHand without antes field
      // Expected: antes created with zeros for all players
      const handWithoutAntes: Hand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob'],
        startingStacks: [100, 100],
        blindsOrStraddles: [1, 2],
        // No antes
        minBet: 2,
        seatCount: 6,
        actions: [],
      } as unknown as Hand; // podhak

      const player = {
        playerName: 'Charlie',
        buyIn: 100,
      };

      const result = Hand.join(handWithoutAntes, player);

      expect(result.antes).toBeDefined();
      expect(result.antes).toEqual([0, 0, 0]);
    });

    it('should handle missing seats array', () => {
      // Scenario: Hand without seat assignments
      // Input: baseHand without seats field
      // Expected: Either seats remain undefined or created if player specifies seat
      const player = {
        playerName: 'Charlie',
        buyIn: 100,
        seat: 5,
      };

      const result = Hand.join(baseHand, player);

      // If player specifies seat, create seats array
      expect(result.seats).toBeDefined();
      expect(result.seats).toContain(5);
    });

    it('should handle missing _venueIds array', () => {
      // Scenario: Hand without venue IDs
      // Input: baseHand without _venueIds
      // Expected: _venueIds created only if player provides venueId
      const player = {
        playerName: 'Charlie',
        buyIn: 100,
      };

      const result = Hand.join(baseHand, player);

      // _venueIds handled by server, not created by client
      expect(result._venueIds).toBeUndefined();
    });
  });

  describe('when validation fails', () => {
    it('should reject if player name is missing', () => {
      // Scenario: Invalid player object without name
      // Input: player object with no name field
      // Expected: hand returned unchanged
      const player = {
        playerName: '', // Empty name
        buyIn: 100,
      };

      const result = Hand.join(baseHand, player);

      // Should return unchanged hand
      expect(result).toBe(baseHand);
      expect(result.players).toEqual(['Alice', 'Bob']);
    });

    it('should reject negative buy-in amount', () => {
      // Scenario: Invalid buy-in amount
      // Input: player object with buyIn: -50
      // Expected: hand returned unchanged
      const player = {
        playerName: 'Charlie',
        buyIn: -50,
      };

      const result = Hand.join(baseHand, player);

      // Should return unchanged hand
      expect(result).toBe(baseHand);
      expect(result.players).toEqual(['Alice', 'Bob']);
    });

    it('should reject duplicate player names', () => {
      // Scenario: Player name already exists
      // Input: Try to add 'Alice' when Alice already playing
      // Expected: hand returned unchanged
      const player = {
        playerName: 'Alice', // Already exists
        buyIn: 100,
      };

      const result = Hand.join(baseHand, player);

      // Should return unchanged hand
      expect(result).toBe(baseHand);
      expect(result.players).toEqual(['Alice', 'Bob']);
      expect(result.players.length).toBe(2);
    });

    it('should reject seat outside table limits', () => {
      // Scenario: Invalid seat selection
      // Input: seat: 7 on 6-max table
      // Expected: hand returned unchanged
      const player = {
        playerName: 'Charlie',
        buyIn: 100,
        seat: 7, // Out of bounds for 6-max
      };

      const result = Hand.join(baseHand, player);

      // Should return unchanged hand
      expect(result).toBe(baseHand);
      expect(result.players).toEqual(['Alice', 'Bob']);
      expect(result.seats).toBeUndefined();
    });

    it('should reject duplicate seat selection', () => {
      // Scenario: Seat already occupied
      // Input: seats: [1, 3], new player wants seat 3
      // Expected: hand returned unchanged
      const handWithSeats = {
        ...baseHand,
        seats: [1, 3],
      };

      const player = {
        playerName: 'Charlie',
        buyIn: 100,
        seat: 3, // Already occupied by Bob
      };

      const result = Hand.join(handWithSeats, player);

      // Should return unchanged hand
      expect(result).toBe(handWithSeats);
      expect(result.players).toEqual(['Alice', 'Bob']);
      expect(result.seats).toEqual([1, 3]);
    });

    it('should reject if table is full', () => {
      // Scenario: Table at maximum capacity
      // Input: 6 players on 6-max table, 7th trying to join
      // Expected: hand returned unchanged
      const fullTableHand = {
        ...baseHand,
        players: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
        startingStacks: [100, 100, 100, 100, 100, 100],
        blindsOrStraddles: [0, 0, 0, 0, 10, 20],
        antes: [0, 0, 0, 0, 0, 0],
        seatCount: 6,
      };

      const player = {
        playerName: 'P7',
        buyIn: 100,
      };

      const result = Hand.join(fullTableHand, player);

      // Should return unchanged hand
      expect(result).toBe(fullTableHand);
      expect(result.players.length).toBe(6);
      expect(result.players).not.toContain('P7');
    });
  });

  describe('in edge cases', () => {
    it('should handle joining empty table as first player', () => {
      // Scenario: First player joining empty table
      // Input: emptyTableHand, first player joins
      // Expected: All arrays initialized with single player
      const player = {
        playerName: 'FirstPlayer',
        buyIn: 100,
      };

      const result = Hand.join(emptyTableHand, player);

      expect(result.players).toEqual(['FirstPlayer']);
      expect(result.startingStacks).toEqual([100]);
      expect(result.blindsOrStraddles).toEqual([0]); // Blinds assigned by advance()
      expect(result.antes).toEqual([0]);
      expect(result._intents).toEqual([0]);
      expect(result).not.toBe(emptyTableHand);
    });

    it('should handle fractional buy-in amounts', () => {
      // Scenario: Player buys in with decimal amount
      // Input: player with buyIn: 99.50
      // Expected: startingStacks includes 99.50
      const player = {
        playerName: 'Charlie',
        buyIn: 99.5,
      };

      const result = Hand.join(baseHand, player);

      expect(result.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(result.startingStacks).toEqual([100, 100, 99.5]);
      expect(result.startingStacks[2]).toBe(99.5);
    });

    it('should handle very long player names', () => {
      // Scenario: Player with unusually long name
      // Input: player with 50+ character name
      // Expected: Name accepted as-is
      const longName = 'PlayerWithAnExtremelyLongNameThatExceedsFiftyCharactersForTesting';
      const player = {
        playerName: longName,
        buyIn: 100,
      };

      const result = Hand.join(baseHand, player);

      expect(result.players).toEqual(['Alice', 'Bob', longName]);
      expect(result.players[2]).toBe(longName);
      expect(result.players[2].length).toBeGreaterThan(50);
    });

    it('should handle joining during active hand', () => {
      // Scenario: Player joins while hand in progress
      // Input: midGameHand with actions, new player joins
      // Expected: Player added with _intents: 0 (ready to play), won't participate until next hand
      const player = {
        playerName: 'Charlie',
        buyIn: 100,
      };

      const result = Hand.join(midGameHand, player);

      expect(result.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(result.startingStacks).toEqual([100, 100, 100]);
      expect(result._intents).toEqual([0, 0, 0]);
      // Actions remain unchanged - Charlie doesn't participate
      expect(result.actions).toEqual(midGameHand.actions);
    });
  });
});

describe('Hand.quitHand - Player leaving table', () => {
  let activeHand: NoLimitHand;
  let pausedHand: NoLimitHand;

  beforeEach(() => {
    activeHand = {
      variant: 'NT',
      players: ['Alice', 'Bob', 'Charlie'],
      startingStacks: [100, 100, 100],
      blindsOrStraddles: [0, 1, 2],
      antes: [0, 0, 0],
      minBet: 2,
      author: 'Bob',
      actions: [],
      _intents: [0, 0, 0],
      _inactive: [0, 0, 0],
      _deadBlinds: [0, 0, 0],
    };

    pausedHand = {
      ...activeHand,
      _intents: [0, 2, 0], // Bob is paused
      _inactive: [0, 1, 0],
    };
  });

  describe('when player quits', () => {
    it('should set author player _intents to 3', () => {
      // Scenario: Active player decides to leave
      // Input: activeHand with author: 'Bob', _intents: [0, 0, 0]
      // Expected: _intents: [0, 3, 0], Bob marked for removal
      const result = Hand.quit(activeHand);

      expect(result._intents).toEqual([0, 3, 0]);
      expect(result.author).toBe('Bob');
    });

    it('should NOT modify _inactive field', () => {
      // Scenario: Quit intent without touching server fields
      // Input: Any hand state with _inactive values
      // Expected: _inactive remains completely unchanged
      const result = Hand.quit(activeHand);

      expect(result._inactive).toEqual([0, 0, 0]);
      expect(result._intents).toEqual([0, 3, 0]);
    });

    it('should NOT modify _deadBlinds field', () => {
      // Scenario: Player with dead blinds quits
      // Input: _deadBlinds: [0, 10, 0], Bob quits
      // Expected: _deadBlinds remains [0, 10, 0]
      const handWithDebt = {
        ...activeHand,
        _deadBlinds: [0, 10, 0],
      };

      const result = Hand.quit(handWithDebt);

      expect(result._deadBlinds).toEqual([0, 10, 0]);
      expect(result._intents).toEqual([0, 3, 0]);
    });

    it('should NOT modify other players _intents', () => {
      // Scenario: One player quits, others unaffected
      // Input: _intents: [0, 0, 2], Bob (index 1) quits
      // Expected: _intents: [0, 3, 2], only Bob's intent changed
      const handWithIntents = {
        ...activeHand,
        _intents: [0, 0, 2],
      };

      const result = Hand.quit(handWithIntents);

      expect(result._intents).toEqual([0, 3, 2]);
    });

    it('should preserve immutability', () => {
      // Scenario: Original hand not mutated
      // Input: activeHand passed to quitHand
      // Expected: activeHand unchanged, new hand returned
      const originalIntents = [...(activeHand._intents as number[])];

      const result = Hand.quit(activeHand);

      expect(activeHand._intents).toEqual(originalIntents);
      expect(result).not.toBe(activeHand);
      expect(result._intents).toEqual([0, 3, 0]);
    });
  });

  describe('when validating author', () => {
    it('should find author by name in players array', () => {
      // Scenario: Author field matches player name
      // Input: author: 'Charlie', players include 'Charlie'
      // Expected: Charlie's _intents set to 3
      const handWithCharlie = {
        ...activeHand,
        author: 'Charlie',
      };

      const result = Hand.quit(handWithCharlie);

      expect(result._intents).toEqual([0, 0, 3]);
      expect(result.author).toBe('Charlie');
    });

    it('should return unchanged if author not found', () => {
      // Scenario: Invalid author name
      // Input: author: 'David', not in players array
      // Expected: Hand returned unchanged
      const handWithInvalidAuthor = {
        ...activeHand,
        author: 'David', // Not in players array
      };

      const result = Hand.quit(handWithInvalidAuthor);

      expect(result).toBe(handWithInvalidAuthor);
      expect(result._intents).toEqual([0, 0, 0]);
    });

    it('should return unchanged if no author field', () => {
      // Scenario: Missing author field
      // Input: Hand without author property
      // Expected: Hand returned unchanged
      const handWithoutAuthor = {
        ...activeHand,
      };
      delete (handWithoutAuthor as any).author;

      const result = Hand.quit(handWithoutAuthor);

      expect(result).toBe(handWithoutAuthor);
      expect(result._intents).toEqual([0, 0, 0]);
    });

    it('should handle author as player index', () => {
      // Scenario: Author specified as index (if supported)
      // Input: author: 1 (Bob's index)
      // Expected: _intents[1] set to 3
      const handWithIndexAuthor = {
        ...activeHand,
        author: 1 as any, // Bob's index
      };

      const result = Hand.quit(handWithIndexAuthor);

      // If index is supported, Bob's intent should be set to 3
      // Otherwise, hand returned unchanged
      if (result !== handWithIndexAuthor) {
        expect(result._intents).toEqual([0, 3, 0]);
      } else {
        expect(result).toBe(handWithIndexAuthor);
      }
    });
  });

  describe('when transitioning states', () => {
    it('should transition from active (0) to leaving (3)', () => {
      // Scenario: Active player quits
      // Input: _intents: [0, 0, 0], Bob quits
      // Expected: _intents: [0, 3, 0]
      const result = Hand.quit(activeHand);

      expect(result._intents).toEqual([0, 3, 0]);
      expect(result.author).toBe('Bob');
    });

    it('should transition from paused (2) to leaving (3)', () => {
      // Scenario: Paused player decides to leave
      // Input: _intents: [0, 2, 0], Bob quits
      // Expected: _intents: [0, 3, 0]
      const result = Hand.quit(pausedHand);

      expect(result._intents).toEqual([0, 3, 0]);
      expect(result.author).toBe('Bob');
    });

    it('should transition from wait-BB (1) to leaving (3)', () => {
      // Scenario: Player waiting for BB decides to leave
      // Input: _intents: [0, 1, 0], Bob quits
      // Expected: _intents: [0, 3, 0]
      const waitingHand = {
        ...activeHand,
        _intents: [0, 1, 0], // Bob waiting for BB
      };

      const result = Hand.quit(waitingHand);

      expect(result._intents).toEqual([0, 3, 0]);
    });

    it('should handle already leaving state (3 to 3)', () => {
      // Scenario: Player already marked for leaving
      // Input: _intents: [0, 3, 0], Bob quits again
      // Expected: _intents: [0, 3, 0], no change
      const leavingHand = {
        ...activeHand,
        _intents: [0, 3, 0], // Bob already leaving
      };

      const result = Hand.quit(leavingHand);

      expect(result._intents).toEqual([0, 3, 0]);
    });
  });

  describe('in edge cases', () => {
    it('should handle missing _intents array', () => {
      // Scenario: Legacy hand without _intents
      // Input: Hand without _intents field
      // Expected: _intents created as [0, 3, 0] for Bob
      const legacyHand = {
        ...activeHand,
      };
      delete (legacyHand as any)._intents;

      const result = Hand.quit(legacyHand);

      expect(result._intents).toBeDefined();
      expect(result._intents).toEqual([0, 3, 0]); // Bob's intent set to 3
    });

    it('should handle single player leaving', () => {
      // Scenario: Last player at table quits
      // Input: One player table, player quits
      // Expected: _intents: [3]
      const singlePlayerHand = {
        variant: 'NT' as const,
        players: ['Alice'],
        startingStacks: [100],
        blindsOrStraddles: [0],
        antes: [0],
        minBet: 2,
        author: 'Alice',
        actions: [],
        _intents: [0],
      };

      const result = Hand.quit(singlePlayerHand);

      expect(result._intents).toEqual([3]);
      expect(result.players).toEqual(['Alice']);
    });

    it('should preserve all non-intent fields', () => {
      // Scenario: Complex hand state preserved
      // Input: Hand with actions, stacks, etc.
      // Expected: Only _intents modified, everything else unchanged
      const complexHand = {
        ...activeHand,
        actions: ['d dh p1 AsKs', 'd dh p2 7c7d', 'p1 cc'],
        minBet: 20,
        seatCount: 9,
        _inactive: [0, 1, 0],
        _deadBlinds: [0, 10, 0],
      };

      const result = Hand.quit(complexHand);

      expect(result._intents).toEqual([0, 3, 0]);
      // All other fields preserved
      expect(result.actions).toEqual(complexHand.actions);
      expect(result.minBet).toBe(20);
      expect(result.seatCount).toBe(9);
      expect(result._inactive).toEqual([0, 1, 0]);
      expect(result._deadBlinds).toEqual([0, 10, 0]);
    });
  });
});

describe('Hand.pauseHand - Player taking break', () => {
  let activeHand: NoLimitHand;

  beforeEach(() => {
    activeHand = {
      variant: 'NT',
      players: ['Alice', 'Bob', 'Charlie'],
      startingStacks: [100, 100, 100],
      blindsOrStraddles: [0, 1, 2],
      antes: [0, 0, 0],
      minBet: 2,
      author: 'Alice',
      actions: [],
      _intents: [0, 0, 0],
    };
  });

  describe('when player pauses', () => {
    it('should set author player _intents to 2', () => {
      // Scenario: Player takes immediate break
      // Input: activeHand with author: 'Alice', _intents: [0, 0, 0]
      // Expected: _intents: [2, 0, 0], Alice marked for pause
      const result = Hand.pause(activeHand);

      expect(result._intents).toEqual([2, 0, 0]);
      expect(result.author).toBe('Alice');
    });

    it('should NOT modify _inactive field', () => {
      // Scenario: Express pause intent without server control
      // Input: Any _inactive state
      // Expected: _inactive unchanged (server will handle)
      const handWithInactive = {
        ...activeHand,
        _inactive: [0, 0, 0],
      };

      const result = Hand.pause(handWithInactive);

      expect(result._inactive).toEqual([0, 0, 0]);
      expect(result._intents).toEqual([2, 0, 0]);
    });

    it('should NOT modify _deadBlinds field', () => {
      // Scenario: Pause without affecting dead blinds
      // Input: Any _deadBlinds state
      // Expected: _deadBlinds unchanged (server calculates)
      const handWithDebt = {
        ...activeHand,
        _deadBlinds: [0, 0, 0],
      };

      const result = Hand.pause(handWithDebt);

      expect(result._deadBlinds).toEqual([0, 0, 0]);
      expect(result._intents).toEqual([2, 0, 0]);
    });

    it('should NOT modify other players _intents', () => {
      // Scenario: One player pauses, others continue
      // Input: _intents: [0, 1, 0], Alice pauses
      // Expected: _intents: [2, 1, 0], only Alice changed
      const handWithIntents = {
        ...activeHand,
        _intents: [0, 1, 0],
      };

      const result = Hand.pause(handWithIntents);

      expect(result._intents).toEqual([2, 1, 0]);
    });
  });

  describe('when transitioning states', () => {
    it('should transition from active (0) to pause (2)', () => {
      // Scenario: Active player takes break
      // Input: _intents: [0, 0, 0], Alice pauses
      // Expected: _intents: [2, 0, 0]
      const result = Hand.pause(activeHand);

      expect(result._intents).toEqual([2, 0, 0]);
      expect(result.author).toBe('Alice');
    });

    it('should transition from wait-BB (1) to pause (2)', () => {
      // Scenario: Player stops waiting for BB, takes immediate break
      // Input: _intents: [1, 0, 0], Alice pauses
      // Expected: _intents: [2, 0, 0]
      const waitingHand = {
        ...activeHand,
        _intents: [1, 0, 0],
      };

      const result = Hand.pause(waitingHand);

      expect(result._intents).toEqual([2, 0, 0]);
      expect(result.author).toBe('Alice');
    });

    it('should handle already paused state (2 to 2)', () => {
      // Scenario: Already paused player
      // Input: _intents: [2, 0, 0], Alice pauses again
      // Expected: _intents: [2, 0, 0], no change
      const pausedHand = {
        ...activeHand,
        _intents: [2, 0, 0],
      };

      const result = Hand.pause(pausedHand);

      expect(result._intents).toEqual([2, 0, 0]);
      expect(result.author).toBe('Alice');
    });

    it('should allow transition from leaving (3) to pause', () => {
      // Scenario: Client can request pause even if marked for leaving (server will validate)
      // Input: _intents: [3, 0, 0], Alice tries to pause
      // Expected: _intents: [2, 0, 0] - client forms request, server decides
      const leavingHand = {
        ...activeHand,
        _intents: [3, 0, 0],
      };

      const result = Hand.pause(leavingHand);

      // Client method allows the transition
      expect(result).not.toBe(leavingHand);
      expect(result._intents).toEqual([2, 0, 0]);
    });
  });
});

describe('Hand.waitForBB - Player waiting for big blind', () => {
  let activeHand: NoLimitHand;

  beforeEach(() => {
    activeHand = {
      variant: 'NT',
      players: ['Alice', 'Bob', 'Charlie'],
      startingStacks: [100, 100, 100],
      blindsOrStraddles: [1, 2, 0], // Charlie (author) has no positional blind
      antes: [0, 0, 0],
      minBet: 2,
      author: 'Charlie',
      actions: [],
      _intents: [0, 0, 0],
    };
  });

  describe('when player waits for BB', () => {
    it('should set author player _intents to 1', () => {
      // Scenario: Player wants to wait for BB position
      // Input: activeHand with author: 'Charlie', _intents: [0, 0, 0]
      // Expected: _intents: [0, 0, 1], Charlie will wait
      const result = Hand.waitForBB(activeHand);

      expect(result._intents).toEqual([0, 0, 1]);
      expect(result.author).toBe('Charlie');
    });

    it('should NOT change _inactive during active game', () => {
      // SCENARIO: Active player calls waitForBB during game
      // INPUT: _inactive: [0, 0, 0], all players active, Charlie has no blind
      // EXPECTED: _inactive: [0, 0, 0] - Charlie stays active!
      //
      // _inactive can only be changed in next() between hands.
      // Client methods only modify _intents to signal intention.
      const handWithInactive = {
        ...activeHand,
        _inactive: [0, 0, 0],
      };

      const result = Hand.waitForBB(handWithInactive);

      expect(result._inactive).toEqual([0, 0, 0]); // NOT changed!
      expect(result._intents).toEqual([0, 0, 1]); // Intent is set
    });

    it('should NOT accumulate _deadBlinds', () => {
      // Scenario: Wait-for-BB avoids dead blind accumulation
      // Input: Any _deadBlinds state
      // Expected: _deadBlinds unchanged (server won't charge)
      const handWithDebt = {
        ...activeHand,
        _deadBlinds: [0, 0, 5],
      };

      const result = Hand.waitForBB(handWithDebt);

      expect(result._deadBlinds).toEqual([0, 0, 5]);
      expect(result._intents).toEqual([0, 0, 1]);
    });
  });

  describe('when transitioning states', () => {
    it('should transition from active (0) to wait-BB (1)', () => {
      // Scenario: Active player chooses to wait
      // Input: _intents: [0, 0, 0], Charlie waits
      // Expected: _intents: [0, 0, 1]
      const result = Hand.waitForBB(activeHand);

      expect(result._intents).toEqual([0, 0, 1]);
      expect(result.author).toBe('Charlie');
    });

    it('should transition from pause (2) to wait-BB (1)', () => {
      // Scenario: Paused player switches to wait mode
      // Input: _intents: [0, 0, 2], Charlie waits for BB
      // Expected: _intents: [0, 0, 1]
      const pausedHand = {
        ...activeHand,
        _intents: [0, 0, 2],
      };

      const result = Hand.waitForBB(pausedHand);

      expect(result._intents).toEqual([0, 0, 1]);
      expect(result.author).toBe('Charlie');
    });

    it('should handle already waiting state (1 to 1)', () => {
      // Scenario: Already waiting for BB
      // Input: _intents: [0, 0, 1], Charlie waits again
      // Expected: _intents: [0, 0, 1], no change
      const waitingHand = {
        ...activeHand,
        _intents: [0, 0, 1],
      };

      const result = Hand.waitForBB(waitingHand);

      expect(result._intents).toEqual([0, 0, 1]);
      expect(result.author).toBe('Charlie');
    });
  });
});

describe('Hand.resumeHand - Player returning to play', () => {
  let pausedHand: NoLimitHand;

  beforeEach(() => {
    pausedHand = {
      variant: 'NT',
      players: ['Alice', 'Bob', 'Charlie'],
      startingStacks: [100, 100, 100],
      blindsOrStraddles: [1, 0, 2], // Bob (inactive) has no positional blind
      antes: [0, 0, 0],
      minBet: 2,
      author: 'Bob',
      actions: [],
      _intents: [0, 2, 0], // Bob is paused
      _inactive: [0, 1, 0],
      _deadBlinds: [0, 3, 0], // Bob has dead blinds
    };
  });

  describe('when player resumes', () => {
    it('should set author player _intents to 0', () => {
      // Scenario: Paused player wants to return
      // Input: pausedHand with Bob paused (_intents: 2)
      // Expected: _intents: [0, 0, 0], Bob ready to play
      const result = Hand.resume(pausedHand);

      expect(result._intents).toEqual([0, 0, 0]);
      expect(result.author).toBe('Bob');
    });

    it('should keep _inactive as waiting when game in progress (2+ active players)', () => {
      // SCENARIO: Player resumes while game has 2+ active players
      // INPUT: _inactive: [0, 1, 0] - Alice and Charlie active, Bob waiting
      // EXPECTED: _inactive: [0, 1, 0] - Bob stays waiting, cannot jump into active game
      //
      // Bob must wait for advance()/next() to become active in next hand.
      // This prevents players from "jumping into" an active game mid-hand.
      const result = Hand.resume(pausedHand);

      expect(result._inactive).toEqual([0, 1, 0]); // Bob stays waiting
      expect(result._intents).toEqual([0, 0, 0]); // Intent is set to 0 (ready)
    });

    it('should NOT reset _deadBlinds - only next() handles debt', () => {
      // SCENARIO: Resume should preserve _deadBlinds
      // INPUT: _deadBlinds: [0, 3, 0], Bob owes 3
      // EXPECTED: _deadBlinds: [0, 3, 0] - debt preserved
      //
      // Dead blinds are server-controlled and charged in next().
      // Client methods should not modify _deadBlinds.
      const result = Hand.resume(pausedHand);

      expect(result._deadBlinds).toEqual([0, 3, 0]); // NOT reset!
      expect(result._intents).toEqual([0, 0, 0]);
    });

    it('should NOT change _inactive even when game not started (< 2 active players)', () => {
      // SCENARIO: Only one active player - game cannot start yet
      // INPUT: _inactive: [0, 1, 1] - Only Alice active, Bob and Charlie waiting
      // EXPECTED: _inactive: [0, 1, 1] - Bob stays waiting!
      //
      // _inactive changes are handled ONLY in next() between hands.
      // Client methods only signal intent via _intents.
      // advance() will handle player activation when needed.
      const singleActivePlayerHand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [100, 100, 100],
        blindsOrStraddles: [0, 0, 0], // No blinds assigned yet
        antes: [0, 0, 0],
        minBet: 2,
        author: 'Bob',
        actions: [],
        _intents: [0, 1, 1], // Bob and Charlie waiting
        _inactive: [0, 1, 1], // Only Alice active
        _deadBlinds: [0, 0, 0],
      };

      const result = Hand.resume(singleActivePlayerHand);

      expect(result._inactive).toEqual([0, 1, 1]); // NOT changed!
      expect(result._intents).toEqual([0, 0, 1]); // Only Bob's intent changed to 0
    });
  });

  describe('when transitioning states', () => {
    it('should transition from pause (2) to active (0)', () => {
      // Scenario: Paused player returns
      // Input: _intents: [0, 2, 0], Bob resumes
      // Expected: _intents: [0, 0, 0]
      const result = Hand.resume(pausedHand);

      expect(result._intents).toEqual([0, 0, 0]);
      expect(result.author).toBe('Bob');
    });

    it('should transition from wait-BB (1) to active (0)', () => {
      // Scenario: Player stops waiting, wants immediate return
      // Input: _intents: [0, 1, 0], Bob resumes
      // Expected: _intents: [0, 0, 0]
      const waitingHand = {
        ...pausedHand,
        _intents: [0, 1, 0],
      };

      const result = Hand.resume(waitingHand);

      expect(result._intents).toEqual([0, 0, 0]);
      expect(result.author).toBe('Bob');
    });

    it('should handle already active state (0 to 0)', () => {
      // Scenario: Already active player
      // Input: _intents: [0, 0, 0], Bob resumes
      // Expected: _intents: [0, 0, 0], no change
      const activeStateHand = {
        ...pausedHand,
        _intents: [0, 0, 0],
      };

      const result = Hand.resume(activeStateHand);

      expect(result._intents).toEqual([0, 0, 0]);
      expect(result.author).toBe('Bob');
    });

    it('should allow transition from leaving (3) to active', () => {
      // Scenario: Client can request resume even if marked for leaving (server will validate)
      // Input: _intents: [0, 3, 0], Bob tries to resume
      // Expected: _intents: [0, 0, 0] - client forms request, server decides
      const leavingHand = {
        ...pausedHand,
        _intents: [0, 3, 0],
      };

      const result = Hand.resume(leavingHand);

      // Client method allows the transition
      expect(result).not.toBe(leavingHand);
      expect(result._intents).toEqual([0, 0, 0]);
    });

    it('should NOT change _inactive for new player (_inactive: 2) - stays 2', () => {
      // SCENARIO: New player who hasn't played yet calls resume
      // INPUT: _inactive: [0, 0, 2], Charlie is new player
      // EXPECTED: _inactive: [0, 0, 2] - Charlie stays NEW, only _intents changes
      //
      // _inactive changes are handled ONLY in next() between hands.
      // Client methods only modify _intents to signal intention.
      const newPlayerHand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [100, 100, 100],
        blindsOrStraddles: [1, 2, 0],
        antes: [0, 0, 0],
        minBet: 2,
        actions: ['d dh p1 AsKs', 'd dh p2 7c7d'], // Game in progress, Charlie not dealt
        _inactive: [0, 0, 2], // Charlie is NEW player
        _intents: [0, 0, 0],
        _deadBlinds: [0, 0, 0],
        author: 'Charlie',
      };

      const result = Hand.resume(newPlayerHand);

      // New player stays NEW (2), only intent changes
      expect(result._inactive).toEqual([0, 0, 2]); // NOT changed!
      expect(result._intents).toEqual([0, 0, 0]);
    });

    it('should NOT change _inactive for new player even with < 2 active players', () => {
      // SCENARIO: New player calls resume when game hasn't started yet
      // INPUT: _inactive: [0, 2] - Only Alice active, Bob is new player
      // EXPECTED: _inactive: [0, 2] - Bob stays NEW, only _intents changes
      //
      // _inactive changes are handled ONLY in next() between hands.
      // Client methods only modify _intents to signal intention.
      const oneActiveOneNewHand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob'],
        startingStacks: [100, 100],
        blindsOrStraddles: [0, 0],
        antes: [0, 0],
        minBet: 2,
        author: 'Bob',
        actions: [],
        _intents: [0, 0],
        _inactive: [0, 2], // Alice active, Bob new
        _deadBlinds: [0, 0],
      };

      const result = Hand.resume(oneActiveOneNewHand);

      // New player stays NEW (2), only intent changes
      expect(result._inactive).toEqual([0, 2]); // NOT changed!
      expect(result._intents).toEqual([0, 0]);
    });

    it('should NOT change _inactive for waiting player even with zero active players', () => {
      // SCENARIO: All players are waiting, one wants to resume
      // INPUT: _inactive: [1, 1, 1] - All waiting
      // EXPECTED: _inactive: [1, 1, 1] - Alice stays WAITING, only _intents changes
      //
      // _inactive changes are handled ONLY in next() between hands.
      // advance() will handle player activation when enough intend to play.
      const allWaitingHand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [100, 100, 100],
        blindsOrStraddles: [0, 0, 0],
        antes: [0, 0, 0],
        minBet: 2,
        author: 'Alice',
        actions: [],
        _intents: [1, 1, 1],
        _inactive: [1, 1, 1], // All waiting
        _deadBlinds: [0, 0, 0],
      };

      const result = Hand.resume(allWaitingHand);

      // Alice stays WAITING (1), only intent changes
      expect(result._inactive).toEqual([1, 1, 1]); // NOT changed!
      expect(result._intents).toEqual([0, 1, 1]);
    });

    it('should NOT change _inactive for new player even when all others are waiting', () => {
      // SCENARIO: All players are waiting/new, new player calls resume
      // INPUT: _inactive: [1, 1, 2] - Alice and Bob waiting, Charlie new
      // EXPECTED: _inactive: [1, 1, 2] - Charlie stays NEW, only _intents changes
      //
      // _inactive changes are handled ONLY in next() between hands.
      // Client methods only modify _intents to signal intention.
      const allInactiveNewResumes = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [100, 100, 100],
        blindsOrStraddles: [0, 0, 0],
        antes: [0, 0, 0],
        minBet: 2,
        author: 'Charlie',
        actions: [],
        _intents: [1, 1, 0],
        _inactive: [1, 1, 2], // All inactive, Charlie is new
        _deadBlinds: [0, 0, 0],
      };

      const result = Hand.resume(allInactiveNewResumes);

      // New player stays NEW (2), only intent changes
      expect(result._inactive).toEqual([1, 1, 2]); // NOT changed!
      expect(result._intents).toEqual([1, 1, 0]);
    });

    it('should handle exactly 2 active players boundary correctly', () => {
      // SCENARIO: Exactly 2 active players (game in progress), waiting player resumes
      // INPUT: _inactive: [0, 1, 0] - Alice and Charlie active, Bob waiting
      // EXPECTED: _inactive: [0, 1, 0] - Bob stays WAITING
      //
      // This is the boundary condition: 2 players = game in progress
      const exactlyTwoActiveHand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [100, 100, 100],
        blindsOrStraddles: [1, 0, 2],
        antes: [0, 0, 0],
        minBet: 2,
        author: 'Bob',
        actions: ['d dh p1 AsKs', 'd dh p3 7c7d'], // Only 2 players dealt cards
        _intents: [0, 1, 0],
        _inactive: [0, 1, 0], // Exactly 2 active
        _deadBlinds: [0, 0, 0],
      };

      const result = Hand.resume(exactlyTwoActiveHand);

      // Bob stays waiting - game is in progress (2 >= 2)
      expect(result._inactive).toEqual([0, 1, 0]);
      expect(result._intents).toEqual([0, 0, 0]);
    });

    it('should NOT change _inactive for waiting player with exactly 1 active player', () => {
      // SCENARIO: Only 1 active player, waiting player resumes
      // INPUT: _inactive: [0, 1, 1] - Only Alice active
      // EXPECTED: _inactive: [0, 1, 1] - Bob stays WAITING, only _intents changes
      //
      // _inactive changes are handled ONLY in next() between hands.
      // Client methods only modify _intents to signal intention.
      const oneActiveHand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [100, 100, 100],
        blindsOrStraddles: [0, 0, 0],
        antes: [0, 0, 0],
        minBet: 2,
        author: 'Bob',
        actions: [],
        _intents: [0, 1, 1],
        _inactive: [0, 1, 1], // Only 1 active
        _deadBlinds: [0, 0, 0],
      };

      const result = Hand.resume(oneActiveHand);

      // Bob stays WAITING (1), only intent changes
      expect(result._inactive).toEqual([0, 1, 1]); // NOT changed!
      expect(result._intents).toEqual([0, 0, 1]);
    });

    it('should NOT change _inactive for new player with 3+ active players', () => {
      // SCENARIO: New player calls resume when 3 active players (game definitely in progress)
      // INPUT: _inactive: [0, 0, 0, 2] - Alice, Bob, Charlie active, Dan new
      // EXPECTED: _inactive: [0, 0, 0, 2] - Dan stays NEW, only _intents changes
      //
      // _inactive changes are handled ONLY in next() between hands.
      // Client methods only modify _intents to signal intention.
      const threeActiveOneNewHand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie', 'Dan'],
        startingStacks: [100, 100, 100, 100],
        blindsOrStraddles: [0, 1, 2, 0],
        antes: [0, 0, 0, 0],
        minBet: 2,
        author: 'Dan',
        actions: ['d dh p1 AsKs', 'd dh p2 7c7d', 'd dh p3 QcQd'],
        _intents: [0, 0, 0, 0],
        _inactive: [0, 0, 0, 2], // 3 active, Dan new
        _deadBlinds: [0, 0, 0, 0],
      };

      const result = Hand.resume(threeActiveOneNewHand);

      // Dan stays NEW (2), only intent changes
      expect(result._inactive).toEqual([0, 0, 0, 2]); // NOT changed!
      expect(result._intents).toEqual([0, 0, 0, 0]);
    });
  });

  describe('edge cases with missing arrays', () => {
    it('should NOT create _inactive array when missing - only modifies _intents', () => {
      // SCENARIO: Hand without _inactive array (legacy or initial state)
      // INPUT: No _inactive field
      // EXPECTED: No _inactive created, only _intents modified
      //
      // resume() only modifies _intents, not _inactive.
      const handWithoutInactive = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob'],
        startingStacks: [100, 100],
        blindsOrStraddles: [1, 2],
        antes: [0, 0],
        minBet: 2,
        author: 'Bob',
        actions: [],
        _intents: [0, 0],
        // No _inactive field
      };

      const result = Hand.resume(handWithoutInactive);

      // Should NOT create _inactive array, only modify _intents
      expect(result._inactive).toBeUndefined();
      expect(result._intents).toEqual([0, 0]);
    });

    it('should initialize _intents array when missing but NOT change _inactive', () => {
      // SCENARIO: Hand without _intents array, inactive player has no blinds
      // INPUT: No _intents field, _inactive: [0, 1], inactive Bob has NO blinds
      // EXPECTED: Creates _intents array, Bob's intent set to 0, _inactive unchanged
      //
      // resume() only creates/modifies _intents, not _inactive.
      // NOTE: Inactive player CANNOT have blindsOrStraddles > 0 (validation rule)
      const handWithoutIntents = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [100, 100, 100],
        blindsOrStraddles: [10, 0, 20], // Bob (inactive) has NO blinds
        antes: [0, 0, 0],
        minBet: 20,
        author: 'Bob',
        actions: [],
        _inactive: [0, 1, 0], // Bob waiting, has no blinds
        // No _intents field
      };

      const result = Hand.resume(handWithoutIntents);

      // Should create _intents array, Bob's intent set to 0
      // But _inactive stays [0, 1, 0] - NOT changed!
      expect(result._intents).toEqual([0, 0, 0]);
      expect(result._inactive).toEqual([0, 1, 0]); // NOT changed!
    });
  });
});

describe('Integration scenarios', () => {
  describe('when joining and pausing in sequence', () => {
    it('should handle player joining then immediately pausing', () => {
      // Scenario: New player joins but needs break
      // Input: Empty table -> joinHand('David') -> pauseHand()
      // Expected: David added with _intents: 1 (wait for BB), then _intents: 2 after pause
      const emptyTable = {
        variant: 'NT' as const,
        players: [],
        startingStacks: [],
        blindsOrStraddles: [],
        antes: [],
        minBet: 2,
        seatCount: 6,
        actions: [],
      };

      // First, David joins
      const player = {
        playerName: 'David',
        buyIn: 100,
      };
      const afterJoin = Hand.join(emptyTable, player);

      expect(afterJoin.players).toEqual(['David']);
      expect(afterJoin.startingStacks).toEqual([100]);
      expect(afterJoin._intents).toEqual([0]); // New player ready to play

      // Then David pauses
      const handWithAuthor = { ...afterJoin, author: 'David' };
      const afterPause = Hand.pause(handWithAuthor);

      expect(afterPause.players).toEqual(['David']);
      expect(afterPause._intents).toEqual([2]);
      expect(afterPause.author).toBe('David');
    });

    it('should handle player joining then waiting for BB', () => {
      // Scenario: New player joins ready to play, then chooses to wait for BB
      // Input: 2-player table -> joinHand('David')
      // Expected: David added with _intents: 0 (ready to play)
      const twoPlayerTable = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob'],
        startingStacks: [100, 100],
        blindsOrStraddles: [1, 2],
        antes: [0, 0],
        minBet: 2,
        seatCount: 6,
        actions: [],
      };

      // First, David joins
      const player = {
        playerName: 'David',
        buyIn: 100,
      };
      const afterJoin = Hand.join(twoPlayerTable, player);

      expect(afterJoin.players).toEqual(['Alice', 'Bob', 'David']);
      expect(afterJoin._intents).toEqual([0, 0, 0]); // David ready to play by default

      // David decides to wait for BB
      const handWithAuthor = { ...afterJoin, author: 'David' };
      const afterWait = Hand.waitForBB(handWithAuthor);

      expect(afterWait.players).toEqual(['Alice', 'Bob', 'David']);
      expect(afterWait._intents).toEqual([0, 0, 1]); // Now waiting
      expect(afterWait.author).toBe('David');
    });
  });

  describe('when pausing and resuming in cycle', () => {
    it('should handle pause followed by resume', () => {
      // Scenario: Player takes break and returns
      // Input: Active -> pauseHand() -> resumeHand()
      // Expected: _intents: 0 -> 2 -> 0
      const activeHand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob'],
        startingStacks: [100, 100],
        blindsOrStraddles: [1, 2],
        antes: [0, 0],
        minBet: 2,
        author: 'Alice',
        actions: [],
        _intents: [0, 0],
      };

      // First, Alice pauses
      const afterPause = Hand.pause(activeHand);
      expect(afterPause._intents).toEqual([2, 0]);

      // Then Alice resumes
      const afterResume = Hand.resume(afterPause);
      expect(afterResume._intents).toEqual([0, 0]);
      expect(afterResume.author).toBe('Alice');
    });

    it('should handle wait-BB followed by early resume', () => {
      // Scenario: Player stops waiting for BB
      // Input: Active -> waitForBB() -> resumeHand()
      // Expected: _intents: 0 -> 1 -> 0
      const activeHand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie'], // 3 players so Bob can have 0 blind
        startingStacks: [100, 100, 100],
        blindsOrStraddles: [1, 0, 2], // Bob (author) has no positional blind
        antes: [0, 0, 0],
        minBet: 2,
        author: 'Bob',
        actions: [],
        _intents: [0, 0, 0],
      };

      // First, Bob waits for BB
      const afterWait = Hand.waitForBB(activeHand);
      expect(afterWait._intents).toEqual([0, 1, 0]);

      // Then Bob decides to resume early
      const afterResume = Hand.resume(afterWait);
      expect(afterResume._intents).toEqual([0, 0, 0]);
      expect(afterResume.author).toBe('Bob');
    });

    it('should handle complex state transitions: pause -> waitForBB -> resume', () => {
      // SCENARIO: Player goes through multiple state changes before settling
      // INPUT: Active player → pauses → changes to waitForBB → cancels and resumes
      // EXPECTED: All transitions work correctly, final state is active with proper field values

      const serverGameState = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [10, 20, 0], // Charlie (position 2) is NOT on blind
        antes: [0, 0, 0],
        minBet: 20,
        _inactive: [0, 0, 0],
        _intents: [0, 0, 0],
        _deadBlinds: [0, 0, 0],
        actions: ['d dh p1 AsKs', 'd dh p2 7c7d', 'd dh p3 QcQd'],
        seed: 12345,
      };

      // Step 1: Charlie decides to pause
      const charliePaused = Hand.pause({ ...serverGameState, author: 'Charlie' });
      expect(charliePaused._intents).toEqual([0, 0, 2]); // Intent: pause
      expect(charliePaused._inactive).toEqual([0, 0, 0]); // Client doesn't modify _inactive on pause
      expect(charliePaused._deadBlinds).toEqual([0, 0, 0]); // Dead blinds unchanged

      // Step 2: SERVER merges pause request
      const serverAfterPause = Hand.merge(serverGameState, charliePaused, false);
      expect(serverAfterPause._intents).toEqual([0, 0, 2]); // Intent preserved
      expect(serverAfterPause._inactive).toEqual([0, 0, 0]); // Still active during current hand
      expect(serverAfterPause._deadBlinds).toEqual([0, 0, 0]); // No dead blinds yet

      // Step 3: Charlie changes mind, wants to waitForBB instead
      const charlieWaitBB = Hand.waitForBB({ ...serverAfterPause, author: 'Charlie' });
      expect(charlieWaitBB._intents).toEqual([0, 0, 1]); // Intent: wait for BB
      expect(charlieWaitBB._inactive).toEqual([0, 0, 0]); // Client does NOT modify _inactive
      expect(charlieWaitBB._deadBlinds).toEqual([0, 0, 0]); // Dead blinds unchanged

      // Step 4: SERVER merges waitForBB request
      const serverAfterWaitBB = Hand.merge(serverAfterPause, charlieWaitBB, false);
      expect(serverAfterWaitBB._intents).toEqual([0, 0, 1]); // Intent changed to waitForBB
      expect(serverAfterWaitBB._inactive).toEqual([0, 0, 0]); // Still active during current hand
      expect(serverAfterWaitBB._deadBlinds).toEqual([0, 0, 0]); // No dead blinds for waitForBB

      // Step 5: Charlie changes mind again, wants to resume immediately
      // SERVER state has Charlie at _inactive: 0 (active) because server ignores client _inactive
      // Since Charlie is already active, resume() keeps him active
      const charlieResume = Hand.resume({ ...serverAfterWaitBB, author: 'Charlie' });
      expect(charlieResume._intents).toEqual([0, 0, 0]); // Intent: active
      expect(charlieResume._inactive).toEqual([0, 0, 0]); // Charlie stays active (was already 0)
      expect(charlieResume._deadBlinds).toEqual([0, 0, 0]); // Client resets dead blinds for validation

      // Step 6: SERVER merges resume request
      // Server ignores client _inactive, keeps Charlie active based on server state
      const serverAfterResume = Hand.merge(serverAfterWaitBB, charlieResume, false);
      expect(serverAfterResume._intents).toEqual([0, 0, 0]); // Intent changed to active
      expect(serverAfterResume._inactive).toEqual([0, 0, 0]); // SERVER controls _inactive, Charlie stays active
      expect(serverAfterResume._deadBlinds).toEqual([0, 0, 0]); // SERVER controls dead blinds

      // Step 7: Verify all players remain active
      // Charlie's rapid state changes (pause -> waitForBB -> resume) during the hand
      // didn't affect anyone's _inactive status because changes happen between hands
      const advanced = Hand.advance(serverAfterResume);
      expect(advanced._inactive).toEqual([0, 0, 0]); // All still active
      expect(advanced._intents).toEqual([0, 0, 0]); // All want to play

      // Step 8: Key insight - rapid intent changes during active hand don't cause penalties
      // Server ignores client _inactive/_deadBlinds changes from resume()
      // Final state after all transitions:
      expect(serverAfterResume._intents).toEqual([0, 0, 0]); // Charlie ended up wanting to play
      expect(serverAfterResume._inactive).toEqual([0, 0, 0]); // No one became inactive
      expect(serverAfterResume._deadBlinds).toEqual([0, 0, 0]); // No penalties accumulated

      // This demonstrates the CLIENT-SERVER separation:
      // - Client methods only modify _intents, NEVER _inactive
      // - waitForBB() sets _intents: 1, resume() sets _intents: 0
      // - SERVER controls _inactive transitions (only in next())
      // - Charlie can continue playing without waiting
    });

    it('should handle joining via waitForBB then resume, paying dead blinds next hand', () => {
      // SCENARIO: Player joins active game via waitForBB, changes mind with resume
      // INPUT: New player joins with waitForBB → resume → next hand pays dead blinds
      // EXPECTED: Player waits current hand, resume allows early participation with dead blind payment

      // Step 1: SERVER - Active 2-player game
      const serverGameState = {
        variant: 'NT' as const,
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
      };

      // Step 2: CLIENT - Charlie gets personalized state
      const charliePersonalizedState = Hand.personalize(serverGameState, 'Charlie');

      // Step 3: CLIENT - Charlie joins via waitForBB (wants to wait for BB position)
      const charlieJoinWaitBB = Hand.join(charliePersonalizedState, {
        playerName: 'Charlie',
        buyIn: 1000,
      });
      // Charlie immediately sets waitForBB intent
      const charlieWaitBB = Hand.waitForBB(charlieJoinWaitBB);

      expect(charlieWaitBB.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(charlieWaitBB._intents).toEqual([0, 0, 1]); // Charlie wants to wait for BB
      // waitForBB() does NOT modify _inactive - it stays unchanged from join()
      expect(charlieWaitBB._inactive).toEqual(charlieJoinWaitBB._inactive);

      // Step 4: SERVER - Merge join + waitForBB request
      const serverAfterJoinWait = Hand.merge(serverGameState, charlieWaitBB, true);
      expect(serverAfterJoinWait.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(serverAfterJoinWait._intents).toEqual([0, 0, 1]); // Wait intent preserved
      expect(serverAfterJoinWait._inactive).toEqual([0, 0, 2]); // SERVER sets new player as inactive (state 2)
      expect(serverAfterJoinWait._deadBlinds).toEqual([0, 0, 0]);

      // Step 5: CLIENT - Charlie changes mind, wants to join immediately via resume
      const charlieResume = Hand.resume({ ...serverAfterJoinWait, author: 'Charlie' });
      expect(charlieResume._intents).toEqual([0, 0, 0]); // Charlie wants to play
      // Client methods do NOT modify _inactive - server controls this
      expect(charlieResume._inactive).toEqual([0, 0, 2]); // Unchanged from server state
      expect(charlieResume._deadBlinds).toEqual([0, 0, 0]); // Unchanged from server state

      // Step 6: SERVER - Merge resume request
      const serverAfterResume = Hand.merge(serverAfterJoinWait, charlieResume, false);
      expect(serverAfterResume._intents).toEqual([0, 0, 0]); // Resume intent preserved
      expect(serverAfterResume._inactive).toEqual([0, 0, 2]); // SERVER keeps Charlie inactive (new player)
      expect(serverAfterResume._deadBlinds).toEqual([0, 0, 0]); // No dead blinds yet

      // Step 7: SERVER - Advance current hand (Charlie still waits this hand)
      const advanced = Hand.advance(serverAfterResume);
      const holeCardDeals = advanced.actions.filter(action => action.startsWith('d dh'));
      expect(holeCardDeals).toHaveLength(2); // Only Alice and Bob get cards

      // Step 8: Complete current hand
      let completedHand = advanced;
      // Alice folds
      completedHand = Hand.applyAction({ ...completedHand, author: 'Alice' }, 'p1 f');
      completedHand = Hand.merge(advanced, completedHand, false);
      completedHand = Hand.advance(completedHand);
      expect(Hand.isComplete(completedHand)).toBe(true);

      // Step 9: SERVER - Next hand, Charlie should participate
      const nextHand = Hand.next(completedHand);

      // Charlie is now active with resume intent
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(nextHand._intents).toEqual([0, 0, 0]);
      expect(nextHand._inactive).toEqual([0, 0, 0]); // Charlie NOW active

      // IMPORTANT: Check dead blinds based on position
      // Charlie is NOT at BB position (BB rotated), so should pay dead blind
      // BB was at position 1 (Bob), now at position 2 (Charlie) after rotation
      // Actually, after rotation: button moved from Alice to Bob
      // Original: Alice(0)=SB, Bob(1)=BB, Charlie(2)=button
      // After next: Bob(0)=SB, Charlie(1)=BB, Alice(2)=button
      // So Charlie IS at BB position now, no dead blind needed
      expect(nextHand._deadBlinds).toEqual([0, 0, 0]); // Charlie at BB, no dead blind

      // Step 10: Advance next hand - all three players participate
      const nextHandAdvanced = Hand.advance(nextHand);
      const nextHoleCardDeals = nextHandAdvanced.actions.filter(action =>
        action.startsWith('d dh')
      );
      expect(nextHoleCardDeals).toHaveLength(3); // All three players get cards ✅

      // Key insight: resume() allowed Charlie to cancel waitForBB and join next hand
      // Server properly handled the transition from inactive new player to active player
    });
  });

  describe('waitForBB scenarios with dead blind mechanics', () => {
    it('should allow new player to join via waitForBB and return at BB without paying dead blinds', () => {
      // SCENARIO: New player joins and waits for BB position (Scenario 1)
      // INPUT: Active 3-player game, Dan joins with waitForBB, waits until he reaches BB position
      // EXPECTED: Dan inactive until BB, then becomes active without dead blind penalty

      // Step 1: SERVER - Active 3-player game in progress
      const serverGameState = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20], // Alice=button, Bob=SB, Charlie=BB
        antes: [0, 0, 0],
        minBet: 20,
        _inactive: [0, 0, 0],
        _intents: [0, 0, 0],
        _deadBlinds: [0, 0, 0],
        actions: ['d dh p1 AsKs', 'd dh p2 7c7d', 'd dh p3 QcQd'],
        seed: 12345,
      };

      // Step 2: CLIENT - Dan gets personalized state
      const danPersonalized = Hand.personalize(serverGameState, 'Dan');

      // Step 3: CLIENT - Dan joins and immediately sets waitForBB
      const danJoin = Hand.join(danPersonalized, {
        playerName: 'Dan',
        buyIn: 1000,
      });
      const danWaitBB = Hand.waitForBB(danJoin);

      expect(danWaitBB.players).toEqual(['Alice', 'Bob', 'Charlie', 'Dan']);
      expect(danWaitBB._intents).toEqual([0, 0, 0, 1]); // Dan wants to wait for BB
      // waitForBB() does NOT modify _inactive - it stays unchanged from join()
      expect(danWaitBB._inactive).toEqual(danJoin._inactive);

      // Step 4: SERVER - Merge join + waitForBB request
      const serverAfterJoin = Hand.merge(serverGameState, danWaitBB, true);
      expect(serverAfterJoin.players).toEqual(['Alice', 'Bob', 'Charlie', 'Dan']);
      expect(serverAfterJoin._intents).toEqual([0, 0, 0, 1]); // Intent preserved
      expect(serverAfterJoin._inactive).toEqual([0, 0, 0, 2]); // SERVER sets new player as inactive (state 2)
      expect(serverAfterJoin._deadBlinds).toEqual([0, 0, 0, 0]);

      // Step 5: SERVER - Advance and verify Dan doesn't get cards
      const advanced = Hand.advance(serverAfterJoin);
      const holeCardDeals = advanced.actions.filter(a => a.startsWith('d dh'));
      expect(holeCardDeals).toHaveLength(3); // Only Alice, Bob, Charlie

      // Step 6: SERVER - Create completed hand (simplified: use pre-completed state)
      const completedHand = {
        ...advanced,
        finishingStacks: [1010, 990, 1000, 1000],
        winnings: [10, 0, 0, 0],
      };

      // Step 6: Hand.next() → First hand after Dan joined
      // Blinds rotate: [0, 10, 20, 0] → [0, 0, 10, 20]
      // Dan at index 3 has blinds 20 (BB position)
      const nextHand1 = Hand.next(completedHand);

      // Verify blind rotation
      expect(nextHand1.blindsOrStraddles).toEqual([0, 0, 10, 20]);

      // Dan IS at BB position (20) - should activate without penalty
      expect(nextHand1._inactive).toEqual([0, 0, 0, 0]); // Dan ACTIVE
      expect(nextHand1._deadBlinds).toEqual([0, 0, 0, 0]); // NO debt
      expect(nextHand1._intents).toEqual([0, 0, 0, 0]); // Intent reset

      // Verify Dan gets cards
      const nextAdvanced = Hand.advance(nextHand1);
      const nextHoleDeals = nextAdvanced.actions.filter(a => a.startsWith('d dh'));
      expect(nextHoleDeals).toHaveLength(4); // All 4 players get cards

      // Key insight: waitForBB allows return at BB without penalty
    });

    it('should charge dead blinds when new player joins via waitForBB then resumes early', () => {
      // SCENARIO: New player joins with waitForBB, then calls resume (Scenario 2)
      // INPUT: Active game, Dan joins with waitForBB → resume before reaching BB
      // EXPECTED: Dan pays dead blind based on his position in next hand

      // Step 1: SERVER - Active 3-player game
      const serverGameState = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        blindsOrStraddles: [0, 10, 20],
        antes: [0, 0, 0],
        minBet: 20,
        _inactive: [0, 0, 0],
        _intents: [0, 0, 0],
        _deadBlinds: [0, 0, 0],
        actions: ['d dh p1 AsKs', 'd dh p2 7c7d', 'd dh p3 QcQd'],
        seed: 12345,
      };

      // Step 2: CLIENT - Dan joins with waitForBB
      const danPersonalized = Hand.personalize(serverGameState, 'Dan');
      const danJoin = Hand.join(danPersonalized, { playerName: 'Dan', buyIn: 1000 });
      const danWaitBB = Hand.waitForBB(danJoin);

      // Step 3: SERVER - Merge join + waitForBB
      const serverAfterJoin = Hand.merge(serverGameState, danWaitBB, true);
      expect(serverAfterJoin._inactive).toEqual([0, 0, 0, 2]); // New player
      expect(serverAfterJoin._intents).toEqual([0, 0, 0, 1]); // waitForBB

      // Step 4: CLIENT - Dan changes mind, calls resume
      const danResume = Hand.resume({ ...serverAfterJoin, author: 'Dan' });
      expect(danResume._intents).toEqual([0, 0, 0, 0]); // Wants to play now

      // Step 5: SERVER - Merge resume request
      const serverAfterResume = Hand.merge(serverAfterJoin, danResume, false);
      expect(serverAfterResume._intents).toEqual([0, 0, 0, 0]); // Resume intent
      expect(serverAfterResume._inactive).toEqual([0, 0, 0, 2]); // Still inactive (new player)

      // Step 6: SERVER - Advance and create completed hand
      const advanced = Hand.advance(serverAfterResume);
      const completedHand = {
        ...advanced,
        finishingStacks: [1010, 990, 1000, 1000],
        winnings: [10, 0, 0, 0],
      };

      // Step 7: Hand.next() → Dan should be activated with dead blind charge
      const nextHand = Hand.next(completedHand);

      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie', 'Dan']);
      expect(nextHand._inactive).toEqual([0, 0, 0, 0]); // Dan NOW active
      expect(nextHand._intents).toEqual([0, 0, 0, 0]);

      // Blinds rotated: [0, 10, 20, 0] → [0, 0, 10, 20]
      // Dan at index 3 with blinds 20 (BB position)
      expect(nextHand.blindsOrStraddles).toEqual([0, 0, 10, 20]);

      // Dan at BB - no debt (forgiven by mustReturnAtBB logic)
      expect(nextHand._deadBlinds).toEqual([0, 0, 0, 0]);
      // Starting stacks taken from finishingStacks (NOT rotated, players stay in same positions)
      expect(nextHand.startingStacks).toEqual([1010, 990, 1000, 1000]);

      // Verify Dan gets cards
      const nextAdvanced = Hand.advance(nextHand);
      const holeDeals = nextAdvanced.actions.filter(a => a.startsWith('d dh'));
      expect(holeDeals).toHaveLength(4); // All 4 players

      // Key insight: This scenario shows Dan returned at BB, so no penalty
      // To test dead blind charging, need different blind rotation where Dan NOT at BB
    });

    it('should handle active player calling waitForBB and returning at BB without penalty', () => {
      // SCENARIO: Active player calls waitForBB (Scenario 3)
      // INPUT: 4-player game, Dan (active) calls waitForBB
      // EXPECTED: Dan finishes current hand, then inactive until BB, returns without penalty

      // Step 1: SERVER - Active 4-player game at start (no cards dealt yet)
      const serverGameState = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie', 'Dan'],
        startingStacks: [1000, 1000, 1000, 1000],
        blindsOrStraddles: [10, 20, 0, 0], // Dan=button, Alice=SB, Bob=BB, Charlie+Dan=UTG
        antes: [0, 0, 0, 0],
        minBet: 20,
        _inactive: [0, 0, 0, 0],
        _intents: [0, 0, 0, 0],
        _deadBlinds: [0, 0, 0, 0],
        actions: [], // No cards dealt yet
        seed: 12345,
      };

      // Step 2: CLIENT - Dan calls waitForBB before cards are dealt
      const danWaitBB = Hand.waitForBB({ ...serverGameState, author: 'Dan' });
      expect(danWaitBB._intents).toEqual([0, 0, 0, 1]); // Dan wants waitForBB

      // Step 3: SERVER - Merge waitForBB request
      const serverAfterWaitBB = Hand.merge(serverGameState, danWaitBB, false);
      expect(serverAfterWaitBB._intents).toEqual([0, 0, 0, 1]); // Intent preserved
      expect(serverAfterWaitBB._inactive).toEqual([0, 0, 0, 0]); // Still active (server ignores client _inactive)

      // Step 4: SERVER - Advance current hand
      // Dan is still _inactive: 0, so he WILL get cards (doigryvat' current hand)
      const advanced = Hand.advance(serverAfterWaitBB);
      const holeDeals = advanced.actions.filter(a => a.startsWith('d dh'));
      expect(holeDeals).toHaveLength(4); // All 4 players including Dan

      // Step 5: SERVER - Create completed hand
      const completedHand = {
        ...advanced,
        finishingStacks: [1000, 1000, 1010, 990],
        winnings: [0, 0, 10, 0],
      };

      // Step 6: Hand.next() → Dan becomes inactive
      const nextHand1 = Hand.next(completedHand);

      expect(nextHand1.players).toEqual(['Alice', 'Bob', 'Charlie', 'Dan']);
      expect(nextHand1._inactive).toEqual([0, 0, 0, 1]); // Dan NOW inactive (transition happened)
      expect(nextHand1._intents).toEqual([0, 0, 0, 1]); // Intent preserved

      // Rotation: [10, 20, 0, 0] → [0, 10, 20, 0]
      // Button at Alice (idx 0), SB → Bob (idx 1), BB → Charlie (idx 2), Dan inactive
      expect(nextHand1.blindsOrStraddles).toEqual([0, 10, 20, 0]);

      // Dan at non-blind position after rotation - no debt accumulated yet
      expect(nextHand1._deadBlinds).toEqual([0, 0, 0, 0]);

      // Verify Dan doesn't get cards
      const nextAdvanced1 = Hand.advance(nextHand1);
      const holeDeals1 = nextAdvanced1.actions.filter(a => a.startsWith('d dh'));
      expect(holeDeals1).toHaveLength(3); // Only 3 active players

      // Key insight: Active player finishes current hand, then becomes inactive until BB
    });

    it('should not lose money between games', () => {
      const completedHand: Hand = {
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
      } as const;

      const nextHand = Hand.next(completedHand);
      expect(nextHand.startingStacks).toEqual([1110, 865, 980, 1060, 1000]);
    });

    it('should charge dead blinds when active player calls waitForBB then resumes early', () => {
      // SCENARIO: Active player waitForBB → resume (Scenario 4)
      // INPUT: Dan calls waitForBB, becomes inactive, then calls resume before reaching BB
      // EXPECTED: Dan pays accumulated dead blinds when returning

      // Step 1: SERVER - Completed hand where Dan just became inactive with waitForBB
      const completedHand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie', 'Dan'],
        startingStacks: [1000, 1000, 1000, 1000],
        finishingStacks: [1010, 1000, 1000, 990],
        blindsOrStraddles: [0, 0, 10, 20], // Alice=button, Bob=UTG, Charlie=SB, Dan=BB
        antes: [0, 0, 0, 0],
        minBet: 20,
        _inactive: [0, 0, 0, 0], // Dan was active in THIS hand
        _intents: [0, 0, 0, 1], // Dan set waitForBB during this hand
        _deadBlinds: [0, 0, 0, 0],
        actions: ['d dh p1 AsKs', 'd dh p2 7c7d', 'd dh p3 QcQd', 'd dh p4 AhAd', 'p1 f'],
        seed: 12345,
        winnings: [0, 0, 0, 10],
      };

      // Step 2: Hand.next() → Dan becomes inactive and starts accumulating debt
      const nextHand1 = Hand.next(completedHand);

      expect(nextHand1.players).toEqual(['Alice', 'Bob', 'Charlie', 'Dan']);
      expect(nextHand1._inactive).toEqual([0, 0, 0, 1]); // Dan NOW inactive
      expect(nextHand1._intents).toEqual([0, 0, 0, 1]); // waitForBB intent

      // Theoretical rotation: [0, 0, 10, 20] → [20, 0, 0, 10] (Dan at SB position)
      // With skip-inactive: Dan inactive, blinds shift to active players
      // Button at Charlie (idx 2), SB → Alice (idx 0), BB → Bob (idx 1)
      expect(nextHand1.blindsOrStraddles).toEqual([10, 20, 0, 0]);

      // Dan missed THEORETICAL SB position, accumulates 10 (dead blinds use theoretical positions)
      expect(nextHand1._deadBlinds).toEqual([0, 0, 0, 10]);

      // Step 3: During next hand, CLIENT - Dan calls resume
      const danResume = Hand.resume({ ...nextHand1, author: 'Dan' });
      expect(danResume._intents).toEqual([0, 0, 0, 0]); // Wants to play now

      // Step 4: SERVER - Merge resume request (mid-hand)
      const serverAfterResume = Hand.merge(nextHand1, danResume, false);
      expect(serverAfterResume._intents).toEqual([0, 0, 0, 0]); // Intent changed
      expect(serverAfterResume._inactive).toEqual([0, 0, 0, 1]); // SERVER keeps Dan inactive THIS hand
      expect(serverAfterResume._deadBlinds).toEqual([0, 0, 0, 10]); // SERVER preserves debt

      // Step 5: SERVER - Complete current hand (Dan still inactive)
      const advanced = Hand.advance(serverAfterResume);
      const holeDeals = advanced.actions.filter(a => a.startsWith('d dh'));
      expect(holeDeals).toHaveLength(3); // Dan doesn't get cards

      // Create completed hand
      const completedHandAfterResume = {
        ...advanced,
        finishingStacks: [1010, 990, 1000, 990],
        winnings: [10, 0, 0, 0],
      };

      // Step 6: Hand.next() → Dan returns with debt preserved for Game() to charge
      const nextHand2 = Hand.next(completedHandAfterResume);

      expect(nextHand2.players).toEqual(['Alice', 'Bob', 'Charlie', 'Dan']);
      expect(nextHand2._inactive).toEqual([0, 0, 0, 0]); // Dan NOW active
      expect(nextHand2._intents).toEqual([0, 0, 0, 0]);

      // Hand.advance preserves the original blind structure, so completedHandAfterResume
      // still has the original [0, 0, 10, 20] blinds from serverAfterResume's base structure
      // Rotation: [0, 0, 10, 20] → [0, 10, 20, 0]
      // Dan now active, so no skip-inactive applies
      expect(nextHand2.blindsOrStraddles).toEqual([0, 10, 20, 0]);

      // Dan returns at non-BB position - stack unchanged, debt preserved for Game() to charge
      expect(nextHand2._deadBlinds).toEqual([0, 0, 0, 10]); // Debt preserved for Game()
      expect(nextHand2.startingStacks[3]).toBe(990); // Stack unchanged, Game() charges debt

      // Verify Dan gets cards in next hand
      const nextAdvanced = Hand.advance(nextHand2);
      const nextHoleDeals = nextAdvanced.actions.filter(a => a.startsWith('d dh'));
      expect(nextHoleDeals).toHaveLength(4); // All 4 players

      // Key insight: waitForBB → resume = pay accumulated dead blinds (early return)
    });

    it('should allow player with existing dead blinds to return at BB without paying them', () => {
      // SCENARIO: Player has accumulated dead blinds, calls waitForBB, and next hand is their BB
      // INPUT: Bob (inactive, has debt) calls waitForBB. Next hand puts Bob in BB pos.
      // EXPECTED: Bob joins next hand active, with dead blinds reset to 0.

      // Step 1: SERVER - Active 3-player game (completed state for convenience)
      // Configuration: Alice=BB(20), Bob=Btn(0), Charlie=SB(10)
      // Next rotation: Button moves to Charlie. SB=Alice. BB=Bob.
      const serverGameState = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie'],
        startingStacks: [1000, 1000, 1000],
        finishingStacks: [1000, 1000, 1000],
        // Current blinds layout
        blindsOrStraddles: [20, 0, 10],
        antes: [0, 0, 0],
        minBet: 20,
        _inactive: [0, 1, 0], // Bob is inactive
        _intents: [0, 2, 0], // Bob was paused (2)
        _deadBlinds: [0, 30, 0], // Bob has accumulated debt
        actions: ['d dh p1 AsKs', 'd dh p3 QcQd', 'p1 cc', 'p3 cc'], // Bob skipped
        seed: 12345,
        winnings: [0, 0, 0],
      };

      // Step 2: CLIENT - Bob calls waitForBB
      const bobPersonalized = Hand.personalize(serverGameState, 'Bob');
      const bobWaitBB = Hand.waitForBB(bobPersonalized);

      expect(bobWaitBB._intents).toEqual([0, 1, 0]); // Wants to wait for BB

      // Step 3: SERVER - Merge request
      const serverAfterWaitBB = Hand.merge(serverGameState, bobWaitBB, false);
      expect(serverAfterWaitBB._intents).toEqual([0, 1, 0]);
      expect(serverAfterWaitBB._inactive).toEqual([0, 1, 0]); // Still inactive in current hand
      expect(serverAfterWaitBB._deadBlinds).toEqual([0, 30, 0]); // Debt remains

      // Step 4: Hand.next() -> Transition to next hand
      const nextHand = Hand.next(serverAfterWaitBB);

      // Rotation verification:
      // Old: Alice(BB), Bob(Btn), Charlie(SB)
      // New: Alice(SB), Bob(BB), Charlie(Btn)
      // blindsOrStraddles should be [10, 20, 0]
      expect(nextHand.blindsOrStraddles).toEqual([10, 20, 0]);

      // Bob is at BB position (index 1 has blind 20).
      // Logic should activate him and clear debt.
      expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(nextHand._inactive).toEqual([0, 0, 0]); // Bob Active
      expect(nextHand._intents).toEqual([0, 0, 0]); // Intent cleared
      expect(nextHand._deadBlinds).toEqual([0, 0, 0]); // Debt cleared!

      // Step 5: Verify Bob participates
      const nextAdvanced = Hand.advance(nextHand);
      const holeDeals = nextAdvanced.actions.filter(a => a.startsWith('d dh'));
      expect(holeDeals).toHaveLength(3); // All 3 players dealt
    });
  });

  describe('when multiple players perform operations', () => {
    it('should handle different players making changes', () => {
      // Scenario: Alice pauses, Bob quits, Charlie joins
      // Input: Sequential operations with different authors
      // Expected: Each player's intent correctly set
      let currentHand: Hand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob'],
        startingStacks: [100, 100],
        blindsOrStraddles: [1, 2],
        antes: [0, 0],
        minBet: 2,
        actions: [],
        _intents: [0, 0],
      };

      // Alice pauses
      const aliceHand: Hand = { ...currentHand, author: 'Alice' };
      currentHand = Hand.pause(aliceHand);
      expect(currentHand._intents).toEqual([2, 0]);

      // Bob quits
      const bobHand = { ...currentHand, author: 'Bob' };
      currentHand = Hand.quit(bobHand);
      expect(currentHand._intents).toEqual([2, 3]);

      // Charlie joins (waits for BB by default)
      const player = {
        playerName: 'Charlie',
        buyIn: 150,
      };
      currentHand = Hand.join(currentHand, player);
      expect(currentHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(currentHand._intents).toEqual([2, 3, 0]); // Charlie ready to play
    });

    it('should maintain isolation between players', () => {
      // Scenario: One player's action doesn't affect others
      // Input: Bob pauses (author: 'Bob')
      // Expected: Only Bob's _intents modified
      const multiPlayerHand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie', 'David'],
        startingStacks: [100, 100, 100, 100],
        blindsOrStraddles: [0, 0, 1, 2],
        antes: [0, 0, 0, 0],
        minBet: 2,
        author: 'Bob',
        actions: [],
        _intents: [0, 0, 0, 0],
      };

      const result = Hand.pause(multiPlayerHand);

      // Only Bob's intent should change
      expect(result._intents).toEqual([0, 2, 0, 0]);
      expect(result.players).toEqual(['Alice', 'Bob', 'Charlie', 'David']);
      expect(result.author).toBe('Bob');
    });
  });
});

describe('Immutability and protection contracts', () => {
  describe('when verifying immutability', () => {
    it('should never mutate input hand in any client method', () => {
      // Scenario: Verify all methods preserve input
      // Input: Original hand passed to each method
      // Expected: Original remains unchanged, new instance returned
      const originalHand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie'], // 3 players so Alice can have 0 blind
        startingStacks: [100, 100, 100],
        blindsOrStraddles: [0, 1, 2], // Alice (author) has no positional blind
        antes: [0, 0, 0],
        minBet: 2,
        author: 'Alice',
        actions: [],
        _intents: [0, 0, 0],
        _inactive: [0, 0, 0],
        _deadBlinds: [0, 0, 0],
      };

      // Deep copy for comparison
      const originalCopy = JSON.parse(JSON.stringify(originalHand));

      // Test pauseHand
      const pauseResult = Hand.pause(originalHand);
      expect(originalHand).toEqual(originalCopy);
      expect(pauseResult).not.toBe(originalHand);

      // Test quitHand
      const quitResult = Hand.quit(originalHand);
      expect(originalHand).toEqual(originalCopy);
      expect(quitResult).not.toBe(originalHand);

      // Test waitForBB
      const waitResult = Hand.waitForBB(originalHand);
      expect(originalHand).toEqual(originalCopy);
      expect(waitResult).not.toBe(originalHand);

      // Test resumeHand
      const resumeResult = Hand.resume(originalHand);
      expect(originalHand).toEqual(originalCopy);
      expect(resumeResult).not.toBe(originalHand);

      // Test joinHand
      const player = { playerName: 'David', buyIn: 100 };
      const joinResult = Hand.join(originalHand, player);
      expect(originalHand).toEqual(originalCopy);
      expect(joinResult).not.toBe(originalHand);
    });
  });

  describe('when protecting server fields', () => {
    it('should not allow client to modify _inactive values in joinHand', () => {
      // SCENARIO: Client cannot modify `_inactive` values through joinHand
      // INPUT: Client methods with various _inactive values
      // EXPECTED: joinHand preserves existing _inactive values unchanged
      const serverHand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie'], // 3 players so inactive Alice can have 0 blind
        startingStacks: [100, 100, 100],
        blindsOrStraddles: [0, 1, 2], // Alice (inactive) has no positional blind
        antes: [0, 0, 0],
        minBet: 2,
        author: 'Alice',
        actions: [],
        _intents: [0, 0, 0],
        _inactive: [1, 0, 0], // Server-controlled: Alice is inactive
        _deadBlinds: [0, 0, 0],
      };

      // Test pauseHand preserves existing _inactive values
      const pauseResult = Hand.pause(serverHand);
      expect(pauseResult._inactive).toEqual([1, 0, 0]); // Preserved from input
      expect(pauseResult._intents).toEqual([2, 0, 0]); // Intent changed

      // Test quitHand preserves existing _inactive values
      const quitResult = Hand.quit(serverHand);
      expect(quitResult._inactive).toEqual([1, 0, 0]); // Preserved from input
      expect(quitResult._intents).toEqual([3, 0, 0]); // Intent changed

      // Test waitForBB sets _inactive to waiting state
      const waitResult = Hand.waitForBB(serverHand);
      expect(waitResult._inactive).toEqual([1, 0, 0]); // Alice marked as waiting (unchanged in this case)
      expect(waitResult._intents).toEqual([1, 0, 0]); // Intent changed

      // Test resumeHand resets _inactive to active state (opposite of waitForBB)
      const resumeResult = Hand.resume(serverHand);
      expect(resumeResult._inactive).toEqual([1, 0, 0]); // Alice stays inactive (game in progress with 2+ active)
      expect(resumeResult._intents).toEqual([0, 0, 0]); // Intent changed

      // Test joinHand expands _inactive locally (for Hand.advance() to work)
      const player = { playerName: 'David', buyIn: 100 };
      const joinResult = Hand.join(serverHand, player);
      expect(joinResult._inactive).toEqual([1, 0, 0, 2]); // Expands with new player as inactive
      expect(joinResult._intents).toEqual([0, 0, 0, 0]); // New player ready to play

      // Verify that if client tries to change _inactive in a merge scenario, it would be ignored
      // This demonstrates the server's control over _inactive field
      const clientAttemptedChange = {
        ...serverHand,
        _inactive: [0, 1, 0], // Client tries to change who is inactive
      };

      // When client methods operate, they preserve the _inactive from input
      const clientResult = Hand.pause(clientAttemptedChange);
      expect(clientResult._inactive).toEqual([0, 1, 0]); // Preserved what client provided
      expect(clientResult._intents).toEqual([2, 0, 0]); // Intent changed correctly

      // The key point: during merge operations (not tested here but referenced),
      // the server would ignore client-provided _inactive changes
    });

    it('should never allow client to set _deadBlinds directly', () => {
      // Scenario: Dead blind calculation is server-only
      // Input: Any client method call
      // Expected: _deadBlinds never modified by client
      const handWithDeadBlinds = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie'], // 3 players so Bob can have 0 blind
        startingStacks: [100, 100, 100],
        blindsOrStraddles: [1, 0, 2], // Bob (author) has no positional blind
        antes: [0, 0, 0],
        minBet: 2,
        author: 'Bob',
        actions: [],
        _intents: [0, 0, 0],
        _inactive: [0, 0, 0],
        _deadBlinds: [5, 10, 0],
      };

      // Test pauseHand doesn't modify _deadBlinds
      const pauseResult = Hand.pause(handWithDeadBlinds);
      expect(pauseResult._deadBlinds).toEqual([5, 10, 0]);

      // Test quitHand doesn't modify _deadBlinds
      const quitResult = Hand.quit(handWithDeadBlinds);
      expect(quitResult._deadBlinds).toEqual([5, 10, 0]);

      // Test waitForBB doesn't modify _deadBlinds
      const waitResult = Hand.waitForBB(handWithDeadBlinds);
      expect(waitResult._deadBlinds).toEqual([5, 10, 0]);

      // Test resume does NOT modify _deadBlinds - only next() handles debt
      const resumeResult = Hand.resume(handWithDeadBlinds);
      expect(resumeResult._deadBlinds).toEqual([5, 10, 0]); // NOT changed!

      // Test joinHand expands _deadBlinds to match _inactive length (validation requirement)
      const player = { playerName: 'David', buyIn: 100 };
      const joinResult = Hand.join(handWithDeadBlinds, player);
      expect(joinResult._deadBlinds).toEqual([5, 10, 0, 0]); // Expands to match _inactive length
    });

    it('should only express intentions via _intents field', () => {
      // Scenario: Client communicates through intentions only
      // Input: All client methods
      // Expected: Only _intents field modified
      const baseHand = {
        variant: 'NT' as const,
        players: ['Alice', 'Bob', 'Charlie'], // 3 players for flexibility
        startingStacks: [100, 100, 100],
        blindsOrStraddles: [0, 1, 2], // Alice has no positional blind
        antes: [0, 0, 0],
        minBet: 2,
        actions: [],
        _intents: [0, 0, 0],
        _inactive: [0, 0, 0],
        _deadBlinds: [5, 10, 0],
      };

      // pauseHand should only modify _intents
      const pauseHand = { ...baseHand, author: 'Alice' };
      const pauseResult = Hand.pause(pauseHand);
      expect(pauseResult._intents).toEqual([2, 0, 0]);
      expect(pauseResult._inactive).toEqual(baseHand._inactive);
      expect(pauseResult._deadBlinds).toEqual(baseHand._deadBlinds);

      // quitHand should only modify _intents
      const quitHandObj = { ...baseHand, author: 'Alice' };
      const quitResult = Hand.quit(quitHandObj);
      expect(quitResult._intents).toEqual([3, 0, 0]);
      expect(quitResult._inactive).toEqual(baseHand._inactive);
      expect(quitResult._deadBlinds).toEqual(baseHand._deadBlinds);

      // waitForBB only modifies _intents - does NOT change _inactive mid-game
      const waitHand = { ...baseHand, author: 'Alice' };
      const waitResult = Hand.waitForBB(waitHand);
      expect(waitResult._intents).toEqual([1, 0, 0]);
      expect(waitResult._inactive).toEqual([0, 0, 0]); // NOT changed! Only next() changes _inactive
      expect(waitResult._deadBlinds).toEqual(baseHand._deadBlinds);

      // resume only modifies _intents - does NOT change _inactive or _deadBlinds
      const resumeHandObj = { ...baseHand, author: 'Alice', _intents: [2, 0, 0] };
      const resumeResult = Hand.resume(resumeHandObj);
      expect(resumeResult._intents).toEqual([0, 0, 0]);
      expect(resumeResult._inactive).toEqual([0, 0, 0]); // NOT changed! Only next() changes _inactive
      expect(resumeResult._deadBlinds).toEqual([5, 10, 0]); // NOT changed! Only next() handles debt

      // joinHand adds player and expands all arrays including _inactive and _deadBlinds
      const player = { playerName: 'David', buyIn: 100 };
      const joinResult = Hand.join(baseHand, player);
      expect(joinResult._intents).toEqual([0, 0, 0, 0]); // New player ready to play
      expect(joinResult._inactive).toEqual([0, 0, 0, 2]); // New player marked as inactive locally
      expect(joinResult._deadBlinds).toEqual([5, 10, 0, 0]); // Expanded to match _inactive length
    });
  });
});

// ============================================================================
// TEST: playerIdentifier parameter functionality
// ============================================================================

describe('Client methods with playerIdentifier parameter', () => {
  it('should treat numeric index and string name identifiers as equivalent', () => {
    // SCENARIO: All client methods accept playerIdentifier as either numeric index or string name
    // INPUT: Hand without author, testing with playerIdentifier: 1 vs playerIdentifier: 'Bob'
    // EXPECTED: Both identifiers produce identical results for all methods
    const authorlessHand = {
      variant: 'NT' as const,
      players: ['Alice', 'Bob', 'Charlie'],
      startingStacks: [100, 100, 100],
      blindsOrStraddles: [1, 0, 2], // Bob (index 1) has no positional blind
      antes: [0, 0, 0],
      minBet: 2,
      actions: [],
      _intents: [0, 0, 0],
    };

    // Test quitHand with numeric index vs string name
    const quitNumeric = Hand.quit(authorlessHand, 1);
    const quitString = Hand.quit(authorlessHand, 'Bob');

    expect(quitNumeric._intents).toEqual([0, 3, 0]);
    expect(quitString._intents).toEqual([0, 3, 0]);
    expect(quitNumeric.author).toBe('Bob');
    expect(quitString.author).toBe('Bob');

    // Test pauseHand with numeric index vs string name
    const pauseNumeric = Hand.pause(authorlessHand, 1);
    const pauseString = Hand.pause(authorlessHand, 'Bob');

    expect(pauseNumeric._intents).toEqual([0, 2, 0]);
    expect(pauseString._intents).toEqual([0, 2, 0]);
    expect(pauseNumeric.author).toBe('Bob');
    expect(pauseString.author).toBe('Bob');

    // Test waitForBB with numeric index vs string name
    const waitNumeric = Hand.waitForBB(authorlessHand, 1);
    const waitString = Hand.waitForBB(authorlessHand, 'Bob');

    expect(waitNumeric._intents).toEqual([0, 1, 0]);
    expect(waitString._intents).toEqual([0, 1, 0]);
    expect(waitNumeric.author).toBe('Bob');
    expect(waitString.author).toBe('Bob');

    // Test resumeHand with numeric index vs string name
    const resumeNumeric = Hand.resume(authorlessHand, 1);
    const resumeString = Hand.resume(authorlessHand, 'Bob');

    expect(resumeNumeric._intents).toEqual([0, 0, 0]);
    expect(resumeString._intents).toEqual([0, 0, 0]);
    expect(resumeNumeric.author).toBe('Bob');
    expect(resumeString.author).toBe('Bob');
  });

  it('should prioritize playerIdentifier over author field', () => {
    // SCENARIO: When both author and playerIdentifier are present, playerIdentifier takes precedence
    // INPUT: Hand with author='Alice', but playerIdentifier='Bob' passed to methods
    // EXPECTED: Methods operate on Bob (playerIdentifier), not Alice (author)
    const handWithAuthor = {
      variant: 'NT' as const,
      players: ['Alice', 'Bob', 'Charlie'],
      startingStacks: [100, 100, 100],
      blindsOrStraddles: [1, 0, 2], // Bob (index 1) has no positional blind
      antes: [0, 0, 0],
      minBet: 2,
      actions: [],
      author: 'Alice',
      _intents: [0, 0, 0],
    };

    // Test quitHand: should modify Bob's intent, not Alice's
    const quitResult = Hand.quit(handWithAuthor, 'Bob');
    expect(quitResult._intents).toEqual([0, 3, 0]); // Bob (index 1) set to 3, not Alice (index 0)
    expect(quitResult.author).toBe('Bob'); // author updated to Bob

    // Test pauseHand: should modify Bob's intent, not Alice's
    const pauseResult = Hand.pause(handWithAuthor, 'Bob');
    expect(pauseResult._intents).toEqual([0, 2, 0]); // Bob (index 1) set to 2, not Alice (index 0)
    expect(pauseResult.author).toBe('Bob'); // author updated to Bob

    // Test waitForBB: should modify Bob's intent, not Alice's; _inactive unchanged
    const waitResult = Hand.waitForBB(handWithAuthor, 'Bob');
    expect(waitResult._intents).toEqual([0, 1, 0]); // Bob (index 1) set to 1, not Alice (index 0)
    // waitForBB() does NOT modify _inactive - input has no _inactive, output has no _inactive
    expect(waitResult._inactive).toBeUndefined();
    expect(waitResult.author).toBe('Bob'); // author updated to Bob

    // Test resumeHand: should modify Bob's intent, not Alice's
    // Note: Bob is WAITING (1) and there are 2 active players, so Bob stays WAITING
    const handWithInactive = {
      ...handWithAuthor,
      _inactive: [0, 1, 0],
      _intents: [0, 1, 0],
    };
    const resumeResult = Hand.resume(handWithInactive, 'Bob');
    expect(resumeResult._intents).toEqual([0, 0, 0]); // Bob (index 1) set to 0, not Alice (index 0)
    expect(resumeResult._inactive).toEqual([0, 1, 0]); // Bob stays waiting - game in progress (2 active)
    expect(resumeResult.author).toBe('Bob'); // author updated to Bob
  });

  it('should use author as fallback when playerIdentifier is not provided', () => {
    // SCENARIO: When only author is present (no playerIdentifier), methods use author
    // INPUT: Hand with author='Alice', playerIdentifier not passed
    // EXPECTED: Methods operate on Alice (author)
    const handWithAuthor = {
      variant: 'NT' as const,
      players: ['Alice', 'Bob', 'Charlie'],
      startingStacks: [100, 100, 100],
      blindsOrStraddles: [0, 1, 2],
      antes: [0, 0, 0],
      minBet: 2,
      actions: [],
      author: 'Alice',
      _intents: [0, 0, 0],
    };

    // Test quitHand: should modify Alice's intent (no playerIdentifier passed)
    const quitResult = Hand.quit(handWithAuthor);
    expect(quitResult._intents).toEqual([3, 0, 0]); // Alice (index 0) set to 3
    expect(quitResult.author).toBe('Alice'); // author stays Alice

    // Test pauseHand: should modify Alice's intent (no playerIdentifier passed)
    const pauseResult = Hand.pause(handWithAuthor);
    expect(pauseResult._intents).toEqual([2, 0, 0]); // Alice (index 0) set to 2
    expect(pauseResult.author).toBe('Alice'); // author stays Alice

    // Test waitForBB: should modify Alice's intent (no playerIdentifier passed); _inactive unchanged
    const waitResult = Hand.waitForBB(handWithAuthor);
    expect(waitResult._intents).toEqual([1, 0, 0]); // Alice (index 0) set to 1
    // waitForBB() does NOT modify _inactive - input has no _inactive, output has no _inactive
    expect(waitResult._inactive).toBeUndefined();
    expect(waitResult.author).toBe('Alice'); // author stays Alice

    // Test resumeHand: should modify Alice's intent (no playerIdentifier passed)
    // Note: Alice is WAITING (1) and there are 2 active players (Bob, Charlie), so Alice stays WAITING
    const handWithInactive = {
      ...handWithAuthor,
      _inactive: [1, 0, 0],
      _intents: [1, 0, 0],
    };
    const resumeResult = Hand.resume(handWithInactive);
    expect(resumeResult._intents).toEqual([0, 0, 0]); // Alice (index 0) set to 0
    expect(resumeResult._inactive).toEqual([1, 0, 0]); // Alice stays waiting - game in progress (2 active)
    expect(resumeResult.author).toBe('Alice'); // author stays Alice
  });
});
