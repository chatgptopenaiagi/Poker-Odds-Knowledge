import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { EngineClient, type EngineWorker } from '../src/engines/client';
import { fromEquityRequest, type AnalysisRequest, type AnalysisResult } from '../src/engines/contract';
import { parseCards } from '../src/cards';
import { runAnalysis } from '../src/engines/runner';

// Protocol unit tests only. The worker transport below is deliberately fake;
// root browser tests separately exercise compiled workers and actual WASM.
class ProtocolWorker implements EngineWorker {
 onmessage:Worker['onmessage']=null;onerror:Worker['onerror']=null;
 messages:unknown[]=[];terminated=0;
 postMessage(message:unknown){this.messages.push(message)}
 terminate(){this.terminated++}
 emit(data:unknown){this.onmessage?.call(this as unknown as Worker,{data} as MessageEvent)}
 crash(message='worker failed'){this.onerror?.call(this as unknown as Worker,{message} as ErrorEvent)}
}
function harness(){
 const workers:ProtocolWorker[]=[];let waiter:((worker:ProtocolWorker)=>void)|undefined;
 const client=new EngineClient(()=>{const worker=new ProtocolWorker();workers.push(worker);waiter?.(worker);waiter=undefined;return worker});
 return {client,workers,nextWorker:()=>new Promise<ProtocolWorker>(resolve=>{waiter=resolve})};
}
const request=()=>fromEquityRequest({hero:parseCards('As Ah'),board:parseCards('2c 7d Jh 9s Tc'),opponents:[{hand:parseCards('Ks Kh')}],method:'exact'},'pok-standard',7);
let good:AnalysisResult;
beforeAll(async()=>{good=await runAnalysis(request())});
const response=(input:AnalysisRequest):AnalysisResult=>({...structuredClone(good),requestId:input.requestId,analysisRevision:input.analysisRevision});
afterEach(()=>vi.useRealTimers());

