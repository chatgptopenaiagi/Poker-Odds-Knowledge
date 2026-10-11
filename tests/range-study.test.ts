import {it,expect} from 'vitest';
import {parseCards} from '../src/cards';
import {blockerStudy,rangeDifference} from '../src/range-study';
import {expandRange,editRangeCell} from '../src/ranges';
import {fromEquityRequest} from '../src/engines/contract';
import {runAnalysis} from '../src/engines/runner';
it('counts exact pair, suited, offsuit support and known/dead blockers without renormalizing display mass',()=>{
 const r=blockerStudy('AA:0.5,AKs:0.25,AKo:0.75',parseCards('As Kd'));
 // AA: C(3,2)=3; AK suited excludes spades/diamonds =>2; offsuit 3*3-2=7.
 expect(r.before).toBe(22);expect(r.remaining.length).toBe(12);expect(r.removed).toHaveLength(10);
 expect(r.remainingMass).toBe(7.25);expect(r.cells).toEqual(expect.arrayContaining([{label:'AA',before:6,remaining:3},{label:'AKs',before:4,remaining:2},{label:'AKo',before:12,remaining:7}]));
 expect(r.removed.every(c=>c.reasons.length>0)).toBe(true);
});
it('preserves maximum-overlap semantics, explicit weights, plus syntax and empty blocker reports',()=>{
 expect(blockerStudy('AsAh:0.2,AhAs:0.8,AsAh:0.5',[]).originalMass).toBe(.8);
 expect(expandRange('77+')).toHaveLength(48);
 expect(blockerStudy('AsAh',parseCards('As')).remaining).toHaveLength(0);
 const edited=editRangeCell('AsAh:0.2,KcKd:0.8','QQ',.5);
 expect(expandRange(edited).filter(c=>c.weight===.2)).toHaveLength(1);
 for(const text of ['AA:-1','AA:NaN','AA:Infinity','AA:101%','AsAs','77-TT'])expect(()=>blockerStudy(text,[])).toThrow();
 expect(()=>blockerStudy('AA',parseCards('As As'))).toThrow();
});
async function result(range:string,method:'exact'|'monte-carlo'='exact',board='2c 3d 7h 8s 9c'){
 return runAnalysis(fromEquityRequest({hero:parseCards('Ac Ad'),board:parseCards(board),opponents:[{range:expandRange(range)}],method,seed:42,samples:2000},'pok-standard',1));
}
it('compares independently solvable river cases using actual engine results',async()=>{
 const a=await result('KcKd'),b=await result('AsAh:0.5,KcKd:0.25,9d9h:0.75');
 expect(a.result!.equity).toBe(1);expect(b.result!.equity).toBeCloseTo(1/3,12);
 expect(rangeDifference(a,b).deltaPoints).toBeCloseTo(-200/3,10);
 expect(rangeDifference(a,b).estimated).toBe(false);
 expect(()=>rangeDifference(a,awaitNever())).toThrow();
 function awaitNever(){return {...b,status:'CANCELLED' as const,result:null}}
 expect(()=>rangeDifference(a,{...b,engineId:'pok-ph'})).toThrow('contexts');
 const changed=await result('KcKd','exact','2c 3d 7h 8s Tc');expect(()=>rangeDifference(a,changed)).toThrow('contexts');
});
it('retains seeded Monte Carlo metadata without significance claims',async()=>{
 const a=await result('KcKd','monte-carlo'),b=await result('AsAh','monte-carlo');
 expect(rangeDifference(a,b)).toEqual({deltaPoints:-50,estimated:true});expect(a.counts.completed).toBe(2000);expect(b.result!.confidence).toBe(.95);
});
