import { describe, expect, it } from 'vitest';
import * as Poker from '../..';
import type { Hand } from '../../Hand';

describe('Scenarios - Turn betting order', () => {
  it('should correctly identify first player to act on turn after flop action', () => {
    const hand: Hand = {
      variant: 'NT',
      currency: 'PLAY',
      players: ['dddocky', 'Duke Croix', 'HighCardJasper'],
      startingStacks: [10000, 10000, 10000],
      blindsOrStraddles: [0, 50, 100],
      antes: [0, 0, 0],
      minBet: 100,
      actions: [],
      time: '2020-09-17T14:52:46',
      timeZone: 'ET',
    };

    const game = Poker.Game(hand);

    // Initial deal
    Poker.applyAction(game, 'd dh p1 4dAc');
    Poker.applyAction(game, 'd dh p2 7s9c');
    Poker.applyAction(game, 'd dh p3 2cKd');
    expect(Poker.getCurrentPlayerIndex(game), 'After dealing hole cards').toBe(0);
    expect(game.street).toBe('preflop');

    // Preflop betting
    Poker.applyAction(game, 'p1 cc'); // BTN calls 100
    expect(Poker.getCurrentPlayerIndex(game), 'After BTN calls').toBe(1);
    Poker.applyAction(game, 'p2 cc'); // SB completes to 100
    expect(Poker.getCurrentPlayerIndex(game), 'After SB completes').toBe(2);
    Poker.applyAction(game, 'p3 cc'); // BB checks
    expect(Poker.getCurrentPlayerIndex(game), 'After BB checks').toBe(-1);
    expect(game.pot).toBe(300); // BTN (100) + SB (100) + BB (100)

    // Flop
    Poker.applyAction(game, 'd db 9d6dAd');
    expect(Poker.getCurrentPlayerIndex(game), 'After flop dealt').toBe(1); // First after button
    expect(game.street).toBe('flop');

    // Flop betting
    Poker.applyAction(game, 'p2 cc'); // SB checks
    expect(Poker.getCurrentPlayerIndex(game), 'After SB checks').toBe(2);
    Poker.applyAction(game, 'p3 cbr 100'); // BB bets 100
    expect(Poker.getCurrentPlayerIndex(game), 'After BB bets').toBe(0);
    Poker.applyAction(game, 'p1 cbr 200'); // BTN raises to 200
    expect(Poker.getCurrentPlayerIndex(game), 'After BTN raises').toBe(1);
    Poker.applyAction(game, 'p2 f'); // SB folds
    expect(Poker.getCurrentPlayerIndex(game), 'After SB folds').toBe(2);
    Poker.applyAction(game, 'p3 cc'); // BB calls
    expect(Poker.getCurrentPlayerIndex(game), 'After BB calls').toBe(-1);
    expect(game.pot).toBe(700); // Previous pot (300) + BTN (200) + BB (200)

    // Turn - Key moment
    Poker.applyAction(game, 'd db Th');
    expect(game.street).toBe('turn');
    expect(game.board).toEqual(['9d', '6d', 'Ad', 'Th']);
    expect(game.players.map(p => p.roundBet)).toEqual([0, 0, 0]); // Reset for new street
    expect(game.players.map(p => p.hasFolded)).toEqual([false, true, false]);
    expect(game.players.map(p => p.hasActed)).toEqual([false, true, false]);
    expect(game.bet).toBe(0);
    expect(game.lastBetAction).toBeUndefined();
    expect(game.lastPlayerAction).toBeUndefined();
    expect(Poker.getCurrentPlayerIndex(game), 'After turn dealt').toBe(2); // First active after button (BB)
  });
});
