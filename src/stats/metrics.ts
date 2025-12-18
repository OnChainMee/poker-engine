import { emptyStatValues } from './stats';
import { PokerMetrics, StreetStat } from './types';

export const emptyMetric: Omit<
  PokerMetrics,
  'hand' | 'table' | 'player' | 'createdAt' | 'street' | 'venue' | 'isFinalAction'
> = {
  ...emptyStatValues,
  startedAt: Date.now(),
  gameIds: new Set(['12345']),
  distinctGameCount: 0,

  limpFrequency: 0,
  aggressionFactor: 0,
  aggressionFrequency: 0,

  vpipFrequency: 0,
  allInFrequency: 0,
  sawFlopFrequency: 0,
  potAverage: 0,

  // IP/OOP Aggressor Frequencies
  threeBetIpFrequency: 0,
  threeBetOopFrequency: 0,
  threeBetIpTakedownFrequency: 0,
  threeBetOopTakedownFrequency: 0,
  fourBetIpFrequency: 0,
  fourBetOopFrequency: 0,
  fourBetIpTakedownFrequency: 0,
  fourBetOopTakedownFrequency: 0,
  fiveBetIpFrequency: 0,
  fiveBetOopFrequency: 0,
  fiveBetIpTakedownFrequency: 0,
  fiveBetOopTakedownFrequency: 0,
  cbetIpFrequency: 0,
  cbetOopFrequency: 0,
  cbetIpTakedownFrequency: 0,
  cbetOopTakedownFrequency: 0,
  stealIpFrequency: 0,
  stealOopFrequency: 0,
  stealIpTakedownFrequency: 0,
  stealOopTakedownFrequency: 0,
  donkBetFrequency: 0,
  donkBetTakedownFrequency: 0,
  checkRaiseFrequency: 0,
  checkRaiseTakedownFrequency: 0,
  openShoveIpFrequency: 0,
  openShoveOopFrequency: 0,
  openShoveIpTakedownFrequency: 0,
  openShoveOopTakedownFrequency: 0,

  // Squeeze IP/OOP Aggressor Frequencies
  squeezeIpFrequency: 0,
  squeezeOopFrequency: 0,
  squeezeIpTakedownFrequency: 0,
  squeezeOopTakedownFrequency: 0,

  // Delayed C-Bet IP/OOP Aggressor Frequencies
  delayedCbetIpFrequency: 0,
  delayedCbetOopFrequency: 0,
  delayedCbetIpTakedownFrequency: 0,
  delayedCbetOopTakedownFrequency: 0,

  // Double Barrel IP/OOP Aggressor Frequencies
  doubleBarrelIpFrequency: 0,
  doubleBarrelOopFrequency: 0,
  doubleBarrelIpTakedownFrequency: 0,
  doubleBarrelOopTakedownFrequency: 0,

  // Triple Barrel IP/OOP Aggressor Frequencies
  tripleBarrelIpFrequency: 0,
  tripleBarrelOopFrequency: 0,
  tripleBarrelIpTakedownFrequency: 0,
  tripleBarrelOopTakedownFrequency: 0,

  // Shove IP/OOP Aggressor Frequencies
  shoveIpFrequency: 0,
  shoveOopFrequency: 0,
  shoveIpTakedownFrequency: 0,
  shoveOopTakedownFrequency: 0,

  // IP/OOP Defender Frequencies
  threeBetIpFoldFrequency: 0,
  threeBetOopFoldFrequency: 0,
  threeBetIpContinueFrequency: 0,
  threeBetOopContinueFrequency: 0,
  fourBetIpFoldFrequency: 0,
  fourBetOopFoldFrequency: 0,
  fourBetIpContinueFrequency: 0,
  fourBetOopContinueFrequency: 0,
  fiveBetIpFoldFrequency: 0,
  fiveBetOopFoldFrequency: 0,
  fiveBetIpContinueFrequency: 0,
  fiveBetOopContinueFrequency: 0,
  cbetIpFoldFrequency: 0,
  cbetOopFoldFrequency: 0,
  cbetIpContinueFrequency: 0,
  cbetOopContinueFrequency: 0,
  stealIpFoldFrequency: 0,
  stealOopFoldFrequency: 0,
  stealIpContinueFrequency: 0,
  stealOopContinueFrequency: 0,
  donkBetFoldFrequency: 0,
  donkBetContinueFrequency: 0,
  checkRaiseFoldFrequency: 0,
  checkRaiseContinueFrequency: 0,
  openShoveIpFoldFrequency: 0,
  openShoveOopFoldFrequency: 0,
  openShoveIpContinueFrequency: 0,
  openShoveOopContinueFrequency: 0,

  // Squeeze IP/OOP Defender Frequencies
  squeezeIpFoldFrequency: 0,
  squeezeOopFoldFrequency: 0,
  squeezeIpContinueFrequency: 0,
  squeezeOopContinueFrequency: 0,

  // Delayed C-Bet IP/OOP Defender Frequencies
  delayedCbetIpFoldFrequency: 0,
  delayedCbetOopFoldFrequency: 0,
  delayedCbetIpContinueFrequency: 0,
  delayedCbetOopContinueFrequency: 0,

  // Double Barrel IP/OOP Defender Frequencies
  doubleBarrelIpFoldFrequency: 0,
  doubleBarrelOopFoldFrequency: 0,
  doubleBarrelIpContinueFrequency: 0,
  doubleBarrelOopContinueFrequency: 0,

  // Triple Barrel IP/OOP Defender Frequencies
  tripleBarrelIpFoldFrequency: 0,
  tripleBarrelOopFoldFrequency: 0,
  tripleBarrelIpContinueFrequency: 0,
  tripleBarrelOopContinueFrequency: 0,

  // Shove IP/OOP Defender Frequencies
  shoveIpFoldFrequency: 0,
  shoveOopFoldFrequency: 0,
  shoveIpContinueFrequency: 0,
  shoveOopContinueFrequency: 0,

  // PFR
  preflopRaiseOpportunities: 0,
  preflopRaises: 0,
  preflopRaiseFrequency: 0,

  // --- Maneuver-Specific Metrics ---
  threeBetOpportunities: 0,
  threeBetAttempts: 0,
  threeBetChallenges: 0,
  threeBetContinues: 0,
  threeBetFolds: 0,
  threeBetTakedowns: 0,
  threeBetFrequency: 0,
  threeBetFoldFrequency: 0,
  threeBetContinueFrequency: 0,
  threeBetTakedownFrequency: 0,

  squeezeOpportunities: 0,
  squeezeAttempts: 0,
  squeezeChallenges: 0,
  squeezeContinues: 0,
  squeezeFolds: 0,
  squeezeTakedowns: 0,
  squeezeFrequency: 0,
  squeezeFoldFrequency: 0,
  squeezeContinueFrequency: 0,
  squeezeTakedownFrequency: 0,

  fourBetOpportunities: 0,
  fourBetAttempts: 0,
  fourBetChallenges: 0,
  fourBetContinues: 0,
  fourBetFolds: 0,
  fourBetTakedowns: 0,
  fourBetFrequency: 0,
  fourBetFoldFrequency: 0,
  fourBetContinueFrequency: 0,
  fourBetTakedownFrequency: 0,

  fiveBetOpportunities: 0,
  fiveBetAttempts: 0,
  fiveBetChallenges: 0,
  fiveBetContinues: 0,
  fiveBetFolds: 0,
  fiveBetTakedowns: 0,
  fiveBetFrequency: 0,
  fiveBetFoldFrequency: 0,
  fiveBetContinueFrequency: 0,
  fiveBetTakedownFrequency: 0,

  cbetOpportunities: 0,
  cbetAttempts: 0,
  cbetChallenges: 0,
  cbetContinues: 0,
  cbetFolds: 0,
  cbetTakedowns: 0,
  cbetFrequency: 0,
  cbetFoldFrequency: 0,
  cbetContinueFrequency: 0,
  cbetTakedownFrequency: 0,

  delayedCbetOpportunities: 0,
  delayedCbetAttempts: 0,
  delayedCbetChallenges: 0,
  delayedCbetContinues: 0,
  delayedCbetFolds: 0,
  delayedCbetTakedowns: 0,
  delayedCbetFrequency: 0,
  delayedCbetFoldFrequency: 0,
  delayedCbetContinueFrequency: 0,
  delayedCbetTakedownFrequency: 0,

  doubleBarrelOpportunities: 0,
  doubleBarrelAttempts: 0,
  doubleBarrelChallenges: 0,
  doubleBarrelContinues: 0,
  doubleBarrelFolds: 0,
  doubleBarrelTakedowns: 0,
  doubleBarrelFrequency: 0,
  doubleBarrelFoldFrequency: 0,
  doubleBarrelContinueFrequency: 0,
  doubleBarrelTakedownFrequency: 0,

  tripleBarrelOpportunities: 0,
  tripleBarrelAttempts: 0,
  tripleBarrelChallenges: 0,
  tripleBarrelContinues: 0,
  tripleBarrelFolds: 0,
  tripleBarrelTakedowns: 0,
  tripleBarrelFrequency: 0,
  tripleBarrelFoldFrequency: 0,
  tripleBarrelContinueFrequency: 0,
  tripleBarrelTakedownFrequency: 0,

  probeBetFrequency: 0,
  probeBetFoldFrequency: 0,
  probeBetContinueFrequency: 0,
  probeBetTakedownFrequency: 0,

  floatBetFrequency: 0,
  floatBetFoldFrequency: 0,
  floatBetContinueFrequency: 0,
  floatBetTakedownFrequency: 0,

  stealOpportunities: 0,
  stealAttempts: 0,
  stealChallenges: 0,
  stealContinues: 0,
  stealFolds: 0,
  stealTakedowns: 0,
  stealFrequency: 0,
  stealFoldFrequency: 0,
  stealContinueFrequency: 0,
  stealTakedownFrequency: 0,

  openShoveOpportunities: 0,
  openShoveAttempts: 0,
  openShoveChallenges: 0,
  openShoveContinues: 0,
  openShoveFolds: 0,
  openShoveTakedowns: 0,
  openShoveFrequency: 0,
  openShoveFoldFrequency: 0,
  openShoveContinueFrequency: 0,
  openShoveTakedownFrequency: 0,

  shoveOpportunities: 0,
  shoveAttempts: 0,
  shoveChallenges: 0,
  shoveContinues: 0,
  shoveFolds: 0,
  shoveTakedowns: 0,
  shoveFrequency: 0,
  shoveFoldFrequency: 0,
  shoveContinueFrequency: 0,
  shoveTakedownFrequency: 0,

  // IP/OOP Aggressor Metrics
  threeBetIpAttempts: 0,
  threeBetIpOpportunities: 0,
  threeBetIpTakedowns: 0,
  threeBetOopAttempts: 0,
  threeBetOopOpportunities: 0,
  threeBetOopTakedowns: 0,

  fourBetIpAttempts: 0,
  fourBetIpOpportunities: 0,
  fourBetIpTakedowns: 0,
  fourBetOopAttempts: 0,
  fourBetOopOpportunities: 0,
  fourBetOopTakedowns: 0,

  fiveBetIpAttempts: 0,
  fiveBetIpOpportunities: 0,
  fiveBetIpTakedowns: 0,
  fiveBetOopAttempts: 0,
  fiveBetOopOpportunities: 0,
  fiveBetOopTakedowns: 0,

  cbetIpAttempts: 0,
  cbetIpOpportunities: 0,
  cbetIpTakedowns: 0,
  cbetOopAttempts: 0,
  cbetOopOpportunities: 0,
  cbetOopTakedowns: 0,

  stealIpAttempts: 0,
  stealIpOpportunities: 0,
  stealIpTakedowns: 0,
  stealOopAttempts: 0,
  stealOopOpportunities: 0,
  stealOopTakedowns: 0,

  donkBetAttempts: 0,
  donkBetOpportunities: 0,
  donkBetTakedowns: 0,
  donkBetFolds: 0,
  donkBetContinues: 0,
  donkBetChallenges: 0,

  checkRaiseAttempts: 0,
  checkRaiseOpportunities: 0,
  checkRaiseTakedowns: 0,
  checkRaiseFolds: 0,
  checkRaiseContinues: 0,
  checkRaiseChallenges: 0,

  openShoveIpAttempts: 0,
  openShoveIpOpportunities: 0,
  openShoveIpTakedowns: 0,
  openShoveOopAttempts: 0,
  openShoveOopOpportunities: 0,
  openShoveOopTakedowns: 0,

  // Squeeze IP/OOP Aggressor Metrics
  squeezeIpAttempts: 0,
  squeezeIpOpportunities: 0,
  squeezeIpTakedowns: 0,
  squeezeOopAttempts: 0,
  squeezeOopOpportunities: 0,
  squeezeOopTakedowns: 0,

  // Delayed C-Bet IP/OOP Aggressor Metrics
  delayedCbetIpAttempts: 0,
  delayedCbetIpOpportunities: 0,
  delayedCbetIpTakedowns: 0,
  delayedCbetOopAttempts: 0,
  delayedCbetOopOpportunities: 0,
  delayedCbetOopTakedowns: 0,

  // Double Barrel IP/OOP Aggressor Metrics
  doubleBarrelIpAttempts: 0,
  doubleBarrelIpOpportunities: 0,
  doubleBarrelIpTakedowns: 0,
  doubleBarrelOopAttempts: 0,
  doubleBarrelOopOpportunities: 0,
  doubleBarrelOopTakedowns: 0,

  // Triple Barrel IP/OOP Aggressor Metrics
  tripleBarrelIpAttempts: 0,
  tripleBarrelIpOpportunities: 0,
  tripleBarrelIpTakedowns: 0,
  tripleBarrelOopAttempts: 0,
  tripleBarrelOopOpportunities: 0,
  tripleBarrelOopTakedowns: 0,

  // Shove IP/OOP Aggressor Metrics
  shoveIpAttempts: 0,
  shoveIpOpportunities: 0,
  shoveIpTakedowns: 0,
  shoveOopAttempts: 0,
  shoveOopOpportunities: 0,
  shoveOopTakedowns: 0,

  // IP/OOP Defender Metrics
  threeBetIpChallenges: 0,
  threeBetIpContinues: 0,
  threeBetIpFolds: 0,
  threeBetOopChallenges: 0,
  threeBetOopContinues: 0,
  threeBetOopFolds: 0,

  fourBetIpChallenges: 0,
  fourBetIpContinues: 0,
  fourBetIpFolds: 0,
  fourBetOopChallenges: 0,
  fourBetOopContinues: 0,
  fourBetOopFolds: 0,

  fiveBetIpChallenges: 0,
  fiveBetIpContinues: 0,
  fiveBetIpFolds: 0,
  fiveBetOopChallenges: 0,
  fiveBetOopContinues: 0,
  fiveBetOopFolds: 0,

  cbetIpChallenges: 0,
  cbetIpContinues: 0,
  cbetIpFolds: 0,
  cbetOopChallenges: 0,
  cbetOopContinues: 0,
  cbetOopFolds: 0,

  stealIpChallenges: 0,
  stealIpContinues: 0,
  stealIpFolds: 0,
  stealOopChallenges: 0,
  stealOopContinues: 0,
  stealOopFolds: 0,

  openShoveIpChallenges: 0,
  openShoveIpContinues: 0,
  openShoveIpFolds: 0,
  openShoveOopChallenges: 0,
  openShoveOopContinues: 0,
  openShoveOopFolds: 0,

  wentToShowdownFrequency: 0,
  wonAtShowdownFrequency: 0,
  wonWithoutShowdownFrequency: 0,

  winningsAverage: 0,
  investmentsAverage: 0,
  profitAverage: 0,
  lossesAverage: 0,

  bb100: 0,
  returnOnInvestmentFactor: 0,
  stackToPotFactor: 0,

  decisionDurationAverage: 0,
  profitFactor: 0,
};

