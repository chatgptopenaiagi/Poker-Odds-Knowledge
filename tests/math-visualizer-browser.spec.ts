import {test,expect} from '@playwright/test';
test('real worker visualizer distinguishes shares, terminal call assumptions and conditional future cards',async({page,context})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',r=>['localhost','127.0.0.1'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
 await page.goto('./');await page.getByRole('button',{name:'Explore first',exact:true}).click();
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:/Odds Lab/}).click();
 await page.getByLabel('Hero cards').fill('As Ah');await page.getByLabel('Board cards').fill('Ks Qs 2d');await page.getByLabel('Opponent 1 range').fill('Kc Kh');await page.getByLabel('Calculation method').selectOption('exact');
 await page.getByRole('button',{name:'Calculate equity',exact:true}).click();
 const v=page.getByTestId('math-visualizer');await expect(v).toContainText('990 completed outcomes');await expect(v.locator('.math-hands .card')).toHaveCount(5);
 const meters=await v.locator('meter').evaluateAll(es=>es.map(e=>(e as HTMLMeterElement).value));expect(meters.reduce((a,b)=>a+b,0)).toBeCloseTo(1,10);
 await expect(v.getByTestId('decision-explanation')).toContainText('20.0%');await v.getByLabel('Study pot',{exact:true}).fill('60');await expect(v.getByTestId('decision-explanation')).toContainText('25.0%');
 await v.getByLabel('Study call',{exact:true}).fill('');await expect(v.getByRole('status')).toContainText('whole chip');await v.getByLabel('Study call',{exact:true}).fill('0');await v.getByLabel('Study pot',{exact:true}).fill('0');await expect(v).toContainText('threshold is undefined');
 await v.getByText('Explore next-card category improvements',{exact:true}).click();const next=v.locator('.next-card-grid button').first();const rankSuit=await next.locator('.card').getAttribute('aria-label');await next.click();await expect(v).toHaveCount(0);await expect(page.getByTestId('equity-result')).toHaveCount(0);
 await expect(page.getByLabel('Board cards')).not.toHaveValue('Ks Qs 2d');await page.getByRole('button',{name:'Calculate equity',exact:true}).click();await expect(v).toContainText('44 completed outcomes');expect(rankSuit).toBeTruthy();
 await page.screenshot({path:'artifacts/card-repair/math-turn.png',fullPage:true});
 await page.getByLabel('Hero cards').fill('2c 3d');await page.getByLabel('Board cards').fill('As Ks Qs Js Ts');await page.getByLabel('Opponent 1 range').fill('4c 5d');await page.getByRole('button',{name:'Calculate equity',exact:true}).click();await expect(v).toContainText('Expected pot share: 50.0%');await expect(v.getByRole('meter',{name:'Tied best',exact:true})).toHaveAttribute('value','1');await expect(v.getByRole('meter',{name:'Sole win',exact:true})).toHaveAttribute('value','0');
 await page.getByLabel('Board cards').fill('');await page.getByLabel('Calculation method').selectOption('monte-carlo');await page.getByLabel('Sample budget').selectOption('2000');await page.getByRole('button',{name:'Calculate equity',exact:true}).click();await expect(v).toContainText('MONTE CARLO ESTIMATE');await expect(v).toContainText('95% fixed-sample interval');await expect(v).toContainText('2,000 completed outcomes');expect(errors).toEqual([]);
});
