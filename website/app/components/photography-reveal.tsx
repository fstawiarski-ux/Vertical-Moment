'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from '../photography-home.module.css';

interface RevealProps {
  children: ReactNode;
  className?: string;
}

/** Fades and lifts its children into view once, on first intersection. */
export default function PhotographyReveal({ children, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={[styles.rv, shown ? styles.rvIn : '', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
