import type {AnalysisResult} from './engines/contract';
import type {Locale} from './i18n';
import {words,pct} from './components';
import {explainStudyCall} from './decision-study';

export function DecisionExplanation({analysis,pot,call,locale}:{analysis:AnalysisResult;pot:string;call:string;locale:Locale}){
 const text=(en:string,ro:string)=>words(locale,en,ro);
 const d=explainStudyCall(analysis,pot.trim()?Number(pot):NaN,call.trim()?Number(call):NaN);
 const number=(x:number,digits=1)=>x.toLocaleString(locale,{minimumFractionDigits:digits,maximumFractionDigits:digits});
 if(d.kind==='unavailable')return <p role="status">{d.reason==='amounts'
  ?text('Enter nonnegative whole chip amounts.','Introdu sume întregi nenegative.')
  :d.reason==='pot-model'?text('This simple model cannot price side pots, explicit pot eligibility or uncalled returns.','Acest model simplu nu poate evalua poturi secundare, eligibilitate explicită sau sume returnate.')
  :text('A completed, validated calculation with supported uncertainty is required.','Este necesar un calcul complet, validat, cu incertitudine acceptată.')}</p>;
 const m=d.calculations;
 const comparison={
  above:text(m.estimated?'The sampling interval is above the threshold.':'Expected share is above the threshold.',m.estimated?'Intervalul de eșantionare este peste prag.':'Partea așteptată este peste prag.'),
  below:text(m.estimated?'The sampling interval is below the threshold.':'Expected share is below the threshold.',m.estimated?'Intervalul de eșantionare este sub prag.':'Partea așteptată este sub prag.'),
  at:text('Expected share equals the threshold.','Partea așteptată este egală cu pragul.'),
  crosses:text('The sampling interval reaches or crosses the threshold; this estimate does not resolve which side the true expected share is on.','Intervalul de eșantionare atinge sau traversează pragul; estimarea nu stabilește de ce parte se află valoarea reală.'),
  undefined:text('No pot and no call: the threshold is undefined.','Fără pot și fără plată: pragul nu este definit.')
 }[m.comparison];
 return <div data-testid="decision-explanation">
  <p>{m.threshold===null?comparison:<>{text('Break-even expected share','Partea așteptată la pragul de rentabilitate')}: <b>{pct(m.threshold)}</b> = {number(d.context.call,0)} / ({number(d.context.potBeforeCall,0)} + {number(d.context.call,0)}).</>}</p>
  <p>{text('Terminal call EV relative to folding','EV al plății terminale față de fold')}: <b>{number(m.incrementalEV,2)}</b> {text('chips','jetoane')}.</p>
  {m.marginPoints!==null&&<><p data-testid="equity-margin">{text('Expected share minus call threshold','Partea așteptată minus pragul plății')}: <b>{number(m.marginPoints)}</b> {text('percentage points','puncte procentuale')}.</p><p data-testid="threshold-comparison">{comparison}</p></>}
  {m.estimated&&m.marginIntervalPoints&&<p data-testid="decision-interval">{text('95% fixed-sample margin interval','Intervalul de 95% al diferenței, cu număr fix de probe')}: {number(m.marginIntervalPoints[0])}–{number(m.marginIntervalPoints[1])} {text('percentage points','puncte procentuale')}. {text('Corresponding terminal EV interval','Intervalul EV terminal corespunzător')}: {number(m.evInterval[0],2)}–{number(m.evInterval[1],2)} {text('chips','jetoane')}.</p>}
  <p>{text('These comparisons hold only under the study assumptions below; no bet or raise EV is calculated.','Comparațiile sunt valabile doar pentru ipotezele de studiu de mai jos; nu se calculează EV pentru pariu sau plusare.')}</p>
  <details><summary>{text('Decision calculation provenance','Proveniența calculului deciziei')}</summary><p>{d.provenance.engineId} · {d.provenance.adapterVersion} · {d.provenance.location} · {d.provenance.method} · {d.provenance.completed.toLocaleString(locale)}</p><p style={{overflowWrap:'anywhere'}}>Input SHA-256: <bdi>{d.provenance.inputHash}</bdi></p></details>
 </div>;
}
