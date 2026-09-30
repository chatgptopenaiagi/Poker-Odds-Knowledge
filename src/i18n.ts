import i18next from 'i18next';
import {catalogs} from './locales/catalogs';
import legacyKeys from './locales/legacy-keys.json';
import {glossary as originalGlossary} from './locales/glossary-original';
import {supportedLocales,getLocaleMetadata,isLocale,type Locale} from './locales/metadata';
import {appearanceEnglish,appearanceRomanian} from './appearance';
import {platformEnglish} from './platform-messages';
import appearanceCatalogs from './locales/appearance.json';
import platformRomanian from './locales/platform-ro.json';
import platformInternational from './locales/platform-international.json';
import platformEurope from './locales/platform-europe.json';
import mailCatalogs from './locales/mail.json';
export {supportedLocales,getLocaleMetadata,isLocale};
export type {Locale};
export type MessageKey=string;
export const CATALOG_VERSION=1;
export const messages:Record<Locale,Record<string,string>>=Object.fromEntries(supportedLocales.map(locale=>[locale,catalogs[locale]?.translation??{}])) as Record<Locale,Record<string,string>>;
for(const locale of supportedLocales)Object.assign(messages[locale],appearanceCatalogs[locale]);
Object.assign(messages.ro,platformRomanian);
for(const locale of supportedLocales)Object.assign(messages[locale],(platformInternational as Record<string,Record<string,string>>)[locale],(platformEurope as Record<string,Record<string,string>>)[locale]);
for(const locale of supportedLocales)Object.assign(messages[locale],mailCatalogs[locale]);
Object.assign(messages.en,Object.fromEntries(Object.entries(platformEnglish).map(([key,value])=>[`platform.${key}`,value])),Object.fromEntries(Object.entries(appearanceEnglish).map(([key,value])=>[`appearance.${key}`,value])));
Object.assign(messages.ro,Object.fromEntries(Object.entries(appearanceRomanian).map(([key,value])=>[`appearance.${key}`,value])));
// A label-plus-count construction avoids forcing English noun inflection onto
// other scripts. i18next still selects the locale's CLDR plural category.
for(const locale of supportedLocales)for(const category of new Intl.PluralRules(locale).resolvedOptions().pluralCategories){
 messages[locale][`drillsCount_${category}`]=`${messages[locale].drills}: {{count}}`;
 messages[locale][`attemptsCount_${category}`]=`${messages[locale].attempts}: {{count}}`;
}
export const i18n=i18next.createInstance();
void i18n.init({resources:Object.fromEntries(supportedLocales.map(locale=>[locale,{translation:messages[locale]}])),lng:'en',fallbackLng:'en',supportedLngs:[...supportedLocales],keySeparator:false,initAsync:false,interpolation:{escapeValue:false},returnNull:false});
export function tr(locale:Locale,key:string,values:Record<string,string|number>={}):string{return String(i18n.t(key,{lng:locale,...values,defaultValue:messages.en[key]??'English fallback: text unavailable'}));}
export const t=tr;
export function words(locale:Locale,en:string,ro:string):string{
 const key=(legacyKeys as Record<string,string>)[en];
 if(key)return tr(locale,key);
 return locale==='ro'?ro:en;
}
export const hasTranslation=(locale:Locale,key:string):boolean=>Object.hasOwn(messages[locale],key);
export const formatNumber=(locale:Locale,value:number,options:Intl.NumberFormatOptions={})=>new Intl.NumberFormat(locale,options).format(value);
export const formatDate=(locale:Locale,value:Date|string,options:Intl.DateTimeFormatOptions={})=>new Intl.DateTimeFormat(locale,options).format(typeof value==='string'?new Date(value):value);
export const glossary=originalGlossary.map((item,index)=>({...item,...Object.fromEntries(supportedLocales.map(locale=>[locale,tr(locale,`glossary.${index}`)]))})) as ({term:string}&Record<Locale,string>)[];
export function translationCoverage(locale:Locale){const required=Object.keys(messages.en);const translated=required.filter(key=>hasTranslation(locale,key));return{locale,required:required.length,translated:translated.length,missing:required.filter(key=>!hasTranslation(locale,key)),humanReview:false};}
