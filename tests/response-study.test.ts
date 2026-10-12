import {it,expect} from 'vitest';
import {act,replayHand} from '../src/game';
import {parseCards} from '../src/cards';
import {terminalBetContext,riverBetExample,conditionResponses,responseRequest,responseValue} from '../src/response-study';
import {runAnalysis} from '../src/engines/runner';
import {weightedRiverFixture} from './fixtures/river-decision';
function context(){const h=act(replayHand(weightedRiverFixture(),6),{type:'check'}),c=terminalBetContext(h,20);if(c.kind!=='supported')throw Error('fixture');return {h,c:c.context}}
const initial='AsAh:0.5,KcKd:0.25,9d9h:0.75';
it.each([['KcKd',1/6,1,70/3],['9d9h',.5,0,0],['AsAh',1/3,.5,50/3],['random',1,1/3,0]])('conditions %s before executing the real evaluator',async(filter,prob,equity,ev)=>{
 const {h,c}=context(),before=JSON.stringify(h),m=conditionResponses(initial,String(filter),1,[...c.hero,...c.board]);
 expect(m.callProbability).toBeCloseTo(Number(prob),12);const r=await runAnalysis(responseRequest(c,m,'pok-standard','exact',1));expect(r.result!.equity).toBeCloseTo(Number(equity),12);
 expect((await responseValue(c,m,r)).ev).toBeCloseTo(Number(ev),10);expect(JSON.stringify(h)).toBe(before);
});
it('handles all-fold, all-call, weighted probabilities and no fabricated equity',async()=>{
 const h=riverBetExample(),x=terminalBetContext(h,20);if(x.kind!=='supported')throw Error('fixture');const c=x.context;
 const none=conditionResponses('random','random',0,[...c.hero,...c.board]);expect((await responseValue(c,none,null)).ev).toBe(20);expect(none.calling).toHaveLength(0);
 const all=conditionResponses('random','random',1,[...c.hero,...c.board]),r=await runAnalysis(responseRequest(c,all,'pok-standard','exact',1));expect((await responseValue(c,all,r)).ev).toBe(10);expect(r.counts.completed).toBe(990);
 const weighted=conditionResponses('KcKd:0.5,9d9h','KcKd:0.5,9d9h:0.25',.5,[]);expect(weighted.callProbability).toBeCloseTo(1/6,12);expect(weighted.calling.map(c=>c.weight)).toEqual([.125,.125]);
 await expect(responseValue(c,all,null)).rejects.toThrow();await expect(responseValue(c,none,r)).rejects.toThrow();
});
it('rejects invalid probabilities, ranges, duplicate known cards and empty support',()=>{
 for(const rate of [-1,1.01,NaN,Infinity])expect(()=>conditionResponses('AA','AA',rate,[])).toThrow();
 for(const filter of ['', 'AA:-1','AA:NaN','AsAs'])expect(()=>conditionResponses('AA',filter,1,[])).toThrow();
 expect(()=>conditionResponses('AsAh','random',1,parseCards('As'))).toThrow();expect(()=>conditionResponses('AA','random',1,[0,0])).toThrow();
});
it('uses rules-engine legality and rejects short coverage, outstanding bets, side pots and invalid chips',()=>{
 const h=riverBetExample(),before=JSON.stringify(h);for(const b of [0,-1,NaN,Infinity,9,20.5,991])expect(terminalBetContext(h,b).kind).toBe('unsupported');expect(terminalBetContext(h,990).kind).toBe('supported');
 for(const mutate of [(h:any)=>h.currentBet=1,(h:any)=>h.turn=1,(h:any)=>h.seats[0].totalBet++,(h:any)=>h.seats[1].stack=1,(h:any)=>h.returned=[{seat:0,amount:1}],(h:any)=>h.pots=[{}],(h:any)=>h.board[0]=h.seats[0].hole[0],(h:any)=>h.seats[0].stack=NaN]){const bad=structuredClone(h);mutate(bad);expect(terminalBetContext(bad,20).kind).toBe('unsupported')}
 expect(terminalBetContext(weightedRiverFixture(),20).kind).toBe('unsupported');expect(JSON.stringify(h)).toBe(before);
 const hidden=structuredClone(h);hidden.deck.reverse();hidden.seats[1].hole=parseCards('9d 9h');expect(terminalBetContext(hidden,20)).toEqual(terminalBetContext(h,20));
});
it('rejects stale conditional ranges and cancelled results; retains real sampling uncertainty',async()=>{
 const {c}=context(),m=conditionResponses(initial,'random',1,[...c.hero,...c.board]);
 const r=await runAnalysis(responseRequest(c,m,'pok-standard','monte-carlo',1));const v=await responseValue(c,m,r);expect(v.estimated).toBe(true);expect(v.interval![0]).toBeLessThan(0);expect(v.interval![1]).toBeGreaterThan(0);expect(r.counts.completed).toBe(2000);
 const other=conditionResponses(initial,'KcKd',1,[...c.hero,...c.board]);await expect(responseValue(c,other,r)).rejects.toThrow('context mismatch');await expect(responseValue(c,m,{...r,status:'CANCELLED',result:null})).rejects.toThrow();await expect(responseValue(c,{...m,foldProbability:NaN},r)).rejects.toThrow();
});
