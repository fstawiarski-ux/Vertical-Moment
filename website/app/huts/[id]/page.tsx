import {notFound} from 'next/navigation';
import identities from '@/lib/huts/generated/identities.json';
import HutPage from '@/components/huts/HutPage';
import type {Metadata} from 'next';
export function generateStaticParams(){return identities.map(h=>({id:h.id}));}
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{const {id}=await params;const h=identities.find(h=>h.id===id);return {alternates:{canonical:'/huts/'+id},title:h?h.name+' · Hut '+h.number+' | Vertical Moment':'Hut not found',description:h?'Reviewed story, official sources, visitor information and photography planning for '+h.name+'.':undefined};}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!identities.some(h=>h.id===id))notFound();return <HutPage id={id}/>;}
