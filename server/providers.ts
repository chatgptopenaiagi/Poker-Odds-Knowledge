export const countries = 'US CA MX BR AR CL CO PE GB IE FR DE AT CH ES PT IT NL BE LU DK SE NO FI IS PL CZ SK HU RO BG GR HR SI RS TR UA MD EE LV LT AU NZ IN BD PK LK NP TH VN ID MY SG PH JP KR CN TW HK ZA KE NG GH TZ MA EG IL AE SA'.split(' ');
import {verifyProviderIdToken} from 'better-auth/oauth2';
export type ProviderSettings = Partial<Record<'google'|'facebook'|'twitter'|'snapchat',{clientId:string;clientSecret:string;approved:boolean}>>;
/** Bind Google's OIDC token to Better Auth's existing server-owned nonce/state.
 * The 1.7.6 built-in provider verifies JWTs but does not opt its redirect into nonce binding. */
export function googleNonceBinding():import('better-auth').BetterAuthPlugin{return {id:'pok-google-nonce',init(ctx){return {context:{socialProviders:ctx.socialProviders.map(provider=>provider.id!=='google'?provider:{...provider,requiresIdTokenNonce:true,async createAuthorizationURL(data){if(!data.idTokenNonce)throw Error('oidc_nonce_required');const url=await provider.createAuthorizationURL(data);url.searchParams.set('nonce',data.idTokenNonce);return url},async getUserInfo(tokens){if(!tokens.idToken||!tokens.expectedIdTokenNonce||!await verifyProviderIdToken(provider,tokens.idToken,tokens.expectedIdTokenNonce))return null;return provider.getUserInfo(tokens)}})}}}}}
export function providerRegistry(settings:ProviderSettings={}){return [
 {id:'google',name:'Google',support:'documented',adapter:true,contract:'PASS_SIGNED_OIDC_CALLBACK_FIXTURE',note:'Cloud project, consent screen and exact callback required. Signed local JWT, nonce mismatch and state replay tested; live login NOT_RUN.'},
 {id:'facebook',name:'Facebook',support:'documented',adapter:true,contract:'PASS_AUTHORIZATION_FIXTURE',note:'Meta app, valid OAuth redirect, eligible permissions and app review required; full callback/live login NOT_RUN.'},
 {id:'twitter',name:'X',support:'documented',adapter:true,contract:'PASS_AUTHORIZATION_FIXTURE',note:'Developer project, OAuth 2 PKCE, user identity/email access; access pricing and approval require operator verification; full callback/live login NOT_RUN.'},
 {id:'snapchat',name:'Snapchat',support:'documented',adapter:true,contract:'PASS_AUTHORIZATION_AND_IDENTITY_FIXTURE',note:'Login Kit has no guaranteed email. Link an existing verified account; then use its stable subject. Full callback/live login NOT_RUN.'},
 {id:'instagram',name:'Instagram',support:'unsupported-personal-login',adapter:false,contract:'NOT_RUN',note:'Professional business/creator integration is not unrestricted consumer login.'},
 {id:'baidu',name:'Baidu',support:'UNVERIFIED',adapter:false,contract:'NOT_RUN',note:'Current account-connection eligibility not established; retain email fallback.'}
 ].map(p=>{const config=settings[p.id as keyof ProviderSettings];return {...p,configured:!!(config?.clientId&&config.clientSecret),approved:config?.approved===true,liveTested:false,enabled:p.adapter&&!!config?.clientId&&!!config?.clientSecret&&config.approved};})}
export function socialOptions(settings:ProviderSettings){const enabled=providerRegistry(settings);return Object.fromEntries(['google','facebook','twitter'].flatMap(id=>{const s=settings[id as keyof ProviderSettings];return s&&enabled.find(p=>p.id===id)?.enabled?[[id,{clientId:s.clientId,clientSecret:s.clientSecret,disableImplicitSignUp:true,requireEmailVerification:true,...(id==='twitter'?{disableDefaultScope:true,scope:['users.read','tweet.read','users.email'],mapProfileToUser:(profile:any)=>({email:profile.data?.email||undefined,emailVerified:!!profile.data?.email})}:{})}]]:[]}));}
export async function snapchatIdentity(accessToken:string,transport:typeof fetch=fetch){
 const response=await transport('https://kit.snapchat.com/v1/me',{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({query:'{me{externalId displayName}}'}),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('provider_identity_failed');const body=await response.json() as {data?:{me?:{externalId?:string;displayName?:string}}};const me=body.data?.me;
 if(!me?.externalId||typeof me.externalId!=='string')throw Error('provider_subject_missing');
 // No invented email: only explicit authenticated linking is allowed for this provider.
 return {id:me.externalId,name:me.displayName||'Snapchat learner',email:undefined,emailVerified:false};
}
