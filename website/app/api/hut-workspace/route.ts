import {authenticated,checkOrigin,boundedJson,privateJson,failure,HttpError} from '@/lib/huts/server';
import {emptyWorkspace} from '@/lib/huts/types';
import {validateWorkspace} from '@/lib/huts/workspace';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{const {db,user}=await authenticated(request);
 const row=await db.prepare('SELECT payload,revision,updated_at FROM hut_workspace WHERE user_id=?').bind(user.id).first<{payload:string;revision:number;updated_at:string}>();
 return privateJson({workspace:row?JSON.parse(row.payload):emptyWorkspace(),revision:row?.revision||0,updated_at:row?.updated_at||null,user:{id:user.id,name:user.name,email:user.email}});
 }catch(error){return failure(error);}
}
export async function PUT(request:Request){
 try{const {db,user,baseURL}=await authenticated(request);checkOrigin(request,baseURL);
 const body=await boundedJson(request) as {workspace?:unknown;revision?:unknown};
 if(!Number.isInteger(body?.revision)||Number(body.revision)<0)throw new HttpError(400,'A valid workspace revision is required.');
 let workspace;try{workspace=validateWorkspace(body.workspace);}catch(error){throw new HttpError(400,error instanceof Error?error.message:'Invalid workspace.');}
 const now=new Date().toISOString();
 const results=await db.batch([
  db.prepare('INSERT OR IGNORE INTO hut_workspace(user_id,payload,revision,updated_at) VALUES(?,?,0,?)').bind(user.id,JSON.stringify(emptyWorkspace()),now),
  db.prepare('UPDATE hut_workspace SET payload=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=?').bind(JSON.stringify(workspace),now,user.id,Number(body.revision))
 ]);
 if(!results[1].meta.changes)throw new HttpError(409,'Your account was changed on another device. Review the conflicting fields before saving.');
 return privateJson({revision:Number(body.revision)+1,updated_at:now});
 }catch(error){return failure(error);}
}
