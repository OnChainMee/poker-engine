import { Game } from '../Game';
import { ACTION_SHOW_MUCK, type Action, type ActionType, type Player, type Street } from '../types';
import { isAwaitingDealer } from './progress';
import { getCurrentPot } from './stacks';
import { isPlayerActive, isPlayerEligibleToAct } from './validation';

/**
 * Extracts specific player index from action (1-based)
 * @param action - The action string containing a player index
 * @returns Player index or undefined if no player index is present
 */
export function getActionPlayerIndex(action: Action): number | undefined {
  const prefix = 'p';
  const prefixIndex = action?.indexOf(prefix);
  if (prefixIndex !== -1) {
    const numberStart = prefixIndex + 1;
    const numberEnd = action.indexOf(' ', numberStart);
    const playerNumber = action.substring(
      numberStart,
      numberEnd === -1 ? action.length : numberEnd
    );
    return parseInt(playerNumber, 10) - 1;
  }
  return undefined;
}

/**
 * Extracts phh action type from action
 * @param action - The action string containing an action type
 * @returns Action type or '?' if no action type is present
 */
export function getActionType(action?: Action): ActionType {
  if (action != null) {
    if (action.startsWith('d ')) {
      return action.substring(
        2,
        action.indexOf(' ', 2) === -1 ? action.length : action.indexOf(' ', 2)
      ) as ActionType;
    } else if (action.startsWith('sm')) {
      return 'sm';
    }
    const spaceIndex = action.indexOf(' ');
    if (spaceIndex !== -1) {
      const typeStart = spaceIndex + 1;
      const typeEnd = action.indexOf(' ', typeStart);
      return action.substring(typeStart, typeEnd === -1 ? action.length : typeEnd) as ActionType;
    }
  }
  return '?';
}

/**
 * Extracts comment from action
 * @param action - The action string containing a comment
 * @returns Comment or undefined if no comment is present
 */
export function getActionComment(action: Action): string | undefined {
  const commentIndex = action.indexOf('#');
  if (commentIndex !== -1) {
    return action.substring(commentIndex + 1);
  }
  return undefined;
}

/**
 * Extracts timestamp from action and its comment
 * @param action - The action string containing a comment
 * @returns Timestamp or undefined if no timestamp is present
 */
export function getActionTimestamp(action: Action, useDefault = true): number | null {
  const comment = getActionComment(action);
  const timestamp = parseInt(comment?.match(/^\d{13}$/)?.[0] ?? '0');
  return timestamp || (useDefault ? Date.now() : null);
}

/**
 * Extracts cards from dealer actions
 * @param action - The action string containing dealer actions
 * @returns Array of cards or undefined if no cards are present
 */
export function getActionCards(action: Action): string[] | undefined {
  const cards = [] as string[];
  const matches = action.match(/(?:d dh p\d+|d db|p\d+ sm) ([A-Z0-9?]{2}(?:[A-Z0-9?]{2})*)/i);
  if (matches) {
    const cardString = matches[1];
    for (let i = 0; i < cardString.length; i += 2) {
      cards.push(cardString.substring(i, i + 2));
    }
  }
  return cards.length ? cards : undefined;
}

/**
 * Extracts amount from action
 * @param action - The action string containing an amount
 * @returns Amount or 0 if no amount is present
 */
