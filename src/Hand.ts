import { Command } from './Command';
import { Game } from './Game';
import {
  getActionAmount,
  getActionCards,
  getActionPlayerIndex,
  getActionTimestamp,
  getActionType,
} from './game/position';
import { ensureSeatOrder } from './game/seats';
import {
  Action,
  ACTION_DEAL_BOARD,
  ACTION_DEAL_HOLE,
  ACTION_MESSAGE,
  FixedLimitHand,
  NoLimitHand,
  PlayerIdentifier,
  StudHand,
} from './types';

/** Hand type representing a poker hand */
export type Hand = NoLimitHand | FixedLimitHand | StudHand;

/**
 * Creates a new Hand object with the given properties and extras.
 * @param props - The properties to set on the Hand object.
 * @param extras - The extra properties to set on the Hand object.
 * @returns A new Hand object.
 */
export function Hand(props: Partial<Hand>, extras: Partial<Hand> = {}): Hand {
  const merged = {
    actions: [],
    ...props,
    ...extras,
  };
  Hand.validate(merged);
  return merged as Hand;
}

/**
 * Hand namespace - Data notation layer for poker engine
 * Provides standardized format for representing game states through action sequences
 */
export namespace Hand {
  /**
   * Get venue-specific player ID from _venueIds array
   * @param hand - Hand object
   * @param playerIdentifier - Player index (0-based) or name
   * @returns Venue ID for the player or null if not found or _venueIds missing
   */
  export function getPlayerId(hand: Hand, playerIdentifier: PlayerIdentifier): string | null {
    const index = getPlayerIndex(hand, playerIdentifier);

    // Return null if player not found
    if (index === -1) {
      return null;
    }

    // Check if _venueIds exists and has value at index
    if (!Array.isArray(hand._venueIds)) {
      return null;
    }

    const venueId = hand._venueIds[index];
    return typeof venueId === 'string' ? venueId : null;
  }

  /**
   * Get player index (0-based) for a given identifier
   * @param hand - Hand object
   * @param playerIdentifier - Player index or name
   * @returns Player index (0-based) or -1 if not found
   */
  export function getPlayerIndex(hand: Hand, playerIdentifier: PlayerIdentifier): number {
    // Handle numeric index
    if (typeof playerIdentifier === 'number') {
      // Check bounds
      if (playerIdentifier < 0 || playerIdentifier >= hand.players.length) {
        return -1;
      }
      return playerIdentifier;
    }

    // Handle string name - simple indexOf for string array
    if (typeof playerIdentifier === 'string') {
      return hand.players.indexOf(playerIdentifier);
    }

    return -1;
  }

  /**
   * Returns the index of the perspective player for table operations, or -1 if not found.
   * Essential for player-specific views.
   * @param hand - Hand object with potential author field
   * @returns Player index (0-based) of the author, or -1 if not found
   */
  export function getAuthorPlayerIndex(hand: Hand): number {
    // Check if we have an author field
    const author = hand.author;
    if (!author) return -1;

    // Get players array
    const players = hand.players;
    if (!players || players.length === 0) return -1;

    // For Hand objects, players are strings
    if (typeof author === 'string') {
      const index = players.indexOf(author);
      return index;
    }

    return -1;
  }

  /**
   * Checks if the hand has enough active players to start a game.
   * A game requires at least 2 active players who:
   * - Are not inactive (_inactive === 0 or undefined)
   * - Have chips to play (startingStacks > 0)
   * @param hand - Hand object to check
   * @returns true if 2 or more players can play, false otherwise
   */
  export function isPlayable(hand: Hand): boolean {
    // Count players who can play (active + have chips)
    let playableCount = 0;

    for (let i = 0; i < hand.players.length; i++) {
      // Check if player is active (no _inactive array means all active)
      // 0 - active, 1 - inactive, 2 - new player
      const isActive = !Array.isArray(hand._inactive) || hand._inactive[i] === 0 || hand._inactive[i] === 2;

      // Check if player has chips
      const hasChips = (hand.startingStacks[i] ?? 0) > 0;

      if (isActive && hasChips) {
        playableCount++;
        // Early exit: once we have 2 playable, we're good
        if (playableCount >= 2) {
          return true;
        }
      }
    }

    return false;
  }

  export function hasBeenDealt(hand: Hand): boolean {
    return !isComplete(hand) && hand.actions.filter((action) => action.startsWith(`d ${ACTION_DEAL_HOLE}`)).length > 0;
  }

  /**
   * Starts a game and ensures blinds are correctly posted.
   * @param hand - Hand object to start
   * @returns Hand ready to play
   */
  export function start(hand: Hand): Hand {
    // Check if game can be played
    if (!isPlayable(hand)) {
      return Hand(hand);
    }

    // Get BB value from minBet (required for no-limit games)
    const bbValue = hand.minBet;
    if (!bbValue || bbValue <= 0) {
      return Hand(hand);
    }

    const sbValue = Math.floor(bbValue / 2);

    // Find playable player indices (active + has chips)
    const playableIndices: number[] = [];
    const inactive = hand._inactive ?? [];
    for (let i = 0; i < hand.players.length; i++) {
      const isActive = inactive[i] === 0 || inactive[i] === undefined;
      const hasChips = (hand.startingStacks[i] ?? 0) > 0;
      if (isActive && hasChips) {
        playableIndices.push(i);
      }
    }

    // Find existing BB position (preserves button position)
    const currentBBIndex = hand.blindsOrStraddles.findIndex(b => b === bbValue);

    // Determine BB position: use existing or default to second playable
    const bbIndex = currentBBIndex >= 0 ? currentBBIndex : playableIndices[1];

    // Determine SB position: left of BB among playable players
    let sbIndex: number;
    if (playableIndices.length === 2) {
      // Heads-up: SB is the other player
      sbIndex = playableIndices[0] === bbIndex ? playableIndices[1] : playableIndices[0];
    } else {
      // 3+ players: SB is the playable player immediately left of BB
      const bbPlayablePos = playableIndices.indexOf(bbIndex);
      const sbPlayablePos = bbPlayablePos <= 0 ? playableIndices.length - 1 : bbPlayablePos - 1;
      sbIndex = playableIndices[sbPlayablePos];
    }

    // Assign blinds
    const newBlinds = new Array(hand.players.length).fill(0);
    newBlinds[sbIndex] = sbValue;
    newBlinds[bbIndex] = bbValue;

    return Hand({
      ...hand,
      blindsOrStraddles: newBlinds,
    });
  }

  /**
   * Applies an action to a game state.
   * @param hand - The hand state to apply the action to
   * @param action - The action to apply
   * @returns The updated game state with finishing data when hand completes
   */
  export function applyAction(hand: Hand, action: Action): Hand {
    // Step 1: Create Game from Hand
    const game = Game(hand);

    // Step 2: Apply action (mutates game object)
    Game.applyAction(game, action);

    // Step 3: Create new Hand with action appended
    const newHand: Hand = {
      ...hand,
      actions: [...hand.actions, action],
    };

    // Step 4: If hand is complete, extract finishing state from Game
    if (game.isComplete) {
      return Hand(Game.finish(game, newHand));
    }

    return Hand(newHand);
  }

