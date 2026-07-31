"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function SiteNav({ who }: { who: string | null }) {
  const path = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    const t = next ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("vm-theme", t); } catch {}
  }

  const is = (p: string) => (p === "/" ? path === "/" : path.startsWith(p));

  return (
    <header className="site-head">
      <div className="wrap row">
        <Link href="/" className="brand">
          <span className="vm">V<span style={{ color: "var(--terra)" }}>M</span></span>
          <span>
            <span className="serif" style={{ fontWeight: 600, fontSize: 15 }}>VERTICAL MOMENT</span>
            <br />
            <span className="sub">Kletterreviere · Wien &amp; NÖ</span>
          </span>
        </Link>
        <nav className="nav">
          <Link href="/" className={is("/") ? "on" : ""}>Map</Link>
          <Link href="/explore" className={is("/explore") ? "on" : ""}>Explore</Link>
          <Link href="/contribute" className={is("/contribute") ? "on" : ""}>Contribute</Link>
        </nav>
        <div className="spacer" />
        {who && <span className="who">{who}</span>}
        <button className="iconbtn" onClick={toggle} aria-label="Toggle theme">{dark ? "Light" : "Dark"}</button>
      </div>
    </header>
  );
}
