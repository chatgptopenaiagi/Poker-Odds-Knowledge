import {useEffect,useRef,useState} from 'react';
import {parseCards,cardText} from './cards';
import {Cards,words} from './components';
import type {Locale} from './i18n';
import type {StudyScenario} from './storage';
import {RangeMatrix} from './RangeMatrix';
import {blockerStudy,rangeDifference} from './range-study';
import {EngineClient} from './engines/client';
import {fromEquityRequest,type AnalysisRequest,type AnalysisResult} from './engines/contract';
import {onBackground} from './lifecycle';

export function RangeExplorer({draft,locale,engine,method,samples,seed}:{draft:StudyScenario;locale:Locale;engine:AnalysisRequest['engine'];method:AnalysisRequest['method'];samples:number;seed:number}){
 const [rangeB,setRangeB]=useState('KK'),[weight,setWeight]=useState(100),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [saved,setSaved]=useState<{key:string;results:AnalysisResult[]}|null>(null);
 const client=useRef(new EngineClient()),serial=useRef(0);
 const key=JSON.stringify({hero:draft.hero,board:draft.board,dead:draft.dead,opponents:draft.opponents,rangeB,engine,method,samples,seed});
 const cancel=()=>{serial.current++;client.current.cancel();setBusy(false);setSaved(null)};
 useEffect(()=>{cancel();setError('');return()=>{serial.current++;client.current.cancel()}},[key]);
 useEffect(()=>onBackground(cancel),[]);
 const w=(en:string,ro:string)=>words(locale,en,ro),n=(v:number)=>new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(v),pct=(v:number)=>n(v*100)+'%';
 let hero:number[]=[],board:number[]=[],known:number[]=[],reports:ReturnType<typeof blockerStudy>[]=[],invalid='';
 try{hero=parseCards(draft.hero);board=parseCards(draft.board);known=[...hero,...board,...parseCards(draft.dead)];if(hero.length!==2||![0,3,4,5].includes(board.length)||draft.opponents.length!==1)throw Error(w('Choose two hero cards and one opponent.','Alege două cărți proprii și un adversar.'));reports=[blockerStudy(draft.opponents[0],known),blockerStudy(rangeB,known)];}catch(e){invalid=(e as Error).message}
 async function calculate(){
  cancel();setError('');const run=serial.current;setBusy(true);
  try{if(invalid)throw Error(invalid);const results:AnalysisResult[]=[];
   for(const report of reports){const request=fromEquityRequest({hero,board,dead:parseCards(draft.dead),opponents:[{range:report.remaining}],method,samples,seed},engine,run,'reveal-all-study');
    const r=await client.current.run(request);if(run!==serial.current)return;if(r.status!=='COMPLETE'||!r.result)throw Error(r.status+': '+r.completionReason);results.push(r);}
   rangeDifference(results[0],results[1]);if(run===serial.current)setSaved({key,results});
  }catch(e){if(run===serial.current)setError((e as Error).message)}finally{if(run===serial.current)setBusy(false)}
 }
 const results=saved?.key===key?saved.results:null;
 return <details className="decision-explorer" data-testid="range-explorer"><summary>{w('Range Explorer · A versus B','Explorator de intervale · A față de B')}</summary>
  <p>{w('Temporary heads-up study. A uses the current opponent range above. Both calculations use identical cards, engine, method, budget and seed. Editing either scenario cancels and invalidates both results. Reload clears this comparison.','Studiu temporar cu un adversar. A folosește intervalul curent de mai sus. Ambele calcule folosesc aceleași cărți, motor, metodă, buget și seed. Editarea anulează ambele rezultate. Reîncărcarea șterge comparația.')}</p>
  {!invalid&&<div className="math-hands"><Cards cards={hero}/><Cards cards={board}/></div>}
  <p>A: <bdi>{draft.opponents[0]}</bdi></p>
  <label>{w('Assumed range B','Interval presupus B')}<input aria-label={w('Comparison range B','Interval de comparație B')} dir="ltr" maxLength={2000} value={rangeB} onChange={e=>{cancel();setRangeB(e.target.value)}}/></label>
  <label>{w('Matrix weight','Pondere în matrice')} {weight}%<input aria-label={w('Comparison cell weight','Ponderea celulei de comparație')} type="range" min="0" max="100" step="5" value={weight} onChange={e=>setWeight(+e.target.value)}/></label>
  <RangeMatrix range={rangeB} blocked={known} weight={weight/100} onChange={s=>{cancel();setRangeB(s)}} onError={setError}/>
  <p>{w('Weights describe assumptions, not observed holdings. Overlap uses maximum weight. Mixed matrix cells show their maximum; text retains individual weights.','Ponderile sunt ipoteze, nu cărți observate. Suprapunerea folosește maximul. Celulele mixte arată maximul; textul păstrează ponderile individuale.')}</p>
  {invalid&&<p role="status">{invalid}</p>}
  {reports.map((r,i)=><section key={i} data-testid={`blockers-${i}`}><h4>{w('Blockers','Blocaje')} {i?'B':'A'}</h4><p>{w('Before / removed / remaining','Inițial / eliminate / rămase')}: <b>{r.before} / {r.removed.length} / {r.remaining.length}</b></p><p>{w('Unnormalized weight mass before / remaining','Masă ponderată nenormalizată inițial / rămasă')}: {n(r.originalMass)} / {n(r.remainingMass)}</p>{!r.remaining.length&&<p role="status">{w('Empty after blockers; calculation unavailable.','Gol după blocaje; calcul indisponibil.')}</p>}<details><summary>{w('Exact blocked combinations and cells','Combinații blocate și celule exacte')}</summary><p>{r.cells.map(c=>`${c.label}: ${c.remaining}/${c.before}`).join(' · ')}</p><ul>{r.removed.map(c=><li key={c.cards.join(',')}><bdi>{c.cards.map(cardText).join(' ')}</bdi> ({n(c.weight)}) — {w('known','cunoscute')}: <bdi>{c.reasons.map(cardText).join(' ')}</bdi></li>)}</ul></details></section>)}
  <button onClick={()=>void calculate()} disabled={busy||!!invalid||reports.some(r=>!r.remaining.length)}>{w('Compare ranges','Compară intervalele')}</button>{busy&&<button onClick={()=>{cancel();setError(w('Comparison cancelled.','Comparație anulată.'))}}>{w('Cancel range comparison','Anulează comparația intervalelor')}</button>}
  {busy&&<p role="status">{w('Calculating sequentially…','Calcul secvențial…')}</p>}{error&&<p role="alert">{error}</p>}
  {results&&<div data-testid="range-comparison-result" aria-live="polite"><p>{w('Equity difference B − A','Diferența de echitate B − A')}: <strong data-testid="range-delta">{n(rangeDifference(results[0],results[1]).deltaPoints)}</strong> {w('percentage points','puncte procentuale')}</p>
   <table><thead><tr><th>{w('Result','Rezultat')}</th><th>A</th><th>B</th></tr></thead><tbody>{(['equity','win','tie','loss'] as const).map((field,i)=><tr key={field}><th>{[w('Expected pot share','Fracție așteptată din pot'),w('Sole win','Câștig unic'),w('Tie','Egalitate'),w('Loss','Pierdere')][i]}</th>{results.map((r,j)=><td key={j}>{pct(r.result![field])}</td>)}</tr>)}</tbody></table>
   {results.map((r,i)=><details key={i}><summary>{w('Calculation provenance','Proveniența calculului')} {i?'B':'A'}</summary><p>{r.engineId} · {r.method} · {n(r.counts.completed)} · seed {r.result!.seed}</p><p>{r.reproducibility}</p>{r.result!.confidence===.95&&<p>95%: {r.result!.interval.map(pct).join(' – ')} · {r.uncertainty}</p>}<p className="engine-json">SHA-256: {r.inputHash}</p></details>)}
   <p>{w('Different range weights describe different assumptions, not knowledge of hidden cards. A Monte Carlo difference is an estimate: no comparison interval or statistical significance is established. Intervals do not validate the assumed ranges.','Ponderile diferite descriu ipoteze diferite, nu cunoașterea cărților ascunse. Diferența Monte Carlo este o estimare: fără interval comparativ sau semnificație statistică stabilită. Intervalele nu validează ipotezele.')}</p>
  </div>}
 </details>;
}
