import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {emptyWorkspace,type Workspace} from './types';
import {deviceWorkspaceKey} from './device-workspace';

const hooks=vi.hoisted(()=>{
 let cursor=0;
 const slots:unknown[]=[],effects:Array<()=>unknown>=[];
 return {
  reset(){cursor=0;slots.length=0;effects.length=0;},
  render(){cursor=0;},
  flush(){for(const effect of effects.splice(0))effect();},
  useEffect(effect:()=>unknown){const i=cursor++;if(!(i in slots)){slots[i]=true;effects.push(effect);}},
  useRef<T>(value:T){const i=cursor++;return (slots[i]??={current:value}) as {current:T};},
  useState<T>(initial:T|(()=>T)):[T,(value:T|((current:T)=>T))=>void]{
   const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?(initial as ()=>T)():initial;
   return [slots[i] as T,value=>{slots[i]=typeof value==='function'?(value as (current:T)=>T)(slots[i] as T):value;}];
  }
 };
});
vi.mock('react',()=>({
 createContext:()=>({Provider:'Provider'}),useCallback:(fn:unknown)=>fn,
 useEffect:hooks.useEffect,useRef:hooks.useRef,useState:hooks.useState
}));
vi.mock('react/jsx-runtime',()=>({jsx:(type:unknown,props:unknown)=>({type,props}),jsxs:(type:unknown,props:unknown)=>({type,props})}));
import {WorkspaceProvider} from '../../components/huts/WorkspaceProvider';
type State={workspace:Workspace;ready:boolean;status:string;change:(fn:(workspace:Workspace)=>void)=>void};
let storage:Map<string,string>,failWrites:boolean;
function render(){hooks.render();return WorkspaceProvider({children:null}).props.value as State;}
function open(){render();hooks.flush();return render();}
function write(workspace:Workspace,key=deviceWorkspaceKey){storage.set(key,JSON.stringify({workspace}));}
function saved(){return JSON.parse(storage.get(deviceWorkspaceKey)!).workspace as Workspace;}
function tripWorkspace(){
 const workspace=emptyWorkspace();
 workspace.trips.push({id:'trip-test-2026',name:'Rax weekend',date:'2026-10-17',destinations:[],notes:'Original notes',checklist:{},shoot_status:'Planned',day_notes:''});
 return workspace;
}
beforeEach(()=>{
 hooks.reset();storage=new Map();failWrites=false;
 vi.stubGlobal('localStorage',{
  getItem:(key:string)=>storage.get(key)??null,
  setItem:(key:string,value:string)=>{if(failWrites)throw Error('Quota exceeded');storage.set(key,value);}
 });
 vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn()});
 vi.stubGlobal('fetch',vi.fn(()=>{throw Error('Personal data must never use an account API.');}));
});
afterEach(()=>vi.unstubAllGlobals());

describe('Browser-only hut workspace',()=>{
 it('opens the device copy without authentication or network requests',()=>{
  write(tripWorkspace());const state=open();
  expect(state.ready).toBe(true);expect(state.workspace.trips[0].notes).toBe('Original notes');
  expect(state.status).toBe('Saved on this device');expect(fetch).not.toHaveBeenCalled();
 });
 it('migrates the older browser workspace and keeps its original backup intact',()=>{
  const workspace=tripWorkspace();workspace.bookmarks=['167'];write(workspace,'vm.huts.guest.v1');
  const old=storage.get('vm.huts.guest.v1');expect(open().workspace).toEqual(workspace);
  expect(saved()).toEqual(workspace);expect(storage.get('vm.huts.guest.v1')).toBe(old);
 });
 it('recovers only the last selected cached device copy without signing in',()=>{
  const workspace=tripWorkspace();workspace.trips[0].day_notes='Previously saved day notes';
  storage.set('vm.huts.active-account.v1',JSON.stringify({id:'previous-local-copy'}));
  write(workspace,'vm.huts.private.v1.previous-local-copy');
  write(emptyWorkspace(),'vm.huts.private.v1.unrelated-copy');
  expect(open().workspace).toEqual(workspace);expect(saved()).toEqual(workspace);
  expect(fetch).not.toHaveBeenCalled();
 });
 it('keeps consecutive itinerary, day-log and bookmark edits after reopening',()=>{
  write(tripWorkspace());let state=open();
  state.change(w=>{w.trips[0].notes='Updated itinerary';});
  state.change(w=>{w.trips[0].day_notes='New day notes';w.bookmarks.push('167');});
  hooks.reset();state=open();
  expect(state.workspace.trips[0]).toMatchObject({notes:'Updated itinerary',day_notes:'New day notes'});
  expect(state.workspace.bookmarks).toEqual(['167']);expect(fetch).not.toHaveBeenCalled();
 });
 it('preserves another tab edit when this tab changes a different value',()=>{
  write(tripWorkspace());const state=open(),other=saved();other.bookmarks=['167'];write(other);
  state.change(w=>{w.trips[0].day_notes='My new day notes';});
  expect(saved().bookmarks).toEqual(['167']);expect(saved().trips[0].day_notes).toBe('My new day notes');
 });
 it('retains unsaved edits in memory after a storage failure and reports them accurately',()=>{
  write(tripWorkspace());let state=open();failWrites=true;
  state.change(w=>{w.trips[0].notes='Keep this unsaved edit';});
  state=render();expect(state.status).toContain('only in memory');
  state.change(w=>{w.trips[0].day_notes='Keep this later edit too';});
  state=render();expect(state.workspace.trips[0]).toMatchObject({notes:'Keep this unsaved edit',day_notes:'Keep this later edit too'});
  expect(saved().trips[0].notes).toBe('Original notes');
 });
 it('keeps a damaged saved copy intact rather than overwriting it with an empty workspace',()=>{
  storage.set(deviceWorkspaceKey,'damaged data');let state=open();
  expect(state.status).toContain('kept intact');state.change(w=>{w.bookmarks.push('167');});
  state=render();expect(state.workspace.bookmarks).toEqual(['167']);
  expect(storage.get(deviceWorkspaceKey)).toBe('damaged data');expect(state.status).toContain('only in memory');
 });
});
