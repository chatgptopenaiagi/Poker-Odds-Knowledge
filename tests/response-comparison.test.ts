import {it,expect} from 'vitest';
import {act,replayHand} from '../src/game';
import {riverBetExample,conditionResponses} from '../src/response-study';
import {riverSnapshot,prepareResponseComparison,compareResponseModels,type ResponseAssumption,type ComparisonOptions} from '../src/response-comparison';
import {runAnalysis} from '../src/engines/runner';
import {weightedRiverFixture} from './fixtures/river-decision';
const model=(rule='random',rate=1):ResponseAssumption=>({kind:'fold-call',rule,rate});
const options=(revision:number):ComparisonOptions=>({engine:'pok-standard',method:'exact',samples:2000,expectedRevision:revision});
function weighted(){return act(replayHand(weightedRiverFixture(),6),{type:'check'})}
it('compares identical models on one frozen snapshot and reuses the completed calculation',async()=>{
 const hand=riverBetExample(),before=JSON.stringify(hand),s=riverSnapshot(hand,20,'random');let runs=0;
 const r=await compareResponseModels(s,[model(),model()],options(hand.revision),q=>{runs++;return runAnalysis(q)});
 expect(r.results.map(x=>x.value.ev)).toEqual([10,10]);expect(r.delta).toBe(0);expect(r.absoluteDifference).toBe(0);expect(r.equalWithinRoundoff).toBe(true);expect(runs).toBe(1);expect(r.results[1].reused).toBe(true);
 expect(r.results[0].snapshot).toBe(s);expect(r.results[1].snapshot).toBe(s);expect(JSON.stringify(hand)).toBe(before);expect(()=>{(s.context.hero as number[])[0]=0}).toThrow();expect(()=>{(s as any).initialRange='AA'}).toThrow();
});
it('derives exact conditional range differences using independent AA/KK/99 reference outcomes',async()=>{
 const hand=weighted(),s=riverSnapshot(hand,20,'AsAh:0.5,KcKd:0.25,9d9h:0.75');
 const r=await compareResponseModels(s,[model('KcKd'),model('9d9h')],options(hand.revision),runAnalysis);
 expect(r.results[0].model.callProbability).toBeCloseTo(1/6,12);expect(r.results.map(r=>r.analysis!.result!.equity)).toEqual([1,0]);expect(r.results[0].value.ev).toBeCloseTo(70/3,12);expect(r.results[1].value.ev).toBe(0);expect(r.delta).toBeCloseTo(-70/3,12);expect(r.absoluteDifference).toBeCloseTo(70/3,12);expect(r.workerRuns).toBe(2);expect(r.changed).toEqual({rule:true,rate:false});
});
it('all-fold and all-call boundaries need zero or one real worker respectively',async()=>{
 const hand=riverBetExample(),s=riverSnapshot(hand,20,'random');const r=await compareResponseModels(s,[model('random',0),model('random',1)],options(hand.revision),runAnalysis);expect(r.results.map(r=>r.value.ev)).toEqual([20,10]);expect(r.results[0].analysis).toBeNull();expect(r.workerRuns).toBe(1);expect(r.delta).toBe(-10);
 const both=await compareResponseModels(s,[model('random',0),model('random',0)],options(hand.revision),async()=>{throw Error('must not execute')});expect(both.workerRuns).toBe(0);expect(both.delta).toBe(0);
});
it('retains blocker and overlap semantics in both models',()=>{
 const hand=weighted(),s=riverSnapshot(hand,20,'AA:0.5,AA:1,KK');const p=prepareResponseComparison(s,[model('AA'),model('KK')],options(hand.revision));expect(p.conditioned.map(m=>m.calling.length)).toEqual([1,6]);expect(p.conditioned[0].callProbability).toBeCloseTo(1/7,12);expect(p.conditioned[1].callProbability).toBeCloseTo(6/7,12);
});
it('rejects malformed, oversized, unknown models, options and stale revisions',()=>{
 const hand=riverBetExample(),s=riverSnapshot(hand,20,'random'),o=options(hand.revision);
 for(const m of [{kind:'raise',rule:'AA',rate:.5},{kind:'fold-call',rule:'AA',rate:NaN},{kind:'fold-call',rule:'AA',rate:Infinity},{kind:'fold-call',rule:'AA',rate:-.1},{kind:'fold-call',rule:'AA',rate:1.1},model('AsAs'),model('X'.repeat(2001)),{...model(),fold:.5}])expect(()=>prepareResponseComparison(s,[m as ResponseAssumption,model()],o)).toThrow();
 for(const patch of [{expectedRevision:hand.revision+1},{method:'auto'},{samples:0},{samples:Infinity},{engine:'unknown'}])expect(()=>prepareResponseComparison(s,[model(),model()],{...o,...patch} as ComparisonOptions)).toThrow();
 expect(()=>prepareResponseComparison(structuredClone(s),[model(),model()],o)).toThrow();expect(()=>prepareResponseComparison(s,[model()],o)).toThrow();
 for(const bet of [0,-1,Infinity,NaN,9,991])expect(()=>riverSnapshot(hand,bet,'random')).toThrow();expect(()=>riverSnapshot(hand,20,'A'.repeat(2001))).toThrow();
 const bad=structuredClone(hand);bad.board[0]=bad.seats[0].hole[0];expect(()=>riverSnapshot(bad,20,'random')).toThrow();bad.seats[0].totalBet=-1;expect(()=>riverSnapshot(bad,20,'random')).toThrow();
});
it('rejects a superseded result and a result calculated for a different conditional range',async()=>{
 const hand=weighted(),s=riverSnapshot(hand,20,'AA,KK,99'),o=options(hand.revision);let current=true;
 await expect(compareResponseModels(s,[model('KK'),model('99')],o,async q=>{const r=await runAnalysis(q);current=false;return r},()=>current)).rejects.toThrow('obsolete');
 const other=await compareResponseModels(s,[model('KK'),model('KK')],o,runAnalysis);
 await expect(compareResponseModels(s,[model('99'),model('99')],o,async()=>other.results[0].analysis!)).rejects.toThrow('Mismatched');
});
it('preserves deterministic sampling metadata and does not claim a difference interval',async()=>{
 const hand=weighted(),s=riverSnapshot(hand,20,'AsAh:0.5,KcKd:0.25,9d9h:0.75');const r=await compareResponseModels(s,[model('random',.5),model()],{...options(hand.revision),method:'monte-carlo'},runAnalysis);
 expect(r.estimated).toBe(true);expect(r.results.every(x=>x.analysis!.counts.completed===2000&&x.analysis!.result!.seed===20260930)).toBe(true);expect(r.results.every(x=>x.value.interval)).toBe(true);expect(r).not.toHaveProperty('differenceInterval');
});
it('bounds chip roundoff for near-equal and large valid models',async()=>{
 const hand=riverBetExample(),s=riverSnapshot(hand,20,'random');const r=await compareResponseModels(s,[model('random',.5),model('random',.5+1e-14)],options(hand.revision),runAnalysis);expect(r.equalWithinRoundoff).toBe(true);expect(Math.abs(r.delta)).toBeLessThan(1e-10);
 const large=structuredClone(hand);large.seats.forEach(seat=>{seat.totalBet=100000000;seat.stack=100000000});large.initialChipTotal=400000000;
 const big=riverSnapshot(large,100000000,'random'),b=await compareResponseModels(big,[model('random',0),model()],options(large.revision),runAnalysis);expect(b.delta).toBe(-100000000);expect(Number.isFinite(b.delta)).toBe(true);
});
it('does not round a positive subnormal call probability down to an all-fold model',()=>{
 expect(()=>conditionResponses('KcKd','KcKd:5e-324',.5,[])).toThrow('underflow');
});
