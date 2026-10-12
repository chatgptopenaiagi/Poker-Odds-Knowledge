import {readdirSync,readFileSync,writeFileSync,realpathSync,statSync} from 'node:fs';
import {resolve,relative,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=realpathSync(process.cwd());
const directory=realpathSync(resolve(process.argv[2]??'dist'));
if(!directory.startsWith(root+sep)||directory===root)throw Error('Build directory must be within the selected repository');
const hash=b=>createHash('sha256').update(b).digest('hex');
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>{if(e.isSymbolicLink())throw Error('No symlinks allowed in build');const p=resolve(dir,e.name);return e.isDirectory()?walk(p):[p]})}
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim();
const files=walk(directory).filter(p=>relative(directory,p)!=='build-info.json').map(p=>({path:relative(directory,p).replaceAll('\\','/'),sha256:hash(readFileSync(p)),bytes:statSync(p).size})).sort((a,b)=>a.path.localeCompare(b.path));
const manifest={schema:1,product:'Poker Odds Knowledge',sourceCommit:git(['rev-parse','HEAD']),trackedChanges:git(['status','--porcelain','--untracked-files=no'])!=='',mode:process.argv[3]??'production',builtAt:new Date().toISOString(),assetSetSha256:hash(JSON.stringify(files)),files};
writeFileSync(resolve(directory,'build-info.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({sourceCommit:manifest.sourceCommit,assetSetSha256:manifest.assetSetSha256,files:files.length}));
