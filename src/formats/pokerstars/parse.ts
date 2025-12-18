/**
 * Single Function Parser (PokerStars → PHH)
 *
 * @instructions Parse all actions exactly as they appear in the hand history.
 * Do not attempt to optimize or remove redundant actions during parsing.
 * Compression of redundant actions should be handled separately by compactActions.
 */

import { Temporal } from '@js-temporal/polyfill';
import * as Poker from '../../index.ts';

// Regex patterns for parsing different parts of the hand history
const HAND_HEADER_REGEX = /^(.*?) Hand #(\d+):.*? - (.*)$/;
const TABLE_INFO_REGEX = /Table '([^']+)' (\d+)-max(?: \(Play Money\))? Seat #(\d+) is the button/;
const SB_REGEX = /^(.*?): posts small blind ([^\n]+?)$/;
const BB_REGEX = /^(.*?): posts big blind ([^\n]+?)$/;
const DEAD_REGEX = /^(.*?): posts small & big blinds ([^\n]+?)$/;
const SEAT_LINE_REGEX = /^Seat (\d+): (.+) \(([^\n]+?) in chips\)( is sitting out)?/i;
const DEALT_TO_REGEX = /Dealt to ([^[]+) \[([^\]]+)\]/;
const SHOWS_REGEX = /^(.*?): shows \[([^\]]+)\]/;
const MUCKS_REGEX = /^(.*?): mucks hand$/;
const SUMMARY_MUCKED = /^Seat \d+: ([^(]+).*?mucked.*?\[([^\]]+)\]/;
const STREET_REGEX = /^\*\*\* (FLOP|TURN|RIVER) \*\*\* (\[([^\]]+)\]\s*)*$/;
const ACTION_LINE_REGEX =
  /^(.*?): (folds|checks|calls|bets|raises)(?: ([^\n]+?))?(?: to ([^\n]+?))?$/;
const CHAT_REGEX = /^(.*?) said, "([^"]+)"/;
const STREETS = ['preflop', 'flop', 'turn', 'river'] as const;
type Street = (typeof STREETS)[number];

// Action compaction/expansion helpers

// Timezone mapping - only for abbreviations NOT supported by Date.parse()
export const TIMEZONE_MAPPING: Record<string, string> = {
  // Abbreviations that Date.parse() cannot handle
  ET: 'America/New_York', // Eastern Time - used in most test fixtures
  MSK: 'Europe/Moscow', // Moscow Standard Time - used in fixtures 13 & 14

  // Other common abbreviations that Date.parse() fails on
  CET: 'Europe/Berlin', // Central European Time
  CEST: 'Europe/Berlin', // Central European Summer Time
  BST: 'Europe/London', // British Summer Time
};

/**
 * Parse a datetime string like "2020/09/17 14:52:46 ET" using Temporal API
 * Parse other datetime strings using Date.parse()
 * @returns {Object} - Object containing year, month, day, time, timestamp, and timeZone
 */
function parseDateTimeWithTimezone(dateTimeStr: string): {
  year: number;
  month: number;
  day: number;
  time: string;
  timestamp: number;
  timeZone: string;
} {
  // Extract components using regex
  const match = dateTimeStr.match(
    /(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})\s+(\w+)/
  );
  if (!match) {
    throw new Error(`Invalid datetime format: ${dateTimeStr}`);
  }

  const [, year, month, day, hour, minute, second, tzAbbr] = match;
  const dateTimeComponents = {
    year: parseInt(year, 10),
    month: parseInt(month, 10),
    day: parseInt(day, 10),
    hour: parseInt(hour, 10),
    minute: parseInt(minute, 10),
    second: parseInt(second, 10),
  };

  const ianaTimeZone = TIMEZONE_MAPPING[tzAbbr];

  if (!ianaTimeZone) {
    // Construct a date string in ISO-like format with timezone that Date.parse() can handle
    // Format: "2017-08-08 23:16:30 GMT"
    const parsableDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')} ${tzAbbr}`;

    const timestamp = Date.parse(parsableDateStr);

    if (isNaN(timestamp)) {
      throw new Error(`Unable to parse datetime: ${dateTimeStr} (constructed: ${parsableDateStr})`);
    }

    // Format time as "YYYY-MM-DDTHH:MM:SS" without milliseconds and timezone
    const timeStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;

    return {
      ...dateTimeComponents,
      time: timeStr,
      timestamp,
      timeZone: tzAbbr,
    };
  }

  // Create ZonedDateTime using Temporal API
  const zoned = Temporal.ZonedDateTime.from({
    ...dateTimeComponents,
    timeZone: ianaTimeZone,
  });

  return {
    timestamp: zoned.epochMilliseconds,
    year: zoned.year,
    month: zoned.month,
    day: zoned.day,
    time: zoned.toPlainDateTime().toString(),
    timeZone: tzAbbr, // Preserve original timezone label
  };
}

