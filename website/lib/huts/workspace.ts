import identities from './generated/identities.json';
import approaches from './generated/approaches.json';
import fields from './generated/shoot-fields.json';
import {emptyWorkspace,validDate,type Workspace,type Trip,type SharedTrip} from './types';
const ids=new Set(identities.map(h=>h.id));
const fieldMap=new Map(fields.map(f=>[f.key,f]));
const own=(o:object,k:string)=>Object.prototype.hasOwnProperty.call(o,k);
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const short=(v:unknown,max=3000)=>{if(typeof v!=='string'||v.length>max)throw Error('Text is missing or too long.');return v;};
const date=(v:unknown)=>{const s=short(v,10);if(s&&!validDate(s))throw Error('Use a valid date.');return s;};
export function validateWorkspace(v:unknown):Workspace{
 if(!record(v))throw Error('Invalid workspace.');
 const out=emptyWorkspace();
 if(!Array.isArray(v.bookmarks)||v.bookmarks.length>630)throw Error('Invalid bookmarks.');
 out.bookmarks=[...new Set(v.bookmarks.map(x=>{if(typeof x!=='string'||!ids.has(x))throw Error('Unknown hut ID.');return x;}))];
 if(!record(v.plans)||Object.keys(v.plans).length>630)throw Error('Invalid shoot plans.');
 for(const [id,plan]of Object.entries(v.plans)){
  if(!ids.has(id)||!record(plan))throw Error('Unknown hut ID or invalid plan.');
  const dest:Record<string,string>={};
  for(const [key,value]of Object.entries(plan)){
   const f=fieldMap.get(key);if(!f)throw Error('Unknown documentary field.');
   const s=short(value);
   if(f.type==='date')date(s);
   if(f.type==='select'&&s&&!('options' in f&&Array.isArray(f.options)&&f.options.includes(s)))throw Error('Unknown field option.');
   if(f.type==='number'&&s&&(!Number.isFinite(Number(s))||Number(s)<1||Number(s)>2000))throw Error('Focal length must be 1–2000 mm.');
   dest[key]=s;
  }out.plans[id]=dest;
 }
 if(!Array.isArray(v.trips)||v.trips.length>200)throw Error('Too many trips.');
 const seen=new Set<string>();
 out.trips=v.trips.map(t=>{
  if(!record(t))throw Error('Invalid trip.');
  const id=short(t.id,100);if(!/^[a-zA-Z0-9-]{8,100}$/.test(id)||seen.has(id))throw Error('Invalid or repeated trip ID.');seen.add(id);
  if(!Array.isArray(t.destinations)||t.destinations.length>30)throw Error('Too many destinations.');
  const destinations=t.destinations.map(d=>{
   if(!record(d)||typeof d.hut_id!=='string'||!ids.has(d.hut_id))throw Error('Unknown destination.');
   const approach=short(d.approach_id,100);
   if(approach&&!((approaches as Record<string,string[]>)[d.hut_id]||[]).includes(approach))throw Error('Approach does not belong to this hut.');
   return {hut_id:d.hut_id,approach_id:approach};
  });
  if(!record(t.checklist))throw Error('Invalid checklist.');
  const checklist:Record<string,boolean>={};
  for(const [k,value]of Object.entries(t.checklist)){if(!['access','weather','travel','beds','offline','permissions'].includes(k)||typeof value!=='boolean')throw Error('Invalid checklist item.');checklist[k]=value;}
  const status=short(t.shoot_status,40);if(!['Not logged','Planned','Photos taken','No photos today'].includes(status))throw Error('Unknown shoot status.');
  return {id,name:short(t.name,120),date:date(t.date),destinations,notes:short(t.notes),checklist,shoot_status:status,day_notes:short(t.day_notes)};
 });
 if(!record(v.legacy))throw Error('Invalid calendar data.');
 const legacyStr=JSON.stringify(v.legacy);if(legacyStr.length>700000)throw Error('Calendar data is too large.');
 for(const [k,value]of Object.entries(v.legacy)){
  if(['__proto__','constructor','prototype'].includes(k)||k.length>200)throw Error('Invalid calendar key.');
  // Stored as inert JSON; never interpreted as HTML, code, permissions or research.
  out.legacy[k]=value;
 }return out;
}
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
export function mergeWorkspace(base:Workspace,local:Workspace,remote:Workspace){
 const conflicts:string[]=[];
 function merge(b:unknown,l:unknown,r:unknown,path:string):unknown{
  if(equal(l,b))return r;if(equal(r,b)||equal(l,r))return l;
  if((b===undefined||record(b))&&record(l)&&record(r)){
   b=b||{};
   const out:Record<string,unknown>={};
   for(const k of new Set([...Object.keys(b as Record<string,unknown>),...Object.keys(l),...Object.keys(r)])){
    const v=merge((b as Record<string,unknown>)[k],l[k],r[k],path+'.'+k);if(v!==undefined)out[k]=v;
   }return out;
  }conflicts.push(path);return l;
 }
 const baseTrip=Object.fromEntries(base.trips.map(t=>[t.id,t])),localTrip=Object.fromEntries(local.trips.map(t=>[t.id,t])),remoteTrip=Object.fromEntries(remote.trips.map(t=>[t.id,t]));
 const removed=new Set(base.bookmarks.filter(id=>!local.bookmarks.includes(id)||!remote.bookmarks.includes(id)));
 const bookmarks=[...new Set([...local.bookmarks,...remote.bookmarks])].filter(id=>!removed.has(id));
 const merged=merge({plans:base.plans,trips:baseTrip,legacy:base.legacy},{plans:local.plans,trips:localTrip,legacy:local.legacy},{plans:remote.plans,trips:remoteTrip,legacy:remote.legacy},'workspace') as {plans:Workspace['plans'];trips:Record<string,Trip>;legacy:Workspace['legacy']};
 return {workspace:{bookmarks,plans:merged.plans,trips:Object.values(merged.trips),legacy:merged.legacy},conflicts};
}
export function importGuide(current:Workspace,input:unknown){
 if(!record(input))throw Error('Choose a guide export JSON file.');
 const next=structuredClone(current),conflicts:string[]=[],skipped:string[]=[];let added=0;
 if(input.format==='alpenverein-hut-bookmarks'&&input.version===1&&Array.isArray(input.hut_ids)){
  for(const value of input.hut_ids){if(typeof value!=='string'||!ids.has(value)){skipped.push(String(value));continue;}if(!next.bookmarks.includes(value)){next.bookmarks.push(value);added++;}}
 }else if(input.format==='alpenverein-documentary-plans'&&input.version===1&&record(input.plans)){
  for(const [id,plan]of Object.entries(input.plans)){
   if(!ids.has(id)||!record(plan)){skipped.push(id);continue;}
   const dest=next.plans[id]||{};
   for(const [key,value]of Object.entries(plan)){
    const f=fieldMap.get(key);if(!f||typeof value!=='string'){skipped.push(id+'.'+key);continue;}
    const fixture=emptyWorkspace();fixture.plans[id]={[key]:value};
    try{validateWorkspace(fixture);}catch{skipped.push(id+'.'+key);continue;}
    if(value===''||value===f.default)continue;
    if(dest[key]&&dest[key]!==f.default&&dest[key]!==value){conflicts.push(id+'.'+key);continue;}
    if(dest[key]!==value){dest[key]=value;added++;}
   }next.plans[id]=dest;
  }
 }else if(input.format==='vertical-moment-hut-workspace'&&input.version===1){
  const imported=validateWorkspace(input.workspace);
  for(const id of imported.bookmarks)if(!next.bookmarks.includes(id)){next.bookmarks.push(id);added++;}
  for(const [id,plan]of Object.entries(imported.plans)){
   const result=importGuide(next,{format:'alpenverein-documentary-plans',version:1,plans:{[id]:plan}});
   Object.assign(next,result.workspace);conflicts.push(...result.conflicts);added+=result.added;
  }
  for(const trip of imported.trips){if(next.trips.some(t=>t.id===trip.id)){conflicts.push('trip.'+trip.id);continue;}next.trips.push(trip);added++;}
  for(const [key,value]of Object.entries(imported.legacy)){if(own(next.legacy,key)&&!equal(next.legacy[key],value)){conflicts.push('calendar.'+key);continue;}next.legacy[key]=value;}
 }else throw Error('Unsupported export format or version.');
 return {workspace:validateWorkspace(next),conflicts,skipped,added};
}
export function shareProjection(trip:Trip,options:{notes?:boolean;day_log?:boolean},release:string):SharedTrip{
 return {name:trip.name,date:trip.date,destinations:trip.destinations.map(d=>({...d})),
 ...(options.notes?{notes:trip.notes}:{}),...(options.day_log?{shoot_status:trip.shoot_status,day_notes:trip.day_notes}:{}),
 release,created_at:new Date().toISOString()};
}
