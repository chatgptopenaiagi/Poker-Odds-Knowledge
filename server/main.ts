import {serve} from '@hono/node-server';
import {serveStatic} from '@hono/node-server/serve-static';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {createPlatform} from './app';
import {providerRegistry,type ProviderSettings} from './providers';
import {createSmtpMailer} from './mail';
import {mountCoachRoutes} from './coach-routes';
import {mountStrategyRoutes} from './strategy-routes';
import type {StrategyJobs} from './strategy-jobs';
let strategyJobs:StrategyJobs|undefined;

const production=process.env.NODE_ENV==='production';
const port=Number(process.env.POK_PORT||4318);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('POK_PORT must be an unprivileged valid port.');
const baseURL=process.env.POK_BASE_URL||`http://127.0.0.1:${port}`;
const localDirectory=resolve(process.env.POK_DATA_DIR||'.pok-local');mkdirSync(localDirectory,{recursive:true});
const secretFile=resolve(localDirectory,'auth.secret');
let secret=process.env.POK_AUTH_SECRET;
if(!secret&&!production){if(!existsSync(secretFile))writeFileSync(secretFile,randomBytes(48).toString('base64url'),{flag:'wx',mode:0o600});secret=readFileSync(secretFile,'utf8').trim()}
if(!secret)throw Error('Production requires POK_AUTH_SECRET from the secret manager.');
const providers:ProviderSettings={};
for(const provider of ['google','facebook','twitter','snapchat'] as const){const prefix=`POK_${provider.toUpperCase()}`;if(process.env[prefix+'_CLIENT_ID']&&process.env[prefix+'_CLIENT_SECRET'])providers[provider]={clientId:process.env[prefix+'_CLIENT_ID']!,clientSecret:process.env[prefix+'_CLIENT_SECRET']!,approved:process.env[prefix+'_APPROVED']==='true'}}
const testMail=process.argv.includes('--test-mail');
if(testMail&&production)throw Error('The local mail sink cannot run in production.');
const sendMail=process.env.POK_SMTP_HOST?createSmtpMailer(process.env):undefined;
const platform=await createPlatform({dbPath:resolve(localDirectory,'pok.sqlite'),baseURL,secret,mode:production?'production':'development',testMail,sendMail,providers,configure:(app,context)=>{mountCoachRoutes(app,context);if(process.env.POK_STRATEGY_ENABLED==='true')strategyJobs=mountStrategyRoutes(app,context)},onAccountDeleted:(id,db)=>{strategyJobs?.deleteOwner(id);for(const table of ['pok_ai_chat','pok_ai_usage'])if(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table)){if(table==='pok_ai_chat')db.prepare('DELETE FROM pok_ai_chat WHERE user_id=?').run(id);else db.prepare("UPDATE pok_ai_usage SET user_id='deleted' WHERE user_id=?").run(id)}}});
const dist=resolve(process.env.POK_PUBLIC_DIR||'online-dist');if(!existsSync(resolve(dist,'index.html')))throw Error('Build the online public client before launching online mode.');
platform.app.get('/',c=>c.redirect('/holdem-lab/'));
platform.app.get('/holdem-lab/*',serveStatic({root:dist,rewriteRequestPath:path=>path.replace(/^\/holdem-lab\//,'/')}));
// Bind only loopback, including production behind an explicitly configured HTTPS reverse proxy.
const server=serve({fetch:platform.app.fetch,hostname:'127.0.0.1',port},()=>{writeFileSync(resolve(localDirectory,'server.json'),JSON.stringify({pid:process.pid,port,baseURL,startedAt:new Date().toISOString(),entry:'server/main.ts'}));console.log(`POK online staging is ready at ${baseURL}/holdem-lab/`);if(testMail)console.log('LOCAL TEST MAIL SINK: no real email is sent. Never use real account passwords in this edition.');console.log(`${providerRegistry(providers).filter(p=>p.enabled).length} external identity providers enabled. AI is disabled unless explicitly integrated and budgeted.`)});
const stop=()=>{strategyJobs?.stop();server.close(()=>{setTimeout(()=>{platform.close();process.exit(0)},500)})};process.on('SIGINT',stop);process.on('SIGTERM',stop);
