import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';

const read=path=>fs.readFile(path,'utf8');
const config=ts.parseConfigFileTextToJson('wrangler.jsonc',await read('wrangler.jsonc'));
assert.ok(!config.error,'Wrangler configuration could not be read.');
const pkg=JSON.parse(await read('package.json'));
for(const dependency of ['better-auth','@better-auth/drizzle-adapter']){
 assert.ok(!pkg.dependencies?.[dependency],dependency+' must not be required by the personal planner.');
}
assert.ok(!(config.config.d1_databases||[]).some(binding=>binding.binding==='HUT_DB'),'Personal hut planning must not require an account database.');
assert.ok(!Object.keys(config.config.vars||{}).some(key=>key.startsWith('BETTER_AUTH')),'Personal hut planning must not require account configuration.');
for(const path of ['app/account/page.tsx','app/api/auth/[...all]/route.ts','app/api/hut-workspace/route.ts','app/api/hut-shares/route.ts','app/share/[token]/page.tsx']){
 assert.ok(!await fs.stat(path).then(()=>true,()=>false),'Obsolete account route remains: '+path);
}
for(const path of ['components/huts/WorkspaceProvider.tsx','public/explore-app/planner-content.html']){
 assert.ok(!/\/api\/(?:auth|hut-workspace|hut-shares)/.test(await read(path)),'Personal data still calls account APIs: '+path);
}
console.log('Personal hut planner: browser-only storage; account routes, email/auth dependencies and HUT_DB binding absent.');
