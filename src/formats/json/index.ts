import { parseJsonHand } from './parse';
import { stringifyJsonHand } from './stringify';

export namespace JSON {
  export const parse = parseJsonHand;
  export const stringify = stringifyJsonHand;
}