export function getActionAmount(action: Action): number {
  const amountString = action.match(/^[^#]+ ([\d.]+)/)?.[1];
  const amount = parseFloat(amountString ?? '0');
  return isNaN(amount) ? 0 : amount;
}

/**
 * Extracts message from a message action
 * @param action - The message action string in format 'p1 m message text #timestamp'
 * @returns Message text or undefined if not a message action
 */
export function getActionMessage(action: Action): string | undefined {
  // Find the last #timestamp pattern to avoid issues with # in message content
  const lastHashIndex = action.lastIndexOf(' #');

  // Check if this is a message action format
  const messageMatch = action.match(/^p\d+ m /);
  if (!messageMatch) return undefined;

  // Extract message content between "p1 m " and " #timestamp"
  const messageStart = messageMatch[0].length;
  const messageContent = action.substring(
    messageStart,
    lastHashIndex == -1 ? undefined : lastHashIndex
  );

  return messageContent;
}

/**
 * Finds next eligible player to act starting from given index.
 * This function ONLY checks player flags and does not deal with betting logic.
 * Returns -1 if no eligible player found.
 *
 * @instructions
 * This function ONLY checks player eligibility based on:
 * 1. Not folded (hasFolded flag)
 * 2. Not all-in (isAllIn flag)
 * 3. Circular search (wraps around table)
 * 4. Stops if full circle made (no eligible found)
 *
 * It does NOT:
 * - Check betting amounts
 * - Handle betting logic
 * - Reset any flags
 * - Deal with positions
 * - Consider street or game state
 *
 * The function relies on:
 * - Player flags being accurate (hasFolded, isAllIn)
 * - Valid startIndex within table size
 * - isPlayerEligibleToAct helper for flag checks
 */
export function getNextEligiblePlayerIndex(
  game: Game,
  startIndex: number,
  checkEligibility = isPlayerEligibleToAct
): number {
  const numPlayers = game.players.length;

  // Condition 1 & 2: Start search from next position
  let pos = (startIndex + 1) % numPlayers;

  // Condition 3: Search circularly until we're back to start
  while (pos !== startIndex) {
    const player = game.players[pos];

    // Check eligibility using helper (not folded, not all-in)
    if (checkEligibility(player)) {
      return pos;
    }

    // Move to next position circularly
    pos = (pos + 1) % numPlayers;
  }

  // Condition 4: No eligible player found after full circle
  return -1;
}

export function getCurrentEligiblePlayerIndex(
  game: Game,
  playerIndex: number,
  checkEligibility = isPlayerEligibleToAct
) {
  if (playerIndex === -1) {
    return -1;
  }
  if (checkEligibility(game.players[playerIndex])) {
    return playerIndex;
  }
  return getNextEligiblePlayerIndex(game, playerIndex, checkEligibility);
}

/**
 * @instructions
 * Returns the theoretical first player to act for a given street based ONLY on positions.
 * This function ignores current betting state, folded status, or all-in status.
 * For preflop:
 *   - In heads-up: BTN/SB acts first
 *   - In ring game: UTG (next after BB) acts first
 * For postflop streets: first position after button.
 */
export function findFirstToActForStreet(game: Game, street: Street): number {
  const isHeadsUp = getCurrentPlayerIndexs(game).length === 2;

  if (street === 'preflop') {
    // In heads-up, BTN/SB acts first
    if (isHeadsUp) {
      return game.buttonIndex;
    }

    // In ring games, UTG (next after BB) acts first
    const bigBlindIndex = game.bigBlindIndex;
    return (bigBlindIndex + 1) % game.players.length;
  }

  // For postflop streets, first position after button
  return (game.buttonIndex + 1) % game.players.length;
}

/**
 * Determines the index of the next player to act. It returns -1 if no player can act.
 *
 * The function handles different game states:
 * - **Betting Rounds:** It identifies the next eligible player to act based on the last action
 *   or the start of a new street. Eligibility is determined by whether a player is active (not
 *   folded or all-in).
 * - **Showdown:** It identifies which player is next to show their cards.
 *   - It prioritizes the last aggressor if they are eligible to win the current pot.
 *   - Otherwise, it proceeds in turn from the first player to act on that street.
 *   - Eligibility is determined by who is a contributor to the current pot being contested.
 *
 * The function relies on the game state (like `isComplete`, `lastPlayerAction`, and player
 * statuses) being accurate.
 */
export function getCurrentPlayerIndex(game: Game): number {
  // Pre-conditions for no one to act.
  if (game.isComplete || isAwaitingDealer(game)) {
    return -1;
  }

  const currentPot = getCurrentPot(game);

  const isEligibleToShow = (p: Player) =>
    currentPot
      ? currentPot.contributors.includes(p.position) &&
        !p.hasFolded &&
        !p.isInactive &&
        p.hasShownCards === null
      : isPlayerEligibleToAct(p);

  if (currentPot) {
    // First person to show for this pot (last aggressor rule)
    const lastAggressor = getActionPlayerIndex(game.lastBetAction || '');
    if (lastAggressor !== undefined && isEligibleToShow(game.players[lastAggressor])) {
      return lastAggressor;
    }
  }

  if (
    !game.lastPlayerAction ||
    (getActionType(game.lastPlayerAction) !== ACTION_SHOW_MUCK && game.isShowdown)
  ) {
    // New street
    return getCurrentEligiblePlayerIndex(
      game,
      findFirstToActForStreet(game, game.street),
      isEligibleToShow
    );
  } else {
    // After last action
    return getNextEligiblePlayerIndex(
      game,
      getActionPlayerIndex(game.lastPlayerAction)!,
      isEligibleToShow
    );
  }
}

export function getRemainingPlayers(game: Game): Player[] {
  return getCurrentPlayerIndexs(game).filter(p => !p.hasFolded);
}

export function getCurrentPlayerIndexs(game: Game): Player[] {
  return game.players.filter(p => !p.isInactive);
}

/**
 * Determines if playerIndex has position (acts after) targetIndex on the current street.
 * Uses the acting order of players who can still act (not folded, not all-in),
 * starting from the street's first-to-act seat.
 */
export function isPlayerInPosition(game: Game, playerIndex: number, targetIndex: number): boolean {
  if (playerIndex === targetIndex) return false;

  // Build eligible order for projected post-flop order
  const start = (game.buttonIndex + 1) % game.players.length;
  const n = game.players.length;

  const order: number[] = [];
  for (let i = 0; i < n; i++) {
    const seat = (start + i) % n;
    if (isPlayerActive(game.players[seat])) order.push(seat);
  }
  // Later index in the street order = in position
  return order.indexOf(playerIndex) > order.indexOf(targetIndex);
}

/**
 * True iff playerIndex is the last eligible actor on the current street.
 * (Eligible = not folded, not all-in.)
 */
export function isLastToAct(game: Game, playerIndex: number): boolean {
  // Build eligible order for projected post-flop order
  const start = (game.buttonIndex + 1) % game.players.length;
  const n = game.players.length;

  let lastEligible = -1;
  for (let i = 0; i < n; i++) {
    const seat = (start + i) % n;
    if (isPlayerActive(game.players[seat])) lastEligible = seat;
  }

  return playerIndex === lastEligible && lastEligible !== -1;
}

/**
 * Determines the button position based on blinds structure.
 * In heads-up, button is SB. Otherwise, button is one position before SB.
 */
export function getButtonIndex(players: number, blinds: number[]): number {
  const sbIndex = blinds.indexOf(Math.min(...blinds.filter(b => b > 0)));
  if (players === 2) {
    // In heads-up, button is SB position, but also the first actor preflop
    return (sbIndex + 1) % players;
  }
  // Find SB position (smallest non-zero blind)
  if (sbIndex === -1) return 0;

  // Button is one position before SB
  return (sbIndex - 1 + players) % players;
}
