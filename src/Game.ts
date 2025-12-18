import { Hand } from './Hand';
import { setPlayerAnte, setPlayerBet } from './game/betting';
import { getCurrentPlayerIndex as getCurrentPlayerIndexOriginal } from './game/position';
import { applyAction as coreApplyAction } from './game/progress';
import { createStatsEntry } from './stats/stats';
import type { StreetStat } from './stats/types';
import type { Action, Card, Player, PlayerIdentifier, Street, Variant } from './types';

/**
 * Represents the current state of the table
 */
export interface Game {
  /** Name of the venue where the hand was played */
  venue: string;
  /** Unique identifier for the game (new) */
  table: string;
  /** Ante trimming status */
  anteTrimmingStatus?: boolean;
  /** Hand identifier */
  hand: number;
  /** Timestamp of the game start */
  gameTimestamp: number;
  /** Game variant being played (e.g. NT for No-Limit Texas Hold'em) */
  variant: Variant;
  /** Array of players at the table with their current state */
  players: Player[];
  /** Community cards on the board */
  board: Card[];
  /** Total amount of chips in the pot */
  pot: number;
  /** Current betting round (preflop, flop, turn, river) */
  street: Street;
  /** Current bet amount that players need to call */
  bet: number;
  /** Big blind amount */
  bigBlind: number;
  /** Minimum bet amount possible, typically big blind */
  minBet: number;
  /** Last legal bet amount */
  lastCompleteBet: number;
  /** Random seed for deterministic card dealing */
  seed?: number;
  /** Number of cards that have been dealt in the hand */
  usedCards: number;
  /** Shuffled deck of cards for deterministic dealing */
  deck?: string[];
  /** Index of the dealer button position (0-based) */
  buttonIndex: number;
  /** Index of the small blind position (0-based) */
  smallBlindIndex: number;
  /** Index of the big blind position (0-based) */
  bigBlindIndex: number;
  /** Last action taken in the current street */
  lastAction?: Action;
  /** Last bet/raise action in the current street */
  lastBetAction?: Action;
  /** Whether the current betting round is complete (all active players have acted and matched bets) */
  isBettingComplete?: boolean;
  /** Whether the hand is complete (showdown or all but one player folded) */
  isComplete?: boolean;
  /** Last player action in the current street, undefined if no player has acted yet */
  lastPlayerAction?: Action;
  /** Amount taken by the house from the pot */
  rake?: number;
  /** Rake percentage used to calculate rake when absolute amount is not provided (0.05 = 5%) */
  rakePercentage?: number;
  /** Rake cap used to limit the rake amount */
  rakeCap?: number;
  /** Game statistics tracker */
  stats: readonly StreetStat[];
  /** Index of the next player to act */
  nextPlayerIndex: number;
  /** Whether the hand is a showdown hand */
  isShowdown: boolean;
  /** Whether the hand is a run out hand */
  isRunOut: boolean;
  /** Timestamp of the last action */
  lastTimestamp?: number;
  /** Time limit per action in seconds */
  timeLimit?: number;
  /** Total number of seats at the table */
  seatCount: number;
  /** Whether the game is valid (has enough active players) */
  isPlayable: boolean;
}

// Does this variant typically have blinds? (vs. stud bring-in)
export function needsBlinds(variant: Variant): boolean {
  switch (variant) {
    case 'F7S':
    case 'F7S/8':
    case 'FR':
      return false; // Stud-like
    default:
      return true;
  }
}

/**
 * Creates a new game state from a hand
 * @param hand - The hand to create a game from
 * @param actions - The actions to apply to the game
 * @returns The created game
 */
