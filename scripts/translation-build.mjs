import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('src/locales');
export const coreKeys='play|odds|drills|review|progress|settings|newHand|nextHand|fold|check|call|bet|raise|allIn|pot|stack|board|hero|pause|resume|step|reveal|hide|practice|learn|guessFirst|submit|next|replay|export|import|reset|cancel|confirm|beginner|advanced|language|reducedMotion|correct|tryAgain|answer|explanation|accuracy|attempts|chips|loading|stop|range|weight|knownCards|equity|assumptions|method|samples|start'.split('|');
export const formulas=[
 '5 / 7; 0, 1, 2', 'A–2–3–4–5 → 5; Q–K–A–2–3 ✗', 'K K A Q 7 > K K A J 7', '1/3 × 100 = 33.333…%', '13 − 4 = 9', '9/47 × 100 = 19.1489…%', '1 − C(38,2)/C(47,2) = 378/1081 = 34.9676…%', '9/46 × 100 = 19.5652…%', '9 × 4 = 36%; 34.9676…% ≠ 36%', 'C(52,2) = 52 × 51 / 2 = 1326', 'C(4,2) = 6', '4 × 1 = 4', '4 × 3 = 12', 'C(3,2) = 3', '52 − 2 − 2 − 3 = 45; C(45,2) = 990', 'C/(P+C) = 20/(80+20) = 20%', 'E(P+C) − C = 0.25 × 100 − 20 = +5', '0.15 × (80+20) − 20 = −5', 'F×100 − (1−F)×50 = 0; F = 50/(100+50) = 1/3', '0.4×100 − 0.6×50 = 40 − 30 = +10', '(30×1 + 20×1/2 + 50×0)/100 = 40%', 'min(240,90) = 90', '1 → 2; 2 → 1', '0.10×(80+20+100) − 20 = 0', '5 − 0.10×80 = −3', '3×30 = 90; 2×50 = 100', '(6×1)/(6×1+6×0.5) × 100 = 66.666…%', '9 + 8 − 2 = 15'
];
const noteFor=[0,1,2,3,4,5,6,5,7,8,9,9,9,10,11,12,12,12,13,13,14,15,16,17,18,19,20,21];
export function catalog(locale,core,questions,notes,extra={}){
 const controls=core.split('|'),prompts=questions.split('\n').map(s=>s.trim()).filter(Boolean),explanations=notes.split('\n').map(s=>s.trim()).filter(Boolean);
 if(controls.length!==coreKeys.length||prompts.length!==28||explanations.length!==22)throw Error(`${locale}: core ${controls.length}/55, prompts ${prompts.length}/28, notes ${explanations.length}/22`);
 const translation=Object.fromEntries(coreKeys.map((key,i)=>[key,controls[i]]));
 prompts.forEach((q,i)=>{
  const id='HIL-'+String(i+1).padStart(3,'0');
  translation[`lessons.${id}.title`]=q;
  translation[`lessons.${id}.prompt`]=q;
  translation[`lessons.${id}.explanation`]=`${formulas[i]}\n${explanations[noteFor[i]]}`;
 });
 Object.assign(translation,extra);
 fs.writeFileSync(path.join(root,locale+'.json'),JSON.stringify({version:1,source:'Machine-drafted by the implementation agent; condensed adaptation of original HIL lessons; no paid translation API',humanReview:false,translation},null,2)+'\n');
 const files=fs.readdirSync(root).filter(f=>f.endsWith('.json')&&f!=='legacy-keys.json'&&JSON.parse(fs.readFileSync(path.join(root,f),'utf8')).translation);
 fs.writeFileSync(path.join(root,'catalogs.ts'),files.map((file,i)=>`import c${i} from './${file}';`).join('\n')+'\nexport const catalogs:Record<string,{version:number;source:string;humanReview:boolean;translation:Record<string,string>}>= {'+files.map((file,i)=>`${JSON.stringify(file.slice(0,-5))}:c${i}`).join(',')+'};\n');
}
