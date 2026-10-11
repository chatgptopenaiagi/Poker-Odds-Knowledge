import {useMemo,useState} from 'react';
import type {AnalysisResult} from './engines/contract';
import {DecisionExplanation} from './DecisionExplanation';
import type {Locale} from './i18n';
import {Card,Cards,pct,words} from './components';
import {nextCardCategories} from './math-study';

/** A view of completed existing worker results; owns no evaluator, RNG or live-game state. */
export function MathVisualizer({analysis,locale,onNextCard}:{analysis:AnalysisResult;locale:Locale;onNextCard:(card:number)=>void}){
 const result=analysis.result!;
 const [pot,setPot]=useState('80'),[call,setCall]=useState('20');
 const text=(en:string,romanian:string)=>words(locale,en,romanian);
 const candidates=useMemo(()=>nextCardCategories(result.inputs),[result]);
 const outcomeRows=[{label:text('Sole win','Câștig unic'),value:result.win},{label:text('Tied best','Egalitate'),value:result.tie},{label:text('Loss','Pierdere'),value:result.loss}];
 return <section className="math-visualizer" aria-label={text('Math visualizer','Vizualizator matematic')} data-testid="math-visualizer">
  <h3>{text('See the mathematics','Vezi matematica')}</h3>
  {!['en','ro'].includes(locale)&&<p>New mathematical explanations are currently available in English and Romanian.</p>}
  <div className="math-hands"><div><strong>{text('Your hand','Mâna ta')}</strong><Cards cards={result.inputs.hero}/></div><div><strong>{text('Board','Masă')}</strong>{result.inputs.board.length?<Cards cards={result.inputs.board}/>:<span>{text('Preflop: no board yet','Preflop: fără cărți comune')}</span>}</div></div>
  <p>{text('Mathematical facts under the entered ranges','Fapte matematice pentru intervalele introduse')} · <b>{result.method}</b> · {result.samples.toLocaleString(locale)} {text('completed outcomes','rezultate calculate')}</p>
  <div className="outcome-bars">{outcomeRows.map(row=><div key={row.label}><span>{row.label}</span><meter min={0} max={1} value={row.value} aria-label={row.label}/><b>{pct(row.value)}</b></div>)}</div>
  <p><strong>{text('Expected pot share','Partea așteptată din pot')}: {pct(result.equity)}</strong> — {text('Ties contribute fractional shares; a tie is not a sole win.','Egalitățile contribuie cu fracții din pot; egalitatea nu este câștig unic.')}</p>
  {result.confidence!==null&&<p>{text('95% fixed-sample interval for expected share','Interval de 95% cu număr fix de probe pentru partea așteptată')}: {pct(result.interval[0])}–{pct(result.interval[1])}. {text('Sampling uncertainty does not validate the assumed opponent ranges.','Incertitudinea eșantionării nu validează intervalele presupuse.')}</p>}
  <fieldset><legend>{text('Decision explainer · editable study assumptions','Explicația deciziei · ipoteze de studiu editabile')}</legend><p>{text('These chip amounts are a separate study example, not your active table. Pot includes the wager you face.','Aceste sume sunt un exemplu de studiu separat, nu masa activă. Potul include pariul adversarului.')}</p>
   <div className="form-grid"><label>{text('Pot before your call','Pot înainte de plată')}<input aria-label={text('Study pot','Pot de studiu')} type="number" min={0} max={1000000000} step={1} value={pot} onChange={e=>setPot(e.target.value)}/></label><label>{text('Amount to call','Suma de plătit')}<input aria-label={text('Study call','Plată de studiu')} type="number" min={0} max={1000000000} step={1} value={call} onChange={e=>setCall(e.target.value)}/></label></div>
   <DecisionExplanation analysis={analysis} pot={pot} call={call} locale={locale}/>
   <p>{text('Assumptions: one fully eligible pot, no rake, no future betting, stated ranges. Opponent behavior and future bets are uncertain. Equity alone does not identify the best legal action; this study does not recommend a move.','Ipoteze: un singur pot eligibil integral, fără rake sau pariuri viitoare, intervalele declarate. Comportamentul adversarilor și pariurile viitoare sunt incerte. Echitatea singură nu identifică cea mai bună acțiune legală; studiul nu recomandă o mutare.')}</p>
  </fieldset>
  <details><summary>{text('Explore next-card category improvements','Explorează îmbunătățirile categoriei la cartea următoare')}</summary>
   <p>{text('These are category improvements, not winning outs. They can also help an opponent. Counts are not draw probabilities under weighted ranges. Choose a card, then Calculate equity again for that conditional scenario. Known fixed opponent cards and dead cards are excluded.','Acestea sunt îmbunătățiri ale categoriei, nu outs câștigătoare. Pot ajuta și adversarul. Numărul nu este o probabilitate pentru intervale ponderate. Alege o carte, apoi recalculează echitatea pentru scenariul condiționat. Cărțile fixe cunoscute ale adversarilor și cărțile moarte sunt excluse.')}</p>
   {candidates.length?<div className="next-card-grid">{candidates.map(row=><button type="button" key={row.card} onClick={()=>onNextCard(row.card)}><Card card={row.card} small locale={locale}/><span>{row.category}</span></button>)}</div>:<p>{text('Category exploration is available on the flop and turn; no candidates are shown for this result.','Explorarea categoriei este disponibilă pe flop și turn; nu sunt afișate candidate pentru acest rezultat.')}</p>}
  </details>
 </section>;
}
