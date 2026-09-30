import { assertCards, cardText, parseCards, RANKS } from './cards';
export interface WeightedCombo { cards: [number, number]; weight: number }
const descending = [...RANKS].reverse();
export function matrixLabels(): string[] {
  return descending.flatMap((row, r) => descending.map((col, c) => r === c ? row + col : r < c ? row + col + 's' : col + row + 'o'));
}
export function rangeForCell(label: string, weight = 1): WeightedCombo[] {
  if (!Number.isFinite(weight) || weight < 0 || weight > 1) throw new Error('Weights must be between 0 and 1.');
  const match = /^([2-9TJQKA])([2-9TJQKA])([so]?)$/.exec(label.toUpperCase().replace(/S$/, 's').replace(/O$/, 'o'));
  if (!match) throw new Error(`Invalid range cell: ${label}`);
  const a = RANKS.indexOf(match[1]), b = RANKS.indexOf(match[2]), kind = match[3];
  if (a === b && kind) throw new Error('Pairs have no suitedness suffix.');
  const result: WeightedCombo[] = [];
  for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) {
    if (a === b && x >= y) continue;
    if (a !== b && ((kind === 's' && x !== y) || (kind === 'o' && x === y))) continue;
    if (weight > 0) result.push({ cards: [a * 4 + x, b * 4 + y].sort((m, n) => m - n) as [number, number], weight });
  }
  return result;
}
export function rangeFromWeights(weights: Record<string, number>, blocked: number[] = []): WeightedCombo[] {
  assertCards(blocked);
  return merge(Object.entries(weights).flatMap(([cell, weight]) => rangeForCell(cell, weight)), blocked);
}
function merge(combos: WeightedCombo[], blocked: number[]): WeightedCombo[] {
  const excluded = new Set(blocked), byKey = new Map<string, WeightedCombo>();
  for (const combo of combos) {
    if (combo.cards.some(c => excluded.has(c))) continue;
    const key = [...combo.cards].sort((a, b) => a - b).join(',');
    if (combo.weight > (byKey.get(key)?.weight ?? 0)) byKey.set(key, combo);
  }
  return [...byKey.values()];
}
/** Tokens separated by commas/space; overlap takes maximum weight, not sum. */
export function expandRange(notation: string, blocked: number[] = []): WeightedCombo[] {
  assertCards(blocked);
  const combos: WeightedCombo[] = [];
  const normalized = notation.trim().replace(/^([2-9TJQKA][cdhs])\s+([2-9TJQKA][cdhs])((?::[^\s]+)?)$/i, '$1$2$3');
  for (const token of normalized.split(/[\s,]+/).filter(Boolean)) {
    const parts = token.split(':');
    if (parts.length > 2) throw new Error('A range token has at most one weight.');
    const raw = parts[0], percent = parts[1]?.endsWith('%');
    const weight = parts[1] === undefined ? 1 : Number(percent ? parts[1].slice(0, -1) : parts[1]) / (percent ? 100 : 1);
    if (!Number.isFinite(weight) || weight < 0 || weight > 1) throw new Error('Use weights 0..1 or 0%..100%.');
    if (raw.toLowerCase() === 'random' || raw === '*') { combos.push(...matrixLabels().flatMap(c => rangeForCell(c, weight))); continue; }
    if (/^(?:[2-9TJQKA][cdhs]){2}$/i.test(raw)) { const hand = parseCards(raw).sort((a, b) => a - b) as [number, number]; if (weight > 0) combos.push({ cards: hand, weight }); continue; }
    const plus = /^([2-9TJQKA])([2-9TJQKA])([so]?)\+$/i.exec(raw);
    if (plus) {
      const a = RANKS.indexOf(plus[1].toUpperCase()), b = RANKS.indexOf(plus[2].toUpperCase()), kind = plus[3].toLowerCase();
      if (a === b) { if (kind) throw new Error('Pairs have no suffix.'); for (let r = a; r < 13; r++) combos.push(...rangeForCell(RANKS[r] + RANKS[r], weight)); }
      else { if (a < b) throw new Error('Put the higher rank first.'); for (let r = b; r < a; r++) combos.push(...rangeForCell(RANKS[a] + RANKS[r] + kind, weight)); }
      continue;
    }
    combos.push(...rangeForCell(raw, weight));
  }
  const result = merge(combos, blocked);
  if (!result.length) throw new Error('Range is empty after weights and known-card blockers.');
  return result;
}
export const RANGE_PRESETS = {
  'Tight educational': '77+,AJs+,KQs,AQo+',
  'Broad educational': '22+,A2s+,K8s+,Q9s+,JTs,ATo+,KJo+',
  'All hands': 'random',
} as const;

/** Edit exactly one matrix class without silently broadening concrete hands elsewhere. */
export function editRangeCell(notation: string, label: string, weight: number): string {
  // Validate the requested label and weight even when it clears a cell.
  rangeForCell(label, weight);
  const byKey = new Map((notation.trim() ? expandRange(notation) : []).map(combo => [combo.cards.join(','), combo]));
  for (const combo of rangeForCell(label)) byKey.delete(combo.cards.join(','));
  for (const combo of rangeForCell(label, weight)) byKey.set(combo.cards.join(','), combo);
  const tokens: string[] = [];
  for (const cell of matrixLabels()) {
    const possible = rangeForCell(cell), selected = possible.map(c => byKey.get(c.cards.join(','))).filter((c): c is WeightedCombo => c !== undefined);
    if (!selected.length) continue;
    if (selected.length === possible.length && selected.every(c => c.weight === selected[0].weight)) tokens.push(`${cell}:${selected[0].weight}`);
    else tokens.push(...selected.map(c => `${c.cards.map(cardText).join('')}:${c.weight}`));
  }
  return tokens.join(',');
}
