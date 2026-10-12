import {it,expect} from 'vitest';
import {act,replayHand} from '../src/game';
import {decisionRequest,riverDecisionExample,terminalDecisionContext} from '../src/decision-explorer';
import {runAnalysis} from '../src/engines/runner';
import {explainStudyCall} from '../src/decision-study';
import {parseCards} from '../src/cards';

import {weightedRiverFixture} from './fixtures/river-decision';
it.each([['KcKd',1,40],['9d9h',0,-20],['AsAh:0.5,KcKd:0.25,9d9h:0.75',1/3,0]])('verifies actual weighted river outcomes for %s',async(range,equity,ev)=>{
 const c=terminalDecisionContext(weightedRiverFixture());if(c.kind!=='supported')throw Error('fixture');
 const r=await runAnalysis(decisionRequest(c.context,String(range),'pok-standard','exact',1));
 // AA beats KK, loses to three nines, ties AA: (.5*.5 + .25*1 + .75*0)/1.5 = 1/3.
 expect(r.result!.equity).toBeCloseTo(Number(equity),12);const d=explainStudyCall(r,40,20);expect(d.kind==='available'&&d.calculations.incrementalEV).toBeCloseTo(Number(ev),10);
});
it('uses one seeded estimate at the break-even weighted range without retrying',async()=>{
 const c=terminalDecisionContext(weightedRiverFixture());if(c.kind!=='supported')throw Error('fixture');
 const r=await runAnalysis(decisionRequest(c.context,'AsAh:0.5,KcKd:0.25,9d9h:0.75','pok-standard','monte-carlo',1));
 const d=explainStudyCall(r,40,20);expect(d.kind==='available'&&d.calculations.comparison).toBe('crosses');expect(r.counts.completed).toBe(2000);
});

it('derives legal terminal price from the reducer and matches an independent royal-board split',async()=>{
 const h=riverDecisionExample(),before=JSON.stringify(h),c=terminalDecisionContext(h);expect(c.kind).toBe('supported');if(c.kind!=='supported')return;
 expect(c.context.pot).toBe(40);expect(c.context.call).toBe(20);expect(c.context.actions).toEqual(['fold','call']);
 const request=decisionRequest(c.context,'random','pok-standard','exact',1),r=await runAnalysis(request);
 expect(r.result!.tie).toBe(1);expect(r.result!.equity).toBe(.5);expect(r.counts.completed).toBe(990);
 // Everyone plays the royal board: half of 60 minus the new 20-chip call = +10.
 const d=explainStudyCall(r,c.context.pot,c.context.call);expect(d.kind==='available'&&d.calculations).toMatchObject({threshold:1/3,incrementalEV:10});
 expect(JSON.stringify(h)).toBe(before);expect(act(h,{type:'call'}).result).toBeTruthy();
 expect(replayHand(act(h,{type:'fold'}),h.revision)).toEqual(h);
});
it('never includes actual opponent holes, burns, undealt cards or future actions',()=>{
 const h=riverDecisionExample(),a=terminalDecisionContext(h);const other=structuredClone(h);other.seats[1].hole=parseCards('9d 9h');other.deck.reverse();other.burns=[];
 const b=terminalDecisionContext(other);expect(b).toEqual(a);if(a.kind!=='supported'||b.kind!=='supported')return;
 const req=decisionRequest(a.context,'random','pok-standard','exact',1);expect(req.dead).toEqual([]);expect(req.players[1].hand).toBeUndefined();
 expect(JSON.stringify(a.context)).not.toContain('deck');expect(Object.isFrozen(a.context.hero)).toBe(true);
 const preRiver=replayHand(act(h,{type:'call'}),4);expect(terminalDecisionContext(preRiver)).toMatchObject({kind:'unsupported',reason:'river'});
});
it('refuses no-call, nonhero, short all-in, refund, unequal pots and invalid visible cards',()=>{
 const base=riverDecisionExample();
 for(const edit of [(h:any)=>h.currentBet=0,(h:any)=>h.turn=1,(h:any)=>h.seats[0].stack=1,(h:any)=>h.returned=[{seat:1,amount:1}],(h:any)=>h.seats[0].totalBet++,(h:any)=>h.board[0]=h.seats[0].hole[0],(h:any)=>h.seats[0].totalBet=NaN,(h:any)=>h.seats[1].folded=true]){const h=structuredClone(base);edit(h);expect(terminalDecisionContext(h).kind).toBe('unsupported')}
 expect(terminalDecisionContext(act(base,{type:'call'})).kind).toBe('unsupported');
});
it('rejects missing/impossible range assumptions and changes the canonical request when assumptions change',()=>{
 const c=terminalDecisionContext(riverDecisionExample());if(c.kind!=='supported')throw Error('fixture');
 for(const range of ['', 'As As','As Ks','garbage'])expect(()=>decisionRequest(c.context,range,'pok-standard','exact',1)).toThrow();
 expect(decisionRequest(c.context,'4c 5d','pok-standard','exact',1).players).not.toEqual(decisionRequest(c.context,'9c 9d','pok-standard','exact',2).players);
});
