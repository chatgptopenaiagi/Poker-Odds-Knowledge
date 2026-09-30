import { describe, expect, it } from 'vitest';
import { AnalysisClient, type WorkerLike } from '../src/analysis-client';
import type { EquityRequest } from '../src/equity';
describe('worker controller', () => {
  it('terminates cancelled work and ignores queued stale results', async () => {
    const workers: (WorkerLike & { terminated: boolean; message?: any })[] = [];
    const client = new AnalysisClient(() => { const w = {terminated:false,onmessage:null,onerror:null,postMessage(value:unknown){this.message=value},terminate(){this.terminated=true}} as WorkerLike & {terminated:boolean;message?:any}; workers.push(w); return w; });
    const request = {hero:[0,1],board:[],opponents:[{hand:[2,3]}],samples:20} as EquityRequest;
    const first = client.run(request).catch(e=>e.message);
    let progress = 0;
    const second = client.run(request, n=>{progress=n});
    expect(await first).toBe('Calculation cancelled'); expect(workers[0].terminated).toBe(true);
    workers[0].onmessage?.({data:{type:'result',id:workers[0].message.id,result:{equity:99}}} as MessageEvent);
    workers[1].onmessage?.({data:{type:'progress',id:workers[1].message.id,completed:10,target:20}} as MessageEvent);
    workers[1].onmessage?.({data:{type:'result',id:workers[1].message.id,result:{equity:0.5}}} as MessageEvent);
    expect((await second).equity).toBe(.5); expect(progress).toBe(10); expect(workers[1].terminated).toBe(true);
  });
});
