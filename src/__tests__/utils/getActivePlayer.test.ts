import { describe, expect, it } from 'vitest';
import * as Poker from '../..';

// Helper to build minimal game fixtures
function buildHand(actions: string[]): Poker.Hand {
  return {
    variant: 'NT',
    minBet: 100,
    players: ['Romulus', 'VaSaBi'],
    antes: [0, 0],
    blindsOrStraddles: [50, 100],
    startingStacks: [100000, 100000],
    actions,
  } as Poker.Hand;
}

describe('getCurrentPlayerIndex', () => {
  it('pre-flop heads-up – button (SB) acts first', () => {
    const hand = buildHand(['d dh p1 Ad6d', 'd dh p2 3h9h']);
    const game = Poker.Game(hand);
    // Button = small blind (index 0) in heads-up pre-flop
    expect(Poker.Game.getCurrentPlayerIndex(game)).toBe(0);
  });

  it('flop heads-up – big blind acts first', () => {
    const hand = buildHand([
      'd dh p1 Ad6d',
      'd dh p2 3h9h',
      'p1 cbr 300', // SB opens
      'p2 cc', // BB calls – betting round complete
      'd db 7h9d3s', // Dealer deals flop, new street starts
    ]);
    const game = Poker.Game(hand);
    expect(Poker.Game.getCurrentPlayerIndex(game)).toBe(1);
  });

  it('awaiting dealer after betting – no active player', () => {
    const hand = buildHand([
      'd dh p1 Ad6d',
      'd dh p2 3h9h',
      'p1 cbr 300',
      'p2 cc', // Betting round finished – dealer yet to act
    ]);
    const game = Poker.Game(hand);
    expect(Poker.Game.getCurrentPlayerIndex(game)).toBe(-1);
  });

  it('only one player remaining – no active player', () => {
    const hand = buildHand([
      'd dh p1 Ad6d',
      'd dh p2 3h9h',
      'p1 f', // SB folds pre-flop – BB wins
    ]);
    const game = Poker.Game(hand);
    expect(Poker.Game.getCurrentPlayerIndex(game)).toBe(-1);
  });
});
