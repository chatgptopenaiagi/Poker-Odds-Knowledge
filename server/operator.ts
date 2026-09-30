import {DatabaseSync,backup} from 'node:sqlite';
import {resolve,dirname} from 'node:path';
import {existsSync,mkdirSync,readFileSync,copyFileSync} from 'node:fs';
// Local operator entry point only. It is never mounted as an HTTP route.
const [command,target]=process.argv.slice(2),dir=resolve(process.env.POK_DATA_DIR||'.pok-local'),file=resolve(dir,'pok.sqlite');
if(!existsSync(file))throw Error('Start the isolated platform once to initialize its database.');
const db=new DatabaseSync(file);db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
if(command==='bootstrap-owner'){
 if(!target)throw Error('Pass the ID of an existing verified account (not an email address).');
 const user=db.prepare('SELECT id,emailVerified,twoFactorEnabled FROM user WHERE id=?').get(target) as any;
 if(!user?.emailVerified)throw Error('A verified existing member is required. No default account is created.');
 if(process.env.NODE_ENV==='production'&&!user.twoFactorEnabled)throw Error('Enable and verify MFA before granting a production owner role.');
 db.exec('BEGIN IMMEDIATE');try{if((db.prepare("SELECT count(*) n FROM pok_profile WHERE role='owner'").get() as any).n)throw Error('An owner already exists. Use its protected CP role invitation workflow.');db.prepare("INSERT INTO pok_profile(user_id,role) VALUES(?,'owner') ON CONFLICT(user_id) DO UPDATE SET role='owner'").run(target);db.prepare('INSERT INTO pok_audit(actor_id,target_id,action,reason,created_at) VALUES(NULL,?,?,?,?)').run(target,'owner.bootstrap','Local operator granted the first owner to a verified member',Date.now());db.exec('COMMIT');console.log('Owner bootstrap complete. Reauthenticate before opening the CP.')}catch(e){db.exec('ROLLBACK');throw e}
}else if(command==='backup'){
 if(!target)throw Error('Pass a new private backup destination outside the public web root.');const destination=resolve(target);if(existsSync(destination))throw Error('Backup destination already exists.');if(destination.toLowerCase().includes('htdocs'))throw Error('Never store a database backup in a public web root.');mkdirSync(dirname(destination),{recursive:true});await backup(db,destination);const verify=new DatabaseSync(destination,{readOnly:true});if((verify.prepare('PRAGMA integrity_check').get() as any).integrity_check!=='ok')throw Error('Backup integrity check failed');verify.close();console.log('Private database backup verified. Keep the authentication secret backup separately.');
}else if(command==='restore-check'){
 if(!target||!existsSync(target))throw Error('Pass a private SQLite backup to verify.');const copy=new DatabaseSync(resolve(target),{readOnly:true});if((copy.prepare('PRAGMA integrity_check').get() as any).integrity_check!=='ok')throw Error('Backup integrity check failed');if(!(copy.prepare('SELECT version FROM pok_migrations WHERE version=1').get()))throw Error('Unsupported backup schema');copy.close();console.log('Restore preflight passed. Stop only the owned server, retain the current database and WAL files, then restore into a new data directory with its matching secret.');
}else throw Error('Commands: bootstrap-owner <verified-user-id>, backup <new-private-file>, restore-check <backup-file>.');
db.close();
