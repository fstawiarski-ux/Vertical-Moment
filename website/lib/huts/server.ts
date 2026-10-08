import {getCloudflareContext} from '@opennextjs/cloudflare';
import {betterAuth} from 'better-auth';
import {drizzleAdapter} from '@better-auth/drizzle-adapter';
import {drizzle} from 'drizzle-orm/d1';
import * as schema from './auth-schema';
import {NextResponse} from 'next/server';
import {canRegisterLocally} from './account-mode';
export class HttpError extends Error{constructor(public status:number,message:string){super(message);}}
export async function resources(){
 const {env}=await getCloudflareContext({async:true});
 if(!env.HUT_DB)throw new HttpError(503,'Account storage has not been configured.');
 const secret=env.BETTER_AUTH_SECRET||process.env.BETTER_AUTH_SECRET;
 const baseURL=env.BETTER_AUTH_URL||process.env.BETTER_AUTH_URL||'https://verticalmoment.com';
 if(!secret||secret.length<32)throw new HttpError(503,'Account service has not been configured.');
 const auth=betterAuth({appName:'Vertical Moment',baseURL,secret,
  database:drizzleAdapter(drizzle(env.HUT_DB,{schema}),{provider:'sqlite',schema,transaction:false}),
  emailAndPassword:{enabled:true,minPasswordLength:12,maxPasswordLength:128,disableSignUp:!canRegisterLocally(baseURL),requireEmailVerification:!canRegisterLocally(baseURL)},
  session:{expiresIn:60*60*24*30,updateAge:60*60*24,cookieCache:{enabled:false}},
  advanced:{cookiePrefix:'vm_huts',useSecureCookies:new URL(baseURL).protocol==='https:',database:{generateId:()=>crypto.randomUUID()}},
  rateLimit:{enabled:true,storage:'database',window:60,max:60,customRules:{'/sign-in/email':{window:60,max:8},'/sign-up/email':{window:60,max:5}}}});
 return {db:env.HUT_DB,auth,baseURL};
}
export function privateJson(value:unknown,status=200){
 const response=NextResponse.json(value,{status});
 response.headers.set('Cache-Control','private, no-store, max-age=0');
 response.headers.set('Pragma','no-cache');response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
 return response;
}
export function failure(error:unknown){
 if(error instanceof HttpError)return privateJson({error:error.message},error.status);
 console.error('Hut account request failed.');return privateJson({error:'The account service is temporarily unavailable.'},503);
}
export async function authenticated(request:Request){
 const r=await resources();const session=await r.auth.api.getSession({headers:request.headers});
 if(!session)throw new HttpError(401,'Sign in to access your private plans.');
 return {...r,user:session.user};
}
export function checkOrigin(request:Request,baseURL:string){
 if(request.headers.get('origin')!==new URL(baseURL).origin){throw new HttpError(403,'Request origin is not allowed.');}
 const type=request.headers.get('content-type')||'';
 if(request.method!=='DELETE'&&!type.toLowerCase().startsWith('application/json'))throw new HttpError(415,'Use a JSON request.');
}
export async function boundedJson(request:{body:ReadableStream<Uint8Array>|null},max=4*1024*1024):Promise<unknown>{
 if(!request.body)throw new HttpError(400,'A JSON body is required.');
 const reader=request.body.getReader(),chunks:Uint8Array[]=[];let length=0;
 while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>max){await reader.cancel();throw new HttpError(413,'The file or plan is too large.');}chunks.push(value);}
 const bytes=new Uint8Array(length);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new HttpError(400,'Invalid JSON.');}
}
export async function tokenHash(token:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Buffer.from(b).toString('hex');}
