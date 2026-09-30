import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {defaultAppearance} from '../src/appearance';
import {createOTP} from '@better-auth/utils/otp';
import {base32} from '@better-auth/utils/base32';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createPlatform} from '../server/app';
import {scanMessage,seedDictionary,cleanName} from '../server/moderation';
import {providerRegistry,snapchatIdentity,countries} from '../server/providers';
const base='http://127.0.0.1:4318';
describe('real SQLite platform and maintained authentication',()=>{
 let platform:Awaited<ReturnType<typeof createPlatform>>;
 beforeEach(async()=>{platform=await createPlatform({dbPath:':memory:',baseURL:base,secret:'isolated-test-secret-not-a-production-secret-12345',mode:'test',testMail:true})});
 afterEach(()=>platform.close());
 async function request(path:string,method='GET',body?:unknown,identity?:{cookie:string;csrf?:string},extra:Record<string,string>={}){return platform.app.request(base+path,{method,headers:{...(method!=='GET'?{Origin:base,'Content-Type':'application/json'}:{}),...(identity?{Cookie:identity.cookie,'X-POK-CSRF':identity.csrf||''}:{}),...extra},...(method!=='GET'?{body:JSON.stringify(body??{})}:{})})}
 async function member(email='learner@example.test',name='Learner'){
  const signup=await request('/api/auth/sign-up/email','POST',{email,name,password:'local-study-password-123',adultAccepted:true,callbackURL:base+'/holdem-lab/'});expect(signup.status).toBe(200);
  const mail=platform.mailSink.find(m=>m.to===email&&m.purpose==='verify');expect(mail).toBeDefined();const verified=await platform.app.request(mail!.url);expect([200,302]).toContain(verified.status);
  const login=await request('/api/auth/sign-in/email','POST',{email,password:'local-study-password-123'});expect(login.status).toBe(200);const cookie=login.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');expect(cookie).toContain('pok');
  const me=await (await request('/api/me','GET',undefined,{cookie})).json();return {cookie,csrf:me.csrf,id:me.user.id};
 }
 it('registers, verifies, authenticates, rotates sessions and protects CSRF/ownership',async()=>{
  const a=await member();const b=await member('second@example.test','Second');expect(a.id).not.toBe(b.id);
  const me=await request('/api/me','GET',undefined,a);expect(me.headers.get('cache-control')).toBe('no-store');expect((await me.json()).user.role).toBe('member');
  expect((platform.db.prepare('SELECT adultAcceptedAt,adultPolicyVersion FROM user WHERE id=?').get(a.id) as any).adultAcceptedAt).toBeGreaterThan(0);expect((platform.db.prepare('SELECT adult_accepted_at FROM pok_profile WHERE user_id=?').get(a.id) as any).adult_accepted_at).toBeGreaterThan(0);
  expect((await request('/api/content','POST',{kind:'chat',body:'Hello'}, {...a,csrf:'bad'})).status).toBe(403);
  expect((await request('/api/content','POST',{kind:'chat',body:'Hello'},a,{Origin:'https://attacker.invalid'})).status).toBe(403);
  expect((await request('/api/admin/users','GET',undefined,a)).status).toBe(403);
  const content=await (await request('/api/content','POST',{kind:'feedback',title:'Readable cards',body:'Please offer large cards.'},a)).json();expect(content.id).toBeTruthy();
  expect((await (await request('/api/content?kind=feedback','GET',undefined,b)).json()).items).toHaveLength(0);
  expect((await request(`/api/content/${content.id}`,'PATCH',{body:'Changed'},b)).status).toBe(404);
  expect((await request('/api/auth/revoke-sessions','POST',{},a)).status).toBe(200);
  expect((await request('/api/me','GET',undefined,a)).status).toBe(401);
 });
 it('protects registration enumeration, recovery replay and redirect destinations',async()=>{
  const a=await member();const duplicate=await request('/api/auth/sign-up/email','POST',{email:'learner@example.test',name:'Learner',password:'local-study-password-123',adultAccepted:true});expect(duplicate.status).toBe(200);expect(await duplicate.json()).toEqual({status:'verification_requested'});
  expect((await request('/api/auth/request-password-reset','POST',{email:'unknown@example.test',redirectTo:base+'/holdem-lab/'})).status).toBe(200);
  expect((await request('/api/auth/request-password-reset','POST',{email:'learner@example.test',redirectTo:'https://attacker.invalid'})).status).toBeGreaterThanOrEqual(400);
  expect((await request('/api/auth/request-password-reset','POST',{email:'learner@example.test',redirectTo:base+'/holdem-lab/'})).status).toBe(200);
  const mail=platform.mailSink.find(m=>m.purpose==='reset')!;const link=new URL(mail.url);const token=link.pathname.split('/').at(-1)!;
  expect((await request('/api/auth/reset-password','POST',{token,newPassword:'another-study-password-456'})).status).toBe(200);
  expect((await request('/api/auth/reset-password','POST',{token,newPassword:'another-study-password-456'})).status).toBeGreaterThanOrEqual(400);
  expect((await request('/api/me','GET',undefined,a)).status).toBe(401);
 });
 it('rejects expired recovery tokens and gives generic login failures',async()=>{
  await member();await request('/api/auth/request-password-reset','POST',{email:'learner@example.test',redirectTo:base+'/holdem-lab/'});const mail=platform.mailSink.find(m=>m.purpose==='reset')!;const token=new URL(mail.url).pathname.split('/').at(-1)!;platform.db.prepare('UPDATE verification SET expiresAt=0').run();expect((await request('/api/auth/reset-password','POST',{token,newPassword:'new-local-password-123'})).status).toBeGreaterThanOrEqual(400);
  const wrong=await request('/api/auth/sign-in/email','POST',{email:'learner@example.test',password:'incorrect-password-123'}),absent=await request('/api/auth/sign-in/email','POST',{email:'absent@example.test',password:'incorrect-password-123'});expect(wrong.status).toBe(401);expect(absent.status).toBe(401);expect(await wrong.json()).toEqual(await absent.json());
 });
 it('persists questions, feedback replies and notifications; never awards privileges on signup',async()=>{
  const a=await member(),b=await member('staff@example.test','Staff');platform.db.prepare("UPDATE pok_profile SET role='support' WHERE user_id=?").run(b.id);
  const ticket=await (await request('/api/content','POST',{kind:'feedback',title:'Study feedback',body:'Explain the next-card denominator.'},a)).json();
  const queue=await (await request('/api/admin/feedback','GET',undefined,b)).json();expect(queue.items[0].id).toBe(ticket.id);
  expect((await request('/api/content','POST',{kind:'feedback-reply',parentId:ticket.id,body:'The denominator counts unknown cards.'},b)).status).toBe(201);
  expect((await (await request('/api/notifications','GET',undefined,a)).json()).items).toHaveLength(1);
  expect((await request(`/api/content/${ticket.id}/resolve`,'POST',{},b)).status).toBe(200);
  expect((await request('/api/admin/users','GET',undefined,b)).status).toBe(403);
 });
 it('applies feedback ownership before pagination and handles equal-timestamp cursors',async()=>{
  const a=await member(),b=await member('other@example.test');const ticket=await(await request('/api/content','POST',{kind:'feedback',title:'My ticket',body:'Still visible after a busy queue.'},a)).json();const time=Date.now()+1000;
  for(let i=0;i<65;i++){const id='fixture-'+String(i).padStart(3,'0');platform.db.prepare('INSERT INTO pok_content(id,author_id,kind,title,body,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run(id,b.id,'feedback','Other ticket','Private',time,time);platform.db.prepare('INSERT INTO pok_content(id,author_id,kind,body,created_at,updated_at) VALUES(?,?,?,?,?,?)').run('chat-'+id,b.id,'chat','Same timestamp',time,time)}
  expect((await(await request('/api/content?kind=feedback','GET',undefined,a)).json()).items.map((r:any)=>r.id)).toEqual([ticket.id]);const page1=await(await request('/api/content?kind=chat','GET',undefined,a)).json();expect(page1.items).toHaveLength(50);const page2=await(await request('/api/content?kind=chat&before='+encodeURIComponent(page1.next),'GET',undefined,a)).json();expect(page2.items).toHaveLength(15);expect(new Set([...page1.items,...page2.items].map(r=>r.id)).size).toBe(65);
 });
 it('enforces moderation immediately, keeps progress, permits appeals and reversal',async()=>{
  const a=await member(),mod=await member('mod@example.test','Moderator');platform.db.prepare("UPDATE pok_profile SET role='moderator' WHERE user_id=?").run(mod.id);
  const sanction=await (await request('/api/admin/sanctions','POST',{targetId:a.id,kind:'mute',reason:'Repeated spam reviewed by moderator',expiresAt:Date.now()+60000},mod)).json();expect(sanction.id).toBeTruthy();
  expect((await request('/api/content','POST',{kind:'chat',body:'Cannot post now'},a)).status).toBe(403);
  expect((await request('/api/sync','GET',undefined,a)).status).toBe(200);
  expect((await request('/api/appeals','POST',{sanctionId:sanction.id,body:'Please reconsider this classroom example.'},a)).status).toBe(201);
  expect((await request('/api/admin/sanctions','POST',{targetId:a.id,kind:'revoke',sanctionId:sanction.id,reason:'Reviewed appeal'},mod)).status).toBe(200);
  expect((await request('/api/content','POST',{kind:'chat',body:'Thank you'},a)).status).toBe(201);
  const ban=await request('/api/admin/sanctions','POST',{targetId:a.id,kind:'ban',reason:'Human reviewed serious repeated abuse'},mod);expect(ban.status).toBe(201);
  expect((await request('/api/content?kind=chat','GET',undefined,a)).status).toBe(403);
  expect((await request('/api/me','GET',undefined,a)).status).toBe(200);
 });
 it('requires consent, detects sync conflicts and isolates accounts',async()=>{
  const a=await member(),b=await member('other@example.test');const payload={settings:{locale:'ro'},attempts:[],hands:[]};
  expect((await request('/api/sync','PUT',{revision:0,payload},a)).status).toBe(400);
  expect((await request('/api/sync','PUT',{revision:0,payload,consent:true},a)).status).toBe(200);
  expect((await request('/api/sync','PUT',{revision:0,payload,consent:true},a)).status).toBe(409);
  expect((await (await request('/api/sync','GET',undefined,b)).json()).payload).toBe(null);
  const data=await (await request('/api/account/export','GET',undefined,a)).json();expect(data.profile.id).toBe(a.id);expect(JSON.stringify(data)).not.toContain('password');
 });
 it('blocks executable input, invalid state and immutable audit updates',async()=>{
  const a=await member();expect((await request('/api/content','POST',{kind:'chat',body:'<script>alert(1)</script>'},a)).status).toBe(400);
  expect((await request('/api/auth/callback/google?code=fake&state=fake')).status).not.toBe(200);
  platform.audit(a.id,a.id,'test','Append-only application audit');expect(()=>platform.db.prepare("UPDATE pok_audit SET reason='tamper'").run()).toThrow();expect(()=>platform.db.prepare('DELETE FROM pok_audit').run()).toThrow();
 });
 it('requires an actual user-bound dictionary preview, consumes it, and supports audited rollback',async()=>{
  const editor=await member('editor@example.test');platform.db.prepare("UPDATE pok_profile SET role='editor' WHERE user_id=?").run(editor.id);const entries=seedDictionary;
  expect((await request('/api/admin/dictionary','POST',{entries,previewToken:'forged',reason:'Seed review'},editor)).status).toBe(400);
  const preview=await(await request('/api/admin/dictionary/preview','POST',{entries,samples:['A classroom example of "idiot".']},editor)).json();expect(preview.results[0].signals[0].contextual).toBe(true);
  const edited=entries.map((e,i)=>i?e:{...e,enabled:false});expect((await request('/api/admin/dictionary','POST',{entries:edited,previewToken:preview.previewToken,reason:'Altered since preview'},editor)).status).toBe(400);
  expect((await request('/api/admin/dictionary','POST',{entries,previewToken:preview.previewToken,reason:'Reviewed preview'},editor)).status).toBe(200);
  expect((await request('/api/admin/dictionary','POST',{entries,previewToken:preview.previewToken,reason:'Replay'},editor)).status).toBe(400);
  expect((await request('/api/admin/dictionary/rollback','POST',{version:1,reason:'Restore original seed'},editor)).status).toBe(200);
 });
 it('validates shared appearance and rejects unfinished/invalid study records',async()=>{
  const a=await member();expect((await request('/api/sync','PUT',{revision:0,consent:true,payload:{appearance:defaultAppearance}},a)).status).toBe(200);
  expect((await (await request('/api/sync','GET',undefined,a)).json()).payload.appearance.textScale).toBe(100);
  expect((await request('/api/sync','PUT',{revision:1,consent:true,payload:{hands:[{result:null}] }},a)).status).toBe(400);
  expect((await request('/api/sync','PUT',{revision:1,consent:true,payload:{appearance:{...defaultAppearance,textScale:9999}}},a)).status).toBe(400);
 });
 it('deletes verified members through a single-purpose link and protects the last owner',async()=>{
  const a=await member();await request('/api/content','POST',{kind:'feedback',title:'Private feedback',body:'Private body.'},a);
  const deletion=await request('/api/auth/delete-user','POST',{callbackURL:base+'/holdem-lab/'},a);expect(deletion.status).toBe(200);const mail=platform.mailSink.find(m=>m.purpose==='delete')!;expect(mail).toBeDefined();const done=await platform.app.request(mail.url,{headers:{Cookie:a.cookie}});expect([200,302]).toContain(done.status);expect((await request('/api/me','GET',undefined,a)).status).toBe(401);expect(platform.db.prepare('SELECT * FROM user WHERE id=?').get(a.id)).toBeUndefined();expect((platform.db.prepare('SELECT body FROM pok_content').get() as any).body).toBe('[Account deleted]');
  const owner=await member('owner@example.test');platform.db.prepare("UPDATE pok_profile SET role='owner' WHERE user_id=?").run(owner.id);expect((await request('/api/admin/roles','POST',{targetId:owner.id,role:'member',reason:'Must refuse'},owner)).status).toBe(400);
 });
 it('expires posting sanctions and blocks accounts on new sessions too',async()=>{
  const a=await member(),mod=await member('moderator@example.test');platform.db.prepare("UPDATE pok_profile SET role='moderator' WHERE user_id=?").run(mod.id);
  const s=await(await request('/api/admin/sanctions','POST',{targetId:a.id,kind:'mute',reason:'Time-limited moderation',expiresAt:Date.now()+50000},mod)).json();platform.db.prepare('UPDATE pok_sanction SET expires_at=? WHERE id=?').run(Date.now()-1000,s.id);expect((await request('/api/content','POST',{kind:'chat',body:'Expired restrictions allow posting'},a)).status).toBe(201);
  await request('/api/admin/sanctions','POST',{targetId:a.id,kind:'ban',reason:'Reviewed continuing serious abuse'},mod);const login=await request('/api/auth/sign-in/email','POST',{email:'learner@example.test',password:'local-study-password-123'});const cookie=login.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');expect((await request('/api/content?kind=chat','GET',undefined,{cookie})).status).toBe(403);
 });
 it('generates real adapter state/PKCE redirects without contacting providers (contract only)',async()=>{
  platform.close();platform=await createPlatform({dbPath:':memory:',baseURL:base,secret:'isolated-test-secret-not-a-production-secret-12345',mode:'test',testMail:true,providers:Object.fromEntries(['google','facebook','twitter','snapchat'].map(id=>[id,{clientId:`fixture-${id}`,clientSecret:'fixture-provider-secret',approved:true}]))});
  const network=vi.spyOn(globalThis,'fetch').mockRejectedValue(new Error('External network forbidden during contract test'));
  try{for(const provider of ['google','facebook','twitter','snapchat']){const response=await request('/api/auth/sign-in/social','POST',{provider,callbackURL:base+'/holdem-lab/',disableRedirect:true});expect(response.status).toBe(200);const result=await response.json();const url=new URL(result.url);expect(url.searchParams.get('state')).toBeTruthy();expect(url.searchParams.get('response_type')).toBe('code');expect(url.searchParams.get('redirect_uri')).toBe(base+'/api/auth/callback/'+provider);if(provider!=='facebook')expect(url.searchParams.get('code_challenge')).toBeTruthy();}expect(network).not.toHaveBeenCalled()}finally{network.mockRestore()}
 });
 it('verifies maintained TOTP enrollment and records only the factor-verified session',async()=>{
  const a=await member();const enabled=await request('/api/auth/two-factor/enable','POST',{password:'local-study-password-123'},a);expect(enabled.status).toBe(200);const result=await enabled.json();expect(result.backupCodes.length).toBeGreaterThan(0);const secret=new TextDecoder().decode(base32.decode(new URL(result.totpURI).searchParams.get('secret')!));const code=await createOTP(secret).totp();const verified=await request('/api/auth/two-factor/verify-totp','POST',{code},a);expect(verified.status).toBe(200);expect((platform.db.prepare('SELECT count(*) n FROM pok_mfa_session').get() as any).n).toBe(1);expect((await request('/api/me','GET',undefined,a)).status).toBe(401);
 });
 it('validates a signed mock Google OIDC callback, rejects nonce mismatch and state replay',async()=>{
  platform.close();platform=await createPlatform({dbPath:':memory:',baseURL:base,secret:'isolated-test-secret-not-a-production-secret-12345',mode:'test',testMail:true,providers:{google:{clientId:'fixture-google',clientSecret:'fixture-secret',approved:true}}});
  const key=await generateKeyPair('RS256'),publicKey=await exportJWK(key.publicKey);let token='';
  const transport=vi.spyOn(globalThis,'fetch').mockImplementation(async(input)=>{const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;if(url.startsWith('https://oauth2.googleapis.com/token'))return new Response(JSON.stringify({access_token:'mock-access',id_token:token,expires_in:3600,token_type:'Bearer'}),{headers:{'Content-Type':'application/json'}});if(url.startsWith('https://www.googleapis.com/oauth2/v3/certs'))return new Response(JSON.stringify({keys:[{...publicKey,kid:'pok-fixture-key',alg:'RS256',use:'sig'}]}),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=3600'}});throw Error('Unexpected external request in isolated OIDC fixture')});
  try{for(const validNonce of [false,true]){const start=await request('/api/auth/sign-in/social','POST',{provider:'google',requestSignUp:true,adultAccepted:true,callbackURL:base+'/holdem-lab/',disableRedirect:true});expect(start.status).toBe(200);const url=new URL((await start.json()).url);expect(url.searchParams.get('nonce')).toBeTruthy();const cookie=start.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');token=await new SignJWT({sub:'google-stable-subject',email:'oidc@example.test',email_verified:true,name:'OIDC Learner',nonce:validNonce?url.searchParams.get('nonce'):'incorrect-nonce'}).setProtectedHeader({alg:'RS256',kid:'pok-fixture-key'}).setIssuer('https://accounts.google.com').setAudience('fixture-google').setIssuedAt().setExpirationTime('5m').sign(key.privateKey);const path='/api/auth/callback/google?code=fixture-code&state='+encodeURIComponent(url.searchParams.get('state')!);const callback=await request(path,'GET',undefined,{cookie});expect(callback.status).toBe(302);if(validNonce){expect(callback.headers.get('location')).toBe(base+'/holdem-lab/');expect((platform.db.prepare('SELECT providerId,accountId FROM account').get() as any).accountId).toBe('google-stable-subject');const replay=await request(path,'GET',undefined,{cookie});expect(replay.headers.get('location')).toContain('error=')}else{expect(callback.headers.get('location')).toContain('error=');expect(platform.db.prepare('SELECT 1 FROM user').get()).toBeUndefined()}}}finally{transport.mockRestore()}
 });
});
describe('moderation and providers contract fixtures',()=>{
 it('uses conservative Unicode matching and labels context without automatic sanctions',()=>{expect(scanMessage('The classical assessment is successful.',seedDictionary)).toHaveLength(0);expect(scanMessage('The word "idiot" is a quotation.',seedDictionary)[0].contextual).toBe(true);expect(scanMessage('IＤＩＯＴ',seedDictionary).length).toBeGreaterThan(0);expect(scanMessage('سأقتلك',seedDictionary)[0].locale).toBe('ar');expect(scanMessage('勉強をします',seedDictionary)).toHaveLength(0);expect(cleanName('Ali\u202E123')).toBe('Ali123')});
 it('ships 40+ regions and never enables unconfigured providers',()=>{expect(new Set(countries).size).toBeGreaterThanOrEqual(40);expect(providerRegistry().every(p=>!p.enabled&&!p.liveTested)).toBe(true)});
 it('maps stable Snapchat subject without inventing email (mock transport only)',async()=>{const identity=await snapchatIdentity('mock-token',async()=>new Response(JSON.stringify({data:{me:{externalId:'subject-123',displayName:'Learner'}}}),{status:200}) as any);expect(identity.id).toBe('subject-123');expect(identity.email).toBeUndefined();expect(identity.emailVerified).toBe(false)});
 it('refuses a production test sink',async()=>{await expect(createPlatform({dbPath:':memory:',baseURL:'https://pok.example',secret:'isolated-test-secret-not-a-production-secret-12345',mode:'production',testMail:true})).rejects.toThrow('Production')});
});
