import { parseHand } from './parse';
import { stringifyPokerstarsHand } from './stringify';

export namespace Pokerstars {
  export const parse = parseHand;
  export const stringify = stringifyPokerstarsHand;
}
