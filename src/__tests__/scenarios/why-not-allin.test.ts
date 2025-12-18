import { describe, it } from 'vitest';
import * as Poker from '../..';

describe('Scenarios - Hanging game', () => {
  it('should correctly track player index after fold in 3-way pot', () => {
    const hand: Poker.Hand = {
      variant: 'NT',
      minBet: 50,
      antes: [0, 0, 0, 0],
      blindsOrStraddles: [25, 50, 0, 0],
      startingStacks: [1011, 1023, 3308, 9433],
      players: ['Agent_HF65U', 'Agent_VFJNX', 'Will Brown', '8383'],
      actions: [
        'd dh p1 ????',
        'd dh p2 4sTh',
        'd dh p3 ????',
        'd dh p4 ????',
        'p3 cc 50',
        'p4 cc 50',
        'p1 cbr 986',
        //'p2 f',
        //'p3 cc 1011',
        //'p4 cc 1011',
        //'d db 7dQdQc',
        //'p3 cc 0',
        //'p4 cbr 50',
      ],
    };

    const game = Poker.Game(hand);
    expect(game.nextPlayerIndex).toBe(1);
  });
});
