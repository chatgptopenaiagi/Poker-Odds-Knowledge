import {beforeAll,describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {parseCards,shuffledDeck} from '../src/cards';
import {expandRange} from '../src/ranges';
import {calculateEquity} from '../src/equity';
import {fromEquityRequest,validateRequest,validateResult,toEquityRequest,inputHash,type AnalysisRequest} from '../src/engines/contract';
import {runAnalysis,comparisonVerdict} from '../src/engines/runner';
import {instantiatePHEvaluator,type PHEvaluator} from '../src/engines/ph-evaluator';
import {runNativeCanonical} from '../server/native-canonical';
import corpus from './fixtures/engine-equity-v1.json';
let ph:PHEvaluator;beforeAll(async()=>{ph=await instantiatePHEvaluator(new Uint8Array(readFileSync('public/engines/ph-evaluator.wasm')))});
const dev={location:'development-node' as const,ph:async()=>ph};
const base=()=>fromEquityRequest({hero:parseCards('AsAh'),board:parseCards('2c7dJh'),opponents:[{hand:parseCards('KsKh')}],method:'exact'},'pok-standard',0);
describe('POK versioned analysis boundary',()=>{
  it('uses strict shipped schema and rejects unknown fields, nonfinite weights, duplicates and illegal boards',()=>{
    for(const mutation of [ (r:any)=>r.shell='cmd', (r:any)=>r.budget.threads=8,(r:any)=>r.players[1].extra=true,(r:any)=>r.board=['2c'],(r:any)=>r.players[1].hand=['As','Kh'],(r:any)=>r.players[1]={id:'opponent-1',combinations:[{cards:['Ks','Kh'],weight:NaN}]},(r:any)=>r.players[1]={id:'opponent-1',combinations:[{cards:['Ks','Kh'],weight:1},{cards:['Kh','Ks'],weight:0}]},(r:any)=>r.players[1].id='hero',(r:any)=>r.budget.samples=Infinity]){const r=base();mutation(r);expect(()=>validateRequest(r)).toThrow()}
    expect(()=>validateRequest({...base(),variant:'omaha'})).toThrow();
  });
  it('rejects empty or impossible multiway assignments before loading external code',()=>{
    const r=base();r.players[1]={id:'a',combinations:[{cards:['Ks','Kh'],weight:1}]};r.players.push({id:'b',combinations:[{cards:['Ks','Kh'],weight:1}]});expect(()=>validateRequest(r)).toThrow(/compatible/);
    r.players.pop();r.players[1].combinations![0].weight=0;expect(()=>validateRequest(r)).toThrow(/empty/);
  });
  it('hashes the same information set across engines and separates revisions in cache keys',async()=>{
    const r=base(),a=await runAnalysis(r,undefined,undefined,dev),b=await runAnalysis({...r,engine:'pok-ph',requestId:'other',analysisRevision:42},undefined,undefined,dev);
    expect(a.inputHash).toBe(b.inputHash);expect(a.cacheKey).not.toBe(b.cacheKey);expect(validateResult(a)).toBe(a);expect(validateResult(b)).toBe(b);
    expect(await inputHash({...r,dead:['3c']})).not.toBe(a.inputHash);
    expect(()=>validateResult({...a,extra:'untrusted'})).toThrow();expect(()=>validateResult({...a,result:{...a.result,equity:NaN}})).toThrow();
  });
  it('preserves arbitrary positive relative weights and blocker normalization without seat bias',async()=>{
    const r=fromEquityRequest({hero:parseCards('AsAh'),board:parseCards('2c7dJh9sTc'),opponents:[{range:expandRange('KsKh:25%,QcQd:100%')}],method:'exact'},'pok-ph',1);
    r.players[1].combinations!.forEach(c=>c.weight*=1000000);
    const result=await runAnalysis(r,undefined,undefined,dev);expect(result.status).toBe('COMPLETE');expect(result.result?.equity).toBe(calculateEquity(toEquityRequest(r)).equity);
  });
  it('matches independent product-weight arithmetic for overlapping multiway ranges',()=>{
    const r={hero:parseCards('AsAh'),board:parseCards('2c3d7h9sTc'),opponents:[{range:expandRange('TsTh:100%,KsKh:50%')},{range:expandRange('Td8d:25%,Ks8c:100%')}],method:'exact' as const};
    // Compatible masses .25, 1, .125; only .125 wins. The .5 collision is removed globally.
    const result=calculateEquity(r,ph.evaluateUnchecked);expect(result.samples).toBe(3);expect(result.equity).toBeCloseTo(1/11,12);expect(result.evaluatedWeight).toBe(1.375);
  });
  it('does not label interrupted exact enumeration complete and keeps cancellation explicit',async()=>{
    const r=base();r.budget.states=1;const limited=await runAnalysis(r,undefined,undefined,dev);expect(limited.status).toBe('PARTIAL');expect(limited.result).toBeNull();expect(limited.method).toBe('NONE');
    const cancel=await runAnalysis(base(),undefined,()=>true,dev);expect(cancel.status).toBe('CANCELLED');expect(cancel.result).toBeNull();
  });
  it('supports fractional multiway board ties and per-pot eligibility, separately listing uncalled returns',async()=>{
    const r=fromEquityRequest({hero:parseCards('2c3c'),board:parseCards('TsJsQsKsAs'),opponents:[{hand:parseCards('4c5c')},{hand:parseCards('6c7c')}],pots:[{id:'main',amount:90,eligible:[0,1,2]},{id:'side',amount:40,eligible:[0,2]}],method:'exact'},'pok-ph',1);
    r.uncalledReturns=[{playerId:'opponent-2',amount:17}];const result=await runAnalysis(r,undefined,undefined,dev);expect(result.result!.equity).toBeCloseTo(1/3,12);expect(result.result!.tie).toBe(1);expect(result.result!.perPot.map(p=>p.expectedChips)).toEqual([30,20]);expect(result.uncalledReturns[0].amount).toBe(17);
  });
  it('keeps deck sequence independent, card order, suit and opponent order invariant',async()=>{
    const before=shuffledDeck(777),r=base();r.players.push({id:'second',hand:['Qc','Qd']});r.board=['2c','7d','Jh','9s','Tc'];
    const a=calculateEquity(toEquityRequest(r),ph.evaluateUnchecked);
    const reversed={...r,players:[...r.players].reverse(),board:[...r.board].reverse()};expect(calculateEquity(toEquityRequest(reversed),ph.evaluateUnchecked).equity).toBe(a.equity);
    const suit=(c:string)=>c[0]+({c:'d',d:'h',h:'s',s:'c'} as any)[c[1]];
    const perm={...r,board:r.board.map(suit),players:r.players.map(p=>({...p,hand:p.hand!.map(suit)}))};expect(calculateEquity(toEquityRequest(perm),ph.evaluateUnchecked).equity).toBe(a.equity);
    await runAnalysis({...r,engine:'pok-ph'},undefined,undefined,dev);expect(shuffledDeck(777)).toEqual(before);
  });
  it('returns honest unsupported native semantics without spawning for weights, side pots, MC or missing permission',async()=>{
    const r={...base(),engine:'ompeval-native' as const};expect((await runNativeCanonical(r)).status).toBe('UNSUPPORTED');r.executionPermission='local-native-opt-in';r.budget.memoryMiB=256;
    for(const change of [{method:'monte-carlo'}, {pots:[{id:'side',amount:10,eligible:['hero']}]},{players:[r.players[0],{id:'opponent-1',combinations:[{cards:['Ks','Kh'],weight:1},{cards:['Qc','Qd'],weight:.2}]}]}])expect((await runNativeCanonical({...r,...change})).status).toBe('UNSUPPORTED');
  });
  it('matches native exact 990-state output through the canonical contract',async()=>{
    const r={...base(),engine:'ompeval-native' as const,executionPermission:'local-native-opt-in' as const,budget:{...base().budget,memoryMiB:256}};
    const a=await runNativeCanonical(r),b=await runAnalysis({...r,engine:'pok-standard'},undefined,undefined,dev);expect(a.status,a.completionReason).toBe('COMPLETE');expect(validateResult(a)).toBe(a);expect(a.counts.completed).toBe(990);expect(comparisonVerdict(a,b)).toBe('Exact agreement within tolerance');
  });
  it('has Monte Carlo agreement with exact truth under a predeclared conservative fixed-N tolerance',()=>{
    const r=toEquityRequest(base()),exact=calculateEquity(r).equity;
    // Three predetermined seeds. Family-wise 95% via Hoeffding alpha=.05/3 (not rerun-until-pass).
    const samples=10000,tolerance=Math.sqrt(Math.log(120)/(2*samples));
    for(const seed of [19,381,7401]){const output=calculateEquity({...r,method:'monte-carlo',samples,seed},ph.evaluateUnchecked);expect(Math.abs(output.equity-exact)).toBeLessThanOrEqual(tolerance)}
  });
  for(const fixture of corpus.fixtures)it(`exact differential fixture ${fixture.id}`,()=>{
    const r=validateRequest(fixture.request),inputs=toEquityRequest(r),a=calculateEquity(inputs),b=calculateEquity(inputs,ph.evaluateUnchecked);
    expect(a.samples).toBe(b.samples);expect(a.equity).toBeCloseTo(b.equity,12);expect(a.win).toBeCloseTo(b.win,12);expect(a.tie).toBeCloseTo(b.tie,12);expect(a.loss).toBeCloseTo(b.loss,12);
  });
});
