"use client";
import {useEffect,useMemo,useState} from 'react';
import {type ResearchRow} from '@/lib/huts/types';
import {useResearch,SourceRow} from './research';
export default function SourcesBrowser(){
 const {data,error}=useResearch<ResearchRow[]>('/huts-data/v1/sources.json'),[q,setQ]=useState(''),[kind,setKind]=useState(''),[page,setPage]=useState(1);
 useEffect(()=>{const p=new URLSearchParams(location.search);setQ(p.get('q')||'');},[]);
 const filtered=useMemo(()=>(data||[]).filter(s=>(!kind||s.kind===kind)&&(!q||[s.ref,s.title,s.id,s.name,s.use,s.url].join(' ').toLowerCase().includes(q.toLowerCase()))),[data,q,kind]);
 return <><p className="hut-kicker">Evidence and provenance</p><h1>Browse the checked sources</h1><p className="hut-lead">Every source retains its ID, evidence use, check date and hut or regional relationship. Historical secondary material is labelled. A checked page can change after the review date.</p><div className="hut-form"><label>Find a source ID, hut ID, name or evidence<input type="search" value={q} onChange={e=>{setQ(e.target.value);setPage(1);}}/></label><label>Source kind<select value={kind} onChange={e=>{setKind(e.target.value);setPage(1);}}><option value="">All kinds</option>{[...new Set((data||[]).map(s=>String(s.kind)))].sort().map(k=><option key={k}>{k}</option>)}</select></label></div>{error&&<p role="alert">{error}</p>}<p>{data?filtered.length+' checked source records':'Loading sources…'}</p>{filtered.slice((page-1)*30,page*30).map(s=><div className="hut-panel" key={String(s.ref)}><SourceRow source={s}/>{Boolean(s.id)&&<a href={'/huts/'+s.id}>Related hut: {String(s.name)} · ID {String(s.id)}</a>}</div>)}<div className="hut-actions"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</button><button disabled={page*30>=filtered.length} onClick={()=>setPage(p=>p+1)}>Next</button></div></>;
}
