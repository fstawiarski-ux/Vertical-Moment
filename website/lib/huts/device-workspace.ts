import {emptyWorkspace,type Workspace} from './types';
import {validateWorkspace} from './workspace';

export const deviceWorkspaceKey='vm.huts.local.v1';
type StorageAccess=Pick<Storage,'getItem'|'setItem'>;

export function readDeviceWorkspace(storage:StorageAccess):Workspace{
 const saved=storage.getItem(deviceWorkspaceKey);
 if(saved!==null)return validateWorkspace(JSON.parse(saved).workspace);
 // Preserve the last device copy from the earlier implementation. No request
 // or sign-in is needed, and the old copies remain available as backups.
 const active=storage.getItem('vm.huts.active-account.v1');
 if(active){
  const id=JSON.parse(active)?.id;
  if(typeof id==='string'){
   const previous=storage.getItem('vm.huts.private.v1.'+id)||storage.getItem('vm.huts.recovery.v1.'+id);
   if(previous)return validateWorkspace(JSON.parse(previous).workspace);
  }
 }
 const previous=storage.getItem('vm.huts.guest.v1');
 return previous?validateWorkspace(JSON.parse(previous).workspace):emptyWorkspace();
}

export function saveDeviceWorkspace(storage:StorageAccess,workspace:Workspace){
 storage.setItem(deviceWorkspaceKey,JSON.stringify({
  version:1,workspace:validateWorkspace(workspace),updated_at:new Date().toISOString()
 }));
}
