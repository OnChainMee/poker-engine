import { Game } from '../Game';
import type { Card } from '../types';
import { compareHands } from './showdown';

export interface Pot {
  bet: number;
  potSize: number;
  contributors: number[];
  isUncalled: boolean;
}

export function calculatePots(game: Game, includeCurrentRound = true): Pot[] {
  /**
   * STEP A: Determine which players actually contributed (totalBet > 0).
   */
  const involved = game.players.map((p, i) => (p.totalBet > 0 ? i : -1)).filter(x => x !== -1);

  // Calculate total amount bet by players to detect dead money (dead blinds/antes)
  const totalBetSum = game.players.reduce((sum, p) => sum + p.totalBet, 0);
  const deadMoney = game.pot - totalBetSum;

  if (involved.length === 0) {
    if (deadMoney > 0) {
      // No bets, but pot has money (e.g. antes only, or check-down with dead blinds).
      // Treat everyone as involved in the base pot.
      // Eligible winners will be filtered in finalizeStacks.
      return [
        {
          bet: 0,
          potSize: deadMoney,
          contributors: game.players.map((_, i) => i),
          isUncalled: false,
        },
      ];
    }
    // No contributions => no pot to distribute
    return [];
  }

  /**
   * STEP B: We gather all relevant "bet levels":
   *   1. The distinct totalBet values of each involved player
   *   2. The blindOrStraddle values (e.g. 50, 100) for players who actually posted them
   * so we don't skip from 0 -> 200 ignoring a big blind of 100.
   */
  const betLevelsSet = new Set<number>();

  for (const idx of involved) {
    // A player's totalBet
    betLevelsSet.add(
      game.players[idx].totalBet - (!includeCurrentRound ? game.players[idx].roundBet : 0)
    );
  }

  // Always ensure we start from bet=0 so the first slice covers that range.
  betLevelsSet.add(0);

  // Convert to a sorted array
  const uniqueBetLevels = [...betLevelsSet].sort((a, b) => a - b);

  /**
   * STEP C: Build pot slices by iterating through consecutive bet levels.
   *
   * Example betLevels might be [0, 50, 100, 200, 8303].
   * We'll slice from 0->50, 50->100, 100->200, 200->8303, etc.
   */
  const pots: Pot[] = [];

  let prevBet = 0;

  for (let i = 1; i < uniqueBetLevels.length; i++) {
    const currentBet = uniqueBetLevels[i];
    if (currentBet <= prevBet) {
      // skip duplicates or weirdness
      continue;
    }

    // Find all players whose totalBet >= currentBet
    const contributors = involved.filter(idx => game.players[idx].totalBet >= currentBet);

    const betDiff = currentBet - prevBet;
    const potSlice = contributors.length * betDiff;

    // Advance for next iteration
    prevBet = currentBet;

    if (potSlice === 0) {
      continue;
    }

    // Check for uncalled bet scenario: exactly 1 contributor
    if (contributors.length === 1 && !game.players[contributors[0]].hasFolded) {
      pots.push({
        bet: currentBet,
        potSize: potSlice,
        contributors,
        isUncalled: true,
      });
      // No need to add to pots, not "fully called"
    } else {
      // This chunk is fully called
      pots.push({
        bet: currentBet,
        potSize: potSlice,
        contributors,
        isUncalled: false,
      });
    }
  }

  // Add dead money to the base pot (the one with the lowest bet, which is first in array before sort)
  if (deadMoney > 0 && pots.length > 0) {
    // pots[0] corresponds to the first slice (bet 0 -> minBet), which is the main pot.
    pots[0].potSize += deadMoney;
  }

  return pots.sort((a, b) => b.bet - a.bet);
}

