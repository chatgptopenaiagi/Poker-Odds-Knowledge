import {test,expect,type Page} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createHand,act,legalActions} from '../src/game';
const defaults=()=>({schema:2,revision:0,settings:{locale:'en',seats:6,stack:1000,smallBlind:5,bigBlind:10,mode:'learn',advanced:false,reducedMotion:true,speed:650},hand:null,hands:[],attempts:[],scenarios:[],onboarded:false});
const key='pok:strategy-validation:appearance:v1';
const names=['Classic','Large Index','Minimal','High Contrast'];
const records:unknown[]=[];
const faults=new WeakMap<Page,string[]>();
test.beforeEach(async({page,context})=>{
 const errors:string[]=[];faults.set(page,errors);
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(!['127.0.0.1','localhost'].includes(u.hostname)&&!['data:','blob:'].includes(u.protocol)){errors.push('external '+u.origin);return r.abort()}return r.continue()});
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>{if(r.failure()?.errorText!=='net::ERR_ABORTED')errors.push(r.failure()?.errorText??'request failed')});
 await page.goto('./');await page.getByRole('button',{name:'Explore first',exact:true}).click();await mkdir('artifacts/card-repair',{recursive:true});
});
test.afterEach(async({page,browser},info)=>{records.push({test:info.title,status:info.status,errors:faults.get(page),browser:browser.version(),origin:page.url()});await writeFile('artifacts/card-repair/card-measurements.json',JSON.stringify(records,null,2));expect(faults.get(page)).toEqual([])});
async function open(page:Page){await page.locator('.topbar-controls button').click();await expect(page.locator('.appearance-drawer')).toBeVisible()}
async function notebook(page:Page){return page.evaluate(()=>new Promise<any>((resolve,reject)=>{const r=indexedDB.open('pok-strategy-validation-study-v1',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result;const tx=db.transaction('state');const g=tx.objectStore('state').get('hil:session');g.onsuccess=()=>resolve(g.result);tx.oncomplete=()=>db.close()}}))}
async function fixture(page:Page,seats=2){let hand=createHand({seats,seed:1011,button:0});if(seats===6){for(let i=0;i<100&&!hand.result;i++){const legal=legalActions(hand);hand=act(hand,{type:legal.canCheck?'check':'call'})}expect(hand.result).toBeTruthy()}const data={...defaults(),onboarded:true,hand};data.settings.seats=seats;data.settings.mode='guess';await page.evaluate(data=>new Promise<void>((resolve,reject)=>{const r=indexedDB.open('pok-strategy-validation-study-v1',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result;const tx=db.transaction('state','readwrite');tx.objectStore('state').put(data,'hil:session');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)}}),data);await page.reload();await expect(page.getByTestId('poker-table')).toBeVisible();if(seats===2)expect((await notebook(page)).hand.turn).toBe(0)}

