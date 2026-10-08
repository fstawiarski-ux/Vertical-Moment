import {authenticated,checkOrigin,boundedJson,privateJson,failure,HttpError,tokenHash} from '@/lib/huts/server';
import {shareProjection} from '@/lib/huts/workspace';
import type {Workspace} from '@/lib/huts/types';
import release from '../../../public/huts-data/v1/manifest.json';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{const {db,user}=await authenticated(request);const rows=await db.prepare('SELECT id,trip_id,payload,created_at,revoked FROM hut_share WHERE user_id=? ORDER BY created_at DESC LIMIT 200').bind(user.id).all<{id:string;trip_id:string;payload:string;created_at:string;revoked:number}>();
 return privateJson({shares:rows.results.map(r=>({id:r.id,trip_id:r.trip_id,name:JSON.parse(r.payload).name,created_at:r.created_at,revoked:Boolean(r.revoked)}))});
 }catch(error){return failure(error);}
}
export async function POST(request:Request){
 try{const {db,user,baseURL}=await authenticated(request);checkOrigin(request,baseURL);
 const body=await boundedJson(request,16384) as {trip_id?:unknown;notes?:unknown;day_log?:unknown;expected?:unknown};
 if(!body||typeof body!=='object'||Array.isArray(body)||typeof body.trip_id!=='string'||typeof body.notes!=='boolean'||typeof body.day_log!=='boolean')throw new HttpError(400,'Choose a saved trip and explicit sharing fields.');
 const row=await db.prepare('SELECT payload FROM hut_workspace WHERE user_id=?').bind(user.id).first<{payload:string}>();
 const trip=(row?JSON.parse(row.payload) as Workspace:null)?.trips.find(t=>t.id===body.trip_id);
 if(!trip)throw new HttpError(404,'Saved trip not found.');
 const count=await db.prepare('SELECT COUNT(*) AS count FROM hut_share WHERE user_id=? AND revoked=0').bind(user.id).first<{count:number}>();
 if((count?.count||0)>=100)throw new HttpError(429,'Revoke an old share before creating another.');
 const token=Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url'),id=crypto.randomUUID();
 const view=shareProjection(trip,{notes:body.notes,day_log:body.day_log},release.release);
 const expected=body.expected;if(!expected||typeof expected!=='object'||Array.isArray(expected))throw new HttpError(400,'A reviewed sharing preview is required.');
 const publicFields=Object.fromEntries(Object.entries(view).filter(([key])=>key!=='created_at'));
 if(Object.keys(expected).length!==Object.keys(publicFields).length||Object.entries(publicFields).some(([key,value])=>JSON.stringify((expected as Record<string,unknown>)[key])!==JSON.stringify(value)))throw new HttpError(409,'The saved trip changed. Sync and review the preview again before sharing.');
 await db.prepare('INSERT INTO hut_share(id,user_id,trip_id,token_hash,payload,created_at) VALUES(?,?,?,?,?,?)').bind(id,user.id,trip.id,await tokenHash(token),JSON.stringify(view),view.created_at).run();
 return privateJson({id,url:new URL('/share/'+token,baseURL).href,view},201);
 }catch(error){return failure(error);}
}
export async function DELETE(request:Request){
 try{const {db,user,baseURL}=await authenticated(request);checkOrigin(request,baseURL);
 const id=new URL(request.url).searchParams.get('id');if(!id||id.length>100)throw new HttpError(400,'Choose a share to revoke.');
 const result=await db.prepare('UPDATE hut_share SET revoked=1 WHERE id=? AND user_id=?').bind(id,user.id).run();
 if(!result.meta.changes)throw new HttpError(404,'Share not found.');
 return privateJson({ok:true});
 }catch(error){return failure(error);}
}
