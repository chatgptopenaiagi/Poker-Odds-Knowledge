import requestSchema from '../../schemas/solve-request.v1.json';
import resultSchema from '../../schemas/solve-result.v1.json';
import {assertSchema} from '../engines/contract';

export const SOLVER_ID='texas-holdem-java-dcfr' as const;
export const SOLVER_REVISION='e90d1bb4c7cf6fbd433428d6acf41f606e0c8530';
export const SOLVER_ADAPTER='pok-river-1';
export type Combo={cards:string[];weight:number};
export interface SolveRequest {
 schemaVersion:1;requestId:string;analysisRevision:number;operation:'solve';variant:'holdem-high';ruleset:'pok-hu-river-no-rake-v1';
 engine:typeof SOLVER_ID;executionPermission:'local-solver-opt-in';informationScope:'range-study'|'review';
 board:string[];dead:string[];players:{id:string;position:'OOP'|'IP';combinations:Combo[]}[];learner:{playerId:string;cards:string[]};
 pot:number;effectiveStack:number;tree:{betSizes:number[];raiseTo:number[];maxRaises:0|1};
 method:'discounted-cfr';targetGap:number;budget:{iterations:number;timeMs:number;memoryMiB:512;threads:1};
}
export type StrategyHand={cards:string[];probabilities:number[];actionEV:number[];reach:number};
export type StrategyNode={path:string;actor:number;actions:string[];hands:StrategyHand[]};
export interface SolveResult {
 schemaVersion:1;requestId:string;analysisRevision:number;inputHash:string;cacheKey:string;engineId:typeof SOLVER_ID;upstreamRevision:string;adapterVersion:string;
 location:'local-jvm';status:'COMPLETE'|'PARTIAL'|'CANCELLED'|'TIMEOUT'|'UNSUPPORTED'|'ERROR';completionReason:string;method:'DISCOUNTED CFR';
 iterations:number;elapsedMs:number;nodes:StrategyNode[];rootValues:number[];bestResponseValues:number[];
 metric:{name:'NashConv';value:number;unit:'chips';definition:string;exploitabilityHalf:number}|null;
 trace:{iteration:number;gap:number}[];reproducibility:string;limitations:string[];
}
export interface SolutionPack {schemaVersion:1;id:string;version:number;title:string;explanation:string;request:SolveRequest;result:SolveResult;verification:{method:string;gap:number;value:number;tolerance:number};checksum:string}
const key=(cards:string[])=>[...cards].sort().join('');
export function stable(value:unknown):string {return JSON.stringify(value,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v)}
export async function digest(value:unknown):Promise<string>{const data=new TextEncoder().encode(stable(value));return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),n=>n.toString(16).padStart(2,'0')).join('')}
export function validateSolveRequest(value:unknown):SolveRequest {
 if(JSON.stringify(value).length>64000)throw Error('Solve request exceeds 64 KB.');assertSchema(value,requestSchema);const r=structuredClone(value) as SolveRequest;
 if(r.players[0].position!=='OOP'||r.players[1].position!=='IP'||r.players[0].id===r.players[1].id)throw Error('Two distinct players ordered OOP, IP are required.');
 const known=[...r.board,...r.dead];if(new Set(known).size!==known.length)throw Error('Duplicate known cards.');
 for(const p of r.players){const combos=p.combinations;if(new Set(combos.map(c=>key(c.cards))).size!==combos.length)throw Error('Duplicate concrete combination.');for(const c of combos)if(new Set(c.cards).size!==2||c.cards.some(x=>known.includes(x)))throw Error('Blocked or duplicate range card.');if(!combos.some(c=>c.weight>0))throw Error('Empty positive-weight range.');}
 let mass=0,assignments=0;for(const a of r.players[0].combinations)for(const b of r.players[1].combinations)if(a.weight>0&&b.weight>0&&!a.cards.some(c=>b.cards.includes(c))){mass+=a.weight*b.weight;assignments++}
 if(!Number.isFinite(mass)||mass<=0)throw Error('No compatible weighted assignment.');
 for(let seat=0;seat<2;seat++){const max=Math.max(...r.players[seat].combinations.map(c=>c.weight));for(const c of r.players[seat].combinations)if(c.weight>0){if(c.weight/max<1e-6)throw Error('Weight ratios below 1e-6 are unsupported by this float solver.');if(!r.players[1-seat].combinations.some(o=>o.weight>0&&!o.cards.some(x=>c.cards.includes(x))))throw Error('A positive-weight combination has no compatible opponent. Remove it explicitly.');}}
 const hero=r.players.find(p=>p.id===r.learner.playerId);if(!hero?.combinations.some(c=>c.weight>0&&key(c.cards)===key(r.learner.cards)))throw Error('Displayed hand must belong to the learner range.');
 const opponent=r.players.find(p=>p.id!==r.learner.playerId)!;if(!opponent.combinations.some(c=>c.weight>0&&!c.cards.some(x=>r.learner.cards.includes(x))))throw Error('Displayed hand has no compatible opponent.');
 if(r.tree.betSizes.some(b=>b>r.effectiveStack)||r.tree.raiseTo.some(b=>b>r.effectiveStack)||r.tree.maxRaises===0&&r.tree.raiseTo.length>0||r.tree.maxRaises===1&&r.tree.raiseTo.length===0)throw Error('Bet/raise caps conflict with the tree.');
 if(r.tree.maxRaises===1&&r.tree.raiseTo.some(raise=>r.tree.betSizes.some(b=>raise<2*b)))throw Error('This restricted tree accepts full raises only: raise TO must reach twice each bet.');
 const estimatedNodes=3+6*r.tree.betSizes.length*(1+r.tree.raiseTo.length*2);if(assignments*estimatedNodes>100000)throw Error('Tree work budget exceeded. Narrow the ranges.');return r;
}
export async function solveHash(r:SolveRequest):Promise<string>{const {requestId:_,analysisRevision:__,executionPermission:___,learner:____,...game}=validateSolveRequest(r);return digest({...game,upstreamRevision:SOLVER_REVISION,adapterVersion:SOLVER_ADAPTER})}
export function expectedDecisionNodes(r:SolveRequest){
 const out:{path:string;actor:number;actions:string[]}[]=[];
 const visit=(path:string,actor:number,committed:number[],checks:number,raises:number)=>{
  const row={path,actor,actions:[] as string[]};out.push(row);
  if(committed[actor]===committed[1-actor]){row.actions.push('CHECK');if(!checks)visit(path+'/CHECK',1-actor,committed,1,raises);for(const bet of [...r.tree.betSizes].sort((a,b)=>a-b)){const next=[...committed];next[actor]+=bet;row.actions.push('BET '+next[actor]);visit(path+'/BET:'+next[actor],1-actor,next,0,raises)}}
  else{row.actions.push('FOLD','CALL');if(raises<r.tree.maxRaises)for(const target of [...r.tree.raiseTo].sort((a,b)=>a-b)){row.actions.push('RAISE '+target);const next=[...committed];next[actor]=target;visit(path+'/RAISE:'+target,1-actor,next,0,raises+1)}}
 };visit('root',0,[0,0],0,0);return out;
}
export function validateSolveResult(value:unknown,request?:SolveRequest):SolveResult {
 assertSchema(value,resultSchema);const r=value as SolveResult;
 if(request&&(r.requestId!==request.requestId||r.analysisRevision!==request.analysisRevision))throw Error('Stale solve result.');
 if(['COMPLETE','PARTIAL'].includes(r.status)){
  if(!r.nodes.length||!r.metric||r.rootValues.length!==2||r.bestResponseValues.length!==2||Math.abs(r.rootValues[0]+r.rootValues[1])>1e-4)throw Error('Incomplete solver evidence.');
  if(Math.abs(r.metric.value-r.bestResponseValues.reduce((a,b)=>a+b,0))>1e-3||Math.abs(r.metric.value/2-r.metric.exploitabilityHalf)>1e-5)throw Error('Inconsistent best-response metric.');
  const paths=new Set<string>();for(const n of r.nodes){if(paths.has(n.path))throw Error('Duplicate node.');paths.add(n.path);for(const h of n.hands){if(h.probabilities.length!==n.actions.length||h.actionEV.length!==n.actions.length||Math.abs(h.probabilities.reduce((a,b)=>a+b,0)-1)>1e-5)throw Error('Invalid strategy normalization.');if(request&&!request.players[n.actor].combinations.some(c=>key(c.cards)===key(h.cards)))throw Error('Unknown strategy hand.');}}
  if(request&&r.status==='COMPLETE'&&r.metric.value>request.targetGap+1e-6)throw Error('Precision target not reached.');
  if(request){const expected=expectedDecisionNodes(request);if(r.nodes.length!==expected.length)throw Error('Missing or extra public decision nodes.');for(const e of expected){const n=r.nodes.find(n=>n.path===e.path);if(!n||n.actor!==e.actor||n.actions.join('|')!==e.actions.join('|'))throw Error('Result does not match the specified betting tree.');const hands=request.players[e.actor].combinations.filter(c=>c.weight>0).map(c=>key(c.cards)).sort();if(n.hands.map(h=>key(h.cards)).sort().join('|')!==hands.join('|'))throw Error('Missing or duplicate strategy hands.');if(n.hands.some(h=>h.actionEV.some(ev=>Math.abs(ev)>request.pot/2+request.effectiveStack+0.001)))throw Error('Action EV exceeds possible terminal payoffs.');}}
 }else if(r.nodes.length)throw Error('Unfinished job cannot expose unverified strategies.');return r;
}
export async function validatePack(value:unknown):Promise<SolutionPack>{
 if(JSON.stringify(value).length>2_000_000)throw Error('Solution pack exceeds 2 MB.');
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid solution pack.');const p=value as SolutionPack;
 const keys=['schemaVersion','id','version','title','explanation','request','result','verification','checksum'];if(Object.keys(p).some(k=>!keys.includes(k))||keys.some(k=>!(k in p))||p.schemaVersion!==1||!Number.isSafeInteger(p.version)||p.version<1||!/^[-a-z0-9]{1,60}$/.test(p.id)||typeof p.title!=='string'||p.title.length>120||typeof p.explanation!=='string'||p.explanation.length>3000||/[<>\u0000-\u0008]/.test(p.title+p.explanation))throw Error('Invalid pack metadata.');
 validateSolveRequest(p.request);validateSolveResult(p.result,p.request);if(!['COMPLETE','PARTIAL'].includes(p.result.status)||await solveHash(p.request)!==p.result.inputHash)throw Error('Pack does not match its solved model.');
 const v=p.verification;if(!v||Object.keys(v).sort().join(',')!=='gap,method,tolerance,value'||typeof v.method!=='string'||v.method.length>200||/[<>]/.test(v.method)||![v.gap,v.value,v.tolerance].every(Number.isFinite)||v.gap<0||v.tolerance<0||v.tolerance>1)throw Error('Invalid verification metadata.');
 if(!p.result.metric||Math.abs(v.gap-p.result.metric.value)>v.tolerance+1e-6||Math.abs(v.value-p.result.rootValues[0])>v.gap+v.tolerance+1e-6)throw Error('Verification metadata contradicts the reported result.');
 const {checksum,...body}=p;if(!/^[a-f0-9]{64}$/.test(checksum)||await digest(body)!==checksum)throw Error('Solution pack checksum mismatch.');return structuredClone(p);
}
export function decisionRegret(result:SolveResult,path:string,cards:string[],action:string){const node=result.nodes.find(n=>n.path===path),hand=node?.hands.find(h=>key(h.cards)===key(cards));if(!node||!hand||!node.actions.includes(action))throw Error('Out of model: no matching information set/action.');const ev=hand.actionEV[node.actions.indexOf(action)],regret=Math.max(...hand.actionEV)-ev;return {ev,regret,probability:hand.probabilities[node.actions.indexOf(action)],quality:result.metric?.value??null,gradeAvailable:hand.reach>1e-8&&result.status==='COMPLETE',warning:hand.reach<=1e-8?'Unreached information set; conditional EV uses a declared fallback belief.':'Model-relative EV regret. Global gap is not a per-hand error bound; mixed actions may be approximately indifferent.'}}
