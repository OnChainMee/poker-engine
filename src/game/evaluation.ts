import { Card, ranks, suits } from '../types';
import * as tables from './tables/index';

const rank = Object.fromEntries(ranks.map((r, i) => [r, i]));
const reverseRank = Object.fromEntries(ranks.map((r, i) => [`${i}`, r]));

const suit = Object.fromEntries(suits.map((r, i) => [r, i]));
const reverseSuit = Object.fromEntries(suits.map((r, i) => [`${i}`, r]));

export const numberOfCards = ranks.length * suits.length;

export const cardToId = (card: Card): number => rank[card[0]] * 4 + suit[card[1]];

export const idToCard = (id: number): Card => {
  if (id < 0 || id > numberOfCards - 1) {
    throw new Error(`Id(${id}) is not a card id`);
  }

  return `${reverseRank[`${Math.floor(id / 4)}`]}${reverseSuit[`${id % 4}`]}` as Card;
};

export const parse = (str: string): Card => {
  if (str.length === 2) {
    const [r, s] = str.split('').map(c => c.toUpperCase());

    if (rank[r] !== undefined && suit[s] !== undefined) {
      return `${r}${s}` as Card;
    }
  }

  console.log('str', str);
  throw new Error('Unexpected Card input');
};

export const equalsCard = (a: Card, b: Card): boolean => a == b;

export const quinaryHash = (q: number[], numCards: number) => {
  const length = q.length;
  let sum = 0;
  let k = numCards;

  for (const [i, v] of q.entries()) {
    sum += tables.dp[v][length - i - 1][k];

    k -= v;

    if (k <= 0) {
      break;
    }
  }

  return sum;
};

export const stringify = (card: Card): string => `${card}`;

export const getRankCategory = (rank: number): string => {
  // 1277 high card
  if (rank > 6185) {
    return 'High Card';
  }
  // 2860 one pair
  if (rank > 3325) {
    return 'One Pair';
  }
  // 858 two pair
  if (rank > 2467) {
    return 'Two Pair';
  }
  // 858 three-kind
  if (rank > 1609) {
    return 'Three of a Kind';
  }
  // 10 straights
  if (rank > 1599) {
    return 'Straight';
  }
  // 1277 flushes
  if (rank > 322) {
    return 'Flush';
  }
  // 156 full house
  if (rank > 166) {
    return 'Full House';
  }
  // 156 four-kind
  if (rank > 10) {
    return 'Four of a Kind';
  }
  // 10 straight-flushes
  return 'Straight Flush';
};

const getCardRankValue = (card: Card): number => rank[card[0]];

const sortCards = (cards: Card[], ascending = false): Card[] => {
  return [...cards].sort((a, b) => {
    const rankA = getCardRankValue(a);
    const rankB = getCardRankValue(b);
    return ascending ? rankA - rankB : rankB - rankA;
  });
};

const groupCardsByRank = (cards: Card[]): Record<string, Card[]> => {
  return cards.reduce(
    (acc, card) => {
      const r = card[0];
      if (!acc[r]) {
        acc[r] = [];
      }
      acc[r].push(card);
      return acc;
    },
    {} as Record<string, Card[]>
  );
};

const groupCardsBySuit = (cards: Card[]): Record<string, Card[]> => {
  return cards.reduce(
    (acc, card) => {
      const s = card[1];
      if (!acc[s]) {
        acc[s] = [];
      }
      acc[s].push(card);
      return acc;
    },
    {} as Record<string, Card[]>
  );
};

const sortRankKeysDesc = (keys: string[]): string[] => {
  return [...keys].sort((a, b) => rank[b] - rank[a]);
};

const uniqueByRankDesc = (cards: Card[]): Card[] => {
  const seen: Record<string, boolean> = {};
  const out: Card[] = [];
  for (const c of sortCards(cards)) {
    const r = c[0];
    if (!seen[r]) {
      seen[r] = true;
      out.push(c);
    }
  }
  return out;
};

const findStraightFromUnique = (uniqueDesc: Card[]): Card[] => {
  // Wheel check (A-5)
  const set: Record<string, boolean> = {};
  for (const c of uniqueDesc) set[c[0]] = true;
  if (set['A'] && set['5'] && set['4'] && set['3'] && set['2']) {
    const wanted = ['5', '4', '3', '2', 'A'];
    return wanted.map(r => uniqueDesc.find(c => c[0] === r)!) as Card[];
  }
  for (let i = 0; i <= uniqueDesc.length - 5; i++) {
    const slice = uniqueDesc.slice(i, i + 5);
    if (getCardRankValue(slice[0]) - getCardRankValue(slice[4]) === 4) {
      return slice;
    }
  }
  return [];
};

