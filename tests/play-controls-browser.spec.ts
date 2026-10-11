import {test,expect,type Page} from '@playwright/test';
import {createHand} from '../src/game';
async function notebook(page:Page){return page.evaluate(()=>new Promise<any>((resolve,reject)=>{const r=indexedDB.open('pok-strategy-validation-study-v1',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('state');const q=tx.objectStore('state').get('hil:session');q.onsuccess=()=>resolve(q.result);tx.oncomplete=()=>db.close()}}))}
for(const action of ['raise','all-in','fold'] as const)test(`frozen legal ${action} changes chips once and preserves deck and saved history`,async({page})=>{
 await page.goto('./');await page.getByRole('button',{name:'Explore first',exact:true}).click();
 const initial=createHand({seats:2,seed:1011,button:0});expect(initial.turn).toBe(0);
 await page.evaluate(hand=>new Promise<void>((resolve,reject)=>{const r=indexedDB.open('pok-strategy-validation-study-v1',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite'),store=tx.objectStore('state'),get=store.get('hil:session');get.onsuccess=()=>{const data=get.result;data.hand=hand;data.settings.seats=2;data.settings.mode='guess';store.put(data,'hil:session')};tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)}}),initial);
 await page.reload();await page.getByRole('button',{name:'Pause',exact:true}).click();
 const panel=page.getByTestId('action-panel');
 if(action==='raise'){
  await page.getByLabel('Raise TO',{exact:true}).fill('11');await expect(panel.getByRole('button',{name:'Raise',exact:true})).toBeDisabled();expect((await notebook(page)).hand.revision).toBe(initial.revision);
  await page.getByLabel('Raise TO',{exact:true}).fill('40');await panel.getByRole('button',{name:'Raise',exact:true}).click();
 }else await panel.getByRole('button',{name:action==='fold'?'Fold':'All-in',exact:true}).click();
 await expect.poll(async()=>(await notebook(page)).hand.revision).toBe(initial.revision+1);
 const saved=await notebook(page),h=saved.hand;expect(h.deck).toEqual(initial.deck);
 // Settled contributions remain in history; they are already paid into stacks.
 expect(h.seats.reduce((sum:number,s:any)=>sum+s.stack+(h.result?0:s.totalBet),0)).toBe(2000);
 if(action!=='fold'){
  expect(h.turn).toBe(1);expect(h.seats[0].streetBet).toBe(action==='raise'?40:1000);expect(h.seats[0].stack).toBe(action==='raise'?960:0);
  await expect(panel.getByRole('button',{name:'Fold',exact:true})).toBeDisabled();
 }else{
  expect(h.result.reason).toBe('fold');expect(h.seats.map((s:any)=>s.stack)).toEqual([995,1005]);expect(saved.hands.filter((x:any)=>x.id===h.id)).toHaveLength(1);
  await panel.getByRole('button',{name:'Next hand',exact:true}).click();await expect.poll(async()=>(await notebook(page)).hand.id).not.toBe(h.id);
  expect((await notebook(page)).hands.find((x:any)=>x.id===h.id)).toEqual(h);
 }
});
