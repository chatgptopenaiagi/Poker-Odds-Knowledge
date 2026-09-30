import { seededRandom } from './cards';
import type { Action, Observation } from './game';

export type BotProfile = 'tight-aggressive' | 'loose-passive' | 'balanced-training';
export const BOT_PROFILES: { id: BotProfile; name: string; description: string }[] = [
  { id: 'tight-aggressive', name: 'Tight-aggressive', description: 'Selective preflop; raises more often when its estimated prospects are strong.' },
  { id: 'loose-passive', name: 'Loose-passive', description: 'Enters more pots and favors calling over raising.' },
  { id: 'balanced-training', name: 'Balanced training', description: 'Varied, position-aware practice. This is a heuristic, not a solved strategy.' },
];

/** Policy accepts ONLY an actor observation. Optional equity must use that same information set.
 * The fallback score is a hand/texture heuristic, never presented as showdown equity. */
export function chooseBotAction(observation: Observation, profile: BotProfile = 'balanced-training', seed = 1, equity?: number): Action {
  const o = observation, legal = o.legal;
  if (legal.seat !== o.seat) throw new Error('Bot is not the current actor');
  const random = seededRandom(seed);
  const own = o.seats[o.seat];
  const ranks = o.hole.map(c => Math.floor(c / 4) + 2).sort((a, b) => b - a);
  const pair = ranks[0] === ranks[1];
  const suited = o.hole[0] % 4 === o.hole[1] % 4;
  const positionBonus = o.position === 'button' || o.position === 'late' ? 0.07 : 0;
  let score = (ranks[0] + ranks[1] - 4) / 28 + (pair ? 0.24 : 0) + (suited ? 0.04 : 0) + positionBonus;
  if (o.board.length) {
    const boardRanks = o.board.map(c => Math.floor(c / 4) + 2);
    const matching = ranks.filter(r => boardRanks.includes(r)).length;
    const suitCounts = [0, 1, 2, 3].map(suit => [...o.hole, ...o.board].filter(c => c % 4 === suit).length);
    score = 0.15 + (pair ? 0.18 : 0) + matching * 0.24 + (Math.max(...suitCounts) >= 4 ? 0.17 : 0) + (ranks[0] - 2) / 100 + positionBonus;
  }
  score = Math.min(0.95, score);
  const hasEquity = equity !== undefined && Number.isFinite(equity) && equity >= 0 && equity <= 1;
  const strength = hasEquity ? equity : score;
  const odds = legal.callAmount / Math.max(1, o.pot + legal.callAmount);
  const tight = profile === 'tight-aggressive', passive = profile === 'loose-passive';
  const observedRaises = o.actions.slice(-o.seats.length).filter(a => a.action.type === 'raise').length;
  const pressure = Math.min(0.1, observedRaises * 0.025);
  const stackPressure = legal.callAmount / Math.max(1, own.stack);
  const margin = tight ? 0.06 : passive ? -0.10 : 0;
  const foldThreshold = hasEquity ? odds + margin + pressure : 0.28 + margin + stackPressure * 0.18 + pressure;
  if (legal.callAmount > 0 && strength < foldThreshold && random() > (passive ? 0.18 : 0.05)) return { type: 'fold' };
  const raiseThreshold = hasEquity ? (1 / Math.max(2, o.seats.filter(s => !s.folded).length)) + 0.18 : 0.64;
  const canValueRaise = strength > raiseThreshold;
  const bluff = !passive && o.position === 'button' && legal.callAmount === 0 && random() < 0.07;
  const aggression = passive ? 0.13 : tight ? 0.72 : 0.48;
  if (legal.canRaise && (canValueRaise || bluff) && random() < aggression) {
    const fraction = passive ? 0.4 : tight ? 0.7 : 0.55;
    const affordableTarget = own.streetBet + Math.max(o.bigBlind, Math.round(o.effectiveStack * 0.6));
    const target = Math.max(legal.minRaiseTo, o.currentBet + Math.round((o.pot + legal.callAmount) * fraction));
    const to = legal.shortAllInOnly ? legal.maxRaiseTo : Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, Math.min(target, affordableTarget)));
    return { type: 'raise', to };
  }
  return legal.canCheck ? { type: 'check' } : { type: 'call' };
}
