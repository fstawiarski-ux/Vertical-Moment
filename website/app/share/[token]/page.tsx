import HutShell from '@/components/huts/HutShell';
import SharedTripPage from '@/components/huts/SharedTripPage';
import type {Metadata} from 'next';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Shared hut trip | Vertical Moment',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{token:string}>}){const {token}=await params;return <HutShell><SharedTripPage token={token}/></HutShell>;}
