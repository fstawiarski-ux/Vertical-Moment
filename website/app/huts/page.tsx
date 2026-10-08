import type {Metadata} from "next";
export const metadata:Metadata={alternates:{canonical:"/huts"}};
import HutLibrary from '@/components/huts/HutLibrary';
export default function Page(){return <HutLibrary/>;}