describe('EngineClient protocol controller with simulated Worker transport',()=>{
 it('posts the validated snapshot, forwards current progress, resolves a schema-checked result and terminates',async()=>{
  const h=harness(),r=request(),spawn=h.nextWorker(),progress=vi.fn(),pending=h.client.run(r,progress),worker=await spawn;
  expect(worker.messages).toEqual([r]);worker.emit({kind:'progress',requestId:r.requestId,analysisRevision:r.analysisRevision,progress:{completed:1,target:2,attempts:1}});
  expect(progress).toHaveBeenCalledExactlyOnceWith(1,2);const result=response(r);worker.emit({kind:'result',result});expect(await pending).toEqual(result);expect(worker.terminated).toBe(1);
 });
 it('ignores stale request IDs/revisions and accepts the eventual current response',async()=>{
  const h=harness(),r=request(),spawn=h.nextWorker(),progress=vi.fn(),pending=h.client.run(r,progress),worker=await spawn;
  worker.emit({kind:'result',result:{...response(r),requestId:'old'}});worker.emit({kind:'result',result:{...response(r),analysisRevision:6}});
  worker.emit({kind:'progress',requestId:'old',analysisRevision:7,progress:{completed:1,target:1}});worker.emit({kind:'progress',requestId:r.requestId,analysisRevision:6,progress:{completed:1,target:1}});
  expect(worker.terminated).toBe(0);expect(progress).not.toHaveBeenCalled();worker.emit({kind:'result',result:response(r)});await pending;
 });
 it('cancels before hashing finishes without starting a worker',async()=>{
  const h=harness(),pending=h.client.run(request()),assertion=expect(pending).rejects.toThrow(/cancelled/i);h.client.cancel();await assertion;expect(h.workers).toHaveLength(0);
 });
 it('cancels an active worker and ignores its late messages',async()=>{
  const h=harness(),r=request(),spawn=h.nextWorker(),progress=vi.fn(),pending=h.client.run(r,progress),assertion=expect(pending).rejects.toThrow(/cancelled/i),worker=await spawn;
  h.client.cancel();worker.emit({kind:'result',result:response(r)});worker.emit({kind:'progress',requestId:r.requestId,analysisRevision:7,progress:{completed:1,target:1}});await assertion;expect(worker.terminated).toBe(1);expect(progress).not.toHaveBeenCalled();
 });
 it('allows only the latest consecutive request to resolve, even when an old worker emits its result',async()=>{
  const h=harness(),a=request(),firstSpawn=h.nextWorker(),first=h.client.run(a),firstAssertion=expect(first).rejects.toThrow(/cancelled/i),old=await firstSpawn;
  const b={...request(),analysisRevision:8},secondSpawn=h.nextWorker(),second=h.client.run(b),current=await secondSpawn;old.emit({kind:'result',result:response(a)});current.emit({kind:'result',result:response(b)});
  await firstAssertion;expect((await second).analysisRevision).toBe(8);expect(old.terminated).toBe(1);expect(current.terminated).toBe(1);
 });
 it('rejects a valid-looking answer with a different input hash',async()=>{
  const h=harness(),r=request(),spawn=h.nextWorker(),pending=h.client.run(r),assertion=expect(pending).rejects.toThrow(/Malformed/),worker=await spawn;
  worker.emit({kind:'result',result:{...response(r),inputHash:'0'.repeat(64)}});await assertion;expect(worker.terminated).toBe(1);
 });
 it('rejects wrong engine identity and nonfinite answer values',async()=>{
  for(const mutation of [(r:AnalysisResult)=>({...r,engineId:'pok-ph'}),(r:AnalysisResult)=>({...r,result:{...r.result,equity:NaN}})]){
   const h=harness(),r=request(),spawn=h.nextWorker(),pending=h.client.run(r),assertion=expect(pending).rejects.toThrow(/Malformed/),worker=await spawn;worker.emit({kind:'result',result:mutation(response(r))});await assertion;expect(worker.terminated).toBe(1);
  }
 });
 it('rejects malformed frames and malformed progress without uncaught handler exceptions',async()=>{
  for(const malformed of [null,{kind:'result',result:null},{kind:'result'},{kind:'progress',progress:null},{kind:'progress',progress:{completed:Infinity,target:1}},{kind:'progress',progress:{completed:2,target:1}}]){
   const h=harness(),r=request(),spawn=h.nextWorker(),pending=h.client.run(r),assertion=expect(pending).rejects.toThrow(/Malformed/),worker=await spawn;
   const frame=malformed&&{...malformed,requestId:r.requestId,analysisRevision:r.analysisRevision};expect(()=>worker.emit(frame)).not.toThrow();await assertion;expect(worker.terminated).toBe(1);
  }
 });
 it('rejects a current worker error frame and worker crashes, then permits retry',async()=>{
  for(const crash of [false,true]){
   const h=harness(),r=request(),spawn=h.nextWorker(),pending=h.client.run(r),assertion=expect(pending).rejects.toThrow('failed'),worker=await spawn;
   if(crash)worker.crash();else worker.emit({kind:'error',requestId:r.requestId,analysisRevision:r.analysisRevision,message:'calculation failed'});await assertion;expect(worker.terminated).toBe(1);
   const retrySpawn=h.nextWorker(),retry=h.client.run(r),retryWorker=await retrySpawn;retryWorker.emit({kind:'result',result:response(r)});expect((await retry).status).toBe('COMPLETE');
  }
 });
 it('enforces the requested deadline with fake timers and ignores a timed-out result',async()=>{
  vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});
  const h=harness(),r=request();r.budget.timeMs=250;const spawn=h.nextWorker(),pending=h.client.run(r),assertion=expect(pending).rejects.toThrow(/TIMEOUT/),worker=await spawn;
  await vi.advanceTimersByTimeAsync(1249);expect(worker.terminated).toBe(0);await vi.advanceTimersByTimeAsync(1);await assertion;expect(worker.terminated).toBe(1);worker.emit({kind:'result',result:response(r)});expect(vi.getTimerCount()).toBe(0);
 });
 it('clears its deadline after a successful response',async()=>{
  vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});const h=harness(),r=request(),spawn=h.nextWorker(),progress=vi.fn(),pending=h.client.run(r,progress),worker=await spawn;
  worker.emit({kind:'result',result:response(r)});await pending;expect(vi.getTimerCount()).toBe(0);worker.emit({kind:'result',result:response(r)});worker.emit({kind:'progress',requestId:r.requestId,analysisRevision:r.analysisRevision,progress:{completed:1,target:1}});worker.crash();expect(progress).not.toHaveBeenCalled();await vi.advanceTimersByTimeAsync(60000);expect(worker.terminated).toBe(1);
 });
});
