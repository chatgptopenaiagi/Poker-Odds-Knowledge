import {useEffect,useMemo,useRef,useState,type ChangeEvent} from 'react';
import {Cards} from '../components';
import {cardText,parseCards} from '../cards';
import {expandRange} from '../ranges';
import {formatNumber,getLocaleMetadata,type Locale} from '../i18n';
import {onlineEdition} from '../Platform';
import {ANDROID} from '../preview';
import {openNativeBackup} from '../native-files';
import {onBackground} from '../lifecycle';
import {APIError,downloadJSON,type Member} from '../platform-api';
import {StrategyClient,solverHealth,solverMember,type SolveJob,type SolverHealth} from './client';
import {bundledPacks} from './packs';
import {decisionRegret,digest,SOLVER_ID,validatePack,validateSolveRequest,type Combo,type SolutionPack,type SolveRequest} from './contract';
import {bundledRomanianText,strategyText,type StrategyKey} from './strings';
import './strategy.css';

type PackEntry={pack:SolutionPack;source:'bundled'|'imported'|'fresh'};
type Editor={board:string;dead:string;pot:string;stack:string;oop:string;ip:string;bets:string;raises:string;learner:'OOP'|'IP';hand:string;iterations:string;time:string;gap:string};
const handKey=(cards:string[])=>[...cards].sort().join('');
const requestId=()=>`study-${crypto.randomUUID()}`;
const seedRequest=():SolveRequest=>({schemaVersion:1,requestId:'study-initial',analysisRevision:0,operation:'solve',variant:'holdem-high',ruleset:'pok-hu-river-no-rake-v1',engine:SOLVER_ID,executionPermission:'local-solver-opt-in',informationScope:'range-study',board:['2c','3d','7h','9s','Jc'],dead:[],players:[{id:'oop',position:'OOP',combinations:[{cards:['As','Ah'],weight:1},{cards:['8s','8h'],weight:1}]},{id:'ip',position:'IP',combinations:[{cards:['Qs','Qh'],weight:1},{cards:['6s','5s'],weight:1}]}],learner:{playerId:'oop',cards:['As','Ah']},pot:100,effectiveStack:100,tree:{betSizes:[50],raiseTo:[],maxRaises:0},method:'discounted-cfr',targetGap:.1,budget:{iterations:2000,timeMs:10000,memoryMiB:512,threads:1}});
function rangeText(combos:Combo[],normalize=false):string{const scale=normalize?Math.max(1,...combos.map(c=>c.weight)):1;return combos.map(c=>`${c.cards.join('')}:${c.weight/scale}`).join(', ')}
function editorFor(r:SolveRequest):Editor{return{board:r.board.join(' '),dead:r.dead.join(' '),pot:String(r.pot),stack:String(r.effectiveStack),oop:rangeText(r.players[0].combinations,true),ip:rangeText(r.players[1].combinations,true),bets:r.tree.betSizes.join(', '),raises:r.tree.raiseTo.join(', '),learner:r.players[0].id===r.learner.playerId?'OOP':'IP',hand:r.learner.cards.join(' '),iterations:String(r.budget.iterations),time:String(r.budget.timeMs/1000),gap:String(r.targetGap)}}
const numberList=(value:string)=>value.trim()?value.trim().split(/[\s,]+/).map(Number):[];
function requestFor(base:SolveRequest,e:Editor):SolveRequest{
 const board=parseCards(e.board),dead=parseCards(e.dead),blocked=[...board,...dead];
 const combinations=(text:string)=>expandRange(text,blocked).map(c=>({cards:c.cards.map(cardText),weight:c.weight}));
 const players:SolveRequest['players']=[{id:'oop',position:'OOP',combinations:combinations(e.oop)},{id:'ip',position:'IP',combinations:combinations(e.ip)}],raiseTo=numberList(e.raises);
 return validateSolveRequest({...base,requestId:requestId(),analysisRevision:base.analysisRevision+1,informationScope:'range-study',board:board.map(cardText),dead:dead.map(cardText),players,learner:{playerId:e.learner==='OOP'?'oop':'ip',cards:parseCards(e.hand).map(cardText)},pot:Number(e.pot),effectiveStack:Number(e.stack),tree:{betSizes:numberList(e.bets),raiseTo,maxRaises:raiseTo.length?1:0},targetGap:Number(e.gap),budget:{iterations:Number(e.iterations),timeMs:Number(e.time)*1000,memoryMiB:512,threads:1}});
}