  /**
   * Tries to merge two game states, assuming they are from the same table, have common players and are in the same hand.
   * Preserves known card information over hidden cards during merge.
   * Supports sit-in/out functionality through _intents field modifications.
   * @param oldHand - The first game state (typically server/authoritative state)
   * @param newHand - The second game state (typically client/incoming state)
   * @param allowUnsafeMerge - Whether to allow unsafe merge authorless state
   * @returns The merged game state, or oldHand if incompatible
   */
  export function merge(oldHand: Hand, newHand: Hand, allowUnsafeMerge: boolean = false): Hand {
    // Security: If author is set, never allow unsafe merge regardless of parameter
    const effectiveAllowUnsafeMerge = newHand.author ? false : allowUnsafeMerge;

    // Step 0: Basic structure validation
    try {
      Hand.validate(newHand);
    } catch (e) {
      return oldHand; // Invalid hand structure
    }

    // Step 0a: Validate state combinations - reject invalid states
    if (!isValidStateCombination(newHand)) {
      return oldHand;
    }

    // Initialize _inactive if missing or copy existing
    if (!Array.isArray(oldHand._inactive)) {
      oldHand._inactive = new Array(oldHand.players.length).fill(0);
    } else {
      // Copy existing _inactive
      oldHand._inactive = [...oldHand._inactive];
    }

    // Initialize _deadBlinds if missing or copy existing
    if (!Array.isArray(oldHand._deadBlinds)) {
      oldHand._deadBlinds = new Array(oldHand.players.length).fill(0);
    } else {
      // Copy existing _deadBlinds
      oldHand._deadBlinds = [...oldHand._deadBlinds];
    }

    // Step 0a: Check if author is inactive - they can ONLY change their intent
    if (newHand.author) {
      const authorIdx = getAuthorPlayerIndex(newHand);

      if (
        authorIdx >= 0 &&
        authorIdx < oldHand._inactive.length &&
        oldHand._inactive[authorIdx] === 1
      ) {
        // Inactive player can ONLY change their intent, nothing else
        // Create merged hand with only intent change
        let mergedIntents = Array.isArray(oldHand._intents) ? [...oldHand._intents] : undefined;
        let mergedInactive = Array.isArray(oldHand._inactive) ? [...oldHand._inactive] : undefined;

        if (Array.isArray(newHand._intents) && authorIdx < newHand._intents.length) {
          const newIntent = newHand._intents[authorIdx];
          // Check if player is already leaving (intent = 3) - cannot change
          if (Array.isArray(oldHand._intents) && oldHand._intents[authorIdx] === 3) {
            // Player already decided to leave - keep original state
            return oldHand;
          }
          if (newIntent >= 0 && newIntent <= 3) {
            if (!mergedIntents) {
              mergedIntents = new Array(oldHand.players.length).fill(0);
            }
            mergedIntents[authorIdx] = newIntent;

            // Update _inactive based on intent change
            // If intent is 0 (resume), mark as active for NEXT hand
            // If intent is non-zero, keep as inactive
            if (!mergedInactive) {
              mergedInactive = new Array(oldHand.players.length).fill(0);
            }
            // Keep them inactive this hand regardless of intent change
            mergedInactive[authorIdx] = 1;
          }
        }

        // Return oldHand with only intent and inactive modified
        return Hand({
          ...oldHand,
          _intents: mergedIntents,
          _inactive: mergedInactive,
          author: undefined,
        });
      }
    }

    // Step 1: Check if this is a sit-in scenario (new player joining)
    const authorName = newHand.author;
    const isNewPlayerJoining = authorName && !oldHand.players.includes(authorName);

    // Step 1a: Modified compatibility check - skip player array comparison for sit-in
    if (!isNewPlayerJoining && !areHandsCompatible(oldHand, newHand)) {
      return oldHand;
    }

    if (isNewPlayerJoining) {
      const authorIndex = getAuthorPlayerIndex(newHand);

      // Validate that author exists in the new players array
      if (authorIndex === -1 || authorIndex >= newHand.players.length) {
        return oldHand;
      }

      const newPlayerName = newHand.players[authorIndex];

      // Validate starting stack is positive
      if (newHand.startingStacks[authorIndex] <= 0) {
        // Invalid stack amount - must be positive
        return oldHand;
      }

      // Validate all required arrays have correct length
      if (
        newHand.startingStacks.length !== newHand.players.length ||
        newHand.blindsOrStraddles.length !== newHand.players.length ||
        newHand.antes.length !== newHand.players.length
      ) {
        return oldHand;
      }

      // Validate seats if present
      if (Array.isArray(newHand.seats)) {
        if (newHand.seats.length !== newHand.players.length) {
          return oldHand;
        }

        const newSeat = newHand.seats[authorIndex];
        // Validate seat is within table range
        if (oldHand.seatCount && (newSeat < 1 || newSeat > oldHand.seatCount)) {
          return oldHand;
        }

        // Check for duplicate seats
        if (Array.isArray(oldHand.seats) && oldHand.seats.includes(newSeat)) {
          return oldHand;
        }
      }

      // Validate critical fields match even for sit-in
      const criticalFields: (keyof Hand)[] = ['variant', 'venue', 'currency', 'table', 'hand'];
      for (const field of criticalFields) {
        if (
          oldHand[field] !== undefined &&
          newHand[field] !== undefined &&
          oldHand[field] !== newHand[field]
        ) {
          return oldHand;
        }
      }

      // Build arrays by expanding oldHand arrays and adding ONLY the author's data at authorIndex
      // New players always get blindsOrStraddles = 0, advance() assigns blinds when game starts
      const blindsOrStraddles: number[] = [...oldHand.blindsOrStraddles, 0];

      const mergedHand: Hand = {
        ...oldHand,
        players: [...oldHand.players, newPlayerName],
        startingStacks: [...oldHand.startingStacks, newHand.startingStacks[authorIndex]],
        blindsOrStraddles,
        antes: [...oldHand.antes, newHand.antes[authorIndex]],
        author: undefined,
      };

      // Handle optional arrays - ONLY extract author's value at authorIndex
      if (Array.isArray(newHand.seats) && newHand.seats[authorIndex] !== undefined) {
        if (Array.isArray(oldHand.seats)) {
          mergedHand.seats = [...oldHand.seats, newHand.seats[authorIndex]];
        } else {
          // Create seats array with sequential values for existing players
          const seats = new Array(oldHand.players.length).fill(0).map((_, i) => i + 1);
          seats.push(newHand.seats[authorIndex]);
          mergedHand.seats = seats;
        }
      } else if (Array.isArray(oldHand.seats)) {
        // Preserve existing seats, add next available
        const maxSeat = Math.max(...oldHand.seats);
        mergedHand.seats = [...oldHand.seats, maxSeat + 1];
      }

      if (Array.isArray(newHand._venueIds) && newHand._venueIds[authorIndex] !== undefined) {
        if (Array.isArray(oldHand._venueIds)) {
          mergedHand._venueIds = [...oldHand._venueIds, newHand._venueIds[authorIndex]];
        } else {
          // Create _venueIds array
          const venueIds = new Array(oldHand.players.length)
            .fill(undefined)
            .map((_, i) => `${oldHand.players[i]}${oldHand.venue ? `@${oldHand.venue}` : ''}`);

          venueIds.push(newHand._venueIds[authorIndex]);
          mergedHand._venueIds = venueIds;
        }
      } else if (Array.isArray(oldHand._venueIds)) {
        mergedHand._venueIds = [
          ...oldHand._venueIds,
          newHand._venueIds?.[authorIndex] ??
            `${newHand.players[authorIndex]}${oldHand.venue ? `@${oldHand.venue}` : ''}`,
        ];
      }

      // Handle _intents - ONLY take author's intent value
      // Default to 0 (ready to play) if _intents array is missing
      const authorIntent = Array.isArray(newHand._intents) ? newHand._intents[authorIndex] : 0;
      if (Array.isArray(oldHand._intents)) {
        mergedHand._intents = [...oldHand._intents, authorIntent];
      } else {
        const intents = new Array(oldHand.players.length).fill(0);
        intents.push(authorIntent);
        mergedHand._intents = intents;
      }

      // Handle _inactive - determine if players should be activated
      // When joining creates enough players to start, activate them
      const authorInactive = 2; // Default to inactive (new player state)

      if (Array.isArray(oldHand._inactive)) {
        mergedHand._inactive = [...oldHand._inactive, authorInactive];
      } else {
        const inactive = new Array(oldHand.players.length).fill(0);
        inactive.push(authorInactive);
        mergedHand._inactive = inactive;
      }

      // Handle _deadBlinds - just expand the array with 0, no calculation
      if (Array.isArray(oldHand._deadBlinds)) {
        mergedHand._deadBlinds = [...oldHand._deadBlinds, 0];
      } else {
        const deadBlinds = new Array(oldHand.players.length).fill(0);
        deadBlinds.push(0);
        mergedHand._deadBlinds = deadBlinds;
      }

      // Early return for player sit-in scenario - validate generated hand
      return Hand(mergedHand);
    }

    // Step 2: Handle hole actions
    const oldHoleActions = oldHand.actions.filter(
      action => getActionType(action) === ACTION_DEAL_HOLE
    );
    const newHoleActions = newHand.actions.filter(
      action => getActionType(action) === ACTION_DEAL_HOLE
    );
    let resultHoleActions: Action[] = [];

    for (const oldAction of oldHoleActions) {
      const newMatchingHoleAction = newHoleActions.find(
        newAction => getActionPlayerIndex(newAction) === getActionPlayerIndex(oldAction)
      );
      // if there is a new matching hole action, use it to compare cards
      if (newMatchingHoleAction) {
        // get sorted actions cards
        const oldActionCards = getActionCards(oldAction) ?? ['??', '??'];
        const newActionCards = getActionCards(newMatchingHoleAction) ?? ['??', '??'];
        const resultActionCards: string[] = [...oldActionCards];

        // replace any cards only with known cards
        // perfer only old cards over new cards
        oldActionCards.forEach((card, index) => {
          // if oldAction has known card, use it
          resultActionCards[index] = card !== '??' ? card : newActionCards[index];
        });

        // if cards are the same, use old hole action
        if (oldActionCards.join('') === newActionCards.join('')) {
          resultHoleActions.push(oldAction);
        } else {
          // if cards are different, use new hole action with replaced cards
          resultHoleActions.push(
            newMatchingHoleAction.replace(newActionCards.join(''), resultActionCards.join(''))
          );
        }
      } else {
        // if no new matching hole action, use old action
        resultHoleActions.push(oldAction);
      }
    }

    // new hole actions in new hand, and unsafe merge is allowed
    if (newHoleActions.length > oldHoleActions.length && effectiveAllowUnsafeMerge) {
      const newHoleActionsToAdd = newHoleActions.reduce((acc, newAction) => {
        // if old hole actions doesn't include a hole action for player, which hole action is present in new hand
        if (
          !oldHoleActions.some(
            oldAction => getActionPlayerIndex(oldAction) === getActionPlayerIndex(newAction)
          )
        ) {
          // add new hole action to result hole actions
          acc.push(newAction);
        }
        return acc;
      }, [] as Action[]);
      // add new hole actions to result hole actions
      resultHoleActions.push(...newHoleActionsToAdd);
    }

    // Step 3: Make sure the common prefix actions are fine, and ready to be merged
    const oldActions = oldHand.actions || [];
    const newActions = newHand.actions || [];
    // get common actions and replace dealer hole actions with result hole actions
    // to make sure that dealer hole actions have relevant cards
    const commonActions = getCommonActions(oldActions, newActions).map(action => {
      if (getActionType(action) === ACTION_DEAL_HOLE) {
        return (
          resultHoleActions.find(
            holeAction => getActionPlayerIndex(holeAction) === getActionPlayerIndex(action)
          ) ?? action
        );
      }
      return action;
    });

    // Step 4: Add remaining actions
    const remainingActions = newActions.slice(commonActions.length);

    // Always validate actions strictly - treat all cases as client processing for security
    const hasDealerActions = remainingActions.some(action => {
      const actionType = getActionType(action);
      return actionType === ACTION_DEAL_HOLE || actionType === ACTION_DEAL_BOARD;
    });

    // Check if there are non-author actions (only relevant if author is specified)
    let hasOtherAuthorActions = false;
    if (newHand.author) {
      hasOtherAuthorActions = remainingActions.some(action => {
        const actionType = getActionType(action);
        const actionPlayerIndex = getActionPlayerIndex(action);

        // Messages are always allowed
        if (actionType === ACTION_MESSAGE) {
          return false;
        }

        // If it's the author's action, it's allowed
        const authorIndex = Hand.getAuthorPlayerIndex(newHand);
        if (actionPlayerIndex === authorIndex) {
          return false;
        }

        // Any other player action is not allowed
        return true;
      });
    } else {
      // When author is undefined (server state), check if there are any non-message player actions
      // These should be rejected unless allowUnsafeMerge is true
      hasOtherAuthorActions = remainingActions.some(action => {
        const actionType = getActionType(action);
        // Messages are always allowed
        return actionType !== ACTION_MESSAGE;
      });
    }

    // Determine if remaining actions should be appended
    const hasProblematicActions = hasDealerActions || hasOtherAuthorActions;
    const shouldAppendActions = !hasProblematicActions || effectiveAllowUnsafeMerge;

    if (shouldAppendActions && remainingActions.length > 0) {
      // Check if these are only the author's own actions (no dealer or other player actions)
      const isOnlyAuthorActions = newHand.author && !hasDealerActions && !hasOtherAuthorActions;

      if (isOnlyAuthorActions) {
        // Update timestamp on the last action to current time
        const actionsToAppend = [...remainingActions];
        const lastIndex = actionsToAppend.length - 1;
        const lastAction = actionsToAppend[lastIndex];

        // Replace existing timestamp or add new one
        const timestampIndex = lastAction.indexOf('#');
        if (timestampIndex !== -1) {
          // Replace existing timestamp
          actionsToAppend[lastIndex] = lastAction.substring(0, timestampIndex) + '#' + Date.now();
        } else {
          // Add new timestamp
          actionsToAppend[lastIndex] = lastAction + ' #' + Date.now();
        }

        commonActions.push(...actionsToAppend);
      } else {
        // Append actions without timestamp modification
        commonActions.push(...remainingActions);
      }
    }

    // Step 5: Handle intent changes for existing players
    let mergedIntents = Array.isArray(oldHand._intents) ? [...oldHand._intents] : undefined;
    let mergedInactive = Array.isArray(oldHand._inactive) ? [...oldHand._inactive] : undefined;

    if (Array.isArray(newHand._intents) && newHand.author) {
      const authorIdx = getAuthorPlayerIndex(newHand);

      // Reject if author doesn't exist in players array
      if (authorIdx === -1) {
        return oldHand;
      }

      // Author can only change their own intent
      if (authorIdx >= 0 && authorIdx < newHand.players.length) {
        // Validate intent value (0, 1, 2, or 3)
        const newIntent = newHand._intents[authorIdx];
        if (newIntent === 0 || newIntent === 1 || newIntent === 2 || newIntent === 3) {
          if (!Array.isArray(mergedIntents)) {
            mergedIntents = new Array(oldHand.players.length).fill(0);
          }
          mergedIntents[authorIdx] = newIntent;

          // Update _inactive based on intent change
          if (!Array.isArray(mergedInactive)) {
            mergedInactive = new Array(oldHand.players.length).fill(0);
          }

          // If intent is 1, 2, or 3 (pause/leave), player stays active
          // advance() will handle auto-fold for active players with intent > 0
          // We DON'T make them inactive here because they need to auto-fold first
          // If intent is 0 (resume) from pause state, player stays inactive until next hand
          // (server controls when they become active again)
        } else {
          // Invalid intent value - return unchanged
          return oldHand;
        }
      }
    }

    // Step 6: Create merged hand
    const mergedHand: Hand = {
      ...oldHand,
      actions: [...commonActions],
      author: undefined,
    };

    // Only include _intents if it exists or was modified
    if (mergedIntents) {
      mergedHand._intents = mergedIntents;
    }

    // Include _inactive if it exists or was modified due to intent change
    if (mergedInactive) {
      mergedHand._inactive = mergedInactive;
    }

    // Preserve _deadBlinds - this remains server-controlled
    if (Array.isArray(oldHand._deadBlinds)) {
      mergedHand._deadBlinds = oldHand._deadBlinds;
    }

    // Validate generated hand
    return Hand(mergedHand);
  }

