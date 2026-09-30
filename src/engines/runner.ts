import {calculateEquityAsync,type EquityProgress} from '../equity';
import {type AnalysisRequest,type AnalysisResult,validateRequest,toEquityRequest,inputHash} from './contract';
import {entryFor,compatibility,ADAPTER_VERSION} from './registry';
import type {PHEvaluator} from './ph-evaluator';
export async function runAnalysis(input:unknown,onProgress:(p:EquityProgress)=>void=()=>{},cancelled:()=>boolean=()=>false,development?:{ph?:()=>Promise<PHEvaluator>;location:'development-node'}):Promise<AnalysisResult>{
  const started=performance.now(),r=validateRequest(input),entry=entryFor(r.engine),hash=await inputHash(r);
  const base:AnalysisResult={schemaVersion:1,requestId:r.requestId,analysisRevision:r.analysisRevision,inputHash:hash,cacheKey:`v1/${entry.id}/${entry.revision}/${ADAPTER_VERSION}/${hash}`,engineId:entry.id,adapterVersion:ADAPTER_VERSION,upstreamRevision:entry.revision,location:entry.location,status:'ERROR',completionReason:'No completed calculation.',method:'NONE',result:null,counts:{kind:'none',completed:0,probabilityMass:null},elapsedMs:0,overheadMs:0,reproducibility:entry.seed,uncertainty:'None: no completed result.',sharedComponents:entry.components,limitations:['Analysis-only adapter. Ordinary game dealing, rules and payouts always use POK Standard.','Memory budget bounds request/table sizes; JavaScript heap is browser-managed, not an OS hard memory reservation.'],uncalledReturns:r.uncalledReturns??[]};
  const compatible=compatibility(r);if(!compatible.compatible)return {...base,status:'UNSUPPORTED',completionReason:compatible.reason,elapsedMs:performance.now()-started};
  if(development)base.location=development.location;
  let completed=0;
  try{
    let evaluator:((cards:number[])=>number)|undefined;
    if(entry.id==='pok-ph'){const ph=await (development?.ph?development.ph():import('./ph-evaluator').then(m=>m.loadPHEvaluator()));evaluator=ph.evaluateUnchecked}
    const loaded=performance.now();
    const budget=()=>{if(cancelled())throw new Error('CANCELLED');if(performance.now()-started>r.budget.timeMs)throw new Error('TIMEOUT');if(completed>r.budget.states&&r.method!=='monte-carlo')throw new Error('STATE_LIMIT')};
    budget();
    const output=await calculateEquityAsync(toEquityRequest(r),p=>{completed=p.completed;budget();onProgress(p)},()=>{budget();return false},evaluator);
    completed=output.samples;
    if(output.method==='EXACT ENUMERATION'&&completed>r.budget.states)throw new Error('STATE_LIMIT');
    // Attribution is changed only in this analysis-only response. The source equity algorithm remains shared.
    output.engineVersion=`${ADAPTER_VERSION}/${entry.id}/${entry.revision}`;
    output.inputs=JSON.parse(JSON.stringify(output.inputs));
    return {...base,status:'COMPLETE',completionReason:'All requested states or fixed independent samples completed.',method:output.method,result:output,counts:{kind:output.method==='EXACT ENUMERATION'?'enumerated-showdowns':'independent-observations',completed:output.samples,probabilityMass:output.evaluatedWeight},elapsedMs:performance.now()-started,overheadMs:loaded-started,uncertainty:output.confidence===null?'Complete enumeration; IEEE-754 representation tolerance 1e-12.':'Fixed-N 95% Hoeffding interval for independent bounded fractional shares; no sequential-stopping claim.',limitations:[...base.limitations,...output.limitations,'Uncalled returns are listed separately and are not contested-pot equity.']};
  }catch(e){const message=(e as Error).message;return {...base,status:message==='CANCELLED'?'CANCELLED':message==='TIMEOUT'?'TIMEOUT':message==='STATE_LIMIT'?'PARTIAL':'ERROR',completionReason:message==='STATE_LIMIT'?'State budget reached; interrupted enumeration is not an exact result.':message,counts:{kind:'none',completed,probabilityMass:null},elapsedMs:performance.now()-started}}
}
export function comparisonVerdict(a:AnalysisResult,b:AnalysisResult):string {
  if(a.inputHash!==b.inputHash)return 'Different assumptions / not comparable';
  if(a.status!=='COMPLETE'||b.status!=='COMPLETE'||!a.result||!b.result)return 'Inconclusive precision';
  if(a.method==='EXACT ENUMERATION'&&b.method===a.method)return a.counts.completed===b.counts.completed&&(['equity','win','tie','loss'] as const).every(k=>Math.abs(a.result![k]-b.result![k])<=1e-12)&&a.result.perPot.length===b.result.perPot.length&&a.result.perPot.every((p,i)=>b.result!.perPot[i]?.id===p.id&&Math.abs(p.heroShare-b.result!.perPot[i].heroShare)<=1e-12&&Math.abs(p.expectedChips-b.result!.perPot[i].expectedChips)<=1e-9)?'Exact agreement within tolerance':'Mismatch requiring investigation';
  if(a.result.interval[0]<=b.result.interval[1]&&b.result.interval[0]<=a.result.interval[1])return 'Statistically consistent estimates';
  return 'Mismatch requiring investigation';
}