export function finalizeStacks(
  game: Game,
  compare: (cardsA: Card[], cardsB: Card[]) => number = compareHands
): number[] {
  // 1) Initialize final stacks
  const finishingStacks = game.players.map(p => p.stack);
  const winnings = game.players.map(_ => 0);

  // Early returns if we can't distribute yet
  if (game.isComplete || game.pot === 0 || !game.isBettingComplete) {
    return finishingStacks;
  }

  // 3) Identify active (non-folded) players
  const activePlayerIndices = game.players
    .filter(p => !p.isInactive && !p.hasFolded)
    .map(p => p.position);

  // If not all active players have "shown cards," we cannot distribute yet
  const allHaveShown =
    activePlayerIndices.every(i => game.players[i].hasShownCards != null) ||
    activePlayerIndices.length === 1;
  if (!allHaveShown) {
    return finishingStacks;
  }

  const pots = calculatePots(game);
  const totalCalled = pots.filter(p => !p.isUncalled).reduce((sum, p) => sum + p.potSize, 0);

  // Handle uncalled bets
  pots
    .filter(p => p.isUncalled)
    .forEach(uncalledPot => {
      const playerIndex = uncalledPot.contributors[0];
      finishingStacks[playerIndex] += uncalledPot.potSize;
      game.players[playerIndex].returns += uncalledPot.potSize;
    });

  /**
   * STEP D: Apply rake only on the portion that was fully called.
   */
  const everyoneFolded = activePlayerIndices.length === 1;
  const shouldTakeRake = !everyoneFolded && game.street !== 'preflop' && game.board.length > 0;
  const rakeBase = shouldTakeRake ? totalCalled : 0;
  const rake =
    typeof game.rake === 'number'
      ? game.rake // if an explicit amount is provided
      : shouldTakeRake
        ? Math.min(
            game.rakeCap ?? Infinity,
            parseFloat((rakeBase * (game.rakePercentage ?? 0)).toFixed(2))
          )
        : 0;
  game.pot = totalCalled - rake;
  game.rake = rake;

  /**
   * STEP E: Distribute each pot among eligible winners.
   */
  let remainingRake = rake;

  pots
    .filter(p => !p.isUncalled)
    .forEach(thePot => {
      let potSize = thePot.potSize;

      // Among contributors, only non-folded players can win
      const eligible = thePot.contributors.filter(
        c =>
          !game.players[c].hasFolded &&
          game.players[c].hasShownCards !== false &&
          !game.players[c].isInactive
      );

      // Find best hand(s)
      let winners: number[] = [];
      for (const playerIndex of eligible) {
        if (winners.length === 0) {
          winners = [playerIndex];
        } else {
          const cNew = game.players[playerIndex].cards.concat(game.board) as Card[];
          const cWin = game.players[winners[0]].cards.concat(game.board) as Card[];
          const cmp = compare(cNew, cWin);
          if (cmp > 0) {
            winners = [playerIndex];
          } else if (cmp === 0) {
            winners.push(playerIndex);
          }
        }
      }

      // Take proportional rake from this pot
      const potRake = (potSize / totalCalled) * rake;
      potSize -= potRake;
      remainingRake -= potRake;

      // Split pot among winners
      if (winners.length > 0) {
        const share = Math.floor(potSize / winners.length);
        const remainder = potSize % winners.length;

        for (const w of winners) {
          game.players[w].rake += potRake / winners.length;
          finishingStacks[w] += share;
          winnings[w] += share;
        }
        // Give leftover remainder to first winner
        finishingStacks[winners[0]] += remainder;
        winnings[winners[0]] += remainder;
      }
    });

  game.players.forEach(p => {
    p.winnings = winnings[p.position];
    p.stack = finishingStacks[p.position];
  });

  return finishingStacks;
}

export function getCurrentPot(game: Game): Pot | undefined {
  if (!game.isShowdown) {
    return undefined;
  }
  const pots = calculatePots(game);
  return pots.find(
    pot =>
      !pot.isUncalled &&
      pot.contributors.some(
        idx =>
          !game.players[idx].hasFolded &&
          game.players[idx].hasShownCards === null &&
          !game.players[idx].isInactive
      )
  );
}