  // Validate state combinations - reject invalid states
  function isValidStateCombination(hand: Hand): boolean {
    // Check if _inactive and _deadBlinds arrays exist
    if (!Array.isArray(hand._inactive) || !Array.isArray(hand._deadBlinds)) {
      // If arrays don't exist, consider it valid (no state to validate)
      return true;
    }

    // Validate that arrays have same length
    if (hand._inactive.length !== hand._deadBlinds.length) {
      return false;
    }

    // Note: Active players CAN have dead blinds when returning from pause.
    // Game() constructor charges the debt when hand starts.

    return true;
  }

  // Helper function to check if arrays are equal or one is a prefix of another
  // Arrays can only be extended (players added), never contracted (players removed)
  function isArrayPrefixOrEqual(arr1: any[], arr2: any[]): boolean {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
      return false;
    }

    // Case 1: Arrays are equal
    if (arr1.length === arr2.length) {
      return JSON.stringify(arr1) === JSON.stringify(arr2);
    }

    // Case 2: arr2 is a prefix of arr1 (client doesn't know about new players)
    if (arr2.length < arr1.length) {
      return arr2.every(
        (element, index) => JSON.stringify(element) === JSON.stringify(arr1[index])
      );
    }

    // Case 3: arr1 is a prefix of arr2 (client is adding new players)
    if (arr1.length < arr2.length) {
      return arr1.every(
        (element, index) => JSON.stringify(element) === JSON.stringify(arr2[index])
      );
    }

