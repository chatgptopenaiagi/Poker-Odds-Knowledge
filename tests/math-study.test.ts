import {it,expect} from 'vitest';
import {parseCards} from '../src/cards';
import {nextCardCategories,terminalCall} from '../src/math-study';
it('computes terminal call price and EV independently from win probability',()=>{
 expect(terminalCall(80,20,.2)).toEqual({threshold:.2,incrementalEV:0});
 expect(terminalCall(80,20,.5)).toEqual({threshold:.2,incrementalEV:30});
 expect(terminalCall(0,0,0)).toEqual({threshold:null,incrementalEV:0});
 expect(terminalCall(80,0,.5)).toEqual({threshold:0,incrementalEV:40});
 for(const invalid of [-1,NaN,Infinity,1.1])expect(()=>terminalCall(invalid,20,.5)).toThrow();
 expect(()=>terminalCall(80,20,1.01)).toThrow();
});
it('describes next-card improvements without treating them as winning outs',()=>{
 const r={hero:parseCards('As Ks'),board:parseCards('Qs Js 2d 3c'),opponents:[{hand:parseCards('9s 8s')}]};
 const rows=nextCardCategories(r);const flush=rows.filter(x=>x.category==='Flush'||x.category==='Straight flush');
 // 13 spades minus 4 hero/board spades minus 2 fixed opponent spades = 7.
 expect(flush).toHaveLength(7);expect(rows.some(x=>x.card===parseCards('Ts')[0]&&x.category==='Straight flush')).toBe(true);
 expect(rows.some(x=>r.opponents[0].hand.includes(x.card))).toBe(false);
 expect(nextCardCategories({...r,board:[]})).toEqual([]);
 expect(nextCardCategories({...r,board:parseCards('Qs Js 2d 3c 4h')})).toEqual([]);
});
