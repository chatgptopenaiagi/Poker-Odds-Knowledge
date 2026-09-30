import {createContext,useContext} from 'react';
import {tr,type Locale} from './i18n';
export const SelfCountryContext=createContext<string|null>(null);
export function CountryBadge({country,locale}:{country:string;locale:Locale}){const name=new Intl.DisplayNames([locale],{type:'region'}).of(country)??country;return <span className="country-badge" tabIndex={0} aria-label={`${name} · ${tr(locale,'platform.selfSelected')}`} title={`${name} · ${tr(locale,'platform.selfSelected')}`}><img src={`/holdem-lab/flags/${country.toLowerCase()}.svg`} alt=""/><bdi>{country}</bdi><span className="country-label">{name} · {tr(locale,'platform.selfSelected')}</span></span>}
export function SelfCountry({locale}:{locale:Locale}){const country=useContext(SelfCountryContext);return country?<CountryBadge country={country} locale={locale}/>:null}
