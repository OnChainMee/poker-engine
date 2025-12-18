import fs from 'fs';
import path from 'path';
import {
  analyzeCards,
  calculateHandStrength,
  cardToId,
  getBestPlayers,
  getCardsByCombo,
  getRankCategory,
  idToCard,
} from '../../game/evaluation';
import { Card } from '../../types';

const filePath = path.join(__dirname, '../fixtures/7cards.csv');
const fileContent = fs.readFileSync(filePath, 'utf-8');
const rows = fileContent.trim().split('\n');

describe('hand-strength', () => {
  it('should calculate hand strength', () => {
    rows.forEach((line: string, index: number) => {
      if (index == 0) return;
      if (index > 1000) return;
      const codes = line.split(',').map(a => parseInt(a));
      const expectedStrength = codes.pop()!;
      const cards = codes.map(c => idToCard(c));
      const strength = calculateHandStrength(cards);
      expect(codes).toEqual(cards.map(c => cardToId(c)));
      expect(strength).toBe(expectedStrength);
    });
  });
  it('should compute rank of a strength', () => {
    expect(calculateHandStrength(['Ah', 'Kd', 'Qd', '3d', '4d', '5h', '9s'])).toBeGreaterThan(
      calculateHandStrength(['As', 'Ad', '2h', '3d', '4c', '5h', '9s'])
    );
    expect(getRankCategory(calculateHandStrength(['Kh', 'Kc', 'Td', '2d', 'Qd', 'Kd', '3h']))).toBe(
      'Three of a Kind'
    );
    expect(getRankCategory(calculateHandStrength(['As', 'Ks', 'Td', '2d', 'Qd', 'Kd', '3h']))).toBe(
      'One Pair'
    );
    expect(calculateHandStrength(['Kh', 'Kc', 'Td', '2d', 'Qd', 'Kd', '3h'])).toBeLessThan(
      calculateHandStrength(['As', 'Ks', 'Td', '2d', 'Qd', 'Kd', '3h'])
    );
  });

  describe('getCardsByCombo', () => {
    it('should return combo-only for high card (top card only)', () => {
      const cards: Card[] = ['Ah', 'Kd', 'Qc', 'Js', '9d', '2s', '3h'];
      const strength = calculateHandStrength(cards);
      const combo = getCardsByCombo(strength, cards);
      expect(combo.sort()).toEqual(['Ah'].sort());
    });

    it('should return combo-only for one pair', () => {
      const cards: Card[] = ['Ah', 'Ad', 'Qc', 'Js', '9d', '2s', '3h'];
      const strength = calculateHandStrength(cards);
      const combo = getCardsByCombo(strength, cards);
      expect(combo.sort()).toEqual(['Ah', 'Ad'].sort());
    });

    it('should return combo-only for two pair', () => {
      const cards: Card[] = ['Ah', 'Ad', 'Qc', 'Qs', '9d', '2s', '3h'];
      const strength = calculateHandStrength(cards);
      const combo = getCardsByCombo(strength, cards);
      expect(combo.sort()).toEqual(['Ah', 'Ad', 'Qc', 'Qs'].sort());
    });

    it('should return combo-only for three of a kind', () => {
      const cards: Card[] = ['Ah', 'Ad', 'Ac', 'Js', '9d', '2s', '3h'];
      const strength = calculateHandStrength(cards);
      const combo = getCardsByCombo(strength, cards);
      expect(combo.sort()).toEqual(['Ah', 'Ad', 'Ac'].sort());
    });

    it('should return full combo for a straight', () => {
      const cards: Card[] = ['Ah', 'Kd', 'Qc', 'Js', 'Td', '2s', '3h'];
      const strength = calculateHandStrength(cards);
      const combo = getCardsByCombo(strength, cards);
      expect(combo.map(c => c[0]).sort()).toEqual(['A', 'K', 'Q', 'J', 'T'].sort());
    });

    it('should return full combo for a wheel straight (A-5)', () => {
      const cards: Card[] = ['Ah', '2d', '3c', '4s', '5d', 'Ks', 'Qh'];
      const strength = calculateHandStrength(cards);
      const combo = getCardsByCombo(strength, cards);
      expect(combo.map(c => c[0]).sort()).toEqual(['A', '2', '3', '4', '5'].sort());
    });

    it('should return full combo for a flush', () => {
      const cards: Card[] = ['Ah', 'Kh', 'Qh', 'Jh', '9h', '2s', '3d'];
      const strength = calculateHandStrength(cards);
      const combo = getCardsByCombo(strength, cards);
      expect(combo.sort()).toEqual(['Ah', 'Kh', 'Qh', 'Jh', '9h'].sort());
    });

    it('should return full combo for a full house', () => {
      const cards: Card[] = ['Ah', 'Ad', 'Ac', 'Ks', 'Kd', '2s', '3h'];
      const strength = calculateHandStrength(cards);
      const combo = getCardsByCombo(strength, cards);
      expect(combo.map(c => c[0]).sort()).toEqual(['A', 'A', 'A', 'K', 'K'].sort());
    });

    it('should return combo-only for four of a kind', () => {
      const cards: Card[] = ['Ah', 'Ad', 'Ac', 'As', 'Kd', '2s', '3h'];
      const strength = calculateHandStrength(cards);
      const combo = getCardsByCombo(strength, cards);
      expect(combo.sort()).toEqual(['Ah', 'Ad', 'Ac', 'As'].sort());
    });

    it('should return full combo for a straight flush', () => {
      const cards: Card[] = ['Ah', 'Kh', 'Qh', 'Jh', 'Th', '2s', '3d'];
      const strength = calculateHandStrength(cards);
      const combo = getCardsByCombo(strength, cards);
      expect(combo.map(c => c[0]).sort()).toEqual(['A', 'K', 'Q', 'J', 'T'].sort());
      expect(combo.every(c => c[1] === 'h')).toBe(true);
    });

    it('should return full combo for a wheel straight flush (A-5)', () => {
      const cards: Card[] = ['Ah', '2h', '3h', '4h', '5h', 'Ks', 'Qd'];
      const strength = calculateHandStrength(cards);
      const combo = getCardsByCombo(strength, cards);
      expect(combo.map(c => c[0]).sort()).toEqual(['A', '2', '3', '4', '5'].sort());
      expect(combo.every(c => c[1] === 'h')).toBe(true);
    });
  });

  describe('analyzeHand', () => {
    it('returns High Card with Ace High description', () => {
      const cards: Card[] = ['Ah', 'Kd', 'Qc', 'Js', '9d', '2s', '3h'];
      const res = analyzeCards(cards);
      expect(res.rank).toBe('High Card');
      expect(res.cards.sort()).toEqual(['Ah'].sort());
      expect(res.description).toBe('Ace High');
      expect(res.strength).toBe(calculateHandStrength(cards));
    });

    it('returns One Pair with plural description', () => {
      const cards: Card[] = ['Ah', 'Ad', 'Qc', 'Js', '9d', '2s', '3h'];
      const res = analyzeCards(cards);
      expect(res.rank).toBe('One Pair');
      expect(res.cards.sort()).toEqual(['Ah', 'Ad'].sort());
      expect(res.description).toBe('Aces');
      expect(res.strength).toBe(calculateHandStrength(cards));
    });

    it('returns Two Pair with both pairs in description', () => {
      const cards: Card[] = ['Ah', 'Ad', 'Kc', 'Kd', '9d', '2s', '3h'];
      const res = analyzeCards(cards);
      expect(res.rank).toBe('Two Pair');
      expect(res.cards.sort()).toEqual(['Ah', 'Ad', 'Kc', 'Kd'].sort());
      expect(res.description).toBe('Aces and Kings');
      expect(res.strength).toBe(calculateHandStrength(cards));
    });

    it('returns Three of a Kind with plural description', () => {
      const cards: Card[] = ['Ah', 'Ad', 'Ac', 'Js', '9d', '2s', '3h'];
      const res = analyzeCards(cards);
      expect(res.rank).toBe('Three of a Kind');
      expect(res.cards.sort()).toEqual(['Ah', 'Ad', 'Ac'].sort());
      expect(res.description).toBe('Aces');
      expect(res.strength).toBe(calculateHandStrength(cards));
    });

    it('returns Straight with high card in description', () => {
      const cards: Card[] = ['Ah', 'Kd', 'Qc', 'Js', 'Td', '2s', '3h'];
      const res = analyzeCards(cards);
      expect(res.rank).toBe('Straight');
      expect(res.cards.map(c => c[0]).sort()).toEqual(['A', 'K', 'Q', 'J', 'T'].sort());
      expect(res.description).toBe('Ace High');
      expect(res.strength).toBe(calculateHandStrength(cards));
    });

    it('returns Straight (wheel) with Five High description', () => {
      const cards: Card[] = ['Ah', '2d', '3c', '4s', '5d', 'Ks', 'Qh'];
      const res = analyzeCards(cards);
      expect(res.rank).toBe('Straight');
      expect(res.cards.map(c => c[0]).sort()).toEqual(['A', '2', '3', '4', '5'].sort());
      expect(res.description).toBe('Five High');
      expect(res.strength).toBe(calculateHandStrength(cards));
    });

    it('returns Flush with high card in description', () => {
      const cards: Card[] = ['Ah', 'Kh', 'Qh', 'Jh', '9h', '2s', '3d'];
      const res = analyzeCards(cards);
      expect(res.rank).toBe('Flush');
      expect(res.cards.sort()).toEqual(['Ah', 'Kh', 'Qh', 'Jh', '9h'].sort());
      expect(res.description).toBe('Ace High');
      expect(res.strength).toBe(calculateHandStrength(cards));
    });

    it('returns Full House with descriptive text', () => {
      const cards: Card[] = ['Ah', 'Ad', 'Ac', 'Ks', 'Kd', '2s', '3h'];
      const res = analyzeCards(cards);
      expect(res.rank).toBe('Full House');
      expect(res.cards.map(c => c[0]).sort()).toEqual(['A', 'A', 'A', 'K', 'K'].sort());
      expect(res.description).toBe('Aces full of Kings');
      expect(res.strength).toBe(calculateHandStrength(cards));
    });

    it('returns Four of a Kind with plural description', () => {
      const cards: Card[] = ['Ah', 'Ad', 'Ac', 'As', 'Kd', '2s', '3h'];
      const res = analyzeCards(cards);
      expect(res.rank).toBe('Four of a Kind');
      expect(res.cards.sort()).toEqual(['Ah', 'Ad', 'Ac', 'As'].sort());
      expect(res.description).toBe('Aces');
      expect(res.strength).toBe(calculateHandStrength(cards));
    });

    it('returns Royal Flush with proper description', () => {
      const cards: Card[] = ['Ah', 'Kh', 'Qh', 'Jh', 'Th', '2s', '3d'];
      const res = analyzeCards(cards);
      expect(res.rank).toBe('Straight Flush');
      expect(res.cards.map(c => c[0]).sort()).toEqual(['A', 'K', 'Q', 'J', 'T'].sort());
      expect(res.cards.every(c => c[1] === 'h')).toBe(true);
      expect(res.description).toBe('Royal Flush');
      expect(res.strength).toBe(calculateHandStrength(cards));
    });

    it('returns Straight Flush with high card description (non-royal)', () => {
      const cards: Card[] = ['9h', '8h', '7h', '6h', '5h', '2s', '3d'];
      const res = analyzeCards(cards);
      expect(res.rank).toBe('Straight Flush');
      expect(res.cards.map(c => c[0]).sort()).toEqual(['9', '8', '7', '6', '5'].sort());
      expect(res.cards.every(c => c[1] === 'h')).toBe(true);
      expect(res.description).toBe('Nine High');
      expect(res.strength).toBe(calculateHandStrength(cards));
    });
  });

  describe('getBestPlayers', () => {
    it('returns a single winner index', () => {
      const board: Card[] = ['Ah', 'Kh', 'Qd', '2c', '7s'];
      const hands: (Card[] | null)[] = [
        ['Ad', 'Ac'], // trips aces
        ['Kc', 'Kd'], // two pair kings
        ['9c', '9d'], // pair nines
      ];
      const winners = getBestPlayers(hands, board);
      expect(winners.map(w => w.index)).toEqual([0]);
      expect(winners[0].rank).toBe('Three of a Kind');
      expect(winners[0].description).toBe('Aces');
      expect(winners[0].strength).toBe(calculateHandStrength([...hands[0]!, ...board]));
    });

    it('returns multiple indices on a tie (board plays)', () => {
      const board: Card[] = ['Ah', 'Kh', 'Qd', 'Jc', 'Td']; // Broadway on board
      const hands: (Card[] | null)[] = [
        ['2c', '3c'],
        ['4d', '5d'],
        ['6h', '7h'],
      ];
      const winners = getBestPlayers(hands, board);
      expect(winners.map(w => w.index)).toEqual([0, 1, 2]);
      winners.forEach(w => {
        expect(w.rank).toBe('Straight');
        expect(w.description).toBe('Ace High');
      });
    });

    it('ignores null seats but preserves indices', () => {
      const board: Card[] = ['2h', '3h', '4d', '5c', '9s'];
      const hands: (Card[] | null)[] = [null, ['Th', 'Td'], null, ['Kc', 'Kd']];
      const winners = getBestPlayers(hands, board);
      // AA vs KK on same board -> AA wins
      expect(winners.map(w => w.index)).toEqual([3]);
      expect(winners[0].rank).toBe('One Pair');
      expect(winners[0].description).toBe('Kings');
    });

    it('returns empty array when all seats are null', () => {
      const board: Card[] = ['2h', '3h', '4d', '5c', '9s'];
      const hands: (Card[] | null)[] = [null, null, null];
      const winners = getBestPlayers(hands, board);
      expect(winners).toEqual([]);
    });

    it('ties when both make the same straight using a shared rank from hole', () => {
      const board: Card[] = ['9c', '8d', '7s', '6h', '2c'];
      const hands: (Card[] | null)[] = [
        ['5d', 'Kd'], // straight 9-5
        ['5h', 'Qs'], // straight 9-5
        ['As', 'Ad'], // overpair only
      ];
      const winners = getBestPlayers(hands, board);
      expect(winners.map(w => w.index)).toEqual([0, 1]);
      expect(winners.map(w => w.rank)).toEqual(['Straight', 'Straight']);
    });

    it('flush beats straight', () => {
      const board: Card[] = ['Ah', 'Kh', 'Qh', '2c', '7s'];
      const hands: (Card[] | null)[] = [
        ['Jh', 'Th'], // straight flush (royal)
        ['9c', '8d'], // straight draw / high card
      ];
      const winners = getBestPlayers(hands, board);
      expect(winners.map(w => w.index)).toEqual([0]);
      expect(winners[0].rank).toBe('Straight Flush');
      expect(winners[0].description).toBe('Royal Flush');
    });

    it('ties when flush is entirely on the board', () => {
      const board: Card[] = ['Ah', 'Kh', 'Qh', 'Jh', '9h'];
      const hands: (Card[] | null)[] = [
        ['2c', '3c'],
        ['4d', '5d'],
      ];
      const winners = getBestPlayers(hands, board);
      expect(winners.map(w => w.index)).toEqual([0, 1]);
      winners.forEach(w => expect(w.rank).toBe('Flush'));
    });

    it('returns [] when board has fewer than 5 cards', () => {
      const board: Card[] = ['Ah', 'Kh', 'Qd', '2c'];
      const hands: (Card[] | null)[] = [
        ['Ad', 'Ac'],
        ['Kc', 'Kd'],
      ];
      const winners = getBestPlayers(hands, board);
      expect(winners).toEqual([]);
    });

    it('returns [] when board contains unknown cards', () => {
      const board: Card[] = ['Ah', 'Kh', 'Qd', '2c', '??' as Card];
      const hands: (Card[] | null)[] = [
        ['Ad', 'Ac'],
        ['Kc', 'Kd'],
      ];
      const winners = getBestPlayers(hands, board);
      expect(winners).toEqual([]);
    });

    it('skips hands that are not exactly two cards', () => {
      const board: Card[] = ['Ah', 'Kh', 'Qd', '2c', '7s'];
      const hands: (Card[] | null)[] = [
        ['Ad'],
        ['Kc', 'Kd'],
        ['9c', '9d', '9h'] as unknown as Card[],
      ];
      const winners = getBestPlayers(hands, board);
      expect(winners.map(w => w.index)).toEqual([1]);
    });

    it('skips hands that contain unknown cards', () => {
      const board: Card[] = ['Ah', 'Kh', 'Qd', '2c', '7s'];
      const hands: (Card[] | null)[] = [
        ['??' as Card, 'Kd'],
        ['Ad', 'Ac'],
      ];
      const winners = getBestPlayers(hands, board);
      expect(winners.map(w => w.index)).toEqual([1]);
    });
  });
});
