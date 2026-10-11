import {test,expect,type Page} from '@playwright/test';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
test('inventory finite visible controls without claiming unexecuted behavior',async({page})=>{
 await page.goto('./');await page.getByRole('button',{name:'Explore first',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);const rows:any[]=[];
 async function collect(screen:string,selector?:string){const controls=await page.locator(selector??(screen==='Appearance'?'.appearance-drawer button,.appearance-drawer input,.appearance-drawer select,.appearance-drawer summary':'main button,main input,main select,main a,main summary')).evaluateAll(es=>es.filter(e=>e.getClientRects().length>0&&!e.closest('[inert]')).map((e,i)=>({identity:e.getAttribute('data-testid')||e.getAttribute('aria-label')||`${e.tagName.toLowerCase()}-${i}`,label:e.getAttribute('aria-label')||(()=>{const label=(e as HTMLInputElement).labels?.[0]?.cloneNode(true) as HTMLElement|undefined;label?.querySelectorAll('select,input,textarea').forEach(c=>c.remove());return label?.textContent?.trim()})()||e.textContent?.trim(),type:e.tagName.toLowerCase()+'/'+(e.getAttribute('type')??''),disabled:(e as HTMLButtonElement).disabled??false})));for(const c of controls)rows.push({screen,locale:'en',...c,prerequisite:screen.includes('Play')?'synthetic hand or welcome state':'offline synthetic profile',expectedEffect:'REVIEW_REQUIRED',persistence:'REVIEW_REQUIRED',failureBehavior:c.disabled?'disabled in observed state':'REVIEW_REQUIRED',testId:'',result:'NOT_RUN',evidence:'runtime inventory only; no behavioral pass inferred'})}
 await collect('Global navigation','nav button,.topbar-controls button,.topbar-controls select');await collect('Play welcome');await page.getByRole('button',{name:/^Start hand/}).click();await page.getByRole('button',{name:'Pause',exact:true}).click();await collect('Play paused');
 for(const name of ['Odds Lab','Drills','Hand Review','Progress','Settings']){await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:new RegExp(name)}).click();if(name==='Hand Review'){await page.getByRole('button',{name:'Load side-pot lesson',exact:true}).click();await expect(page.getByLabel('Saved hand')).toBeVisible()}await collect(name);if(name==='Hand Review'){await page.getByRole('button',{name:'River decision example',exact:true}).click();const explorer=page.getByTestId('decision-explorer').first();await explorer.locator('summary').first().click();await explorer.getByRole('button',{name:'Calculate comparison',exact:true}).click();await expect(explorer.getByTestId('explorer-result')).toBeVisible();await collect('Decision Explorer','.decision-explorer[open] button,.decision-explorer[open] input,.decision-explorer[open] select,.decision-explorer[open] summary')}if(name==='Odds Lab'){await page.getByRole('button',{name:'Calculate equity',exact:true}).click();await expect(page.getByTestId('math-visualizer')).toBeVisible();await collect('Math result','[data-testid=math-visualizer] input,[data-testid=math-visualizer] summary')}}
 await page.locator('.topbar-controls button').click();await collect('Appearance');await page.keyboard.press('Escape');
 for(const name of ['Community','Account','Help']){await page.getByRole('navigation',{name:'Platform navigation'}).getByRole('button',{name,exact:true}).click();await collect(name)}
 await page.getByRole('button',{name:'Strategy Lab Advanced',exact:false}).click();await expect(page.getByRole('combobox',{name:'Choose a scenario',exact:true})).toBeVisible();await collect('Strategy Lab');
 const reportPath=process.env.POK_CONTROL_EVIDENCE;const passedTitles:string[]=[];let reportHash='';
 if(reportPath){const bytes=await readFile(reportPath);reportHash=createHash('sha256').update(bytes).digest('hex');const report=JSON.parse(bytes.toString());const walk=(suite:any)=>{for(const spec of suite.specs??[])if(spec.tests?.length&&spec.tests.every((t:any)=>t.status==='expected'&&t.results?.length===1&&t.results[0].status==='passed'))passedTitles.push(spec.title);for(const child of suite.suites??[])walk(child)};walk(report)}
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
 'Drill answer':['Grade answer and retain an attempt after submission','notebook on submit','offline 6-max play'],
 'River decision example':['Open a temporary reducer-generated river snapshot without saving it','none','river example executes real worker'],
 'Decision Explorer · Fold vs Call':['Open a read-only legal terminal model or explicit unsupported state','none','replay uses decision-time state'],
 'Explorer opponent range':['Invalidate old result and calculate from explicit blocked range','none; temporary study','replay uses decision-time state'],
 'Explorer engine':['Invalidate previous result; selected PH worker returns matching comparison','none','replay uses decision-time state'],
 'Explorer method':['Invalidate previous result; compute exact or fixed-sample comparison','none','replay uses decision-time state'],
 'Calculate comparison':['Return matching real worker result with threshold and EV','none','river example executes real worker'],
 'Inspect Fold':['Explain zero incremental investment while preserving notebook','none','river example executes real worker'],
 'Inspect Call':['Explain additional investment and modeled payout without executing action','none','river example executes real worker'],
 'Raise TO':['Reject a subminimum raise; accept raise-to 40 with correct 35 additional chips','hand','frozen legal raise'],
 'Raise':['Commit one raise, debit stack and pass turn; reject out-of-turn input','hand','frozen legal raise'],
 'All-in':['Commit maximum raise, zero hero stack and pass turn once','hand','frozen legal all-in'],
 'Fold':['Settle once to 995/1005 stacks and retain immutable saved hand','hand and history','frozen legal fold'],
 'Study pot':['Recompute threshold, margin and terminal EV from entered whole chips','none; separate study','decision margins'],
 'Study call':['Recompute threshold, margin and terminal EV from entered whole chips','none; separate study','decision margins'],
 'Calculation seed':['Change worker scenario seed; stale result invalidates','none','selection and cancel'],
 'Sample budget':['Run real worker at selected observation budget','none','real worker visualizer'],
 'Analysis engine':['Run selected evaluator with matching engine attribution','none','each enabled engine'],
 'Compare engines':['Compare same canonical input using enabled real evaluators','none','each enabled engine'],
 'Save scenario':['Persist entered scenario independently of original hand','notebook','offline 6-max play'],
 'Load side-pot lesson':['Load saved lesson with verified 300/200 pots and total 600 chips','notebook','offline 6-max play'],
 'Saved hand':['Load selected side-pot hand and replay its settlement','none','offline 6-max play'],
 'Check answer':['Record correct numeric response with feedback and saved attempt','notebook','offline 6-max play'],
 'Guess first':['Hide drill explanation until an answer is graded','learning mode','offline 6-max play'],
 'Back up progress':['Download synthetic hands and attempts in restorable JSON','file download','offline 6-max play'],
 'Reset progress':['Confirm then clear synthetic notebook; restore tested separately','notebook','offline 6-max play'],
 'Table seats':['Apply table size used in actual heads-up hand','settings','offline heads-up hand'],
 'Apply settings':['Persist table settings and use them for a new hand','settings','offline heads-up hand'],
 'Step':['Advance one paused opponent action','hand','offline heads-up hand'],
 'Preview all 52 cards':['Open complete deck with measured ranks, suits and geometry','none','all 52 cards'],
 'Card size':['Apply enlarged card geometry without overlaps in tested layouts','appearance only','enlarged layout'],
 'Export study pack':['Export matching validated pack for import and reload','download','six actual saved solutions'],
 'Choose a scenario':['Select matching saved scenario and its result','strategy notebook','six actual saved solutions']
 };
 for(const r of rows){const c=contracts[r.label];if(c){r.expectedEffect=c[0];r.persistence=c[1];r.testId=c[2];const title=(r.label==='Calculation seed'||r.label==='Close appearance'||(r.screen==='Progress'&&r.label==='Back up progress'))?undefined:passedTitles.find(t=>t.includes(c[2]));r.result=title?'PASS':'NOT_RUN';r.evidence=title?JSON.stringify({report:reportPath,sha256:reportHash,test:title}):'No matching fresh successful test report supplied';r.failureBehavior='Relevant negative cases in referenced test; other states NOT_RUN'}}
 const occurrences=new Map<string,number>();for(const r of rows){const key=[r.screen,r.type,r.label].join('/');const n=(occurrences.get(key)??0)+1;occurrences.set(key,n);r.identity=key+'/'+n} // Stable within each named screen/state; repeated controls remain distinct.
 const fields=['screen','identity','label','locale','type','prerequisite','expectedEffect','persistence','failureBehavior','disabled','testId','result','evidence'];const csv=[fields.join(','),...rows.map(r=>fields.map(k=>'"'+String(r[k]??'').replaceAll('"','""')+'"').join(','))].join('\n');const output=process.env.POK_AUDIT_DIR??'artifacts/card-repair';await mkdir(output,{recursive:true});await writeFile(output+'/UI_CONTROL_MATRIX.csv',csv);await writeFile(output+'/ui-controls.json',JSON.stringify(rows,null,2));expect(rows.length).toBeGreaterThan(100);
});
