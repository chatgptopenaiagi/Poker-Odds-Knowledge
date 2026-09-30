import {readFileSync,readdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=process.cwd(),lock=JSON.parse(readFileSync('package-lock.json','utf8'));const notices=[],versions=[];
for(const [relative,item] of Object.entries(lock.packages).sort()){
 if(!relative||!relative.startsWith('node_modules/')||!existsSync(relative+'/package.json'))continue;
 const pkg=JSON.parse(readFileSync(relative+'/package.json','utf8'));
 const files=readdirSync(relative,{withFileTypes:true}).filter(x=>x.isFile()&&/^(licen[cs]e|copying|notice)([.-]|$)/i.test(x.name)).map(x=>x.name);
 versions.push({name:pkg.name,version:pkg.version,license:pkg.license??item.license??'UNKNOWN',scope:item.dev?'development':'runtime',noticeFiles:files});
 notices.push(`${pkg.name} ${pkg.version}\nLicense metadata: ${JSON.stringify(pkg.license??item.license??'UNKNOWN')}\n${files.map(name=>name+'\n'+readFileSync(resolve(relative,name),'utf8')).join('\n\n')}`);
}
writeFileSync('public/THIRD_PARTY_NOTICES.txt','Poker Odds Knowledge — dependency notices\nOriginal application code: no public licensing decision has been made.\nPublic upstream contact addresses below belong to third-party legal notices, not application users.\n\n'+notices.join('\n\n----------------\n\n'));
writeFileSync('docs/DEPENDENCIES.json',JSON.stringify({lockfileVersion:lock.lockfileVersion,packages:versions},null,2)+'\n');
console.log(`Recorded ${versions.length} installed locked packages with their available notices.`);
