import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {messages,glossary} from '../src/i18n';
import {lessons} from '../src/lessons';

// One-time baseline extraction. Subsequent additions use stable catalog keys.
const out = path.resolve('src/locales');
fs.mkdirSync(out,{recursive:true});
const catalogs = {en:{...messages.en} as Record<string,string>,ro:{...messages.ro} as Record<string,string>};
const legacy:Record<string,string>={};
function hash(s:string){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return(h>>>0).toString(16)}
for(const file of fs.readdirSync('src').filter(f=>f.endsWith('.tsx'))){
 const source=ts.createSourceFile(file,fs.readFileSync(path.join('src',file),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 function visit(node:ts.Node){
  if(ts.isCallExpression(node)&&node.expression.getText(source)==='words'&&node.arguments.length>=3){
   const en=node.arguments[1],ro=node.arguments[2];
   if(ts.isStringLiteralLike(en)&&ts.isStringLiteralLike(ro)){const key='legacy.'+hash(en.text);legacy[en.text]=key;catalogs.en[key]=en.text;catalogs.ro[key]=ro.text;}
  }ts.forEachChild(node,visit);
 }visit(source);
}
for(const lang of ['en','ro'] as const){
 for(const l of lessons)for(const field of ['title','prompt','explanation'] as const)catalogs[lang][`lessons.${l.id}.${field}`]=l[field][lang];
 glossary.forEach((g,i)=>catalogs[lang][`glossary.${i}`]=g[lang]);
 fs.writeFileSync(path.join(out,lang+'.json'),JSON.stringify({version:1,source:'Original HIL 1.0 authored catalog; linguistic review not independently recorded',humanReview:false,translation:catalogs[lang]},null,2)+'\n');
}
fs.writeFileSync(path.join(out,'legacy-keys.json'),JSON.stringify(legacy,null,2)+'\n');
console.log(JSON.stringify({englishKeys:Object.keys(catalogs.en).length,legacyKeys:Object.keys(legacy).length,lessons:lessons.length}));
