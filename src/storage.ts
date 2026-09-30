import type { HandState } from './game';
import {saveStudyJSON,notifyFileError} from './native-files';
import { NOTEBOOK_NAMESPACE } from './preview';
import { replayHand, RULES_VERSION } from './game';
import { assertCards, parseCards } from './cards';
import { expandRange, type WeightedCombo } from './ranges';
import { gradeLesson, lessons } from './lessons';
import { isLocale, type Locale } from './i18n';

export type Mode = 'learn' | 'guess' | 'practice';
export interface Settings { locale: Locale; seats: number; stack: number; smallBlind: number; bigBlind: number; mode: Mode; advanced: boolean; reducedMotion: boolean; speed: number; }
export interface Attempt { id: string; lessonId: string; version: number; answer: number; correct: boolean; errorType: string; timestamp: string; }
export interface StudyScenario { id: string; title: string; hero: string; board: string; dead: string; opponents: string[]; origin?: string; }
export interface SavedData { schema: 2; revision: number; settings: Settings; hand: HandState | null; hands: HandState[]; attempts: Attempt[]; scenarios: StudyScenario[]; onboarded: boolean; }
export const defaults = (): SavedData => ({ schema: 2, revision: 0, settings: {locale:'en',seats:6,stack:1000,smallBlind:5,bigBlind:10,mode:'learn',advanced:false,reducedMotion:false,speed:650},hand:null,hands:[],attempts:[],scenarios:[],onboarded:false });
export const DB_NAME = NOTEBOOK_NAMESPACE==='stable'?'hil-study-v1':`pok-${NOTEBOOK_NAMESPACE}-study-v1`;
export const MAX_IMPORT_BYTES = 5_000_000;
let dbPromise: Promise<IDBDatabase> | undefined;
function database(): Promise<IDBDatabase> {
  if (!dbPromise) dbPromise = new Promise((resolve,reject) => {
    const request = indexedDB.open(DB_NAME,1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('state')) request.result.createObjectStore('state'); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {dbPromise=undefined; reject(request.error)};
    request.onblocked = () => reject(new Error('Close other HIL tabs to finish the storage upgrade.'));
  });
  return dbPromise;
}
export async function loadData(): Promise<SavedData> {
  const db = await database();
  return new Promise((resolve,reject) => { const req = db.transaction('state').objectStore('state').get('hil:session'); req.onsuccess=()=>{try{resolve(req.result ? validateData(req.result) : defaults())}catch(e){reject(e)}}; req.onerror=()=>reject(req.error); });
}
/** One read/write transaction contains the current hand AND unique completed history.
 * Optimistic revision check also prevents two tabs overwriting/awarding the same action. */
