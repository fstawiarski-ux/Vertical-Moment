import {resources,failure,checkOrigin,boundedJson,HttpError} from '@/lib/huts/server';
export const dynamic='force-dynamic';
async function handler(request:Request){
 try{const {auth,baseURL}=await resources();if(request.method==='POST'){checkOrigin(request,baseURL);const body=await boundedJson(request.clone(),16384);if(!body||typeof body!=='object'||Array.isArray(body))throw new HttpError(400,'Invalid account request.');}
 const response=await auth.handler(request);response.headers.set('Cache-Control','private, no-store, max-age=0');response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');return response;
 }catch(error){return failure(error);}
}
export const GET=handler;export const POST=handler;