const selectStraight = (cards: Card[]): Card[] => {
  const uniqueDesc = uniqueByRankDesc(cards);
  return findStraightFromUnique(uniqueDesc);
};

const selectFlush = (cards: Card[]): Card[] => {
  const bySuit = groupCardsBySuit(cards);
  const suitKey = Object.keys(bySuit).find(s => bySuit[s].length >= 5);
  if (!suitKey) return [];
  return sortCards(bySuit[suitKey]).slice(0, 5);
};

const selectStraightFlush = (cards: Card[]): Card[] => {
  const bySuit = groupCardsBySuit(cards);
  let best: Card[] = [];
  for (const s of Object.keys(bySuit)) {
    if (bySuit[s].length < 5) continue;
    const sf = selectStraight(bySuit[s]);
    if (sf.length === 5) {
      if (best.length === 0 || getCardRankValue(sf[0]) > getCardRankValue(best[0])) {
        best = sf;
      }
    }
  }
  return best;
};

const findRanksWithCount = (groups: Record<string, Card[]>, count: number): string[] => {
  const keys = Object.keys(groups).filter(r => groups[r].length >= count);
  return sortRankKeysDesc(keys);
};

const pickNCardsOfRank = (groups: Record<string, Card[]>, r: string, n: number): Card[] => {
  return groups[r] ? groups[r].slice(0, n) : [];
};

export const getCardsByCombo = (rankNum: number, cards: Card[]): Card[] => {
  const category = getRankCategory(rankNum);
  const sortedCards = sortCards(cards);
  const groups = groupCardsByRank(cards);

  if (category === 'High Card') {
    return sortedCards.slice(0, 1);
  }

  if (category === 'One Pair') {
    const pairRank = findRanksWithCount(groups, 2)[0];
    return pickNCardsOfRank(groups, pairRank, 2);
  }

  if (category === 'Two Pair') {
    const pairRanks = findRanksWithCount(groups, 2).slice(0, 2);
    const highPair = pickNCardsOfRank(groups, pairRanks[0], 2);
    const lowPair = pickNCardsOfRank(groups, pairRanks[1], 2);
    return [...highPair, ...lowPair];
  }

  if (category === 'Three of a Kind') {
    const threeRank = findRanksWithCount(groups, 3)[0];
    return pickNCardsOfRank(groups, threeRank, 3);
  }

  if (category === 'Straight') {
    return selectStraight(cards);
  }

  if (category === 'Flush') {
    return selectFlush(cards);
  }

  if (category === 'Full House') {
    const tripleRanks = findRanksWithCount(groups, 3);
    const trips = tripleRanks[0];
    const remaining: Record<string, Card[]> = {};
    for (const k of Object.keys(groups)) {
      const count = groups[k].length - (k === trips ? 3 : 0);
      if (count > 0) remaining[k] = groups[k].slice(0, count);
    }
    const pairRanks = findRanksWithCount(remaining, 2);
    const pair = pairRanks[0];
    return [...pickNCardsOfRank(groups, trips, 3), ...pickNCardsOfRank(groups, pair, 2)];
  }

  if (category === 'Four of a Kind') {
    const fourRank = findRanksWithCount(groups, 4)[0];
    return pickNCardsOfRank(groups, fourRank, 4);
  }

  // Straight Flush
  return selectStraightFlush(cards);
};

const minCards = 5;
const maxCards = 7;
const noFlushes: { [key: number]: number[] } = {
  5: tables.noFlush5,
  6: tables.noFlush6,
  7: tables.noFlush7,
};

export const calculateHandCodesStrength = (ids: number[]): number => {
  const size = ids.length;
  const noFlush = noFlushes[size];

  if (size < minCards || size > maxCards || !noFlush) {
    throw new Error(`The number of cards must be between ${minCards} and ${maxCards}.`);
  }

  let suitHash = 0;
  for (const card of ids) {
    suitHash += tables.suitbitById[card];
  }

  const flushSuit = tables.suits[suitHash];

  if (flushSuit) {
    const suitBinary = [0, 0, 0, 0];

    for (const card of ids) {
      suitBinary[card & 0x03] |= tables.binariesById[card];
    }

    return tables.flush[suitBinary[flushSuit - 1]];
  }

  const quinary = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (const card of ids) {
    quinary[card >> 2]++;
  }

  return noFlush[quinaryHash(quinary, size)];
};

