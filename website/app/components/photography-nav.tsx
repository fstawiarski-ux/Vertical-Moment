"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../photography-home.module.css";

export function PhotographyNav() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={`${styles.photoNav} ${solid || open ? styles.photoNavSolid : ""}`}>
      <a className={styles.photoBrand} href="#top" onClick={close} aria-label="Vertical Moment home">
        <span className={styles.photoBrandMark} aria-hidden="true" />
        <span>Vertical Moment</span>
      </a>
      <nav className={styles.desktopPhotoLinks} aria-label="Photography navigation">
        <a href="#work">Work</a>
        <a href="#services">Services</a>
        <a href="#about">About</a>
        <a href="#lab">3D Lab</a>
        <a href="#contact">Contact</a>
      </nav>
      <Link className={styles.explorePill} href="/explore">Explore climbing</Link>
      <button
        className={`${styles.menuButton} ${open ? styles.menuButtonOpen : ""}`}
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls="photo-menu"
        aria-label={open ? "Close navigation" : "Open navigation"}
      >
        <span /><span />
      </button>
      <div id="photo-menu" className={`${styles.mobileMenu} ${open ? styles.mobileMenuOpen : ""}`}>
        <nav aria-label="Mobile photography navigation">
          <a href="#work" onClick={close}>Work</a>
          <a href="#services" onClick={close}>Services</a>
          <a href="#about" onClick={close}>About</a>
          <a href="#lab" onClick={close}>3D Lab</a>
          <a href="#contact" onClick={close}>Contact</a>
          <Link href="/explore" onClick={close}>Explore climbing ↗</Link>
        </nav>
      </div>
    </header>
  );
}
