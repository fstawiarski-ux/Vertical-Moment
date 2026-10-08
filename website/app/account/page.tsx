import HutShell from '@/components/huts/HutShell';
import AccountPage from '@/components/huts/AccountPage';
import {getCloudflareContext} from '@opennextjs/cloudflare';
import {canRegisterLocally} from '@/lib/huts/account-mode';
import type {Metadata} from 'next';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'My account | Vertical Moment',robots:{index:false,follow:false}};
export default async function Page(){
 let registrationEnabled=false;
 try {const {env}=await getCloudflareContext({async:true});registrationEnabled=canRegisterLocally(env.BETTER_AUTH_URL||'https://verticalmoment.com');} catch {}
 return <HutShell><AccountPage registrationEnabled={registrationEnabled}/></HutShell>;
}
