import type { Locale } from './i18n';
import type { EquityResult } from './equity';
import { cardText } from './cards';
import {useAppearance, type CardDesign, type SuitColors} from './appearance';

import {words} from './i18n';
export {words} from './i18n';
export const pct = (fraction:number) => `${(100*fraction).toFixed(1)}%`;
/** Display-only faces: numeric evaluator IDs and wire notation are never modified. */
export function Card({card,small=false,design,colors,locale,empty=false}:{card?:number;small?:boolean;design?:CardDesign;colors?:SuitColors;locale?:string;empty?:boolean}) {
  const {appearance}=useAppearance();
  const language=locale ?? (typeof document==='undefined'?'en':document.documentElement.lang);
  const ro=language==='ro';
  const className=`card deck-${design??appearance.cardDesign} suits-${colors??appearance.suitColors} ${small?'small':''}`;
  if(empty)return <span className="card-slot" role="img" aria-label={ro?'Loc liber pentru carte':'Empty card slot'}/>;
  // A face-down card receives no ID, rank, suit or presentation metadata.
  if(card===undefined)return <span className={className+' back'} role="img" aria-label={ro?'Carte ascunsă':'Hidden card'} dir="ltr"><span aria-hidden="true">P</span></span>;
  const text=cardText(card),rank=text[0]==='T'?'10':text[0],suit=['♣','♦','♥','♠'][card%4];
  const suits=ro?['treflă','caro','cupă','pică']:['clubs','diamonds','hearts','spades'];
  const ranks:Record<string,string>=ro?{A:'As',K:'Popă',Q:'Damă',J:'Valet'}:{A:'Ace',K:'King',Q:'Queen',J:'Jack'};
  const label=ro?`${ranks[rank]??rank} de ${suits[card%4]}`:`${ranks[rank]??rank} of ${suits[card%4]}`;
  return <span className={className+` suit-${card%4} ${[1,2].includes(card%4)?'red':''}`} role="img" aria-label={label} dir="ltr"><b aria-hidden="true">{rank}</b><span aria-hidden="true">{suit}</span><i aria-hidden="true">{rank}{suit}</i></span>;
}
export function Cards({cards,hidden=false,small=false}:{cards:number[];hidden?:boolean;small?:boolean}){return <span className="cards" dir="ltr">{cards.map((c,i)=><Card key={i} card={hidden?undefined:c} small={small}/>)}</span>}
export function EquityView({result,locale}:{result:EquityResult;locale:Locale}) {
  return <div className="equity-result" data-testid="equity-result">
    <span className="badge">{result.method}</span><div className="equity-number">{pct(result.equity)}<span>{words(locale,'expected pot share','partea așteptată din pot')}</span></div>
    <div className="equity-track"><span style={{width:pct(result.equity)}}/></div>
    <div className="stat-trio"><span>{words(locale,'Sole win','Câștig unic')}<b>{pct(result.win)}</b></span><span>{words(locale,'Tied best','Egalitate')}<b>{pct(result.tie)}</b></span><span>{words(locale,'Loss','Pierdere')}<b>{pct(result.loss)}</b></span></div>
    <p>{result.samples.toLocaleString()} {words(locale,'outcomes','rezultate')} · {result.elapsedMs.toFixed(0)} ms · seed {result.seed}</p>
    {result.method==='MONTE CARLO ESTIMATE'&&<p className="notice">95% fixed-N Hoeffding interval: {pct(result.interval[0])}–{pct(result.interval[1])}. {words(locale,'This interval concerns fractional pot shares, including ties.','Intervalul se referă la fracțiile din pot, inclusiv egalitățile.')}</p>}
    {result.perPot?.map(p=><p key={p.id}>{p.id}: {pct(p.heroShare)} · {p.expectedChips.toFixed(1)} {words(locale,'expected chips','jetoane așteptate')}</p>)}
    <details><summary>{words(locale,'Inputs, method & limitations','Date, metodă și limite')}</summary><p>{result.engineVersion}</p><ul>{result.limitations.map((s,i)=><li key={i}>{s}</li>)}</ul><pre>{JSON.stringify(result.inputs,null,2)}</pre></details>
  </div>;
}
