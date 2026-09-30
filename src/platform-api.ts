import {saveStudyJSON,notifyFileError} from './native-files';
export type Member={user:{id:string;name:string;email:string;role:string;twoFactorEnabled:boolean};profile:{country:string|null;show_country:number;locale:string};csrf:string;restrictions:{id:string;kind:string;reason:string;expires_at:number|null}[]};
export type Provider={id:string;name:string;enabled:boolean;support:string;configured:boolean;approved:boolean;adapter:boolean;liveTested:boolean;note:string};
export type PlatformStatus={online:boolean;mode:string;mail:string;countries:string[];providers:Provider[]};
export type ContentItem={id:string;author_id:string;kind:string;parent_id:string|null;title:string;body:string;category:string;status:string;created_at:number;name:string;country:string|null};
export class APIError extends Error{constructor(public status:number,public code:string){super(code)}}
export async function api<T=any>(path:string,method='GET',body?:unknown,csrf?:string,signal?:AbortSignal):Promise<T>{
 if(!path.startsWith('/api/'))throw Error('Invalid local API path');
 const response=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:{...(method==='GET'?{}:{'Content-Type':'application/json'}),...(csrf?{'X-POK-CSRF':csrf}:{})},...(method==='GET'?{}:{body:JSON.stringify(body??{})}),signal});
 const value=await response.json().catch(()=>({error:'request_failed'}));if(!response.ok)throw new APIError(response.status,value.error?.code??value.error??value.code??'request_failed');return value;
}
export function downloadJSON(value:unknown,name:string){void saveStudyJSON(JSON.stringify(value,null,2),name).catch(notifyFileError)}
export async function streamCoach(body:unknown,csrf:string,signal:AbortSignal,onText:(text:string)=>void){
 const response=await fetch('/api/coach',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json',Accept:'text/event-stream','X-POK-CSRF':csrf},body:JSON.stringify(body),signal});
 if(!response.ok||!response.body)throw new APIError(response.status,'coach_unavailable_or_limited');
 const reader=response.body.getReader(),decoder=new TextDecoder();let pending='',text='',done=false;
 try{for(;;){const chunk=await reader.read();if(chunk.done)break;pending+=decoder.decode(chunk.value,{stream:true});if(pending.length>40000)throw Error('Stream bounds exceeded');let boundary;
  while((boundary=pending.indexOf('\n\n'))>=0){const event=pending.slice(0,boundary);pending=pending.slice(boundary+2);const type=event.match(/^event: (.+)$/m)?.[1];const data=JSON.parse(event.match(/^data: (.+)$/m)?.[1]??'{}');if(type==='delta'){if(typeof data.text!=='string'||text.length+data.text.length>16000)throw Error('Invalid coach stream');text+=data.text;onText(text)}else if(type==='done')done=true;else if(type==='error')throw Error('Coach stream stopped')}
 }}finally{reader.releaseLock()}if(!done)throw Error('Coach stream did not finish');
}
