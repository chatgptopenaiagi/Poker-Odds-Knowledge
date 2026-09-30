import {parseCards} from '../src/cards';
import {validateRequest,inputHash,toEquityRequest,type AnalysisResult} from '../src/engines/contract';
import {runNative,OMPEVAL_REVISION} from './native-engine';
/** Development-only adapter, called by explicit CLI/tests. No HTTP listener or browser native bridge. */
export async function runNativeCanonical(input:unknown,signal?:AbortSignal):Promise<AnalysisResult>{
  const started=performance.now(),r=validateRequest(input),hash=await inputHash(r);
  const base:AnalysisResult={schemaVersion:1,requestId:r.requestId,analysisRevision:r.analysisRevision,inputHash:hash,cacheKey:`v1/ompeval-native/${OMPEVAL_REVISION}/native-canonical-1/${hash}`,engineId:'ompeval-native',adapterVersion:'native-canonical-1',upstreamRevision:OMPEVAL_REVISION,location:'local-native',status:'UNSUPPORTED',completionReason:'Unsupported semantics.',method:'NONE',result:null,counts:{kind:'none',completed:0,probabilityMass:null},elapsedMs:0,overheadMs:0,reproducibility:'Exact enumeration; deterministic probabilities, nondeterministic timing. Native seed control unavailable; Monte Carlo disabled.',uncertainty:'No interval: complete exact enumeration or no answer.',sharedComponents:['POK boundary validation','OMPEval enumeration','OMPEval hand evaluator'],limitations:['Unweighted sets only; weights are never flattened.','Side pots unsupported: global winner masks cannot recover winners in a smaller eligible subset.','Native random-walk sampling is not exposed; no IID confidence or seed claim.'],uncalledReturns:r.uncalledReturns??[]};
  const unsupported=(reason:string)=>({...base,completionReason:reason,elapsedMs:performance.now()-started});
  if(r.engine!=='ompeval-native'||r.executionPermission!=='local-native-opt-in')return unsupported('Explicit OMPEval selection and local-native-opt-in permission are required.');
  if(r.method==='monte-carlo')return unsupported('OMPEval native Monte Carlo is disabled: seed/dependence semantics differ.');
  if(r.pots?.length)return unsupported('Native side-pot analysis is unsupported; choose a browser engine.');
  if(r.budget.memoryMiB<256)return unsupported('The native process uses a hard 256 MiB Windows job limit; request that budget explicitly.');
  if(r.dead.length>40)return unsupported('Native adapter supports at most 40 explicit dead cards.');
  const ordered=[r.players.find(p=>p.id===r.heroId)!,...r.players.filter(p=>p.id!==r.heroId)];
  const known=[...r.board,...r.dead,...r.players.flatMap(p=>p.hand??[])];
  const ranges=ordered.map(p=>p.hand?[parseCards(p.hand.join(''))]:p.combinations!.filter(c=>c.weight>0&&!c.cards.some(c=>known.includes(c))).map(c=>parseCards(c.cards.join(''))));
  for(const p of ordered)if(p.combinations){const weights=p.combinations.filter(c=>c.weight>0&&!c.cards.some(c=>known.includes(c))).map(c=>c.weight);if(weights.some(w=>w!==weights[0]))return unsupported('Nonuniform compatible range weights are unsupported. Use POK + PH or POK Standard.');}
  try{
    const native=await runNative({schema:1,op:'equity',ranges,board:parseCards(r.board.join('')),dead:parseCards(r.dead.join('')),maxStates:r.budget.states,deadlineMs:Math.min(r.budget.timeMs,15000)},{signal});
    const hero=native.players![0],states=native.states!,elapsed=performance.now()-started,inputs=JSON.parse(JSON.stringify(toEquityRequest(r)));
    const multiplicity=`${native.evaluations} physical showdowns were evaluated, representing ${states} uniform outcome states after symmetry/lookups. Completed count is represented states, not physical evaluator calls.`;
    const result={method:'EXACT ENUMERATION' as const,equity:hero.equity,win:hero.wins/states,tie:hero.ties/states,loss:hero.losses/states,samples:states,evaluatedWeight:states,interval:[hero.equity,hero.equity] as [number,number],confidence:null,seed:r.seed??20260930,attempts:states,elapsedMs:native.elapsedMs!,engineVersion:`native-canonical-1/${OMPEVAL_REVISION}`,inputs,knownCards:[...inputs.hero,...inputs.board,...inputs.dead],rangeCombinationCounts:ranges.slice(1).map(r=>r.length),units:'expected fractional common-pot share (0..1)',limitations:[...base.limitations,'Seed in echoed inputs is unused by exact enumeration; native API receives no seed.','states count complete compatible hole-card assignments times unordered board runouts.',multiplicity],perPot:[]};
    return {...base,status:'COMPLETE',completionReason:'Independent expected state count matches completed native enumeration.',method:'EXACT ENUMERATION',result,counts:{kind:'enumerated-showdowns',completed:states,probabilityMass:states},elapsedMs:elapsed,overheadMs:Math.max(0,elapsed-native.elapsedMs!),limitations:[...base.limitations,multiplicity]};
  }catch(e){const message=(e as Error).message;return {...base,status:/cancel/i.test(message)?'CANCELLED':/time/i.test(message)?'TIMEOUT':/state|budget/i.test(message)?'UNSUPPORTED':'ERROR',completionReason:message,elapsedMs:performance.now()-started}}
}