export function parseHandIdentifiers(line: string) {
  const hdr = HAND_HEADER_REGEX.exec(line);
  if (!hdr) {
    throw new Error('Cant parse hand identifiers');
  }

  let venue = String(hdr[1].replaceAll('Home Game', '')).trim();

  const hand = parseInt(hdr[2], 10); // Parse as number for hand field
  const dateStr = hdr[3].trim();
  const { timestamp, timeZone, year, month, day, time } = parseDateTimeWithTimezone(dateStr);
  return {
    venue,
    hand,
    timestamp,
    timeZone,
    year,
    month,
    day,
    time,
    id: `${venue}-${hand}`,
  };
}

export function parseHeaderInfo(lines: string[]) {
  const { venue, hand, timestamp, timeZone, year, month, day, time } = parseHandIdentifiers(
    lines[0]
  );
  let table = '';
  let currency = 'USD';
  let smallBlind = 0,
    bigBlind = 0;
  let variant: Poker.Variant = 'NT'; // Default to No-limit Texas hold 'em
  let seatCount = 9; // Default to 9-max
  let buttonSeat = 1;

  for (const line of lines) {
    // Check for play money indicator
    if (line.includes('(Play Money)')) {
      currency = 'PLAY';
    }

    const tableMatch = TABLE_INFO_REGEX.exec(line);
    if (tableMatch) {
      table = tableMatch[1];
      seatCount = parseInt(tableMatch[2], 10);
      buttonSeat = parseInt(tableMatch[3], 10);
    }

    const sbM = SB_REGEX.exec(line);
    if (sbM) smallBlind = parseAmount(sbM[2]);
    const bbM = BB_REGEX.exec(line);
    if (bbM) bigBlind = parseAmount(bbM[2]);

    // Determine variant based on line content
    if (line.includes("No Limit Hold'em")) variant = 'NT';
    else if (line.includes("Fixed Limit Hold'em")) variant = 'FT';
    else if (line.includes('Pot Limit Omaha')) variant = 'PO';
    else if (line.includes('Fixed Limit Omaha Hi/Lo')) variant = 'FO/8';
    else if (line.includes('Fixed Limit Seven Card Stud')) variant = 'F7S';
    else if (line.includes('Fixed Limit Razz')) variant = 'FR';
    // Add more conditions for other variants as needed
  }

  return {
    year,
    month,
    day,
    time,
    hand,
    venue,
    table,
    timestamp,
    timeZone,
    currency,
    smallBlind,
    bigBlind,
    variant,
    seatCount,
    buttonSeat,
  };
}

function parseSeatInfo(lines: string[]) {
  const seatInfos: {
    seat: number;
    seatIndex: number;
    name: string;
    stack: number;
    isInactive: number;
  }[] = [];
  const inactiveIndices: number[] = [];

  let counter = 0;
  for (const line of lines) {
    const seatM = SEAT_LINE_REGEX.exec(line);
    if (seatM) {
      counter++;
      const isSittingOut = !!seatM[4]; // Use capture group 4 from the regex
      const playerInfo = {
        seat: +seatM[1],
        seatIndex: counter,
        name: seatM[2].trim(),
        stack: parseAmount(seatM[3]),
        isInactive: isSittingOut ? 1 : 0,
      };
      seatInfos.push(playerInfo);
    }
  }

  seatInfos.sort((a, b) => a.seat - b.seat);
  const nameToPos = new Map<string, number>();
  seatInfos.forEach((si, idx) => {
    nameToPos.set(si.name, idx + 1);
    inactiveIndices[idx] = si.isInactive;
  });

  const players = seatInfos.map(si => si.name);
  const startingStacks = seatInfos.map(si => si.stack);

  return { seatInfos, nameToPos, players, startingStacks, inactiveIndices };
}

