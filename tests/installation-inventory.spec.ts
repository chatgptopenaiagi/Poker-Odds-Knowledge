import {test,expect} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
test('read-only three Apache installations in isolated profiles',async({browser})=>{
 const inventory=[];
 for(const path of ['holdem-lab','holdem-strategy-preview','holdem-strategy-validation']){
  const context=await browser.newContext();const errors:string[]=[];
  await context.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(`http://localhost/${path}/`);expect(response?.status()).toBe(200);
  await page.getByRole('button',{name:'Explore first',exact:true}).click();
  const navigation=await page.locator('nav button').allTextContents();
  await page.locator('.topbar-controls button').click();
  const hasCardDesign=await page.getByText('Card design',{exact:true}).count();
  const assets=await page.locator('script[src],link[rel=stylesheet]').evaluateAll(es=>es.map(e=>(e as HTMLScriptElement).src||(e as HTMLLinkElement).href));
  const hashes=[];for(const asset of assets){const r=await page.request.get(asset);expect(r.ok()).toBe(true);hashes.push({url:asset,type:r.headers()['content-type'],sha256:createHash('sha256').update(await r.body()).digest('hex')});}
  const prefs=await page.evaluate(()=>({origin:location.origin,databases:indexedDB.databases().then(ds=>ds.map(d=>d.name)),appearanceKeys:Object.keys(localStorage).filter(k=>k.includes('appearance'))}));
  const dbs=await page.evaluate(()=>indexedDB.databases().then(ds=>ds.map(d=>d.name)));
  await mkdir('artifacts/card-repair',{recursive:true});await page.screenshot({path:`artifacts/card-repair/before-${path}.png`});
  inventory.push({path,navigation,hasCardDesign,assets:hashes,origin:prefs.origin,databases:dbs,errors,browser:browser.version()});expect(errors).toEqual([]);await context.close();
 }
 await writeFile('artifacts/card-repair/installation-browser.json',JSON.stringify(inventory,null,2));
});
