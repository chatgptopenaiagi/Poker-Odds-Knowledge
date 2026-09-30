import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import catalog from '../fixtures/strategy/scenarios.json';
import {scenarioRequest} from '../src/strategy/scenario';
import {canonicalSolveResult} from '../server/strategy-adapter';
import {digest,validatePack,type SolutionPack} from '../src/strategy/contract';

// File names are fixed reviewed fixture IDs. Never read browser-provided paths.
const root=resolve(process.argv[2]??'artifacts/solver-scenarios');
const packs:SolutionPack[]=[];
for(const s of catalog.scenarios){
 const request=scenarioRequest(s);request.requestId=`pack-${s.id}-v${s.version}`;
 const raw=JSON.parse(await readFile(resolve(root,`${s.id}-10000.result.json`),'utf8'));
 const oracle=JSON.parse(await readFile(resolve(root,`${s.id}-10000.oracle.json`),'utf8'));
 const result=await canonicalSolveResult(raw,request,raw.elapsedMs);
 const q=oracle.independentStrategyQuality;
 if(!q)throw Error(`Missing independent oracle: ${s.id}`);
 // Detailed report structure is checked in the quality runner; these values must be present explicitly.
 const gap=q.independentNashConvChips??q.nashConvChips??q.quality?.nashConvChips;
 const value=oracle.equilibriumValueOOPChips;
 if(!Number.isFinite(gap)||gap>0.5||Math.abs(result.rootValues[0]-value)>0.5||Math.abs(result.metric!.value-gap)>0.001)throw Error(`Quality gate failed: ${s.id}`);
 const body={schemaVersion:1 as const,id:s.id,version:s.version,title:s.title,explanation:`${s.learningAim} ${s.wording} Weighted assumptions and restricted sizes define this study; it is not a full-game solution. The independent LP verifies the same finite game.`,request,result,verification:{method:'Independent PokerKit + SciPy HiGHS sequence-form LP and exact best responses',gap,value,tolerance:0.001}};
 const pack={...body,checksum:await digest(body)};await validatePack(pack);packs.push(pack);
}
await mkdir('public/strategy',{recursive:true});await writeFile('public/strategy/packs.json',JSON.stringify(packs,null,2)+'\n');
console.log(JSON.stringify({packs:packs.length,bytes:Buffer.byteLength(JSON.stringify(packs)),gaps:packs.map(p=>({id:p.id,nashConv:p.verification.gap,value:p.verification.value}))},null,2));
