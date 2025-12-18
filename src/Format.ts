import { JSON as JSONFormat } from './formats/json';
import { Pokerstars as PokerstarsFormat } from './formats/pokerstars';

export namespace Format {
  export const JSON = JSONFormat;
  export const Pokerstars = PokerstarsFormat;
}
