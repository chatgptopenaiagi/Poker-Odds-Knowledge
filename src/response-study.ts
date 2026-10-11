import {act,legalActions,observe,replayHand,type HandState} from './game';
import {assertCards} from './cards';
import {expandRange,type WeightedCombo} from './ranges';
import {riverDecisionExample} from './decision-explorer';
import {fromEquityRequest,inputHash,validateResult,type AnalysisRequest,type AnalysisResult} from './engines/contract';

export function terminalBetContext(hand:HandState,bet:number){
 try{
  if(hand.result||hand.street!=='river'||hand.board.length!==5||hand.seats.length!==2||hand.turn!==0||hand.seats.some(s=>s.folded)||hand.returned.length||hand.pots.length)throw Error();
  const o=observe(hand,0),legal=legalActions(hand);
  assertCards([...o.hole,...o.board],7);if(o.hole.length!==2)throw Error();
  if(hand.seats.some((s,i)=>s.id!==i||[s.stack,s.totalBet,s.streetBet].some(n=>!Number.isSafeInteger(n)||n<0||n>1e9)||s.streetBet!==0)||hand.currentBet!==0||hand.seats[0].totalBet!==hand.seats[1].totalBet||hand.seats.reduce((n,s)=>n+s.stack+s.totalBet,0)!==hand.initialChipTotal)throw Error();
  if(!legal.canCheck||!legal.canRaise||!Number.isSafeInteger(bet)||bet<=0||bet<legal.minRaiseTo||bet>Math.min(legal.maxRaiseTo,hand.seats[1].stack)||o.pot<=0||o.pot>1e9)throw Error();
  // The existing reducer validates the hypothetical transition on a copy; it is never saved.
  const next=act(hand,{type:'raise',to:bet}),response=legalActions(next);
  if(next.turn!==1||!response.canFold||response.canCheck||response.callAmount!==bet)throw Error();
  return {kind:'supported' as const,context:Object.freeze({handId:hand.id,revision:hand.revision,hero:Object.freeze([...o.hole]),board:Object.freeze([...o.board]),pot:o.pot,bet,minBet:legal.minRaiseTo,maxBet:Math.min(legal.maxRaiseTo,hand.seats[1].stack)})};
 }catch{return {kind:'unsupported' as const}}
}
export type BetContext=Extract<ReturnType<typeof terminalBetContext>,{kind:'supported'}>['context'];
export function riverBetExample(){return act(replayHand(riverDecisionExample(),6),{type:'check'})}

/** q(combo) = filter weight * rate. Unlisted initial combinations fold. */
export function conditionResponses(initial:string,filter:string,rate:number,known:number[]){
 if(!Number.isFinite(rate)||rate<0||rate>1)throw Error('Call probability must be between 0 and 1.');
 if(!initial.trim()||!filter.trim())throw Error('Explicit initial range and call rule required.');
 const base=expandRange(initial,known),rules=new Map(expandRange(filter).map(c=>[c.cards.join(','),c.weight]));
 const scale=Math.max(...base.map(c=>c.weight));let mass=0,callMass=0;
 const calling:WeightedCombo[]=[];
 for(const c of base){const w=c.weight/scale,q=(rules.get(c.cards.join(','))??0)*rate;mass+=w;const cw=w*q;
  if(w>0&&q>0&&cw===0)throw Error('Conditional weights underflow; use larger relative weights.');
  callMass+=cw;if(cw>0)calling.push({cards:[...c.cards],weight:cw});}
 const callProbability=callMass/mass;
 return {foldProbability:1-callProbability,callProbability,calling,initialCount:base.length};
}
export type ResponseModel=ReturnType<typeof conditionResponses>;
export function responseRequest(c:BetContext,m:ResponseModel,engine:AnalysisRequest['engine'],method:'exact'|'monte-carlo',revision:number,samples=2000){
 return fromEquityRequest({hero:[...c.hero],board:[...c.board],opponents:[{range:m.calling}],method,samples,seed:20260930},engine,revision,'player-perspective');
}
export async function responseValue(c:BetContext,m:ResponseModel,analysis:AnalysisResult|null){
 if(!Number.isSafeInteger(c.pot)||c.pot<=0||!Number.isSafeInteger(c.bet)||c.bet<c.minBet||c.bet>c.maxBet||!Number.isFinite(m.callProbability)||!Number.isFinite(m.foldProbability)||m.callProbability<0||m.callProbability>1||m.foldProbability<0||m.foldProbability>1||Math.abs(m.foldProbability+m.callProbability-1)>1e-12)throw Error('Invalid response model.');
 if(m.callProbability===0){if(m.calling.length||analysis)throw Error('No calling branch expected.');return {ev:c.pot,foldPayoff:c.pot,callPayoff:null,interval:null,estimated:false}}
 if(!analysis)throw Error('A completed conditional equity calculation is required.');
 validateResult(analysis);if(analysis.status!=='COMPLETE'||!analysis.result||analysis.uncalledReturns.length||analysis.result.inputs.pots?.length)throw Error('Unsupported result.');
 const r=analysis.result,method=r.method==='EXACT ENUMERATION'?'exact':'monte-carlo';
 const expected=responseRequest(c,m,analysis.engineId,method,analysis.analysisRevision,r.inputs.samples);
 if(analysis.inputHash!==await inputHash(expected))throw Error('Conditional calculation context mismatch.');
 const payoff=(equity:number)=>equity*(c.pot+2*c.bet)-c.bet;
 const value=(equity:number)=>m.foldProbability*c.pot+m.callProbability*payoff(equity);
 return {ev:value(r.equity),foldPayoff:c.pot,callPayoff:payoff(r.equity),estimated:method==='monte-carlo',interval:method==='monte-carlo'&&r.confidence===.95?r.interval.map(value) as [number,number]:null};
}
