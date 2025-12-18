import type { Game } from './Game';
import type { Hand } from './Hand';

/** Card ranks from lowest to highest */
export const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;

/** Card rank type */
export type Rank = (typeof ranks)[number];

/** Card suits in alphabetical order */
export const suits = ['c', 'd', 'h', 's'] as const;

/** Card suit type */
export type Suit = (typeof suits)[number];

/** Card type representing a two-character string with rank and suit */
export type Card = `${Rank}${Suit}`;

/** Card type representing an unknown card */
export type UnknownCard = `??`;

/** Valid card type */
export type ValidCard = Card | UnknownCard;

/** Represents a player seat mapping */
export interface PlayerSeat {
  id?: string;
  name: string;
  originalSeat: number;
  seat: number;
}

/**
 * Represents a poker game variant.
 * FT - Fixed-limit Texas hold 'em
 * NT - No-limit Texas hold 'em
 * NS - No-limit short-deck hold 'em
 * PO - Pot-limit Omaha hold 'em
 * FO/8 - Fixed-limit Omaha hold 'em high/low-split eight or better
 * F7S - Fixed-limit seven card stud
 * F7S/8 - Fixed-limit seven card stud high/low-split eight or better
 * FR - Fixed-limit razz
 * N2L1D - No-limit deuce-to-seven lowball single draw
 * F2L3D - Fixed-limit deuce-to-seven lowball triple draw
 * FB - Fixed-limit badugi
 */
export type Variant =
  | 'FT'
  | 'NT'
  | 'NS'
  | 'PO'
  | 'FO/8'
  | 'F7S'
  | 'F7S/8'
  | 'FR'
  | 'N2L1D'
  | 'F2L3D'
  | 'FB';

/** Variants that use no-limit/pot-limit betting structure */
export type NoLimitVariant = 'NT' | 'NS' | 'PO' | 'N2L1D';

/** Variants that use fixed-limit betting structure */
export type FixedLimitVariant = 'FT' | 'FO/8' | 'F7S' | 'F7S/8' | 'FR' | 'F2L3D' | 'FB';

/** Variants that use stud structure with bring-in */
export type StudVariant = 'F7S' | 'F7S/8' | 'FR';

/** Base game interface with common required fields */
export interface BaseHand {
  /** Type of the game */
  type?: 'poker';

  // Meta information about the hand
  /** Name of the venue where the hand was played */
  venue?: string;
  /** Unique identifier for the game */
  table?: string;
  /** Hand number */
  hand?: number;
  /** Random seed for deterministic card dealing */
  seed?: number;
  /** Name of person who recorded the hand */
  author?: string;

  // Event information
  /** Name of the poker event/tournament */
  event?: string;
  /** Tournament blind/ante level number */
  level?: number;
  /** URL relevant to the event or venue */
  url?: string;
  /** Currency code in ISO 4127 format (e.g. 'USD', 'EUR') */
  currency?: string;

  // Seat setup
  /** Total number of seats at the table */
  seatCount?: number;
  /** Array of actual seat numbers for each player */
  seats?: number[];

  // Financials
  /** Absolute amount taken by the house from the pot */
  rake?: number;
  /** Total pot size including rake */
  totalPot?: number;

  // Rules/settings
  /** Rake percentage used to calculate rake when absolute amount is not provided (0.05 = 5%) */
  rakePercentage?: number;
  /** Rake cap used to limit the rake amount */
  rakeCap?: number;
  /** Whether short stacks can only win what they contributed to antes */
  anteTrimming?: boolean;
  /** Time limit per action in seconds */
  timeLimit?: number;

  // Players information
  /** Array of ante amounts for each player position */
  antes: number[];
  /** Array of blind or straddle amounts for each player position */
  blindsOrStraddles: number[];
  /** Array of starting stack amounts for each player position */
  startingStacks: number[];
  /** Array of player names in clockwise order from first to act */
  players: string[];
  /** Final stack amounts for each player after the hand */
  finishingStacks?: number[];
  /** Time bank amounts in seconds for each player */
  timeBanks?: number[];
  /** Array of player winnings in the hand */
  winnings?: number[];

  /** Array of actions in the hand */
  actions: Action[];

  // Date and time
  /** Timestamp of the game start */
  timestamp?: number;
  /** Year the hand was played */
  year?: number;
  /** Month the hand was played (1-12) */
  month?: number;
  /** Day of month the hand was played (1-31) */
  day?: number;
  /** Time in ISO format YYYY-MM-DDTHH:mm:ss */
  time?: string;
  /** IANA timezone name (e.g. 'America/Toronto') */
  timeZone?: string;

  // Location
  /** Country where the hand was played */
  country?: string;
  /** Region/state/province where the hand was played */
  region?: string;
  /** City where the hand was played */
  city?: string;
  /** Postal/zip code of the venue */
  postalCode?: string;
  /** Physical address of the venue */
  address?: string;

  /** Array of player ids local to the venue */
  _venueIds?: string[];
  /** Array of hero ids local to the venue */
  _heroIds?: (string | null)[];
  /** Manager uid */
  _managerUid?: string;
  /** Croupier id */
  _croupierId?: string;
  /** Array of indices for players who are sitting out */
  _inactive?: number[];
  /** Array of dead blinds */
  _deadBlinds?: number[];
  /** Array of player intents(play, pause, wait for BB, quit) */
  _intents?: number[];
  /** [key: `_${string}`]: unknown; */
  [key: `_${string}`]: unknown;
}