function parseCardInfo(lines: string[]) {
  const holeCards = new Map<string, string>();
  const showdownCards = new Map<string, string>();
  const showdownPlayers = new Set<string>();

  for (const line of lines) {
    const dt = DEALT_TO_REGEX.exec(line);
    if (dt) {
      holeCards.set(dt[1].trim(), dt[2].trim());
    }
    const sm = SHOWS_REGEX.exec(line);
    if (sm) {
      showdownPlayers.add(sm[1].trim());
      showdownCards.set(sm[1].trim(), sm[2].trim());
    }
    const mk = MUCKS_REGEX.exec(line);
    if (mk) {
      showdownPlayers.add(mk[1].trim());
    }
    const summ = SUMMARY_MUCKED.exec(line);
    if (summ) {
      showdownPlayers.add(summ[1].trim());
      if (summ[2].trim()) showdownCards.set(summ[1].trim(), summ[2].trim());
    }
  }

  return { holeCards, showdownCards, showdownPlayers };
}

// Helper functions
function parseAmount(amountStr: string | undefined): number {
  if (!amountStr) return 0;
  return parseFloat(parseFloat(amountStr.replace(/[^\d.]/g, '')).toFixed(5));
}

function formatCards(cards: string): string {
  // Remove any whitespace, brackets, and normalize card format
  return cards.replace(/[\s+\]\[]/g, '').replace(/10/g, 'T');
}

function formatAction(pos: number, type: Poker.ActionType, amount?: number): Poker.Action {
  if (amount != undefined) {
    return `p${pos} ${type} ${amount}` as Poker.Action;
  }
  return `p${pos} ${type}` as Poker.Action;
}

function formatBoardAction(cards: string): Poker.Action {
  // Ensure we're dealing with a clean card sequence
  const formattedCards = formatCards(cards);
  return `d db ${formattedCards}` as Poker.Action;
}

function formatShowdownAction(pos: number, cards: string): Poker.Action {
  // Ensure we're dealing with a clean card sequence
  const formattedCards = formatCards(cards);
  return `p${pos} sm${cards ? ` ${formattedCards}` : ''}` as Poker.Action;
}