type MetricName = keyof Omit<StreetStat, 'gameIds'>;
type GroupedMetrics<T extends MetricName[]> = T extends [infer First, ...infer Rest]
  ? Record<
      First extends MetricName ? StreetStat[First] | 'total' : string,
      GroupedMetrics<Rest extends MetricName[] ? Rest : []>
    >
  : PokerMetrics;

export type AgregatedMetrics<T extends MetricName[]> = GroupedMetrics<T>;

function getOrCreateMetric(obj: any, key: string): PokerMetrics {
  if (!obj[key]) {
    obj[key] = { ...emptyMetric, gameIds: new Set() };
  }
  return obj[key];
}

export function getPokerMetrics<T extends (keyof StreetStat)[]>(
  stats: readonly StreetStat[],
  groups: T = ['player', 'street'] as T,
  withTotals = true
): AgregatedMetrics<T> & { total: PokerMetrics } {
  const result: AgregatedMetrics<T> & { total: PokerMetrics } = {
    total: { ...emptyMetric, gameIds: new Set() },
  } as AgregatedMetrics<T> & { total: PokerMetrics };

  // Process each stat
  for (const stat of stats) {
    let current = result;

    // Process each group level
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const value = String(stat[group]);

      if (i == groups.length - 1) {
        updateMetric(getOrCreateMetric(current, value), stat);
      }

      // Update total for current level
      if (withTotals) {
        updateMetric(getOrCreateMetric(current, 'total'), stat);
      }
      const key = value as keyof typeof current;
      if (!current[key]) current[key] = {} as any;
      current = current[key] as any;
    }
  }

  // Calculate derived metrics for all levels
  function updateDerivedMetrics(obj: any) {
    for (const key in obj) {
      const value = obj[key];
      if (value && typeof value === 'object') {
        if ('raises' in value) {
          aggregateMetricsProperties(value);
        } else {
          updateDerivedMetrics(value);
        }
      }
    }
  }

  updateDerivedMetrics(result);
  return result;
}

