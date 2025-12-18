/**
 * Venue-agnostic PHH → Poker Room Narrative
 *
 * @instructions Convert PHH hand to poker room narrative hand with exact action length summary and PokerStars/Home Game conventions. Extensible for other venues.
 * Do not attempt to optimize or remove redundant actions during narration.
 */

import { Temporal } from '@js-temporal/polyfill';
import { Game } from '../../Game';
import { calculateHandStrength, getRankCategory } from '../../game/evaluation';
import {
  getActionAmount,
  getActionCards,
  getActionPlayerIndex,
  getActionType,
} from '../../game/position';
import type { Hand } from '../../Hand';
import type { Card } from '../../types';
import { TIMEZONE_MAPPING } from './parse';

// Helper type definitions
interface SeatInfoEntry {
  seat: number; // The seat number used for narration lines
  idx: number; // Original player index in hand.players array
  player: string;
  isInactive: boolean;
  stack: number; // Player's starting stack
}

type StreetsType = { preflop: string[]; flop: string[]; turn: string[]; river: string[] };
type StreetNarrateResult = {
  narrationLines: string[];
  streetBets: number[];
  stacksAtStreetEnd: number[];
};
type AllStreetBetResults = {
  preflop: StreetNarrateResult | null;
  flop: StreetNarrateResult | null;
  turn: StreetNarrateResult | null;
  river: StreetNarrateResult | null;
};

function trimTrailingZeros(val: number, currency?: string) {
  // For play money, display whole numbers only (no decimals)
  if (currency === 'PLAY') {
    return Math.floor(val).toString();
  }
  // For USD etc., format to 2 decimal places, then remove .00 if it's a whole number.
  const fixed =
    Number(val.toFixed(2)) === Number(val.toFixed(3))
      ? Number(val).toFixed(2)
      : Number(val).toFixed(3);
  if (fixed.endsWith('.00')) {
    return fixed.substring(0, fixed.length - 3);
  }
  return fixed;
}

function formatMoney(amount: any, currency?: string): string {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  if (currency === 'PLAY') return trimTrailingZeros(num, currency);
  let currencySign = '';
  switch (currency) {
    case 'EUR':
      currencySign = '€';
      break;
    case 'GBP':
      currencySign = '£';
      break;
    case 'USD':
      currencySign = '$';
      break;
    default:
      break;
  }
  // Call trimTrailingZeros with the number directly
  return `${currencySign}${trimTrailingZeros(num, currency)}`;
}

/**
 * Format datetime from various input formats to "YYYY/MM/DD HH:MM:SS TZ" string
 * Mirrors the logic of parseDateTimeWithTimezone from pokerstars.ts
 *
 * Priority order:
 * 1. timestamp - most reliable, single source of truth (requires timezone conversion)
 * 2. time string with timezone - parsed complete datetime (no conversion needed)
 * 3. individual components - fallback assembly (components already in target timezone)
 */
function formatDateTime(input: {
  // Priority 1: Unix timestamp (highest priority)
  timestamp?: number | string;

  // Priority 2: Time string (medium priority)
  time?: string; // "YYYY-MM-DDTHH:MM:SS" or "HH:MM:SS"

  // Priority 3: Individual components (lowest priority)
  // These components are assumed to be already in the specified timezone
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;

  // Timezone for formatting (always included in output)
  timeZone?: string;
}): string {
  const tzAbbr = input.timeZone || 'UTC';
  let year: number, month: number, day: number, hour: number, minute: number, second: number;

  // Priority 1: Timestamp (convert from UTC to specified timezone)
  if (input.timestamp) {
    const timestampMs =
      typeof input.timestamp === 'string' ? parseInt(input.timestamp, 10) : input.timestamp;

    const ianaTimeZone = TIMEZONE_MAPPING[tzAbbr];

    if (!ianaTimeZone) {
      // Standard timezone - use Date API
      const date = new Date(timestampMs);
      if (tzAbbr === 'UTC' || tzAbbr === 'GMT') {
        year = date.getUTCFullYear();
        month = date.getUTCMonth() + 1;
        day = date.getUTCDate();
        hour = date.getUTCHours();
        minute = date.getUTCMinutes();
        second = date.getUTCSeconds();
      } else {
        // Use local methods for other standard timezones
        year = date.getFullYear();
        month = date.getMonth() + 1;
        day = date.getDate();
        hour = date.getHours();
        minute = date.getMinutes();
        second = date.getSeconds();
      }
    } else {
      // Mapped timezone - use Temporal API for conversion
      const instant = Temporal.Instant.fromEpochMilliseconds(timestampMs);
      const zoned = instant.toZonedDateTimeISO(ianaTimeZone);
      year = zoned.year;
      month = zoned.month;
      day = zoned.day;
      hour = zoned.hour;
      minute = zoned.minute;
      second = zoned.second;
    }
  }
  // Priority 2: Time string (parse components, no timezone conversion)
  else if (input.time && input.timeZone) {
    if (input.time.includes('T')) {
      // ISO format "YYYY-MM-DDTHH:MM:SS" - extract components
      const [datePart, timePart] = input.time.split('T');
      const [yearStr, monthStr, dayStr] = datePart.split('-');
      const timeParts = timePart.split(':');

      year = parseInt(yearStr, 10);
      month = parseInt(monthStr, 10);
      day = parseInt(dayStr, 10);
      hour = parseInt(timeParts[0], 10);
      minute = parseInt(timeParts[1], 10);
      second = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
    } else if (input.year && input.month && input.day) {
      // "HH:MM:SS" format with date components available
      const timeParts = input.time.split(':');
      year = input.year;
      month = input.month;
      day = input.day;
      hour = parseInt(timeParts[0], 10);
      minute = parseInt(timeParts[1], 10);
      second = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
    } else {
      throw new Error(
        'Time string without date components requires ISO format (YYYY-MM-DDTHH:MM:SS)'
      );
    }
  }
  // Priority 3: Individual components (already in target timezone, no conversion)
  else if (input.year && input.month && input.day) {
    // Components represent local time in the specified timezone
    year = input.year;
    month = input.month;
    day = input.day;
    hour = input.hour ?? 0;
    minute = input.minute ?? 0;
    second = input.second ?? 0;
  } else {
    throw new Error('Invalid input: need timestamp, time string, or date components');
  }

  // Format to "YYYY/MM/DD HH:MM:SS TZ" (PokerStars format)
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  const hourStr = String(hour).padStart(2, '0');
  const minuteStr = String(minute).padStart(2, '0');
  const secondStr = String(second).padStart(2, '0');

  return `${year}/${monthStr}/${dayStr} ${hourStr}:${minuteStr}:${secondStr} ${tzAbbr}`;
}

