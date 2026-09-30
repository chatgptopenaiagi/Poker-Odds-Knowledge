import type {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {validateSolveRequest,validateSolveResult,solveHash,type SolveRequest,type SolveResult} from '../src/strategy/contract';
import type {SolveJob} from '../src/strategy/client';
export type SolverRunner=(request:SolveRequest,options:{signal:AbortSignal;onProgress:(p:{iteration:number;gap:number|null})=>void})=>Promise<SolveResult>;
type Row=Record<string,any>;
export class JobError extends Error {constructor(public code:string,public status=400){super(code)}}
/** One persistent queue per server. No shell or client-controlled file paths. */
export class StrategyJobs {
 private active:{id:string;owner:string;controller:AbortController}|null=null;private stopped=false;private pending=false;private cleanup:ReturnType<typeof setInterval>;
 constructor(private db:DatabaseSync,private runner:SolverRunner,private now=Date.now){
  db.exec(readFileSync(new URL('./migrations/strategy-v1.sql',import.meta.url),'utf8'));
  db.prepare("UPDATE pok_strategy_job SET state='failed',error='server_restarted_restart_only',updated_at=? WHERE state IN ('queued','running')").run(now());
  // Private jobs expire after seven days; no raw inputs enter the audit log.
  this.prune();this.cleanup=setInterval(()=>this.prune(),60000);this.cleanup.unref();
 }
 private prune(){this.db.prepare('DELETE FROM pok_strategy_job WHERE created_at<?').run(this.now()-7*86400000);this.db.prepare('DELETE FROM pok_strategy_usage WHERE created_at<?').run(this.now()-7*86400000)}
 private view(row:Row):SolveJob{return {id:row.id,state:row.state,requestId:row.request_id,analysisRevision:row.analysis_revision,inputHash:row.input_hash,progress:JSON.parse(row.progress_json),result:row.result_json?JSON.parse(row.result_json):null,error:row.error}}
 get(id:string,owner:string){const row=this.db.prepare('SELECT * FROM pok_strategy_job WHERE id=? AND user_id=?').get(id,owner) as Row|undefined;if(!row)throw new JobError('not_found',404);return this.view(row)}
 async submit(owner:string,input:unknown){
  if(this.stopped)throw new JobError('solver_stopped',503);this.prune();const request=validateSolveRequest(input),hash=await solveHash(request);
  const old=this.db.prepare('SELECT * FROM pok_strategy_job WHERE user_id=? AND request_id=?').get(owner,request.requestId) as Row|undefined;
  if(old){if(old.input_hash!==hash||old.analysis_revision!==request.analysisRevision)throw new JobError('idempotency_conflict',409);return this.view(old)}
  const count=(sql:string,...args:any[])=>(this.db.prepare(sql).get(...args) as Row).n;
  if(count("SELECT count(*) n FROM pok_strategy_job WHERE user_id=? AND state IN ('queued','running')",owner))throw new JobError('one_active_job_per_account',429);
  if(count("SELECT count(*) n FROM pok_strategy_job WHERE state IN ('queued','running')")>=4)throw new JobError('queue_full',429);
  if(count('SELECT count(*) n FROM pok_strategy_usage WHERE user_id=? AND created_at>?',owner,this.now()-3600000)>=12||count('SELECT count(*) n FROM pok_strategy_usage WHERE created_at>?',this.now()-86400000)>=100)throw new JobError('solver_job_budget_exceeded',429);
  const id=randomUUID();this.db.exec('BEGIN IMMEDIATE');try{this.db.prepare("INSERT INTO pok_strategy_job(id,user_id,request_id,input_hash,analysis_revision,state,request_json,created_at,updated_at) VALUES(?,?,?,?,?,'queued',?,?,?)").run(id,owner,request.requestId,hash,request.analysisRevision,JSON.stringify(request),this.now(),this.now());this.db.prepare('INSERT INTO pok_strategy_usage VALUES(?,?,?)').run(id,owner,this.now());this.db.exec('COMMIT')}catch(e){this.db.exec('ROLLBACK');throw e}this.schedule();return this.get(id,owner);
 }
 cancel(id:string,owner:string){this.get(id,owner);this.db.prepare("UPDATE pok_strategy_job SET state='cancelled',error='cancelled_by_owner',updated_at=? WHERE id=? AND user_id=? AND state IN ('queued','running')").run(this.now(),id,owner);if(this.active?.id===id)this.active.controller.abort();return this.get(id,owner)}
 deleteOwner(owner:string){if(this.active?.owner===owner)this.active.controller.abort();this.db.prepare('DELETE FROM pok_strategy_job WHERE user_id=?').run(owner);this.db.prepare('UPDATE pok_strategy_usage SET user_id=NULL WHERE user_id=?').run(owner)}
 health(){return {active:this.active?1:0,queued:(this.db.prepare("SELECT count(*) n FROM pok_strategy_job WHERE state='queued'").get() as Row).n,limits:{jobs:1,iterations:20000,timeMs:15000,memoryMiB:512,threads:1,queue:4,perUserHour:12,globalDay:100},retentionDays:7,recovery:'restart-only',stopped:this.stopped}}
 stop(){this.stopped=true;clearInterval(this.cleanup);this.active?.controller.abort();this.db.prepare("UPDATE pok_strategy_job SET state='cancelled',error='server_stopped_restart_only',updated_at=? WHERE state IN ('queued','running')").run(this.now())}
 private schedule(){if(this.pending||this.stopped)return;this.pending=true;setTimeout(()=>{this.pending=false;void this.drain()},0)}
 private async drain(){if(this.active||this.stopped)return;const row=this.db.prepare("SELECT * FROM pok_strategy_job WHERE state='queued' ORDER BY created_at,id LIMIT 1").get() as Row|undefined;if(!row)return;
  const controller=new AbortController();this.active={id:row.id,owner:row.user_id,controller};this.db.prepare("UPDATE pok_strategy_job SET state='running',updated_at=? WHERE id=?").run(this.now(),row.id);
  const request=JSON.parse(row.request_json) as SolveRequest;let deadline=false;const timer=setTimeout(()=>{deadline=true;controller.abort()},request.budget.timeMs+2000);
  try {const result=validateSolveResult(await this.runner(request,{signal:controller.signal,onProgress:p=>{if(!Number.isSafeInteger(p.iteration)||p.iteration<0||p.iteration>request.budget.iterations||p.gap!==null&&(!Number.isFinite(p.gap)||p.gap<0))throw Error('invalid_progress');if(!this.stopped)this.db.prepare("UPDATE pok_strategy_job SET progress_json=?,updated_at=? WHERE id=? AND state='running'").run(JSON.stringify(p),this.now(),row.id)}}),request);
   if(result.inputHash!==row.input_hash)throw Error('input_hash_mismatch');
   if(!controller.signal.aborted&&!this.stopped){const state=result.status==='COMPLETE'?'completed':result.status==='PARTIAL'?'partial':result.status==='CANCELLED'?'cancelled':'failed';this.db.prepare("UPDATE pok_strategy_job SET state=?,result_json=?,updated_at=? WHERE id=? AND state='running'").run(state,JSON.stringify(result),this.now(),row.id)}
  }catch {if(!this.stopped)this.db.prepare("UPDATE pok_strategy_job SET state='failed',error=?,updated_at=? WHERE id=? AND state='running'").run(deadline?'solver_deadline_exceeded':'solver_failed_or_unavailable',this.now(),row.id)}
  finally {clearTimeout(timer);if(controller.signal.aborted&&!this.stopped)this.db.prepare("UPDATE pok_strategy_job SET state='failed',error=?,updated_at=? WHERE id=? AND state='running'").run(deadline?'solver_deadline_exceeded':'solver_aborted',this.now(),row.id);this.active=null;this.schedule()}
 }
}
