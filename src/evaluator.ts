import { assertCards } from './cards';

export const EVALUATOR_VERSION = 'hil-direct-rank-1.0.0';
export const HAND_CATEGORIES = ['High card', 'One pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush'] as const;
const BASE = 15 ** 5;
function encode(category: number, ranks: number[]): number {
  let score = category * BASE;
  for (let i = 0; i < 5; i++) score += (ranks[i] ?? 0) * 15 ** (4 - i);
  return score;
}
function straight(mask: number): number {
  for (let high = 14; high >= 6; high--) if (((mask >>> (high - 4)) & 31) === 31) return high;
  return (mask & ((1 << 14) | (1 << 5) | (1 << 4) | (1 << 3) | (1 << 2))) === ((1 << 14) | 60) ? 5 : 0;
}
/** Original direct evaluator: no lookup database; best five of five through seven cards. */
export function evaluate(cards: readonly number[]): number {
  assertCards(cards);
  if (cards.length < 5 || cards.length > 7) throw new Error('Evaluation requires five through seven cards.');
  return evaluateUnchecked(cards);
}
/** Internal hot path: caller has already validated cards and removed collisions. */
export function evaluateUnchecked(cards: readonly number[]): number {
  const counts = new Uint8Array(15);
  const suitCounts = [0, 0, 0, 0], suitMasks = [0, 0, 0, 0];
  let mask = 0;
  for (const c of cards) { const r = Math.floor(c / 4) + 2, s = c % 4; counts[r]++; suitCounts[s]++; suitMasks[s] |= 1 << r; mask |= 1 << r; }
  const flushSuit = suitCounts.findIndex(n => n >= 5);
  if (flushSuit >= 0) { const top = straight(suitMasks[flushSuit]); if (top) return encode(8, [top]); }
  const groups: number[][] = [[], [], [], [], []];
  for (let r = 14; r >= 2; r--) if (counts[r]) groups[counts[r]].push(r);
  const highestExcept = (exclude: number[], n: number) => {
    const ranks: number[] = [];
    for (let r = 14; r >= 2 && ranks.length < n; r--) if (counts[r] && !exclude.includes(r)) ranks.push(r);
    return ranks;
  };
  if (groups[4].length) return encode(7, [groups[4][0], ...highestExcept([groups[4][0]], 1)]);
  if (groups[3].length && (groups[2].length || groups[3].length > 1)) return encode(6, [groups[3][0], Math.max(groups[2][0] ?? 0, groups[3][1] ?? 0)]);
  if (flushSuit >= 0) { const ranks: number[] = []; for (let r = 14; r >= 2; r--) if (suitMasks[flushSuit] & (1 << r)) ranks.push(r); return encode(5, ranks.slice(0, 5)); }
  const top = straight(mask); if (top) return encode(4, [top]);
  if (groups[3].length) return encode(3, [groups[3][0], ...highestExcept([groups[3][0]], 2)]);
  if (groups[2].length >= 2) return encode(2, [...groups[2].slice(0, 2), ...highestExcept(groups[2].slice(0, 2), 1)]);
  if (groups[2].length) return encode(1, [groups[2][0], ...highestExcept([groups[2][0]], 3)]);
  return encode(0, groups[1].slice(0, 5));
}
export function handCategory(score: number): string { return HAND_CATEGORIES[Math.floor(score / BASE)] ?? 'Unknown'; }
/** Independent straightforward five-card reference, separate classification algorithm. */
export function referenceFive(cards: readonly number[]): number {
  assertCards(cards, 5);
  const ranks = cards.map(c => Math.floor(c / 4) + 2).sort((a, b) => b - a);
  const frequencies = new Map<number, number>();
  for (const rank of ranks) frequencies.set(rank, (frequencies.get(rank) ?? 0) + 1);
  const sorted = [...frequencies].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const pattern = sorted.map(item => item[1]).join('');
  const flush = cards.every(c => c % 4 === cards[0] % 4);
  const unique = [...new Set(ranks)];
  const straightHigh = unique.length === 5 && unique[0] - unique[4] === 4 ? unique[0] : unique.join(',') === '14,5,4,3,2' ? 5 : 0;
  let category = 0, ordered = ranks;
  if (flush && straightHigh) { category = 8; ordered = [straightHigh]; }
  else if (pattern === '41') { category = 7; ordered = sorted.map(g => g[0]); }
  else if (pattern === '32') { category = 6; ordered = sorted.map(g => g[0]); }
  else if (flush) category = 5;
  else if (straightHigh) { category = 4; ordered = [straightHigh]; }
  else if (pattern === '311') { category = 3; ordered = sorted.map(g => g[0]); }
  else if (pattern === '221') { category = 2; ordered = sorted.map(g => g[0]); }
  else if (pattern === '2111') { category = 1; ordered = sorted.map(g => g[0]); }
  // Independent positional encoding (same public ordering contract).
  return [category, ...ordered, 0, 0, 0, 0, 0].slice(0, 6).reduce((n, digit) => n * 15 + digit, 0);
}
export function referenceEvaluate(cards: readonly number[]): number {
  assertCards(cards);
  if (cards.length < 5 || cards.length > 7) throw new Error('Evaluation requires five through seven cards.');
  let best = -1;
  for (let a = 0; a < cards.length - 4; a++) for (let b = a + 1; b < cards.length - 3; b++) for (let c = b + 1; c < cards.length - 2; c++) for (let d = c + 1; d < cards.length - 1; d++) for (let e = d + 1; e < cards.length; e++) best = Math.max(best, referenceFive([cards[a], cards[b], cards[c], cards[d], cards[e]]));
  return best;
}
