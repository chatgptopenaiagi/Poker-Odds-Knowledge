import { assertCards, seededRandom } from './cards';
import { EVALUATOR_VERSION, evaluateUnchecked } from './evaluator';
import { type WeightedCombo } from './ranges';

export interface EquityOpponent { hand?: number[]; range?: WeightedCombo[] }
export interface EquityPot { id: string; amount: number; eligible: number[] }
export interface EquityRequest {
  hero: number[]; board: number[]; dead?: number[]; opponents: EquityOpponent[];
  method?: 'auto' | 'exact' | 'monte-carlo'; samples?: number; seed?: number; pots?: EquityPot[];
}
export interface EquityProgress { completed: number; target: number; attempts: number }
export interface EquityResult {
  method: 'EXACT ENUMERATION' | 'MONTE CARLO ESTIMATE'; equity: number; win: number; tie: number; loss: number;
  samples: number; evaluatedWeight: number; interval: [number, number]; confidence: number | null;
  seed: number; attempts: number; elapsedMs: number; engineVersion: string; inputs: EquityRequest;
  knownCards: number[]; rangeCombinationCounts: number[]; units: string; limitations: string[];
  perPot: { id: string; heroShare: number; expectedChips: number; interval: [number, number] }[];
}
export const EQUITY_VERSION = 'hil-equity-1.0.0/' + EVALUATOR_VERSION;
const EXACT_LIMIT = 250_000;
export function choose(n: number, k: number): number {
  if (k < 0 || n < k) return 0;
  let result = 1;
  for (let i = 1; i <= Math.min(k, n - k); i++) result = result * (n - i + 1) / i;
  return Math.round(result);
}
function prepare(request: EquityRequest) {
  if (request.method !== undefined && !['auto', 'exact', 'monte-carlo'].includes(request.method)) throw new Error('Unknown equity method.');
  assertCards(request.hero, 2);
  if (![0, 3, 4, 5].includes(request.board.length)) throw new Error('The board must contain zero, three, four or five cards.');
  const known = [...request.hero, ...request.board, ...(request.dead ?? [])];
  assertCards(known);
  if (!Array.isArray(request.opponents) || request.opponents.length < 1 || request.opponents.length > 5) throw new Error('Choose one through five opponents.');
  const blocked = new Set(known);
  const ranges = request.opponents.map(opponent => {
    if (Boolean(opponent.hand) === Boolean(opponent.range)) throw new Error('Each opponent needs exactly one fixed hand or range.');
    if (opponent.hand) assertCards(opponent.hand, 2);
    const source = opponent.hand ? [{ cards: opponent.hand as [number, number], weight: 1 }] : opponent.range!;
    if (source.length > 1326) throw new Error('A range cannot exceed 1326 combinations.');
    const seen = new Set<string>();
    const range = source.filter(combo => {
      assertCards(combo.cards, 2);
      if (!Number.isFinite(combo.weight) || combo.weight < 0 || combo.weight > 1) throw new Error('Range weights must be finite values between zero and one.');
      const key = [...combo.cards].sort((a, b) => a - b).join(',');
      if (seen.has(key)) throw new Error('Duplicate concrete combination in a range.');
      seen.add(key);
      return combo.weight > 0 && !combo.cards.some(c => blocked.has(c));
    });
    if (!range.length) throw new Error('An opponent range is empty or conflicts with known cards.');
    // Per-seat scale cancels under joint conditioning; normalize to avoid all-small underflow.
    const scale = Math.max(...range.map(combo => combo.weight));
    return range.map(combo => ({ cards: combo.cards, weight: combo.weight / scale }));
  });
  const remaining = 52 - known.length - 2 * ranges.length;
  if (remaining < 5 - request.board.length) throw new Error('Not enough cards remain to complete the board.');
  for (const pot of request.pots ?? []) {
    if (!Number.isSafeInteger(pot.amount) || pot.amount < 0 || !pot.id || !pot.eligible.length || new Set(pot.eligible).size !== pot.eligible.length || pot.eligible.some(i => !Number.isInteger(i) || i < 0 || i > ranges.length)) throw new Error('Invalid pot amount or eligibility list.');
  }
  if (new Set((request.pots ?? []).map(p => p.id)).size !== (request.pots?.length ?? 0)) throw new Error('Pot IDs must be unique.');
  return { known, ranges, estimate: ranges.reduce((n, range) => n * range.length, 1) * choose(remaining, 5 - request.board.length) };
}
/** Cheap structural/card/range validation without doing equity work. */
export function validateEquityRequest(request: EquityRequest): void {
  prepare(request);
  if (request.samples !== undefined && (!Number.isInteger(request.samples) || request.samples < 100 || request.samples > 200_000)) throw new Error('Sample budget must be an integer from 100 to 200000.');
  if (request.seed !== undefined && (!Number.isSafeInteger(request.seed) || request.seed < 0 || request.seed > 4294967295)) throw new Error('Seed must be an unsigned 32-bit integer.');
}
function* assignments(ranges: WeightedCombo[][], known: number[], index = 0, hands: number[][] = [], weight = 1): Generator<{ hands: number[][]; used: Set<number>; weight: number }> {
  const used = new Set([...known, ...hands.flat()]);
  if (index === ranges.length) { yield { hands, used, weight }; return; }
  for (const combo of ranges[index]) if (!combo.cards.some(c => used.has(c))) yield* assignments(ranges, known, index + 1, [...hands, combo.cards], weight * combo.weight);
}
function* combinations(values: number[], count: number, start = 0, selected: number[] = []): Generator<number[]> {
  if (!count) { yield selected; return; }
  for (let i = start; i <= values.length - count; i++) yield* combinations(values, count - 1, i + 1, [...selected, values[i]]);
}
function picker(range: WeightedCombo[]) {
  let total = 0;
  const cumulative = range.map(combo => total += combo.weight);
  return (random: () => number) => {
    const threshold = random() * total;
    let lo = 0, hi = cumulative.length - 1;
    while (lo < hi) { const middle = (lo + hi) >>> 1; if (threshold < cumulative[middle]) hi = middle; else lo = middle + 1; }
    return range[lo].cards;
  };
}
/** Generator chunks permit worker progress/cancellation; no full game/deck secrets accepted. */
export function* equitySteps(request: EquityRequest, evaluator: (cards: number[]) => number = evaluateUnchecked): Generator<EquityProgress, EquityResult> {
  const started = performance.now();
  const { known, ranges, estimate } = prepare(request);
  const exact = request.method === 'exact' || (request.method !== 'monte-carlo' && estimate <= EXACT_LIMIT);
  if (exact && estimate > EXACT_LIMIT) throw new Error(`Exact upper bound ${estimate} exceeds the bounded ${EXACT_LIMIT} evaluation limit. Select Monte Carlo.`);
  const requestedSamples = request.samples ?? 10_000;
  if (!exact && (!Number.isInteger(requestedSamples) || requestedSamples < 100 || requestedSamples > 200_000)) throw new Error('Monte Carlo sample budget must be an integer from 100 to 200000.');
  const seed = request.seed ?? 20260930;
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 4294967295) throw new Error('Seed must be an unsigned 32-bit integer.');
  const random = seededRandom(seed);
  let samples = 0, attempts = 0, totalWeight = 0, shares = 0, wins = 0, ties = 0, losses = 0;
  const potShares = (request.pots ?? []).map(() => 0);
  const accumulate = (hands: number[][], runout: number[], weight: number) => {
    const board = [...request.board, ...runout];
    const scores = [request.hero, ...hands].map(hand => evaluator([...hand, ...board]));
    const maximum = Math.max(...scores), winnerCount = scores.filter(n => n === maximum).length;
    const share = scores[0] === maximum ? 1 / winnerCount : 0;
    samples++; totalWeight += weight; shares += share * weight;
    if (!share) losses += weight; else if (winnerCount > 1) ties += weight; else wins += weight;
    (request.pots ?? []).forEach((pot, i) => {
      const best = Math.max(...pot.eligible.map(p => scores[p]));
      const count = pot.eligible.filter(p => scores[p] === best).length;
      if (pot.eligible.includes(0) && scores[0] === best) potShares[i] += weight / count;
    });
  };
  const missing = 5 - request.board.length;
  if (exact) {
    for (const assignment of assignments(ranges, known)) {
      const deck = Array.from({ length: 52 }, (_, i) => i).filter(c => !assignment.used.has(c));
      for (const runout of combinations(deck, missing)) {
        attempts++; accumulate(assignment.hands, runout, assignment.weight);
        if (samples % 256 === 0) yield { completed: samples, target: estimate, attempts };
      }
    }
    if (!samples) throw new Error('The opponent ranges have no mutually compatible assignments.');
  } else {
    const pickers = ranges.map(picker);
    const maxAttempts = Math.min(2_000_000, Math.max(20_000, requestedSamples * 200));
    while (samples < requestedSamples && attempts < maxAttempts) {
      attempts++;
      // Draw each full assignment independently from the original weighted ranges.
      // Reject the entire assignment on collision: never renormalize later seats.
      const hands = pickers.map(pick => pick(random));
      const allCards = [...known, ...hands.flat()];
      const used = new Set(allCards);
      if (used.size === allCards.length) {
        const deck = Array.from({ length: 52 }, (_, i) => i).filter(c => !used.has(c));
        for (let i = 0; i < missing; i++) { const j = i + Math.floor(random() * (deck.length - i)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
        accumulate(hands, deck.slice(0, missing), 1);
      }
      if (attempts % 256 === 0) yield { completed: samples, target: requestedSamples, attempts };
    }
    if (samples < requestedSamples) throw new Error(`Could not obtain the fixed ${requestedSamples} samples in ${maxAttempts} assignment attempts (${samples} compatible). Ranges may be impossible or inefficient; narrow them or use an exact tractable scenario.`);
  }
  if (!(totalWeight > 0) || !Number.isFinite(totalWeight)) throw new Error('Compatible range weights exceed floating-point precision: the total enumerated weight is zero or nonfinite. Increase the relative weights of compatible combinations or use less extreme ranges. No equity result was produced.');
  const equity = shares / totalWeight;
  // Bounded fractional outcomes X in [0,1]: fixed-N two-sided Hoeffding at 95%.
  const error = exact ? 0 : Math.sqrt(Math.log(40) / (2 * samples));
  const interval = (share: number): [number, number] => [Math.max(0, share - error), Math.min(1, share + error)];
  const limitations = [
    'Conditional on the supplied hands, range weights, known board and explicit dead cards. Hidden simulation cards are not dead cards.',
    'Equity is expected fractional showdown pot share; it does not solve multistreet strategy or include future fold equity.',
    exact ? 'Every compatible weighted assignment and unordered runout was enumerated; arithmetic uses IEEE-754 floating point.' : 'Fixed-budget independent whole-assignment rejection sampling; 95% Hoeffding interval applies to bounded fractional shares at the stated completed sample count, not optional stopping.',
    'Win means sole winner; tie means hero shares first place; loss means hero is not a winner. These statistics refer to the common pot; consult each side pot separately.',
  ];
  return {
    method: exact ? 'EXACT ENUMERATION' : 'MONTE CARLO ESTIMATE', equity, win: wins / totalWeight, tie: ties / totalWeight, loss: losses / totalWeight,
    samples, evaluatedWeight: totalWeight, interval: interval(equity), confidence: exact ? null : 0.95,
    seed, attempts, elapsedMs: performance.now() - started, engineVersion: EQUITY_VERSION,
    inputs: structuredClone({ hero: request.hero, board: request.board, dead: request.dead, opponents: request.opponents, method: request.method, samples: request.samples, seed: request.seed, pots: request.pots }), knownCards: known, rangeCombinationCounts: ranges.map(r => r.length), units: 'pot share (0..1); expectedChips in play-chip units', limitations,
    perPot: (request.pots ?? []).map((pot, i) => ({ id: pot.id, heroShare: potShares[i] / totalWeight, expectedChips: pot.amount * potShares[i] / totalWeight, interval: interval(potShares[i] / totalWeight) })),
  };
}
export function calculateEquity(request: EquityRequest, evaluator: (cards: number[]) => number = evaluateUnchecked): EquityResult {
  const iterator = equitySteps(request, evaluator);
  let step = iterator.next();
  while (!step.done) step = iterator.next();
  return step.value;
}
export async function calculateEquityAsync(request: EquityRequest, onProgress: (progress: EquityProgress) => void = () => {}, cancelled: () => boolean = () => false, evaluator: (cards: number[]) => number = evaluateUnchecked): Promise<EquityResult> {
  const iterator = equitySteps(request, evaluator);
  while (true) {
    if (cancelled()) throw new Error('Calculation cancelled.');
    const step = iterator.next();
    if (step.done) { onProgress({ completed: step.value.samples, target: step.value.samples, attempts: step.value.attempts }); return step.value; }
    onProgress(step.value);
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