    return false;
  }

  // Check if two hands are compatible for merging
  function areHandsCompatible(hand1: Hand, hand2: Hand): boolean {
    // Critical fields that must match exactly
    const criticalFields: (keyof Hand)[] = [
      'variant',
      'venue',
      'currency',
      'table',
      'seed',
      'hand',
      // 'winnings', YF: cant compare === because it's an array
      'rake',
      'rakePercentage',
      'anteTrimming',
      'timeLimit',
    ];

    for (const field of criticalFields) {
      if (
        hand1[field] !== undefined &&
        hand2[field] !== undefined &&
        hand1[field] !== hand2[field]
      ) {
        return false;
      }
    }

    // Player-related structural array fields that can be extended (new players joining)
    // These arrays must be equal or one must be a prefix of another
    // Note: _intents, _inactive, _deadBlinds are state arrays handled separately in merge logic
    const playerArrayFields: (keyof Hand)[] = [
      'players',
      'startingStacks',
      'blindsOrStraddles',
      'antes',
      'seats',
      '_venueIds',
      'timeBanks',
    ];

    for (const field of playerArrayFields) {
      if (hand1[field] !== undefined && hand2[field] !== undefined) {
        const arr1 = hand1[field] as any[];
        const arr2 = hand2[field] as any[];

        if (!isArrayPrefixOrEqual(arr1, arr2)) {
          return false;
        }
      }
    }

    // Betting structure fields
    const bettingFields: (keyof Hand)[] = ['minBet', 'smallBet', 'bigBet', 'bringIn'];

    for (const field of bettingFields) {
      if (
        hand1[field] !== undefined &&
        hand2[field] !== undefined &&
        hand1[field] !== hand2[field]
      ) {
        return false;
      }
    }

    return true;
  }

  // Get only common actions
  function getCommonActions(oldActions: Action[], newActions: Action[]): Action[] {
    // Find common prefix length
    const prefixLen = findCommonPrefixLength(oldActions, newActions);
    if (prefixLen <= oldActions.length) {
      return oldActions;
    }
    const combined: Action[] = [];

    // Add common actions
    for (let i = 0; i < prefixLen; i++) {
      combined.push(oldActions[i]);
    }

    return combined;
  }

  // Find how many actions at the start are equivalent
  function findCommonPrefixLength(actions1: Action[], actions2: Action[]): number {
    const minLen = Math.min(actions1.length, actions2.length);
    let prefixLen = 0;

    while (prefixLen < minLen) {
      const action1 = actions1[prefixLen];
      const action2 = actions2[prefixLen];
      const actionType1 = getActionType(action1);
      const actionType2 = getActionType(action2);
      const actionPlayerIndex1 = getActionPlayerIndex(action1);
      const actionPlayerIndex2 = getActionPlayerIndex(action2);
      const actionAmount1 = getActionAmount(action1);
      const actionAmount2 = getActionAmount(action2);
      // Check if actions are equivalent
      // hole card actions are equivalent
      if (
        actionType1 === actionType2 &&
        actionPlayerIndex1 === actionPlayerIndex2 &&
        actionAmount1 === actionAmount2
      ) {
        prefixLen++;
        continue;
      }
      break; // Actions don't match
    }

    return prefixLen;
  }

  /**
   * Get remaining time for the current player's action
   * @param hand - Hand object
   * @returns Remaining time in milliseconds, or Infinity if no time limit
   */
  export function getTimeLeft(hand: Hand): number {
    // If no time limit, return Infinity (matching Game.getTimeLeft behavior)
    if (!hand.timeLimit) return Infinity;

    if (!hand.actions || hand.actions.length === 0) {
      // No actions yet, full time available
      return hand.timeLimit * 1000;
    }

    // Find the most recent timestamped action
    let mostRecentTimestamp = 0;

    for (let i = hand.actions.length - 1; i >= 0; i--) {
      const timestamp = getActionTimestamp(hand.actions[i], false);
      if (timestamp) {
        mostRecentTimestamp = timestamp;
        break;
      }
    }

    if (mostRecentTimestamp === 0) {
      // No timestamped actions, full time available
      return hand.timeLimit * 1000;
    }

    const elapsedTime = Date.now() - mostRecentTimestamp;
    // Calculate remaining time (fix operator precedence with parentheses)
    const remaining = hand.timeLimit * 1000 - elapsedTime;
    return Math.max(0, remaining);
  }

  /**
   * Compare two hands for deep equality using JSON serialization
   * @param hand1 - First hand to compare
   * @param hand2 - Second hand to compare
   * @returns True if hands are deeply equal
   */
  export function isEqual(hand1: Hand, hand2: Hand): boolean {
    return JSON.stringify(hand1) === JSON.stringify(hand2);
  }

  /**
   * Return hand from specific player's perspective, hiding other players' hole cards
   * @param hand - Hand to personalize
   * @param playerIdentifier - Player whose perspective to use (optional)
   * @returns Hand with hole cards hidden for other players
   */
  export function personalize(hand: Hand, playerIdentifier?: PlayerIdentifier): Hand {
    // If no player specified, return original hand
    if (playerIdentifier === undefined) {
      return hand;
    }

    // Get the player index to determine perspective
    const perspectiveIndex = getPlayerIndex(hand, playerIdentifier);

    // Determine author name for the personalized hand
    let authorName = '';
    if (typeof playerIdentifier === 'string') {
      authorName = playerIdentifier;
    } else if (typeof playerIdentifier === 'number' && perspectiveIndex >= 0) {
      authorName = hand.players[perspectiveIndex];
    }

    // Process actions to hide other players' hole cards
    const personalizedActions = hand.actions.map(action => {
      const actionType = getActionType(action);

      // Check if this is a hole card deal action
      if (actionType === 'dh') {
        const playerIndex = getActionPlayerIndex(action);

        // Hide cards if not the perspective player
        if (playerIndex !== perspectiveIndex) {
          // Replace cards with ????
          // Keep the action structure intact - just replace the card portion
          const cards = getActionCards(action);
          if (cards) {
            // Replace each card with ??
            const hiddenCards = cards.map(() => '??').join('');
            // Find and replace the cards in the action
            const cardsString = cards.join('');
            return action.replace(cardsString, hiddenCards);
          }
        }
      }

      // Keep all other actions unchanged (including showdown cards)
      return action;
    });

    // Return new hand with personalized actions and author set
    return Hand({
      ...hand,
      actions: personalizedActions,
      author: authorName,
      seed: undefined,
      _venueIds: undefined,
    });
  }

  /**
   * Advance hand by automatically handling dealer actions and timeouts
   * @param hand - Hand to advance
   * @returns Hand with new actions added if any automatic actions were needed
   */
  export function advance(hand: Hand): Hand {
    // Early return: waiting state for games without enough players
    // A poker game needs at least 2 players to start
    if (hand.players.length < 2) {
      return Hand(hand); // Return unchanged - waiting for players
    }

    // Check if we need to activate players to start the game
    // This happens when we have enough players ready to play but not enough active players
    if (
      Array.isArray(hand._inactive) &&
      Array.isArray(hand._intents) &&
      hand.actions.length === 0
    ) {
      // 1. Initialization
      const bbValue = hand.minBet;
      let activeCount = 0;

      // 2. Categorize players by intent
      const readyNowIndices: number[] = []; // Players with intent 0
      const waitForBBIndices: number[] = []; // Players with intent 1

      for (let i = 0; i < hand.players.length; i++) {
        // Count active players
        if (hand._inactive[i] === 0) {
          activeCount++;
        }
        // Categorize by intent
        if (hand._intents[i] === 0) {
          readyNowIndices.push(i);
        } else if (hand._intents[i] === 1) {
          waitForBBIndices.push(i);
        }
      }

      // 3. Check if activation is possible and needed
      const totalPotential = readyNowIndices.length + waitForBBIndices.length;

      // Already have enough active players
      if (activeCount >= 2) {
        // No activation needed
      }
      // Check if we can potentially reach minimum
      else if (activeCount + totalPotential >= 2) {
        // 4. Create copy for modifications
        const newHand = { ...hand };
        newHand._inactive = [...hand._inactive];
        newHand._intents = [...hand._intents];

        // Also copy _deadBlinds array
        if (Array.isArray(hand._deadBlinds)) {
          newHand._deadBlinds = [...hand._deadBlinds];
        } else {
          newHand._deadBlinds = new Array(hand.players.length).fill(0);
        }

        // 5. First wave: activate all players with intent = 0
        for (const index of readyNowIndices) {
          newHand._inactive[index] = 0;
          newHand._deadBlinds[index] = 0;
          // _intents[index] remains 0
        }

        // 6. Check if we have enough active players after first wave
        const currentActive = activeCount + readyNowIndices.length;

        if (currentActive < 2) {
          // 7. Second wave: need to activate waitForBB players
          let needToActivate = 2 - currentActive;

          // 7.1 Priority: activate waitForBB players who are on BB position
          for (const index of waitForBBIndices) {
            if (needToActivate > 0 && hand.blindsOrStraddles[index] === bbValue) {
              newHand._inactive[index] = 0;
              newHand._deadBlinds[index] = 0;
              newHand._intents[index] = 0; // Reset intent since they got their BB
              needToActivate--;
            }
          }

          // 7.2 Forced activation: activate remaining waitForBB if still needed
          if (needToActivate > 0) {
            for (const index of waitForBBIndices) {
              if (needToActivate > 0 && newHand._inactive[index] !== 0) {
                newHand._inactive[index] = 0;
                newHand._deadBlinds[index] = 0;
                newHand._intents[index] = 0; // Forced activation resets intent
                needToActivate--;
              }
            }
          }
        }
        // else: We have enough players, waitForBB players stay inactive

        // Continue with the modified hand (start() will assign blinds if needed)
        hand = start(newHand);
      }
    }

    // Try to start the game (assigns blinds if conditions are met)
    // Safe to call multiple times - returns unchanged if already started
    hand = start(hand);

    // Check if we should wait (not enough active players to start)
    const activePlayers = hand.players.filter(
      (_, i) => !Array.isArray(hand._inactive) || !hand._inactive[i]
    );
    const gameStarted = hand.actions.length > 0;

    if (!gameStarted && activePlayers.length < 2) {
      // Not enough players to start
      return Hand(hand);
    }

    const game = Game(hand);

    // Get next action from dealer
    const dealerAction = Command.deal(game);

    if (dealerAction) {
      // Apply dealer action and return new hand
      const result = applyAction(hand, dealerAction);
      // Recursively advance to continue generating dealer actions
      return advance(result);
    }

    // If there are no more dealer actions (e.g., all cards dealt) and the
    // betting round is over, the hand should be finished to proceed to showdown.
    const isBettingRoundOver = game.nextPlayerIndex < 0;
    const needsShowdown = game.isPlayable && isBettingRoundOver && !dealerAction;

    // If betting round is over and hand needs showdown, finish the hand
    if (needsShowdown && hand.actions.length > 0 && !isComplete(hand)) {
      return finish(hand);
    }

    // Check for timeout handling
    return handleTimeOut(hand);
  }

  /**
   * Handle timeout for current player if time limit is exceeded
   * @param hand - Hand to check for timeout
   * @returns Hand with timeout action added if needed, original hand otherwise
   */
  export function handleTimeOut(hand: Hand): Hand {
    // Check if timeLimit is set
    if (!hand.timeLimit || hand.timeLimit <= 0) {
      return Hand(hand);
    }

    // Get remaining time for current action
    const remaining = getTimeLeft(hand);

    // Check if time has expired (remaining time is 0 or less)
    if (remaining <= 0) {
      // Create game to determine current player and state
      const game = Game(hand);

      // If no player to act, return unchanged
      if (game.nextPlayerIndex < 0) {
        return Hand(hand);
      }

      // Use Command.auto to generate appropriate timeout action
      const timeoutAction = Command.auto(game, game.nextPlayerIndex);

      // Apply timeout action (applyAction already wraps in Hand())
      return applyAction(hand, timeoutAction);
    }

    return Hand(hand);
  }

  /**
   * Check if an action can be applied to the current hand state
   * @param hand - Hand to check
   * @param action - Action to validate
   * @returns True if action is valid and can be applied
   */
  export function canApplyAction(hand: Hand, action: Action): boolean {
    try {
      // Try to apply action through processor
      Game.applyAction(Game(hand), action);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a hand is complete
   * @param hand - Hand to check
   * @returns True if hand is complete, false otherwise
   */
  export function isComplete(hand: Hand): boolean {
    return hand.finishingStacks !== undefined;
  }

  /**
   * Creates a new hand from a completed hand with proper button rotation
   * @param completedHand - The completed hand to create next hand from
   * @returns New hand with rotated positions and chip continuity
   */
  export function next(completedHand: Hand): Hand {
    // Edge case: all players want to quit before game started
    // Return empty notation, game with NO players, no stacks, no blinds, no antes, no actions, no inactive, no intents, no dead blinds, no seats, no finishing stacks, no winnings
    const allWantToQuit =
      Array.isArray(completedHand._intents) &&
      completedHand._intents.length > 0 &&
      completedHand._intents.every(intent => intent === 3);
    const gameNotStarted = completedHand.actions.length === 0;

    if (allWantToQuit && gameNotStarted) {
      return Hand({
        ...completedHand,
        players: [],
        startingStacks: [],
        blindsOrStraddles: [],
        antes: [],
        actions: [],
        _inactive: [],
        _intents: [],
        _deadBlinds: [],
        seats: undefined, // Clear seats array for empty table
        finishingStacks: undefined,
        winnings: undefined,
      });
    }

    // Validate that hand is complete
    if (!isComplete(completedHand)) {
      throw new Error('Cannot create next hand from incomplete hand');
    }

    // Initialize player-related arrays BEFORE sorting to ensure they're included in sort
    const handWithArrays = {
      ...completedHand,
      _inactive: completedHand._inactive || new Array(completedHand.players.length).fill(0),
      _intents: completedHand._intents || new Array(completedHand.players.length).fill(0),
      _deadBlinds: completedHand._deadBlinds || new Array(completedHand.players.length).fill(0),
    };

    // Ensure arrays are sorted by seat order ONLY ONCE at the beginning
    let orderedHand = ensureSeatOrder(handWithArrays);

    // Check if seats are invalid and handle appropriately
    if (orderedHand.seats && orderedHand.seats.length > 0) {
      // Validate seats
      const validSeats =
        orderedHand.seats.length === orderedHand.players.length &&
        orderedHand.seats.every(seat => Number.isInteger(seat) && seat >= 1 && seat <= 9) &&
        new Set(orderedHand.seats).size === orderedHand.seats.length;

      if (!validSeats) {
        // Replace invalid seats with sequential seats [1, 2, 3...]
        orderedHand = {
          ...orderedHand,
          seats: orderedHand.players.map((_, index) => index + 1),
        };
      }
    }

    // Use the initialized arrays from orderedHand
    const _inactive = orderedHand._inactive!;
    const _intents = orderedHand._intents!;
    let _deadBlinds = orderedHand._deadBlinds!;

    // STEP 1: REMOVE PLAYERS (happens FIRST before all other operations)
    // Identify players to remove
    const playersToRemove: number[] = [];
    const finishingStacks = orderedHand.finishingStacks!;

    // First calculate rotated positions for the next hand
    const rotatedBlinds = [...orderedHand.blindsOrStraddles];
    rotatedBlinds.unshift(rotatedBlinds.pop()!);

    let rotatedAntes = orderedHand.antes ? [...orderedHand.antes] : [];
    if (rotatedAntes.length > 0) {
      rotatedAntes.unshift(rotatedAntes.pop()!);
    }

    for (let i = 0; i < orderedHand.players.length; i++) {
      // Remove if player wants to leave (_intents: 3)
      if (_intents[i] === 3) {
        playersToRemove.push(i);
        continue;
      }

      // Remove if player has zero or negative chips
      if (finishingStacks[i] <= 0) {
        playersToRemove.push(i);
        continue;
      }

      // Calculate what the player would need to pay in the next hand
      // Use the pre-calculated rotated positions
      const upcomingBlind = rotatedBlinds[i];
      const upcomingAnte = rotatedAntes[i] || 0;

      // Comprehensive chip requirement check based on poker rules
      let totalRequired = 0;

      if (_inactive[i] === 2) {
        // New player
        const bbValue = orderedHand.minBet;
        if (_intents[i] === 1 && rotatedBlinds[i] !== bbValue) {
          // Waiting for BB and not in BB, so no cost this round.
          continue;
        }
        // Otherwise, they need to be able to afford the blind/ante.
        totalRequired = upcomingBlind + upcomingAnte;
      } else if (_inactive[i] === 0) {
        // Active player
        totalRequired = upcomingBlind + upcomingAnte;
      } else if (_inactive[i] === 1) {
        // Paused player
        if (_intents[i] === 0) {
          // Wants to return
          totalRequired = upcomingBlind + upcomingAnte + _deadBlinds[i];
        } else if (_intents[i] === 1) {
          // Wait for BB
          const bbValue = orderedHand.minBet;
          if (rotatedBlinds[i] === bbValue) {
            totalRequired = upcomingBlind + upcomingAnte;
          } else {
            continue;
          }
        } else if (_intents[i] === 2) {
          // Still pausing
          totalRequired = upcomingBlind + upcomingAnte;
        }
      }

      // Remove if can't afford required amount
      if (totalRequired > 0 && finishingStacks[i] < totalRequired) {
        playersToRemove.push(i);
      }
    }

    // Filter all arrays to remove players
    const keepIndices = Array.from({ length: orderedHand.players.length }, (_, i) => i).filter(
      i => !playersToRemove.includes(i)
    );

    // Filter all arrays
    const filteredPlayers = keepIndices.map(i => orderedHand.players[i]);
    const filteredStacks = keepIndices.map(i => finishingStacks[i]);
    const filteredBlinds = keepIndices.map(i => orderedHand.blindsOrStraddles[i]);
    const filteredAntes = keepIndices.map(i => orderedHand.antes?.[i] || 0);
    const filteredInactive = keepIndices.map(i => _inactive[i]);
    const filteredIntents = keepIndices.map(i => _intents[i]);
    const filteredDeadBlinds = keepIndices.map(i => _deadBlinds[i]);

    // Filter optional arrays only if they exist
    const filteredSeats = orderedHand.seats
      ? keepIndices.map(i => orderedHand.seats![i])
      : undefined;
    const filteredVenueIds = orderedHand._venueIds
      ? keepIndices.map(i => orderedHand._venueIds![i])
      : undefined;
    const filteredTimeBanks = orderedHand.timeBanks
      ? keepIndices.map(i => orderedHand.timeBanks![i])
      : undefined;
    const filteredHeroIds = orderedHand._heroIds
      ? keepIndices.map(i => orderedHand._heroIds![i])
      : undefined;

    // STEP 2: ROTATE POSITIONS AND RECALCULATE BLINDS
    // After removing players, we need to recalculate blinds properly
    let nextRotatedBlinds: number[];

    // BB value: minBet for No-Limit, smallBet for Fixed-Limit
    const bbValueForCalc = (orderedHand.minBet ?? orderedHand.smallBet) as number;

    if (filteredPlayers.length === 0) {
      nextRotatedBlinds = [];
    } else if (filteredPlayers.length === 1) {
      // Single player - gets BB
      nextRotatedBlinds = [bbValueForCalc];
    } else if (filteredPlayers.length === 2) {
      // Two players - heads up: first player SB, second BB
      const sbValue = Math.floor(bbValueForCalc / 2);
      // Rotate from previous state
      const prevBlinds = [...filteredBlinds];
      prevBlinds.unshift(prevBlinds.pop()!);
      // Determine who should have SB and BB based on rotation
      if (prevBlinds[0] > 0 || prevBlinds[1] > 0) {
        // Someone had blinds before, rotate normally
        nextRotatedBlinds = [sbValue, bbValueForCalc];
      } else {
        // No one had blinds, start fresh
        nextRotatedBlinds = [sbValue, bbValueForCalc];
      }
    } else {
      // 3+ players - normal blind structure
      const sbValue = Math.floor(bbValueForCalc / 2);

      // Check if we have complex blind structure (straddle, etc.) or players were removed
      const nonZeroBlinds = filteredBlinds.filter(b => b > 0).length;
      const playersRemoved = keepIndices.length < orderedHand.players.length;

      if (nonZeroBlinds > 2 || !playersRemoved) {
        // Complex structure (straddle, etc.) or no players removed - use simple rotation
        nextRotatedBlinds = [...filteredBlinds];
        nextRotatedBlinds.unshift(nextRotatedBlinds.pop()!);
      } else {
        // Standard structure with players removed - recalculate SB/BB positions
        // Start with zeros for all positions
        nextRotatedBlinds = new Array(filteredPlayers.length).fill(0);

        // Rotate from filtered blinds to find next button position
        const prevBlinds = [...filteredBlinds];
        prevBlinds.unshift(prevBlinds.pop()!);

        // Find BB position in rotated blinds - button is 2 positions back from BB
        const bbIndexInRotated = prevBlinds.indexOf(bbValueForCalc);
        let buttonIndex: number;

        if (bbIndexInRotated !== -1) {
          // BB found - button is 2 positions counter-clockwise from BB
          buttonIndex = (bbIndexInRotated - 2 + prevBlinds.length) % prevBlinds.length;
        } else {
          // BB not found (edge case) - use fallback logic
          buttonIndex = 0;
        }

        // Place blinds: SB is position after button, BB is position after SB
        const sbIndex = (buttonIndex + 1) % filteredPlayers.length;
        const bbIndex = (buttonIndex + 2) % filteredPlayers.length;

        nextRotatedBlinds[sbIndex] = sbValue;
        nextRotatedBlinds[bbIndex] = bbValueForCalc;
      }
    }

    // DO NOT ROTATE SEATS - keep them in ascending order
    const keptSeats = filteredSeats ? [...filteredSeats] : undefined;

    const nextRotatedAntes = [...filteredAntes];
    if (nextRotatedAntes.length > 0) {
      nextRotatedAntes.unshift(nextRotatedAntes.pop()!);
    }

    // STEP 3: PROCESS STATE TRANSITIONS AND DEAD BLINDS IN A SINGLE PASS
    const nextInactive = [...filteredInactive];
    const nextIntents = [...filteredIntents];
    const nextDeadBlinds = [...filteredDeadBlinds];
    const nextStacks = [...filteredStacks];

    // Calculate maxDeadBlinds using bbValueForCalc (defined earlier)
    const maxDeadBlinds = bbValueForCalc * 1.5;

    for (let i = 0; i < filteredPlayers.length; i++) {
      const prevInactive = filteredInactive[i];
      const prevIntent = filteredIntents[i];
      const prevDeadBlinds = filteredDeadBlinds[i];
      const stack = filteredStacks[i];
      const blindInNextHand = nextRotatedBlinds[i];
      const anteInNextHand = nextRotatedAntes[i] || 0;

      // --- 1. Determine the FUTURE inactive state ---
      let isInactiveInNextHand = false;
      if (prevInactive === 2) {
        // New player
        isInactiveInNextHand = true; // Inactive by default, until proven otherwise
      } else if (prevInactive === 1) {
        // Was already on pause
        isInactiveInNextHand = true;
      } else if (prevInactive === 0 && (prevIntent === 1 || prevIntent === 2)) {
        // Going on pause
        isInactiveInNextHand = true;
      }

      // --- 2. Check if the player can and wants to return to the game ---
      const canAffordToReturn = stack >= prevDeadBlinds + blindInNextHand + anteInNextHand;
      const wantsToReturn = prevIntent === 0;
      const mustReturnAtBB = prevIntent === 1 && blindInNextHand === bbValueForCalc;

      if ((wantsToReturn && canAffordToReturn) || mustReturnAtBB) {
        isInactiveInNextHand = false; // Player will be active
      }

      // --- 3. Apply dead blind logic based on the state TRANSITION ---

      if (isInactiveInNextHand) {
        // Player WILL BE inactive.
        nextInactive[i] = 1; // Solidify the future state

        if (prevInactive === 2) {
          // SCENARIO A: New player. SET initial debt.
          if (blindInNextHand === bbValueForCalc) {
            nextDeadBlinds[i] = 0;
          } else if (blindInNextHand > 0) {
            nextDeadBlinds[i] = bbValueForCalc * 0.5;
          } else {
            nextDeadBlinds[i] = bbValueForCalc;
          }
        } else {
          // SCENARIO B: Existing player is sitting out (was already paused or just paused). ACCUMULATE debt.
          if (blindInNextHand > 0 && prevDeadBlinds < maxDeadBlinds) {
            const amountToAdd =
              blindInNextHand === bbValueForCalc ? bbValueForCalc : bbValueForCalc * 0.5;
            nextDeadBlinds[i] = Math.min(prevDeadBlinds + amountToAdd, maxDeadBlinds);
          }
        }
      } else {
        // Player WILL BE active.
        nextInactive[i] = 0; // Solidify the future state

        if (mustReturnAtBB) {
          // SCENARIO C: Returning at BB. FORGIVE debt.
          nextDeadBlinds[i] = 0;
          nextIntents[i] = 0; // Reset intent
        } else if (prevInactive !== 0) {
          // SCENARIO D: Returning from inactive. Preserve dead blind for Game() to charge.
          nextDeadBlinds[i] = prevDeadBlinds;
        } else {
          // SCENARIO E: Was already active. Dead blind (if any) was already paid by Game().
          nextDeadBlinds[i] = 0;
        }
      }
    }

    // STEP 4: SKIP INACTIVE PLAYERS FOR BLIND ASSIGNMENT
    // Inactive players should have blindsOrStraddles = 0
    // Their blinds shift to next active player
    const adjustedBlinds = new Array(filteredPlayers.length).fill(0);

    // Count inactive players to determine if we need to apply skip logic
    const hasInactivePlayers = nextInactive.some(i => i !== 0);

    // Calculate blind values from ROTATED array (not original bbValue) because rotation
    // may have recalculated blinds based on minBet when players were removed
    const rotatedBbValue = nextRotatedBlinds.length > 0 ? Math.max(...nextRotatedBlinds) : 0;
    const rotatedSbValue = Math.floor(rotatedBbValue / 2);

    // Find who has blinds in the rotated array
    const theoreticalSbIndex = nextRotatedBlinds.indexOf(rotatedSbValue);
    const theoreticalBbIndex = nextRotatedBlinds.indexOf(rotatedBbValue);

    // Check for complex blind structure (straddle - more than 2 non-zero blinds)
    const nonZeroBlindsCount = nextRotatedBlinds.filter(b => b > 0).length;
    const hasComplexStructure = nonZeroBlindsCount > 2;

    // Only apply skip-inactive logic when there are inactive players
    // Otherwise, use the rotated blinds as-is to preserve non-standard blind structures
    if (
      hasInactivePlayers &&
      (theoreticalSbIndex !== -1 || theoreticalBbIndex !== -1) &&
      !hasComplexStructure
    ) {
      // Find the button position (2 positions before BB, or 1 before SB)
      let buttonIndex: number;
      if (theoreticalBbIndex !== -1) {
        buttonIndex = (theoreticalBbIndex - 2 + filteredPlayers.length) % filteredPlayers.length;
      } else if (theoreticalSbIndex !== -1) {
        buttonIndex = (theoreticalSbIndex - 1 + filteredPlayers.length) % filteredPlayers.length;
      } else {
        buttonIndex = 0;
      }

      // Find next ACTIVE player after button for SB
      let sbIndex = -1;
      for (let offset = 1; offset <= filteredPlayers.length; offset++) {
        const idx = (buttonIndex + offset) % filteredPlayers.length;
        if (nextInactive[idx] === 0) {
          sbIndex = idx;
          break;
        }
      }

      // Find next ACTIVE player after SB for BB
      let bbIndex = -1;
      if (sbIndex !== -1) {
        for (let offset = 1; offset <= filteredPlayers.length; offset++) {
          const idx = (sbIndex + offset) % filteredPlayers.length;
          if (nextInactive[idx] === 0 && idx !== sbIndex) {
            bbIndex = idx;
            break;
          }
        }
      }

      // Assign blinds to active players only
      if (sbIndex !== -1 && bbIndex !== -1 && sbIndex !== bbIndex) {
        adjustedBlinds[sbIndex] = rotatedSbValue;
        adjustedBlinds[bbIndex] = rotatedBbValue;
      } else if (sbIndex !== -1 && (bbIndex === -1 || sbIndex === bbIndex)) {
        // Only one active player or same player - they get BB
        adjustedBlinds[sbIndex] = rotatedBbValue;
      }
    } else if (hasInactivePlayers && hasComplexStructure) {
      // Complex blind structure with inactive players - zero inactive but keep structure
      for (let i = 0; i < filteredPlayers.length; i++) {
        if (nextInactive[i] === 0) {
          adjustedBlinds[i] = nextRotatedBlinds[i];
        }
      }
    } else {
      // No inactive players - use rotated blinds as-is
      for (let i = 0; i < filteredPlayers.length; i++) {
        adjustedBlinds[i] = nextRotatedBlinds[i];
      }
    }

    // STEP 5: ZERO ANTES FOR INACTIVE PLAYERS
    const adjustedAntes = nextRotatedAntes.map((ante, i) => (nextInactive[i] === 0 ? ante : 0));

    // Generate new unique ID and seed
    const timestamp = Date.now();
    const newSeed = Math.floor(Math.random() * 1000000000);

    // Create new hand with processed data
    const nextHand: Hand = {
      ...orderedHand,

      // Use filtered and processed data
      players: filteredPlayers,
      startingStacks: nextStacks,
      blindsOrStraddles: adjustedBlinds,
      antes: adjustedAntes,
      seats: keptSeats, // Keep seats in ascending order, NO ROTATION
      _venueIds: filteredVenueIds,
      _inactive: nextInactive,
      _intents: nextIntents,
      _deadBlinds: nextDeadBlinds,

      // New unique identifiers
      hand: (orderedHand.hand || 0) + 1,
      seed: newSeed,

      // Reset action state for new hand
      actions: [],
      finishingStacks: undefined,
      winnings: undefined,
      rake: undefined,
      totalPot: undefined,

      // Update timestamp
      time: new Date().toISOString(),
      timestamp: timestamp,
    };

    if (
      nextHand.blindsOrStraddles.filter((c, i) => {
        return c !== 0 && nextHand?._inactive?.[i] === 0;
      }).length < 2 &&
      nextHand.players.filter((p, i) => nextHand?._inactive?.[i] === 0).length >= 2
    ) {
      throw new Error('Next hand must have at least 2 active players with blindsOrStraddles');
    }

    // Add optional arrays only if they were defined in the input
    if (filteredTimeBanks !== undefined) {
      nextHand.timeBanks = filteredTimeBanks;
    }
    if (filteredHeroIds !== undefined) {
      nextHand._heroIds = filteredHeroIds;
    }

    // Remove author field from new hand
    delete (nextHand as Partial<Hand>).author;

    return Hand(nextHand);
  }

  /**
   * Finish a hand by extracting finishing data from the game state
   * @param hand - Hand to finish
   * @returns Finished hand
   */
  export function finish(hand: Hand): Hand {
    return Hand(Game.finish(Game(hand), hand));
  }

  /**
   * Player join information for adding a new player to the table
   */
  export interface JoinHand {
    /** Player's display name */
    playerName: string;
    /** Desired stack amount (chips) */
    buyIn: number;
    /** Preferred seat number */
    seat?: number;
  }

  /**
   * Adds a new player to the hand by expanding all player-related arrays
   * Client method: Only modifies data structure and _intents
   * @param hand - Current hand state
   * @param player - Player info with name, stack, seat preference
   * @returns Hand with new player added, _intents set to 0 (ready to play)
   */
  export function join(hand: Hand, player: JoinHand): Hand {
    // Validation: Check player name exists
    // Validation: Check buyIn is positive
    // Validation: Check for duplicate player names
    // Validation: Check if table is full
    if (
      !player.playerName ||
      player.playerName === '' ||
      player.buyIn <= 0 ||
      hand.players.includes(player.playerName) ||
      (hand.seatCount && hand.players.length >= hand.seatCount)
    ) {
      return hand;
    }

    // Validation: Check seat preference if provided
    if (player.seat !== undefined) {
      // Check if seat is a positive integer within poker limits (1-9)
      if (!Number.isInteger(player.seat) || player.seat < 1 || player.seat > 9) {
        return hand;
      }
      // Check if seat is within table limits
      if (hand.seatCount && player.seat > hand.seatCount) {
        return hand;
      }
      // Check if seat is already taken
      if (hand.seats && hand.seats.includes(player.seat)) {
        return hand;
      }
    }

    // Create new hand with expanded arrays
    // New players always get blindsOrStraddles = 0, advance() assigns blinds when game starts
    const newHand: Hand = {
      ...hand,
      author: player.playerName,
      players: [...hand.players, player.playerName],
      startingStacks: [...hand.startingStacks, player.buyIn],
      blindsOrStraddles: [...hand.blindsOrStraddles, 0],
    };

    // Handle antes array
    newHand.antes = [...(hand.antes ?? new Array(hand.players.length).fill(0)), 0];

    // Handle _intents array
    newHand._intents = [...(hand._intents ?? new Array(hand.players.length).fill(0)), 0];

    // Handle _inactive array - set new player as inactive (state: 2 = new player)
    newHand._inactive = [...(hand._inactive ?? new Array(hand.players.length).fill(0)), 2];

    // Handle _deadBlinds array - must match _inactive length for validation
    newHand._deadBlinds = [...(hand._deadBlinds ?? new Array(hand.players.length).fill(0)), 0];

    // Handle seats array if seat preference specified
    if (player.seat !== undefined) {
      if (Array.isArray(hand.seats)) {
        newHand.seats = [...hand.seats, player.seat];
      } else {
        // Create seats array with sequential values for existing players
        newHand.seats = new Array(hand.players.length).fill(0).map((_, i) => i + 1);
        newHand.seats.push(player.seat);
      }
    } else if (Array.isArray(hand.seats)) {
      // No seat preference, but seats array exists - add next available
      const maxSeat = Math.max(...hand.seats);
      newHand.seats = [...hand.seats, maxSeat + 1];
    }

    return newHand;
  }

  /**
   * Sets author's intent to leave the table permanently
   * Client method: Only modifies _intents to 3
   * @param hand - Current hand state with author field
   * @param playerIdentifier - Optional player identifier (used when hand is authorless)
   * @returns Hand with player's _intents set to 3
   */
  export function quit(hand: Hand, playerIdentifier?: PlayerIdentifier): Hand {
    let authorName =
      typeof playerIdentifier === 'string'
        ? hand.players.find(name => name === playerIdentifier)
        : hand.players.find((_, index) => index === (playerIdentifier ?? -1));
    if (!authorName) {
      authorName = hand.author;
    }
    // Priority logic: playerIdentifier takes precedence over author
    let targetIndex: number = -1;

    if (playerIdentifier !== undefined) {
      // Case 1: playerIdentifier provided - use it (takes precedence)
      targetIndex = getPlayerIndex(hand, playerIdentifier);
    } else if (hand.author) {
      // Case 2: No playerIdentifier but author exists - fallback to author
      targetIndex = getAuthorPlayerIndex(hand);
    }

    // Case 3: No valid identification - return unchanged
    if (targetIndex === -1) {
      return hand;
    }

    // Create new hand
    const newHand: Hand = { ...hand, author: authorName };

    // Handle _intents array
    if (Array.isArray(hand._intents)) {
      newHand._intents = [...hand._intents];
      newHand._intents[targetIndex] = 3;
    } else {
      // Create _intents array if missing
      newHand._intents = new Array(hand.players.length).fill(0);
      newHand._intents[targetIndex] = 3;
    }

    return newHand;
  }

  /**
   * Sets author's intent to take an immediate pause
   * Client method: Only modifies _intents to 2
   * @param hand - Current hand state with author field
   * @param playerIdentifier - Optional player identifier (used when hand is authorless)
   * @returns Hand with player's _intents set to 2
   */
  export function pause(hand: Hand, playerIdentifier?: PlayerIdentifier): Hand {
    let authorName =
      typeof playerIdentifier === 'string'
        ? hand.players.find(name => name === playerIdentifier)
        : hand.players.find((_, index) => index === (playerIdentifier ?? -1));
    if (!authorName) {
      authorName = hand.author;
    }
    // Priority logic: playerIdentifier takes precedence over author
    let targetIndex: number = -1;

    if (playerIdentifier !== undefined) {
      // Case 1: playerIdentifier provided - use it (takes precedence)
      targetIndex = getPlayerIndex(hand, playerIdentifier);
    } else if (hand.author) {
      // Case 2: No playerIdentifier but author exists - fallback to author
      targetIndex = getAuthorPlayerIndex(hand);
    }

    // Case 3: No valid identification - return unchanged
    if (targetIndex === -1) {
      return hand;
    }

    // Create new hand
    const newHand: Hand = { ...hand, author: authorName };

    // Handle _intents array
    newHand._intents = [...(hand._intents ?? new Array(hand.players.length).fill(0))];
    newHand._intents[targetIndex] = 2;

    return newHand;
  }

  /**
   * Sets author's intent to wait for BB position before returning
   * Client method: Only modifies _intents to 1
   *
   * _inactive changes are handled ONLY in next() between hands.
   * This prevents players from changing their active status mid-game.
   *
   * @param hand - Current hand state with author field
   * @param playerIdentifier - Optional player identifier (used when hand is authorless)
   * @returns Hand with player's _intents set to 1
   */
  export function waitForBB(hand: Hand, playerIdentifier?: PlayerIdentifier): Hand {
    let authorName =
      typeof playerIdentifier === 'string'
        ? hand.players.find(name => name === playerIdentifier)
        : hand.players.find((_, index) => index === (playerIdentifier ?? -1));
    if (!authorName) {
      authorName = hand.author;
    }
    // Priority logic: playerIdentifier takes precedence over author
    let targetIndex: number = -1;

    if (playerIdentifier !== undefined) {
      // Case 1: playerIdentifier provided - use it (takes precedence)
      targetIndex = getPlayerIndex(hand, playerIdentifier);
    } else if (hand.author) {
      // Case 2: No playerIdentifier but author exists - fallback to author
      targetIndex = getAuthorPlayerIndex(hand);
    }

    // Case 3: No valid identification - return unchanged
    if (targetIndex === -1) {
      return hand;
    }

    // Create new hand
    const newHand: Hand = { ...hand, author: authorName };

    // Handle _intents array
    if (Array.isArray(hand._intents)) {
      newHand._intents = [...hand._intents];
      newHand._intents[targetIndex] = 1;
    } else {
      // Create _intents array if missing
      newHand._intents = new Array(hand.players.length).fill(0);
      newHand._intents[targetIndex] = 1;
    }

    // NOTE: _inactive is NOT modified here - only next() changes _inactive between hands

    // Try to start the game if we have enough active players
    return start(newHand);
  }

  export const queue = waitForBB;

  /**
   * Sets author's intent to resume active play
   * Client method: Only modifies _intents to 0
   *
   * _inactive and _deadBlinds changes are handled ONLY in next() between hands.
   * This prevents players from changing their active status mid-game.
   *
   * @param hand - Current hand state with author field
   * @param playerIdentifier - Optional player identifier (used when hand is authorless)
   * @returns Hand with player's _intents set to 0
   */
  export function resume(hand: Hand, playerIdentifier?: PlayerIdentifier): Hand {
    let authorName =
      typeof playerIdentifier === 'string'
        ? hand.players.find(name => name === playerIdentifier)
        : hand.players.find((_, index) => index === (playerIdentifier ?? -1));
    if (!authorName) {
      authorName = hand.author;
    }
    // Priority logic: playerIdentifier takes precedence over author
    let targetIndex: number = -1;

    if (playerIdentifier !== undefined) {
      // Case 1: playerIdentifier provided - use it (takes precedence)
      targetIndex = getPlayerIndex(hand, playerIdentifier);
    } else if (hand.author) {
      // Case 2: No playerIdentifier but author exists - fallback to author
      targetIndex = getAuthorPlayerIndex(hand);
    }

    // Case 3: No valid identification - return unchanged
    if (targetIndex === -1) {
      return hand;
    }

    // Create new hand
    const newHand: Hand = { ...hand, author: authorName };

    // Handle _intents array
    if (Array.isArray(hand._intents)) {
      newHand._intents = [...hand._intents];
      newHand._intents[targetIndex] = 0;
    } else {
      // Create _intents array if missing
      newHand._intents = new Array(hand.players.length).fill(0);
      // targetIndex already defaults to 0, no need to set again
    }

    // NOTE: _inactive and _deadBlinds are NOT modified here
    // Only next() changes _inactive and _deadBlinds between hands

    // Try to start the game if we now have enough active players
    return start(newHand);
  }

  /**
   * Validates a hand object
   * @param hand - Hand object to validate
   * @returns True if the hand object is valid, false otherwise
   */
  export function validate(hand: any): hand is Hand {
    const required = ['players', 'startingStacks', 'blindsOrStraddles', 'antes', 'actions'];
    for (const field of required) {
      if (!hand[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(hand.players)) {
      throw new Error('players must be an array');
    }
    const seatCount = Math.min(hand.seatCount ?? 9, 9);
    if (hand.players.length > seatCount) {
      throw new Error(
        `Game cannot have more players than seats. Players: ${hand.players.length}, Seats: ${seatCount}`
      );
    }

    if (!Array.isArray(hand.startingStacks) || hand.startingStacks.length !== hand.players.length) {
      throw new Error('startingStacks must be an array matching players length');
    }

    if (
      !Array.isArray(hand.blindsOrStraddles) ||
      hand.blindsOrStraddles.length !== hand.players.length
    ) {
      throw new Error('blindsOrStraddles must be an array matching players length');
    }

    // if (
    //   !Array.isArray(hand.blindsOrStraddles) ||
    //   hand.blindsOrStraddles.length !== hand.players.length
    // ) {
    //   throw new Error('antes must be an array matching players length');
    // }

    if (!Array.isArray(hand.actions)) {
      throw new Error('actions must be an array');
    }
    const variant = hand.variant;
    let bb = 0;
    let sb = 0;

    // No-limit variants need minBet
    if (variant === 'NT' || variant === 'NS' || variant === 'PO' || variant === 'N2L1D') {
      if (typeof hand.minBet !== 'number' || hand.minBet <= 0) {
        throw new Error(`No-limit variant ${variant} requires positive minBet`);
      }
      bb = hand.minBet;
      sb = Math.floor(bb / 2);
      // Fixed-limit variants need smallBet and bigBet
    } else if (variant === 'FT' || variant === 'FO/8' || variant === 'F2L3D' || variant === 'FB') {
      if (typeof hand.smallBet !== 'number' || hand.smallBet <= 0) {
        throw new Error(`Fixed-limit variant ${variant} requires positive smallBet`);
      }
      if (typeof hand.bigBet !== 'number' || hand.bigBet <= 0) {
        throw new Error(`Fixed-limit variant ${variant} requires positive bigBet`);
      }
      bb = hand.smallBet;
      sb = Math.floor(bb / 2);
      // Stud variants need smallBet, bigBet, and bringIn
    } else if (variant === 'F7S' || variant === 'F7S/8' || variant === 'FR') {
      if (typeof hand.smallBet !== 'number' || hand.smallBet <= 0) {
        throw new Error(`Stud variant ${variant} requires positive smallBet`);
      }
      if (typeof hand.bigBet !== 'number' || hand.bigBet <= 0) {
        throw new Error(`Stud variant ${variant} requires positive bigBet`);
      }
      if (typeof hand.bringIn !== 'number' || hand.bringIn <= 0) {
        throw new Error(`Stud variant ${variant} requires positive bringIn`);
      }
    } else {
      throw new Error(`Unknown variant: ${variant}`);
    }

    // Validate SB/BB are posted when 2+ active players
    const activePlayerIndices = hand.players
      .map((_: any, i: number) => i)
      .filter((i: number) => !hand._inactive || hand._inactive[i] === 0);

    if (activePlayerIndices.length >= 2 && bb > 0 && sb > 0) {
      if (!hand.blindsOrStraddles.includes(bb as number)) {
        throw new Error(`blindsOrStraddles must contain Big Blind (${bb})`);
      }
      if (sb > 0 && !hand.blindsOrStraddles.includes(sb as number)) {
        throw new Error(`blindsOrStraddles must contain Small Blind (${sb})`);
      }
    }

    // Validate inactive player constraints: inactive players cannot have positional blinds or antes
    if (hand._inactive && Array.isArray(hand._inactive)) {
      for (let i = 0; i < hand._inactive.length; i++) {
        if (hand._inactive[i] !== 0) {
          // Inactive player (sitting out=1 or new player=2)
          if (hand.blindsOrStraddles[i] !== 0) {
            throw new Error(
              `Inactive player at index ${i} cannot have blindsOrStraddles (got ${hand.blindsOrStraddles[i]})`
            );
          }
          if (hand.antes && hand.antes[i] !== 0) {
            throw new Error(
              `Inactive player at index ${i} cannot have antes (got ${hand.antes[i]})`
            );
          }
        }
      }
    }

    return hand;
  }
}
