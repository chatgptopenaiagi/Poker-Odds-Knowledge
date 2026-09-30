import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { nativeEngineAvailability, runNative, validateNativeRequest, type NativeRequest } from '../server/native-engine';
import { parseCards, shuffledDeck } from '../src/cards';
import { referenceEvaluate } from '../src/evaluator';
import { equitySteps, type EquityRequest } from '../src/equity';

const cards = parseCards;
const make = (hands: string[], board: string, dead = ''): Extract<NativeRequest, {op:'equity'}> => ({schema:1,op:'equity',ranges:hands.map(h=>[cards(h)]),board:cards(board),dead:cards(dead),maxStates:250000,deadlineMs:15000});
function exact(request: EquityRequest) { const work=equitySteps({...request,method:'exact'});let step=work.next();while(!step.done)step=work.next();return step.value; }
function oracleRequest(r: Extract<NativeRequest, {op:'equity'}>): EquityRequest {return {hero:r.ranges[0][0],board:r.board,dead:r.dead,opponents:r.ranges.slice(1).map(range=>({range:range.map(c=>({cards:c as [number,number],weight:1}))}))};}

describe('actual pinned OMPEval child (no mock native transport)',()=>{
 it('has a verified built binary and enforced Windows memory job',async()=>{
  expect(await nativeEngineAvailability()).toMatchObject({available:true,code:'built_and_hash_verified'});
  const info=await runNative({schema:1,op:'info'});
  expect(info).toMatchObject({threads:1,memoryLimitBytes:268435456,maxStates:250000,seed:null});
  expect(info).toHaveProperty('memoryGuard','Windows job process limit');
 });
 it('matches all categories, wheel, kickers and suit-independent ties',async()=>{
  const examples=['As Kd Qh Jc 9s','As Ad Qh Jc 9s','As Ad Qh Qc 9s','As Ad Ah Jc 9s','As 2d 3h 4c 5s','As Js 8s 5s 2s','As Ad Ah Jc Js','As Ad Ah Ac Js','As Ks Qs Js Ts','Ac Kc Qc Jc Tc','As Ad Qh Jc 8s','Ks Kd Kh Ac As 2d 3c'];
  const hands=examples.map(cards), result=await runNative({schema:1,op:'evaluate',hands});
  expect(result.ranks!.slice(0,9).map(n=>Math.floor(n/4096)-1)).toEqual([0,1,2,3,4,5,6,7,8]);
  expect(result.ranks![8]).toBe(result.ranks![9]);expect(result.ranks![1]).toBeGreaterThan(result.ranks![10]);
  for(let i=0;i<hands.length;i++)for(let j=0;j<hands.length;j++)expect(Math.sign(result.ranks![i]-result.ranks![j])).toBe(Math.sign(referenceEvaluate(hands[i])-referenceEvaluate(hands[j])));
 });
 it('cross-checks 2400 generated five/six/seven-card hands against independent best-of-21 ordering',async()=>{
  const hands=Array.from({length:2400},(_,i)=>shuffledDeck(39130+i).slice(0,5+i%3));
  const ranks=(await runNative({schema:1,op:'evaluate',hands})).ranks!;
  const rows=hands.map((h,i)=>({ref:referenceEvaluate(h),native:ranks[i]})).sort((a,b)=>a.ref-b.ref);
  for(let i=0;i<rows.length;i++) {expect(Math.floor(rows[i].native/4096)-1).toBe(Math.floor(rows[i].ref/15**5));if(i)expect(Math.sign(rows[i].native-rows[i-1].native)).toBe(Math.sign(rows[i].ref-rows[i-1].ref));}
 });
 it('enumerates all fixed-hand flop990 outcomes and emits exact-count progress',async()=>{
  const request=make(['Ac Ad','Kc Kd'],'2c 3d 4h'), progress:number[]=[];
  const result=await runNative(request,{onProgress:p=>progress.push(p.states)}), reference=exact(oracleRequest(request));
  expect(result.states).toBe(990);expect(result.players![0]).toMatchObject({wins:891,losses:75,ties:24,tieShare:12});
  expect(result.players![0].equity).toBeCloseTo(reference.equity,12);expect(progress.at(-1)).toBe(990);expect(result.uncertainty).toBeNull();
 });
 it('enumerates every legal river opponent combination and preserves board-playing ties',async()=>{
  const request=make(['2c 3d','4c 5d'],'As Ks Qs Js Ts');
  const known=new Set([...request.ranges[0][0],...request.board]), remaining=Array.from({length:52},(_,i)=>i).filter(c=>!known.has(c));
  request.ranges[1]=remaining.flatMap((a,i)=>remaining.slice(i+1).map(b=>[a,b]));
  const result=await runNative(request);expect(result.states).toBe(990);expect(result.players![0]).toMatchObject({wins:0,ties:990,losses:0,tieShare:495,equity:.5});
 });
 it('supports six players and counts six-way ties as one sixth',async()=>{
  const result=await runNative(make(['2c 3d','4c 5d','6c 7d','8c 9d','Tc Jd','Qc Kd'],'As Ks Qs Js Ts'));
  expect(result.states).toBe(1);expect(result.winsByPlayerMask![63]).toBe(1);
  result.players!.forEach(p=>{expect(p.ties).toBe(1);expect(p.equity).toBeCloseTo(1/6,15);expect(p.tieShare).toBeCloseTo(1/6,15);});
 });
 it('supports six-player flop666 and explicit dead-card946 enumerations',async()=>{
  for(const request of [make(['Ac Ad','Kc Kd','Qc Qd','Jc Jd','Tc Td','9c 9d'],'2c 3d 4h'),make(['Ac Ad','Kc Kd'],'2c 3d 4h','5s')]) {
   const result=await runNative(request), reference=exact(oracleRequest(request));
   expect(result.states).toBe(request.ranges.length===6?666:946);expect(result.players![0].equity).toBeCloseTo(reference.equity,12);
  }
 });
 it('targets uniformly weighted compatible joint ranges without seat-order bias',async()=>{
  const request=make(['Ac Ad','Kc Kd','Qc Qd'],'2c 3d 4h 8s 9c');
  request.ranges[1]=[cards('Kc Kd'),cards('Qc Kd'),cards('5s 6s')];request.ranges[2]=[cards('Qc Qd'),cards('Kc Qd'),cards('5s 7s')];
  const result=await runNative(request), reference=exact(oracleRequest(request));expect(result.compatibleAssignments).toBe(6);expect(result.players![0].equity).toBeCloseTo(reference.equity,12);
  const reversed={...request,ranges:[request.ranges[0],request.ranges[2],request.ranges[1]]};const swapped=await runNative(reversed);
  expect(swapped.players![0].equity).toBe(result.players![0].equity);expect(swapped.players![1].equity).toBe(result.players![2].equity);
 });
 it('removes board/dead blockers, rejects impossible assignments and excessive work',async()=>{
  const request=make(['Ac Ad','Kc Kd'],'2c 3d 4h 8s 9c');request.ranges[1].push(cards('2c 5d'));
  expect((await runNative(request)).rangeCombinationCounts).toEqual([1,1]);
  await expect(runNative(make(['Ac Ad','Ac Kd'],'2c 3d 4h 8s 9c'))).rejects.toMatchObject({code:'impossible_joint_ranges'});
  await expect(runNative(make(['Ac Ad','Kc Kd'],''))).rejects.toMatchObject({code:'state_budget_exceeded'});
  await expect(runNative({...request,dead:cards('Kc Kd 5d')})).rejects.toMatchObject({code:'empty_range_after_blockers'});
 });
 it('rejects weights, side pots, duplicate cards, duplicate combinations, invalid fields and excessive JSON depth',()=>{
  const request=make(['Ac Ad','Kc Kd'],'2c 3d 4h');
  for(const invalid of [{...request,weights:[1,.5]},{...request,pots:[]},{...request,executable:'cmd.exe'},{...request,seed:1},{...request,board:[0,0,4]},{...request,ranges:[[[48,49],[49,48]],[[44,45]]]}])expect(()=>validateNativeRequest(invalid)).toThrow();
  const exe=fileURLToPath(new URL('../native/bin/pok-ompeval.exe',import.meta.url));
  for(const input of ['{"schema":1,"schema":1,"op":"info"}',JSON.stringify({...request,pots:[]}),JSON.stringify({schema:1,op:'evaluate',hands:[[[[[[[[0]]]]]]]]})]) {
   const child=spawnSync(exe,[],{input,encoding:'utf8',timeout:3000,windowsHide:true,shell:false});expect(child.status).toBe(2);expect(JSON.parse(child.stdout)).toMatchObject({ok:false});
  }
 });
 it('cancels the owned child and permits a clean next calculation',async()=>{
  const controller=new AbortController(), started=performance.now();const pending=runNative(make(['Ac Ad','Kc Kd'],'2c 3d 4h'),{signal:controller.signal});const assertion=expect(pending).rejects.toMatchObject({code:'cancelled'});setTimeout(()=>controller.abort(),5);await assertion;expect(performance.now()-started).toBeLessThan(1500);
  expect((await runNative({schema:1,op:'info'})).ok).toBe(true);
 });
 it('rejects concurrent jobs and pre-cancelled requests without affecting the first job',async()=>{
  const first=runNative({schema:1,op:'info'});await expect(runNative({schema:1,op:'info'})).rejects.toMatchObject({code:'native_busy'});await first;
  await expect(runNative({schema:1,op:'info'},{signal:AbortSignal.abort()})).rejects.toMatchObject({code:'cancelled'});
 });
});