// Generate sequential seat numbers for players
function getPokerStarsSeats(players: string[]): number[] {
  // Simply return sequential seat numbers from 1 to player count
  return Array.from({ length: players.length }, (_, i) => i + 1);
}

function getVenueHeader(hand: Hand): string[] {
  // Extract all needed data from hand and Game
  const game = Game(hand);

  // Get setup info
  const setupInfo = resolveHandSetupInfo(hand, game);
  const {
    seatsForHeader: seats,
    buttonIdx,
    nominalSbValue: sbValue,
    nominalBbValueForHeader: bbValue,
  } = setupInfo;

  // Get data directly from hand
  const currency = hand.currency || 'USD';
  const timeZone = hand.timeZone || 'UTC';
  const tableName = typeof hand.table === 'string' && hand.table ? hand.table : 'fun time';
  const seatCount = hand.seatCount || hand.players.length;
  const venue = (hand.venue || '').toLowerCase();
  let handId: string | number = '';
  let headerTime = '';
  const isPokerStars = venue === 'pokerstars' || venue === 'pokerstars home game' || venue === '';
  const isHomeGame = venue === 'pokerstars home game';
  const isPlayMoney = currency === 'PLAY';
  // Club ID for PokerStars Home Game
  // let clubId = '';
  //if (isHomeGame && typeof hand.table === 'string') {
  //  // Try to extract {Club #...} from table name or from a clubId property
  //  if (hand.clubId) {
  //    clubId = `{Club #${hand.clubId}}`;
  //  } else if (typeof hand.table === 'string') {
  //    // Try to extract from table string if present
  //    const clubMatch = hand.table.match(/\{Club #(\d+)\}/);
  //    if (clubMatch) clubId = `{Club #${clubMatch[1]}}`;
  //  }
  //  // Or from a clubId property
  //  if (!clubId && hand.clubId) {
  //    clubId = `{Club #${hand.clubId}}`;
  //  }
  //}

  // Default generic header
  handId = hand.hand || '';
  headerTime = formatDateTime({
    timestamp: hand.timestamp,
    time: hand.time,
    year: hand.year,
    month: hand.month,
    day: hand.day,
    timeZone: hand.timeZone || timeZone,
  });
  if (isPokerStars) {
    return [
      `PokerStars${isHomeGame ? ' Home Game' : ''} Hand #${String(handId)}:  Hold'em No Limit (${formatMoney(sbValue, currency)}/${formatMoney(bbValue, currency)} ${currency}) - ${headerTime}`,
      `Table '${tableName}' ${String(seatCount)}-max Seat #${String(seats[buttonIdx])} is the button${isPlayMoney ? ` (Play Money)` : ''}`,
    ];
  }

  return [
    `${venue ? venue.charAt(0).toUpperCase() + venue.slice(1) : 'Poker Room'} Hand #${String(handId)}: Hold'em No Limit (${formatMoney(sbValue, currency)}/${formatMoney(bbValue, currency)}${isPlayMoney ? '' : ` ${currency}`}) - ${headerTime}`,
    `Table '${tableName}' ${String(seatCount)}-max Seat #${String(seats[buttonIdx])} is the button`,
  ];
}

// --- NEW HELPER FUNCTIONS ---

function resolveHandSetupInfo(hand: Hand, game: Game) {
  let buttonIdx = game.buttonIndex;
  let sbIdx = game.smallBlindIndex;
  let bbIdx = game.bigBlindIndex;

  // Fix invalid button/blind indices by calculating from blindsOrStraddles
  if (buttonIdx === -1 || sbIdx === -1 || bbIdx === -1) {
    // For heads-up games, use standard positions
    if (hand.players.length === 2) {
      // Always fix heads-up positions when any index is invalid
      sbIdx = 0; // Player 0 (first player) is small blind in heads-up
      bbIdx = 1; // Player 1 (second player) is big blind in heads-up
      if (buttonIdx === -1) buttonIdx = sbIdx; // Button is on small blind in heads-up
    } else {
      // For multi-player games, try to find from blindsOrStraddles
      const blinds = hand.blindsOrStraddles || [];
      let foundSb = sbIdx !== -1;
      let foundBb = bbIdx !== -1;

      for (let i = 0; i < blinds.length; i++) {
        if (blinds[i] > 0) {
          if (!foundSb) {
            sbIdx = i; // First non-zero blind is small blind
            foundSb = true;
          } else if (!foundBb) {
            bbIdx = i; // Second non-zero blind is big blind
            foundBb = true;
            break;
          }
        }
      }

      if (buttonIdx === -1 && sbIdx !== -1) {
        // Button is typically to the left of small blind
        buttonIdx = (sbIdx - 1 + hand.players.length) % hand.players.length;
      }
    }
  }

  // Nominal SB value
  const nominalSbValue = hand.blindsOrStraddles[sbIdx] || 0;

  // Infer nominal BB for header display
  let nominalBbValueForHeader = 0;
  if (bbIdx !== -1 && hand.blindsOrStraddles[bbIdx] > 0) {
    nominalBbValueForHeader = hand.blindsOrStraddles[bbIdx];
  } else if (nominalSbValue > 0) {
    nominalBbValueForHeader = nominalSbValue * 2;
  } else {
    nominalBbValueForHeader = (hand.minBet as number) || 0;
    if (nominalBbValueForHeader === nominalSbValue && nominalSbValue > 0) {
      nominalBbValueForHeader = nominalSbValue * 2;
    }
  }
  if (nominalBbValueForHeader < nominalSbValue && nominalSbValue > 0) {
    nominalBbValueForHeader = nominalSbValue;
  }

  // Seats for header (button seat resolution)
  const seatsForHeader =
    Array.isArray(hand.seats) && hand.seats.length === hand.players.length
      ? hand.seats
      : getPokerStarsSeats(hand.players);

  // Seat iteration order for seat lines, posts, and summary
  const seatIterationOrder: number[] =
    Array.isArray(hand.seats) && hand.seats.length === hand.players.length
      ? hand.seats
      : getPokerStarsSeats(hand.players).sort((a, b) => a - b);

  // Actual physical seat number for each player (by hand.players index)
  const playerIndexToActualSeatMap = new Map<number, number>();
  const seatsToAssignToPlayersSorted: number[] =
    Array.isArray(hand.seats) && hand.seats.length === hand.players.length
      ? [...hand.seats].sort((a, b) => a - b)
      : getPokerStarsSeats(hand.players).sort((a, b) => a - b);

  hand.players.forEach((_, playerIdx) => {
    playerIndexToActualSeatMap.set(playerIdx, seatsToAssignToPlayersSorted[playerIdx]);
  });

  // Construct seatInfo based on seatIterationOrder
  const seatInfo: SeatInfoEntry[] = seatIterationOrder.map(seatNumInIterationOrder => {
    let playerIdxForThisSeat = -1;
    for (const [pIdx, physicalSeatOfPlayer] of playerIndexToActualSeatMap.entries()) {
      if (physicalSeatOfPlayer === seatNumInIterationOrder) {
        playerIdxForThisSeat = pIdx;
        break;
      }
    }
    // Assuming playerIdxForThisSeat will always be found based on prior logic
    const playerName = hand.players[playerIdxForThisSeat];
    const playerStack = hand.startingStacks[playerIdxForThisSeat];
    const playerIsInactive = !!game.players[playerIdxForThisSeat]?.isInactive;

    return {
      seat: seatNumInIterationOrder,
      idx: playerIdxForThisSeat,
      player: playerName,
      isInactive: playerIsInactive,
      stack: playerStack,
    };
  });

  return {
    seatInfo,
    buttonIdx,
    sbIdx,
    bbIdx,
    nominalSbValue,
    nominalBbValueForHeader,
    seatsForHeader,
  };
}

