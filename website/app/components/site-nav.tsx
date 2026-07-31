"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function SiteNav({ who: _who }: { who?: string | null }) {
  const path = usePathname();
  const [dark, setDark] = useState(false);
  const [railVisible, setRailVisible] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < lastY - 8 || y < 24) setRailVisible(true);
      else if (y > lastY + 8) setRailVisible(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
      <div className="wrap row desktop-nav">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="serif" style={{ fontWeight: 600, fontSize: 15 }}>VERTICAL MOMENT COLLECTIVE</span>
        </Link>
        <nav className="nav">
          <Link href="/" className={is("/") ? "on" : ""}>Home</Link>
          <Link href="/contribute" className={is("/contribute") ? "on" : ""}>Contribute</Link>
        </nav>
        <div className="spacer" />
        <button className="iconbtn" onClick={toggle} aria-label="Toggle theme">{dark ? "Light" : "Dark"}</button>
      </div>
      <nav className={`mobile-rail ${railVisible ? "show" : ""}`} aria-label="Main navigation">
        <Link href="/" className={is("/") ? "on rail-icon" : "rail-icon"} aria-label="Home">⌂</Link>
        <Link href="/contribute" className={is("/contribute") ? "on rail-icon" : "rail-icon"} aria-label="Contribute">+</Link>
        <button className="rail-theme rail-icon" onClick={toggle} aria-label="Toggle theme">{dark ? "☀" : "☾"}</button>
      </nav>
    </header>
  );
}
