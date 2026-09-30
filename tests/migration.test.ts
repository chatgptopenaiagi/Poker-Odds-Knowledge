import {describe,it,expect} from 'vitest';
import {defaults,validateData,exportData,parseBackup,DB_NAME} from '../src/storage';
import {createHand,act,legalActions} from '../src/game';
describe('HIL 1.0 -> POK schema 2, pure migration',()=>{
 it('preserves a pending hand, deck, revisions, stable lesson IDs and settings without mutating input',()=>{
  const old:any={...defaults(),schema:1,revision:18,onboarded:true};old.settings.locale='ro';
  old.hand=createHand({id:'hil-pending',seats:6,seed:916});
  old.attempts=[{id:'historical-answer',lessonId:'HIL-016',version:1,answer:20,correct:true,errorType:'none',timestamp:'2026-09-30T00:00:00Z'}];
  const before=JSON.stringify(old),migrated=validateData(old);
  expect(migrated.schema).toBe(2);expect(migrated.hand).toEqual(old.hand);expect(migrated.settings).toEqual(old.settings);expect(migrated.attempts).toEqual(old.attempts);expect(migrated.revision).toBe(18);expect(JSON.stringify(old)).toBe(before);expect(DB_NAME).toBe('hil-study-v1');
 });
 it('retains completed hands without double awards and accepts new locales',()=>{
  let hand=createHand({id:'legacy-completed',seats:2,seed:99});while(!hand.result)hand=act(hand,{type:legalActions(hand).canCheck?'check':'call'});
  const migrated=validateData({...defaults(),schema:1,hand,hands:[hand]});migrated.settings.locale='ar';
  expect(parseBackup(exportData(migrated))).toEqual(migrated);expect(migrated.hands).toHaveLength(1);
 });
 it('rejects unknown future versions instead of guessing a migration',()=>{expect(()=>validateData({...defaults(),schema:3})).toThrow(/version/)});
});
