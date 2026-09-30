import {build} from 'esbuild';
import {mkdirSync,copyFileSync,readdirSync} from 'node:fs';
await build({entryPoints:['server/main.ts','server/operator.ts'],bundle:true,platform:'node',target:'node26',format:'esm',packages:'external',outdir:'server-build',outExtension:{'.js':'.mjs'},sourcemap:false});
mkdirSync('server-build/migrations',{recursive:true});
for(const name of readdirSync('server/migrations'))if(name.endsWith('.sql'))copyFileSync('server/migrations/'+name,'server-build/migrations/'+name);
console.log('Built the server and operator entry points with external locked dependencies; copied versioned migrations.');