test('selection visibly changes the shared renderer and survives reload without changing frozen game state',async({page})=>{
 await fixture(page);const before=await notebook(page);await open(page);
 const preview=page.locator('.appearance-preview .card');const initial=await preview.screenshot();
 await page.getByRole('button',{name:'Minimal',exact:true}).click();
 await expect(preview.locator('i')).toBeHidden();await expect(preview).toHaveCSS('border-bottom-width','3px');
 const after=await preview.screenshot();expect(createHash('sha256').update(initial).digest('hex')).not.toBe(createHash('sha256').update(after).digest('hex'));
 await page.getByLabel('Suit colors',{exact:true}).selectOption('four');await page.keyboard.press('Escape');
 await expect(page.locator('.topbar-controls button')).toBeFocused();
 await expect(page.locator('.seat.hero .card').first()).toHaveCSS('border-bottom-width','3px');expect(await notebook(page)).toEqual(before);
 await page.reload();expect(await notebook(page)).toEqual(before);await expect(page.locator('.seat.hero .card').first()).toHaveCSS('border-bottom-width','3px');
 await open(page);await expect(page.getByRole('button',{name:'Minimal',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Reset appearance',exact:true}).click();await page.keyboard.press('Escape');expect(await notebook(page)).toEqual(before);
 await expect(page.locator('.seat.hero .card').first().locator('i')).toBeVisible();
 records.push({fingerprintBefore:createHash('sha256').update(JSON.stringify(before)).digest('hex'),fingerprintAfter:createHash('sha256').update(JSON.stringify(await notebook(page))).digest('hex')});
});

test('all 52 cards in all four designs and both suit modes have readable distinct rendered faces',async({page})=>{
 await open(page);await page.getByText('Preview all 52 cards',{exact:true}).click();
 const gallery=page.locator('.deck-gallery');const signatures=[];const hashes=[];
 for(const name of names){await page.getByRole('button',{name,exact:true}).click();
  for(const mode of ['two','four']){await page.getByLabel('Suit colors',{exact:true}).selectOption(mode);
   const faces=gallery.locator('.card:not(.back)');await expect(faces).toHaveCount(52);
   const rows=await faces.evaluateAll(es=>es.map(e=>{const b=e.querySelector('b')!;const s=e.querySelector('span')!;const r=e.getBoundingClientRect(),br=b.getBoundingClientRect(),sr=s.getBoundingClientRect(),cs=getComputedStyle(e);return {rank:b.textContent,suit:s.textContent,label:e.getAttribute('aria-label'),color:cs.color,bg:cs.backgroundColor,font:getComputedStyle(b).fontFamily,size:getComputedStyle(b).fontSize,border:cs.borderBottomWidth,align:cs.alignItems,corner:getComputedStyle(e.querySelector('i')!).display,inside:br.left>=r.left&&br.right<=r.right+.5&&sr.bottom<=r.bottom+.5}}));
   expect(new Set(rows.map(r=>r.label)).size).toBe(52);for(let n=0;n<52;n++){expect(rows[n].rank).toBe('23456789TJQKA'[Math.floor(n/4)].replace('T','10'));expect(rows[n].suit).toBe(['♣','♦','♥','♠'][n%4]);expect(rows[n].inside,`${name} ${mode} card ${n}`).toBe(true)}
   expect(new Set(rows.slice(0,4).map(r=>r.color)).size).toBe(mode==='four'?4:2);
   await expect(gallery.locator('.back')).toHaveAttribute('aria-label','Hidden card');await expect(gallery.locator('.card-slot')).toHaveAttribute('aria-label','Empty card slot');
   if(mode==='four'){const bytes=await gallery.screenshot({path:`artifacts/card-repair/deck-${name.replaceAll(' ','-')}.png`});hashes.push(createHash('sha256').update(bytes).digest('hex'));signatures.push(JSON.stringify(rows[35]));records.push({name,mode,ten:rows[35],hash:hashes.at(-1)})}
  }
 }
 expect(new Set(hashes).size).toBe(4);expect(new Set(signatures).size).toBe(4);
});

test('legacy migration, invalid IDs, cross-tab sync and storage-denied fallback',async({page,context})=>{
 await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({version:1,mode:'dark',palette:'rose',cardScale:140})),key);await page.reload();await open(page);
 await expect(page.getByRole('button',{name:'Classic',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.getByLabel('Card size',{exact:true})).toHaveValue('140');
 const second=await context.newPage();await second.goto(page.url());await page.getByRole('button',{name:'Large Index',exact:true}).click();await expect(second.locator('.welcome-cards .card').first()).toHaveCSS('border-bottom-width','2px');
 await second.evaluate(k=>localStorage.setItem(k,JSON.stringify({version:1,cardDesign:'bad',suitColors:'bad'})),key);await expect(page.getByRole('button',{name:'Classic',exact:true})).toHaveAttribute('aria-pressed','true');await second.close();
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Synthetic quota failure','QuotaExceededError')}});
 await page.getByRole('button',{name:'Minimal',exact:true}).click();await expect(page.locator('.appearance-preview .card')).toHaveCSS('border-bottom-width','3px');await expect(page.locator('p[role=status]')).toContainText('could not save appearance');
});

test('enlarged layout, Romanian labels, narrow screen and RTL retain stable card order',async({page})=>{
 await fixture(page,6);await open(page);await page.getByRole('button',{name:'Increase text size',exact:true}).click();await page.getByLabel('Card size',{exact:true}).selectOption('140');await page.keyboard.press('Escape');
 for(const text of [112,200]){
  if(text===200){await open(page);for(let i=0;i<4;i++)await page.getByRole('button',{name:'Increase text size',exact:true}).click();await page.keyboard.press('Escape')}
  for(const width of [1536,430]){await page.setViewportSize({width,height:960});const geometry=await page.locator('.poker-table').evaluate(e=>{const r=e.getBoundingClientRect();return Array.from(e.querySelectorAll('.seat,.board-area')).map(s=>{const a=s.getBoundingClientRect();return a.top>=r.top&&a.bottom<=r.bottom+1})});expect(geometry.every(Boolean)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`artifacts/card-repair/layout-${text}-${width}.png`,fullPage:true});}
 }
 await page.getByLabel('Language',{exact:true}).selectOption('ro');await open(page);await expect(page.getByText('Modelul cărților',{exact:true})).toBeVisible();await expect(page.locator('.appearance-preview .card')).toHaveAttribute('aria-label','As de pică');await page.keyboard.press('Escape');
 const boardOrder=await page.locator('.board-cards .card b').allTextContents();const order=await page.locator('.seat.hero .card').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')));await page.getByLabel('Language',{exact:true}).selectOption('ar');await expect(page.locator('html')).toHaveAttribute('dir','rtl');expect(await page.locator('.seat.hero .cards').evaluate(e=>getComputedStyle(e).direction)).toBe('ltr');expect(await page.locator('.seat.hero .card').count()).toBe(order.length);expect(await page.locator('.board-cards').evaluate(e=>getComputedStyle(e).direction)).toBe('ltr');expect(await page.locator('.board-cards .card b').allTextContents()).toEqual(boardOrder);
});
