"use client";
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {emptyWorkspace,type Workspace,type WorkspaceEnvelope} from '@/lib/huts/types';
import {mergeWorkspace,validateWorkspace} from '@/lib/huts/workspace';
type User=WorkspaceEnvelope['user'];
type Conflict={remote:WorkspaceEnvelope;merged:Workspace;paths:string[]};
type Context={workspace:Workspace;user:User|null;ready:boolean;online:boolean;status:string;pending:boolean;conflict:Conflict|null;change:(fn:(w:Workspace)=>void)=>void;sync:()=>Promise<void>;resolve:(choices:Record<string,'device'|'account'>)=>void;signOut:()=>Promise<void>};
const ctx=createContext<Context|null>(null);
const activeKey='vm.huts.active-account.v1',guestKey='vm.huts.guest.v1',key=(id:string)=>'vm.huts.private.v1.'+id,recoveryKey=(id:string)=>'vm.huts.recovery.v1.'+id;
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
function readCached(id?:string){try{const raw=JSON.parse(localStorage.getItem(id?key(id):guestKey)||(id?localStorage.getItem(recoveryKey(id)):null)||'null');if(!raw)return null;return {...raw,workspace:validateWorkspace(raw.workspace),base:validateWorkspace(raw.base||emptyWorkspace())};}catch{return null;}}
function writeCache(user:User|null,w:Workspace,base:Workspace,revision:number){try{localStorage.setItem(user?key(user.id):guestKey,JSON.stringify({workspace:w,base,revision,updated_at:new Date().toISOString()}));if(user){localStorage.setItem(activeKey,JSON.stringify(user));if(same(w,base))localStorage.removeItem(recoveryKey(user.id));}}catch{/* Storage can be unavailable; server saves and export remain available. */}}
function asMergeMap(w:Workspace){return {...w,trips:Object.fromEntries(w.trips.map(t=>[t.id,t]))};}
export function WorkspaceProvider({children}:{children:ReactNode}){
 const [workspace,setWorkspace]=useState(emptyWorkspace),[user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[online,setOnline]=useState(true),[status,setStatus]=useState('Opening your workspace…'),[pending,setPending]=useState(false),[conflict,setConflict]=useState<Conflict|null>(null);
 const epoch=useRef(0);
 const current=useRef(emptyWorkspace()),base=useRef(emptyWorkspace()),revision=useRef(0),account=useRef<User|null>(null),busy=useRef(false),started=useRef(false),conflicts=useRef<Conflict|null>(null);
 const apply=useCallback((w:Workspace,b=base.current,r=revision.current)=>{current.current=w;base.current=b;revision.current=r;setWorkspace(w);const dirty=!same(w,b);setPending(dirty);writeCache(account.current,w,b,r);},[]);
 const clearAccount=useCallback((preserveQueue=true)=>{epoch.current++;const old=account.current;const queued=old&&!same(current.current,base.current);if(old)try{if(preserveQueue&&queued)localStorage.setItem(recoveryKey(old.id),JSON.stringify({workspace:current.current,base:base.current,revision:revision.current}));localStorage.removeItem(key(old.id));if(!preserveQueue)localStorage.removeItem(recoveryKey(old.id));}catch{}try{localStorage.removeItem(activeKey);if(localStorage.getItem('climbplanner.account.user.v1')){localStorage.removeItem('climbplanner.v1');localStorage.removeItem('climbplanner.account.user.v1');localStorage.removeItem('climbplanner.account.base.v1');localStorage.removeItem('climbplanner.sync.enabled.v1');}}catch{}account.current=null;setUser(null);conflicts.current=null;setConflict(null);const cached=readCached();apply(cached?.workspace||emptyWorkspace(),emptyWorkspace(),0);setStatus(preserveQueue&&queued?'Session ended. Sign in to restore your queued account changes.':'Saved on this device');},[apply]);
 const sync=useCallback(async()=>{
  if(busy.current||conflicts.current)return;
  if(!navigator.onLine){setOnline(false);setStatus(account.current?(!same(current.current,base.current)?'Queued offline · reconnect to sync':'Offline account copy on this device'):'Saved on this device');return;}
  busy.current=true;setOnline(true);const generation=epoch.current;
  try{
   for(let attempt=0;attempt<3;attempt++){
    const res=await fetch('/api/hut-workspace',{cache:'no-store',credentials:'same-origin'});
    if(generation!==epoch.current)return;
    if(res.status===401){clearAccount();return;}
    if(!res.ok)throw Error('Account service unavailable. Your device copy is retained.');
    const remote:WorkspaceEnvelope=await res.json();validateWorkspace(remote.workspace);
    if(!account.current||account.current.id!==remote.user.id){
     if(account.current)try{localStorage.removeItem(key(account.current.id));}catch{}
     account.current=remote.user;setUser(remote.user);
     const cached=readCached(remote.user.id);
     apply(cached?.workspace||remote.workspace,cached?.base||remote.workspace,cached?.revision??remote.revision);
    }else{account.current=remote.user;setUser(remote.user);}
    const snapshot=structuredClone(current.current);
    const result=mergeWorkspace(base.current,snapshot,remote.workspace);
    if(result.conflicts.length){const c={remote,merged:result.workspace,paths:result.conflicts};conflicts.current=c;setConflict(c);setStatus('Review changes from another device');return;}
    if(same(result.workspace,remote.workspace)){apply(result.workspace,remote.workspace,remote.revision);setStatus('Saved to account');return;}
    setStatus('Saving to account…');
    const save=await fetch('/api/hut-workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspace:result.workspace,revision:remote.revision})});
    if(generation!==epoch.current)return;
    if(save.status===409)continue;
    if(save.status===401){clearAccount();return;}
    if(!save.ok)throw Error('Save paused. Your changes remain on this device.');
    const saved=await save.json() as {revision:number};if(generation!==epoch.current)return;
    const later=mergeWorkspace(snapshot,current.current,result.workspace);
    apply(later.workspace,result.workspace,saved.revision);
    setStatus(same(later.workspace,result.workspace)?'Saved to account':'Changes queued for sync');return;
   }setStatus('Another device is saving. Your changes are queued.');
  }catch(error){setStatus(error instanceof Error?error.message:'Sync paused. Your changes are retained.');}
  finally{busy.current=false;started.current=true;setReady(true);}
 },[apply,clearAccount]);
 useEffect(()=>{
  let stored:User|null=null;try{stored=JSON.parse(localStorage.getItem(activeKey)||'null');}catch{}
  if(stored&&typeof stored.id==='string'){account.current=stored;setUser(stored);}
  const cached=readCached(stored?.id);apply(cached?.workspace||emptyWorkspace(),cached?.base||emptyWorkspace(),cached?.revision||0);
  setOnline(navigator.onLine);setReady(!navigator.onLine);if(!navigator.onLine){setStatus(stored?'Offline device copy · sign-in will be checked on reconnect':'Saved on this device');started.current=true;}
  void sync();const refresh=()=>void sync(),network=()=>{setOnline(navigator.onLine);if(navigator.onLine)void sync();else setStatus(account.current?(!same(current.current,base.current)?'Queued offline · reconnect to sync':'Offline account copy on this device'):'Saved on this device');};
  const storage=(e:StorageEvent)=>{if(e.key===activeKey&&!e.newValue&&account.current)clearAccount();else if(e.key===activeKey&&e.newValue)void sync();};
  window.addEventListener('storage',storage);window.addEventListener('online',network);window.addEventListener('offline',network);window.addEventListener('focus',refresh);
  const timer=window.setInterval(refresh,15000);
  return()=>{clearInterval(timer);window.removeEventListener('storage',storage);window.removeEventListener('online',network);window.removeEventListener('offline',network);window.removeEventListener('focus',refresh);};
 },[apply,sync,clearAccount]);
 useEffect(()=>{if(!ready||!user||!pending||conflict)return;const timer=setTimeout(()=>void sync(),900);return()=>clearTimeout(timer);},[workspace,ready,user,pending,conflict,sync]);
 const change=useCallback((fn:(w:Workspace)=>void)=>{const next=structuredClone(current.current);fn(next);try{apply(validateWorkspace(next));}catch(e){setStatus(e instanceof Error?e.message:"Invalid planning value.");return;}setStatus(account.current?(navigator.onLine?'Changes queued for sync':'Queued offline · reconnect to sync'):'Saved on this device');},[apply]);
 const resolve=useCallback((choices:Record<string,'device'|'account'>)=>{
  const c=conflicts.current;if(!c||c.paths.some(p=>!choices[p]))return;
  const map=asMergeMap(structuredClone(c.merged)),remote=asMergeMap(c.remote.workspace);
  for(const path of c.paths){if(choices[path]!=='account')continue;const parts=path.split('.').slice(1);let dest:any=map,src:any=remote;for(const p of parts.slice(0,-1)){dest[p]??={};dest=dest[p];src=src?.[p];}const last=parts.at(-1)!;if(src?.[last]===undefined)delete dest[last];else dest[last]=structuredClone(src[last]);}
  const w={...map,trips:Object.values(map.trips)} as Workspace;conflicts.current=null;setConflict(null);apply(validateWorkspace(w),c.remote.workspace,c.remote.revision);setStatus('Reviewed changes queued for sync');setTimeout(()=>void sync(),0);
 },[apply,sync,clearAccount]);
 const signOut=useCallback(async()=>{if(!navigator.onLine)throw Error('Reconnect to sign out securely. Export your device copy first if needed.');if(!same(current.current,base.current)){await sync();if(!same(current.current,base.current))throw Error('Save or export the queued changes before signing out.');}const r=await fetch('/api/auth/sign-out',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!r.ok)throw Error('Sign-out failed. Try again.');clearAccount(false);},[sync,clearAccount]);
 return <ctx.Provider value={{workspace,user,ready,online,status,pending,conflict,change,sync,resolve,signOut}}>{children}</ctx.Provider>;
}
export function useWorkspace(){const value=useContext(ctx);if(!value)throw Error('Workspace provider is missing.');return value;}
export function ConflictReview(){
 const {conflict,resolve}=useWorkspace();const [choices,setChoices]=useState<Record<string,'device'|'account'>>({});
 useEffect(()=>setChoices({}),[conflict]);if(!conflict)return null;
 const read=(w:Workspace,path:string)=>{let v:any=asMergeMap(w);for(const p of path.split('.').slice(1))v=v?.[p];return v===undefined?'Deleted':typeof v==='string'?v:JSON.stringify(v);};
 return <section className="hut-alert" role="alert"><h2>Review changes from another device</h2><p>Other changes can be combined. Choose which value to keep for each item below before saving.</p>{conflict.paths.map(path=><fieldset key={path}><legend>{path.replace('workspace.','')}</legend><p>This device’s value: {read(conflict.merged,path)}</p><p>Account value: {read(conflict.remote.workspace,path)}</p><label><input type="radio" name={path} checked={choices[path]==='device'} onChange={()=>setChoices(c=>({...c,[path]:'device'}))}/> Keep this device’s value</label><label><input type="radio" name={path} checked={choices[path]==='account'} onChange={()=>setChoices(c=>({...c,[path]:'account'}))}/> Keep the account value</label></fieldset>)}<button disabled={conflict.paths.some(p=>!choices[p])} onClick={()=>resolve(choices)}>Save reviewed choices</button></section>;
}