export function aggregateMetricsProperties(metric: PokerMetrics): PokerMetrics {
  metric.limpFrequency = metric.limps / (metric.limpOpportunities || 1);

  metric.aggressionFactor = (metric.bets + metric.raises) / (metric.calls || 1);
  metric.aggressionFrequency =
    (metric.bets + metric.raises) /
    (metric.bets + metric.raises + metric.calls + metric.folds || 1);

  metric.vpipFrequency = metric.voluntaryPutMoneyInPotTimes / (metric.distinctGameCount || 1);
  metric.sawFlopFrequency = (metric.sawFlop ?? 0) / (metric.distinctGameCount || 1);
  metric.allInFrequency = metric.allIns / ((metric.distinctGameCount || 1) / 100);
  metric.potAverage = (metric.pot ?? 0) / (metric.distinctGameCount || 1);

  // --- IP/OOP Frequencies ---

  // PFR
  metric.preflopRaiseFrequency = metric.preflopRaises / (metric.preflopRaiseOpportunities || 1);

  // 3-Bet
  metric.threeBetIpFrequency = metric.threeBetIpAttempts / (metric.threeBetIpOpportunities || 1);
  metric.threeBetOopFrequency = metric.threeBetOopAttempts / (metric.threeBetOopOpportunities || 1);
  metric.threeBetIpTakedownFrequency =
    metric.threeBetIpTakedowns / (metric.threeBetIpAttempts || 1);
  metric.threeBetOopTakedownFrequency =
    metric.threeBetOopTakedowns / (metric.threeBetOopAttempts || 1);
  metric.threeBetIpFoldFrequency = metric.threeBetIpFolds / (metric.threeBetIpChallenges || 1);
  metric.threeBetOopFoldFrequency = metric.threeBetOopFolds / (metric.threeBetOopChallenges || 1);
  metric.threeBetIpContinueFrequency =
    metric.threeBetIpContinues / (metric.threeBetIpChallenges || 1);
  metric.threeBetOopContinueFrequency =
    metric.threeBetOopContinues / (metric.threeBetOopChallenges || 1);

  metric.threeBetFrequency = metric.threeBetAttempts / (metric.threeBetOpportunities || 1);
  metric.threeBetTakedownFrequency = metric.threeBetTakedowns / (metric.threeBetAttempts || 1);
  metric.threeBetFoldFrequency = metric.threeBetFolds / (metric.threeBetChallenges || 1);
  metric.threeBetContinueFrequency = metric.threeBetContinues / (metric.threeBetChallenges || 1);

  // 4-Bet
  metric.fourBetIpFrequency = metric.fourBetIpAttempts / (metric.fourBetIpOpportunities || 1);
  metric.fourBetOopFrequency = metric.fourBetOopAttempts / (metric.fourBetOopOpportunities || 1);
  metric.fourBetIpTakedownFrequency = metric.fourBetIpTakedowns / (metric.fourBetIpAttempts || 1);
  metric.fourBetOopTakedownFrequency =
    metric.fourBetOopTakedowns / (metric.fourBetOopAttempts || 1);
  metric.fourBetIpFoldFrequency = metric.fourBetIpFolds / (metric.fourBetIpChallenges || 1);
  metric.fourBetOopFoldFrequency = metric.fourBetOopFolds / (metric.fourBetOopChallenges || 1);
  metric.fourBetIpContinueFrequency = metric.fourBetIpContinues / (metric.fourBetIpChallenges || 1);
  metric.fourBetOopContinueFrequency =
    metric.fourBetOopContinues / (metric.fourBetOopChallenges || 1);

  metric.fourBetFrequency = metric.fourBetAttempts / (metric.fourBetOpportunities || 1);
  metric.fourBetTakedownFrequency = metric.fourBetTakedowns / (metric.fourBetAttempts || 1);
  metric.fourBetFoldFrequency = metric.fourBetFolds / (metric.fourBetChallenges || 1);
  metric.fourBetContinueFrequency = metric.fourBetContinues / (metric.fourBetChallenges || 1);

  // 5-Bet
  metric.fiveBetIpFrequency = metric.fiveBetIpAttempts / (metric.fiveBetIpOpportunities || 1);
  metric.fiveBetOopFrequency = metric.fiveBetOopAttempts / (metric.fiveBetOopOpportunities || 1);
  metric.fiveBetIpTakedownFrequency = metric.fiveBetIpTakedowns / (metric.fiveBetIpAttempts || 1);
  metric.fiveBetOopTakedownFrequency =
    metric.fiveBetOopTakedowns / (metric.fiveBetOopAttempts || 1);
  metric.fiveBetIpFoldFrequency = metric.fiveBetIpFolds / (metric.fiveBetIpChallenges || 1);
  metric.fiveBetOopFoldFrequency = metric.fiveBetOopFolds / (metric.fiveBetOopChallenges || 1);
  metric.fiveBetIpContinueFrequency = metric.fiveBetIpContinues / (metric.fiveBetIpChallenges || 1);
  metric.fiveBetOopContinueFrequency =
    metric.fiveBetOopContinues / (metric.fiveBetOopChallenges || 1);

  metric.fiveBetFrequency = metric.fiveBetAttempts / (metric.fiveBetOpportunities || 1);
  metric.fiveBetTakedownFrequency = metric.fiveBetTakedowns / (metric.fiveBetAttempts || 1);
  metric.fiveBetFoldFrequency = metric.fiveBetFolds / (metric.fiveBetChallenges || 1);
  metric.fiveBetContinueFrequency = metric.fiveBetContinues / (metric.fiveBetChallenges || 1);

  // C-Bet
  metric.cbetIpFrequency = metric.cbetIpAttempts / (metric.cbetIpOpportunities || 1);
  metric.cbetOopFrequency = metric.cbetOopAttempts / (metric.cbetOopOpportunities || 1);
  metric.cbetIpTakedownFrequency = metric.cbetIpTakedowns / (metric.cbetIpAttempts || 1);
  metric.cbetOopTakedownFrequency = metric.cbetOopTakedowns / (metric.cbetOopAttempts || 1);
  metric.cbetIpFoldFrequency = metric.cbetIpFolds / (metric.cbetIpChallenges || 1);
  metric.cbetOopFoldFrequency = metric.cbetOopFolds / (metric.cbetOopChallenges || 1);
  metric.cbetIpContinueFrequency = metric.cbetIpContinues / (metric.cbetIpChallenges || 1);
  metric.cbetOopContinueFrequency = metric.cbetOopContinues / (metric.cbetOopChallenges || 1);

  metric.cbetFrequency = metric.cbetAttempts / (metric.cbetOpportunities || 1);
  metric.cbetTakedownFrequency = metric.cbetTakedowns / (metric.cbetAttempts || 1);
  metric.cbetFoldFrequency = metric.cbetFolds / (metric.cbetChallenges || 1);
  metric.cbetContinueFrequency = metric.cbetContinues / (metric.cbetChallenges || 1);

  // Delayed C-Bet
  metric.delayedCbetIpFrequency =
    metric.delayedCbetIpAttempts / (metric.delayedCbetIpOpportunities || 1);
  metric.delayedCbetOopFrequency =
    metric.delayedCbetOopAttempts / (metric.delayedCbetOopOpportunities || 1);
  metric.delayedCbetIpTakedownFrequency =
    metric.delayedCbetIpTakedowns / (metric.delayedCbetIpAttempts || 1);
  metric.delayedCbetOopTakedownFrequency =
    metric.delayedCbetOopTakedowns / (metric.delayedCbetOopAttempts || 1);
  metric.delayedCbetIpFoldFrequency =
    metric.delayedCbetIpFolds / (metric.delayedCbetIpChallenges || 1);
  metric.delayedCbetOopFoldFrequency =
    metric.delayedCbetOopFolds / (metric.delayedCbetOopChallenges || 1);
  metric.delayedCbetIpContinueFrequency =
    metric.delayedCbetIpContinues / (metric.delayedCbetIpChallenges || 1);
  metric.delayedCbetOopContinueFrequency =
    metric.delayedCbetOopContinues / (metric.delayedCbetOopChallenges || 1);
  metric.delayedCbetFrequency = metric.delayedCbetAttempts / (metric.delayedCbetOpportunities || 1);
  metric.delayedCbetTakedownFrequency =
    metric.delayedCbetTakedowns / (metric.delayedCbetAttempts || 1);
  metric.delayedCbetFoldFrequency = metric.delayedCbetFolds / (metric.delayedCbetChallenges || 1);
  metric.delayedCbetContinueFrequency =
    metric.delayedCbetContinues / (metric.delayedCbetChallenges || 1);

  // Double Barrel
  metric.doubleBarrelIpFrequency =
    metric.doubleBarrelIpAttempts / (metric.doubleBarrelIpOpportunities || 1);
  metric.doubleBarrelOopFrequency =
    metric.doubleBarrelOopAttempts / (metric.doubleBarrelOopOpportunities || 1);
  metric.doubleBarrelIpTakedownFrequency =
    metric.doubleBarrelIpTakedowns / (metric.doubleBarrelIpAttempts || 1);
  metric.doubleBarrelOopTakedownFrequency =
    metric.doubleBarrelOopTakedowns / (metric.doubleBarrelOopAttempts || 1);
  metric.doubleBarrelIpFoldFrequency =
    metric.doubleBarrelIpFolds / (metric.doubleBarrelIpChallenges || 1);
  metric.doubleBarrelOopFoldFrequency =
    metric.doubleBarrelOopFolds / (metric.doubleBarrelOopChallenges || 1);
  metric.doubleBarrelIpContinueFrequency =
    metric.doubleBarrelIpContinues / (metric.doubleBarrelIpChallenges || 1);
  metric.doubleBarrelOopContinueFrequency =
    metric.doubleBarrelOopContinues / (metric.doubleBarrelOopChallenges || 1);
  metric.doubleBarrelFrequency =
    metric.doubleBarrelAttempts / (metric.doubleBarrelOpportunities || 1);
  metric.doubleBarrelTakedownFrequency =
    metric.doubleBarrelTakedowns / (metric.doubleBarrelAttempts || 1);
  metric.doubleBarrelFoldFrequency =
    metric.doubleBarrelFolds / (metric.doubleBarrelChallenges || 1);
  metric.doubleBarrelContinueFrequency =
    metric.doubleBarrelContinues / (metric.doubleBarrelChallenges || 1);

  // Triple Barrel
  metric.tripleBarrelIpFrequency =
    metric.tripleBarrelIpAttempts / (metric.tripleBarrelIpOpportunities || 1);
  metric.tripleBarrelOopFrequency =
    metric.tripleBarrelOopAttempts / (metric.tripleBarrelOopOpportunities || 1);
  metric.tripleBarrelIpTakedownFrequency =
    metric.tripleBarrelIpTakedowns / (metric.tripleBarrelIpAttempts || 1);
  metric.tripleBarrelOopTakedownFrequency =
    metric.tripleBarrelOopTakedowns / (metric.tripleBarrelOopAttempts || 1);
  metric.tripleBarrelIpFoldFrequency =
    metric.tripleBarrelIpFolds / (metric.tripleBarrelIpChallenges || 1);
  metric.tripleBarrelOopFoldFrequency =
    metric.tripleBarrelOopFolds / (metric.tripleBarrelOopChallenges || 1);
  metric.tripleBarrelIpContinueFrequency =
    metric.tripleBarrelIpContinues / (metric.tripleBarrelIpChallenges || 1);
  metric.tripleBarrelOopContinueFrequency =
    metric.tripleBarrelOopContinues / (metric.tripleBarrelOopChallenges || 1);
  metric.tripleBarrelFrequency =
    metric.tripleBarrelAttempts / (metric.tripleBarrelOpportunities || 1);
  metric.tripleBarrelTakedownFrequency =
    metric.tripleBarrelTakedowns / (metric.tripleBarrelAttempts || 1);
  metric.tripleBarrelFoldFrequency =
    metric.tripleBarrelFolds / (metric.tripleBarrelChallenges || 1);
  metric.tripleBarrelContinueFrequency =
    metric.tripleBarrelContinues / (metric.tripleBarrelChallenges || 1);

  // Squeeze
  metric.squeezeIpFrequency = metric.squeezeIpAttempts / (metric.squeezeIpOpportunities || 1);
  metric.squeezeOopFrequency = metric.squeezeOopAttempts / (metric.squeezeOopOpportunities || 1);
  metric.squeezeIpTakedownFrequency = metric.squeezeIpTakedowns / (metric.squeezeIpAttempts || 1);
  metric.squeezeOopTakedownFrequency =
    metric.squeezeOopTakedowns / (metric.squeezeOopAttempts || 1);
  metric.squeezeIpFoldFrequency = metric.squeezeIpFolds / (metric.squeezeIpChallenges || 1);
  metric.squeezeOopFoldFrequency = metric.squeezeOopFolds / (metric.squeezeOopChallenges || 1);
  metric.squeezeIpContinueFrequency = metric.squeezeIpContinues / (metric.squeezeIpChallenges || 1);
  metric.squeezeOopContinueFrequency =
    metric.squeezeOopContinues / (metric.squeezeOopChallenges || 1);
  metric.squeezeFrequency = metric.squeezeAttempts / (metric.squeezeOpportunities || 1);
  metric.squeezeTakedownFrequency = metric.squeezeTakedowns / (metric.squeezeAttempts || 1);
  metric.squeezeFoldFrequency = metric.squeezeFolds / (metric.squeezeChallenges || 1);
  metric.squeezeContinueFrequency = metric.squeezeContinues / (metric.squeezeChallenges || 1);

  // Steal
  metric.stealIpFrequency = metric.stealIpAttempts / (metric.stealIpOpportunities || 1);
  metric.stealOopFrequency = metric.stealOopAttempts / (metric.stealOopOpportunities || 1);
  metric.stealIpTakedownFrequency = metric.stealIpTakedowns / (metric.stealIpAttempts || 1);
  metric.stealOopTakedownFrequency = metric.stealOopTakedowns / (metric.stealOopAttempts || 1);
  metric.stealIpFoldFrequency = metric.stealIpFolds / (metric.stealIpChallenges || 1);
  metric.stealOopFoldFrequency = metric.stealOopFolds / (metric.stealOopChallenges || 1);
  metric.stealIpContinueFrequency = metric.stealIpContinues / (metric.stealIpChallenges || 1);
  metric.stealOopContinueFrequency = metric.stealOopContinues / (metric.stealOopChallenges || 1);

  metric.stealFrequency = metric.stealAttempts / (metric.stealOpportunities || 1);
  metric.stealTakedownFrequency = metric.stealTakedowns / (metric.stealAttempts || 1);
  metric.stealFoldFrequency = metric.stealFolds / (metric.stealChallenges || 1);
  metric.stealContinueFrequency = metric.stealContinues / (metric.stealChallenges || 1);

  // Donk Bet
  metric.donkBetFrequency = metric.donkBetAttempts / (metric.donkBetOpportunities || 1);
  metric.donkBetTakedownFrequency = metric.donkBetTakedowns / (metric.donkBetAttempts || 1);
  metric.donkBetFoldFrequency = metric.donkBetFolds / (metric.donkBetChallenges || 1);
  metric.donkBetContinueFrequency = metric.donkBetContinues / (metric.donkBetChallenges || 1);

  // Probe Bet
  metric.probeBetFrequency = metric.probeBetAttempts / (metric.probeBetOpportunities || 1);
  metric.probeBetTakedownFrequency = metric.probeBetTakedowns / (metric.probeBetAttempts || 1);
  metric.probeBetFoldFrequency = metric.probeBetFolds / (metric.probeBetChallenges || 1);
  metric.probeBetContinueFrequency = metric.probeBetContinues / (metric.probeBetChallenges || 1);

  // Float Bet
  metric.floatBetFrequency = metric.floatBetAttempts / (metric.floatBetOpportunities || 1);
  metric.floatBetTakedownFrequency = metric.floatBetTakedowns / (metric.floatBetAttempts || 1);
  metric.floatBetFoldFrequency = metric.floatBetFolds / (metric.floatBetChallenges || 1);
  metric.floatBetContinueFrequency = metric.floatBetContinues / (metric.floatBetChallenges || 1);

  // Check-Raise
  metric.checkRaiseFrequency = metric.checkRaiseAttempts / (metric.checkRaiseOpportunities || 1);
  metric.checkRaiseTakedownFrequency =
    metric.checkRaiseTakedowns / (metric.checkRaiseAttempts || 1);
  metric.checkRaiseFoldFrequency = metric.checkRaiseFolds / (metric.checkRaiseChallenges || 1);
  metric.checkRaiseContinueFrequency =
    metric.checkRaiseContinues / (metric.checkRaiseChallenges || 1);

  // Open Shove
  metric.openShoveIpFrequency = metric.openShoveIpAttempts / (metric.openShoveIpOpportunities || 1);
  metric.openShoveOopFrequency =
    metric.openShoveOopAttempts / (metric.openShoveOopOpportunities || 1);
  metric.openShoveIpTakedownFrequency =
    metric.openShoveIpTakedowns / (metric.openShoveIpAttempts || 1);
  metric.openShoveOopTakedownFrequency =
    metric.openShoveOopTakedowns / (metric.openShoveOopAttempts || 1);
  metric.openShoveIpFoldFrequency = metric.openShoveIpFolds / (metric.openShoveIpChallenges || 1);
  metric.openShoveOopFoldFrequency =
    metric.openShoveOopFolds / (metric.openShoveOopChallenges || 1);
  metric.openShoveIpContinueFrequency =
    metric.openShoveIpContinues / (metric.openShoveIpChallenges || 1);
  metric.openShoveOopContinueFrequency =
    metric.openShoveOopContinues / (metric.openShoveOopChallenges || 1);

  metric.openShoveFrequency = metric.openShoveAttempts / (metric.openShoveOpportunities || 1);
  metric.openShoveTakedownFrequency = metric.openShoveTakedowns / (metric.openShoveAttempts || 1);
  metric.openShoveFoldFrequency = metric.openShoveFolds / (metric.openShoveChallenges || 1);
  metric.openShoveContinueFrequency = metric.openShoveContinues / (metric.openShoveChallenges || 1);

  // Shove
  metric.shoveIpFrequency = metric.shoveIpAttempts / (metric.shoveIpOpportunities || 1);
  metric.shoveOopFrequency = metric.shoveOopAttempts / (metric.shoveOopOpportunities || 1);
  metric.shoveIpTakedownFrequency = metric.shoveIpTakedowns / (metric.shoveIpAttempts || 1);
  metric.shoveOopTakedownFrequency = metric.shoveOopTakedowns / (metric.shoveOopAttempts || 1);
  metric.shoveIpFoldFrequency = metric.shoveIpFolds / (metric.shoveIpChallenges || 1);
  metric.shoveOopFoldFrequency = metric.shoveOopFolds / (metric.shoveOopChallenges || 1);
  metric.shoveIpContinueFrequency = metric.shoveIpContinues / (metric.shoveIpChallenges || 1);
  metric.shoveOopContinueFrequency = metric.shoveOopContinues / (metric.shoveOopChallenges || 1);
  metric.shoveFrequency = metric.shoveAttempts / (metric.shoveOpportunities || 1);
  metric.shoveTakedownFrequency = metric.shoveTakedowns / (metric.shoveAttempts || 1);
  metric.shoveFoldFrequency = metric.shoveFolds / (metric.shoveChallenges || 1);
  metric.shoveContinueFrequency = metric.shoveContinues / (metric.shoveChallenges || 1);

  return metric;
}

