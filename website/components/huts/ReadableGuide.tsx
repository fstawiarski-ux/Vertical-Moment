"use client";
import {useEffect, useState, type ReactNode} from 'react';
import {text, type HutDetail} from '@/lib/huts/types';
import {Facts, OutLink, RefLinks} from './research';
import {useWorkspace} from './WorkspaceProvider';
import fields from '@/lib/huts/generated/shoot-fields.json';

export function GuideSection({pilot, id, title, preview, children}: {
 pilot: boolean; id: string; title: string; preview: string; children: ReactNode;
}) {
 return <section id={id} className="hut-section" tabIndex={pilot ? -1 : undefined}>
  {pilot ? <details data-hut-disclosure className="hut-research-section">
   <summary><h2>{title}</h2><span className="hut-disclosure-preview">{preview}</span></summary>
   <div className="hut-disclosure-body">{children}</div>
  </details> : <><h2>{title}</h2>{children}</>}
 </section>;
}

export function GuideIntro({detail}: {detail: HutDetail}) {
 const h = detail.record, story = text(h.hut_story);
 const introduction = story.includes('. ') ? story.slice(0, story.indexOf('. ') + 1) : story;
 return <>
  <p className="hut-kicker"><a href="/huts">All 630 huts</a> · Original list No. {h.number} · Directory ID {h.id}</p>
  <h1>{h.name}</h1>
  <p className="hut-identity">{text(h.base?.region || h.region)} · {text(h.base?.mountain_group || h.mountain_group)} · {text(h.base?.elevation_m ?? h.elevation_m)} m · {text(h.status)}</p>
  <p className="hut-lead">{introduction} <a href="#section=history">Story &amp; evidence</a></p>
 </>;
}

export function GuideEssentials({detail}: {detail: HutDetail}) {
 const h = detail.record;
 return <>
  <Facts items={[
   ['Summer operation', h.summer],
   ['Winter operation', h.winter],
   ['Published approach', h.approach_details || h.approach_summary]
  ]}/>
  <p className="hut-meta">Visitor sources checked {text(h.checked)} · <RefLinks value={h.visitor_source_refs || h.sources} sources={detail.sources}/></p>
  <p><strong>Parking:</strong> {text(h.parking)} <a href="#section=access">All approaches &amp; travel details</a></p>
  <p><strong>Booking:</strong> {text(h.booking || 'Booking portal not established; contact operator')}</p>
  <div className="hut-contact-links">
   <OutLink url={h.website}>Official visit &amp; booking information</OutLink>
   <a href="#section=sources">Phone, email &amp; checked sources</a>
  </div>
 </>;
}

export function ShootSummary({detail}: {detail: HutDetail}) {
 const {workspace} = useWorkspace();
 const plan = workspace.plans[detail.record.id] || {};
 const recorded = fields.filter(f => plan[f.key] && plan[f.key] !== f.default).length;
 return <section className="hut-shoot-summary hut-no-print" aria-labelledby="shoot-summary-title">
  <h2 id="shoot-summary-title">My shoot plan</h2>
  <p>Saved in this browser · {recorded ? recorded + ' planning fields recorded' : 'No planning fields recorded yet'}</p>
  <Facts items={[
   ['Shoot date', plan.shoot_date || 'Not chosen'],
   ['Photography status', plan.photos_taken || 'Not recorded'],
   ['Drone permission record', plan.drone_permission || 'Not checked']
  ]}/>
  <a className="hut-button" href="#section=documentary">Open my shoot plan</a>
 </section>;
}

// Keep the existing section and source links usable when research is folded.
// View changes stay on the already downloadable hut route.
export function useReadableGuideView(pilot: boolean, ready: boolean) {
 const [shootView, setShootView] = useState(false);
 useEffect(() => {
  if (!ready) return;
  function reveal(focus: boolean) {
   const hash = location.hash.slice(1);
   const section = new URLSearchParams(hash).get('section');
   let targetId = section || '';
   if (!targetId) {
    try { targetId = decodeURIComponent(hash); } catch { return; }
   }
   setShootView(pilot && targetId === 'documentary');
   requestAnimationFrame(() => requestAnimationFrame(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    let ancestor: HTMLElement | null = target;
    while (ancestor) {
     if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
     ancestor = ancestor.parentElement;
    }
    target.querySelector<HTMLDetailsElement>('details[data-hut-disclosure]')?.setAttribute('open', '');
    target.scrollIntoView({block: 'start'});
    if (focus) {
     target.setAttribute('tabindex', '-1');
     target.focus({preventScroll: true});
    }
   }));
  }
  reveal(false);
  const navigate = () => reveal(true);
  window.addEventListener('hashchange', navigate);
  return () => window.removeEventListener('hashchange', navigate);
 }, [pilot, ready]);

 useEffect(() => {
  if (!pilot || !ready) return;
  let closed: HTMLDetailsElement[] = [];
  const before = () => {
   closed = Array.from(document.querySelectorAll<HTMLDetailsElement>('.hut-pilot details[data-hut-disclosure], .hut-pilot details[data-shoot-group]')).filter(d => !d.open);
   closed.forEach(d => { d.open = true; });
  };
  const after = () => { closed.forEach(d => { d.open = false; }); closed = []; };
  window.addEventListener('beforeprint', before);
  window.addEventListener('afterprint', after);
  return () => {
   window.removeEventListener('beforeprint', before);
   window.removeEventListener('afterprint', after);
  };
 }, [pilot, ready]);
 return shootView;
}

export function ResearchControls() {
 function expand(open: boolean) {
  document.querySelectorAll<HTMLDetailsElement>('.hut-pilot .hut-guide-content .hut-section details').forEach(d => { d.open = open; });
 }
 return <div id="research" className="hut-research-heading" tabIndex={-1}>
  <div><h2>Visit details &amp; research</h2><p>Open a section when you need it. All reviewed records remain available.</p></div>
  <div className="hut-actions hut-no-print">
   <button className="secondary" onClick={() => expand(true)}>Expand all research</button>
   <button className="secondary" onClick={() => expand(false)}>Collapse research</button>
  </div>
 </div>;
}
