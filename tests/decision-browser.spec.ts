import {test,expect} from '@playwright/test';
test('decision margins use real tied shares, uncertainty, provenance and Romanian text offline',async({page,context})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await context.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
 await page.goto('./');await page.getByRole('button',{name:'Explore first',exact:true}).click();
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:/Odds Lab/}).click();
 await page.getByLabel('Hero cards').fill('2c 3d');await page.getByLabel('Board cards').fill('As Ks Qs Js Ts');await page.getByLabel('Opponent 1 range').fill('4c 5d');await page.getByLabel('Calculation method').selectOption('exact');
 await page.getByRole('button',{name:'Calculate equity',exact:true}).click();
 const d=page.getByTestId('decision-explanation');await expect(d.getByTestId('equity-margin')).toContainText('30.0 percentage points');await expect(d).toContainText('30.00 chips');
 await d.getByText('Decision calculation provenance',{exact:true}).click();await expect(d).toContainText('browser-worker');await expect(d).toContainText('EXACT ENUMERATION');
 const hash=await d.locator('bdi').textContent();expect(hash).toMatch(/^[a-f0-9]{64}$/);
 await page.getByLabel('Study pot',{exact:true}).fill('20');await page.getByLabel('Study call',{exact:true}).fill('80');await expect(d.getByTestId('equity-margin')).toContainText('-30.0');await expect(d.getByTestId('threshold-comparison')).toContainText('below');
 await page.getByLabel('Study pot',{exact:true}).fill('50');await page.getByLabel('Study call',{exact:true}).fill('50');await expect(d.getByTestId('threshold-comparison')).toContainText('equals');
 await page.getByLabel('Calculation method').selectOption('monte-carlo');await expect(d).toHaveCount(0);await page.getByLabel('Sample budget').selectOption('2000');await page.getByRole('button',{name:'Calculate equity',exact:true}).click();
 // All observations tie; the engine still reports its conservative fixed-N interval.
 await page.getByLabel('Study pot',{exact:true}).fill('50');await page.getByLabel('Study call',{exact:true}).fill('50');await expect(d.getByTestId('threshold-comparison')).toContainText('crosses');await expect(d.getByTestId('decision-interval')).toContainText('95%');
 await page.getByLabel('Language',{exact:true}).selectOption('ro');await expect(d.getByTestId('equity-margin')).toContainText('0,0 puncte procentuale');await expect(d.getByTestId('threshold-comparison')).toContainText('traversează pragul');
 await page.setViewportSize({width:430,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:'artifacts/decision-continuation/decision-ro.png',fullPage:true});expect(errors).toEqual([]);
});
