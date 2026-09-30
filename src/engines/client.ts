import {validateRequest,validateResult,inputHash,type AnalysisRequest,type AnalysisResult} from './contract';
export type EngineWorker=Pick<Worker,'onmessage'|'onerror'|'postMessage'|'terminate'>;
export class EngineClient {
  private worker:EngineWorker|null=null;private generation=0;private reject:((e:Error)=>void)|null=null;private timer:ReturnType<typeof setTimeout>|undefined;
  constructor(private readonly workerFactory:()=>EngineWorker=()=>new Worker(new URL('./analysis.worker.ts',import.meta.url),{type:'module'})){}
  cancel(){this.generation++;this.worker?.terminate();this.worker=null;clearTimeout(this.timer);this.reject?.(new Error('Calculation cancelled.'));this.reject=null}
  async run(input:AnalysisRequest,progress:(completed:number,target:number)=>void=()=>{}):Promise<AnalysisResult>{
    this.cancel();const request=validateRequest(input),generation=this.generation;
    const expectedHash=await inputHash(request);if(generation!==this.generation)throw new Error('Calculation cancelled.');
    return new Promise((resolve,reject)=>{
      this.reject=reject;const worker=this.worker=this.workerFactory();
      let settled=false;
      const finish=()=>{settled=true;worker.terminate();if(this.worker===worker)this.worker=null;this.reject=null;clearTimeout(this.timer)};
      this.timer=setTimeout(()=>{if(generation!==this.generation)return;finish();reject(new Error('TIMEOUT: worker deadline reached; no completed equity returned.'))},request.budget.timeMs+1000);
      worker.onerror=event=>{if(settled||generation!==this.generation)return;finish();reject(new Error(event.message||'Analysis worker crashed. Use Retry or POK Standard.'))};
      worker.onmessage=event=>{
        if(settled||generation!==this.generation)return;const msg=event.data;
        if(!msg||typeof msg!=='object'||!['result','progress','error'].includes(msg.kind)){finish();reject(new Error('Malformed analysis response.'));return}
        if(msg.kind==='result'){
          const r=msg.result as AnalysisResult;
          if(!r||typeof r!=='object'){finish();reject(new Error('Malformed analysis response.'));return}
          if(r.requestId!==request.requestId||r.analysisRevision!==request.analysisRevision)return;
          if(r.schemaVersion!==1||r.engineId!==(request.engine==='automatic'?'pok-standard':request.engine)||!['COMPLETE','PARTIAL','CANCELLED','TIMEOUT','UNSUPPORTED','ERROR'].includes(r.status)||!Number.isFinite(r.elapsedMs)||r.result&&(!Number.isFinite(r.result.equity)||r.result.equity<0||r.result.equity>1)){finish();reject(new Error('Malformed analysis response.'));return}
          try{validateResult(r);if(r.inputHash!==expectedHash)throw new Error('Input hash mismatch')}catch{finish();reject(new Error('Malformed analysis response.'));return}
          finish();resolve(r);
        }else if(msg.requestId===request.requestId&&msg.analysisRevision===request.analysisRevision){if(msg.kind==='progress'){
          const p=msg.progress;if(!p||!Number.isSafeInteger(p.completed)||!Number.isSafeInteger(p.target)||p.completed<0||p.completed>p.target||p.target>250000){finish();reject(new Error('Malformed analysis response.'));return}progress(p.completed,p.target);
        }else if(msg.kind==='error'){finish();reject(new Error(typeof msg.message==='string'?msg.message:'Malformed analysis response.'))}}
      };worker.postMessage(request);
    });
  }
}
