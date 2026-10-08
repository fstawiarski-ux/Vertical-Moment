import HutShell from '@/components/huts/HutShell';
import LifeList from '@/components/huts/LifeList';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'My photography life list | Vertical Moment',robots:{index:false,follow:false},manifest:'/huts/manifest.webmanifest'};
export default function Page(){return <HutShell><LifeList/></HutShell>;}
