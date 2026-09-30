import {registerPlugin} from '@capacitor/core';
import {ANDROID} from './preview';
type POKFiles={openBackup():Promise<{text:string;name:string}>;saveBackup(options:{text:string;name:string}):Promise<{saved:true}>;shareBackup(options:{text:string;name:string}):Promise<{shared:true}>};
const files=registerPlugin<POKFiles>('POKFiles');
export async function saveStudyJSON(text:string,name:string){
 if(ANDROID){await files.saveBackup({text,name});return}
 const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export async function openNativeBackup(){if(!ANDROID)throw Error('Native file picker is only available in the Android companion.');const result=await files.openBackup();if(new TextEncoder().encode(result.text).length>5_000_000)throw Error('Backup exceeds 5 MB.');return new File([result.text],result.name,{type:'application/json'})}
export async function shareNativeBackup(text:string,name:string){if(!ANDROID)throw Error('Native sharing is only available in the Android companion.');await files.shareBackup({text,name})}
export function notifyFileError(error:unknown){const e=error as Error;if(e.message!=='USER_CANCELLED')window.alert(e.message||'The file operation could not finish.');}
