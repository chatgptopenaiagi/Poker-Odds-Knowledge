import {describe,it,expect} from 'vitest';
import {supportedLocales,isLocale,getLocaleMetadata,messages,tr,words,formatNumber,formatDate,translationCoverage,hasTranslation} from '../src/i18n';
import {catalogs} from '../src/locales/catalogs';
import {lessons,gradeLesson} from '../src/lessons';
import mail from '../src/locales/mail.json';

const coreKeys='play|odds|drills|review|progress|settings|newHand|nextHand|fold|check|call|bet|raise|allIn|pot|stack|board|hero|pause|resume|step|reveal|hide|practice|learn|guessFirst|submit|next|replay|export|import|reset|cancel|confirm|beginner|advanced|language|reducedMotion|correct|tryAgain|answer|explanation|accuracy|attempts|chips|loading|stop|range|weight|knownCards|equity|assumptions|method|samples|start'.split('|');
const formulas=['5 / 7; 0, 1, 2','A–2–3–4–5 → 5; Q–K–A–2–3 ✗','K K A Q 7 > K K A J 7','1/3 × 100 = 33.333…%','13 − 4 = 9','9/47 × 100 = 19.1489…%','1 − C(38,2)/C(47,2) = 378/1081 = 34.9676…%','9/46 × 100 = 19.5652…%','9 × 4 = 36%; 34.9676…% ≠ 36%','C(52,2) = 52 × 51 / 2 = 1326','C(4,2) = 6','4 × 1 = 4','4 × 3 = 12','C(3,2) = 3','52 − 2 − 2 − 3 = 45; C(45,2) = 990','C/(P+C) = 20/(80+20) = 20%','E(P+C) − C = 0.25 × 100 − 20 = +5','0.15 × (80+20) − 20 = −5','F×100 − (1−F)×50 = 0; F = 50/(100+50) = 1/3','0.4×100 − 0.6×50 = 40 − 30 = +10','(30×1 + 20×1/2 + 50×0)/100 = 40%','min(240,90) = 90','1 → 2; 2 → 1','0.10×(80+20+100) − 20 = 0','5 − 0.10×80 = −3','3×30 = 90; 2×50 = 100','(6×1)/(6×1+6×0.5) × 100 = 66.666…%','9 + 8 − 2 = 15'];
describe('versioned translation catalogs: mechanical checks, not linguistic approval',()=>{
 it('has exactly 41 distinct targets and four explicit RTL locales',()=>{
  expect(supportedLocales).toHaveLength(41);expect(new Set(supportedLocales).size).toBe(41);
  expect(supportedLocales.filter(l=>getLocaleMetadata(l).dir==='rtl')).toEqual(['ar','he','fa','ur']);
  expect(isLocale('zh-Hans')).toBe(true);expect(isLocale('xx')).toBe(false);expect(isLocale('__proto__')).toBe(false);
 });
 it.each(supportedLocales)('%s: authored controls, all 28 lessons, mail placeholders and local formatting',locale=>{
  expect(catalogs[locale].version).toBe(1);expect(getLocaleMetadata(locale).humanReview).toBe(false);
  for(const key of coreKeys){expect(hasTranslation(locale,key),key).toBe(true);expect(tr(locale,key).trim().length).toBeGreaterThan(0);}
  for(const [index,lesson]of lessons.entries()){
   for(const field of ['title','prompt','explanation']as const){const key=`lessons.${lesson.id}.${field}`;expect(hasTranslation(locale,key),key).toBe(true);expect(tr(locale,key)).toBe(lesson[field][locale]);expect(tr(locale,key).length).toBeGreaterThan(4);}
   if(locale!=='en'&&locale!=='ro'){expect(lesson.prompt[locale]).not.toBe(lesson.prompt.en);expect(lesson.explanation[locale].split('\n')[0]).toBe(formulas[index]);}
   expect(gradeLesson(lesson,lesson.answer).correct).toBe(true);
  }
  expect(Object.keys(mail[locale])).toHaveLength(7);
  for(const action of ['verify','reset','delete']){const key=`mail.${action}.body`;expect(messages[locale][key].match(/\{\{url\}\}/g)).toHaveLength(1);expect(tr(locale,key,{url:'https://example.invalid/action'})).toContain('https://example.invalid/action');expect(tr(locale,key,{url:'x'})).not.toContain('{{');}
  for(const category of new Intl.PluralRules(locale).resolvedOptions().pluralCategories)expect(messages[locale][`drillsCount_${category}`]).toContain('{{count}}');
  for(const count of [0,1,2,3,5,11,21,100])expect(tr(locale,'drillsCount',{count})).toContain(String(count));
  expect(formatNumber(locale,1234.5)).toBe(new Intl.NumberFormat(locale).format(1234.5));
  expect(formatDate(locale,'2026-09-30T12:00:00Z',{timeZone:'UTC'}).length).toBeGreaterThan(0);
  const coverage=translationCoverage(locale);expect(coverage.translated+coverage.missing.length).toBe(coverage.required);
  for(const text of Object.values(messages[locale])){expect(text).not.toMatch(/<script|javascript:|\uFFFD|[\u202A-\u202E\u2066-\u2069]/i);expect(text.match(/\{\{[^}]+\}\}/g)??[]).toEqual((text.match(/\{\{[^}]+\}\}/g)??[]).filter(p=>['{{count}}','{{url}}','{{scale}}','{{percent}}'].includes(p)));}
 });
 it('preserves Romanian source and discloses missing advanced text without raw keys',()=>{
  expect(words('ro','THE REASONING PATH','CALEA RAȚIONAMENTULUI')).toBe('CALEA RAȚIONAMENTULUI');
  expect(tr('ja','legacy.not-a-real-key')).toContain('English fallback');
  expect(getLocaleMetadata('ja').fallbackNotice).toContain('英語');
  expect(translationCoverage('ja').missing.length).toBeGreaterThan(0);
 });
});
