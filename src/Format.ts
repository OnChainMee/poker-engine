import { JSON as JSONFormat } from './formats/json';
import { Pokerstars as PokerstarsFormat } from './formats/pokerstars';
import { gameLog as gameLogFormat } from './formats/pokerstars/stringify';

export namespace Format {
  export const JSON = JSONFormat;
  export const Pokerstars = PokerstarsFormat;
  export const gameLog = gameLogFormat;
}
