import {resources,tokenHash,privateJson,failure,HttpError} from '@/lib/huts/server';
export const dynamic='force-dynamic';
export async function GET(_request:Request,context:{params:Promise<{token:string}>}){
 try{const {token}=await context.params;if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw new HttpError(404,'This share is unavailable.');
 const {db}=await resources();const row=await db.prepare('SELECT payload FROM hut_share WHERE token_hash=? AND revoked=0').bind(await tokenHash(token)).first<{payload:string}>();
 if(!row)throw new HttpError(404,'This share is unavailable or has been revoked.');
 return privateJson({view:JSON.parse(row.payload)});
 }catch(error){return failure(error);}
}
