import {useState} from 'react';
import {lessons} from './lessons';
import {tr,type Locale} from './i18n';
export default function FAQ({locale}:{locale:Locale}){
 const [query,setQuery]=useState('');const text=(id:string,k:string)=>tr(locale,`lessons.${id}.${k}`);
 const rows=lessons.filter(l=>`${text(l.id,'title')} ${text(l.id,'prompt')} ${text(l.id,'explanation')}`.toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale)));
 return <section className="panel faq"><h2>{tr(locale,'platform.faq')}</h2><p>{tr(locale,'platform.faqHelp')}</p><label>{tr(locale,'platform.search')}<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label><p role="status">{rows.length} / {lessons.length}</p>{rows.map(l=><details key={l.id}><summary>{text(l.id,'title')}</summary><p>{text(l.id,'prompt')}</p><p>{text(l.id,'explanation')}</p><small><bdi>{l.id} · v{l.version} · {l.method}</bdi></small></details>)}</section>
}
