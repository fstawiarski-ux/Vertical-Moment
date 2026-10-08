"use client";
import {useEffect,useState} from 'react';
import HutShell from '@/components/huts/HutShell';
import styles from './planner.module.css';
function Frame(){
 const [shareUrl,setShareUrl]=useState('https://verticalmoment.com/explore-app/planner'),[src,setSrc]=useState('/explore-app/planner-content.html'),[message,setMessage]=useState('');
 useEffect(()=>{setShareUrl(new URL('/explore-app/planner',location.origin).href);if(location.hash)setSrc('/explore-app/planner-content.html'+location.hash);},[]);
 async function copyLink(){try{await navigator.clipboard.writeText(shareUrl);setMessage('Planner address copied. Personal entries are excluded.');}catch{setMessage('Select the address above to copy it.');}}
 return <section className={styles.page}><header className={styles.header}><label className={styles.share}><span>Planner address</span><input aria-label="Planner share link" value={shareUrl} readOnly onFocus={e=>e.currentTarget.select()}/></label><button onClick={()=>void copyLink()}>Copy address</button><p className={styles.status}>{message||'Climbing entries stay in this browser. Copying the address shares the tool, without your personal entries. Hut trips are available from My hut trips above.'}</p></header><iframe className={styles.frame} src={src} title="Climbing calendar, photography and climber outreach planner"/></section>;
}
export default function PlannerFrame(){return <HutShell><Frame/></HutShell>;}
