import type {Hono} from 'hono';
import {CoachService} from './coach';
import {coachFromEnvironment} from './coach-config';
import type {PlatformContext} from './app';
// Deliberately fail closed: production integration must supply a validated location
// policy and an explicitly approved budget alongside a securely provisioned key.
// Setting OPENAI_API_KEY alone cannot activate a paid service.
export function mountCoachRoutes(app:Hono,context:PlatformContext,service?:CoachService){
 const coach=service??coachFromEnvironment(context.db);
 // Account deletion removes private conversations. Usage remains aggregateable
 // with a tombstoned identifier; no email/name/question is kept in usage rows.
 context.db.exec(`CREATE TRIGGER IF NOT EXISTS pok_coach_delete_user AFTER DELETE ON user BEGIN DELETE FROM pok_ai_chat WHERE user_id=OLD.id; UPDATE pok_ai_usage SET user_id='deleted-account' WHERE user_id=OLD.id; END;`);
 app.get('/api/coach/status',async c=>{await context.requireUser(c);return c.json(coach.status())});
 app.post('/api/coach',async c=>{const u=await context.requireUser(c);try{
  const result=await coach.ask(u.id,await c.req.json(),c.req.raw.signal);await context.requireUser(c);
  if(!c.req.header('accept')?.includes('text/event-stream'))return c.json(result);
  const encoder=new TextEncoder();const stream=new ReadableStream<Uint8Array>({async start(controller){try{
   for(let i=0;i<result.text.length;i+=120){c.req.raw.signal.throwIfAborted();await context.requireUser(c);if(!coach.status().enabled)throw Error('Disabled');controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({text:result.text.slice(i,i+120)})}\n\n`));}
   controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({id:result.id,usage:result.usage,label:result.label})}\n\n`));
  }catch{controller.enqueue(encoder.encode('event: error\ndata: {"error":"stream_stopped"}\n\n'))}finally{controller.close()}}});
  return new Response(stream,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-store','X-Accel-Buffering':'no'}});
 }catch{return c.json({error:'coach_unavailable_or_limited'},400)}});
 app.post('/api/coach/cancel',async c=>{const u=await context.requireUser(c);coach.cancel(u.id);return c.json({ok:true})});
 app.get('/api/coach/history',async c=>{const u=await context.requireUser(c);return c.json({items:coach.history(u.id)})});
 app.delete('/api/coach/history',async c=>{const u=await context.requireUser(c);coach.deleteHistory(u.id);return c.json({ok:true})});
 app.get('/api/coach/admin/usage',async c=>{await context.requireUser(c,'configure');return c.json({items:coach.usage(),status:coach.status()})});
 app.post('/api/coach/admin/disable',async c=>{const u=await context.requireUser(c,'configure');coach.disable();context.audit(u.id,null,'coach.disable','Emergency disable');return c.json({ok:true})});
 return coach;
}
