import {useMemo,type CSSProperties} from 'react';
import {expandRange,matrixLabels,rangeForCell,editRangeCell} from './ranges';
/** One editor for Odds Lab and comparison ranges. Mixed cells display their maximum weight. */
export function RangeMatrix({range,blocked,weight,onChange,onError}:{range:string;blocked:number[];weight:number;onChange:(text:string)=>void;onError:(text:string)=>void}){
  const weights=useMemo(()=>{try{const keys=new Map(expandRange(range).map(c=>[c.cards.join(','),c.weight]));return Object.fromEntries(matrixLabels().map(label=>[label,Math.max(0,...rangeForCell(label).map(c=>keys.get(c.cards.join(','))??0))]));}catch{return {}}},[range]);
  return <div className="range-matrix" role="group" aria-label="13 by 13 starting hand matrix">{matrixLabels().map((label,i)=><button key={label} aria-label={`${label} weight ${Math.round((weights[label]??0)*100)} percent`} title={`${label}: ${rangeForCell(label).filter(c=>!c.cards.some(v=>blocked.includes(v))).length} legal combinations`} className={`${i%14===0?'pair':i%13<Math.floor(i/13)?'offsuit':'suited'} ${(weights[label]??0)>0?'selected':''}`} style={{'--weight':weights[label]??0} as CSSProperties} onClick={()=>{try{onChange(editRangeCell(range,label,(weights[label]??0)===weight?0:weight))}catch(e){onError((e as Error).message)}}}>{label}</button>)}</div>;
}