export function Game(hand: Hand | Game, actions?: Action[]): Game {
  if (Game.isGame(hand)) {
    return hand;
  }
  Hand.validate(hand);
  actions ||= hand.actions;

  // Figure out who's SB/BB and button based on stradles, ignoring inactive players
  const gameName = String(hand.table || Math.random());
  const timestamp = hand.timestamp || Date.now();
  const smallBlindIndex = hand.blindsOrStraddles.indexOf(
    Math.min(...hand.blindsOrStraddles.filter(b => b > 0))
  );
  let bigBlindIndex = (smallBlindIndex + 1) % hand.players.length;
  for (var i = 0; hand._inactive?.[bigBlindIndex] && i < hand.players.length; i++) {
    bigBlindIndex = (bigBlindIndex + 1) % hand.players.length;
  }
  let activePlayers = hand.players.filter((_, i) => !hand._inactive?.[i]);
  let buttonIndex =
    activePlayers.length == 2
      ? smallBlindIndex
      : (smallBlindIndex - 1 + hand.players.length) % hand.players.length;
  for (var i = 0; hand._inactive?.[buttonIndex] && i < hand.players.length; i++) {
    buttonIndex = (buttonIndex - 1 + hand.players.length) % hand.players.length;
  }

  // Create initial game state
  const game: Game = {
    venue: hand.venue || 'Virtual',
    table: gameName,
    hand: hand.hand || 0,
    gameTimestamp: timestamp,
    lastTimestamp: timestamp,
    variant: hand.variant,
    players: hand.players.map((name, i) => ({
      name,
      stack: hand.startingStacks[i],
      cards: [],
      roundBet: 0,
      roundAction: null,
      totalBet: 0,
      returns: 0,
      totalInvestments: 0,
      roundInvestments: 0,
      rake: 0,
      hasActed: false,
      hasFolded: false,
      isAllIn: false,
      hasShownCards: null,
      position: i,
      winnings: 0,
      isInactive: !!hand._inactive?.[i],
    })),
    stats: [],
    board: [],
    buttonIndex,
    smallBlindIndex,
    bigBlindIndex,
    pot: 0,
    bigBlind: Math.max(...hand.blindsOrStraddles),
    bet: Math.max(...hand.blindsOrStraddles),
    minBet: hand?.minBet ?? Math.max(...hand.blindsOrStraddles),
    lastCompleteBet: Math.max(...hand.blindsOrStraddles),
    street: 'preflop',
    timeLimit: typeof hand.timeLimit === 'number' ? Math.max(0, hand.timeLimit) : undefined,
    isBettingComplete: false,
    isComplete: false,
    usedCards: 0,
    rake: hand.rake,
    rakePercentage: hand.rakePercentage ?? 0,
    rakeCap: hand.rakeCap,
    seed: hand.seed,
    nextPlayerIndex: -1,
    isShowdown: false,
    isRunOut: false,
    seatCount: hand.seatCount ?? 9,
    isPlayable: activePlayers.length >= 2,
  };

  // Post blinds/antes
  for (let i = 0; i < game.players.length; i++) {
    // Dead blinds should not be posted for inactive players
    // They will be handled when the player becomes active
    const isInactive = hand._inactive?.[i];
    const ante = (hand.antes[i] ?? 0) + (isInactive ? 0 : (hand._deadBlinds?.[i] ?? 0));
    setPlayerAnte(game, i, ante);
    if (!isInactive) {
      setPlayerBet(game, i, hand.blindsOrStraddles[i]);
    }
  }
  if (!game.venue.includes('fuzz')) {
    for (var i = 0; i < game.players.length; i++) {
      createStatsEntry(game, i);
    }
  }
  //  Now parse & apply actions from the game
  for (let i = 0; i < actions.length; i++) {
    coreApplyAction(game, actions[i]);
  }

  return game;
}

/**
 * Game namespace with utility methods for game state management and analytics
 */