function processActions(
  lines: string[],
  nameToPos: Map<string, number>,
  _seatCount: number,
  pendingHoleCards: Map<string, string>,
  showdownCards: Map<string, string>,
  showdownPlayers: Set<string>,
  inactiveIndices: number[]
) {
  const actions: Poker.Action[] = [];
  const foldedPlayers = new Set<string>();

  let street: Street = 'preflop';
  let isShowdown = false;

  // Deal hole cards first, before any actions
  // Get all players in position order
  const playersByPosition = Array.from(nameToPos.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([name]) => name);

  // Add deal actions for each player
  for (let i = 0; i < playersByPosition.length; i++) {
    if (inactiveIndices[i]) continue;
    const name = playersByPosition[i];
    const pos = i + 1;
    const cards = pendingHoleCards.has(name) ? formatCards(pendingHoleCards.get(name)!) : '????';
    actions.push(`d dh p${pos} ${cards}` as Poker.Action);
  }
  pendingHoleCards.clear();

  for (const line of lines) {
    // Check if we've hit showdown section
    if (line.startsWith('*** SHOW DOWN ***') || line.includes('shows') || line.includes('mucks')) {
      isShowdown = true;
    }

    // Check for chat messages
    const chat = CHAT_REGEX.exec(line);
    if (chat) {
      const playerName = chat[1].trim();
      const message = chat[2].trim();
      if (nameToPos.has(playerName)) {
        const pos = nameToPos.get(playerName)!;
        actions.push(`p${pos} m ${message}`);
      }
      continue;
    }

    // Street transition check
    const sr = STREET_REGEX.exec(line);
    if (sr) {
      const newStreet = sr[1].toLowerCase() as Street;
      const currentStreetIndex = STREETS.indexOf(street);
      const newStreetIndex = STREETS.indexOf(newStreet);

      if (newStreetIndex !== currentStreetIndex + 1) {
        throw new Error(`Invalid street order: received ${newStreet} after ${street}`);
      }
      street = newStreet;
      // Board dealing
      if (street === 'flop') {
        actions.push(formatBoardAction(sr[2]));
      } else {
        const newCard = sr[3].split(/\s/g).pop();
        if (newCard) {
          actions.push(formatBoardAction(newCard));
        }
      }
      continue;
    }

    // Otherwise, see if it's an action line
    const m = ACTION_LINE_REGEX.exec(line);
    if (!m) continue;

    const playerName = m[1].trim();
    // Skip actions from players who have already folded
    if (foldedPlayers.has(playerName)) continue;

    const verb = m[2]; // folds/checks/calls/bets/raises
    const amountStr = parseAmount(m[4] || m[3]); // numeric amount if present
    if (!nameToPos.has(playerName)) continue;

    const pos = nameToPos.get(playerName)!;

    // Determine action type and format
    switch (verb) {
      case 'folds': {
        actions.push(formatAction(pos, 'f'));
        foldedPlayers.add(playerName);
        break;
      }
      case 'checks': {
        actions.push(formatAction(pos, 'cc'));
        break;
      }
      case 'calls': {
        const isAllIn = line.toLowerCase().includes('all-in');
        actions.push(isAllIn ? formatAction(pos, 'cc', amountStr) : formatAction(pos, 'cc'));
        break;
      }
      case 'bets':
      case 'raises': {
        actions.push(formatAction(pos, 'cbr', amountStr));
        break;
      }
    }
  }

  // Add showdown actions if needed
  if (isShowdown) {
    showdownPlayers.forEach(player => {
      if (!foldedPlayers.has(player)) {
        const pos = nameToPos.get(player);
        if (pos !== undefined) {
          const cards = showdownCards.get(player) || '';
          actions.push(formatShowdownAction(pos, cards));
        }
      }
    });
  }

  return { actions };
}

// Type guards for game variants
function isStudGame(variant: Poker.Variant): variant is Poker.StudVariant {
  return variant === 'F7S' || variant === 'F7S/8' || variant === 'FR';
}

function isFixedLimitGame(
  variant: Poker.Variant
): variant is Exclude<Poker.FixedLimitVariant, Poker.StudVariant> {
  return variant === 'FT' || variant === 'FO/8' || variant === 'F2L3D' || variant === 'FB';
}

