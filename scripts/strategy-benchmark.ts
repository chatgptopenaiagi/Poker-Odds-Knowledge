import {writeFile} from 'node:fs/promises';
import {runJavaSolver} from '../server/strategy-adapter';
import {scenarioRequest} from '../src/strategy/scenario';
import catalog from '../fixtures/strategy/scenarios.json';
const runs=[];
for(let i=0;i<3;i++){const r=scenarioRequest(catalog.scenarios[0]);const start=performance.now();const result=await runJavaSolver(r,{signal:new AbortController().signal,onProgress:()=>{}});runs.push({repetition:i+1,iterations:result.iterations,status:result.status,totalAdapterMs:performance.now()-start,nashConvChips:result.metric!.value,inputHash:result.inputHash})}
const values=runs.map(r=>r.totalAdapterMs).sort((a,b)=>a-b);await writeFile('docs/strategy/SOLVER_BENCHMARKS.json',JSON.stringify({schemaVersion:1,observedAt:new Date().toISOString(),plan:'Three fixed repetitions of the first original 10000-iteration river fixture, one JVM at a time; includes startup, Windows Job verification, JSON IPC and result validation. No adaptive reruns.',runtime:'JDK 21, one active processor, 256 MiB heap, 512 MiB OS process commitment cap',runs,medianMs:values[1],rangeMs:[values[0],values[2]],limits:'Workstation measurement, not professional strength. Browser UI latency recorded separately. Android runtime measurement NOT_RUN without a target.'},null,2));console.log(JSON.stringify({medianMs:values[1],rangeMs:[values[0],values[2]]}));
