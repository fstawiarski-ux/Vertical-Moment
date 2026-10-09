"use client";
import {useEffect,useMemo,useState} from 'react';
import {type HutIndex} from '@/lib/huts/types';
import {useWorkspace} from './WorkspaceProvider';
import {useResearch} from './research';

const normal=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const initial={q:'',region:'',range:'',service:'',min:'',max:'',notice:false,history:false,prices:false,diet:false,anniversary:false,saved:false,ids:''};
type Filters=typeof initial;
const checks=[
 ['notice','Operating / access notice'],
 ['history','Original opening recorded'],
 ['prices','Published numeric tariffs'],
 ['diet','Dietary information recorded'],
 ['anniversary','2026–2030 anniversary candidate'],
] as const;
const filterNames:Record<keyof Filters,string>={q:'Search',region:'Region',range:'Mountain range',service:'Service',min:'Minimum elevation',max:'Maximum elevation',notice:checks[0][1],history:checks[1][1],prices:checks[2][1],diet:checks[3][1],anniversary:checks[4][1],saved:'My saved huts',ids:'Shared selection'};

export default function HutLibrary(){
 const {data,error}=useResearch<HutIndex[]>('/huts-data/v1/index.json');
 const {workspace,ready,change}=useWorkspace();
 const [filters,setFilters]=useState(initial),[page,setPage]=useState(1);
 const [view,setView]=useState<'stories'|'compact'>('stories');
 const [initialized,setInitialized]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{
  const p=new URLSearchParams(location.search),f={...initial};
  for(const key of Object.keys(f) as Array<keyof Filters>){
   const value=p.get(key)||'';
   if(typeof initial[key]==='boolean')Object.assign(f,{[key]:value==='1'});
   else Object.assign(f,{[key]:value});
  }
  setFilters(f);setView(p.get('mode')==='compact'?'compact':'stories');setInitialized(true);
  const legacy=new URLSearchParams(location.hash.slice(1)),id=legacy.get('hut');
  if(id&&/^[a-zA-Z0-9-]+$/.test(id))location.replace('/huts/'+encodeURIComponent(id)+(legacy.get('section')?'#section='+encodeURIComponent(legacy.get('section')!):''));
 },[]);
 useEffect(()=>{setPage(1);},[filters]);
 useEffect(()=>{
  if(!initialized)return;
  const p=new URLSearchParams();
  for(const[k,v]of Object.entries(filters))if(v)p.set(k,typeof v==='boolean'?'1':v);
  if(view==='compact')p.set('mode','compact');
  history.replaceState(null,'','/huts'+(p.size?'?'+p:''));
 },[filters,view,initialized]);
 const options=(key:keyof HutIndex)=>[...new Set((data||[]).map(h=>String(h[key]||'')))].filter(Boolean).sort();
 const visible=useMemo(()=>{
  const q=normal(filters.q),chosen=new Set(filters.ids.split(',').filter(Boolean));
  return (data||[]).filter(h=>
   (!q||normal([h.name,h.region,h.mountain_group,h.id,String(h.number),h.story].join(' ')).includes(q))&&
   (!filters.region||h.region===filters.region)&&(!filters.range||h.mountain_group===filters.range)&&
   (!filters.service||h.service===filters.service)&&
   (!filters.min||h.elevation_m!==null&&h.elevation_m>=Number(filters.min))&&
   (!filters.max||h.elevation_m!==null&&h.elevation_m<=Number(filters.max))&&
   (!filters.notice||h.has_notice)&&(!filters.history||h.opening_year!==null)&&
   (!filters.prices||h.has_prices)&&(!filters.diet||h.has_diet)&&
   (!filters.anniversary||!h.anniversary_hooks.startsWith('No qualified'))&&
   (!filters.saved||workspace.bookmarks.includes(h.id))&&(!chosen.size||chosen.has(h.id)));
 },[data,filters,workspace.bookmarks]);
 const activeFilters=(Object.keys(initial) as Array<keyof Filters>).filter(key=>Boolean(filters[key])).map(key=>{
  const value=filters[key];
  const label=key==='ids'?'Shared selection: '+new Set(filters.ids.split(',').filter(Boolean)).size+' hut IDs':
   typeof value==='boolean'?filterNames[key]:filterNames[key]+': '+value+(['min','max'].includes(key)?' m':'');
  return {key,label};
 });
 const moreActive=['range','min','max',...checks.map(([key])=>key)].filter(key=>Boolean(filters[key as keyof Filters])).length;
 const pageCount=Math.max(1,Math.ceil(visible.length/24)),currentPage=Math.min(page,pageCount);

 function set<K extends keyof Filters>(key:K,value:Filters[K]){setFilters(f=>({...f,[key]:value}));}
 function clear(){setFilters(initial);requestAnimationFrame(()=>document.getElementById('hut-library-search')?.focus());}
 function removeFilter(key:keyof Filters,index:number){
  set(key,initial[key]);
  requestAnimationFrame(()=>{
   const chips=document.querySelectorAll<HTMLButtonElement>('.hut-library .hut-filter-chip');
   (chips[Math.min(index,chips.length-1)]||document.getElementById('hut-library-search'))?.focus();
  });
 }
 async function share(selection=false){
  const u=new URL(location.href);
  if(selection){u.search='';u.searchParams.set('ids',workspace.bookmarks.join(','));}
  try{
   await navigator.clipboard.writeText(u.href);
   setMessage(selection?'Public hut selection link copied. It contains hut IDs only.':'Library filter link copied.');
  }catch{setMessage(u.href);}
 }
 function save(id:string){change(w=>{w.bookmarks=w.bookmarks.includes(id)?w.bookmarks.filter(saved=>saved!==id):[...w.bookmarks,id];});}

 return <section className="hut-library" aria-labelledby="hut-library-title">
  <p className="hut-kicker">Hut library · Vienna as a starting point</p>
  <h1 id="hut-library-title">630 huts. Stories worth walking for.</h1>
  <p className="hut-lead">Find a hut, save a shortlist, plan a shoot day.</p>
  <details className="hut-library-tools">
   <summary>Trips &amp; sharing</summary>
   <div className="hut-toolbar">
    <a className="hut-button" href="/explore-app/planner/trips">Open my hut trips</a>
    <button type="button" className="secondary" onClick={()=>void share()}>Share these filters</button>
    <button type="button" className="secondary" disabled={!ready||!workspace.bookmarks.length} onClick={()=>void share(true)}>Share saved hut selection</button>
   </div>
  </details>
  {message&&<p className="hut-library-message" role="status">{message}</p>}
  <div className="hut-filters">
   <label className="hut-search">Find a hut or story
    <input id="hut-library-search" type="search" placeholder="Name, place, list number or ID" value={filters.q} onChange={e=>set('q',e.target.value)}/>
   </label>
   <label>Region<select aria-label="Region" value={filters.region} onChange={e=>set('region',e.target.value)}>
    <option value="">All regions</option>{options('region').map(v=><option key={v}>{v}</option>)}
   </select></label>
   <label>Service<select aria-label="Service" value={filters.service} onChange={e=>set('service',e.target.value)}>
    <option value="">All service types</option>{options('service').map(v=><option key={v}>{v}</option>)}
   </select></label>
   <label className="hut-saved-filter"><input type="checkbox" checked={filters.saved} onChange={e=>set('saved',e.target.checked)}/>My saved huts</label>
   <details className="hut-more-filters">
    <summary>More filters{moreActive>0&&<span> · {moreActive} active</span>}</summary>
    <div className="hut-secondary-filters">
     <label>Mountain range<select aria-label="Mountain range" value={filters.range} onChange={e=>set('range',e.target.value)}>
      <option value="">All ranges</option>{options('mountain_group').map(v=><option key={v}>{v}</option>)}
     </select></label>
     <label>Minimum elevation (m)<input type="number" min="0" value={filters.min} onChange={e=>set('min',e.target.value)}/></label>
     <label>Maximum elevation (m)<input type="number" min="0" value={filters.max} onChange={e=>set('max',e.target.value)}/></label>
     <div className="hut-checks">{checks.map(([key,label])=><label key={key}>
      <input type="checkbox" checked={filters[key]} onChange={e=>set(key,e.target.checked)}/>{label}
     </label>)}</div>
    </div>
   </details>
  </div>
  {activeFilters.length>0&&<section className="hut-active-filters" aria-label="Active filters">
   <p className="hut-meta">{activeFilters.length} active {activeFilters.length===1?'filter':'filters'}</p>
   <div className="hut-filter-chips">{activeFilters.map((chip,index)=><button type="button" className="secondary hut-filter-chip" key={chip.key} aria-label={'Remove filter: '+chip.label} onClick={()=>removeFilter(chip.key,index)}>
    {chip.label}<span aria-hidden="true"> ×</span>
   </button>)}<button type="button" className="secondary" onClick={clear}>Clear all filters</button></div>
  </section>}
  {error&&<p className="hut-alert" role="alert">{error}</p>}
  {!data&&!error&&<p>Loading the reviewed library…</p>}
  {data&&<>
   <div className="hut-library-results-heading">
    <p className="hut-meta" role="status">{visible.length} of {data.length} huts · Page {currentPage} of {pageCount}</p>
    <div className="hut-view-toggle" role="group" aria-label="Library view">
     <button type="button" className="secondary" aria-pressed={view==='stories'} onClick={()=>setView('stories')}>Story cards</button>
     <button type="button" className="secondary" aria-pressed={view==='compact'} onClick={()=>setView('compact')}>Compact list</button>
    </div>
   </div>
   <div className={view==='compact'?'hut-compact-list':'hut-grid'}>
    {visible.slice((currentPage-1)*24,currentPage*24).map(h=>{
     const saved=workspace.bookmarks.includes(h.id);
     return <article className={view==='compact'?'hut-compact-row':'hut-card'} key={h.id}>
      <div className="hut-result-summary">
       <p className="hut-kicker">No. {h.number} · ID {h.id}</p>
       <h2><a href={'/huts/'+h.id}>{h.name}</a></h2>
       <p className="hut-meta">{h.region} · {h.mountain_group} · {h.elevation_m===null?'Elevation unconfirmed':h.elevation_m+' m'}</p>
       {view==='stories'&&<p className="hut-story">{h.story}</p>}
       <p><span className="hut-tag">{h.service}</span>{h.opening_year!==null&&<span className="hut-tag">Original opening {h.opening_year}</span>}</p>
       {h.has_notice&&<p className="hut-notice"><strong>Before you go</strong><br/>{h.notice_summary}</p>}
      </div>
      <div className="hut-actions">
       <a href={'/huts/'+h.id}>Hut details →</a>
       <button type="button" className="hut-small" disabled={!ready} aria-label={(saved?'Saved hut: ':'Save hut: ')+h.name} aria-pressed={saved} onClick={()=>save(h.id)}>{saved?'Saved ✓':'Save hut'}</button>
      </div>
     </article>;
    })}
   </div>
   {!visible.length&&<p className="hut-empty">No huts match these filters. Try clearing one filter.</p>}
   <div className="hut-actions">
    <button type="button" className="secondary" disabled={currentPage<=1} onClick={()=>{setPage(currentPage-1);window.scrollTo({top:0,behavior:'smooth'});}}>Previous page</button>
    <button type="button" disabled={currentPage*24>=visible.length} onClick={()=>{setPage(currentPage+1);window.scrollTo({top:0,behavior:'smooth'});}}>Next page</button>
   </div>
  </>}
 </section>;
}
