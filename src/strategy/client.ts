import {api,type Member} from '../platform-api';
import {validateSolveRequest,validateSolveResult,solveHash,type SolveRequest,type SolveResult} from './contract';
export type SolverHealth={available:boolean;reason:string;location:'local-jvm';limits:{jobs:number;iterations:number;timeMs:number;memoryMiB:number};engine:string};
export type SolveJob={id:string;state:'queued'|'running'|'completed'|'partial'|'cancelled'|'failed';progress:{iteration:number;gap:number|null};result:SolveResult|null;error:string|null;requestId:string;analysisRevision:number;inputHash:string};
export const solverHealth=()=>api<SolverHealth>('/api/strategy/health');
export const solverMember=()=>api<Member>('/api/me');
/** This client never auto-starts a service and never sends the live game state. */
export class StrategyClient {
 private generation=0;private job:string|null=null;private csrf='';private abort?:AbortController;
 async solve(input:SolveRequest,csrf:string,onProgress:(job:SolveJob)=>void):Promise<SolveResult>{
  await this.cancel();const generation=++this.generation,request=validateSolveRequest(input),hash=await solveHash(request);this.csrf=csrf;this.abort=new AbortController();
  // Let the bounded creation response finish even if cancelled: it carries the job ID
  // needed to cancel the server job. Polls remain abortable; the generation guard
  // immediately cancels a creation that completes after a scenario change.
  const first=await api<SolveJob>('/api/strategy/jobs','POST',request,csrf);
  if(generation!==this.generation){void api(`/api/strategy/jobs/${first.id}/cancel`,'POST',{},csrf).catch(()=>{});throw Error('Cancelled or stale solve.');}this.job=first.id;
  let job=first;for(;;){if(generation!==this.generation)throw Error('Cancelled or stale solve.');if(job.inputHash!==hash||job.requestId!==request.requestId||job.analysisRevision!==request.analysisRevision)throw Error('Mismatched solver response.');onProgress(job);
   if(job.result){const result=validateSolveResult(job.result,request);if(result.inputHash!==hash)throw Error('Mismatched solver input hash.');this.job=null;return result;}
   if(['failed','cancelled'].includes(job.state)){this.job=null;throw Error(job.error??job.state);}
   await new Promise<void>((resolve,reject)=>{const signal=this.abort!.signal;const cancel=()=>{clearTimeout(timer);reject(Error('Cancelled.'))};const timer=setTimeout(()=>{signal.removeEventListener('abort',cancel);resolve()},250);if(signal.aborted)cancel();else signal.addEventListener('abort',cancel,{once:true})});
   job=await api<SolveJob>(`/api/strategy/jobs/${first.id}`,'GET',undefined,undefined,this.abort.signal);
  }
 }
 async cancel(){this.generation++;this.abort?.abort();const job=this.job;this.job=null;if(job)await api(`/api/strategy/jobs/${job}/cancel`,'POST',{},this.csrf).catch(()=>{});}
}
