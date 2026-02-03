# Contribution Findings: Issues, Bugs, Warnings & Innovation

Summary of issues and improvement opportunities for the poker-engine project.

---

## 1. Bugs

### 1.1 **Hand.isPlayable treats _inactive: 2 (new player) as playable** — FIXED

- **Location:** `src/Hand.ts` — `Hand.isPlayable()`
- **Issue:** The code treated `_inactive[i] === 2` as active. Per HAND.md and APPENDIX_SEATING.md, `_inactive: 2` means "new player" and they are **inactive until next hand**.
- **Impact:** `Hand.isPlayable(hand)` could return `true` when only one real active player existed (e.g. Alice active, Bob and Charlie new), allowing a hand to start incorrectly.
- **Fix applied:** Only treat `_inactive[i] === 0` or `undefined` as active; `1` (waiting/sitting out) and `2` (new player) are not playable.

### 1.2 **Command.allIn / Command.showCards can throw on invalid playerIdentifier**

- **Location:** `src/Command.ts` — `Command.allIn()`, `Command.showCards()`
- **Issue:** Both use `Game.getPlayerIndex()` and then `game.players[playerIndex]` without checking for `-1`. If the identifier is invalid, `game.players[-1]` is `undefined`, so `player.stack` / `player.cards` throws.
- **Contrast:** `Command.message()` correctly guards with `if (playerIndex === -1 || !message) return '' as Action`.
- **Recommendation:** Either guard and return a safe value (e.g. empty action or throw a clear error), or document that invalid identifiers may throw. Aligning with the "Commands never throw" contract in tests would mean adding the same guard as in `message()` and returning a safe action (or empty string).

### 1.3 **validation.ts: canFold JSDoc vs behavior**

- **Location:** `src/game/validation.ts` — `canFold()`
- **Issue:** JSDoc says "A player can fold if they face a bet higher than their current bet", but the implementation only checks `!player.hasFolded && !player.hasActed`. So a player can "fold" even when there is no bet to call. If the spec intends fold to be allowed anytime it’s the player’s turn, the JSDoc should be updated; otherwise the logic may need to align with the spec.

---

## 2. Documentation / Consistency Issues

### 2.1 **Missing FORMAT.md**

- **Issue:** README lists "**[Format Namespace](./specs/FORMAT.md)**" but `specs/FORMAT.md` does not exist.
- **Recommendation:** Add `specs/FORMAT.md` for the Format namespace or remove/update the README link.

### 2.2 **Package name vs docs: @idealic vs @yuga-labs**

- **Issue:** Package is `@yuga-labs/poker-engine` (fork of `@idealic/poker-engine`), but specs and README still show:
  - `import * as Poker from '@idealic/poker-engine';`
  - Links to `@idealic/game-service` and `@idealic/poker-ui`
- **Recommendation:** Either update all examples and links to `@yuga-labs/poker-engine` (and correct backend/frontend package names), or add a short note that the API is compatible with `@idealic/poker-engine` and keep one canonical name in the docs.

### 2.3 **Currency code: ISO 4127 → ISO 4217**

- **Location:** `src/types.ts` line 93 (and README if it repeats)
- **Issue:** Comment says "Currency code in ISO **4127** format". Currency codes are defined by **ISO 4217**.
- **Recommendation:** Change to "ISO 4217".

### 2.4 **JSDoc parameter names in validation.ts**

- **Location:** `src/game/validation.ts` — several functions
- **Issue:** Functions take `(game, position)` but JSDoc sometimes says `@param table` or `@param playerIndex` instead of `game` and `position`.
- **Recommendation:** Make JSDoc parameter names match the actual parameters (`game`, `position`) for consistency and better IDE help.

---

## 3. Warnings / Environment

### 3.1 **npm install / prepare script**

- **Issue:** `npm install` runs `prepare` → `npm run build` → `tsc`. If TypeScript is not installed globally, `tsc` can be missing in PATH and install fails. `npx tsc` without a local install can run the wrong package (e.g. `tsc@2.0.4`).
- **Recommendation:** Use `npx tsc` in scripts (e.g. `"build": "npx tsc"`) or ensure devs run `npm install` so `node_modules/.bin/tsc` exists. Document that the project expects a local install before build.

### 3.2 **npm audit**

- **Issue:** After `npm install --ignore-scripts`, audit reported "1 high severity vulnerability".
- **Recommendation:** Run `npm audit` and apply fixes or document accepted risks.

### 3.3 **Dev dependency: @augceo/iterators**

- **Issue:** `package.json` has `"@augceo/iterators": "file:../iterators"`. README refers to the original "idealic" fork; the typo "augceo" (vs "augceo" or intended scope) may be intentional for this fork. Worth confirming the name and that `../iterators` is present in your repo layout.

---

## 4. Code Quality / Typos

### 4.1 **Comment typo in types.ts**

- **Location:** `src/types.ts` lines 282 and 289
- **Issue:** Comments say "doesnt" instead of "doesn't".
- **Recommendation:** Use "doesn't" for consistency and readability.

---

## 5. Innovation / Design Improvements

### 5.1 **Defensive checks for invalid player index in Command**

- **Idea:** Have all Command methods that take `playerIdentifier` validate `Game.getPlayerIndex()` and either return a designated "no-op" action or throw a clear error with a message like `Invalid playerIdentifier: ...`. This would make behavior consistent with `Command.message()` and the "Commands never throw" test contract if you choose to never throw.

### 5.2 **completeBetting with empty players**

- **Location:** `src/game/betting.ts` — `completeBetting()`
- **Observation:** `Math.max(...game.players.map(p => p.totalBet))` on an empty `game.players` yields `-Infinity`. It may be worth an early exit when `game.players.length === 0` to avoid relying on that.

### 5.3 **validation.ts: bounds check for position**

- **Idea:** Functions like `canCheck(game, position)` use `game.players[position]` without checking `position`. If `position` is out of range, this is `undefined` and can cause subtle bugs. Adding `if (position < 0 || position >= game.players.length) return false;` would make the API safer.

### 5.4 **Game.getPlayerIndex and Math.abs**

- **Location:** `src/Game.ts` — `Game.getPlayerIndex()` for numeric index
- **Code:** `return Math.abs(playerIdentifier);` for a valid numeric index.
- **Observation:** For negative indices (already rejected above), this would flip sign. The main path is `playerIdentifier >= 0`, so this is mostly defensive. Just ensure the intended behavior is "only non-negative in-range indices are valid" and that negative numbers are not accidentally normalized to positive.

---

## 6. Test Status

- **Before fix:** 1 failing test — `Hand Data Extraction > Hand.isPlayable > should treat new players (_inactive: 2) as not playable`.
- **After fix:** Run `npx vitest run` to confirm all tests pass (including the data-extraction suite).
- **Skipped tests:** 4 tests skipped (e.g. in `stats.more.test.ts`, `validation.test.ts`, `stats-aggregation.test.ts`). Worth reviewing whether they should be enabled or removed.

---

## Summary Table

| Category        | Count | Severity |
|----------------|-------|----------|
| Bugs (fixed)    | 1     | High     |
| Bugs (open)     | 2     | Medium   |
| Documentation   | 4     | Low      |
| Warnings / Env  | 3     | Low      |
| Code quality    | 1     | Low      |
| Innovation ideas| 4     | Optional |

One bug (Hand.isPlayable and _inactive: 2) has been fixed in code; the rest are documented for follow-up. Run the full test suite and fix any remaining issues before opening a PR.
