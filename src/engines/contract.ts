import schema from '../../schemas/analysis-request.v1.json';
import resultSchema from '../../schemas/analysis-result.v1.json';
import {parseCards,cardText} from '../cards';
import {validateEquityRequest,type EquityRequest,type EquityResult} from '../equity';
export const CONTRACT_VERSION=1;
export type EngineId='pok-standard'|'pok-ph'|'ompeval-native';
export interface AnalysisRequest {
  schemaVersion:1;requestId:string;analysisRevision:number;operation:'equity';variant:'holdem-high';ruleset:'pok-cash-no-rake-v1';
  engine:EngineId|'automatic';method:'auto'|'exact'|'monte-carlo';executionPermission:'browser-only'|'local-native-opt-in';
  informationScope:'player-perspective'|'reveal-all-study'|'review';heroId:string;
  players:{id:string;hand?:string[];combinations?:{cards:string[];weight:number}[]}[];board:string[];dead:string[];seed?:number;
  pots?:{id:string;amount:number;eligible:string[]}[];uncalledReturns?:{playerId:string;amount:number}[];
  budget:{samples:number;states:number;timeMs:number;memoryMiB:number;threads:1};
}
export type Status='COMPLETE'|'PARTIAL'|'CANCELLED'|'TIMEOUT'|'UNSUPPORTED'|'ERROR';
export interface AnalysisResult {
  schemaVersion:1;requestId:string;analysisRevision:number;inputHash:string;cacheKey:string;engineId:EngineId;adapterVersion:string;upstreamRevision:string;
  location:'browser-worker'|'local-native'|'development-node';status:Status;completionReason:string;method:'EXACT ENUMERATION'|'MONTE CARLO ESTIMATE'|'NONE';
  result:EquityResult|null;counts:{kind:'enumerated-showdowns'|'independent-observations'|'none';completed:number;probabilityMass:number|null};
  elapsedMs:number;overheadMs:number;reproducibility:string;uncertainty:string;sharedComponents:string[];limitations:string[];uncalledReturns:{playerId:string;amount:number}[];
}
/** Small fail-closed interpreter for the exact JSON Schema keywords used by v1.
 * The exported schema is the validation source, not a separate permissive parser. */
