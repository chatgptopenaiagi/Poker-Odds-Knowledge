import {it,expect} from 'vitest';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,basename} from 'node:path';
import {execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {createPlatform} from '../server/app';
it('backs up a real local database, verifies restore preflight and refuses overwrite',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'pok-platform-test-'));let p:Awaited<ReturnType<typeof createPlatform>>|undefined;
 try{p=await createPlatform({dbPath:join(directory,'pok.sqlite'),baseURL:'http://127.0.0.1:4318',secret:'isolated-test-authentication-secret-123456',mode:'test',testMail:true});p.audit(null,null,'backup.fixture','Generic verification fixture');const destination=join(directory,'snapshot.sqlite');const run=(...args:string[])=>execFileSync(process.execPath,['--import','tsx','server/operator.ts',...args],{cwd:process.cwd(),env:{...process.env,POK_DATA_DIR:directory},encoding:'utf8',stdio:'pipe'});expect(run('backup',destination)).toContain('verified');expect(run('restore-check',destination)).toContain('passed');expect(()=>run('backup',destination)).toThrow();const copy=new DatabaseSync(destination,{readOnly:true});expect((copy.prepare('SELECT action FROM pok_audit').get() as any).action).toBe('backup.fixture');expect((copy.prepare('PRAGMA integrity_check').get() as any).integrity_check).toBe('ok');copy.close();}
 finally{p?.close();const resolved=resolve(directory);if(!resolved.startsWith(resolve(tmpdir()))||!basename(resolved).startsWith('pok-platform-test-'))throw Error('Refuse unsafe temporary cleanup');rmSync(resolved,{recursive:true,force:true})}
},15000);
