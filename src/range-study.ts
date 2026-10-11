import {assertCards} from './cards';
import {expandRange,rangeForCell,matrixLabels} from './ranges';
import {validateResult,type AnalysisResult} from './engines/contract';

/** Raw support mass is not a probability. Overlaps retain the parser's maximum-weight rule. */
export function blockerStudy(notation:string,known:number[]){
  assertCards(known);
  const before=expandRange(notation),blocked=new Set(known);
  const removed=before.filter(c=>c.cards.some(v=>blocked.has(v)));
  const remaining=before.filter(c=>!c.cards.some(v=>blocked.has(v)));
  const mass=(xs:typeof before)=>xs.reduce((s,c)=>s+c.weight,0);
  const keys=new Set(remaining.map(c=>c.cards.join(',')));
  const original=new Map(before.map(c=>[c.cards.join(','),c.weight]));
  return {before:before.length,removed:removed.map(c=>({...c,reasons:c.cards.filter(v=>blocked.has(v))})),remaining,
    originalMass:mass(before),remainingMass:mass(remaining),cells:matrixLabels().map(label=>{
      const cs=rangeForCell(label).filter(c=>original.has(c.cards.join(',')));
      return {label,before:cs.length,remaining:cs.filter(c=>keys.has(c.cards.join(','))).length};
    }).filter(c=>c.before>0)};
}

/** Results must differ only in opponent range; no comparison significance claim. */
export function rangeDifference(a:AnalysisResult,b:AnalysisResult){
  for(const r of [a,b]){validateResult(r);if(r.status!=='COMPLETE'||!r.result||r.result.inputs.opponents.length!==1||r.result.inputs.pots?.length||r.uncalledReturns.length)throw Error('Completed single-opponent, single-pot results required.');}
  const key=(r:AnalysisResult)=>JSON.stringify({engine:r.engineId,adapter:r.adapterVersion,method:r.method,inputs:{...r.result!.inputs,opponents:undefined}});
  if(key(a)!==key(b))throw Error('Comparison contexts differ.');
  return {deltaPoints:100*(b.result!.equity-a.result!.equity),estimated:a.method==='MONTE CARLO ESTIMATE'};
}