export default function StrategyLab({locale,onAccount}:{locale:Locale;onAccount:()=>void}){
 const t=(key:StrategyKey)=>strategyText(locale,key),num=(value:number,digits=2)=>formatNumber(locale,value,{maximumFractionDigits:digits});
 const [entries,setEntries]=useState<PackEntry[]>([]),[active,setActive]=useState<PackEntry|null>(null),[selected,setSelected]=useState('');
 const [request,setRequest]=useState<SolveRequest>(seedRequest),[editor,setEditor]=useState<Editor>(()=>editorFor(seedRequest()));
 const [path,setPath]=useState(''),[hand,setHand]=useState(''),[choice,setChoice]=useState<string|null>(null),[revealed,setRevealed]=useState(false);
 const [member,setMember]=useState<Member|null>(null),[health,setHealth]=useState<SolverHealth|null>(null),[checking,setChecking]=useState(false),[consent,setConsent]=useState(false);
 const [loading,setLoading]=useState(true),[running,setRunning]=useState(false),[progress,setProgress]=useState<SolveJob|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState<StrategyKey|null>(null);
 const client=useRef(new StrategyClient()),runGeneration=useRef(0),healthGeneration=useRef(0),busy=useRef(false),mounted=useRef(true);
 const canNetwork=onlineEdition&&!ANDROID;
 const hasPendingEdits=JSON.stringify(editor)!==JSON.stringify(editorFor(request));
 const node=active?.pack.result.nodes.find(n=>n.path===path)??active?.pack.result.nodes[0];
 const handRow=node?.hands.find(h=>handKey(h.cards)===hand)??node?.hands[0];
 const regret=useMemo(()=>active&&node&&handRow&&choice?decisionRegret(active.pack.result,node.path,handRow.cards,choice):null,[active,node,handRow,choice]);
 const actionText=(action:string)=>{const m=/^(CHECK|FOLD|CALL|BET|RAISE|ALL[ -]?IN)(?:[ :_](\d+(?:\.\d+)?))?$/i.exec(action);if(!m)return action;const key=m[1].toLowerCase().replace(/[ -]/g,'') as StrategyKey;return `${t(key)}${m[2]?` ${num(Number(m[2]))}`:''}`};
 const resetChoice=()=>{setChoice(null);setRevealed(false)};
 function activate(entry:PackEntry){setActive(entry);setSelected(entry.pack.id);setRequest(structuredClone(entry.pack.request));setEditor(editorFor(entry.pack.request));const actor=entry.pack.request.players.findIndex(p=>p.id===entry.pack.request.learner.playerId);const first=entry.pack.result.nodes.find(n=>n.actor===actor)??entry.pack.result.nodes[0];setPath(first?.path??'');setHand(handKey(first?.hands.find(h=>handKey(h.cards)===handKey(entry.pack.request.learner.cards))?.cards??first?.hands[0]?.cards??[]));resetChoice();setConsent(false);setError('');setNotice(null);setProgress(null)}
 async function refresh(){if(!canNetwork)return;const generation=++healthGeneration.current;setChecking(true);const results=await Promise.allSettled([solverHealth(),solverMember()]);if(!mounted.current||generation!==healthGeneration.current)return;setHealth(results[0].status==='fulfilled'?results[0].value:null);setMember(results[1].status==='fulfilled'?results[1].value:null);setChecking(false)}
 function cancel(){runGeneration.current++;busy.current=false;setRunning(false);setProgress(null);setNotice('cancelled');void client.current.cancel()}
 useEffect(()=>{
  mounted.current=true;let stopped=false;
  void (async()=>{const checked=await Promise.allSettled(bundledPacks.map(validatePack));if(stopped)return;const good=checked.flatMap(r=>r.status==='fulfilled'?[{pack:r.value,source:'bundled' as const}]:[]);setEntries(good);if(good[0])activate(good[0]);if(checked.some(r=>r.status==='rejected'))setNotice('bundledInvalid');setLoading(false)})();
  void refresh();
  const removeBackground=onBackground(()=>{if(busy.current)cancel()});
  const identity=()=>{setMember(null);setConsent(false);if(busy.current)cancel();void refresh()};
  const channel=canNetwork?new BroadcastChannel('pok:account-change'):null;if(channel)channel.onmessage=identity;
  window.addEventListener('pok-profile-change',identity);
  return()=>{stopped=true;mounted.current=false;runGeneration.current++;healthGeneration.current++;busy.current=false;void client.current.cancel();channel?.close();removeBackground();window.removeEventListener('pok-profile-change',identity)};
 },[]);
 async function solve(){
  if(busy.current||hasPendingEdits||!canNetwork||!member||!health?.available||!consent)return;
  const generation=++runGeneration.current;busy.current=true;setRunning(true);setError('');setNotice(null);setProgress(null);
  try{
   const input=validateSolveRequest({...request,requestId:requestId(),analysisRevision:request.analysisRevision+1});setRequest(input);
   const result=await client.current.solve(input,member.csrf,job=>{if(mounted.current&&generation===runGeneration.current)setProgress(job)});
   if(!mounted.current||generation!==runGeneration.current)return;
   if(!['COMPLETE','PARTIAL'].includes(result.status))throw Error(result.completionReason);
   const body:Omit<SolutionPack,'checksum'>={schemaVersion:1,id:`local-${crypto.randomUUID()}`,version:1,title:t('freshTitle'),explanation:t('freshExplanation'),request:input,result,verification:{method:'Solver-reported best response; independent review not run',gap:result.metric?.value??0,value:result.rootValues[0]??0,tolerance:0}};
   const pack=await validatePack({...body,checksum:await digest(body)});if(!mounted.current||generation!==runGeneration.current)return;
   const entry:PackEntry={pack,source:'fresh'};setEntries(old=>[...old.filter(e=>e.pack.id!==pack.id),entry]);activate(entry);setNotice('completed');
  }catch(e){if(mounted.current&&generation===runGeneration.current)setError(e instanceof APIError?e.code:e instanceof Error?e.message:'request_failed')}
  finally{if(mounted.current&&generation===runGeneration.current){busy.current=false;setRunning(false)}}
 }
 async function importPackFile(file:File|undefined){
  if(!file||busy.current)return;setError('');setNotice(null);
  try{if(file.size>2_000_000)throw Error(t('fileTooLarge'));const pack=await validatePack(JSON.parse(await file.text()));if(!mounted.current)return;const entry:PackEntry={pack,source:'imported'};setEntries(old=>[...old.filter(e=>e.pack.id!==pack.id),entry]);activate(entry);setNotice('importedOK')}catch(e){if(mounted.current)setError(e instanceof Error?e.message:'invalid_pack')}
 }
 function importPack(event:ChangeEvent<HTMLInputElement>){const file=event.target.files?.[0];event.target.value='';void importPackFile(file)}
 async function importNativePack(){try{await importPackFile(await openNativeBackup())}catch(e){if((e as Error).message!=='USER_CANCELLED')setError(e instanceof Error?e.message:'invalid_pack')}}
 function applyEditor(){if(busy.current)return;setError('');try{const next=requestFor(request,editor);setRequest(next);setEditor(editorFor(next));setActive(null);setSelected('');resetChoice();setConsent(false);setProgress(null);setNotice('applied')}catch(e){setError(e instanceof Error?e.message:'invalid_request')}}
 const update=(key:keyof Editor,value:string)=>setEditor(old=>({...old,[key]:value}));
 const result=active?.pack.result;
 const shownRequest=active?.pack.request??request;
 const entryLabel=(entry:PackEntry)=>entry.source==='fresh'?t('fresh'):locale==='ro'&&entry.source==='bundled'?(bundledRomanianText[entry.pack.id]?.title??entry.pack.title):entry.pack.title;
 const description=active&&locale==='ro'&&active.source==='bundled'?(bundledRomanianText[active.pack.id]?.explanation??active.pack.explanation):active?.pack.explanation;
 return <section className="strategy-lab" lang={locale==='ro'?'ro':'en'} dir={getLocaleMetadata(locale==='ro'?'ro':'en').dir} data-testid="strategy-lab">
  <div className="strategy-head"><div><span className="badge">{t('notFullGame')}</span><h2>{t('title')}</h2></div>{active&&<button disabled={running} onClick={()=>{downloadJSON(active.pack,`POK-strategy-${active.pack.id}-v${active.pack.version}.json`);setNotice('exported')}}>{t('export')}</button>}</div>
  <p className="strategy-intro">{t('intro')}</p>
  {locale!=='en'&&locale!=='ro'?<p className="notice" lang="en">{t('fallback')}</p>:<p className="strategy-note">{t('translation')}</p>}
  {loading&&<p role="status">{t('loading')}</p>}
  {error&&<div className="error" role="alert"><p>{t('error')}</p><p className="strategy-error-details" dir="auto">{error}</p></div>}
  {notice&&<p className="notice" role="status">{t(notice)}</p>}
  <div className="strategy-layout"><div className="strategy-main">
   <section className="panel">
    <label>{t('scenario')}<select value={selected} disabled={running} onChange={e=>{const entry=entries.find(p=>p.pack.id===e.target.value);if(entry)activate(entry)}}><option value="" disabled>{t('custom')}</option>{entries.map(entry=><option key={entry.pack.id} value={entry.pack.id}>{entryLabel(entry)}</option>)}</select></label>
    {!loading&&!entries.length&&<p className="notice">{t('noPack')}</p>}
    {active&&<><span className="badge">{t(active.source==='bundled'?'savedVerified':active.source==='fresh'?'fresh':'imported')}</span><p dir="auto">{description}</p>{active.source==='imported'&&<p className="notice">{t('importTrust')}</p>}</>}
    <div className="strategy-board"><strong>{t('board')}</strong><Cards cards={shownRequest.board.map(c=>parseCards(c)[0])}/></div>
    <dl className="strategy-givens"><div><dt>{t('pot')}</dt><dd>{num(shownRequest.pot,0)} {t('chips')}</dd></div><div><dt>{t('stack')}</dt><dd>{num(shownRequest.effectiveStack,0)} {t('chips')}</dd></div></dl>
    <details><summary>{t('ranges')}</summary>{shownRequest.players.map(p=><div key={p.id}><h3>{t(p.position==='OOP'?'oop':'ip')}</h3><p className="strategy-range" dir="ltr">{rangeText(p.combinations)}</p></div>)}</details>
    <details><summary>{t('tree')}</summary><p>{t('treeHelp')}</p><dl className="strategy-givens"><div><dt>{t('betSizes')}</dt><dd><bdi>{shownRequest.tree.betSizes.map(v=>num(v,0)).join(' / ')}</bdi></dd></div><div><dt>{t('raiseSizes')} (TO)</dt><dd><bdi>{shownRequest.tree.raiseTo.map(v=>num(v,0)).join(' / ')||'—'}</bdi></dd></div><div><dt>{t('maxRaises')}</dt><dd>{num(shownRequest.tree.maxRaises,0)}</dd></div></dl></details>
    <details><summary>{t('assumptions')}</summary><p>{t('technical')}</p><pre className="strategy-technical">{JSON.stringify(shownRequest,null,2)}</pre></details>
   </section>
   {active&&<section className="panel" data-testid="strategy-study"><h2>{t('tryDecision')}</h2><p>{t('guessFirst')}</p>
    {node&&handRow?<>
     <div className="strategy-form-grid"><label>{t('chooseNode')}<select value={node.path} dir="ltr" onChange={e=>{setPath(e.target.value);setHand('');resetChoice()}}>{result!.nodes.map(n=><option key={n.path} value={n.path}>{n.path||'root'} · {n.actor===0?'OOP':'IP'}</option>)}</select></label><label>{t('chooseHand')}<select value={handKey(handRow.cards)} dir="ltr" onChange={e=>{setHand(e.target.value);resetChoice()}}>{node.hands.map(h=><option key={handKey(h.cards)} value={handKey(h.cards)}>{h.cards.join(' ')}</option>)}</select></label></div>
     <Cards cards={handRow.cards.map(c=>parseCards(c)[0])}/><p className="strategy-note">{t(node.actor===0?'oop':'ip')}</p>
     <div className="strategy-actions" aria-label={t('tryDecision')}>{node.actions.map(action=><button key={action} aria-pressed={choice===action} onClick={()=>{setChoice(action);setRevealed(true)}}><bdi>{actionText(action)}</bdi></button>)}</div>
     <button onClick={()=>setRevealed(value=>!value)} aria-expanded={revealed}>{t(revealed?'hide':'show')}</button>
     {!revealed&&<p className="strategy-note">{t('resultHidden')}</p>}
     {revealed&&<div data-testid="strategy-answer"><h3>{t('strategy')}</h3><p>{t('evBaseline')}</p><ul className="strategy-action-results">{node.actions.map((action,i)=><li className="strategy-action-row" key={action}><div className="strategy-action-row-header"><strong><bdi>{actionText(action)}</bdi></strong><span>{t('frequency')}: {formatNumber(locale,handRow.probabilities[i],{style:'percent',maximumFractionDigits:1})}</span></div><div className="strategy-bar" aria-hidden="true"><span style={{width:`${Math.min(100,Math.max(0,handRow.probabilities[i]*100))}%`}}/></div><span>{t('ev')}: <bdi>{num(handRow.actionEV[i],3)}</bdi> {t('chips')}</span></li>)}</ul>
      {regret&&<div className="strategy-result"><dl><dt>{t('selectedAction')}</dt><dd><bdi>{actionText(choice!)}</bdi></dd><dt>{t('regret')}</dt><dd>{num(regret.regret,3)} {t('chips')}</dd></dl><p>{t('regretExplanation')}</p>{!regret.gradeAvailable||active.source!=='bundled'?<p className="notice">{t(handRow.reach<=1e-8?'unreached':'noGrade')}</p>:regret.regret<1e-9?<p>{t('goodWithinModel')}</p>:null}<button onClick={resetChoice}>{t('tryAgain')}</button></div>}
      <p className="notice">{t('qualityCaveat')}</p></div>}
     <p className="strategy-note">{t('attemptNote')}</p>
    </>:<p>{t(node?'noHands':'noNode')}</p>}
   </section>}
   <details className="panel"><summary>{t('advanced')}</summary><p>{t('advancedHelp')}</p><p>{t('weightsHelp')}</p>{hasPendingEdits&&<p className="notice">{t('pendingEdits')}</p>}
    <form onSubmit={e=>{e.preventDefault();applyEditor()}}><fieldset disabled={running} style={{border:0,padding:0,margin:0}}><div className="strategy-form-grid">
     <label className="strategy-full">{t('board')}<input dir="ltr" required value={editor.board} onChange={e=>update('board',e.target.value)} maxLength={40}/><span className="strategy-note">{t('boardHelp')}</span></label>
     <label>{t('pot')}<input type="number" required min={2} max={10000} step={1} value={editor.pot} onChange={e=>update('pot',e.target.value)}/></label><label>{t('stack')}<input type="number" required min={1} max={10000} step={1} value={editor.stack} onChange={e=>update('stack',e.target.value)}/></label>
     <label>{t('oopRange')}<textarea dir="ltr" required value={editor.oop} onChange={e=>update('oop',e.target.value)} maxLength={2000}/></label><label>{t('ipRange')}<textarea dir="ltr" required value={editor.ip} onChange={e=>update('ip',e.target.value)} maxLength={2000}/></label>
     <label>{t('betSizes')}<input dir="ltr" required value={editor.bets} onChange={e=>update('bets',e.target.value)} maxLength={25}/></label><label>{t('raiseSizes')} (TO)<input dir="ltr" value={editor.raises} onChange={e=>update('raises',e.target.value)} maxLength={12}/></label>
     <p className="strategy-full strategy-note">{t('treeHelp')}</p>
     <label>{t('learner')}<select value={editor.learner} onChange={e=>update('learner',e.target.value)}><option value="OOP">{t('oop')}</option><option value="IP">{t('ip')}</option></select></label><label>{t('learnerCards')}<input required dir="ltr" value={editor.hand} onChange={e=>update('hand',e.target.value)} maxLength={12}/></label>
    </div><details><summary>{t('settings')}</summary><div className="strategy-form-grid"><label>{t('dead')}<input dir="ltr" value={editor.dead} onChange={e=>update('dead',e.target.value)} maxLength={40}/></label><label>{t('targetGap')}<input type="number" required min={.000001} max={10000} step="any" value={editor.gap} onChange={e=>update('gap',e.target.value)}/></label><label>{t('iterations')}<input type="number" required min={100} max={health?.limits.iterations??20000} step={1} value={editor.iterations} onChange={e=>update('iterations',e.target.value)}/></label><label>{t('budget')} ({t('seconds')})<input type="number" required min={.1} max={(health?.limits.timeMs??15000)/1000} step={.1} value={editor.time} onChange={e=>update('time',e.target.value)}/></label></div></details>
    <div className="button-row"><button className="primary" type="submit">{t('apply')}</button>{active&&<button type="button" onClick={()=>setEditor(editorFor(active.pack.request))}>{t('reset')}</button>}</div></fieldset></form>
   </details>
  </div><aside className="strategy-side">
   <section className="panel"><h2>{t('solve')}</h2><p>{t('localOnly')}</p>{ANDROID&&<p className="notice">{t('nativeAndroid')}</p>}
    {canNetwork?<><div className="strategy-status"><strong>{t('status')}</strong><span>{t(checking?'loading':health?.available?'ready':'notReady')}</span><button disabled={checking||running} onClick={()=>void refresh()}>{t('refresh')}</button></div>{!health?.available&&<p className="notice">{t('unavailable')}</p>}{health?.reason&&<p className="strategy-note" dir="auto">{health.reason}</p>}
    {!member?<><p>{t('accountRequired')}</p><button onClick={onAccount}>{t('account')}</button></>:<><label className="strategy-check"><input type="checkbox" checked={consent} disabled={running} onChange={e=>setConsent(e.target.checked)}/><span>{t('permission')}</span></label><p className="strategy-note">{t('permissionHelp')}</p>{hasPendingEdits&&<p className="notice">{t('pendingEdits')}</p>}<button className="primary" disabled={running||hasPendingEdits||!consent||!health?.available} onClick={()=>void solve()}>{t('solve')}</button></>}
    {running&&<div role="status"><p>{t('running')}</p><progress aria-label={t('progress')} max={request.budget.iterations} value={progress?.progress.iteration??0}/><p>{t('iterations')}: {num(progress?.progress.iteration??0,0)} / {num(request.budget.iterations,0)}</p>{progress?.progress.gap!=null&&<p>{t('gap')}: {num(progress.progress.gap,4)} {t('chips')}</p>}<button onClick={cancel}>{t('cancel')}</button></div>}</>:<p className="strategy-note">{t('accountRequired')}</p>}
   </section>
   {result&&<section className="panel" data-testid="strategy-quality"><h2>{t('quality')}</h2><span className="badge">{t(result.status==='COMPLETE'?'statusComplete':result.status==='PARTIAL'?'statusPartial':'statusOther')}</span>{result.status==='PARTIAL'&&<p className="notice">{t('partial')}</p>}<dl className="strategy-givens"><div><dt>{t('iterations')}</dt><dd>{num(result.iterations,0)}</dd></div><div><dt>{t('elapsed')}</dt><dd>{num(result.elapsedMs/1000,2)} {t('seconds')}</dd></div><div><dt>{t('gap')}</dt><dd>{result.metric?`${num(result.metric.value,4)} ${t('chips')}`:t('qualityUnknown')}</dd></div></dl><p>{t('gapHelp')}</p><p className="notice">{t('qualityCaveat')}</p><details><summary>{t('evidence')}</summary><p>{t('technical')}</p><pre className="strategy-technical">{JSON.stringify({engine:result.engineId,revision:result.upstreamRevision,adapter:result.adapterVersion,location:result.location,method:result.method,completionReason:result.completionReason,inputHash:result.inputHash,verification:active!.pack.verification,reproducibility:result.reproducibility,metric:result.metric,convergenceTrace:result.trace},null,2)}</pre></details><details><summary>{t('limits')}</summary><ul>{result.limitations.map((limit,i)=><li key={i} dir="auto">{limit}</li>)}</ul></details></section>}
   <section className="panel"><h2>{t('import')}</h2><p>{t('importHelp')}</p>{ANDROID?<button disabled={running} onClick={()=>void importNativePack()}>{t('import')}</button>:<label>{t('import')}<input className="strategy-file" type="file" accept="application/json,.json" disabled={running} onChange={importPack}/></label>}</section>
  </aside></div>
 </section>;
}
