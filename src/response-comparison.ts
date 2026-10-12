import type {HandState} from './game';
import {DECISION_EPSILON} from './decision-study';
import {terminalBetContext,conditionResponses,responseRequest,responseValue,type BetContext} from './response-study';
import {inputHash,type AnalysisRequest,type AnalysisResult} from './engines/contract';

export interface ResponseAssumption {kind:'fold-call';rule:string;rate:number}
export interface ComparisonOptions {engine:'pok-standard'|'pok-ph';method:'exact'|'monte-carlo';samples:number;expectedRevision:number}
export interface RiverSnapshot {readonly version:1;readonly context:BetContext;readonly initialRange:string;readonly key:string}
const snapshots=new WeakSet<object>();
function rangeText(value:unknown):asserts value is string {if(typeof value!=='string'||!value.trim()||value.length>2000)throw Error('An explicit range of 1–2000 characters is required.');}
export function riverSnapshot(hand:HandState,bet:number,initialRange:string):RiverSnapshot{
 rangeText(initialRange);const c=terminalBetContext(hand,bet);
 if(c.kind!=='supported'||typeof c.context.handId!=='string'||c.context.handId.length>200||!Number.isSafeInteger(c.context.revision)||c.context.revision<0)throw Error('Unsupported river snapshot.');
 conditionResponses(initialRange,'random',1,[...c.context.hero,...c.context.board]);
 const value=Object.freeze({version:1 as const,context:c.context,initialRange,key:JSON.stringify({version:1,context:c.context,initialRange})});snapshots.add(value);return value;
}
export function prepareResponseComparison(snapshot:RiverSnapshot,models:readonly ResponseAssumption[],options:ComparisonOptions){
 if(!snapshot||!snapshots.has(snapshot)||!Object.isFrozen(snapshot))throw Error('Use an immutable validated river snapshot.');
 if(!options||Object.keys(options).some(k=>!['engine','method','samples','expectedRevision'].includes(k))||!['pok-standard','pok-ph'].includes(options.engine)||!['exact','monte-carlo'].includes(options.method)||!Number.isSafeInteger(options.samples)||options.samples<100||options.samples>50000||options.expectedRevision!==snapshot.context.revision)throw Error('Invalid options or stale hand revision.');
 if(!Array.isArray(models)||models.length!==2)throw Error('Exactly two declared models are required.');
 const assumptions=models.map(m=>{if(!m||Object.keys(m).some(k=>!['kind','rule','rate'].includes(k))||m.kind!=='fold-call'||!Number.isFinite(m.rate)||m.rate<0||m.rate>1)throw Error('Unsupported response model or probability.');rangeText(m.rule);return Object.freeze({...m})});
 const conditioned=assumptions.map(m=>conditionResponses(snapshot.initialRange,m.rule,m.rate,[...snapshot.context.hero,...snapshot.context.board]));
 return {snapshot,assumptions,conditioned,options:Object.freeze({...options}),changed:{rule:assumptions[0].rule!==assumptions[1].rule,rate:assumptions[0].rate!==assumptions[1].rate}};
}
/** Dependency-injected worker runner; no persistence, network, evaluator or RNG introduced here. */
export async function compareResponseModels(snapshot:RiverSnapshot,models:readonly ResponseAssumption[],options:ComparisonOptions,run:(r:AnalysisRequest)=>Promise<AnalysisResult>,isCurrent:()=>boolean=()=>true){
 const prepared=prepareResponseComparison(snapshot,models,options),results=[];
 const cache=new Map<string,AnalysisResult>();let workerRuns=0;
 for(const model of prepared.conditioned){
  if(!isCurrent())throw Error('Comparison cancelled or obsolete.');
  let analysis:AnalysisResult|null=null,reused=false;
  if(model.callProbability>0){const request=responseRequest(snapshot.context,model,prepared.options.engine,prepared.options.method,prepared.options.expectedRevision,prepared.options.samples),key=prepared.options.engine+':'+await inputHash(request);
   if(!isCurrent())throw Error('Comparison cancelled or obsolete.');
   analysis=cache.get(key)??null;reused=!!analysis;
   if(!analysis){analysis=await run(request);workerRuns++;if(analysis.engineId!==prepared.options.engine||analysis.analysisRevision!==prepared.options.expectedRevision||analysis.inputHash!==await inputHash(request))throw Error('Mismatched conditional worker result.');}
   if(!isCurrent())throw Error('Comparison cancelled or obsolete.');
   // responseValue validates completion, inputs, method and conditional request identity before reuse.
   const value=await responseValue(snapshot.context,model,analysis);cache.set(key,analysis);results.push({snapshot,model,analysis,value,reused});
  }else results.push({snapshot,model,analysis,value:await responseValue(snapshot.context,model,null),reused});
 }
 if(!isCurrent())throw Error('Comparison cancelled or obsolete.');
 const delta=results[1].value.ev-results[0].value.ev,tolerance=DECISION_EPSILON*Math.max(1,snapshot.context.pot+2*snapshot.context.bet);
 return {snapshot,results,delta,absoluteDifference:Math.abs(delta),tolerance,equalWithinRoundoff:Math.abs(delta)<=tolerance,estimated:results.some(r=>r.value.estimated),changed:prepared.changed,workerRuns,seed:20260930,options:prepared.options};
}
