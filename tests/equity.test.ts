import { describe, expect, it } from 'vitest';
import { parseCards, shuffledDeck } from '../src/cards';
import { calculateEquity, calculateEquityAsync, validateEquityRequest, type EquityRequest } from '../src/equity';
import { editRangeCell, expandRange, matrixLabels, rangeForCell, rangeFromWeights } from '../src/ranges';
const cards = parseCards;
describe('weighted concrete ranges', () => {
  it('expands pairs/suited/offsuit as 6/4/12, and 169 cells as 1326', () => {
    expect(rangeForCell('AA')).toHaveLength(6); expect(rangeForCell('AKs')).toHaveLength(4); expect(rangeForCell('AKo')).toHaveLength(12);
    expect(matrixLabels()).toHaveLength(169); expect(expandRange('random')).toHaveLength(1326);
    expect(new Set(expandRange('*').map(c => c.cards.join(','))).size).toBe(1326);
    expect(expandRange('AK')).toHaveLength(16);
  });
  it('applies known blockers, weight semantics and inclusive plus notation', () => {
    expect(expandRange('AA', cards('As'))).toHaveLength(3);
    expect(expandRange('77+')).toHaveLength(8 * 6);
    expect(expandRange('AJs+')).toHaveLength(12);
    expect(expandRange('AA:0.5,AA:25%').every(c => c.weight === 0.5)).toBe(true);
    expect(expandRange('AsKh:50%')).toEqual([{ cards: cards('AsKh').sort((a, b) => a - b), weight: 0.5 }]);
    expect(expandRange('Kc Kh')).toEqual(expandRange('KcKh'));
    expect(expandRange('As Kh:50%')).toEqual(expandRange('AsKh:50%'));
    expect(rangeFromWeights({ AA: 0, KK: 0.2 })).toHaveLength(6);
  });
  it('rejects bad notation, out-of-bound weights and empty blocked ranges', () => {
    for (const text of ['', 'AA:2', 'AA:-1', 'AAs', 'ZZ', 'AA:0', 'AA:NaN', '2As+']) expect(() => expandRange(text)).toThrow();
    expect(() => expandRange('AsKh', cards('As'))).toThrow(/empty/);
  });
  it('matrix edits preserve unrelated specific hands and heterogeneous weights', () => {
    const updated = editRangeCell('AsKh:50%,AcKd:25%', 'QQ', 0.75);
    const combos = expandRange(updated);
    expect(combos).toHaveLength(8);
    expect(combos.filter(c => c.weight === 0.5)).toHaveLength(1);
    expect(combos.filter(c => c.weight === 0.25)).toHaveLength(1);
    expect(expandRange(editRangeCell(updated, 'QQ', 0))).toHaveLength(2);
    expect(editRangeCell('', 'AA', 0)).toBe('');
  });
});
describe('transparent equity and information isolation', () => {
  const flop: EquityRequest = { hero: cards('AsAh'), board: cards('2c7dJh'), opponents: [{ hand: cards('KsKh') }], seed: 17 };
  it('enumerates the exact 990 unordered fixed-hand flop runouts', () => {
    const result = calculateEquity(flop);
    expect(result.method).toBe('EXACT ENUMERATION'); expect(result.samples).toBe(990);
    expect(result.win + result.tie + result.loss).toBeCloseTo(1);
    expect(result.interval).toEqual([result.equity, result.equity]);
  });
  it('enumerates all 990 legal river opponent combinations', () => {
    const result = calculateEquity({ hero: cards('AsAh'), board: cards('2c7dJh9s3c'), opponents: [{ range: expandRange('random') }] });
    expect(result.samples).toBe(990); expect(result.rangeCombinationCounts).toEqual([990]);
  });
  it('splits a three-way board tie in thirds and computes eligible pots separately', () => {
    const result = calculateEquity({ hero: cards('2c3c'), board: cards('AsKsQsJsTs'), opponents: [{ hand: cards('4c5c') }, { hand: cards('6c7c') }], pots: [{ id: 'main', amount: 90, eligible: [0, 1, 2] }, { id: 'side', amount: 60, eligible: [1, 2] }] });
    expect(result.equity).toBeCloseTo(1 / 3); expect(result.tie).toBe(1); expect(result.win).toBe(0); expect(result.loss).toBe(0);
    expect(result.perPot[0].expectedChips).toBe(30); expect(result.perPot[1].heroShare).toBe(0);
  });
  it('MC converges within its conservative fractional-share interval and is reproducible', () => {
    const exact = calculateEquity(flop);
    const request: EquityRequest = { ...flop, method: 'monte-carlo', samples: 12_000, seed: 1492 };
    const result = calculateEquity(request), repeat = calculateEquity(request);
    expect(result.interval[0]).toBeLessThan(exact.equity); expect(result.interval[1]).toBeGreaterThan(exact.equity);
    expect(result.equity).toBe(repeat.equity); expect(result.samples).toBe(12_000); expect(result.confidence).toBe(0.95);
  });
  it('global rejection samples compatibility-conditioned weighted joint ranges', () => {
    const request: EquityRequest = { hero: cards('QhQd'), board: cards('2c7dJh9s3c'), opponents: [{ range: expandRange('AsAh:25%,8s8h:75%') }, { range: expandRange('AsKd:50%,TcTd:50%') }] };
    const exact = calculateEquity(request);
    const mc = calculateEquity({ ...request, method: 'monte-carlo', samples: 12_000, seed: 178 });
    expect(exact.samples).toBe(3); expect(exact.equity).toBeCloseTo(6 / 7); expect(mc.equity).toBeCloseTo(exact.equity, 1);
    expect(mc.interval[0]).toBeLessThan(exact.equity); expect(mc.interval[1]).toBeGreaterThan(exact.equity);
    const reversed = calculateEquity({ ...request, opponents: [...request.opponents].reverse() });
    expect(reversed.equity).toBe(exact.equity);
  });
  it('rejects collisions, impossible joint ranges, oversized jobs and invalid pots', () => {
    expect(() => calculateEquity({ ...flop, dead: cards('As') })).toThrow(/Duplicate/);
    expect(() => calculateEquity({ ...flop, opponents: [{ hand: cards('AsKh') }] })).toThrow();
    const impossible: EquityRequest = { hero: cards('QhQd'), board: cards('2c7dJh9s3c'), opponents: [{ hand: cards('AsKd') }, { hand: cards('AsTc') }] };
    expect(() => calculateEquity(impossible)).toThrow(/no mutually compatible/);
    expect(() => calculateEquity({ ...impossible, method: 'monte-carlo', samples: 100 })).toThrow(/Could not obtain/);
    expect(() => calculateEquity({ ...flop, board: [], method: 'exact' })).toThrow(/bounded/);
    expect(() => calculateEquity({ ...flop, pots: [{ id: 'bad', amount: 10, eligible: [0, 3] }] })).toThrow(/pot/);
    expect(() => validateEquityRequest({ ...flop, hero: cards('As') })).toThrow();
    expect(() => validateEquityRequest({ ...flop, dead: cards('As') })).toThrow();
    expect(() => validateEquityRequest({ ...flop, seed: -1 })).toThrow(/Seed/);
    expect(() => validateEquityRequest({ ...flop, samples: 0 })).toThrow(/budget/);
  });
  it('preserves proportional weights when their absolute scale is extremely small', () => {
    const request: EquityRequest = { hero: cards('QhQd'), board: cards('2c7dJh9s3c'), opponents: [{ range: [{ cards: cards('AsAh') as [number,number], weight: 1e-300 }, { cards: cards('8s8h') as [number,number], weight: 3e-300 }] }] };
    const result = calculateEquity(request);
    expect(result.equity).toBeCloseTo(0.75); expect(Number.isFinite(result.evaluatedWeight)).toBe(true);
  });
  it('fails clearly when every compatible joint weight underflows instead of returning NaN', () => {
    const request: EquityRequest = { hero: cards('2c3c'), board: cards('4d5d6h7h8h'), opponents: [
      { range: expandRange('AsKs:1,QsJs:1e-300') },
      { range: expandRange('AsQs:1,KsTs:1e-300') },
    ] };
    // The three assignments containing a weight-1 hand collide. Only tiny × tiny remains.
    expect(() => calculateEquity(request)).toThrow(/floating-point precision/);
  });
  it('records the effective default seed separately from unchanged specified inputs', () => {
    const { seed: _seed, ...request } = flop;
    const result = calculateEquity(request);
    expect(result.seed).toBe(20260930);
    expect(result.inputs.seed).toBeUndefined();
    expect(result.inputs.hero).toEqual(request.hero);
  });
  it('analysis cannot consume the deal stream; unknown hidden cards are not removed', () => {
    const nextDeal = shuffledDeck(555);
    const first = calculateEquity(flop);
    const hiddenA = { folded: cards('2s3s'), futureDeck: shuffledDeck(10) };
    const hiddenB = { folded: cards('8s9s'), futureDeck: shuffledDeck(20) };
    const observe = (_hidden: unknown) => structuredClone(flop);
    expect(calculateEquity(observe(hiddenA)).equity).toBe(calculateEquity(observe(hiddenB)).equity);
    expect(first.knownCards).toEqual([...flop.hero, ...flop.board]);
    expect(first.samples).toBe(990); expect(shuffledDeck(555)).toEqual(nextDeal);
  });
  it('emits progress and allows cancellation between bounded chunks', async () => {
    let completed = 0, cancel = false;
    await expect(calculateEquityAsync({ ...flop, samples: 20_000, method: 'monte-carlo' }, p => { completed = p.completed; cancel = true; }, () => cancel)).rejects.toThrow(/cancelled/);
    expect(completed).toBeGreaterThan(0); expect(completed).toBeLessThan(20_000);
    let final = 0;
    const result = await calculateEquityAsync(flop, p => { final = p.completed; });
    expect(final).toBe(result.samples);
  });
});
