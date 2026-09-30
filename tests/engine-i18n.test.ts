import {describe,it,expect} from 'vitest';
import catalogs from '../src/locales/engines.json';
import {engineText,type EngineString} from '../src/engines/strings';
import {supportedLocales,getLocaleMetadata} from '../src/i18n';

const keys=['engine','automatic','standard','hybrid','compare','details','cancel','calculate','retry','useStandard','catalog','preview','shared','location','assumptions'] as const satisfies readonly EngineString[];
describe('analysis engine catalogs: mechanical validation, no linguistic approval',()=>{
 it('covers exactly the 41 supported languages and the agreed 15 keys',()=>{
  expect(Object.keys(catalogs).sort()).toEqual([...supportedLocales].sort());
  expect(supportedLocales).toHaveLength(41);
  expect(Object.keys(catalogs.en).sort()).toEqual([...keys].sort());
 });
 it.each(supportedLocales)('%s has safe actual text, preserved brands, and no key fallback',locale=>{
  const catalog=catalogs[locale];
  expect(Object.keys(catalog).sort()).toEqual([...keys].sort());
  for(const key of keys){
   const value=catalog[key];
   expect(value.trim().length,key).toBeGreaterThan(1);
   expect(value,key).not.toMatch(/[<>\uFFFD\u202A-\u202E\u2066-\u2069]|javascript:|\{\{/i);
   expect(engineText(locale,key),key).toBe(value);
   expect(engineText(locale,key),key).not.toBe(key);
   expect(engineText(locale,key),key).not.toMatch(/English fallback|text unavailable/);
  }
  if(locale!=='en'){
   expect(catalog.engine).not.toBe(catalogs.en.engine);
   expect(catalog.standard).not.toBe(catalogs.en.standard);
   expect(catalog.shared).not.toBe(catalogs.en.shared);
  }
  expect(catalog.hybrid).toContain('POK');expect(catalog.hybrid).toContain('PH');
  expect(catalog.useStandard).toContain('POK Standard');expect(catalog.shared).toContain('POK');
  expect(getLocaleMetadata(locale).humanReview).toBe(false);
 });
 it('declares the four RTL languages without embedding invisible direction controls',()=>{
  expect(supportedLocales.filter(locale=>getLocaleMetadata(locale).dir==='rtl')).toEqual(['ar','he','fa','ur']);
  for(const locale of ['ar','he','fa','ur'] as const)expect(catalogs[locale].shared).toMatch(/[\u0590-\u08ff]/);
 });
});
