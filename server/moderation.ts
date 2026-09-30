export type DictionaryEntry = {id:string;locale:string;phrase:string;mode:'word'|'phrase';severity:'low'|'medium'|'high';category:'profanity'|'insult'|'threat'|'spam';exceptions:string[];enabled:boolean;source:string;review:'draft'|'reviewed'};
export const seedDictionary:DictionaryEntry[] = [
 ['en','idiot','insult','medium'],['en','kill you','threat','high'],['en','free crypto','spam','medium'],['en','fuck','profanity','low'],
 ['ro','idiot','insult','medium'],['ro','te omor','threat','high'],['de','idiot','insult','medium'],['de','ich töte dich','threat','high'],
 ['fr','imbécile','insult','medium'],['es','idiota','insult','medium'],['ar','سأقتلك','threat','high'],['he','טיפש','insult','medium'],
 ['ru','я тебя убью','threat','high'],['zh-Hans','杀了你','threat','high'],['ja','殺すぞ','threat','high'],['ko','죽여버린다','threat','high'],
 ['pt','idiota','insult','medium'],['it','idiota','insult','medium'],['nl','idioot','insult','medium'],['sv','idiot','insult','medium'],['da','idiot','insult','medium'],['nb','idiot','insult','medium'],['fi','idiootti','insult','medium'],['pl','idiota','insult','medium'],['cs','idiot','insult','medium'],['sk','idiot','insult','medium'],['hu','idióta','insult','medium'],['sl','idiot','insult','medium'],['hr','idiot','insult','medium'],['sr','идиот','insult','medium'],['bg','идиот','insult','medium'],['el','ηλίθιος','insult','medium'],['tr','aptal','insult','medium'],['uk','ідіот','insult','medium'],['fa','احمق','insult','medium'],['hi','बेवकूफ','insult','medium'],['bn','বোকা','insult','medium'],['ur','بیوقوف','insult','medium'],['ta','முட்டாள்','insult','medium'],['te','మూర్ఖుడు','insult','medium'],['mr','मूर्ख','insult','medium'],['th','ไอ้โง่','insult','medium'],['vi','đồ ngu','insult','medium'],['id','idiot','insult','medium'],['ms','bodoh','insult','medium'],['sw','mjinga','insult','medium']
].map(([locale,phrase,category,severity],i)=>({id:`seed-${i+1}`,locale,phrase,mode:phrase.includes(' ')?'phrase':'word',category:category as DictionaryEntry['category'],severity:severity as DictionaryEntry['severity'],exceptions:[],enabled:true,source:'POK machine-drafted seed; contextual human review required',review:'draft'}));
export function normalizeText(text:string){return text.normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/g,'').toLocaleLowerCase().replace(/\s+/g,' ').trim()}
export function cleanName(text:string){return text.normalize('NFC').replace(/[\u0000-\u001f\u007f\u202A-\u202E\u2066-\u2069\u200E\u200F]/g,'').trim().slice(0,60)}
export function validateDictionary(value:unknown):DictionaryEntry[]{
 if(!Array.isArray(value)||value.length>500)throw Error('dictionary_invalid');
 return value.map((v,i)=>{if(!v||typeof v!=='object')throw Error('dictionary_invalid'); const e=v as DictionaryEntry;
 if(typeof e.phrase!=='string'||!e.phrase.trim()||e.phrase.length>80||typeof e.locale!=='string'||e.locale.length>12||!['word','phrase'].includes(e.mode)||!['low','medium','high'].includes(e.severity)||!['profanity','insult','threat','spam'].includes(e.category)||!Array.isArray(e.exceptions)||e.exceptions.length>10||e.exceptions.some(x=>typeof x!=='string'||x.length>80))throw Error('dictionary_invalid');
 return {id:String(e.id||`entry-${i}`).slice(0,60),locale:e.locale,phrase:e.phrase,mode:e.mode,severity:e.severity,category:e.category,exceptions:e.exceptions,enabled:e.enabled===true,source:String(e.source||'Operator edit').slice(0,200),review:e.review==='reviewed'?'reviewed':'draft'};});
}
export function scanMessage(body:string,entries:DictionaryEntry[]){
 const normalized=normalizeText(body);const contextual=/[`“”"「」]|\b(quote|quotation|example|classroom|means|translation)\b/iu.test(body);
 return entries.filter(e=>e.enabled).flatMap(e=>{const phrase=normalizeText(e.phrase);if(e.exceptions.some(x=>normalized.includes(normalizeText(x))))return [];
 let found=false;let at=normalized.indexOf(phrase);while(at!==-1){const before=normalized.slice(0,at).at(-1)||'',after=normalized.slice(at+phrase.length,at+phrase.length+1);const cjk=/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(phrase); if(e.mode==='phrase'||cjk||(!/[\p{L}\p{N}_]/u.test(before)&&!/[\p{L}\p{N}_]/u.test(after))){found=true;break;}at=normalized.indexOf(phrase,at+1)}
 return found?[{entryId:e.id,locale:e.locale,category:e.category,severity:e.severity,contextual,review:e.review}]:[];
 });
}
