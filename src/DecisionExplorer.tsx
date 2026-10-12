import {useEffect,useMemo,useRef,useState} from 'react';
import type {HandState} from './game';
import type {Locale} from './i18n';
import {Cards,words} from './components';
import {EngineClient} from './engines/client';
import type {AnalysisResult,EngineId} from './engines/contract';
import {DecisionExplanation} from './DecisionExplanation';
import {explainStudyCall} from './decision-study';
import {decisionRequest,terminalDecisionContext} from './decision-explorer';

/** Read-only viewer. No action, save, fork or progress callback exists here. */
export function DecisionExplorer({hand,locale,example=false}:{hand:HandState;locale:Locale;example?:boolean}){
 const text=(en:string,ro:string)=>words(locale,en,ro),number=(n:number)=>(Math.abs(n)<.005?0:n).toLocaleString(locale,{maximumFractionDigits:2});
 const context=useMemo(()=>terminalDecisionContext(hand),[hand]);
 const contextKey=JSON.stringify(context);
 const client=useRef(new EngineClient()),serial=useRef(0);
 const [range,setRange]=useState('random'),[engine,setEngine]=useState<EngineId>('pok-standard'),[method,setMethod]=useState<'exact'|'monte-carlo'>('exact'),[samples,setSamples]=useState(2000);
 const [savedResult,setResult]=useState<{result:AnalysisResult;key:string}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[selected,setSelected]=useState<'fold'|'call'>('fold');
 const invalidate=()=>{serial.current++;client.current.cancel();setBusy(false);setResult(null);setError('')};
 useEffect(()=>{invalidate();return()=>{serial.current++;client.current.cancel()}},[contextKey]);
 async function calculate(){
  invalidate();if(context.kind!=='supported')return;const id=serial.current;setBusy(true);
  try{const r=await client.current.run(decisionRequest(context.context,range,engine,method,id,samples));if(id!==serial.current)return;
   if(r.status!=='COMPLETE'||!r.result)throw Error(r.completionReason);setResult({result:r,key:contextKey});
  }catch(e){if(id===serial.current)setError((e as Error).message)}finally{if(id===serial.current)setBusy(false)}
 }
 const unsupported=text('Model unsupported: select a river decision where you face a full call in a two-player hand, with one fully eligible pot and no refunds.','Model neacceptat: selectează o decizie pe river cu o plată integrală într-o mână cu doi jucători, un singur pot eligibil și fără restituiri.');
 const c=context.kind==='supported'?context.context:null;
 const result=savedResult?.key===contextKey?savedResult.result:null;
 const model=c&&result?explainStudyCall(result,c.pot,c.call):null;
 return <details className="decision-explorer" data-testid="decision-explorer"><summary>{text('Decision Explorer · Fold vs Call','Explorator de decizii · Fold sau Plată')}</summary>
  <h3>{text('Inspect alternatives without playing them','Examinează alternativele fără a le juca')}</h3>
  <p>{example?text('Hypothetical river lesson; not your active game.','Lecție ipotetică pe river; nu este jocul activ.'):text('Immutable replay snapshot; not your active game.','Instantaneu de reluare nemodificabil; nu este jocul activ.')} {text('Selections, assumptions and results are temporary and reset when you leave, change replay position or reload. Saved hands and progress are unchanged.','Selecțiile, ipotezele și rezultatele sunt temporare și se resetează la ieșire, schimbarea poziției sau reîncărcare. Mâinile și progresul salvate nu se modifică.')}</p>
  {!['en','ro'].includes(locale)&&<p>Decision Explorer explanations currently use English fallback.</p>}
  {!c?<p role="status">{unsupported}</p>:<>
   <p>{text('Decision revision','Revizia deciziei')}: {c.revision} · {text('River · your turn','River · rândul tău')}</p>
   <div className="math-hands"><div><strong>{text('Your cards','Cărțile tale')}</strong><Cards cards={[...c.hero]}/></div><div><strong>{text('Public board','Cărți comune')}</strong><Cards cards={[...c.board]}/></div></div>
   <p>{text('Pot before call','Pot înainte de plată')}: <b data-testid="explorer-pot">{number(c.pot)}</b> · {text('Call cost','Costul plății')}: <b data-testid="explorer-call">{number(c.call)}</b></p>
   <label>{text('Assumed opponent range','Interval presupus al adversarului')}<input aria-label={text('Explorer opponent range','Intervalul adversarului pentru explorator')} value={range} maxLength={2000} onChange={e=>{invalidate();setRange(e.target.value)}}/></label>
   <p>{text('This is your explicit range assumption, not the opponent’s hidden or revealed cards. Default random means all unblocked two-card combinations.','Aceasta este ipoteza ta explicită, nu cărțile ascunse sau dezvăluite ale adversarului. Implicit, random înseamnă toate combinațiile de două cărți neblocate.')}</p>
   <div className="form-grid"><label>{text('Engine','Motor')}<select aria-label={text('Explorer engine','Motorul exploratorului')} value={engine} onChange={e=>{invalidate();setEngine(e.target.value as EngineId)}}><option value="pok-standard">POK Standard</option><option value="pok-ph">PH WASM</option></select></label>
    <label>{text('Method','Metodă')}<select aria-label={text('Explorer method','Metoda exploratorului')} value={method} onChange={e=>{invalidate();setMethod(e.target.value as typeof method)}}><option value="exact">{text('Exact enumeration','Enumerare exactă')}</option><option value="monte-carlo">Monte Carlo</option></select></label>
    {method==='monte-carlo'&&<label>{text('Samples','Probe')}<select aria-label={text('Explorer samples','Probele exploratorului')} value={samples} onChange={e=>{invalidate();setSamples(+e.target.value)}}><option value="2000">{number(2000)}</option><option value="50000">{number(50000)}</option></select></label>}
   </div>
   <div className="button-row"><button disabled={busy} onClick={()=>void calculate()}>{text('Calculate comparison','Calculează comparația')}</button>{busy&&<button onClick={()=>{invalidate();setError(text('Calculation cancelled; no comparison retained.','Calcul anulat; nicio comparație păstrată.'))}}>{text('Cancel comparison','Anulează comparația')}</button>}</div>
   {busy&&<p role="status">{text('Calculating in the existing worker…','Se calculează în workerul existent…')}</p>}{error&&<p role="alert">{error}</p>}
   {result&&model?.kind==='available'&&<div data-testid="explorer-result">
    <p><strong>{result.method}</strong> · {number(result.counts.completed)} {text('completed outcomes','rezultate calculate')} · {result.engineId}</p>
    <p>{text('Expected pot share','Partea așteptată din pot')}: <b data-testid="explorer-share">{(result.result!.equity*100).toLocaleString(locale,{minimumFractionDigits:1,maximumFractionDigits:1})}%</b></p>
    <div className="button-row" role="group" aria-label={text('Inspect legal alternatives','Examinează alternative legale')}><button aria-pressed={selected==='fold'} onClick={()=>setSelected('fold')}>{text('Inspect Fold','Examinează Fold')}</button><button aria-pressed={selected==='call'} onClick={()=>setSelected('call')}>{text('Inspect Call','Examinează Plata')}</button></div>
    <p data-testid="modeled-classification">{model.calculations.comparison==='crosses'?text('Statistically uncertain modeled call EV','EV modelat al plății incert statistic'):model.calculations.comparison==='at'?text('Break-even modeled call EV','EV modelat al plății la pragul de rentabilitate'):model.calculations.comparison==='above'?text('Positive modeled call EV','EV modelat pozitiv al plății'):text('Negative modeled call EV','EV modelat negativ al plății')}</p>
    <table><caption>{text('Modeled EV relative to this decision point','EV modelat față de acest moment al deciziei')}</caption><thead><tr><th>{text('Action','Acțiune')}</th><th>EV ({text('chips','jetoane')})</th></tr></thead><tbody><tr><th>Fold</th><td data-testid="fold-ev">0</td></tr><tr><th>{text('Call','Plată')}</th><td data-testid="call-ev">{number(model.calculations.incrementalEV)}</td></tr></tbody></table>
    <p role="status" data-testid="alternative-explanation">{selected==='fold'?text('Fold invests no additional chips and forfeits this pot. Already committed chips are sunk; EV is zero relative to this decision.','Fold nu investește jetoane suplimentare și renunță la pot. Jetoanele deja investite sunt costuri nerecuperabile; EV relativ este zero.'):text(`Call invests ${number(c.call)} chips. Modeled expected payout is ${number(model.calculations.incrementalEV+c.call)} chips, including the new call; subtracting its cost gives the displayed EV.`,`Plata investește ${number(c.call)} jetoane. Câștigul brut așteptat modelat este ${number(model.calculations.incrementalEV+c.call)} jetoane, incluzând plata nouă; scăderea costului dă EV afișat.`)}</p>
    <DecisionExplanation analysis={result} pot={String(c.pot)} call={String(c.call)} locale={locale}/>
   </div>}
   {result&&model?.kind==='unavailable'&&<p role="status">{unsupported}</p>}
   <p className="notice">{text('Assumptions: heads-up river, one fully eligible terminal pot, no rake or refunds, no future betting, and the entered range. Exact results apply only to that model. Sampling intervals do not validate the range. Other legal actions have no modeled EV here. This is an educational comparison, not a universal recommendation.','Ipoteze: river cu doi jucători, un singur pot terminal eligibil integral, fără rake, restituiri sau pariuri viitoare, și intervalul introdus. Rezultatele exacte se aplică doar acestui model. Intervalele statistice nu validează ipoteza adversarului. Alte acțiuni legale nu au EV modelat aici. Este o comparație educațională, nu o recomandare universală.')}</p>
  </>}
 </details>;
}
