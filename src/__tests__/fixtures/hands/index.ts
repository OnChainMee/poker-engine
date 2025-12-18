import { fixture as basicHandWithShowdown } from './01-basic-hand-with-showdown';
import { fixture as preflopRaiseAndTurnBet } from './02-preflop-raise-and-turn-bet';
import { fixture as multiplePlayersPositionChanges } from './03-multiple-players-position-changes';
import { fixture as flushVsPairShowdown } from './04-flush-vs-pair-showdown';
import { fixture as pairOfAcesShowdown } from './05-pair-of-aces-showdown';
import { fixture as smallTurnBetTakesItDown } from './06-small-turn-bet-takes-it-down';
import { fixture as preflopRaiseAndFlopFold } from './07-preflop-raise-and-flop-fold';
import { fixture as turnBetRiverCheckDown } from './08-turn-bet-river-check-down';
import { fixture as threeDiamondFlopQuickFold } from './09-three-diamond-flop-quick-fold';
import { fixture as flushDrawCompletion } from './10-flush-draw-completion';
import { fixture as turnBetTakesItDown } from './11-turn-bet-takes-it-down';
import { fixture as checkRaiseOnPairedBoard } from './12-check-raise-on-paired-board';
import { fixture as multiWayPotNoBetting } from './13-multi-way-pot-no-betting';
import { fixture as aggressivePlayWithAllInBluff } from './14-aggressive-play-with-all-in-bluff';
import { fixture as usdGame } from './15-usd-game';
import { fixture as sittingOut } from './16-sitting-out';
import { fixture as allInShowdown } from './17-all-in-showdown';
import { fixture as sittingOutWithShowdown } from './18-sitting-out-with-showdown';
import { fixture as headsUpThreeOfKind } from './19-heads-up-three-of-kind';
import { fixture as preflopRaiseUncalled } from './20-preflop-raise-uncalled';
import { fixture as sittingOutWithExtraBlind } from './21-sitting-out-with-extra-blind';
import { fixture as straightVsStraightWithCashout } from './22-straight-vs-straight-with-cashout';
import { fixture as splitPotWithAntes } from './23-split-pot-with-antes';
import { fixture as splitPotWithExtraBlind } from './24-split-pot-with-extra-blind';
import { fixture as quadsOnBoardMuck } from './25-quads-on-board-muck';
//import { fixture as doubleCheckError } from './26-double-check-error';
import { fixture as quadsOnBoardShowdown } from './27-quads-on-board-showdown';
import { fixture as cashOutWithShowdown } from './28-cash-out-with-showdown';
//import { fixture as timeoutFoldRiver } from './29-timeout-fold-river';
//import { fixture as flopBetUncalled } from './30-flop-bet-uncalled';
import { fixture as preflopEveryoneFolds } from './31-preflop-everyone-folds';
import { HandFixture } from '../testHandFixture';

export const fixtures: HandFixture[] = [
  basicHandWithShowdown,
  preflopRaiseAndTurnBet,
  multiplePlayersPositionChanges,
  flushVsPairShowdown,
  pairOfAcesShowdown,
  smallTurnBetTakesItDown,
  preflopRaiseAndFlopFold,
  turnBetRiverCheckDown,
  threeDiamondFlopQuickFold,
  flushDrawCompletion,
  turnBetTakesItDown,
  checkRaiseOnPairedBoard,
  multiWayPotNoBetting,
  aggressivePlayWithAllInBluff,
  usdGame,
  sittingOut,
  allInShowdown,
  sittingOutWithShowdown,
  headsUpThreeOfKind,
  preflopRaiseUncalled,
  sittingOutWithExtraBlind,
  straightVsStraightWithCashout,
  splitPotWithAntes,
  splitPotWithExtraBlind,
  quadsOnBoardMuck,
  //doubleCheckError,
  quadsOnBoardShowdown,
  cashOutWithShowdown,
  //timeoutFoldRiver,
  //flopBetUncalled,
  preflopEveryoneFolds,
];
