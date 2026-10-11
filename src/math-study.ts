import {assertCards} from './cards';
import {evaluate,handCategory} from './evaluator';
import type {EquityRequest} from './equity';
/** Terminal, single eligible pot, no rake/future bets; pot includes the opponent's wager. */
export function terminalCall(pot:number,call:number,equity:number){
 if(!Number.isSafeInteger(pot)||!Number.isSafeInteger(call)||pot<0||call<0||pot>1_000_000_000||call>1_000_000_000||!Number.isFinite(equity)||equity<0||equity>1)throw new Error('Use bounded nonnegative integer chips and a fractional equity.');
 return {threshold:pot+call===0?null:call/(pot+call),incrementalEV:equity*(pot+call)-call};
}
/** Category changes are descriptive candidates, NOT winning outs or equally likely range-conditioned draws. */
export function nextCardCategories(request:EquityRequest){
 const fixed=request.opponents.flatMap(o=>o.hand??(o.range?.length===1?o.range[0].cards:[]));
 const known=[...request.hero,...request.board,...(request.dead??[]),...fixed];assertCards(known);
 if(![3,4].includes(request.board.length))return [];
 const original=handCategory(evaluate([...request.hero,...request.board]));
 return Array.from({length:52},(_,card)=>card).filter(card=>!known.includes(card)).map(card=>({card,category:handCategory(evaluate([...request.hero,...request.board,card]))})).filter(row=>row.category!==original);
}