function generateSeatLines(seatInfo: SeatInfoEntry[], currency: string): string[] {
  return seatInfo.map(({ seat, player, stack, isInactive }) => {
    const stackStr = formatMoney(stack, currency);
    return `Seat ${seat}: ${player} (${stackStr} in chips)${isInactive ? ' is sitting out' : ''}`;
  });
}

function generatePostNarrations(
  hand: Hand,
  table: any,
  seatInfo: SeatInfoEntry[],
  currency: string,
  nominalSbValue: number,
  nominalBbValueForHeader: number,
  sbIdx: number,
  bbIdx: number
): string[] {
  const posts: string[] = [];
  const deadBlinds = hand._deadBlinds || Array(hand.players.length).fill(0);
  const processedForBlinds = new Set<number>();

  const gameSmallBlindValue = nominalSbValue;
  const gameBigBlindValue = nominalBbValueForHeader;

  // 1. Small Blind
  if (sbIdx !== -1 && !table.players[sbIdx].isInactive) {
    const player = hand.players[sbIdx];
    const blindAmount = hand.blindsOrStraddles[sbIdx] || 0;
    const deadAmount = deadBlinds[sbIdx] || 0;

    if (blindAmount > 0 && deadAmount > 0) {
      posts.push(
        `${player}: posts small & big blinds ${formatMoney(blindAmount + deadAmount, currency)}`
      );
    } else if (blindAmount > 0) {
      posts.push(`${player}: posts small blind ${formatMoney(blindAmount, currency)}`);
    } else if (deadAmount > 0) {
      if (deadAmount === gameSmallBlindValue && gameSmallBlindValue > 0) {
        posts.push(`${player}: posts small blind ${formatMoney(deadAmount, currency)}`);
      } else if (deadAmount === gameBigBlindValue && gameBigBlindValue > 0) {
        posts.push(`${player}: posts big blind ${formatMoney(deadAmount, currency)}`);
      } else {
        posts.push(`${player}: posts dead blind ${formatMoney(deadAmount, currency)}`);
      }
    }
    if (blindAmount > 0 || deadAmount > 0) processedForBlinds.add(sbIdx);
  }

  // 2. Big Blind
  if (bbIdx !== -1 && !table.players[bbIdx].isInactive && !processedForBlinds.has(bbIdx)) {
    const player = hand.players[bbIdx];
    const blindAmount = hand.blindsOrStraddles[bbIdx] || 0;
    const deadAmount = deadBlinds[bbIdx] || 0;

    if (blindAmount > 0 && deadAmount > 0) {
      posts.push(
        `${player}: posts small & big blinds ${formatMoney(blindAmount + deadAmount, currency)}`
      );
    } else if (blindAmount > 0) {
      posts.push(`${player}: posts big blind ${formatMoney(blindAmount, currency)}`);
    } else if (deadAmount > 0) {
      if (deadAmount === gameSmallBlindValue && gameSmallBlindValue > 0 && bbIdx !== sbIdx) {
        posts.push(`${player}: posts small blind ${formatMoney(deadAmount, currency)}`);
      } else if (deadAmount === gameBigBlindValue && gameBigBlindValue > 0) {
        posts.push(`${player}: posts big blind ${formatMoney(deadAmount, currency)}`);
      } else {
        posts.push(`${player}: posts dead blind ${formatMoney(deadAmount, currency)}`);
      }
    }
    if (blindAmount > 0 || deadAmount > 0) processedForBlinds.add(bbIdx);
  }

  // 3. Other players posting blinds or dead blinds
  for (const { idx, player, isInactive } of seatInfo) {
    if (isInactive || processedForBlinds.has(idx)) {
      continue;
    }
    const blindAmount = hand.blindsOrStraddles[idx] || 0;
    const deadAmount = deadBlinds[idx] || 0;

    if (blindAmount > 0 && deadAmount > 0) {
      posts.push(
        `${player}: posts small & big blinds ${formatMoney(blindAmount + deadAmount, currency)}`
      );
    } else if (blindAmount > 0) {
      posts.push(`${player}: posts big blind ${formatMoney(blindAmount, currency)}`);
    } else if (deadAmount > 0) {
      if (deadAmount === gameSmallBlindValue && gameSmallBlindValue > 0) {
        posts.push(`${player}: posts small blind ${formatMoney(deadAmount, currency)}`);
      } else if (deadAmount === gameBigBlindValue && gameBigBlindValue > 0) {
        posts.push(`${player}: posts big blind ${formatMoney(deadAmount, currency)}`);
      } else {
        posts.push(`${player}: posts dead blind ${formatMoney(deadAmount, currency)}`);
      }
    }
  }

  // Antes
  if (Array.isArray(hand.antes) && hand.antes.some((a: number) => a > 0)) {
    for (const { player, idx, isInactive } of seatInfo) {
      if (!isInactive && hand.antes[idx] > 0) {
        posts.push(`${player}: posts the ante ${formatMoney(hand.antes[idx], currency)}`);
      }
    }
  }
  return posts;
}

