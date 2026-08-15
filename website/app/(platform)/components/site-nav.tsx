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
          <Link href="/" className={is("/") ? "on" : ""} aria-current={is("/") ? "page" : undefined}>Home</Link>
          <Link href="/contribute" className={is("/contribute") ? "on" : ""} aria-current={is("/contribute") ? "page" : undefined}>Contribute</Link>
        </nav>
        <div className="spacer" />
        <button
          className="iconbtn theme-mode"
          onClick={toggle}
          aria-label={`Current theme: ${dark ? "dark" : "light"}. Switch to ${dark ? "light" : "dark"} mode`}
          aria-pressed={dark}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="theme-state" aria-hidden="true">{dark ? "D" : "L"}</span>
          {dark ? "Dark" : "Light"}
        </button>
      </div>
      <nav className={`mobile-rail ${railVisible ? "show" : ""}`} aria-label="Main navigation">
        <Link href="/" className={is("/") ? "on rail-icon" : "rail-icon"} aria-label="Home" aria-current={is("/") ? "page" : undefined}>⌂</Link>
        <button
          className="rail-theme rail-icon"
          onClick={toggle}
          aria-label={`Current theme: ${dark ? "dark" : "light"}. Switch to ${dark ? "light" : "dark"} mode`}
          aria-pressed={dark}
          title={dark ? "Dark theme; switch to light" : "Light theme; switch to dark"}
        >
          {dark ? "D" : "L"}
        </button>
      </nav>
    </header>
  );
}
