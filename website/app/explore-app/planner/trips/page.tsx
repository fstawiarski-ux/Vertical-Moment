import HutShell from '@/components/huts/HutShell';
import TripWorkspace from '@/components/huts/TripWorkspace';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'My hut trips | Vertical Moment',robots:{index:false,follow:false},manifest:'/huts/manifest.webmanifest'};
export default function Page(){return <HutShell><TripWorkspace/></HutShell>;}
