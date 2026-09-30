import {useEffect,useMemo,useRef,useState} from 'react';
import {onBackground} from './lifecycle';
import {parseCards} from './cards';
import {matrixLabels,rangeForCell,expandRange,editRangeCell,RANGE_PRESETS} from './ranges';
import {validateEquityRequest,type EquityRequest} from './equity';
import {EngineClient} from './engines/client';
import {fromEquityRequest,type AnalysisResult,type AnalysisRequest} from './engines/contract';
import {registry,entryFor} from './engines/registry';
import {comparisonVerdict} from './engines/runner';
import {engineText as et} from './engines/strings';
import {EquityView,words} from './components';
import {t,type Locale} from './i18n';
import type {StudyScenario} from './storage';

export const defaultScenario=():StudyScenario=>({id:'draft',title:'Aces on a connected flop',hero:'As Ah',board:'Ks Qs 2d',dead:'',opponents:['Kc Kh']});
function weightMap(text:string):Record<string,number>{
  try{const combos=expandRange(text);const keys=new Map(combos.map(c=>[c.cards.join(','),c.weight]));return Object.fromEntries(matrixLabels().map(label=>[label,Math.max(0,...rangeForCell(label).map(c=>keys.get(c.cards.join(','))??0))]));}catch{return {}}
}
export default function OddsLab({locale,initial,onSave,advanced}:{locale:Locale;initial:StudyScenario;onSave:(s:StudyScenario)=>void;advanced:boolean}){
  const [draft,setDraft]=useState(initial),[selected,setSelected]=useState(0),[weight,setWeight]=useState(100),[samples,setSamples]=useState(10000),[seed,setSeed]=useState(20260930),[method,setMethod]=useState<'auto'|'exact'|'monte-carlo'>('auto');
  const [result,setResult]=useState<AnalysisResult|null>(null),[error,setError]=useState(''),[progress,setProgress]=useState<{completed:number;target:number}|null>(null);
  const client=useRef(new EngineClient()); const serial=useRef(0),running=useRef(false);
  const [engine,setEngine]=useState<AnalysisRequest['engine']>('automatic'),[comparison,setComparison]=useState<AnalysisResult[]>([]);
  useEffect(()=>{return()=>client.current.cancel()},[]);
  const invalidate=()=>{running.current=false;setComparison([]);serial.current++;client.current.cancel();setProgress(null);setResult(null);setError('')};
  useEffect(()=>onBackground(()=>{if(running.current){running.current=false;serial.current++;client.current.cancel();setProgress(null);setError('Calculation cancelled while the app was in the background.')}}),[]);
  const update=(change:Partial<StudyScenario>)=>{invalidate();setDraft(d=>({...d,...change}))};
  useEffect(()=>{running.current=false;setComparison([]);serial.current++;client.current.cancel();setDraft(initial);setSelected(0);setResult(null);setProgress(null);setError('')},[initial]);
  const range=draft.opponents[selected]??'random';const weights=useMemo(()=>weightMap(range),[range]);
  const replaceRange=(text:string)=>update({opponents:draft.opponents.map((r,i)=>i===selected?text:r)});
  const blocked=useMemo(()=>{try{return [...parseCards(draft.hero),...parseCards(draft.board),...parseCards(draft.dead)]}catch{return []}},[draft.hero,draft.board,draft.dead]);
  let count='—',rangeError='';try{count=String(expandRange(range,blocked).length)}catch(e){rangeError=(e as Error).message}
  let fixedHands=false;try{fixedHands=draft.opponents.every(text=>expandRange(text).length===1)}catch{}
  function requestForDraft():EquityRequest{
    const request:EquityRequest={hero:parseCards(draft.hero),board:parseCards(draft.board),dead:parseCards(draft.dead),opponents:draft.opponents.map(text=>({range:expandRange(text)})),samples,seed,method};
    validateEquityRequest(request);return request;
  }
  function saveScenario(){try{
    requestForDraft();
    if(!draft.title.trim()||draft.title.length>100||/[<>]/.test(draft.title))throw new Error(words(locale,'Use a scenario name of 1–100 characters without HTML.','Folosește un nume de 1–100 de caractere fără HTML.'));
    if(draft.opponents.some(text=>text.length>2000))throw new Error('Each range is limited to 2000 characters for portable backups.');
    setError('');onSave({...draft,title:draft.title.trim(),id:crypto.randomUUID()});
  }catch(e){setError((e as Error).message)}}
  async function calculate(compare=false){
    if(running.current)return;running.current=true;
    const run=++serial.current;setError('');setResult(null);setComparison([]);setProgress({completed:0,target:samples});
    try{
      const snapshot=fromEquityRequest(requestForDraft(),engine,run,draft.origin?'review':'reveal-all-study');
      const output=await client.current.run(snapshot,(completed,target)=>{if(run===serial.current)setProgress({completed,target})});
      if(run!==serial.current)return;
      if(output.status!=='COMPLETE')throw new Error(`${output.status}: ${output.completionReason}`);
      setResult(output);
      if(compare){
        const second=await client.current.run({...snapshot,requestId:crypto.randomUUID(),engine:output.engineId==='pok-standard'?'pok-ph':'pok-standard'},(completed,target)=>{if(run===serial.current)setProgress({completed,target})});
        if(run===serial.current)setComparison([output,second]);
      }
    }catch(e){if(run===serial.current)setError((e as Error).message)}finally{if(run===serial.current){running.current=false;setProgress(null)}}
  }
  return <div className="odds-layout">
    <section className="panel scenario-panel"><div className="section-heading"><div><span className="eyebrow">01 / {words(locale,'SCENARIO','SCENARIU')}</span><h2>{words(locale,'Make the assumptions explicit.','Precizează ipotezele.')}</h2></div><span className="badge">{fixedHands?words(locale,'EQUITY VS SPECIFIED CARDS','ECHITATE VS CĂRȚI SPECIFICATE'):t(locale,'rangeBased')}</span></div>
      <p>{t(locale,'equityHelp')}</p>{draft.origin&&<p className="notice">{draft.origin}</p>}
      <label>{words(locale,'Scenario name','Numele scenariului')}<input value={draft.title} maxLength={100} onChange={e=>update({title:e.target.value})}/></label>
      <div className="form-grid"><label>{words(locale,'Your two cards','Cele două cărți ale tale')}<input dir="ltr" aria-label="Hero cards" value={draft.hero} onChange={e=>update({hero:e.target.value})}/></label><label>{words(locale,'Board · 0, 3, 4 or 5 cards','Cărți comune · 0, 3, 4 sau 5')}<input dir="ltr" aria-label="Board cards" value={draft.board} onChange={e=>update({board:e.target.value})}/></label><label>{words(locale,'Explicit known dead cards','Cărți moarte cunoscute explicit')}<input dir="ltr" value={draft.dead} placeholder="e.g. 3c 4c" onChange={e=>update({dead:e.target.value})}/></label><label>{words(locale,'Opponents','Adversari')}<select aria-label="Opponents" value={draft.opponents.length} onChange={e=>{const n=+e.target.value;setSelected(0);update({opponents:Array.from({length:n},(_,i)=>draft.opponents[i]??'random')})}}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label></div>
      <p className="muted">{words(locale,'Cards: As Kh Td · c ♣ clubs, d ♦ diamonds, h ♥ hearts, s ♠ spades. Unseen burns, folded cards and future deck cards are not dead-card inputs.','Cărți: As Kh Td · c ♣ treflă, d ♦ caro, h ♥ cupă, s ♠ pică. Cărțile arse nevăzute, cele foldate și cărțile viitoare nu sunt intrări cunoscute.')}</p>
      {draft.opponents.map((text,i)=><label key={i}>{words(locale,'Opponent','Adversar')} {i+1} · {words(locale,'specific hand or weighted range','mână exactă sau interval ponderat')}<input dir="ltr" aria-label={`Opponent ${i+1} range`} maxLength={2000} value={text} onFocus={()=>setSelected(i)} onChange={e=>update({opponents:draft.opponents.map((v,j)=>j===i?e.target.value:v)})}/></label>)}
      <div className="form-grid"><label>{t(locale,'method')}<select aria-label="Calculation method" value={method} onChange={e=>{invalidate();setMethod(e.target.value as typeof method)}}><option value="auto">Auto</option><option value="exact">Exact enumeration</option><option value="monte-carlo">Monte Carlo</option></select></label><label>{t(locale,'samples')}<select aria-label="Sample budget" value={samples} onChange={e=>{invalidate();setSamples(+e.target.value)}}>{[2000,10000,25000,50000].map(n=><option key={n}>{n}</option>)}</select></label><label>Seed<input aria-label="Calculation seed" type="number" min="0" max="4294967295" step="1" value={seed} onChange={e=>{invalidate();setSeed(+e.target.value)}}/></label></div>
      <div className="engine-control"><label>{et(locale,'engine')}<select aria-label="Analysis engine" value={engine} onChange={e=>{invalidate();setEngine(e.target.value as AnalysisRequest['engine'])}}><option value="automatic">{et(locale,'automatic')}</option>{registry.filter(e=>e.runtimeReady&&e.location==='browser-worker').map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label><details><summary>{et(locale,'details')}</summary><div className="engine-choices">{registry.filter(e=>e.runtimeReady).map(e=><article key={e.id}><strong>{e.name}</strong><p>{et(locale,e.id==='pok-standard'?'standard':'hybrid')}</p><small>{e.license}</small></article>)}<details><summary>{et(locale,'catalog')}</summary>{registry.filter(e=>!e.runtimeReady).map(e=><p key={e.id}><strong>{e.name}</strong> · {e.description}</p>)}</details></div></details></div>
      <div className="button-row"><button className="primary" onClick={()=>void calculate()} disabled={!!progress}>{progress?t(locale,'loading'):et(locale,'calculate')}</button><button onClick={()=>void calculate(true)} disabled={!!progress}>{et(locale,'compare')}</button>{progress&&<button onClick={invalidate}>{et(locale,'cancel')}</button>}<button onClick={saveScenario}>{t(locale,'bookmark')}</button></div>
      {progress&&<div role="status"><progress max={progress.target||1} value={progress.completed}/><p>{progress.completed.toLocaleString()} / {progress.target.toLocaleString()}</p></div>}{error&&<div role="alert" className="error"><p>{error}</p><button onClick={()=>void calculate()}>{et(locale,'retry')}</button><button onClick={()=>{invalidate();setEngine('pok-standard')}}>{et(locale,'useStandard')}</button></div>}{result&&<><p className="notice">{words(locale,'Conditional calculation: only your entered cards, ranges and explicit dead cards are known. Units are expected fractional pot share; win, tie and loss probabilities are separate. This does not determine the best multistreet action.','Calcul condiționat: sunt cunoscute doar cărțile, intervalele și cărțile moarte introduse. Unitatea este fracția așteptată din pot; câștigul, egalitatea și pierderea sunt probabilități separate. Rezultatul nu determină cea mai bună acțiune pe mai multe străzi.')}</p><p className="engine-attribution" data-testid="engine-attribution"><strong><bdi>{entryFor(result.engineId).name}</bdi></strong> · <bdi>{result.location}</bdi> · {result.elapsedMs.toFixed(0)} ms</p><EquityView result={result.result!} locale={locale}/><details><summary>{et(locale,'details')}</summary><p>{result.uncertainty}</p><p>{result.reproducibility}</p><p>Input SHA-256: <bdi>{result.inputHash}</bdi></p><p>Adapter: <bdi>{result.adapterVersion}</bdi> · {result.upstreamRevision}</p><p>{result.sharedComponents.join(' · ')}</p><pre className="engine-json">{JSON.stringify(result.result?.inputs,null,2)}</pre></details></>}
      {comparison.length===2&&<section className="engine-comparison" aria-label="Engine comparison"><h3>{et(locale,'compare')}</h3><p role="status">{comparisonVerdict(comparison[0],comparison[1])}</p><p>{et(locale,'shared')}</p><div className="engine-comparison-grid">{comparison.map(r=><article key={r.engineId}><h4><bdi>{entryFor(r.engineId).name}</bdi></h4><p>{r.status==='COMPLETE'?`${((r.result?.equity??0)*100).toFixed(2)}%`:r.status} · {r.method}</p><p>{r.counts.completed.toLocaleString()} {r.counts.kind} · {r.elapsedMs.toFixed(0)} ms · <bdi>{r.location}</bdi></p>{r.result?.confidence&&<p>95%: {(r.result.interval[0]*100).toFixed(2)}–{(r.result.interval[1]*100).toFixed(2)}%</p>}<small>{r.completionReason}</small></article>)}</div></section>}
    </section>
    <section className="panel range-panel"><span className="eyebrow">02 / {words(locale,'RANGE WORKBENCH','ATELIER DE INTERVALE')}</span><h2>{words(locale,'Think in combinations.','Gândește în combinații.')}</h2><p>{words(locale,'Educational ranges. These presets are assumptions, not solver output.','Intervale didactice. Preseturile sunt ipoteze, nu rezultate de solver.')}</p>
      <div className="button-row">{Object.entries(RANGE_PRESETS).map(([name,value])=><button key={name} onClick={()=>replaceRange(value)}>{name}</button>)}</div>
      <div className="form-grid"><label>{words(locale,'Editing opponent','Editează adversarul')}<select value={selected} onChange={e=>setSelected(+e.target.value)}>{draft.opponents.map((_,i)=><option key={i} value={i}>{i+1}</option>)}</select></label><label>{t(locale,'weight')} {weight}%<input type="range" min="0" max="100" step="5" value={weight} onChange={e=>setWeight(+e.target.value)}/></label></div>
      <div className="range-matrix" role="group" aria-label="13 by 13 starting hand matrix">{matrixLabels().map((label,i)=><button key={label} aria-label={`${label} weight ${Math.round((weights[label]??0)*100)} percent`} title={`${label}: ${rangeForCell(label).filter(c=>!c.cards.some(v=>blocked.includes(v))).length} legal combinations`} className={`${i%14===0?'pair':i%13<Math.floor(i/13)?'offsuit':'suited'} ${(weights[label]??0)>0?'selected':''}`} style={{'--weight':weights[label]??0} as React.CSSProperties} onClick={()=>{try{replaceRange(editRangeCell(range,label,(weights[label]??0)===weight/100?0:weight/100))}catch(e){setError((e as Error).message)}}}>{label}</button>)}</div>
      <div className="range-count"><strong>{count}</strong><span>{words(locale,'concrete combinations after blockers','combinații concrete după blocaje')}</span></div>
      {rangeError&&<p className="error" role="status">{rangeError}</p>}
      <p>{words(locale,'Pairs: 6 · suited: 4 · offsuit: 12. All cells: 1,326 before blockers. Click a cell to apply the selected weight; click again to clear.','Perechi: 6 · suited: 4 · offsuit: 12. Total: 1.326 înainte de blocaje. Apasă o celulă pentru pondere; apasă din nou pentru a o șterge.')}</p>
      <details open={advanced}><summary>{words(locale,'Range notation & weighting','Notația și ponderile intervalelor')}</summary><p>AA, AKs, AKo, AK (both), AsKh, 77+, AJs+, random. AA:0.5 / AA:50%. {words(locale,'Commas separate tokens. + keeps the first rank fixed for nonpairs, increasing the second up to one below the first; pairs expand upward. Overlap uses maximum weight, never addition. Each concrete combination inherits the cell weight.','Virgulele separă termenii. + păstrează primul rang la nonperechi și crește al doilea; perechile cresc împreună. Suprapunerile folosesc ponderea maximă. Fiecare combinație concretă primește ponderea celulei.')}</p><p>{words(locale,'Multiple ranges use whole-assignment collision rejection. Incompatible or excessively narrow combinations fail clearly instead of silently biasing later seats.','Intervalele multiple folosesc respingerea întregii atribuiri la coliziuni. Intervalele incompatibile produc o eroare explicită.')}</p></details>
    </section>
  </div>
}
