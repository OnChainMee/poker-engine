import { Game } from './Game';
import { Hand } from './Hand';
import { emptyMetric as emptyMetricOriginal, getPokerMetrics } from './stats/metrics';
import { emptyStat as emptyStatOriginal } from './stats/stats';
import { PokerMetrics, StreetStat } from './stats/types';
import { PlayerIdentifier, Street } from './types';
export type { PokerMetrics, StreetStat } from './stats/types';
export * from './types';

export function Stats(stats: Stats.Source): readonly StreetStat[] {
  if (Array.isArray(stats)) {
    return stats;
  }
  return Game(stats as Game | Hand).stats;
}

export namespace Stats {
  export type Source = Game | Hand | readonly StreetStat[];
  export type Stats = StreetStat;
  export type Metrics = PokerMetrics;

  export const emptyMetric = emptyMetricOriginal;
  export const emptyStat = emptyStatOriginal;
  export const columns = Object.keys(emptyStat) as (keyof StreetStat)[];
  let columnNames: string[];

  function camelToSnakeCase(str: string) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  export function getColumnNames() {
    if (!columnNames) {
      columnNames = Stats.columns.map(camelToSnakeCase);
    }
    return columnNames;
  }

  export function getRows(stats: Stats.Source) {
    return Stats(stats).map(stat => {
      return Object.values(stat);
    });
  }

  export function forPlayer(game: Game, playerIdentifier: PlayerIdentifier) {
    return Stats(game).filter(stat => stat.player === Game.getPlayerName(game, playerIdentifier));
  }

  export function forPlayerStreet(game: Game, playerIdentifier: PlayerIdentifier, street: Street) {
    return Stats(game).find(
      stat => stat.player === Game.getPlayerName(game, playerIdentifier) && stat.street === street
    );
  }

  export function aggregate(stats: Stats.Source, groups: ('player' | 'street' | 'venue')[]) {
    return getPokerMetrics(Stats(stats), groups);
  }
}
