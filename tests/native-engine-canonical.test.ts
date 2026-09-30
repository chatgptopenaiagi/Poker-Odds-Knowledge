import { describe, expect, it } from 'vitest';
import { fromEquityRequest, validateResult, type AnalysisRequest } from '../src/engines/contract';
import { parseCards } from '../src/cards';
import { runNativeCanonical } from '../server/native-canonical';

function request():AnalysisRequest {
 const r=fromEquityRequest({hero:parseCards('Ac Ad'),board:parseCards('2c 3d 4h 8s 9c'),opponents:[{hand:parseCards('Kc Kd')}],method:'exact'},'ompeval-native',12);
 r.executionPermission='local-native-opt-in';r.budget.memoryMiB=256;return r;
}
describe('canonical native boundary, actual local binary',()=>{
 it('rejects malformed requests and simulator-only secrets before native work',async()=>{
  for(const mutate of [(r:any)=>r.futureDeck=[1,2,3],(r:any)=>r.shell='cmd.exe',(r:any)=>r.players[1].hand=['Ac','Kd'],(r:any)=>r.players[1].combinations=[{cards:['Qc','Qd'],weight:1}],(r:any)=>r.budget.memoryMiB=Infinity,(r:any)=>r.players[1]={id:'bad',combinations:[{cards:['Kc','Kd'],weight:-1}]}]) {
   const r=request();mutate(r);await expect(runNativeCanonical(r)).rejects.toThrow();
  }
 });
 it('returns explicit unsupported status for memory constraints and all pot inputs',async()=>{
  const limited=request();limited.budget.memoryMiB=128;const a=await runNativeCanonical(limited);expect(a.status).toBe('UNSUPPORTED');expect(a.result).toBeNull();
  const common=request();common.pots=[{id:'common',amount:20,eligible:['hero','opponent-1']}];const b=await runNativeCanonical(common);expect(b.status).toBe('UNSUPPORTED');expect(b.result).toBeNull();
 });
 it('supports equal non-unit weights only after blocker removal, without flattening unequal live weights',async()=>{
  const r=request();r.players[1]={id:'opponent-1',combinations:[{cards:['Kc','Kd'],weight:.2},{cards:['Qc','Qd'],weight:.2},{cards:['2c','5d'],weight:1}]};
  const a=await runNativeCanonical(r);expect(a.status,a.completionReason).toBe('COMPLETE');expect(a.counts.completed).toBe(2);expect(a.result?.equity).toBe(1);expect(validateResult(a)).toBe(a);
  r.players[1].combinations![1].weight=.4;const b=await runNativeCanonical(r);expect(b.status).toBe('UNSUPPORTED');expect(b.result).toBeNull();
 });
 it('maps a refused large exact calculation to unsupported without returning partial equity',async()=>{
  const r=request();r.board=[];const a=await runNativeCanonical(r);expect(a.status).toBe('UNSUPPORTED');expect(a.result).toBeNull();expect(a.counts.completed).toBe(0);expect(a.completionReason).toBe('state_budget_exceeded');
 });
 it('reports cancellation as no answer and lists uncalled returns outside contested equity',async()=>{
  const r=request();const stopped=await runNativeCanonical(r,AbortSignal.abort());expect(stopped.status).toBe('CANCELLED');expect(stopped.result).toBeNull();
  r.uncalledReturns=[{playerId:'hero',amount:17}];const a=await runNativeCanonical(r);expect(a.status).toBe('COMPLETE');expect(a.uncalledReturns).toEqual(r.uncalledReturns);expect(a.result?.equity).toBe(1);expect(a.result?.perPot).toEqual([]);
 });
});