export function parseHand(handText: string): Poker.Hand {
  // 1) Preprocess lines
  const lines = handText
    .split(/\n/g)
    .map(ln => ln.trim())
    .filter(Boolean);

  // 2) Parse header info
  const {
    year,
    month,
    day,
    time,
    hand,
    venue,
    table,
    timestamp,
    timeZone,
    currency,
    smallBlind,
    bigBlind,
    variant,
    seatCount,
    buttonSeat,
  } = parseHeaderInfo(lines);

  // 3) Parse seat info
  const { seatInfos, nameToPos, players, startingStacks, inactiveIndices } = parseSeatInfo(lines);
  // Store original seat numbers
  let seats: Poker.Hand['seats'] = seatInfos
    .sort((a, b) => a.seatIndex - b.seatIndex)
    .map(si => si.seat);

  // Find the button player's position in our array
  const seatToPosition = new Map<number, number>();

  // First, create a mapping from seat numbers to positions
  seatInfos.forEach((si, idx) => {
    seatToPosition.set(si.seat, idx);
  });

  // Now find the button position using the mapping
  const buttonPos = seatToPosition.get(buttonSeat);
  if (buttonPos === undefined) {
    throw new Error(`Button seat ${buttonSeat} not found in seat info`);
  }
  // Set up blinds and straddles array
  const blindsOrStraddles = Array(players.length).fill(0);
  const antes = Array(players.length).fill(0);
  const deadBlinds = Array(players.length).fill(0);

  // Keep track of which blinds have been posted already
  let smallBlindPosted = false;

  // Process all blinds and straddles from the hand history
  for (const line of lines) {
    // Small blind
    const sbM = SB_REGEX.exec(line);
    if (sbM) {
      const playerName = sbM[1].trim();
      const pos = nameToPos.get(playerName);
      if (pos !== undefined) {
        if (smallBlindPosted) {
          // If SB has already been posted, this is a dead blind
          deadBlinds[pos - 1] = parseAmount(sbM[2]);
        } else {
          blindsOrStraddles[pos - 1] = parseAmount(sbM[2]);
          smallBlindPosted = true;
        }
      }
    }

    // Big blind
    const bbM = BB_REGEX.exec(line);
    if (bbM) {
      const playerName = bbM[1].trim();
      const pos = nameToPos.get(playerName);
      if (pos !== undefined) {
        blindsOrStraddles[pos - 1] = parseAmount(bbM[2]);
      }
    }

    // SB + BB blinds
    const dbM = DEAD_REGEX.exec(line);
    if (dbM) {
      const playerName = dbM[1].trim();
      const pos = nameToPos.get(playerName);
      if (pos !== undefined) {
        deadBlinds[pos - 1] = smallBlind;
        blindsOrStraddles[pos - 1] = bigBlind;
      }
    }

    // Straddle
    const straddleMatch = line.match(/^(.*?): posts straddle ([^\n]+?)$/);
    if (straddleMatch) {
      const playerName = straddleMatch[1].trim();
      const pos = nameToPos.get(playerName);
      if (pos !== undefined) {
        blindsOrStraddles[pos - 1] = parseAmount(straddleMatch[2]);
      }
    }

    // Ante posting
    const anteMatch = line.match(/^(.*?): posts the ante ([^\n]+?)$/);
    if (anteMatch) {
      const playerName = anteMatch[1].trim();
      const pos = nameToPos.get(playerName);
      if (pos !== undefined) {
        antes[pos - 1] = parseAmount(anteMatch[2]);
      }
    }
  }

  // 4) Parse card info
  const { holeCards, showdownCards, showdownPlayers } = parseCardInfo(lines);

  // 5) Parse rake info
  let rake = 0;
  let totalPot = 0;
  for (const line of lines) {
    if (line.startsWith('Total pot')) {
      const match = line.match(/Total pot ([^\n]+)\s*\|\s*Rake ([^\n]+)$/);
      if (match) {
        totalPot = parseAmount(match[1]);
        rake = parseAmount(match[2]);
      }
    }
  }

  // Track hole cards to deal them in sequence with actions
  const pendingHoleCards = new Map<string, string>();
  for (const si of seatInfos) {
    if (holeCards.has(si.name)) {
      pendingHoleCards.set(si.name, holeCards.get(si.name)!);
    }
  }

  // Process all actions
  const { actions } = processActions(
    lines,
    nameToPos,
    seatCount,
    pendingHoleCards,
    showdownCards,
    showdownPlayers,
    inactiveIndices
  );

  const baseHand: Poker.Hand = {
    venue,
    variant,
    currency,
    timeZone,
    timestamp,
    players,
    startingStacks,
    blindsOrStraddles,
    antes,
    actions,
    year,
    month,
    day,
    time,
    table,
    hand,
    seatCount,
    rake,
    totalPot,
    seats,
  } as Poker.Hand;
  if (inactiveIndices.some(i => i)) {
    Object.assign(baseHand, { _inactive: inactiveIndices });
  }

  // Add dead blinds to the game object if any exist
  if (deadBlinds.some(db => db > 0)) {
    Object.assign(baseHand, { _deadBlinds: deadBlinds });
  }

  let result: Poker.Hand;

  if (isStudGame(variant)) {
    result = {
      ...baseHand,
      smallBet: bigBlind,
      bigBet: bigBlind * 2,
      bringIn: Math.floor(bigBlind / 4),
    } as Poker.StudHand;
  } else if (isFixedLimitGame(variant)) {
    result = {
      ...baseHand,
      smallBet: bigBlind,
      bigBet: bigBlind * 2,
    } as Poker.FixedLimitHand;
  } else {
    result = {
      ...baseHand,
      minBet: bigBlind,
    } as Poker.NoLimitHand;
  }

  Poker.Hand.validate(result);
  return result;
}