export function assertSchema(value:unknown,rule:any,path='$'):void {
  if(rule.anyOf){if(!rule.anyOf.some((r:any)=>{try{assertSchema(value,r,path);return true}catch{return false}}))throw new Error(`${path}: no supported schema variant.`);return}
  if(rule.type==='null'&&value!==null)throw new Error(`${path}: expected null.`);
  if(rule.const!==undefined&&value!==rule.const)throw new Error(`${path}: unsupported constant.`);
  if(rule.enum&&!rule.enum.includes(value))throw new Error(`${path}: unsupported value.`);
  if(rule.type==='object'){
    if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw new Error(`${path}: expected plain object.`);
    const obj=value as Record<string,unknown>;
    for(const key of rule.required??[])if(!Object.hasOwn(obj,key))throw new Error(`${path}.${key}: required.`);
    for(const [key,v]of Object.entries(obj)){if(!Object.hasOwn(rule.properties??{},key))throw new Error(`${path}.${key}: unknown field.`);assertSchema(v,rule.properties[key],`${path}.${key}`)}
  }else if(rule.type==='array'){
    if(!Array.isArray(value)||value.length<(rule.minItems??0)||value.length>(rule.maxItems??Infinity))throw new Error(`${path}: invalid array length.`);
    if(rule.uniqueItems&&new Set(value.map(v=>JSON.stringify(v))).size!==value.length)throw new Error(`${path}: duplicate value.`);
    value.forEach((v,i)=>assertSchema(v,rule.items,`${path}[${i}]`));
  }else if(rule.type==='string'){
    if(typeof value!=='string'||value.length<(rule.minLength??0)||value.length>(rule.maxLength??Infinity)||(rule.pattern&&!new RegExp(rule.pattern).test(value)))throw new Error(`${path}: invalid text.`);
  }else if(rule.type==='number'||rule.type==='integer'){
    if(typeof value!=='number'||!Number.isFinite(value)||(rule.type==='integer'&&!Number.isSafeInteger(value))||value<(rule.minimum??-Infinity)||value>(rule.maximum??Infinity))throw new Error(`${path}: invalid finite number.`);
  }
}
export function validateResult(value:unknown):AnalysisResult {
  // JSON transport omits undefined optional fields; reject NaN before that conversion.
  assertSchema(value,resultSchema);const r=value as AnalysisResult;
  if((r.status==='COMPLETE')!==Boolean(r.result))throw new Error('Only completed results may contain an equity answer.');
  if(r.result&&(Math.abs(r.result.win+r.result.tie+r.result.loss-1)>1e-10||r.result.samples!==r.counts.completed||r.method!==r.result.method||r.result.interval[0]>r.result.equity||r.result.interval[1]<r.result.equity))throw new Error('Inconsistent analysis result.');
  return r;
}
export function validateRequest(value:unknown):AnalysisRequest {
  if(JSON.stringify(value).length>900000)throw new Error('Analysis request exceeds 900000 bytes.');
  assertSchema(value,schema);const r=structuredClone(value) as AnalysisRequest;
  const ids=r.players.map(p=>p.id);
  if(new Set(ids).size!==ids.length||!ids.includes(r.heroId))throw new Error('Unique player IDs and a known hero are required.');
  if(![0,3,4,5].includes(r.board.length))throw new Error('Legal boards contain 0, 3, 4 or 5 cards.');
  if(r.players.some(p=>Boolean(p.hand)===Boolean(p.combinations)))throw new Error('Each player requires exactly one hand or concrete range.');
  if(!r.players.find(p=>p.id===r.heroId)!.hand)throw new Error('The hero requires a fixed two-card hand.');
  const known=[...r.board,...r.dead,...r.players.flatMap(p=>p.hand??[])];
  if(new Set(known).size!==known.length)throw new Error('Known cards conflict.');
  for(const p of r.players)if(p.combinations){
    const keys=p.combinations.map(c=>[...c.cards].sort().join(''));
    if(new Set(keys).size!==keys.length)throw new Error('Duplicate concrete combination; combine notation before the boundary.');
    if(!p.combinations.some(c=>c.weight>0&&!c.cards.some(c=>known.includes(c))))throw new Error('Range is empty after blockers.');
  }
  for(const p of r.pots??[])if(p.eligible.some(id=>!ids.includes(id)))throw new Error('Unknown pot eligibility.');
  if(new Set(r.pots?.map(p=>p.id)).size!==(r.pots?.length??0))throw new Error('Duplicate pot ID.');
  if((r.uncalledReturns??[]).some(p=>!ids.includes(p.playerId))||new Set(r.uncalledReturns?.map(p=>p.playerId)).size!==(r.uncalledReturns?.length??0))throw new Error('Invalid uncalled return.');
  const ranges=r.players.filter(p=>p.combinations).map(p=>p.combinations!.filter(c=>c.weight>0&&!c.cards.some(c=>known.includes(c)))).sort((a,b)=>a.length-b.length);
  let visits=0;const used=new Set(known);
  const compatible=(index:number):boolean=>{if(index===ranges.length)return true;for(const c of ranges[index]){if(++visits>100000)throw new Error('Compatibility search budget exceeded; narrow the ranges.');if(c.cards.some(c=>used.has(c)))continue;c.cards.forEach(c=>used.add(c));if(compatible(index+1))return true;c.cards.forEach(c=>used.delete(c))}return false};
  if(!compatible(0))throw new Error('No mutually compatible range assignment.');
  validateEquityRequest(toEquityRequest(r));return r;
}
export function toEquityRequest(r:AnalysisRequest):EquityRequest {
  const ordered=[r.players.find(p=>p.id===r.heroId)!,...r.players.filter(p=>p.id!==r.heroId)];
  return {hero:parseCards(ordered[0].hand!.join('')),board:parseCards(r.board.join('')),dead:parseCards(r.dead.join('')),
    opponents:ordered.slice(1).map(p=>p.hand?{hand:parseCards(p.hand.join(''))}:{range:p.combinations!.map(c=>({cards:parseCards(c.cards.join('')) as [number,number],weight:c.weight/Math.max(...p.combinations!.map(c=>c.weight))}))}),
    method:r.method,samples:r.budget.samples,seed:r.seed??20260930,pots:r.pots?.map(p=>({...p,eligible:p.eligible.map(id=>ordered.findIndex(p=>p.id===id))}))};
}
export function fromEquityRequest(r:EquityRequest,engine:AnalysisRequest['engine'],revision:number,scope:AnalysisRequest['informationScope']='reveal-all-study'):AnalysisRequest {
  return validateRequest(JSON.parse(JSON.stringify({schemaVersion:1,requestId:crypto.randomUUID(),analysisRevision:revision,operation:'equity',variant:'holdem-high',ruleset:'pok-cash-no-rake-v1',engine,method:r.method??'auto',executionPermission:'browser-only',informationScope:scope,heroId:'hero',
    players:[{id:'hero',hand:r.hero.map(cardText)},...r.opponents.map((p,i)=>p.hand?{id:`opponent-${i+1}`,hand:p.hand.map(cardText)}:{id:`opponent-${i+1}`,combinations:p.range!.map(c=>({cards:c.cards.map(cardText),weight:c.weight}))})],
    board:r.board.map(cardText),dead:(r.dead??[]).map(cardText),seed:r.seed??20260930,pots:r.pots?.map(p=>({...p,eligible:p.eligible.map(i=>i===0?'hero':`opponent-${i}`)})),budget:{samples:r.samples??10000,states:250000,timeMs:30000,memoryMiB:128,threads:1}})));
}
function stable(value:any):any {if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>[k,stable(value[k])]));return value}
export async function inputHash(r:AnalysisRequest):Promise<string>{
  // Engine and request identity are excluded so comparison can prove identical inputs.
  const {engine:_,requestId:__,analysisRevision:___,executionPermission:____,...inputs}=r;
  const bytes=new TextEncoder().encode(JSON.stringify(stable(inputs)));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
}
