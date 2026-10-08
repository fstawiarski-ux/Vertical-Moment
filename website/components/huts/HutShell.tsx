"use client";
import {type ReactNode} from 'react';
import {ServiceWorkerRegistration} from '@/src/pwa/sw-registration';
import {WorkspaceProvider,useWorkspace} from './WorkspaceProvider';
import './huts.css';
function Frame({children}:{children:ReactNode}){
 const {status}=useWorkspace();
 return <div className="hut-app"><a className="hut-skip" href="#hut-main">Skip to content</a><header className="hut-header"><a href="/" className="hut-brand">VERTICAL MOMENT<span>Hut library & field planner</span></a><nav aria-label="Hut and trip navigation"><a href="/huts">630 huts</a><a href="/huts/sources">Sources</a><a href="/explore-app/planner/list">My life list</a><a href="/explore-app/planner/trips">My hut trips</a><a href="/explore-app/planner">Climbing planner</a></nav></header><div className="hut-sync" aria-live="polite"><span>{status}</span></div><main id="hut-main" className="hut-main">{children}</main><footer className="hut-footer"><p>Reviewed hut research: 8 October 2026 · Original list numbers and directory IDs retained.</p><p>Check current opening, route and weather conditions with the official operator before travelling. Your plans and notes stay in this browser. Export a backup to keep a separate copy.</p><a href="/huts">Hut library</a> · <a href="/explore-app">Climbers Lounge</a></footer><ServiceWorkerRegistration/></div>;
}
export default function HutShell({children}:{children:ReactNode}){
 return <WorkspaceProvider><Frame>{children}</Frame></WorkspaceProvider>;
}