/** No-limit/pot-limit game */
export interface NoLimitHand extends BaseHand {
  variant: NoLimitVariant;
  minBet: number;
  smallBet?: never;
  bigBet?: never;
  bringIn?: never;
}

/** Fixed-limit game */
export interface FixedLimitHand extends BaseHand {
  variant: Exclude<FixedLimitVariant, StudVariant>;
  minBet?: never;
  smallBet: number;
  bigBet: number;
  bringIn?: never;
}

/** Stud game */
export interface StudHand extends BaseHand {
  variant: StudVariant;
  minBet?: never;
  smallBet: number;
  bigBet: number;
  bringIn: number;
}

/** Represents a serialized action type in the PHH format */
export const FOLD = 'f';
export const CALL_CHECK = 'cc';
export const CALL_BET_RAISE = 'cbr';
export const SHOW_MUCK = 'sm';
export const DEAL_BOARD = 'db';
export const DEAL_HAND = 'dh';
export const UNKNOWN = '?';

export type ActionType =
  | typeof FOLD
  | typeof CALL_CHECK
  | typeof CALL_BET_RAISE
  | typeof SHOW_MUCK
  | typeof DEAL_BOARD
  | typeof DEAL_HAND
  | typeof UNKNOWN
  | typeof ACTION_MESSAGE;

/** Represents a betting street in poker */
export type Street = 'preflop' | 'flop' | 'turn' | 'river';

export const Streets = ['preflop', 'flop', 'turn', 'river'] as const;
/** Action constants */
export const ACTION_DEAL_BOARD = 'db';
export const ACTION_DEAL_HOLE = 'dh';
export const ACTION_STAND_PAT_OR_DISCARD = 'sd';
export const ACTION_POST_BRING_IN = 'pb';
export const ACTION_FOLD = 'f';
export const ACTION_CHECK_CALL = 'cc';
export const ACTION_COMPLETE_BET_RAISE = 'cbr';
export const ACTION_SHOW_MUCK = 'sm';
export const ACTION_MESSAGE = 'm';

/** Represents a single action in PHH format */
export type ActionCommand =
  | `d ${DealerActionType} ${string}` // Dealer actions with cards
  | `p${number} ${PlayerActionType}` // Simple player actions
  | `p${number} ${typeof ACTION_CHECK_CALL} ${number}` // Call with amount
  | `p${number} ${typeof ACTION_COMPLETE_BET_RAISE} ${number}` // Bet/raise with amount
  | `p${number} ${typeof ACTION_STAND_PAT_OR_DISCARD} ${string} ` // Discard with cards
  | `p${number} ${typeof ACTION_SHOW_MUCK} ${string}` // Show with cards
  | `p${number} ${typeof ACTION_MESSAGE} ${string}`; // Message with text

export type Action = `${ActionCommand}${ActionComment}` | string;

export type ActionComment = '' | ` #${string}`;

/** Union type of dealer actions */
export type DealerActionType = typeof ACTION_DEAL_BOARD | typeof ACTION_DEAL_HOLE;

/** Union type of player actions */
export type PlayerActionType =
  | typeof ACTION_STAND_PAT_OR_DISCARD
  | typeof ACTION_POST_BRING_IN
  | typeof ACTION_FOLD
  | typeof ACTION_CHECK_CALL
  | typeof ACTION_COMPLETE_BET_RAISE
  | typeof ACTION_SHOW_MUCK
  | typeof ACTION_MESSAGE;

/** Represents a player at the table */
export interface Player {
  /** Player's name or identifier */
  name: string;
  /** Current chip stack available to bet */
  stack: number;
  /** Amount won in the hand */
  winnings: number;
  /** Amount of uncalled bets returned to the player */
  returns: number;
  /** Position at the table (0-based index) */
  position: number;
  /** Hole cards dealt to the player */
  cards: ValidCard[];
  /** Whether the player has folded this hand */
  hasFolded: boolean;
  /** Whether the player has acted in current betting round */
  hasActed: boolean;
  /** Total amount bet across all betting rounds in the hand. Persists until hand completion for accurate pot contribution tracking. */
  totalBet: number;
  /** Same as above but doesnt get reset at the end of the game */
  totalInvestments: number;
  /** Total amount bet in this betting round. Reset to 0 when moving to next street or hand completes. */
  roundBet: number;
  /** Last action taken by the player in the current betting round. Reset when moving to next street or hand completes. */
  roundAction: Action | null;
  /** Same as above but doesnt get reset at the end of the game */
  roundInvestments: number;
  /** Whether the player has gone all-in */
  isAllIn: boolean;
  /** Whether the player has shown their cards */
  hasShownCards: boolean | null;
  /** Rake the player has paid in the hand */
  rake: number;
  /** Whether the player is sitting out */
  isInactive: boolean;
}

export interface HandFixture {
  title: string;
  description: string;
  input: string;
  output: Hand;
  game: Game;
}

/** Region information for OCR */
export interface Region {
  /** Top-left x coordinate */
  x: number;
  /** Top-left y coordinate */
  y: number;
  /** Width of the region */
  width: number;
  /** Height of the region */
  height: number;
}

/** Generic type for JSON AST with OCR region information */
export type JSONAST<T> = T extends (infer U)[]
  ? {
      region: Region;
      value: JSONAST<U>[];
    }
  : T extends object
    ? {
        region: Region;
        value: {
          [K in keyof T]: JSONAST<T[K]>;
        };
      }
    : {
        region: Region;
        value: T;
      };
/** PlayerIdentifier type for identifying players */

export type PlayerIdentifier = string | number;
