import type {Hono} from 'hono';
import type {PlatformContext} from './app';
import {StrategyJobs,JobError,type SolverRunner} from './strategy-jobs';
import {runJavaSolver,javaAvailability} from './strategy-adapter';
export function mountStrategyRoutes(app:Hono,context:PlatformContext,runner:SolverRunner=runJavaSolver){
 const jobs=new StrategyJobs(context.db,runner),{requireUser,audit}=context;
 app.get('/api/strategy/health',async c=>{await requireUser(c);const health=await javaAvailability();return c.json({...health,engine:'TexasHoldemSolverJava / POK river adapter',location:'local-jvm',limits:jobs.health().limits})});
 app.get('/api/strategy/admin/health',async c=>{const u=await requireUser(c,'configure');if(u.profile.role!=='owner')return c.json({error:'owner_required'},403);return c.json({items:[{id:'river-solver',...(await javaAvailability()),...jobs.health()}]})});
 app.post('/api/strategy/jobs',async c=>{const u=await requireUser(c);try{const job=await jobs.submit(u.id,await c.req.json());audit(u.id,job.id,'strategy.submit','Explicit local river model; bounded job');return c.json(job,202)}catch(e){if(e instanceof JobError)return c.json({error:e.code},e.status as 400);return c.json({error:'invalid_solve_request'},400)}});
 app.get('/api/strategy/jobs/:id',async c=>{const u=await requireUser(c);try{return c.json(jobs.get(c.req.param('id'),u.id))}catch{return c.json({error:'not_found'},404)}});
 app.post('/api/strategy/jobs/:id/cancel',async c=>{const u=await requireUser(c);try{const job=jobs.cancel(c.req.param('id'),u.id);audit(u.id,job.id,'strategy.cancel','Owner cancelled');return c.json(job)}catch{return c.json({error:'not_found'},404)}});
 return jobs;
}
