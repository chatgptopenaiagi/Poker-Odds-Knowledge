import {runAnalysis} from './runner';
import type {AnalysisRequest} from './contract';
self.onmessage=async(event:MessageEvent<AnalysisRequest>)=>{
  const input=event.data;
  try{const result=await runAnalysis(input,p=>self.postMessage({kind:'progress',requestId:input.requestId,analysisRevision:input.analysisRevision,progress:p}));self.postMessage({kind:'result',result})}
  catch(e){self.postMessage({kind:'error',requestId:input.requestId,analysisRevision:input.analysisRevision,message:(e as Error).message})}
};
