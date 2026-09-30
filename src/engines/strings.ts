import catalogs from '../locales/engines.json';
import type {Locale} from '../i18n';
export type EngineString=keyof typeof catalogs.en;
export function engineText(locale:Locale,key:EngineString):string {
  const messages=catalogs as Record<string,Record<string,string>>;
  return messages[locale]?.[key]??messages.en[key];
}
