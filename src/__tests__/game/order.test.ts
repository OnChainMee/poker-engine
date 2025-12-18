/**
 * @instructions
 * This test suite validates getCurrentPlayerIndex behavior by:
 * 1. Using real hand fixtures to test player action order
 * 2. Verifying correct player index after each action
 * 3. Checking dealer actions return -1
 * 4. Validating position changes across streets
 * 5. Testing edge cases like all-in and fold situations
 */

import { Game } from '../../Game';
import { applyAction } from '../../game/progress';
import { fixtures } from '../fixtures/hands';

describe('Action Order', () => {
  fixtures.forEach(fixture => {
    describe(fixture.title, () => {
      it('should correctly identify next player to act', () => {
        let game: Game = Game(fixture.output, []);
        const actions = fixture.output.actions;

        // For each action in the hand, verify the next player to act
        for (let i = 0; i < actions.length; i++) {
          // Create table state up to current action
          applyAction(game, actions[i]);
          const nextAction = actions[i + 1];
          if (!nextAction) continue;

          // Skip message actions as they can't be predicted
          if (nextAction.includes(' m ')) {
            continue;
          }

          // Get actual next player index
          const actualPlayerIndex = Game.getCurrentPlayerIndex(game);

          // Build descriptive message
          const message = `Action ${i + 1}/${actions.length}: ${nextAction}
  Previous actions: ${i > 0 ? actions.slice(0, i).join(', ') : 'none'}
  Street: ${game.street}
  Betting complete: ${game.isBettingComplete}
  Last player action: ${game.lastPlayerAction}
  Last bet action: ${game.lastBetAction}
  Current bet: ${game.bet}
  Is showdown?: ${game.isShowdown}
  Is hand complete?: ${game.isComplete}
  Is run out?: ${game.isRunOut}
  Is betting complete?: ${game.isBettingComplete}
  Players state: ${game.players
    .map(
      (p, idx) =>
        `\n  p${idx + 1}: ${p.hasFolded ? 'folded' : p.isAllIn ? 'all-in' : p.hasActed ? 'acted' : 'to act'} (bet: ${p.roundBet}, total: ${p.totalBet})`
    )
    .join('')}`;

          // If dealer action or show cards is next, getCurrentPlayerIndex should return -1
          if (nextAction.startsWith('d ')) {
            expect(actualPlayerIndex, message).toBe(-1);
            continue;
          }

          // For player actions, extract expected player index
          const match = nextAction.match(/^p(\d+)/);
          if (!match) {
            throw new Error(`Invalid action format: ${nextAction}`);
          }
          const expectedPlayerIndex = parseInt(match[1]) - 1;

          // Verify next player matches
          expect(actualPlayerIndex, message).toBe(expectedPlayerIndex);
        }
      });
    });
  });
});
