import { Hand } from '../..';
import { Game } from '../../Game';
import { isLastToAct, isPlayerInPosition } from '../../game/position';
import { applyAction } from '../../game/progress';

const sampleGame = {
  seed: 12345,
  variant: 'NT',
  players: [],
  blindsOrStraddles: [],
  startingStacks: [],
  antes: [],
  actions: [],
  minBet: 20,
} as const satisfies Hand;

describe('Positional Logic', () => {
  describe('isPlayerInPosition', () => {
    it('should correctly determine position in a heads-up game', () => {
      // In a heads-up game, the BTN is SB and acts first pre-flop, but last post-flop.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');

      expect(isPlayerInPosition(table, 0, 1)).toBe(true);
      expect(isPlayerInPosition(table, 1, 0)).toBe(false);
    });

    it('should correctly determine position in a 3-handed game', () => {
      // The order of position is BTN > BB > SB.
      const table = Game({
        ...sampleGame,
        players: ['SB', 'BB', 'BTN'],
        blindsOrStraddles: [10, 20, 0],
        startingStacks: [1000, 1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');

      // BTN (2) is in position on everyone.
      expect(isPlayerInPosition(table, 2, 0)).toBe(true);
      expect(isPlayerInPosition(table, 2, 1)).toBe(true);

      // BB (1) is in position on SB (0).
      expect(isPlayerInPosition(table, 1, 0)).toBe(true);
      expect(isPlayerInPosition(table, 0, 1)).toBe(false);
    });
  });

  describe('isLastToAct', () => {
    it('should correctly determine the last to act in a heads-up game', () => {
      // In a heads-up game, the BTN is always last to act post-flop.
      const table = Game({
        ...sampleGame,
        players: ['BTN', 'BB'],
        blindsOrStraddles: [10, 20],
        startingStacks: [1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');

      expect(isLastToAct(table, 0)).toBe(true);
      expect(isLastToAct(table, 1)).toBe(false);
    });

    it('should correctly determine the last to act in a 3-handed game', () => {
      // In a 3-handed game, the BTN is always last to act.
      const table = Game({
        ...sampleGame,
        players: ['SB', 'BB', 'BTN'],
        blindsOrStraddles: [10, 20, 0],
        startingStacks: [1000, 1000, 1000],
      });
      applyAction(table, 'd dh p1 2h2c');
      applyAction(table, 'd dh p2 3h3c');
      applyAction(table, 'd dh p3 4h4c');

      expect(isLastToAct(table, 2)).toBe(true);
      expect(isLastToAct(table, 1)).toBe(false);
      expect(isLastToAct(table, 0)).toBe(false);
    });
  });
});