export const calculateHandStrength = (cards: Card[]) => {
  return calculateHandCodesStrength(cards.map(c => cardToId(c)));
};

const rankNameSingular: Record<string, string> = {
  '2': 'Deuce',
  '3': 'Three',
  '4': 'Four',
  '5': 'Five',
  '6': 'Six',
  '7': 'Seven',
  '8': 'Eight',
  '9': 'Nine',
  T: 'Ten',
  J: 'Jack',
  Q: 'Queen',
  K: 'King',
  A: 'Ace',
};

const rankNamePlural: Record<string, string> = {
  '2': 'Deuces',
  '3': 'Threes',
  '4': 'Fours',
  '5': 'Fives',
  '6': 'Sixes',
  '7': 'Sevens',
  '8': 'Eights',
  '9': 'Nines',
  T: 'Tens',
  J: 'Jacks',
  Q: 'Queens',
  K: 'Kings',
  A: 'Aces',
};

export const analyzeCards = (cards: Card[]) => {
  const strength = calculateHandStrength(cards);
  const category = getRankCategory(strength);
  const selected = getCardsByCombo(strength, cards);

  const description = describeHand(category, selected);

  return { cards: selected, rank: category, description, strength };
};

const describeHand = (category: string, selected: Card[]): string => {
  const byRank = groupCardsByRank(selected);
  const rankKeys = sortRankKeysDesc(Object.keys(byRank));

  if (category === 'High Card') {
    const high = selected[0][0];
    return `${rankNameSingular[high]} High`;
  }
  if (category === 'One Pair') {
    const pairRank = rankKeys.find(r => byRank[r].length === 2)!;
    return `${rankNamePlural[pairRank]}`;
  }
  if (category === 'Two Pair') {
    const pairs = rankKeys.filter(r => byRank[r].length === 2).slice(0, 2);
    return `${rankNamePlural[pairs[0]]} and ${rankNamePlural[pairs[1]]}`;
  }
  if (category === 'Three of a Kind') {
    const trips = rankKeys.find(r => byRank[r].length === 3)!;
    return `${rankNamePlural[trips]}`;
  }
  if (category === 'Straight') {
    const high = selected[0][0];
    return `${rankNameSingular[high]} High`;
  }
  if (category === 'Flush') {
    const high = selected[0][0];
    return `${rankNameSingular[high]} High`;
  }
  if (category === 'Full House') {
    const trips = rankKeys.find(r => byRank[r].length === 3)!;
    const pair = rankKeys.find(r => byRank[r].length === 2)!;
    return `${rankNamePlural[trips]} full of ${rankNamePlural[pair]}`;
  }
  if (category === 'Four of a Kind') {
    const quads = rankKeys.find(r => byRank[r].length === 4)!;
    return `${rankNamePlural[quads]}`;
  }
  const ranksInStraight = selected.map(c => c[0]);
  const isRoyal = ['T', 'J', 'Q', 'K', 'A'].every(r => ranksInStraight.includes(r));
  if (isRoyal) {
    return 'Royal Flush';
  }
  const high = selected[0][0];
  return `${rankNameSingular[high]} High`;
};

export const getBestPlayers = (
  hands: readonly (ReadonlyArray<Card> | null)[],
  board: ReadonlyArray<Card>
): { index: number; cards: Card[]; rank: string; description: string; strength: number }[] => {
  // Guards: board must have 5 cards and no unknowns
  if (!board || board.length < 5) return [];
  const boardHasUnknown = board.some(c => c.length === 2 && c[0] === '?' && c[1] === '?');
  if (boardHasUnknown) return [];

  const analyses: ({
    index: number;
    cards: Card[];
    rank: string;
    description: string;
    strength: number;
  } | null)[] = hands.map((h, i) => {
    if (!h) return null;
    if (h.length !== 2) return null;
    const hasUnknown = h.some(c => c.length === 2 && c[0] === '?' && c[1] === '?');
    if (hasUnknown) return null;
    return { index: i, ...analyzeCards([...h, ...board]) };
  });

  let best: number | null = null;
  for (const a of analyses) {
    if (!a) continue;
    if (best === null || a.strength < best) best = a.strength;
  }
  if (best === null) return [];

  const winners: {
    index: number;
    cards: Card[];
    rank: string;
    description: string;
    strength: number;
  }[] = [];
  for (const a of analyses) {
    if (a && a.strength === best) winners.push(a);
  }
  return winners;
};
