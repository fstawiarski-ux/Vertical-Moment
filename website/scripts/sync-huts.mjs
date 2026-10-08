import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {researchSha256,researchChecksumFormat} from './hut-research-integrity.mjs';
const root=path.resolve(process.cwd(),'..');
const master=path.join(root,'database/huts/master');
const data=JSON.parse(await fs.readFile(path.join(master,'expanded-master-data.json'),'utf8'));
const routes=JSON.parse(await fs.readFile(path.join(master,'active-routes.json'),'utf8'));
const release=JSON.parse(await fs.readFile(path.join(master,'release.json'),'utf8'));
const ids=new Set(data.records.map(h=>h.id));
assert.equal(data.records.length,630);assert.equal(ids.size,630);
assert.ok(data.records.every(h=>typeof h.id==='string'&&h.base.directory_id===h.id));
assert.deepEqual(data.records.map(h=>h.number).sort((a,b)=>a-b),Array.from({length:630},(_,i)=>i+1));
const sha=s=>createHash('sha256').update(s).digest('hex');
assert.equal(release.expanded_sha256_format,researchChecksumFormat);
assert.equal(researchSha256(await fs.readFile(path.join(master,'expanded-master-data.json'))),release.expanded_sha256);
assert.equal(sha(JSON.stringify(routes)),release.active_routes_sha256);
const output=path.join(root,'website/public/huts-data/v1');
await fs.mkdir(output,{recursive:true});
const write=async(name,v)=>fs.writeFile(path.join(output,name),JSON.stringify(v)+'\n');
const byId=list=>Map.groupBy(list||[],r=>r.id);
const maps=Object.fromEntries(['visitors','surroundings','tariffs','events','history_dates_reviewed'].map(k=>[k,byId(data[k])]));
const routeMap=byId(routes);
const sources=new Map(data.sources.map(s=>[s.ref,s]));
const contexts=new Map(data.contexts.map(c=>[c.context_id,c]));
const approachIndex={};
const index=[];
let bytes=0;
for(const h of data.records){
 const hutRoutes=(routeMap.get(h.id)||[]).map(r=>({...r,web_route_id:'R'+sha(JSON.stringify(r)).slice(0,20)}));
 const cx=String(h.context_refs||'').match(/C\d+/g)||[];
 const detail={release:release.release,record:h,visitor:(maps.visitors.get(h.id)||[])[0]||null,
  surroundings:(maps.surroundings.get(h.id)||[])[0]||null,tariffs:maps.tariffs.get(h.id)||[],
  events:maps.events.get(h.id)||[],dates:maps.history_dates_reviewed.get(h.id)||[],
  routes:hutRoutes,contexts:cx.map(id=>contexts.get(id)).filter(Boolean)};
 detail.film_formats=(data.film_formats||[]).filter(f=>!f.hut_ids||String(f.hut_ids).split(/[,;\s]+/).includes(h.id));
 const refs=new Set((JSON.stringify(detail).match(/S\d{5}/g)||[]));
 for(const s of data.sources)if(s.id===h.id)refs.add(s.ref);
 detail.sources=[...refs].map(ref=>{assert.ok(sources.has(ref),'Missing source '+ref);return sources.get(ref)});
 const str=JSON.stringify(detail)+'\n';bytes+=Buffer.byteLength(str);
 await fs.writeFile(path.join(output,h.id+'.json'),str);
 approachIndex[h.id]=hutRoutes.filter(r=>r.kind==='Approach').map(r=>r.web_route_id);
 index.push({id:h.id,number:h.number,name:h.name,region:h.base.region,mountain_group:h.base.mountain_group,
  association:h.base.association,elevation_m:h.base.elevation_m,service:h.status,story:h.hut_story,
  story_status:h.story_status,opening_year:h.opening_year,anniversary_hooks:h.anniversary_hooks,
  has_notice:Boolean(h.notices?.length)||(!String(h.review_flags||'').startsWith('No specific')&&Boolean(h.review_flags)),
  notice_summary:h.notice_summary,has_prices:detail.tariffs.length>0,
  has_diet:!/^Not |^No /i.test(detail.visitor?.diet||'Not recorded'),checked:h.checked,
  latitude:h.latitude,longitude:h.longitude});
}
const manifest={...release,stats:data.stats,shoot_fields:data.shoot_fields,documentary_rules:data.documentary_rules,
 film_formats:data.film_formats,detail_bytes:bytes};
await write('index.json',index);await write('manifest.json',manifest);await write('sources.json',data.sources);
const generated=path.join(root,'website/lib/huts/generated');await fs.mkdir(generated,{recursive:true});
await fs.writeFile(path.join(generated,'identities.json'),JSON.stringify(data.records.map(h=>({id:h.id,number:h.number,name:h.name})))+'\n');
await fs.writeFile(path.join(generated,'approaches.json'),JSON.stringify(approachIndex)+'\n');
await fs.writeFile(path.join(generated,'shoot-fields.json'),JSON.stringify(data.shoot_fields)+'\n');
console.log(JSON.stringify({huts:index.length,routes:routes.length,sources:data.sources.length,
 release:release.release,index_bytes:Buffer.byteLength(JSON.stringify(index)),detail_bytes:bytes}));