export async function saveData(next: SavedData, expectedRevision: number): Promise<SavedData> {
  const db = await database(); const saved = {...next,revision:expectedRevision+1};
  return new Promise((resolve,reject) => {
    const tx=db.transaction('state','readwrite'); const store=tx.objectStore('state'); const req=store.get('hil:session'); let conflict=false;
    req.onsuccess=()=>{ if ((req.result?.revision??0)!==expectedRevision) {conflict=true;tx.abort();return;} store.put(saved,'hil:session'); };
    tx.oncomplete=()=>resolve(saved); tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(new Error(conflict?'Another tab changed this session. Reload before continuing.':'Save aborted; your previous save is intact.'));
  });
}
function plain(value:unknown): value is Record<string,any> {return value!==null && typeof value==='object' && !Array.isArray(value) && [Object.prototype,null].includes(Object.getPrototypeOf(value))}
function finite(value:unknown,min:number,max:number): value is number {return typeof value==='number' && Number.isFinite(value) && value>=min && value<=max}
function safeText(value:unknown,max=300): value is string {return typeof value==='string' && value.length<=max && !/[<>\u0000-\u0008]/.test(value) && !/javascript\s*:|data\s*:text\/html/i.test(value)}
function rejectDangerous(value:unknown,depth=0): void {
  if(depth>30) throw new Error('Backup nesting limit exceeded.');
  if(typeof value==='string' && !safeText(value,2000)) throw new Error('Backup contains unsupported HTML, script, or oversized text.');
  if(value && typeof value==='object') for(const [key,v] of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(key))throw new Error('Unsafe object key.');rejectDangerous(v,depth+1)}
}
function validatedHand(value:unknown):HandState {
  if(!plain(value)||value.version!==1||value.rulesVersion!==RULES_VERSION||!safeText(value.id,100)||!value.id||!Array.isArray(value.log)||value.log.length>500||!Number.isInteger(value.revision)||value.revision!==value.log.length) throw new Error('Unsupported hand record.');
  const initial=value.initial;
  if(!plain(initial)||!Array.isArray(initial.deck)||initial.deck.length!==52 || new Set(initial.deck).size!==52 || !initial.deck.every((c:unknown)=>Number.isInteger(c)&&finite(c,0,51)))throw new Error('Invalid replay deck.');
  // A new session starts with at most 1M per seat, but winnings may concentrate
  // all six seats' chips in one stack before the following hand is saved.
  if(!Array.isArray(initial.seats)||initial.seats.length<2||initial.seats.length>6||!initial.seats.every((s:any)=>plain(s)&&Number.isInteger(s.stack)&&finite(s.stack,0,6_000_000)&&safeText(s.name,50))||initial.seats.reduce((sum:number,seat:any)=>sum+seat.stack,0)>6_000_000)throw new Error('Invalid starting stacks or total chips.');
  if(!safeText(initial.id,100)||initial.id!==value.id||!Number.isInteger(initial.button)||!finite(initial.button,0,initial.seats.length-1)||!Number.isInteger(initial.smallBlind)||!finite(initial.smallBlind,1,100000)||!Number.isInteger(initial.bigBlind)||!finite(initial.bigBlind,initial.smallBlind,100000))throw new Error('Invalid initial replay identity, blinds or button.');
  if(!Array.isArray(value.seats)||value.seats.length!==initial.seats.length||!value.seats.every((s:any)=>plain(s)&&safeText(s.name,50)))throw new Error('Invalid seats.');
  if(!Number.isInteger(value.button)||!finite(value.button,0,value.seats.length-1)||!Number.isInteger(value.smallBlind)||!finite(value.smallBlind,1,100000)||!Number.isInteger(value.bigBlind)||!finite(value.bigBlind,value.smallBlind,100000))throw new Error('Invalid blinds or button.');
  if(value.button!==initial.button||value.smallBlind!==initial.smallBlind||value.bigBlind!==initial.bigBlind)throw new Error('Hand metadata disagrees with its initial replay configuration.');
  // Ignore claimed final payouts/stacks. Rebuild through legal-action validation.
  return replayHand(value as HandState);
}
/** This is feasibility testing, not probability sampling; sorting improves the bounded search. */
function compatibleRanges(ranges:WeightedCombo[][],known:number[]):void {
  const ordered=[...ranges].sort((a,b)=>a.length-b.length),used=new Set(known);let visits=0;
  function search(index:number):boolean {
    if(index===ordered.length)return true;
    for(const combo of ordered[index]){
      if(++visits>20000)throw new Error('Saved range compatibility exceeds the bounded validation budget. Narrow the scenario before importing.');
      if(combo.cards.some(c=>used.has(c)))continue;
      for(const c of combo.cards)used.add(c);
      if(search(index+1))return true;
      for(const c of combo.cards)used.delete(c);
    }
    return false;
  }
  if(!search(0))throw new Error('Saved opponent ranges have no compatible joint card assignment.');
}
export function validatedScenario(s:unknown):StudyScenario {
  if(!plain(s)||!safeText(s.id,100)||!s.id||!safeText(s.title,150)||!safeText(s.hero,30)||!safeText(s.board,50)||!safeText(s.dead,120)||!Array.isArray(s.opponents)||s.opponents.length<1||s.opponents.length>5||!s.opponents.every((v:unknown)=>safeText(v,2000))||(s.origin!==undefined&&!safeText(s.origin,1000)))throw new Error('Invalid saved scenario.');
  const hero=parseCards(s.hero),board=parseCards(s.board),dead=parseCards(s.dead),known=[...hero,...board,...dead];
  assertCards(hero,2);assertCards(known);
  if(![0,3,4,5].includes(board.length)||52-known.length-2*s.opponents.length<5-board.length)throw new Error('Invalid or impossible saved study board.');
  compatibleRanges(s.opponents.map((range:string)=>expandRange(range,known)),known);
  return {id:s.id,title:s.title,hero:s.hero,board:s.board,dead:s.dead,opponents:[...s.opponents],...(s.origin===undefined?{}:{origin:s.origin})};
}
export function validateData(raw:unknown):SavedData {
  rejectDangerous(raw);
  // HIL 1.0 and POK 2 share the original database/key. Migration is pure;
  // opening a notebook never overwrites it. The next explicit save commits v2.
  if(!plain(raw)||![1,2].includes(raw.schema))throw new Error('Unsupported backup version. HIL schema 1 and POK schema 2 are accepted; data was not changed.');
  const s=raw.settings;
  if(!plain(s)||!isLocale(s.locale)||!Number.isInteger(s.seats)||!finite(s.seats,2,6)||!Number.isInteger(s.stack)||!finite(s.stack,1,1_000_000)||!Number.isInteger(s.smallBlind)||!finite(s.smallBlind,1,100000)||!Number.isInteger(s.bigBlind)||!finite(s.bigBlind,s.smallBlind,100000)||s.stack<s.bigBlind||!['learn','guess','practice'].includes(s.mode)||typeof s.advanced!=='boolean'||typeof s.reducedMotion!=='boolean'||!finite(s.speed,0,3000))throw new Error('Invalid settings in backup.');
  if(!Array.isArray(raw.hands)||raw.hands.length>200||!Array.isArray(raw.attempts)||raw.attempts.length>5000||!Array.isArray(raw.scenarios)||raw.scenarios.length>100)throw new Error('Backup exceeds history limits.');
  const hands=raw.hands.map(validatedHand); if(new Set(hands.map(h=>h.id)).size!==hands.length)throw new Error('Duplicate hand IDs.');
  if(hands.some(h=>!h.result))throw new Error('Completed-hand history contains an unfinished hand.');
  if(!raw.attempts.every((a:any)=>plain(a)&&safeText(a.id,100)&&safeText(a.lessonId,100)&&Number.isInteger(a.version)&&finite(a.version,1,100)&&finite(a.answer,-1e10,1e10)&&typeof a.correct==='boolean'&&safeText(a.errorType,100)&&safeText(a.timestamp,100)))throw new Error('Invalid drill history.');
  if(new Set(raw.attempts.map((a:any)=>a.id)).size!==raw.attempts.length)throw new Error('Duplicate drill attempt IDs.');
  const attempts:Attempt[]=raw.attempts.map((a:any)=>{
    const item=lessons.find(l=>l.id===a.lessonId&&l.version===a.version);
    if(!item||!a.id||!Number.isFinite(Date.parse(a.timestamp)))throw new Error('Unsupported lesson version or timestamp in drill history.');
    const grade=gradeLesson(item,a.answer);
    return {id:a.id,lessonId:a.lessonId,version:a.version,answer:a.answer,correct:grade.correct,errorType:grade.errorType??'none',timestamp:a.timestamp};
  });
  const scenarios=raw.scenarios.map(validatedScenario);
  if(new Set(scenarios.map(s=>s.id)).size!==scenarios.length)throw new Error('Duplicate scenario IDs.');
  const settings:Settings={locale:s.locale,seats:s.seats,stack:s.stack,smallBlind:s.smallBlind,bigBlind:s.bigBlind,mode:s.mode,advanced:s.advanced,reducedMotion:s.reducedMotion,speed:s.speed};
  return {schema:2,revision:Number.isSafeInteger(raw.revision)&&raw.revision>=0?raw.revision:0,settings,hand:raw.hand?validatedHand(raw.hand):null,hands,attempts,scenarios,onboarded:raw.onboarded===true};
}
export function parseBackup(text:string):SavedData {if(new TextEncoder().encode(text).length>MAX_IMPORT_BYTES)throw new Error('Backup exceeds 5 MB limit.');return validateData(JSON.parse(text));}
export function exportData(data:SavedData):string{return JSON.stringify(data,null,2)}
export function downloadBackup(data:SavedData){void saveStudyJSON(exportData(data),`POK-backup-${new Date().toISOString().slice(0,10)}.json`).catch(notifyFileError);}