function generateHoleCardDealNarrations(hand: Hand): string[] {
  const output: string[] = [];
  for (const action of hand.actions) {
    if (!action.startsWith('d dh')) continue;
    const idx = getActionPlayerIndex(action);
    const cards = getActionCards(action);
    if (idx != null && cards && cards.length === 2 && !(cards[0] === '??' && cards[1] === '??')) {
      output.push(`Dealt to ${hand.players[idx]} [${cards.join(' ')}]`);
    }
  }
  return output;
}

function parseActionsToStreets(handActions: string[]): { streets: StreetsType; board: string[] } {
  const streets: StreetsType = { preflop: [], flop: [], turn: [], river: [] };
  let currentStreet: keyof StreetsType = 'preflop';
  let board: string[] = [];

  for (const action of handActions) {
    if (action.startsWith('d db')) {
      const cards = getActionCards(action);
      board = board.concat(cards || []);
      if (board.length === 3) currentStreet = 'flop';
      else if (board.length === 4) currentStreet = 'turn';
      else if (board.length === 5) currentStreet = 'river';
      continue;
    }
    streets[currentStreet].push(action);
  }
  return { streets, board };
}

function generateShowdownNarrations(hand: Hand, table: any): string[] {
  const output: string[] = [];
  const winnerIndices = new Set(
    table.players
      .map((p: any, idx: number) => (p.winnings > 0 ? idx : -1))
      .filter((idx: number) => idx >= 0)
  );
  const showdownOrder: { idx: number; cards: string[] | null; isWinner: boolean }[] = [];

  for (const action of hand.actions) {
    const match = action.match(/^p(\d+) sm(?: ([^#]+))?/);
    if (match) {
      const idx = getActionPlayerIndex(action) ?? 0; // Ensure idx is not null
      const cards = getActionCards(action) ?? ['??', '??'];
      const isWinner = winnerIndices.has(idx);
      showdownOrder.push({ idx, cards, isWinner });
    }
  }

  const shownOrMucked = new Set<number>();
  for (const { idx, cards, isWinner } of showdownOrder) {
    const player = table.players[idx];
    shownOrMucked.add(idx);
    if (
      cards &&
      cards.length === 2 &&
      !cards.includes('??') &&
      (isWinner || player.hasShownCards)
    ) {
      output.push(
        `${player.name}: shows [${cards.join(' ')}] ${describeHand(cards as Card[], table.board as Card[])}`
      );
    } else {
      output.push(`${player.name}: mucks hand`);
    }
  }

  for (let i = 0; i < table.players.length; ++i) {
    const player = table.players[i];
    if (player.isInactive || player.hasFolded || shownOrMucked.has(i)) continue;
    if (
      player.hasShownCards &&
      player.cards &&
      player.cards.length === 2 &&
      !player.cards.includes('??') &&
      winnerIndices.has(i)
    ) {
      output.push(
        `${player.name}: shows [${player.cards.join(' ')}] ${describeHand(player.cards as Card[], table.board as Card[])}`
      );
    } else {
      output.push(`${player.name}: mucks hand`);
    }
  }
  return output;
}

function generateEndOfHandResolutionNarrations(
  hand: Hand,
  table: any,
  parsedStreets: StreetsType,
  allStreetResults: AllStreetBetResults,
  currency: string
): string[] {
  const output: string[] = [];

  let lastStreetActions: string[] = [];
  let finalStreetBets: number[] = Array(hand.players.length).fill(0);
  let lastStreetKey: keyof StreetsType = 'preflop';

  if (parsedStreets.river.length > 0 && allStreetResults.river) {
    lastStreetActions = parsedStreets.river;
    finalStreetBets = allStreetResults.river.streetBets;
    lastStreetKey = 'river';
  } else if (parsedStreets.turn.length > 0 && allStreetResults.turn) {
    lastStreetActions = parsedStreets.turn;
    finalStreetBets = allStreetResults.turn.streetBets;
    lastStreetKey = 'turn';
  } else if (parsedStreets.flop.length > 0 && allStreetResults.flop) {
    lastStreetActions = parsedStreets.flop;
    finalStreetBets = allStreetResults.flop.streetBets;
    lastStreetKey = 'flop';
  } else if (allStreetResults.preflop) {
    lastStreetActions = parsedStreets.preflop;
    finalStreetBets = allStreetResults.preflop.streetBets;
    lastStreetKey = 'preflop';
  }

  const uncalledBetContenders = new Set<number>();
  const foldedPriorToStreet = (
    playerIndex: number,
    streetName: keyof StreetsType,
    currentTable: any
  ) => {
    if (!currentTable.foldedByStreet) return false;
    const foldedMap = currentTable.foldedByStreet as Record<keyof StreetsType, Set<number>>;
    if (streetName === 'flop') return foldedMap.preflop.has(playerIndex);
    if (streetName === 'turn')
      return foldedMap.preflop.has(playerIndex) || foldedMap.flop.has(playerIndex);
    if (streetName === 'river')
      return (
        foldedMap.preflop.has(playerIndex) ||
        foldedMap.flop.has(playerIndex) ||
        foldedMap.turn.has(playerIndex)
      );
    return false;
  };

  for (let i = 0; i < hand.players.length; i++) {
    if (!table.players[i].isInactive && !foldedPriorToStreet(i, lastStreetKey, table)) {
      uncalledBetContenders.add(i);
    }
  }

  const { amount: uncalled, playerIndex: uncalledIdx } = calcUncalledBet(
    finalStreetBets,
    uncalledBetContenders,
    lastStreetActions
  );
  if (uncalled > 0 && uncalledIdx != null) {
    output.push(
      `Uncalled bet (${formatMoney(uncalled, currency)}) returned to ${hand.players[uncalledIdx]}`
    );
  }

  // Pot collection
  const winnersFromWinnings = table.players.filter((p: any) => p.winnings > 0);
  const soleSurvivor = table.players.filter((p: any) => !p.hasFolded && !p.isInactive);

  if (winnersFromWinnings.length > 0) {
    for (const winner of winnersFromWinnings) {
      if (soleSurvivor.length === 1 && winner === soleSurvivor[0] && !table.isShowdown) {
        let actualPotCollected;
        if (typeof hand.totalPot === 'number' && hand.totalPot > 0) {
          actualPotCollected = hand.totalPot - (table.rake || 0);
        } else {
          actualPotCollected =
            (typeof table.finalPot === 'number' ? table.finalPot : table.pot) - (table.rake || 0);
        }
        if (
          uncalledIdx === (winner as any).idx &&
          uncalled > 0 &&
          winner.winnings > actualPotCollected
        ) {
          output.push(
            `${winner.name} collected ${formatMoney(actualPotCollected, currency)} from pot`
          );
        } else if (actualPotCollected >= 0) {
          output.push(
            `${winner.name} collected ${formatMoney(actualPotCollected, currency)} from pot`
          );
        } else {
          output.push(
            `${winner.name} collected ${formatMoney(winner.winnings, currency)} from pot`
          );
        }
      } else {
        output.push(`${winner.name} collected ${formatMoney(winner.winnings, currency)} from pot`);
      }
    }
  } else if (soleSurvivor.length === 1 && !table.isShowdown) {
    const winnerPlayer = soleSurvivor[0];
    let collectedAmount;
    if (typeof hand.totalPot === 'number' && hand.totalPot > 0) {
      collectedAmount = hand.totalPot - (table.rake || 0);
    } else {
      collectedAmount =
        (typeof table.finalPot === 'number' ? table.finalPot : table.pot) - (table.rake || 0);
    }
    if (collectedAmount > 0) {
      output.push(
        `${winnerPlayer.name} collected ${formatMoney(collectedAmount, currency)} from pot`
      );
    }
  }
  return output;
}

// Helper for generateSummaryBlock
function getPlayerSummaryStatusLine(
  playerTableInfo: any, // from table.players[idx]
  hand: Hand,
  table: any,
  currency: string,
  playerOriginalIndex: number
): string {
  if (table.isComplete) {
    let playerWinAmount = playerTableInfo.winnings;
    if (playerWinAmount <= 0 && !table.isShowdown) {
      const soleSurvivorForSummary = table.players.filter(
        (p: any) => !p.hasFolded && !p.isInactive
      );
      if (soleSurvivorForSummary.length === 1 && playerTableInfo === soleSurvivorForSummary[0]) {
        const calculatedWin =
          (typeof hand.totalPot === 'number' && hand.totalPot > 0
            ? hand.totalPot
            : typeof table.finalPot === 'number'
              ? table.finalPot
              : table.pot) - (table.rake || 0);
        if (calculatedWin > 0) {
          playerWinAmount = calculatedWin;
        }
      }
    }

    if (playerWinAmount > 0) {
      const winAmount = playerWinAmount;
      const winningCardsArr = playerTableInfo.cards;
      const hasWinningCards = winningCardsArr?.length === 2 && !winningCardsArr.includes('??');

      if (hasWinningCards) {
        const handDesc = describeHand(winningCardsArr as Card[], table.board as Card[]);
        return `showed [${winningCardsArr!.join(' ')}] and won (${formatMoney(winAmount, currency)})${handDesc ? ' with ' + handDesc.slice(1, -1) : ''}`;
      } else {
        return `collected (${formatMoney(winAmount, currency)})`;
      }
    } else if (playerTableInfo.hasFolded) {
      const foldedMap = (table as any).foldedByStreet as
        | Record<keyof StreetsType, Set<number>>
        | undefined;
      if (foldedMap?.preflop.has(playerOriginalIndex)) {
        return playerTableInfo.totalBet === 0
          ? "folded before Flop (didn't bet)"
          : 'folded before Flop';
      } else if (foldedMap?.flop.has(playerOriginalIndex)) {
        return 'folded on the Flop';
      } else if (foldedMap?.turn.has(playerOriginalIndex)) {
        return 'folded on the Turn';
      } else if (foldedMap?.river.has(playerOriginalIndex)) {
        return 'folded on the River';
      } else {
        return 'folded';
      }
    } else if (playerTableInfo.hasShownCards && !playerTableInfo.winnings) {
      const shownCardsArr = playerTableInfo.cards;
      const hasShownValidCards = shownCardsArr?.length === 2 && !shownCardsArr.includes('??');
      if (hasShownValidCards) {
        const handDesc = describeHand(shownCardsArr as Card[], table.board as Card[]);
        return `showed [${shownCardsArr!.join(' ')}] and lost${handDesc ? ' with ' + handDesc.slice(1, -1) : ''}`;
      } else {
        return `mucked hand`;
      }
    } else {
      return `mucked hand`;
    }
  } else {
    // Hand is NOT complete
    if (playerTableInfo.hasFolded) {
      const foldedMap = (table as any).foldedByStreet as
        | Record<keyof StreetsType, Set<number>>
        | undefined;
      if (foldedMap?.preflop.has(playerOriginalIndex)) {
        return playerTableInfo.totalBet === 0
          ? "folded before Flop (didn't bet)"
          : 'folded before Flop';
      } else if (foldedMap?.flop.has(playerOriginalIndex)) {
        return 'folded on the Flop';
      } else if (foldedMap?.turn.has(playerOriginalIndex)) {
        return 'folded on the Turn';
      } else if (foldedMap?.river.has(playerOriginalIndex)) {
        return 'folded on the River';
      } else {
        return 'folded';
      }
    } else {
      const playerCardsArr = playerTableInfo.cards;
      if (playerCardsArr?.length === 2 && !playerCardsArr.includes('??')) {
        return `shows ${playerCardsArr.map((card: Card) => `${rankToWord(card[0])} ${card[1] === 's' ? 'of Spades' : card[1] === 'h' ? 'of Hearts' : card[1] === 'd' ? 'of Diamonds' : card[1] === 'c' ? 'of Clubs' : ''}`).join(', ')}, got combination ${describeHand(playerCardsArr as Card[], table.board as Card[])}`
          .replaceAll('(', '')
          .replaceAll(')', '');
      } else {
        return ''; // Still in hand, no cards or '??'
      }
    }
  }
}

function generateSummaryBlock(
  hand: Hand,
  table: any,
  seatInfo: SeatInfoEntry[],
  currency: string,
  buttonIdx: number,
  sbIdx: number,
  bbIdx: number
): string[] {
  const output: string[] = ['*** SUMMARY ***'];

  let summaryPot: number;
  if (typeof hand.totalPot === 'number' && hand.totalPot > 0) {
    summaryPot = hand.totalPot;
  } else {
    const robustPot = getRobustFinalPot(table.players, hand); // Pass hand to getRobustFinalPot
    if (typeof robustPot === 'number') {
      summaryPot = robustPot;
    } else {
      summaryPot = typeof table.finalPot === 'number' ? table.finalPot : table.pot;
    }
  }
  output.push(
    `Total pot ${formatMoney(summaryPot, currency)} | Rake ${formatMoney(table.rake || 0, currency)}`
  );

  if (table.board.length > 0) {
    output.push(`Board [${table.board.join(' ')}]`);
  }

  for (const { seat, idx, player, isInactive } of seatInfo) {
    let roleLabel = '';
    if (idx === buttonIdx) roleLabel = ' (button)';
    if (idx === sbIdx) roleLabel += ' (small blind)';
    if (idx === bbIdx) roleLabel += ' (big blind)';

    let baseSeatStr = `Seat ${seat}: ${player}`;
    if (isInactive) {
      output.push(baseSeatStr);
      continue;
    }

    const statusDetail = getPlayerSummaryStatusLine(table.players[idx], hand, table, currency, idx);

    let finalSeatStr = baseSeatStr;
    if (roleLabel) {
      finalSeatStr += roleLabel;
    }
    if (statusDetail) {
      finalSeatStr += ` ${statusDetail}`;
    }
    output.push(finalSeatStr);
  }
  return output;
}

// --- MAIN NARRATIVE FUNCTION  ---
/**
 * This function is kept for backward compatibility
 */
export function stringifyPokerstarsHand(hand: Hand): string {
  const game = Game(hand);
  const currency = hand.currency || 'USD';

  // 1. Resolve Hand Setup
  const setupInfo = resolveHandSetupInfo(hand, game);
  const { seatInfo, buttonIdx, sbIdx, bbIdx, nominalSbValue, nominalBbValueForHeader } = setupInfo;

  // 2. Generate Header
  const [header, tableLine] = getVenueHeader(hand);
  const output: string[] = [header, tableLine];

  // 3. Generate Seat Lines
  output.push(...generateSeatLines(seatInfo, currency));

  // 4. Generate Post Narrations
  output.push(
    ...generatePostNarrations(
      hand,
      game,
      seatInfo,
      currency,
      nominalSbValue,
      nominalBbValueForHeader,
      sbIdx,
      bbIdx
    )
  );

  // 5. Parse Actions into Streets
  const { streets: parsedStreets } = parseActionsToStreets(hand.actions);
  // Update table.board if it was determined by parseActionsToStreets
  // This is a bit of a hack; ideally, table creation or an update step would handle board population
  // For now, let's ensure narrateStreet uses the parsedBoard if available.
  // Actually, createGame already populates table.board correctly based on 'd db' actions.
  // So, parsedBoard from parseActionsToStreets is primarily for guiding street transitions here.

  // 6. Narrate Hole Cards Dealt
  output.push('*** HOLE CARDS ***');
  output.push(...generateHoleCardDealNarrations(hand));

  // 7. Narrate Each Street
  let runningStacks = hand.startingStacks.slice();
  const allStreetResults: AllStreetBetResults = {
    preflop: null,
    flop: null,
    turn: null,
    river: null,
  };

  const preflopInitialBet = hand.blindsOrStraddles[bbIdx] || 0;
  allStreetResults.preflop = narrateStreet(
    parsedStreets.preflop,
    hand,
    game,
    currency,
    'preflop',
    runningStacks,
    preflopInitialBet
  );
  if (allStreetResults.preflop) {
    output.push(...allStreetResults.preflop.narrationLines);
    runningStacks = allStreetResults.preflop.stacksAtStreetEnd;
  }

  if (game.board.length >= 3) {
    // Check actual table.board from createGame
    output.push(`*** FLOP *** [${game.board.slice(0, 3).join(' ')}]`);
    allStreetResults.flop = narrateStreet(
      parsedStreets.flop,
      hand,
      game,
      currency,
      'flop',
      runningStacks
    );
    if (allStreetResults.flop) {
      output.push(...allStreetResults.flop.narrationLines);
      runningStacks = allStreetResults.flop.stacksAtStreetEnd;
    }
  }

  if (game.board.length >= 4) {
    output.push(`*** TURN *** [${game.board.slice(0, 3).join(' ')}] [${game.board[3]}]`);
    allStreetResults.turn = narrateStreet(
      parsedStreets.turn,
      hand,
      game,
      currency,
      'turn',
      runningStacks
    );
    if (allStreetResults.turn) {
      output.push(...allStreetResults.turn.narrationLines);
      runningStacks = allStreetResults.turn.stacksAtStreetEnd;
    }
  }

  if (game.board.length === 5) {
    output.push(`*** RIVER *** [${game.board.slice(0, 4).join(' ')}] [${game.board[4]}]`);
    allStreetResults.river = narrateStreet(
      parsedStreets.river,
      hand,
      game,
      currency,
      'river',
      runningStacks
    );
    if (allStreetResults.river) {
      output.push(...allStreetResults.river.narrationLines);
      runningStacks = allStreetResults.river.stacksAtStreetEnd;
    }
  }

  // 8. Narrate Showdown
  if (game.isShowdown) {
    output.push('*** SHOW DOWN ***');
    output.push(...generateShowdownNarrations(hand, game));
  }

  // 9. Narrate End of Hand Resolution
  if (game.isComplete) {
    output.push(
      ...generateEndOfHandResolutionNarrations(
        hand,
        game,
        parsedStreets,
        allStreetResults,
        currency
      )
    );
  }

  // 10. Generate Summary Block
  output.push(...generateSummaryBlock(hand, game, seatInfo, currency, buttonIdx, sbIdx, bbIdx));

  return output.join('\n');
}

// Moved calcUncalledBet outside handToPokerstars to fix linter error
function calcUncalledBet(playerBets: number[], activePlayers: Set<number>, lastActions: string[]) {
  if (
    activePlayers.size <= 1 &&
    !(
      activePlayers.size === 1 &&
      playerBets[Array.from(activePlayers)[0]] > 0 &&
      lastActions.length > 0 &&
      getActionType(lastActions[lastActions.length - 1]) !== 'cc'
    )
  ) {
    // If only one active player, only proceed if they made a bet that wasn't a call (e.g. an uncalled open bet)
    // The check also ensures playerBets[active_player_idx] > 0 to avoid issues with 0 bets.
    // And that lastActions is not empty to prevent error on getActionType
    return { amount: 0, playerIndex: null };
  }

  const activePlayerBets = Array.from(activePlayers).map(idx => ({ idx, bet: playerBets[idx] }));
  const maxBet = Math.max(...activePlayerBets.map(p => p.bet));
  const playersWithMaxBet = activePlayerBets.filter(p => p.bet === maxBet);

  // If multiple players have the max bet or no player has a bet, no uncalled portion
  if (playersWithMaxBet.length !== 1) {
    return { amount: 0, playerIndex: null };
  }

  // Find the second highest bet from active players
  const maxBetPlayer = playersWithMaxBet[0].idx;
  const otherActiveBets = activePlayerBets.filter(p => p.idx !== maxBetPlayer).map(p => p.bet);

  // If no other active players, return 0
  if (otherActiveBets.length === 0) {
    return { amount: 0, playerIndex: null };
  }

  const secondHighest = Math.max(...otherActiveBets);
  const uncalledAmount = maxBet - secondHighest;

  return {
    amount: uncalledAmount > 0 ? uncalledAmount : 0,
    playerIndex: uncalledAmount > 0 ? maxBetPlayer : null,
  };
}

function narrateStreet(
  actions: string[],
  hand: Hand,
  table: any,
  currency: string,
  street: string,
  stacksAtStreetStart: number[],
  initialRoundBet: number = 0
): StreetNarrateResult {
  const playerCount = hand.players.length;
  const stacks = stacksAtStreetStart.slice(); // Use stacks passed from handToPokerstars
  const bets = Array(playerCount).fill(0);
  let output: string[] = [];
  let currentBet = initialRoundBet; // Use initialCurrentBet for preflop BB
  let hasBet = initialRoundBet > 0; // If BB is posted, a bet has been made

  // Account for posted blinds/straddles and dead blinds in initial bets and stacks for preflop
  if (street === 'preflop') {
    const deadBlindsInput = hand._deadBlinds || []; // Handle if _deadBlinds is undefined

    for (let i = 0; i < playerCount; i++) {
      const liveBlindOrStraddle = hand.blindsOrStraddles[i] || 0;
      const deadBlindAmount = deadBlindsInput[i] || 0; // Get dead blind for the player

      if (liveBlindOrStraddle > 0) {
        // Live blinds/straddles count towards the current bet on the street
        bets[i] = liveBlindOrStraddle;
        stacks[i] -= liveBlindOrStraddle; // Deduct live portion from stack
      }

      if (deadBlindAmount > 0) {
        stacks[i] -= deadBlindAmount; // Deduct dead portion from stack
        // Dead blinds do not typically count towards `bets[i]` for the purpose of
        // calculating raises or calls against the current `currentBet`. They are "dead".
      }
    }
  }

  // Track folded players by street
  if (!(table as any).foldedByStreet) {
    (table as any).foldedByStreet = {
      preflop: new Set(),
      flop: new Set(),
      turn: new Set(),
      river: new Set(),
    };
  }

  for (const action of actions) {
    if (action.startsWith('d dh')) continue;
    const idx = getActionPlayerIndex(action) ?? 0;
    const type = getActionType(action);
    const player = idx >= 0 ? hand.players[idx] : '';
    const isPlayerAllIn = !!table.players[idx].isAllIn;
    const isLastPlayerAction =
      hand.actions.filter(a => !a.includes('sm') && a.includes(`p${idx + 1}`)).at(-1) === action;

    if (idx < 0) continue;

    if (type === 'f') {
      output.push(`${player}: folds`);
      // Track fold street for summary
      if ((table as any).foldedByStreet) {
        (table as any).foldedByStreet[street].add(idx);
      }
      continue;
    }

    if (type === 'cc') {
      // Call or check
      const amount = getActionAmount(action);
      // For preflop, players who previously posted blinds "complete" rather than call
      const isBlindCompletion =
        street === 'preflop' &&
        hand.blindsOrStraddles[idx] > 0 &&
        currentBet > hand.blindsOrStraddles[idx] &&
        amount &&
        amount > 0;

      // Important check: Is there a current bet to call, regardless of reported amount?
      // This fixes issues where cc after a raise should be a call, not a check
      if (currentBet > 0 && bets[idx] < currentBet) {
        // This is a call
        const callAmount = currentBet - bets[idx];
        const actualCall = Math.min(callAmount, stacks[idx]);
        bets[idx] += actualCall;
        stacks[idx] -= actualCall;

        let line = `${player}: calls ${formatMoney(actualCall, currency)}`;
        if (stacks[idx] === 0 || (isLastPlayerAction && isPlayerAllIn)) line += ' and is all-in';
        output.push(line);
      } else if (!amount || amount === 0 || amount === bets[idx]) {
        // True check (no money added)
        output.push(
          `${player}: checks${isLastPlayerAction && isPlayerAllIn ? ' and is all-in' : ''}`
        );
      } else {
        // Call with explicit amount
        let callAmount = amount - bets[idx]; // Only the additional amount put in
        if (callAmount < 0) callAmount = 0;

        // Apply to stack and bets
        const actualCall = Math.min(callAmount, stacks[idx]);
        bets[idx] += actualCall;
        stacks[idx] -= actualCall;

        let line = '';
        if (isBlindCompletion) {
          line = `${player}: calls ${formatMoney(actualCall, currency)}`;
        } else {
          line = `${player}: calls ${formatMoney(actualCall, currency)}`;
        }

        if (stacks[idx] === 0 || (isLastPlayerAction && isPlayerAllIn)) line += ' and is all-in';
        output.push(line);
      }
      continue;
    }

    if (type === 'cbr') {
      // Bet or raise
      const amount = getActionAmount(action);
      if (amount === undefined) continue;

      const previousBet = bets[idx];
      const totalBet = Math.min(amount, previousBet + stacks[idx]);
      const putIn = totalBet - previousBet;

      bets[idx] = totalBet;
      stacks[idx] -= putIn;

      let line = '';
      if (!hasBet || currentBet === 0) {
        // Open bet (first bet on street)
        line = `${player}: bets ${formatMoney(putIn, currency)}`;
        hasBet = true;
      } else {
        // Raise - correctly calculate raise TO and BY amounts
        const raiseBy = totalBet - currentBet;
        line = `${player}: raises ${raiseBy > 0 ? `${formatMoney(raiseBy, currency)} ` : ''}to ${formatMoney(totalBet, currency)}`;
      }

      if (stacks[idx] === 0 || (isLastPlayerAction && isPlayerAllIn)) line += ' and is all-in';
      output.push(line);
      currentBet = Math.max(currentBet, totalBet);
      continue;
    }

    if (type === 'm') {
      output.push(`${player} said, "${action.split(' ').slice(2).join(' ')}"`);
      continue;
    }
  }
  return { narrationLines: output, streetBets: bets, stacksAtStreetEnd: stacks };
}

// Helper: Validate if a string is a proper poker card
function isValidCard(card: string): boolean {
  if (!card || card.length !== 2) return false;
  const rank = card[0];
  const suit = card[1];
  const validRanks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const validSuits = ['h', 'd', 'c', 's'];
  return validRanks.includes(rank) && validSuits.includes(suit);
}

// Helper: PokerStars-style hand description
export function describeHand(cards: Card[], board: Card[]): string {
  // cards: array of 2 strings, e.g. ['Kd', 'Ad']
  if (!cards || cards.length !== 2) return '';
  if (!board) board = [];
  const hand = [cards[0] as Card, cards[1] as Card];
  const boardCards = board.filter(c => c && isValidCard(c)).map(c => c as Card);
  const all = hand.concat(boardCards);
  if (all.length < 5) return '';
  // Find the best 5-card hand
  const best = getBestCardCombo(all);
  const bestStrength = calculateHandStrength(best);
  const category = getRankCategory(bestStrength);
  switch (category) {
    case 'High Card':
      return `(high card ${handHighCard(best)})`;
    case 'One Pair':
      return `(a pair of ${handPairRank(best, 2)})`;
    case 'Two Pair':
      return `(two pair, ${handPairRank(best, 2)})`;
    case 'Three of a Kind':
      return `(three of a kind, ${handPairRank(best, 3)})`;
    case 'Straight':
      return `(a straight, ${handStraightHigh(best)})`;
    case 'Flush':
      return `(a flush, ${handHighCard(best)} high)`;
    case 'Full House':
      return `(a full house, ${handPairRank(best, 3)} full of ${handPairRank(best, 2)})`;
    case 'Four of a Kind':
      return `(four of a kind, ${handPairRank(best, 4)})`;
    case 'Straight Flush':
      return `(a straight flush, ${handStraightHigh(best)})`;
    default:
      return `(${category})`;
  }
}

// Helper: get the highest card in the hand
function handHighCard(cards: Card[]): string {
  const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const sorted = cards.slice().sort((a, b) => rankOrder.indexOf(b[0]) - rankOrder.indexOf(a[0]));
  return rankToWord(sorted[0][0]);
}

// Helper: get the rank(s) of the pair/trips/quads for description
function handPairRank(cards: Card[], count: number): string {
  const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const counts: Record<string, number> = {};
  for (const c of cards) counts[c[0]] = (counts[c[0]] || 0) + 1;
  const pairs = Object.entries(counts)
    .filter(([_, v]) => v === count)
    .map(([r]) => r)
    .sort((a, b) => rankOrder.indexOf(b) - rankOrder.indexOf(a));
  if (pairs.length === 0) return '';
  if (count === 2 && pairs.length >= 2)
    return `${rankToPlural(pairs[0])} and ${rankToPlural(pairs[1])}`;
  return rankToPlural(pairs[0]);
}

// Pluralize rank for PokerStars-style output
function rankToPlural(r: string): string {
  switch (r) {
    case 'A':
      return 'Aces';
    case 'K':
      return 'Kings';
    case 'Q':
      return 'Queens';
    case 'J':
      return 'Jacks';
    case 'T':
      return 'Tens';
    case '9':
      return 'Nines';
    case '8':
      return 'Eights';
    case '7':
      return 'Sevens';
    case '6':
      return 'Sixes';
    case '5':
      return 'Fives';
    case '4':
      return 'Fours';
    case '3':
      return 'Threes';
    case '2':
      return 'Deuces';
    default:
      return r;
  }
}

// Helper: get the high card of a straight/straight flush
function handStraightHigh(cards: Card[]): string {
  const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const unique = Array.from(new Set(cards.map(c => c[0])));
  const idxs = unique.map(r => rankOrder.indexOf(r)).sort((a, b) => b - a);
  if (
    idxs.includes(12) &&
    idxs.includes(0) &&
    idxs.includes(1) &&
    idxs.includes(2) &&
    idxs.includes(3)
  )
    return 'Five';
  return rankToWord(rankOrder[idxs[0]]);
}

// Helper: rank to PokerStars word
function rankToWord(r: string): string {
  switch (r) {
    case 'A':
      return 'Ace';
    case 'K':
      return 'King';
    case 'Q':
      return 'Queen';
    case 'J':
      return 'Jack';
    case 'T':
      return 'Ten';
    case '9':
      return 'Nine';
    case '8':
      return 'Eight';
    case '7':
      return 'Seven';
    case '6':
      return 'Six';
    case '5':
      return 'Five';
    case '4':
      return 'Four';
    case '3':
      return 'Three';
    case '2':
      return 'Two';
    default:
      return r;
  }
}

// Helper: Find the best 5-card hand from a set of cards
function getBestCardCombo(cards: Card[]): Card[] {
  let best: Card[] = cards.slice(0, 5) as Card[]; // Ensure initial best is typed as Card[]
  if (cards.length < 5) return cards as Card[]; // Not enough cards for a 5-card hand

  let bestStrength = calculateHandStrength(best);
  for (let i = 0; i < cards.length - 4; ++i) {
    for (let j = i + 1; j < cards.length - 3; ++j) {
      for (let k = j + 1; k < cards.length - 2; ++k) {
        for (let l = k + 1; l < cards.length - 1; ++l) {
          for (let m = l + 1; m < cards.length; ++m) {
            const combo = [cards[i], cards[j], cards[k], cards[l], cards[m]];
            const strength = calculateHandStrength(combo);
            if (strength < bestStrength) {
              bestStrength = strength;
              best = combo;
            }
          }
        }
      }
    }
  }
  return best;
}

// --- Robust uncalled bet and pot calculation --- (Moved near its usage in generateSummaryBlock or keep global)
// Let's move it to be a global helper as it was before, for simplicity in this refactoring step.
function getRobustFinalPot(players: any[], hand: Hand): number | undefined {
  // Added hand param
  const active = players.filter(p => !p.hasFolded && !p.isInactive);
  if (active.length !== 1) return undefined; // Only for single-winner-by-fold
  const winner = active[0];
  const others = players.filter(p => p !== winner);
  const highestOther = Math.max(0, ...others.map(p => p.totalBet || 0));
  const winnerTotalBet = winner.totalBet || 0;
  const uncalled = winnerTotalBet - highestOther;
  let winnerBet = winnerTotalBet;
  if (uncalled > 0) {
    winnerBet -= uncalled;
  }
  // Add antes to the pot
  const anteSum = Array.isArray(hand.antes) ? hand.antes.reduce((a, b) => a + b, 0) : 0;
  const pot = others.reduce((sum, p) => sum + (p.totalBet || 0), 0) + winnerBet + anteSum;
  return pot;
}