export namespace Game {
  /**
   * Gets remaining decision time for current player in milliseconds (countdown timer).
   */
  export function getTimeLeft(game: Game): number {
    // Get time limit from game (in seconds)
    const timeLimit = game.timeLimit;
    if (!timeLimit) return Infinity; // No time limit

    // Get elapsed time in milliseconds
    const elapsed = getElapsedTime(game);

    // Calculate remaining time (convert timeLimit to milliseconds)
    const remaining = timeLimit * 1000 - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Gets elapsed time since last action occurred in milliseconds (elapsed timer).
   * Used for analytics, timeout enforcement, and game flow monitoring.
   */
  export function getElapsedTime(game: Game): number {
    // Get the most recent timestamp from the game
    const lastTimestamp = game.lastTimestamp;

    if (!lastTimestamp) return 0;

    // Calculate elapsed time
    const now = Date.now();
    return now - lastTimestamp;
  }

  /**
   * Extracts finishing data from a completed game and updates the hand with final state
   * @param game - The completed game state
   * @param hand - The hand to update with finishing data
   * @returns Updated hand with finishing stacks, winnings, rake, and total pot
   */
  export function finish(game: Game, hand: Hand): Hand {
    // Early return for incomplete games
    if (!game.isComplete) {
      return hand;
    }

    hand = { ...hand };

    // Mutate the hand directly with finishing data
    hand.finishingStacks = game.players.map(p => p.stack);

    // Only set winnings if someone actually won something
    // This preserves the semantic distinction
    const winnings = game.players.map(p => p.winnings || 0);
    if (winnings.some(w => w > 0)) {
      hand.winnings = winnings;
    }

    // Set rake if it was calculated
    if (game.rake !== undefined) {
      hand.rake = game.rake;
    }

    // Calculate totalPot from all bets (since game.pot is zeroed)
    const totalPot = game.players.reduce((sum, p) => sum + (p.totalBet || 0), 0);
    if (totalPot > 0) {
      hand.totalPot = totalPot;
    }

    // Preserve rake percentage
    if (game.rakePercentage !== undefined) {
      hand.rakePercentage = game.rakePercentage;
    }

    if (
      hand.startingStacks.reduce((sum, stack) => sum + stack, 0) !==
      hand.finishingStacks?.reduce((sum, stack) => sum + stack, 0) + (hand?.rake ?? 0)
    ) {
      throw new Error('Starting stacks do not match finishing stacks: ' + JSON.stringify(hand));
    }

    return hand;
  }

  export function getPlayerName(game: Game, playerIdentifier: PlayerIdentifier): string {
    const player = getPlayer(game, playerIdentifier);
    if (!player) {
      throw new Error(`Player ${playerIdentifier} not found`);
    }
    return player.name;
  }

  export function getPlayer(game: Game, playerIdentifier: PlayerIdentifier) {
    return game.players[getPlayerIndex(game, playerIdentifier)];
  }

  /**
   * Gets the player index (0-based) for a given player identifier in the current game state,
   * supporting both numeric indices and string names.
   * @param game - The game state
   * @param playerIdentifier - Player index (0-based) or player name
   * @returns Player index (0-based) or -1 if not found
   */
  export function getPlayerIndex(game: Game, playerIdentifier: PlayerIdentifier): number {
    // Handle numeric index
    if (typeof playerIdentifier === 'number') {
      // Check if index is valid (within bounds and not negative)
      if (playerIdentifier < 0 || playerIdentifier >= game.players.length) {
        return -1;
      }
      return Math.abs(playerIdentifier); // handle -0 case
    }

    // Handle string name
    if (typeof playerIdentifier === 'string') {
      return game.players.findIndex(p => p.name === playerIdentifier);
    }

    return -1;
  }

  export const getCurrentPlayerIndex = getCurrentPlayerIndexOriginal;

  /**
   * Validates if the specified action is legal and can be applied to the current game state.
   * Performs comprehensive rule checking including turn validation, stack requirements,
   * betting minimums, and poker-specific constraints.
   * @param game - The game state
   * @param action - The action to validate
   * @returns True if action is valid and can be applied
   */
  export function canApplyAction(game: Game, action: Action): boolean {
    try {
      // Create a deep copy of the game to avoid mutation
      const gameCopy = JSON.parse(JSON.stringify(game));
      // Attempt to apply the action through the core processor
      // If it succeeds, the action is valid
      coreApplyAction(gameCopy, action);
      return true;
    } catch {
      // If it throws, the action is invalid
      return false;
    }
  }

  /**
   * Checks if the specified player has acted in the current betting round.
   * Essential for betting round completion logic and turn order management.
   * @param game - The game state
   * @param playerIdentifier - Player index (0-based) or player name
   * @returns True if player has acted in current round, false otherwise
   */
  export function hasActed(game: Game, playerIdentifier: PlayerIdentifier): boolean {
    // Get the player index
    const playerIndex = getPlayerIndex(game, playerIdentifier);

    // If player doesn't exist, return false
    if (playerIndex === -1) {
      return false;
    }

    // Get the player object
    const player = game.players[playerIndex];

    // Check if player has folded (folded players can't act)
    if (player.hasFolded) {
      return false;
    }

    // Return the hasActed flag for the player
    return player.hasActed;
  }

  /**
   * Applies an action to a game state.
   * @param game - The game state to apply the action to
   * @param action - The action to apply
   * @returns The updated game state
   */
  export function applyAction(game: Game, action: Action): Game {
    return coreApplyAction(game, action);
  }

  export function isGame(game: Game | Hand): game is Game {
    return 'bigBlindIndex' in game;
  }
}
