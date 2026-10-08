import HutShell from '@/components/huts/HutShell';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'630-hut library | Vertical Moment',description:'Reviewed Alpenverein hut stories, approaches, visitor information and a private photography trip planner.',robots:{index:true,follow:true},manifest:'/huts/manifest.webmanifest'};
export default function Layout({children}:{children:React.ReactNode}){return <HutShell>{children}</HutShell>;}
