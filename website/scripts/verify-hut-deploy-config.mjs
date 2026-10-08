import fs from 'node:fs/promises';
import ts from 'typescript';
const parsed=ts.parseConfigFileTextToJson('wrangler.jsonc',await fs.readFile('wrangler.jsonc','utf8'));
if(parsed.error)throw Error('Wrangler configuration could not be read.');
const config=parsed.config,binding=config.d1_databases?.find(d=>d.binding==='HUT_DB');
const issues=[];
if(!binding||!binding.database_id||/^00000000-/.test(binding.database_id))issues.push('Replace the local HUT_DB placeholder with the provisioned production D1 ID.');
if(!/^https:\/\/verticalmoment\.com\/?$/.test(config.vars?.BETTER_AUTH_URL||''))issues.push('Set the production account origin to https://verticalmoment.com.');
if(issues.length){console.error('Hut publication configuration is incomplete:\n'+issues.map(x=>' - '+x).join('\n'));process.exitCode=1;}
else console.log('Hut publication configuration passed. Production secrets, remote migrations, HTTPS cookies and mail recovery still require the recorded release checks.');
