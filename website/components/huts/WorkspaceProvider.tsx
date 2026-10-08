"use client";
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {emptyWorkspace,type Workspace} from '@/lib/huts/types';
import {validateWorkspace} from '@/lib/huts/workspace';
import {deviceWorkspaceKey,readDeviceWorkspace,saveDeviceWorkspace} from '@/lib/huts/device-workspace';

type Context={workspace:Workspace;ready:boolean;status:string;change:(fn:(w:Workspace)=>void)=>void};
const ctx=createContext<Context|null>(null);
const memoryStatus='Changes are only in memory. Export a backup; browser storage is unavailable.';

export function WorkspaceProvider({children}:{children:ReactNode}){
 const [workspace,setWorkspace]=useState(emptyWorkspace),[ready,setReady]=useState(false),[status,setStatus]=useState('Opening your saved plans...');
 const current=useRef(emptyWorkspace()),opened=useRef(false),memoryOnly=useRef(false),blocked=useRef(false);
 useEffect(()=>{
  try{
   const saved=readDeviceWorkspace(localStorage);
   current.current=saved;setWorkspace(saved);
   try{saveDeviceWorkspace(localStorage,saved);setStatus('Saved on this device');}
   catch{memoryOnly.current=true;setStatus(memoryStatus);}
  }catch{
   // Keep an unreadable existing copy intact. Edits can still be exported,
   // but must not silently overwrite the only saved copy.
   blocked.current=true;memoryOnly.current=true;
   setStatus('The saved browser copy could not be opened. It has been kept intact; export any new edits before leaving.');
  }
  opened.current=true;setReady(true);
  const refresh=(event:StorageEvent)=>{
   if(event.key!==deviceWorkspaceKey||memoryOnly.current)return;
   try{
    const saved=event.newValue===null?emptyWorkspace():readDeviceWorkspace(localStorage);
    current.current=saved;setWorkspace(saved);setStatus('Saved on this device');
   }catch{setStatus('Another tab has an unreadable saved copy. Export your current plans before leaving.');}
  };
  window.addEventListener('storage',refresh);
  return()=>window.removeEventListener('storage',refresh);
 },[]);
 const change=useCallback((fn:(w:Workspace)=>void)=>{
  if(!opened.current)return;
  let next:Workspace;
  try{
   // Use the latest stored values so an idle tab preserves another tab's edits.
   next=structuredClone(memoryOnly.current?current.current:readDeviceWorkspace(localStorage));
   fn(next);next=validateWorkspace(next);
  }catch(error){setStatus(error instanceof Error?error.message:'Invalid planning value.');return;}
  current.current=next;setWorkspace(next);
  if(blocked.current){setStatus(memoryStatus);return;}
  try{saveDeviceWorkspace(localStorage,next);memoryOnly.current=false;setStatus('Saved on this device');}
  catch{memoryOnly.current=true;setStatus(memoryStatus);}
 },[]);
 return <ctx.Provider value={{workspace,ready,status,change}}>{children}</ctx.Provider>;
}
export function useWorkspace(){
 const value=useContext(ctx);if(!value)throw Error('Workspace provider is missing.');return value;
}
