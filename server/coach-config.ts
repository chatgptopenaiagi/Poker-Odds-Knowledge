import {CoachService,OpenAITransport,type CoachConfig} from './coach';
import type {DatabaseSync} from 'node:sqlite';
// A deliberately small supported deployment allowlist, checked against the
// official supported-country page on 2026-09-30. It is NOT all supported regions.
export const LOCAL_COACH_COUNTRIES=['AT','RO','DE','FR','GB','IE','US','CA','AU','NZ','JP','KR'] as const;
export function coachFromEnvironment(db:DatabaseSync,env:NodeJS.ProcessEnv=process.env){
 const enabled=env.POK_AI_ENABLED==='true',production=env.NODE_ENV==='production';
 if(enabled&&production)throw Error('Public AI requires an operator-reviewed location enforcement adapter. This local release fails closed.');
 const country=env.POK_AI_OPERATOR_COUNTRY??'',policy=env.POK_AI_LOCATION_POLICY==='local-owner-supported-country';
 const allowed=policy&&(LOCAL_COACH_COUNTRIES as readonly string[]).includes(country);
 const key=env.POK_OPENAI_API_KEY;const daily=Number(env.POK_AI_DAILY_MICRO_USD||0),monthly=Number(env.POK_AI_MONTHLY_MICRO_USD||0);
 const model=env.POK_AI_MODEL||'gpt-5-mini';if(model!=='gpt-5-mini')throw Error('Unsupported coach model.');
 if(enabled&&(!key||!allowed||daily<=0||monthly<=0))throw Error('AI activation requires a dedicated server key, supported local operator location policy and explicit nonzero daily/monthly budgets.');
 const config:CoachConfig={enabled,configured:!!key&&allowed,dailyMicroUSD:daily,monthlyMicroUSD:monthly,model,retentionDays:Number(env.POK_AI_RETENTION_DAYS||30),mode:production?'production':'development',locationAllowed:async()=>!production&&allowed};
 return new CoachService(db,config,enabled&&key?new OpenAITransport(key):undefined);
}