// Helper function to update metrics
function updateMetric(metric: PokerMetrics, stat: StreetStat) {
  // Aggregate basic stats
  metric.raises += stat.raises;
  metric.bets += stat.bets;
  metric.calls += stat.calls;
  metric.checks += stat.checks;
  metric.folds += stat.folds;

  metric.allIns += stat.allIns;

  metric.aggressions += stat.aggressions;
  metric.passivities += stat.passivities;
  metric.decisions += stat.decisions;

  metric.decisionDuration += stat.decisionDuration;
  metric.decisionDurationAverage = metric.decisionDuration / (metric.decisions || 1);

  metric.limps += stat.limps;
  metric.limpOpportunities += stat.limpOpportunities;

  metric.preflopRaiseOpportunities += stat.preflopRaiseOpportunities;
  metric.preflopRaises += stat.preflopRaises;

  // Base aggressor stats and calculated takedowns
  metric.threeBetIpAttempts += stat.threeBetIpAttempts;
  metric.threeBetOopAttempts += stat.threeBetOopAttempts;
  metric.threeBetIpOpportunities += stat.threeBetIpOpportunities;
  metric.threeBetOopOpportunities += stat.threeBetOopOpportunities;
  metric.threeBetIpTakedowns += stat.threeBetIpTakedowns;
  metric.threeBetOopTakedowns += stat.threeBetOopTakedowns;

  metric.threeBetOpportunities += stat.threeBetIpOpportunities + stat.threeBetOopOpportunities;
  metric.threeBetAttempts += stat.threeBetIpAttempts + stat.threeBetOopAttempts;
  metric.threeBetTakedowns += stat.threeBetIpTakedowns + stat.threeBetOopTakedowns;

  metric.fourBetIpAttempts += stat.fourBetIpAttempts;
  metric.fourBetOopAttempts += stat.fourBetOopAttempts;
  metric.fourBetIpOpportunities += stat.fourBetIpOpportunities;
  metric.fourBetOopOpportunities += stat.fourBetOopOpportunities;
  metric.fourBetIpTakedowns += stat.fourBetIpTakedowns;
  metric.fourBetOopTakedowns += stat.fourBetOopTakedowns;

  metric.fourBetOpportunities += stat.fourBetIpOpportunities + stat.fourBetOopOpportunities;
  metric.fourBetAttempts += stat.fourBetIpAttempts + stat.fourBetOopAttempts;
  metric.fourBetTakedowns += stat.fourBetIpTakedowns + stat.fourBetOopTakedowns;

  metric.fiveBetIpAttempts += stat.fiveBetIpAttempts;
  metric.fiveBetOopAttempts += stat.fiveBetOopAttempts;
  metric.fiveBetIpOpportunities += stat.fiveBetIpOpportunities;
  metric.fiveBetOopOpportunities += stat.fiveBetOopOpportunities;
  metric.fiveBetIpTakedowns += stat.fiveBetIpTakedowns;
  metric.fiveBetOopTakedowns += stat.fiveBetOopTakedowns;

  metric.fiveBetOpportunities += stat.fiveBetIpOpportunities + stat.fiveBetOopOpportunities;
  metric.fiveBetAttempts += stat.fiveBetIpAttempts + stat.fiveBetOopAttempts;
  metric.fiveBetTakedowns += stat.fiveBetIpTakedowns + stat.fiveBetOopTakedowns;

  metric.cbetIpAttempts += stat.cbetIpAttempts;
  metric.cbetOopAttempts += stat.cbetOopAttempts;
  metric.cbetIpOpportunities += stat.cbetIpOpportunities;
  metric.cbetOopOpportunities += stat.cbetOopOpportunities;
  metric.cbetIpTakedowns += stat.cbetIpTakedowns;
  metric.cbetOopTakedowns += stat.cbetOopTakedowns;

  metric.cbetOpportunities += stat.cbetIpOpportunities + stat.cbetOopOpportunities;
  metric.cbetAttempts += stat.cbetIpAttempts + stat.cbetOopAttempts;
  metric.cbetTakedowns += stat.cbetIpTakedowns + stat.cbetOopTakedowns;

  metric.delayedCbetIpAttempts += stat.delayedCbetIpAttempts;
  metric.delayedCbetOopAttempts += stat.delayedCbetOopAttempts;
  metric.delayedCbetIpOpportunities += stat.delayedCbetIpOpportunities;
  metric.delayedCbetOopOpportunities += stat.delayedCbetOopOpportunities;
  metric.delayedCbetIpTakedowns += stat.delayedCbetIpTakedowns;
  metric.delayedCbetOopTakedowns += stat.delayedCbetOopTakedowns;
  metric.delayedCbetOpportunities +=
    stat.delayedCbetIpOpportunities + stat.delayedCbetOopOpportunities;
  metric.delayedCbetAttempts += stat.delayedCbetIpAttempts + stat.delayedCbetOopAttempts;
  metric.delayedCbetTakedowns += stat.delayedCbetIpTakedowns + stat.delayedCbetOopTakedowns;

  metric.doubleBarrelIpAttempts += stat.doubleBarrelIpAttempts;
  metric.doubleBarrelOopAttempts += stat.doubleBarrelOopAttempts;
  metric.doubleBarrelIpOpportunities += stat.doubleBarrelIpOpportunities;
  metric.doubleBarrelOopOpportunities += stat.doubleBarrelOopOpportunities;
  metric.doubleBarrelIpTakedowns += stat.doubleBarrelIpTakedowns;
  metric.doubleBarrelOopTakedowns += stat.doubleBarrelOopTakedowns;
  metric.doubleBarrelOpportunities +=
    stat.doubleBarrelIpOpportunities + stat.doubleBarrelOopOpportunities;
  metric.doubleBarrelAttempts += stat.doubleBarrelIpAttempts + stat.doubleBarrelOopAttempts;
  metric.doubleBarrelTakedowns += stat.doubleBarrelIpTakedowns + stat.doubleBarrelOopTakedowns;

  metric.tripleBarrelIpAttempts += stat.tripleBarrelIpAttempts;
  metric.tripleBarrelOopAttempts += stat.tripleBarrelOopAttempts;
  metric.tripleBarrelIpOpportunities += stat.tripleBarrelIpOpportunities;
  metric.tripleBarrelOopOpportunities += stat.tripleBarrelOopOpportunities;
  metric.tripleBarrelIpTakedowns += stat.tripleBarrelIpTakedowns;
  metric.tripleBarrelOopTakedowns += stat.tripleBarrelOopTakedowns;
  metric.tripleBarrelOpportunities +=
    stat.tripleBarrelIpOpportunities + stat.tripleBarrelOopOpportunities;
  metric.tripleBarrelAttempts += stat.tripleBarrelIpAttempts + stat.tripleBarrelOopAttempts;
  metric.tripleBarrelTakedowns += stat.tripleBarrelIpTakedowns + stat.tripleBarrelOopTakedowns;

  metric.squeezeIpAttempts += stat.squeezeIpAttempts;
  metric.squeezeOopAttempts += stat.squeezeOopAttempts;
  metric.squeezeIpOpportunities += stat.squeezeIpOpportunities;
  metric.squeezeOopOpportunities += stat.squeezeOopOpportunities;
  metric.squeezeIpTakedowns += stat.squeezeIpTakedowns;
  metric.squeezeOopTakedowns += stat.squeezeOopTakedowns;
  metric.squeezeOpportunities += stat.squeezeIpOpportunities + stat.squeezeOopOpportunities;
  metric.squeezeAttempts += stat.squeezeIpAttempts + stat.squeezeOopAttempts;
  metric.squeezeTakedowns += stat.squeezeIpTakedowns + stat.squeezeOopTakedowns;

  metric.stealIpAttempts += stat.stealIpAttempts;
  metric.stealOopAttempts += stat.stealOopAttempts;
  metric.stealIpOpportunities += stat.stealIpOpportunities;
  metric.stealOopOpportunities += stat.stealOopOpportunities;
  metric.stealIpTakedowns += stat.stealIpTakedowns;
  metric.stealOopTakedowns += stat.stealOopTakedowns;
  metric.stealOpportunities += stat.stealIpOpportunities + stat.stealOopOpportunities;
  metric.stealAttempts += stat.stealIpAttempts + stat.stealOopAttempts;
  metric.stealTakedowns += stat.stealIpTakedowns + stat.stealOopTakedowns;

  metric.donkBetAttempts += stat.donkBetAttempts;
  metric.donkBetOpportunities += stat.donkBetOpportunities;
  metric.donkBetTakedowns += stat.donkBetTakedowns;
  metric.donkBetFolds += stat.donkBetFolds;
  metric.donkBetContinues += stat.donkBetContinues;
  metric.donkBetChallenges += stat.donkBetChallenges;

  metric.checkRaiseAttempts += stat.checkRaiseAttempts;
  metric.checkRaiseOpportunities += stat.checkRaiseOpportunities;
  metric.checkRaiseTakedowns += stat.checkRaiseTakedowns;
  metric.checkRaiseFolds += stat.checkRaiseFolds;
  metric.checkRaiseContinues += stat.checkRaiseContinues;
  metric.checkRaiseChallenges += stat.checkRaiseChallenges;

  metric.openShoveIpAttempts += stat.openShoveIpAttempts;
  metric.openShoveIpOpportunities += stat.openShoveIpOpportunities;
  metric.openShoveIpTakedowns += stat.openShoveIpTakedowns;
  metric.openShoveOopAttempts += stat.openShoveOopAttempts;
  metric.openShoveOopOpportunities += stat.openShoveOopOpportunities;
  metric.openShoveOopTakedowns += stat.openShoveOopTakedowns;

  metric.openShoveOpportunities += stat.openShoveIpOpportunities + stat.openShoveOopOpportunities;
  metric.openShoveAttempts += stat.openShoveIpAttempts + stat.openShoveOopAttempts;
  metric.openShoveTakedowns += stat.openShoveIpTakedowns + stat.openShoveOopTakedowns;

  // Base defender stats
  metric.threeBetIpChallenges += stat.threeBetIpChallenges;
  metric.threeBetOopChallenges += stat.threeBetOopChallenges;
  metric.threeBetIpContinues += stat.threeBetIpContinues;
  metric.threeBetOopContinues += stat.threeBetOopContinues;
  metric.threeBetIpFolds += stat.threeBetIpFolds;
  metric.threeBetOopFolds += stat.threeBetOopFolds;

  metric.threeBetChallenges += stat.threeBetIpChallenges + stat.threeBetOopChallenges;
  metric.threeBetContinues += stat.threeBetIpContinues + stat.threeBetOopContinues;
  metric.threeBetFolds += stat.threeBetIpFolds + stat.threeBetOopFolds;

  metric.fourBetIpChallenges += stat.fourBetIpChallenges;
  metric.fourBetOopChallenges += stat.fourBetOopChallenges;
  metric.fourBetIpContinues += stat.fourBetIpContinues;
  metric.fourBetOopContinues += stat.fourBetOopContinues;
  metric.fourBetIpFolds += stat.fourBetIpFolds;
  metric.fourBetOopFolds += stat.fourBetOopFolds;

  metric.fourBetChallenges += stat.fourBetIpChallenges + stat.fourBetOopChallenges;
  metric.fourBetContinues += stat.fourBetIpContinues + stat.fourBetOopContinues;
  metric.fourBetFolds += stat.fourBetIpFolds + stat.fourBetOopFolds;

  metric.fiveBetIpChallenges += stat.fiveBetIpChallenges;
  metric.fiveBetOopChallenges += stat.fiveBetOopChallenges;
  metric.fiveBetIpContinues += stat.fiveBetIpContinues;
  metric.fiveBetOopContinues += stat.fiveBetOopContinues;
  metric.fiveBetIpFolds += stat.fiveBetIpFolds;
  metric.fiveBetOopFolds += stat.fiveBetOopFolds;

  metric.fiveBetChallenges += stat.fiveBetIpChallenges + stat.fiveBetOopChallenges;
  metric.fiveBetContinues += stat.fiveBetIpContinues + stat.fiveBetOopContinues;
  metric.fiveBetFolds += stat.fiveBetIpFolds + stat.fiveBetOopFolds;

  metric.cbetIpChallenges += stat.cbetIpChallenges;
  metric.cbetOopChallenges += stat.cbetOopChallenges;
  metric.cbetIpContinues += stat.cbetIpContinues;
  metric.cbetOopContinues += stat.cbetOopContinues;
  metric.cbetIpFolds += stat.cbetIpFolds;
  metric.cbetOopFolds += stat.cbetOopFolds;

  metric.cbetChallenges += stat.cbetIpChallenges + stat.cbetOopChallenges;
  metric.cbetContinues += stat.cbetIpContinues + stat.cbetOopContinues;
  metric.cbetFolds += stat.cbetIpFolds + stat.cbetOopFolds;

  metric.delayedCbetIpChallenges += stat.delayedCbetIpChallenges;
  metric.delayedCbetOopChallenges += stat.delayedCbetOopChallenges;
  metric.delayedCbetIpContinues += stat.delayedCbetIpContinues;
  metric.delayedCbetOopContinues += stat.delayedCbetOopContinues;
  metric.delayedCbetIpFolds += stat.delayedCbetIpFolds;
  metric.delayedCbetOopFolds += stat.delayedCbetOopFolds;
  metric.delayedCbetChallenges += stat.delayedCbetIpChallenges + stat.delayedCbetOopChallenges;
  metric.delayedCbetContinues += stat.delayedCbetIpContinues + stat.delayedCbetOopContinues;
  metric.delayedCbetFolds += stat.delayedCbetIpFolds + stat.delayedCbetOopFolds;

  metric.doubleBarrelIpChallenges += stat.doubleBarrelIpChallenges;
  metric.doubleBarrelOopChallenges += stat.doubleBarrelOopChallenges;
  metric.doubleBarrelIpContinues += stat.doubleBarrelIpContinues;
  metric.doubleBarrelOopContinues += stat.doubleBarrelOopContinues;
  metric.doubleBarrelIpFolds += stat.doubleBarrelIpFolds;
  metric.doubleBarrelOopFolds += stat.doubleBarrelOopFolds;
  metric.doubleBarrelChallenges += stat.doubleBarrelIpChallenges + stat.doubleBarrelOopChallenges;
  metric.doubleBarrelContinues += stat.doubleBarrelIpContinues + stat.doubleBarrelOopContinues;
  metric.doubleBarrelFolds += stat.doubleBarrelIpFolds + stat.doubleBarrelOopFolds;

  metric.tripleBarrelIpChallenges += stat.tripleBarrelIpChallenges;
  metric.tripleBarrelOopChallenges += stat.tripleBarrelOopChallenges;
  metric.tripleBarrelIpContinues += stat.tripleBarrelIpContinues;
  metric.tripleBarrelOopContinues += stat.tripleBarrelOopContinues;
  metric.tripleBarrelIpFolds += stat.tripleBarrelIpFolds;
  metric.tripleBarrelOopFolds += stat.tripleBarrelOopFolds;
  metric.tripleBarrelChallenges += stat.tripleBarrelIpChallenges + stat.tripleBarrelOopChallenges;
  metric.tripleBarrelContinues += stat.tripleBarrelIpContinues + stat.tripleBarrelOopContinues;
  metric.tripleBarrelFolds += stat.tripleBarrelIpFolds + stat.tripleBarrelOopFolds;

  metric.squeezeIpChallenges += stat.squeezeIpChallenges;
  metric.squeezeOopChallenges += stat.squeezeOopChallenges;
  metric.squeezeIpContinues += stat.squeezeIpContinues;
  metric.squeezeOopContinues += stat.squeezeOopContinues;
  metric.squeezeIpFolds += stat.squeezeIpFolds;
  metric.squeezeOopFolds += stat.squeezeOopFolds;
  metric.squeezeChallenges += stat.squeezeIpChallenges + stat.squeezeOopChallenges;
  metric.squeezeContinues += stat.squeezeIpContinues + stat.squeezeOopContinues;
  metric.squeezeFolds += stat.squeezeIpFolds + stat.squeezeOopFolds;

  metric.stealIpChallenges += stat.stealIpChallenges;
  metric.stealOopChallenges += stat.stealOopChallenges;
  metric.stealIpContinues += stat.stealIpContinues;
  metric.stealOopContinues += stat.stealOopContinues;
  metric.stealIpFolds += stat.stealIpFolds;
  metric.stealOopFolds += stat.stealOopFolds;
  metric.stealChallenges += stat.stealIpChallenges + stat.stealOopChallenges;
  metric.stealContinues += stat.stealIpContinues + stat.stealOopContinues;
  metric.stealFolds += stat.stealIpFolds + stat.stealOopFolds;

  metric.openShoveIpChallenges += stat.openShoveIpChallenges;
  metric.openShoveOopChallenges += stat.openShoveOopChallenges;
  metric.openShoveIpContinues += stat.openShoveIpContinues;
  metric.openShoveOopContinues += stat.openShoveOopContinues;
  metric.openShoveIpFolds += stat.openShoveIpFolds;
  metric.openShoveOopFolds += stat.openShoveOopFolds;
  metric.openShoveChallenges += stat.openShoveIpChallenges + stat.openShoveOopChallenges;
  metric.openShoveContinues += stat.openShoveIpContinues + stat.openShoveOopContinues;
  metric.openShoveFolds += stat.openShoveIpFolds + stat.openShoveOopFolds;

  // Shove Defender
  metric.shoveIpChallenges += stat.shoveIpChallenges;
  metric.shoveOopChallenges += stat.shoveOopChallenges;
  metric.shoveIpContinues += stat.shoveIpContinues;
  metric.shoveOopContinues += stat.shoveOopContinues;
  metric.shoveIpFolds += stat.shoveIpFolds;
  metric.shoveOopFolds += stat.shoveOopFolds;
  metric.shoveChallenges += stat.shoveIpChallenges + stat.shoveOopChallenges;
  metric.shoveContinues += stat.shoveIpContinues + stat.shoveOopContinues;
  metric.shoveFolds += stat.shoveIpFolds + stat.shoveOopFolds;

  metric.wonAtShowdown += stat.wonAtShowdown;
  metric.wonWithoutShowdown += stat.wonWithoutShowdown;
  metric.voluntaryPutMoneyInPotTimes += stat.voluntaryPutMoneyInPotTimes;

  metric.pot = (metric.pot ?? 0) + (stat.pot ?? 0);
  metric.sawFlop = (metric.sawFlop ?? 0) + (stat.sawFlop ?? 0);

  metric.winnings += stat.winnings;
  metric.returns += stat.returns;
  metric.losses += stat.losses;
  metric.balance += stat.balance;
  metric.profits += stat.profits;
  metric.rake += stat.rake;
  metric.investments += stat.investments;
  metric.won += stat.won;
  metric.lost += stat.lost;

  metric.startedAt = Math.min(metric.startedAt, stat.createdAt);
  metric.gameIds.add(stat.venue + '/' + stat.hand.toString());
  metric.distinctGameCount = metric.gameIds.size;
}
