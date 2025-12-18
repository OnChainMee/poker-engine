import type * as Poker from '../..';

export function stringifyJsonHand(hand: Poker.Hand): string {
  return JSON.stringify(hand);
}
