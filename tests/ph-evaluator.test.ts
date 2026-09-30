import { beforeAll, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parseCards, shuffledDeck, seededRandom } from '../src/cards';
import { evaluate, referenceEvaluate } from '../src/evaluator';
import { instantiatePHEvaluator, normalizePHRank, phCategory, pokCardToPH, PH_MEMORY_BYTES, PH_WASM_SHA256, type PHEvaluator } from '../src/engines/ph-evaluator';
import cases from './fixtures/ph-cases.json';

const bytes = new Uint8Array(readFileSync('public/engines/ph-evaluator.wasm'));
let engine: PHEvaluator;
beforeAll(async () => { engine = await instantiatePHEvaluator(bytes); });
describe('real PH C evaluator compiled to freestanding WebAssembly', () => {
  it('matches the reviewed source pin, binary hash, closed import/export surface and fixed memory', async () => {
    const manifest = JSON.parse(readFileSync('public/engines/ph-evaluator-build.json','utf8').replace(/^\uFEFF/,''));
    expect(manifest.revision).toBe('10be452e4c1ee40a6a56f06457f46bff27ca495a');
    expect(manifest.license).toBe('Apache-2.0'); expect(manifest.bytes).toBe(bytes.length);
    expect(manifest.sha256).toBe(PH_WASM_SHA256);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.sha256);
    const module = await WebAssembly.compile(bytes);
    expect(WebAssembly.Module.imports(module)).toEqual([]);
    expect(WebAssembly.Module.exports(module).map(e=>e.name).sort()).toEqual(['evaluate_5cards','evaluate_6cards','evaluate_7cards','memory']);
    const instance = await WebAssembly.instantiate(module,{});
    const memory = instance.exports.memory as WebAssembly.Memory;
    expect(memory.buffer.byteLength).toBe(PH_MEMORY_BYTES);
    expect(() => memory.grow(1)).toThrow();
  });
  it('uses the inspected c,d,h,s low-bit and 2..A rank mapping for all 52 cards', () => {
    const ranks = '23456789TJQKA', suits = 'cdhs';
    for (let rank=0;rank<13;rank++) for (let suit=0;suit<4;suit++) {
      const card = parseCards(ranks[rank]+suits[suit])[0];
      expect(pokCardToPH(card)).toBe(rank*4+suit);
    }
  });
  it('covers every category, wheel, double trips, three pairs, kickers and board ties', () => {
    for (const item of cases) {
      const cards = parseCards(item.cards), score = engine.evaluate(cards);
      expect(phCategory(score),item.id).toBe(item.category);
      if (item.rawRank !== undefined) expect(score,item.id).toBe(normalizePHRank(item.rawRank));
      expect(Math.floor(referenceEvaluate(cards)/15**5),item.id).toBe(item.category);
    }
    expect(engine.evaluate(parseCards('As Ac Ks Qd Jh 3s 2h'))).toBeGreaterThan(engine.evaluate(parseCards('As Ac Ks Qd Th 3s 2h')));
    expect(engine.evaluate(parseCards('As Ac Ks Qd Jh 3s 2h'))).toBe(engine.evaluate(parseCards('Ah Ad Kh Qc Js 3d 2c')));
    expect(engine.evaluate(parseCards(cases.at(-1)!.cards))).toBe(engine.evaluate(parseCards(cases.at(-2)!.cards)));
  });
  it('rejects invalid card counts, duplicates, invalid values and malformed module bytes', async () => {
    for (const cards of [[0,1,2,3],[0,1,2,3,4,5,6,7],[0,0,1,2,3],[0,1,2,3,52],[0,1,2,3,-1],[0,1,2,3,4.5],[0,1,2,3,NaN]]) expect(()=>engine.evaluate(cards)).toThrow();
    for (const rank of [0,-1,7463,Infinity,1.2]) expect(()=>normalizePHRank(rank)).toThrow();
    await expect(instantiatePHEvaluator(new Uint8Array([1,2,3]))).rejects.toThrow();
  });
  it('agrees on category, total ordering and ties with best-of-21 reference for 10,000 seeded seven-card hands', () => {
    const random = seededRandom(0x50484c41);
    const hands: {ph:number;reference:number}[] = [];
    for (let i=0;i<10_000;i++) {
      const cards=shuffledDeck(random).slice(0,7), ph=engine.evaluate(cards), reference=referenceEvaluate(cards);
      expect(phCategory(ph),`sample ${i}`).toBe(Math.floor(reference/15**5));
      expect(evaluate(cards),`original vs reference sample ${i}`).toBe(reference);
      hands.push({ph,reference});
    }
    hands.sort((a,b)=>a.reference-b.reference);
    for (let i=1;i<hands.length;i++) expect(Math.sign(hands[i].ph-hands[i-1].ph),`ordering ${i}`).toBe(Math.sign(hands[i].reference-hands[i-1].reference));
  });
  it('agrees on another 1,000 five-card and 1,000 six-card samples', () => {
    const random=seededRandom(0x50483536);
    for(const count of [5,6]) {
      const hands=[];
      for(let i=0;i<1000;i++) {const cards=shuffledDeck(random).slice(0,count); const ph=engine.evaluate(cards),ref=referenceEvaluate(cards);expect(phCategory(ph)).toBe(Math.floor(ref/15**5));hands.push({ph,ref});}
      hands.sort((a,b)=>a.ref-b.ref);
      for(let i=1;i<hands.length;i++)expect(Math.sign(hands[i].ph-hands[i-1].ph)).toBe(Math.sign(hands[i].ref-hands[i-1].ref));
    }
  });
});
