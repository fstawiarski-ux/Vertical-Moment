import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve('..'),canonical=path.join(root,'database/huts/master'),output=path.join(root,'website/public/huts-data/v1');
const read=async(dir,file)=>JSON.parse(await fs.readFile(path.join(dir,file),'utf8'));
const data=await read(canonical,'expanded-master-data.json'),routes=await read(canonical,'active-routes.json'),release=await read(canonical,'release.json'),index=await read(output,'index.json'),manifest=await read(output,'manifest.json');
assert.equal(index.length,630);assert.equal(new Set(index.map(h=>h.id)).size,630);
assert.deepEqual(index.map(h=>[h.number,h.id,h.name]),data.records.map(h=>[h.number,h.id,h.name]));
assert.equal(manifest.expanded_sha256,createHash('sha256').update(await fs.readFile(path.join(canonical,'expanded-master-data.json'))).digest('hex'));
assert.equal(manifest.active_routes_sha256,createHash('sha256').update(JSON.stringify(routes)).digest('hex'));
const sourceRefs=new Set(data.sources.map(s=>s.ref)),contexts=new Map(data.contexts.map(c=>[c.context_id,c]));
let sourceLinks=0,routeCount=0,dates=0,tariffs=0,events=0;
for(const h of data.records){
 const detail=await read(output,h.id+'.json');assert.deepEqual(detail.record,h);assert.equal(detail.release,release.release);
 assert.deepEqual(detail.visitor,data.visitors.find(v=>v.id===h.id)||null);
 assert.deepEqual(detail.surroundings,data.surroundings.find(v=>v.id===h.id)||null);
 for(const [key,original]of [['tariffs','tariffs'],['events','events'],['dates','history_dates_reviewed']])assert.deepEqual(detail[key],data[original].filter(r=>r.id===h.id));
 const raw=detail.routes.map(({web_route_id,...r})=>r);assert.deepEqual(raw,routes.filter(r=>r.id===h.id));
 for(const r of detail.routes)assert.equal(r.web_route_id,'R'+createHash('sha256').update(JSON.stringify(raw[detail.routes.indexOf(r)])).digest('hex').slice(0,20));
 const ownRefs=new Set(detail.sources.map(s=>s.ref));for(const ref of JSON.stringify({...detail,sources:[]}).match(/S\d{5}/g)||[]){assert.ok(sourceRefs.has(ref));assert.ok(ownRefs.has(ref));sourceLinks++;}
 for(const c of detail.contexts){assert.deepEqual(c,contexts.get(c.context_id));assert.ok(String(c.hut_ids).split(/[,;\s]+/).includes(h.id));}
 dates+=detail.dates.length;tariffs+=detail.tariffs.length;events+=detail.events.length;routeCount+=detail.routes.length;
}
assert.equal(routeCount,routes.length);
const report={checked:new Date().toISOString(),release:release.release,identities:630,route_count:routeCount,source_references:sourceLinks,dates,tariffs,events,expanded_sha256:manifest.expanded_sha256,active_routes_sha256:manifest.active_routes_sha256,workbook_sha256:manifest.workbook_sha256,offline_guide_sha256:manifest.offline_guide_sha256,result:'PASS — every exported reviewed record, route, tariff, event, history date and context relationship matches canonical inputs.'};
await fs.mkdir('reports',{recursive:true});await fs.writeFile('reports/hut-data-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
