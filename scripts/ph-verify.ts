/** Separate bounded verification job. Never imported by the browser application. */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { instantiatePHEvaluator, phCategory } from '../src/engines/ph-evaluator';
import { referenceFive, referenceEvaluate, evaluateUnchecked } from '../src/evaluator';
import { seededRandom, shuffledDeck, cardText } from '../src/cards';

const bytes=new Uint8Array(readFileSync('public/engines/ph-evaluator.wasm'));
const engine=await instantiatePHEvaluator(bytes);
mkdirSync('artifacts',{recursive:true});
const census=process.argv.includes('--census');
const counts=Array(9).fill(0), ranks=new Map<number,number>();
let examined=0, disagreements=0, orderingDisagreements=0;
const started=performance.now();
if(census){
  const hand=[0,1,2,3,4];
  for(let a=0;a<48;a++)for(let b=a+1;b<49;b++)for(let c=b+1;c<50;c++)for(let d=c+1;d<51;d++)for(let e=d+1;e<52;e++){
    hand[0]=a;hand[1]=b;hand[2]=c;hand[3]=d;hand[4]=e;
    const ph=engine.evaluateUnchecked(hand),reference=referenceFive(hand);
    const category=phCategory(ph);counts[category]++;examined++;
    if(category!==Math.floor(reference/15**5))disagreements++;
    const prior=ranks.get(ph);if(prior!==undefined&&prior!==reference)disagreements++;ranks.set(ph,reference);
    if((examined&65535)===0&&performance.now()-started>60_000)throw new Error('Bounded census exceeded 60 seconds; incomplete result must not be claimed PASS.');
  }
  const ordered=[...ranks].sort((a,b)=>a[0]-b[0]);
  for(let i=1;i<ordered.length;i++)if(ordered[i][1]<=ordered[i-1][1])orderingDisagreements++;
  const expected=[1302540,1098240,123552,54912,10200,5108,3744,624,40];
  if(JSON.stringify(counts)!==JSON.stringify(expected))throw new Error('Five-card category census disagreed with exact reference counts.');
}else{
  const random=seededRandom(0x50484c41), corpus=[];
  for(let i=0;i<10_000;i++){
    const cards=shuffledDeck(random).slice(0,7),ph=engine.evaluate(cards),reference=referenceEvaluate(cards);examined++;
    if(phCategory(ph)!==Math.floor(reference/15**5))disagreements++;
    const prior=ranks.get(ph);if(prior!==undefined&&prior!==reference)disagreements++;ranks.set(ph,reference);
    corpus.push({id:i,cards:cards.map(cardText),phOrdinal:ph,referenceScore:reference});
  }
  const ordered=[...ranks].sort((a,b)=>a[0]-b[0]);for(let i=1;i<ordered.length;i++)if(ordered[i][1]<=ordered[i-1][1])orderingDisagreements++;
  writeFileSync('artifacts/ph-oracle-corpus.json',JSON.stringify({schemaVersion:1,seed:0x50484c41,engine:engine.version,hands:corpus}));
}
const elapsedMs=performance.now()-started;
const result={schemaVersion:1,observedAt:new Date().toISOString(),method:census?'EXHAUSTIVE FIVE-CARD CENSUS plus independent referenceFive rank mapping':'10,000 seeded seven-card hands plus independent best-of-21 reference',engine:engine.version,sha256:createHash('sha256').update(bytes).digest('hex'),samples:examined,categories:census?counts:undefined,distinctRanks:ranks.size,disagreements,orderingDisagreements,elapsedMs,metrics:engine.metrics,independentOracle:'Original POK reference classifier; external PokerKit check tracked separately',status:disagreements||orderingDisagreements?'FAIL':'PASS'};
writeFileSync(census?'artifacts/ph-census.json':'artifacts/ph-differential.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(disagreements||orderingDisagreements)process.exitCode=1;
if(!census){
  // One bounded measured comparison; warm compile is separately reported above.
  const random=seededRandom(7351),hands=Array.from({length:10_000},()=>shuffledDeck(random).slice(0,7));
  const timings:Record<string,number>={};let checksum=0;
  for(const[name,fn]of [['phChecked',engine.evaluate],['phUnchecked',engine.evaluateUnchecked],['originalUnchecked',evaluateUnchecked]] as const){const t=performance.now();for(let repeat=0;repeat<10;repeat++)for(const hand of hands)checksum^=fn(hand);timings[name]=performance.now()-t;}
  const measured={schemaVersion:1,observedAt:new Date().toISOString(),callsPerRoute:100_000,sevenCardCorpus:10_000,seed:7351,method:'Node real WASM CPU wall time; ten passes per route; no GPU and no browser/worker performance claim',timingsMs:timings,checksum,metrics:engine.metrics};
  writeFileSync('artifacts/ph-node-measurement.json',JSON.stringify(measured,null,2)+'\n');console.log(JSON.stringify(measured,null,2));
}
