import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { parseCards } from '../src/cards';
import { nativeEngineAvailability, runNative, type NativeRequest } from '../server/native-engine';

// Bounded development verification, never loaded by the website or server.
const corpusUrl = new URL('../artifacts/ph-oracle-corpus.json', import.meta.url);
const raw = await readFile(corpusUrl, 'utf8');
const corpus = JSON.parse(raw) as { seed:number; engine:string; hands:{id:number;cards:string[];phOrdinal:number;referenceScore:number}[] };
if(corpus.hands.length !== 10000) throw new Error('Expected the shared 10000-hand development corpus.');
const started=performance.now();
const result=await runNative({schema:1,op:'evaluate',hands:corpus.hands.map(row=>parseCards(row.cards.join(' ')))});
const evaluationWallMs=performance.now()-started;
const rows=corpus.hands.map((row,i)=>({...row,native:result.ranks![i]})).sort((a,b)=>a.referenceScore-b.referenceScore);
let disagreements=0;
for(let i=0;i<rows.length;i++){
 if(Math.floor(rows[i].native/4096)-1!==Math.floor(rows[i].referenceScore/15**5))disagreements++;
 if(i && (Math.sign(rows[i].native-rows[i-1].native)!==Math.sign(rows[i].referenceScore-rows[i-1].referenceScore) || Math.sign(rows[i].native-rows[i-1].native)!==Math.sign(rows[i].phOrdinal-rows[i-1].phOrdinal)))disagreements++;
}
const known=parseCards('Ac Ad 2c 3d 4h'),remaining=Array.from({length:52},(_,i)=>i).filter(c=>!known.includes(c));
const opponent=remaining.flatMap((a,i)=>remaining.slice(i+1).map(b=>[a,b])).slice(0,80);
const request:NativeRequest={schema:1,op:'equity',ranges:[[known.slice(0,2)],opponent],board:known.slice(2),dead:[],maxStates:250000,deadlineMs:15000};
const begin=performance.now(), equity=await runNative(request), wallMs=performance.now()-begin;
const report={schema:1,checkedUtc:new Date().toISOString(),native:await nativeEngineAvailability(),corpus:{sha256:createHash('sha256').update(raw).digest('hex'),seed:corpus.seed,phEngine:corpus.engine,hands:rows.length,orderingComparisons:rows.length-1,categoryChecks:rows.length,disagreements,evaluationWallMs,peakProcessMemoryBytes:result.peakProcessMemoryBytes},boundedEquity:{states:equity.states,method:equity.method,nativeElapsedMs:equity.elapsedMs,wallMs,fullOutcomeStatesPerSecond:equity.states!/(wallMs/1000),physicalEvaluations:equity.evaluations,peakProcessMemoryBytes:equity.peakProcessMemoryBytes,rangeSizes:equity.rangeCombinationCounts,heroEquity:equity.players![0].equity},limitations:['One bounded workload, not a general performance guarantee','Native symmetry can reduce physical evaluations; states counts multiplicity','PokerKit independent comparison is recorded separately over the identical shared corpus']};
await writeFile(new URL('../docs/OMPEVAL_VERIFICATION.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(disagreements)throw new Error('Native evaluator disagreements detected.');
