import {it,expect} from 'vitest';
import {parseCards} from '../src/cards';
import {fromEquityRequest} from '../src/engines/contract';
import {runAnalysis} from '../src/engines/runner';
import {explainStudyCall} from '../src/decision-study';

const result=()=>runAnalysis(fromEquityRequest({hero:parseCards('2c 3d'),board:parseCards('As Ks Qs Js Ts'),opponents:[{hand:parseCards('4c 5d')}],method:'exact'},'pok-standard',1));
it.each([[-1e-8,'below'],[1e-8,'above'],[Number.EPSILON,'at']])('classifies a small margin %s with an explicit numerical tolerance',async(delta,classification)=>{
 const r=await result();r.result!.equity=.5+Number(delta);r.result!.interval=[r.result!.equity,r.result!.equity];
 const d=explainStudyCall(r,50,50);expect(d.kind==='available'&&d.calculations.comparison).toBe(classification);
});
it.each([[.6,.7,'above'],[.3,.4,'below']])('classifies an interval entirely on one side: %s to %s',async(lo,hi,classification)=>{
 const r=await result();r.method=r.result!.method='MONTE CARLO ESTIMATE';r.result!.confidence=.95;r.result!.equity=(Number(lo)+Number(hi))/2;r.result!.interval=[Number(lo),Number(hi)];
 const d=explainStudyCall(r,50,50);expect(d.kind==='available'&&d.calculations.comparison).toBe(classification);
});
it('rejects invalid calls, missing values and probabilities; handles zero prices',async()=>{
 const r=await result();for(const c of [-1,NaN,Infinity,.5,1e12])expect(explainStudyCall(r,50,c).kind).toBe('unavailable');
 for(const equity of [-.1,1.1,NaN,Infinity,undefined]){const broken=structuredClone(r);(broken.result as any).equity=equity;expect(explainStudyCall(broken,50,50).kind).toBe('unavailable')}
 const missing=structuredClone(r);delete (missing.result as any).interval;expect(explainStudyCall(missing,50,50).kind).toBe('unavailable');
 for(const [p,c,threshold,ev] of [[0,20,1,-10],[80,0,0,40]]){const d=explainStudyCall(r,p,c);expect(d.kind==='available'&&d.calculations).toMatchObject({threshold,incrementalEV:ev})}
});
it('uses fractional tied equity, immutable inputs and matching engine provenance',async()=>{
 const r=await result(),before=JSON.stringify(r),d=explainStudyCall(r,80,20);
 expect(d.kind).toBe('available');if(d.kind!=='available')return;
 expect(d.calculations).toMatchObject({threshold:.2,equity:.5,marginPoints:30,incrementalEV:30,comparison:'above'});
 expect(d.provenance.inputHash).toBe(r.inputHash);expect(d.provenance.method).toBe('EXACT ENUMERATION');
 expect(d.provenance.completed).toBe(1);expect(JSON.stringify(r)).toBe(before);
});
it('matches independently derived below, equal and undefined call prices',async()=>{
 const r=await result();
 for(const [p,c,threshold,margin,ev,comparison] of [[20,80,.8,-30,-30,'below'],[50,50,.5,0,0,'at'],[0,0,null,null,0,'undefined']] as const){
  const d=explainStudyCall(r,p,c);expect(d.kind).toBe('available');if(d.kind!=='available')continue;
  expect(d.calculations.threshold).toBe(threshold);expect(d.calculations.marginPoints===null?null:Math.round(d.calculations.marginPoints)).toBe(margin);
  expect(d.calculations.incrementalEV).toBe(ev);expect(d.calculations.comparison).toBe(comparison);
 }
});
it('transforms the existing sampling interval without claiming exactness',async()=>{
 const r=await result();r.method=r.result!.method='MONTE CARLO ESTIMATE';r.result!.confidence=.95;r.result!.interval=[.4,.6];
 const d=explainStudyCall(r,50,50);expect(d.kind).toBe('available');if(d.kind!=='available')return;
 expect(d.calculations.comparison).toBe('crosses');expect(d.calculations.evInterval).toEqual([-10,10]);
 expect(d.calculations.marginIntervalPoints).toEqual([expect.closeTo(-10),expect.closeTo(10)]);
});
it('treats interval boundaries touching the threshold conservatively',async()=>{
 const r=await result();r.method=r.result!.method='MONTE CARLO ESTIMATE';r.result!.confidence=.95;
 for(const interval of [[.5,.6],[.4,.5]] as [number,number][]){r.result!.interval=interval;const d=explainStudyCall(r,50,50);expect(d.kind==='available'&&d.calculations.comparison).toBe('crosses')}
});
it('refuses incomplete results, explicit pot eligibility and uncalled returns',async()=>{
 const r=await result();
 expect(explainStudyCall({...r,status:'CANCELLED',result:null},80,20).kind).toBe('unavailable');
 expect(explainStudyCall({...r,uncalledReturns:[{playerId:'hero',amount:10}]},80,20)).toMatchObject({kind:'unavailable',reason:'pot-model'});
 r.result!.inputs.pots=[{id:'side',amount:10,eligible:[1]}];expect(explainStudyCall(r,80,20)).toMatchObject({kind:'unavailable',reason:'pot-model'});
});
it('rejects invalid amounts and unsupported uncertainty instead of fabricating conclusions',async()=>{
 const r=await result();for(const p of [-1,NaN,Infinity,.5,1_000_000_001])expect(explainStudyCall(r,p,20)).toMatchObject({kind:'unavailable',reason:'amounts'});
 r.method=r.result!.method='MONTE CARLO ESTIMATE';r.result!.confidence=null;
 expect(explainStudyCall(r,80,20)).toMatchObject({kind:'unavailable',reason:'uncertainty'});
});
