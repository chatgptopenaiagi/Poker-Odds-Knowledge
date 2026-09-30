/** Bounded development comparison; uses real evaluators and the real native process.
 * Run from this Git worktree: npx tsx scripts/engine-comparison.ts
 * Never imported by the application, never starts a listener, never changes deployment.
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {performance} from 'node:perf_hooks';
import {parseCards} from '../src/cards';
import {fromEquityRequest, validateRequest, validateResult, type AnalysisRequest, type AnalysisResult, type EngineId} from '../src/engines/contract';
import {runAnalysis, comparisonVerdict} from '../src/engines/runner';
import {instantiatePHEvaluator, PH_WASM_SHA256} from '../src/engines/ph-evaluator';
import {runNativeCanonical} from '../server/native-canonical';

const gitRoot=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
if(resolve(gitRoot).toLowerCase()!==resolve(process.cwd()).toLowerCase())throw new Error('Run only from the verified Git worktree root.');
const started=performance.now(), observedAt=new Date().toISOString();
const fixtureBytes=readFileSync('tests/fixtures/engine-equity-v1.json');
const corpus=JSON.parse(fixtureBytes.toString('utf8')) as {schemaVersion:number;generatorSeed:number;fixtures:{id:string;description:string;request:AnalysisRequest}[]};
if(corpus.schemaVersion!==1||corpus.fixtures.length!==123)throw new Error('Expected the reviewed 123-fixture corpus.');
const sourceSha256=createHash('sha256').update(fixtureBytes).digest('hex');
const loadStarted=performance.now(),wasmBytes=new Uint8Array(readFileSync('public/engines/ph-evaluator.wasm'));
const ph=await instantiatePHEvaluator(wasmBytes);
const phDiskReadIntegrityCompileAndInstantiateMs=performance.now()-loadStarted;
const development={location:'development-node' as const,ph:async()=>ph};
const engines:EngineId[]=['pok-standard','pok-ph','ompeval-native'];
const disagreements:unknown[]=[],failures:unknown[]=[],unsupported:unknown[]=[];
const common=(request:AnalysisRequest)=>validateRequest({...request,executionPermission:'local-native-opt-in',budget:{...request.budget,memoryMiB:256,timeMs:15000}});
async function run(request:AnalysisRequest,engine:EngineId):Promise<AnalysisResult>{
  const input={...structuredClone(request),engine};
  const result=engine==='ompeval-native'?await runNativeCanonical(input):await runAnalysis(input,undefined,undefined,development);
  return validateResult(result);
}
function compact(r:AnalysisResult){
  return {engineId:r.engineId,adapterVersion:r.adapterVersion,upstreamRevision:r.upstreamRevision,location:r.location,inputHash:r.inputHash,
    status:r.status,completionReason:r.completionReason,method:r.method,counts:r.counts,elapsedMs:r.elapsedMs,overheadMs:r.overheadMs,
    equity:r.result?.equity??null,win:r.result?.win??null,tie:r.result?.tie??null,loss:r.result?.loss??null,interval:r.result?.interval??null,
    attempts:r.result?.attempts??null,perPot:r.result?.perPot??null,uncalledReturns:r.uncalledReturns};
}
const rows:unknown[]=[];
let standardPhAgreements=0,nativeAgreements=0,nativeUnsupported=0;
for(const [index,fixture] of corpus.fixtures.entries()){
  if(performance.now()-started>120000)throw new Error('Overall two-minute work limit exceeded; no complete comparison report generated.');
  const request=common(fixture.request),outputs:AnalysisResult[]=[];
  for(const engine of engines){
    const output=await run(request,engine);outputs.push(output);
    if(output.status==='UNSUPPORTED'&&engine==='ompeval-native'){nativeUnsupported++;unsupported.push({fixtureId:fixture.id,engine,reason:output.completionReason});}
    else if(output.status!=='COMPLETE')failures.push({fixtureId:fixture.id,engine,status:output.status,reason:output.completionReason});
  }
  const [standard,alternative,native]=outputs;
  if(new Set(outputs.map(o=>o.inputHash)).size!==1)failures.push({fixtureId:fixture.id,reason:'Canonical input hashes differ despite common request/budget.'});
  const standardPh=comparisonVerdict(standard,alternative),standardNative=comparisonVerdict(standard,native);
  if(standardPh==='Exact agreement within tolerance')standardPhAgreements++;
  else disagreements.push({fixtureId:fixture.id,pair:['pok-standard','pok-ph'],verdict:standardPh});
  if(native.status==='COMPLETE'){
    if(standardNative==='Exact agreement within tolerance')nativeAgreements++;
    else disagreements.push({fixtureId:fixture.id,pair:['pok-standard','ompeval-native'],verdict:standardNative});
  }
  rows.push({fixtureId:fixture.id,description:fixture.description,request,results:outputs.map(compact),comparisons:{standardPh,standardNative},nativeComparable:native.status==='COMPLETE'});
  if((index+1)%30===0)console.log(`Compared ${index+1}/${corpus.fixtures.length} real canonical fixtures.`);
}

const limitations=[
  'POK Standard and POK + PH share validation, enumeration/sampling, RNG, range weighting, and pot eligibility. Their agreement is an alternative-evaluator comparison, not independent validation of the shared equity algorithm.',
  'OMPEval has separate native enumeration/evaluation but shares POK boundary validation. Unsupported weighted ranges, side pots or work limits are excluded explicitly, never counted as exact agreement.',
  'Fixture inputs are synthetic reproducible study data, not private played hands. All compared engines use identical normalized budgets and permission; engine/request identity is excluded from canonical input hashing.',
  'Exact tolerance is 1e-12 for fractional shares, 1e-9 for expected chips. Ties are raw tied-outcome fractions; equity includes fractional pot share.',
  'Node timings include canonical validation, hashing and async yielding; they do not measure browser responsiveness, worker roundtrip, WASM network loading or strategy strength.',
];
const report={schemaVersion:1,observedAt,status:failures.length||disagreements.length?'FAIL':'PASS_WITH_UNSUPPORTED',fixtureSource:'tests/fixtures/engine-equity-v1.json',sourceSha256,generatorSeed:corpus.generatorSeed,
  normalizedRequestChanges:{executionPermission:'local-native-opt-in',memoryMiB:256,timeMs:15000,reason:'One common request across all engines; native hard job limit and deadline are explicit. All other inputs/weights/seed remain unchanged.'},
  counts:{fixtures:rows.length,validatedCanonicalResults:rows.length*3,standardPhExactAgreements:standardPhAgreements,nativeExactAgreements:nativeAgreements,nativeUnsupported,disagreements:disagreements.length,failures:failures.length},limitations,fixtures:rows};
writeFileSync('ENGINE_COMPARISON.json',JSON.stringify(report,null,2)+'\n');
writeFileSync('ENGINE_DISAGREEMENTS.json',JSON.stringify({schemaVersion:1,observedAt,sourceSha256,status:failures.length||disagreements.length?'FAIL':'NO_DISAGREEMENTS_IN_COMPARABLE_RESULTS',disagreements,failures,unsupported,limitations:[limitations[0],limitations[1],'Unsupported does not mean PASS and has no fabricated numeric result.']},null,2)+'\n');

// Exactly three predetermined timing repetitions. No warmup/retry-until-fast loop.
const fixed=common(corpus.fixtures.find(f=>f.id==='documented-990')!.request);
const multi=common(fromEquityRequest({hero:parseCards('AsAh'),opponents:['KsKh','QcQd','TcTd','9s9h','8c8d'].map(h=>({hand:parseCards(h)})),board:parseCards('2c3d7h'),method:'monte-carlo',samples:10000,seed:19},'pok-standard',0));
multi.requestId='benchmark-sixway-10000';
const seeds=[19,381,7401],orders:EngineId[][]=[['pok-standard','pok-ph','ompeval-native'],['pok-ph','ompeval-native','pok-standard'],['ompeval-native','pok-standard','pok-ph']];
const timingRows:{workload:string;repetition:number;seed:number;engine:EngineId;wallMs:number;result:ReturnType<typeof compact>}[]=[];
for(const [repetition,order] of orders.entries())for(const workload of ['fixed-990','sixway-mc-10000']){
  const request={...(workload==='fixed-990'?fixed:multi),seed:seeds[repetition]};
  for(const engine of order){
    if(workload==='sixway-mc-10000'&&engine==='ompeval-native')continue;
    const timingStarted=performance.now(),output=await run(request,engine);
    timingRows.push({workload,repetition:repetition+1,seed:seeds[repetition],engine,wallMs:performance.now()-timingStarted,result:compact(output)});
    if(output.status!=='COMPLETE')throw new Error(`Benchmark incomplete: ${workload}/${engine}/${output.completionReason}`);
    if(output.counts.completed!==(workload==='fixed-990'?990:10000))throw new Error('Benchmark count differed from prescribed workload.');
  }
}
const summary=[];
for(const workload of ['fixed-990','sixway-mc-10000'])for(const engine of engines){
  const matching=timingRows.filter(r=>r.workload===workload&&r.engine===engine);
  if(!matching.length)continue;
  const times=matching.map(r=>r.wallMs).sort((a,b)=>a-b),rates=matching.map(r=>r.result.counts.completed/r.wallMs*1000).sort((a,b)=>a-b);
  summary.push({workload,engine,repetitions:matching.length,wallMs:{median:times[1],minimum:times[0],maximum:times[2]},completedOutcomesPerSecond:{median:rates[1],minimum:rates[0],maximum:rates[2]}});
}
const nativeMonteCarlo=validateResult(await runNativeCanonical({...multi,engine:'ompeval-native'}));
if(nativeMonteCarlo.status!=='UNSUPPORTED')throw new Error('Native Monte Carlo must remain explicitly unsupported.');
const existingBenchmark=(()=>{try{return JSON.parse(readFileSync('ENGINE_BENCHMARKS.json','utf8'))}catch{return {schemaVersion:1}}})();
// Import already completed real browser observations without rerunning them.
const browser=(()=>{
  try{
    const raw=readFileSync('artifacts/engine-browser-benchmarks.json'),data=JSON.parse(raw.toString('utf8'));
    if(data.metrics.length!==6||data.metrics.some((r:any)=>r.samples!==10000||!['pok-standard','pok-ph'].includes(r.engine)||!Number.isFinite(r.endToEndMs)))throw new Error('Unexpected browser evidence shape.');
    const summary=['pok-standard','pok-ph'].map(engine=>{const rows=data.metrics.filter((r:any)=>r.engine===engine);if(rows.length!==3)throw new Error('Browser evidence needs three repetitions per engine.');const stats=(key:string)=>{const values=rows.map((r:any)=>r[key]).sort((a:number,b:number)=>a-b);return {median:values[1],minimum:values[0],maximum:values[2]}};return {engine,repetitions:rows.length,endToEndMs:stats('endToEndMs'),workerElapsedMs:stats('workerElapsedMs'),overheadMs:stats('overheadMs'),frameGapP95Ms:stats('frameGapP95Ms'),frameMaxMs:stats('frameMaxMs')}});
    return {...data,source:'artifacts/engine-browser-benchmarks.json',sourceSha256:createHash('sha256').update(raw).digest('hex'),context:'Actual built Apache engine preview; fresh Edge test context, empty caches, non-loopback requests blocked; real workers and WASM.',workload:{hero:['As','Ah'],board:[],opponentRanges:Array(5).fill('random'),samples:10000,seed:20260930},summary,limitations:['Different workload from Node fixed-opponent flop timing: these are five full random ranges before the flop. Do not compare the Node/browser ratios as engine speedups.','Browser overheadMs includes request validation, input hashing and module preparation; it is not a pure WASM fetch/compile duration.','endToEndMs includes Playwright interaction and waiting for rendered output. UI latency and worker computation are reported separately.','Frame-gap p95 does not imply absence of occasional stalls; maximum observed gaps are retained. No formal accessibility/performance certification.','Both browser engines use the same sampled assignments and fixed seed. These are timing repetitions, not independent statistical trials.']};
  }catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return existingBenchmark.browser;throw error;}
})();
const benchmarks={...existingBenchmark,...(browser?{browser}:{}),node:{observedAt:new Date().toISOString(),runtime:process.version,execution:'development-node plus explicitly selected owned native child; no browser worker',
  ph:{sha256:PH_WASM_SHA256,...ph.metrics,diskReadIntegrityCompileAndInstantiateMs:phDiskReadIntegrityCompileAndInstantiateMs,load:'one real local read, integrity verification, compilation and instantiation; warm instance reused by calculations; no fetch measured'},
  plan:{repetitions:3,seeds,orders,predeclared:true,noTimingBasedReruns:true,sharedRequestBudgets:fixed.budget},
  requests:{fixed990:fixed,sixway10000:multi},summary,observations:timingRows,nativeMonteCarlo:{status:nativeMonteCarlo.status,reason:nativeMonteCarlo.completionReason,benchmarked:false},
  limitations:[...limitations,'The JavaScript heap is runtime-managed; only PH linear-memory allocation and native OS job cap are fixed. This job does not claim to measure per-engine peak JavaScript heap.','Exact-count repetitions echo different seeds only for input completeness; exact enumeration does not consume them. MC paired engines share each predetermined seed and the same sampler; matching samples are not independent replications across evaluators.']}};
writeFileSync('ENGINE_BENCHMARKS.json',JSON.stringify(benchmarks,null,2)+'\n');
console.log(JSON.stringify({status:report.status,counts:report.counts,benchmarks:summary,durationMs:performance.now()-started},null,2));
if(failures.length||disagreements.length)process.exitCode=1;
