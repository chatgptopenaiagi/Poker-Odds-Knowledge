import {validateResult,type AnalysisResult} from './engines/contract';
import {terminalCall} from './math-study';

// Probability tolerance for arithmetic roundoff, not statistical uncertainty.
export const DECISION_EPSILON=1e-12;

/** Separate terminal-call study, never a recommendation or a live action context. */
export function explainStudyCall(analysis:AnalysisResult,pot:number,call:number){
 const unavailable=(reason:'incomplete'|'invalid-result'|'pot-model'|'amounts'|'uncertainty')=>({kind:'unavailable' as const,reason});
 if(analysis.status!=='COMPLETE'||!analysis.result)return unavailable('incomplete');
 try{validateResult(analysis)}catch{return unavailable('invalid-result')}
 const r=analysis.result;
 // Global showdown equity cannot price pots with different eligibility or refunds.
 if(r.inputs.pots?.length||r.perPot.length||analysis.uncalledReturns.length)return unavailable('pot-model');
 let model:ReturnType<typeof terminalCall>;
 try{model=terminalCall(pot,call,r.equity)}catch{return unavailable('amounts')}
 const estimated=r.method==='MONTE CARLO ESTIMATE';
 if(estimated&&r.confidence!==.95)return unavailable('uncertainty');
 const bounds:readonly[number,number]=estimated?r.interval:[r.equity,r.equity];
 const threshold=model.threshold;
 const comparison=threshold===null?'undefined':estimated
  ?bounds[0]>threshold+DECISION_EPSILON?'above':bounds[1]<threshold-DECISION_EPSILON?'below':'crosses'
  :r.equity>threshold+DECISION_EPSILON?'above':r.equity<threshold-DECISION_EPSILON?'below':'at';
 return {
  kind:'available' as const,
  context:{kind:'separate-terminal-call-study' as const,potBeforeCall:pot,call},
  assumptions:['single-fully-eligible-pot','no-rake','no-future-betting','entered-opponent-ranges'] as const,
  limitations:['not-live-table','no-bet-or-raise-ev','not-an-action-recommendation','ranges-not-validated-by-sampling'] as const,
  calculations:{...model,equity:r.equity,marginPoints:threshold===null?null:100*(r.equity-threshold),
   comparison,estimated,marginIntervalPoints:threshold===null?null:bounds.map(x=>100*(x-threshold)),
   evInterval:bounds.map(x=>x*(pot+call)-call)},
  provenance:{inputHash:analysis.inputHash,engineId:analysis.engineId,adapterVersion:analysis.adapterVersion,
   method:r.method,completed:analysis.counts.completed,location:analysis.location,confidence:estimated?r.confidence:null}
 };
}
