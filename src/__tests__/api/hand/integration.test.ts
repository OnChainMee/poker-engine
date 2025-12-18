import { describe, it, expect } from 'vitest';
import { Hand } from '../../../Hand';
import { Game } from '../../../Game';
import { Command } from '../../../Command';

describe('Full game lifecycle integration test', () => {
  it('should handle full join flow: client join -> server merge -> advance -> next hand', () => {
    // SCENARIO: Complete integration test for player joining active game
    // INPUT: Active 2-player game, Charlie joins via client, server merges, game advances
    // EXPECTED: Charlie waits current hand, participates in next hand

    // Step 1: SERVER - Active game in progress (server state)
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

    // Step 2: CLIENT - Charlie receives personalized game state from server
    // Server sends personalized state with hidden cards and author field
    const charliePersonalizedState = Hand.personalize(serverGameState, 'Charlie');

    // Step 3: CLIENT - Charlie decides to join the table
    const clientJoinRequest = Hand.join(charliePersonalizedState, {
      playerName: 'Charlie',
      buyIn: 1000,
    });

    // Verify client request structure
    expect(clientJoinRequest.players).toEqual(['Alice', 'Bob', 'Charlie']);
    expect(clientJoinRequest._intents).toEqual([0, 0, 0]); // Charlie ready to play
    expect(clientJoinRequest._inactive).toEqual([0, 0, 2]); // CLIENT sets _inactive locally
    expect(clientJoinRequest.author).toBe('Charlie'); // Author preserved from personalized state

    // Step 4: SERVER - Merge client request with authoritative server state
    const serverMerged = Hand.merge(serverGameState, clientJoinRequest, true);

    // Verify server sets _inactive correctly
    expect(serverMerged.players).toEqual(['Alice', 'Bob', 'Charlie']);
    expect(serverMerged._intents).toEqual([0, 0, 0]); // Intents preserved
    expect(serverMerged._inactive).toEqual([0, 0, 2]); // SERVER sets _inactive: 2 for new player
    expect(serverMerged._deadBlinds).toEqual([0, 0, 0]);
    expect(serverMerged.author).toBeUndefined(); // Server removes author

    // Step 5: SERVER - Advance game, Charlie shouldn't participate
    const advanced = Hand.advance(serverMerged);

    // Verify Charlie doesn't participate in current hand
    expect(advanced.players).toHaveLength(3);
    expect(advanced._inactive).toEqual([0, 0, 2]); // Charlie still inactive

    // Count hole card deals - should only be 2 (Alice and Bob)
    const holeCardDeals = advanced.actions.filter(action => action.startsWith('d dh'));
    expect(holeCardDeals).toHaveLength(2); // Only Alice and Bob get cards

    // Step 6: Complete current hand (Alice and Bob play to showdown)
    // Following proper client-server flow with merge after each action
    let serverState = advanced;

    // Alice calls (CLIENT -> SERVER flow)
    const aliceCallRequest = Hand.applyAction({ ...serverState, author: 'Alice' }, 'p1 cc 10');
    serverState = Hand.merge(serverState, aliceCallRequest, false);

    // Bob checks (CLIENT -> SERVER flow)
    const bobCheckRequest = Hand.applyAction({ ...serverState, author: 'Bob' }, 'p2 cc');
    serverState = Hand.merge(serverState, bobCheckRequest, false);

    // SERVER: Advance to deal flop
    serverState = Hand.advance(serverState);

    // Bob checks flop (CLIENT -> SERVER flow)
    const bobCheckFlopRequest = Hand.applyAction({ ...serverState, author: 'Bob' }, 'p2 cc');
    serverState = Hand.merge(serverState, bobCheckFlopRequest, false);

    // Alice checks flop (CLIENT -> SERVER flow)
    const aliceCheckFlopRequest = Hand.applyAction({ ...serverState, author: 'Alice' }, 'p1 cc');
    serverState = Hand.merge(serverState, aliceCheckFlopRequest, false);

    // SERVER: Advance to deal turn
    serverState = Hand.advance(serverState);

    // Bob checks turn (CLIENT -> SERVER flow)
    const bobCheckTurnRequest = Hand.applyAction({ ...serverState, author: 'Bob' }, 'p2 cc');
    serverState = Hand.merge(serverState, bobCheckTurnRequest, false);

    // Alice checks turn (CLIENT -> SERVER flow)
    const aliceCheckTurnRequest = Hand.applyAction({ ...serverState, author: 'Alice' }, 'p1 cc');
    serverState = Hand.merge(serverState, aliceCheckTurnRequest, false);

    // SERVER: Advance to deal river
    serverState = Hand.advance(serverState);

    // Bob checks river (CLIENT -> SERVER flow)
    const bobCheckRiverRequest = Hand.applyAction({ ...serverState, author: 'Bob' }, 'p2 cc');
    serverState = Hand.merge(serverState, bobCheckRiverRequest, false);

    // Alice checks river (CLIENT -> SERVER flow)
    const aliceCheckRiverRequest = Hand.applyAction({ ...serverState, author: 'Alice' }, 'p1 cc');
    serverState = Hand.merge(serverState, aliceCheckRiverRequest, false);

    // SERVER: Advance to showdown
    serverState = Hand.advance(serverState);

    // Hand should be complete
    expect(Hand.isComplete(serverState)).toBe(true);
    expect(serverState.finishingStacks).toBeDefined();

    // Step 7: SERVER - Create next hand, Charlie should now participate
    const nextHand = Hand.next(serverState);

    // Verify all three players in next hand
    expect(nextHand.players).toEqual(['Alice', 'Bob', 'Charlie']);
    expect(nextHand._inactive).toEqual([0, 0, 0]); // All active now
    expect(nextHand._intents).toEqual([0, 0, 0]);
    expect(nextHand._deadBlinds).toEqual([0, 0, 0]); // No dead blinds for new player
    expect(nextHand.actions).toEqual([]); // Fresh hand

    // Step 8: SERVER - Advance next hand, all three should get cards
    const nextHandAdvanced = Hand.advance(nextHand);

    const nextHoleCardDeals = nextHandAdvanced.actions.filter(action =>
      action.startsWith('d dh')
    );
    expect(nextHoleCardDeals).toHaveLength(3); // All three players get cards
  });

  it('should handle complete game lifecycle: empty table -> players join to limit -> all fold -> players quit -> new players join -> game completes', () => {
    // SCENARIO: Complete integration test for full game lifecycle
    // INPUT: Empty table, players join up to seatCount limit, play hands, all quit, new players join
    // EXPECTED: Game handles all transitions correctly, validates limits, manages stacks properly

    // ==================== PHASE 1: EMPTY TABLE INITIALIZATION ====================
    // Create an empty table with no players
    let serverState: Hand = Hand({
      variant: 'NT',
      players: [],
      startingStacks: [],
      blindsOrStraddles: [],
      antes: [],
      minBet: 20,
      seatCount: 4, // Maximum 4 players at this table
      actions: [],
      _inactive: [],
      _intents: [],
      _deadBlinds: [],
      seed: 12345,
    });

    // Verify empty state
    expect(serverState.players).toHaveLength(0);

    // ==================== PHASE 2: PLAYERS JOIN UP TO LIMIT ====================
    // Player 1 (Alice) joins
    const aliceJoin = Hand.join(Hand.personalize(serverState), {
      playerName: 'Alice',
      buyIn: 1000,
      seat: 1,
    });
    serverState = Hand.merge(serverState, aliceJoin, true);

    expect(serverState.players).toEqual(['Alice']);
    expect(serverState.startingStacks).toEqual([1000]);
    expect(serverState._inactive).toEqual([2]); // New player, inactive
    expect(serverState._intents).toEqual([0]); // Ready to play

    // Player 2 (Bob) joins
    const bobJoin = Hand.join(Hand.personalize(serverState), {
      playerName: 'Bob',
      buyIn: 1000,
      seat: 2,
    });
    serverState = Hand.merge(serverState, bobJoin, true);

    expect(serverState.players).toEqual(['Alice', 'Bob']);
    expect(serverState.startingStacks).toEqual([1000, 1000]);
    expect(serverState._inactive).toEqual([2, 2]); // Both new players
    expect(serverState._intents).toEqual([0, 0]);

    // Advance to start game - should activate both players
    serverState = Hand.advance(serverState);

    // After advance, players should be dealt cards and activated
    expect(serverState._inactive).toEqual([0, 0]); // Both active now
    expect(serverState.actions.length).toBeGreaterThan(0); // Cards dealt

    // Complete first hand quickly (both fold)
    const game1 = Game(serverState);
    let action1 = Command.fold(game1, game1.nextPlayerIndex);
    serverState = Hand.applyAction(serverState, action1);
    serverState = Hand.advance(serverState);

    expect(Hand.isComplete(serverState)).toBe(true);

    // Start next hand
    serverState = Hand.next(serverState);
    expect(serverState.players).toEqual(['Alice', 'Bob']); // Players don't rotate, only blinds do
    expect(serverState.actions).toEqual([]); // New hand, no actions
    // Verify blinds (heads-up: always [SB, BB] = [10, 20])
    expect(serverState.blindsOrStraddles).toEqual([10, 20]); // Heads-up blinds

    // Player 3 (Charlie) joins during active game
    const charlieJoin = Hand.join(Hand.personalize(serverState), {
      playerName: 'Charlie',
      buyIn: 1000,
      seat: 3,
    });
    serverState = Hand.merge(serverState, charlieJoin, true);

    expect(serverState.players).toEqual(['Alice', 'Bob', 'Charlie']);
    expect(serverState._inactive).toEqual([0, 0, 2]); // Charlie inactive, others active

    // Complete second hand
    serverState = Hand.advance(serverState);
    const game2 = Game(serverState);
    let action2 = Command.fold(game2, game2.nextPlayerIndex);
    serverState = Hand.applyAction(serverState, action2);
    serverState = Hand.advance(serverState);
    expect(Hand.isComplete(serverState)).toBe(true);

    // Start third hand - Charlie should become active
    serverState = Hand.next(serverState);
    expect(serverState.players).toEqual(['Alice', 'Bob', 'Charlie']); // Players don't rotate
    expect(serverState._inactive).toEqual([0, 0, 0]); // All active

    // Player 4 (Dan) joins - reaches seat limit
    const danJoin = Hand.join(Hand.personalize(serverState), {
      playerName: 'Dan',
      buyIn: 1000,
      seat: 4,
    });
    serverState = Hand.merge(serverState, danJoin, true);

    expect(serverState.players).toEqual(['Alice', 'Bob', 'Charlie', 'Dan']); // In join order
    expect(serverState.players).toHaveLength(4); // At limit
    expect(serverState._inactive).toEqual([0, 0, 0, 2]); // Dan inactive

    // ==================== PHASE 3: ATTEMPT TO JOIN BEYOND LIMIT ====================
    // Player 5 (Eve) attempts to join - should be REJECTED
    const eveJoin = Hand.join(Hand.personalize(serverState), {
      playerName: 'Eve',
      buyIn: 1000,
      seat: 5,
    });

    // Hand.join should return unchanged hand (validation fails)
    expect(eveJoin.players).toEqual(['Alice', 'Bob', 'Charlie', 'Dan']); // Unchanged
    expect(eveJoin.players).toHaveLength(4); // Still at limit

    // Merge should also keep state unchanged
    const afterEveMerge = Hand.merge(serverState, eveJoin, true);
    expect(afterEveMerge.players).toEqual(['Alice', 'Bob', 'Charlie', 'Dan']);
    expect(afterEveMerge.players).toHaveLength(4); // Still at limit

    // ==================== PHASE 4: PLAY HAND WITH 4 PLAYERS, ALL FOLD ====================
    // Complete third hand with all 4 players
    serverState = Hand.advance(serverState);
    const game3 = Game(serverState);

    // All players fold one by one
    let currentState = serverState;
    while (!Hand.isComplete(currentState)) {
      const game = Game(currentState);
      if (game.nextPlayerIndex >= 0) {
        const foldAction = Command.fold(game, game.nextPlayerIndex);
        currentState = Hand.applyAction(currentState, foldAction);
      }
      currentState = Hand.advance(currentState);
    }

    serverState = currentState;
    expect(Hand.isComplete(serverState)).toBe(true);
    expect(serverState.finishingStacks).toBeDefined();

    // Record stacks before next hand
    const stacksBeforeNextHand = [...serverState.finishingStacks!];

    // Start fourth hand - Dan should become active
    serverState = Hand.next(serverState);
    expect(serverState.players).toEqual(['Alice', 'Bob', 'Charlie', 'Dan']); // Players don't rotate
    expect(serverState._inactive).toEqual([0, 0, 0, 0]); // All active
    expect(serverState.startingStacks).toEqual(stacksBeforeNextHand); // Stacks preserved

    // ==================== PHASE 5: PLAYERS QUIT ONE BY ONE ====================
    // Alice quits
    const aliceQuit = Hand.quit({ ...serverState, author: 'Alice' });
    serverState = Hand.merge(serverState, aliceQuit, false);
    expect(serverState._intents).toEqual([3, 0, 0, 0]); // Alice has intent to quit

    // Complete hand
    serverState = Hand.advance(serverState);
    currentState = serverState;
    while (!Hand.isComplete(currentState)) {
      const game = Game(currentState);
      if (game.nextPlayerIndex >= 0) {
        const foldAction = Command.fold(game, game.nextPlayerIndex);
        currentState = Hand.applyAction(currentState, foldAction);
      }
      currentState = Hand.advance(currentState);
    }
    serverState = currentState;

    // Next hand - Alice should be removed
    serverState = Hand.next(serverState);
    expect(serverState.players).toEqual(['Bob', 'Charlie', 'Dan']); // Alice removed
    expect(serverState.players).toHaveLength(3);

    // ==================== PHASE 5a: NEW PLAYER JOINS, THEN MULTIPLE QUIT TOGETHER ====================
    // Eve joins the table (now we have 4 players again)
    const eveJoin2 = Hand.join(Hand.personalize(serverState), {
      playerName: 'Eve',
      buyIn: 1000,
      seat: 1, // Alice's old seat
    });
    serverState = Hand.merge(serverState, eveJoin2, true);
    expect(serverState.players).toEqual(['Bob', 'Charlie', 'Dan', 'Eve']);
    expect(serverState._inactive).toEqual([0, 0, 0, 2]); // Eve is new, inactive

    // Bob AND Eve both decide to quit in the same hand
    const bobQuit = Hand.quit({ ...serverState, author: 'Bob' });
    serverState = Hand.merge(serverState, bobQuit, false);
    expect(serverState._intents).toEqual([3, 0, 0, 0]); // Bob wants to quit

    const eveQuit = Hand.quit({ ...serverState, author: 'Eve' });
    serverState = Hand.merge(serverState, eveQuit, false);
    expect(serverState._intents).toEqual([3, 0, 0, 3]); // Bob AND Eve want to quit

    // Complete hand with 2 players having quit intent
    serverState = Hand.advance(serverState);
    currentState = serverState;
    while (!Hand.isComplete(currentState)) {
      const game = Game(currentState);
      if (game.nextPlayerIndex >= 0) {
        const foldAction = Command.fold(game, game.nextPlayerIndex);
        currentState = Hand.applyAction(currentState, foldAction);
      }
      currentState = Hand.advance(currentState);
    }
    serverState = currentState;

    // Next hand - BOTH Bob and Eve should be removed in one transition
    serverState = Hand.next(serverState);
    expect(serverState.players).toEqual(['Charlie', 'Dan']); // Both removed at once
    expect(serverState.players).toHaveLength(2);

    // Charlie quits
    const charlieQuit = Hand.quit({ ...serverState, author: 'Charlie' });
    serverState = Hand.merge(serverState, charlieQuit, false);
    expect(serverState._intents).toBeDefined();
    expect(serverState._intents?.[0]).toBe(3); // Charlie (now at index 0) has intent to quit

    // Complete hand
    serverState = Hand.advance(serverState);
    currentState = serverState;
    while (!Hand.isComplete(currentState)) {
      const game = Game(currentState);
      if (game.nextPlayerIndex >= 0) {
        const foldAction = Command.fold(game, game.nextPlayerIndex);
        currentState = Hand.applyAction(currentState, foldAction);
      }
      currentState = Hand.advance(currentState);
    }
    serverState = currentState;

    // Next hand - Charlie should be removed
    serverState = Hand.next(serverState);
    expect(serverState.players).toEqual(['Dan']); // Only Dan left
    expect(serverState.players).toHaveLength(1);

    // Dan quits (last player)
    const danQuit = Hand.quit({ ...serverState, author: 'Dan' });
    serverState = Hand.merge(serverState, danQuit, false);
    expect(serverState._intents).toEqual([3]); // Dan has intent to quit

    // ==================== PHASE 6: EMPTY TABLE AFTER ALL QUIT ====================
    // With single player who wants to quit and game not started,
    // Hand.next() returns empty table (per architecture spec)
    serverState = Hand.next(serverState);
    expect(serverState.players).toEqual([]); // Empty table
    expect(serverState.players).toHaveLength(0);
    expect(serverState.startingStacks).toEqual([]);
    expect(serverState._inactive).toEqual([]);
    expect(serverState._intents).toEqual([]);

    // ==================== PHASE 7: COMPLETELY NEW PLAYERS JOIN EMPTY TABLE ====================
    // New player Frank joins empty table (first player)
    const frankJoin = Hand.join(Hand.personalize(serverState), {
      playerName: 'Frank',
      buyIn: 1500,
      seat: 1,
    });
    serverState = Hand.merge(serverState, frankJoin, true);

    expect(serverState.players).toEqual(['Frank']);
    expect(serverState.startingStacks).toEqual([1500]);
    expect(serverState._inactive).toEqual([2]); // New player inactive

    // New player Grace joins
    const graceJoin = Hand.join(Hand.personalize(serverState), {
      playerName: 'Grace',
      buyIn: 1500,
      seat: 2,
    });
    serverState = Hand.merge(serverState, graceJoin, true);

    expect(serverState.players).toEqual(['Frank', 'Grace']);
    expect(serverState.startingStacks).toEqual([1500, 1500]);
    expect(serverState._inactive).toEqual([2, 2]); // Both new players inactive

    // New player Henry joins
    const henryJoin = Hand.join(Hand.personalize(serverState), {
      playerName: 'Henry',
      buyIn: 1500,
      seat: 3,
    });
    serverState = Hand.merge(serverState, henryJoin, true);

    expect(serverState.players).toEqual(['Frank', 'Grace', 'Henry']);
    expect(serverState.startingStacks).toEqual([1500, 1500, 1500]);
    expect(serverState._inactive).toEqual([2, 2, 2]); // All new players inactive

    // ==================== PHASE 8: PLAY FINAL HAND WITH COMPLETELY NEW PLAYERS ====================
    // Advance to start game - should activate all new players
    serverState = Hand.advance(serverState);

    // Players should be activated and dealt cards
    expect(serverState._inactive).toEqual([0, 0, 0]); // All active now
    expect(serverState.actions.length).toBeGreaterThan(0); // Cards dealt

    // Play hand to completion
    currentState = serverState;
    while (!Hand.isComplete(currentState)) {
      const game = Game(currentState);
      if (game.nextPlayerIndex >= 0) {
        const foldAction = Command.fold(game, game.nextPlayerIndex);
        currentState = Hand.applyAction(currentState, foldAction);
      }
      currentState = Hand.advance(currentState);
    }

    serverState = currentState;
    expect(Hand.isComplete(serverState)).toBe(true);

    // Verify final state with completely new player roster
    expect(serverState.finishingStacks).toBeDefined();
    expect(serverState.finishingStacks!.length).toBe(3);

    // Verify exact stack values - all new players started with 1500
    expect(serverState.startingStacks).toEqual([1500, 1500, 1500]);
    // Frank (SB=10) folded → lost 10, Grace (BB=20) won pot → gained 10
    expect(serverState.finishingStacks).toEqual([1490, 1510, 1500]);
    // Blinds structure: Frank=SB, Grace=BB, Henry no blind
    expect(serverState.blindsOrStraddles).toEqual([10, 20, 0]);
  });
});
