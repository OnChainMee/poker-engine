import { describe, it } from 'vitest';
import * as Poker from '../..';

describe('Scenarios - Hanging game', () => {
  it('should correctly track player index after fold in 3-way pot', () => {
    const hand: Poker.Hand = {
      variant: 'NT',
      minBet: 50,
      antes: [0, 0, 0, 0, 0],
      blindsOrStraddles: [25, 50, 0, 0, 0],
      startingStacks: [700, 1450, 11741, 775, 2050],
      players: ['Agent_MWAZC', 'Agent_VFJNX', 'Duy Phạm', 'Agent_THMCY', 'Agent_6V6JJ'],
      actions: [
        'd dh p1 ????',
        'd dh p2 Ah2c',
        'd dh p3 ????',
        'd dh p4 ????',
        'd dh p5 ????',
        'p3 cbr 400',
        'p4 cc 400',
        'p5 cc 400',
        'p1 cc 375',
        'p2 cc 400',
        'd db 3dTh6s',
        'p1 cc 0',
        'p2 cc 0',
        'p3 cbr 1320',
        'p4 cc 375',
        'p5 cc 1320',
        'p1 cc 300',
        'p2 f',
        'd db Kc',
      ],
    };

    const game = Poker.Game(hand);
    expect(Poker.getCurrentPlayerIndex(game)).toBe(2);
  });
});
