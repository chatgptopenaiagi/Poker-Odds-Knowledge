import {act,createHand,legalActions,observe,type HandState} from './game';
import {assertCards,parseCards} from './cards';
import {expandRange} from './ranges';
import {fromEquityRequest,type AnalysisRequest} from './engines/contract';

/** Projection only: never carries the deal deck, burns, hidden holes or future log. */
export function terminalDecisionContext(hand:HandState){
 const unsupported=(reason:'river'|'heads-up'|'turn'|'call'|'pot'|'invalid')=>({kind:'unsupported' as const,reason});
 try{
  if(hand.result||hand.street!=='river'||hand.board.length!==5)return unsupported('river');
  if(hand.seats.length!==2||hand.seats.some(s=>s.folded))return unsupported('heads-up');
  if(hand.turn!==0)return unsupported('turn');
  const legal=legalActions(hand),o=observe(hand,0),hero=o.seats[0],opponent=o.seats[1];
  assertCards([...o.hole,...o.board],7);
  if(o.hole.length!==2||hand.seats.some((s,i)=>s.id!==i||[s.stack,s.totalBet,s.streetBet].some(n=>!Number.isSafeInteger(n)||n<0||n>1e9)||s.streetBet>s.totalBet))return unsupported('invalid');
  if(!Number.isSafeInteger(hand.currentBet)||hand.currentBet!==opponent.streetBet||hand.currentBet<=hero.streetBet)return unsupported('call');
  if(!legal.canFold||legal.canCheck||legal.callAmount<=0||legal.callAmount!==opponent.streetBet-hero.streetBet)return unsupported('call');
  if(hand.returned.length||hero.totalBet+legal.callAmount!==opponent.totalBet)return unsupported('pot');
  if(hand.seats.reduce((n,s)=>n+s.stack+s.totalBet,0)!==hand.initialChipTotal||o.pot>1e9)return unsupported('invalid');
  return {kind:'supported' as const,context:Object.freeze({handId:hand.id,revision:hand.revision,hero:Object.freeze([...o.hole]),board:Object.freeze([...o.board]),pot:o.pot,call:legal.callAmount,actions:Object.freeze(['fold','call'] as const)})};
 }catch{return unsupported('invalid')}
}
export type TerminalDecision=Extract<ReturnType<typeof terminalDecisionContext>,{kind:'supported'}>['context'];
export function decisionRequest(context:TerminalDecision,range:string,engine:AnalysisRequest['engine'],method:'exact'|'monte-carlo',revision:number,samples=2000){
 if(!range.trim())throw new Error('Enter an explicit assumed range.');
 const known=[...context.hero,...context.board];assertCards(known,7);
 return fromEquityRequest({hero:[...context.hero],board:[...context.board],opponents:[{range:expandRange(range,known)}],method,samples,seed:20260930},engine,revision,'player-perspective');
}
/** An immutable teaching snapshot generated through the real reducer, not a fabricated result. */
export function riverDecisionExample(){
 const prefix=parseCards('4c 2c 5d 3d 6c As Ks Qs 7c Js 8c Ts');
 let hand=createHand({id:'river-decision-example-v1',seats:2,button:0,deck:[...prefix,...Array.from({length:52},(_,i)=>i).filter(c=>!prefix.includes(c))]});
 hand=act(hand,{type:'call'});hand=act(hand,{type:'check'});
 for(let i=0;i<4;i++)hand=act(hand,{type:'check'});
 return act(hand,{type:'raise',to:20});
}
