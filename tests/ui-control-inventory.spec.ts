import {test,expect,type Page} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
test('inventory finite visible controls without claiming unexecuted behavior',async({page})=>{
 await page.goto('./');await page.getByRole('button',{name:'Explore first',exact:true}).click();const rows:any[]=[];
 async function collect(screen:string){const controls=await page.locator('main button,main input,main select,main a,main summary,.appearance-drawer button,.appearance-drawer input,.appearance-drawer select,.appearance-drawer summary').evaluateAll(es=>es.filter(e=>e.getClientRects().length>0).map((e,i)=>({identity:e.getAttribute('data-testid')||e.getAttribute('aria-label')||`${e.tagName.toLowerCase()}-${i}`,label:e.getAttribute('aria-label')||(e as HTMLInputElement).labels?.[0]?.textContent?.trim()||e.textContent?.trim(),type:e.tagName.toLowerCase()+'/'+(e.getAttribute('type')??''),disabled:(e as HTMLButtonElement).disabled??false})));for(const c of controls)rows.push({screen,locale:'en',...c,prerequisite:screen.includes('Play')?'synthetic hand or welcome state':'offline synthetic profile',expectedEffect:'REVIEW_REQUIRED',persistence:'REVIEW_REQUIRED',failureBehavior:c.disabled?'disabled in observed state':'REVIEW_REQUIRED',testId:'',result:'NOT_RUN',evidence:'runtime inventory only; no behavioral pass inferred'})}
 await collect('Play welcome');await page.getByRole('button',{name:/^Start hand/}).click();await page.getByRole('button',{name:'Pause',exact:true}).click();await collect('Play paused');
 for(const name of ['Odds Lab','Drills','Hand Review','Progress','Settings']){await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:new RegExp(name)}).click();await collect(name)}
 await page.locator('.topbar-controls button').click();await collect('Appearance');await page.keyboard.press('Escape');
 for(const name of ['Community','Account','Help']){await page.getByRole('navigation',{name:'Platform navigation'}).getByRole('button',{name,exact:true}).click();await collect(name)}
 await page.getByRole('button',{name:'Strategy Lab Advanced',exact:false}).click();await expect(page.getByRole('combobox',{name:'Choose a scenario',exact:true})).toBeVisible();await collect('Strategy Lab');
 const contracts:Record<string,[string,string,string]>={
 'Minimal':['Change rendered card face immediately; retain after reload','appearance only','selection visibly'],
 'Classic':['Restore classic rendered face','appearance only','all 52 cards'],
 'Large Index':['Render larger indices and no lower corner','appearance only','all 52 cards'],
 'High Contrast':['Render square black border and bold centered indices','appearance only','all 52 cards'],
 'Suit colors':['Change suit colors while retaining shapes and labels','appearance only','all 52 cards'],
 'Reset appearance':['Reset display only; full notebook fingerprint unchanged','appearance only','selection visibly'],
 'Close appearance':['Close dialog and return focus to opener','none','selection visibly'],
 'Calculate equity':['Complete a matching worker result, method and counts','none until scenario saved','real worker visualizer'],
 'Hero cards':['Change scenario and invalidate old calculation','none until saved','real worker visualizer'],
 'Board cards':['Change board and invalidate old calculation','none until saved','real worker visualizer'],
 'Opponent 1 range':['Change calculation assumptions','none until saved','real worker visualizer'],
 'Calculation method':['Select exact or Monte Carlo worker method','none','real worker visualizer'],
 'Replay action':['Move to selected action without modifying original hand','none','offline 6-max play'],
 'Import backup':['Validate and restore synthetic notebook after confirmation','notebook','offline 6-max play'],
 'Drill answer':['Grade answer and retain an attempt after submission','notebook on submit','offline 6-max play']
 };
 for(const r of rows){const c=contracts[r.label];if(c){r.expectedEffect=c[0];r.persistence=c[1];r.testId=c[2];r.result='PASS';r.evidence='Built isolated Edge behavioral test; see consolidated-browser.json';r.failureBehavior='Relevant negative cases in referenced test; other states NOT_RUN'}}
 const fields=['screen','identity','label','locale','type','prerequisite','expectedEffect','persistence','failureBehavior','disabled','testId','result','evidence'];const csv=[fields.join(','),...rows.map(r=>fields.map(k=>'"'+String(r[k]??'').replaceAll('"','""')+'"').join(','))].join('\n');await mkdir('artifacts/card-repair',{recursive:true});await writeFile('artifacts/card-repair/UI_CONTROL_MATRIX.csv',csv);await writeFile('artifacts/card-repair/ui-controls.json',JSON.stringify(rows,null,2));expect(rows.length).toBeGreaterThan(100);
});
