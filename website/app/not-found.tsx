import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './not-found.module.css';

export const metadata: Metadata = {
  title: 'Off route — Vertical Moment',
  description: 'That page is not bolted yet, or it moved. Downclimb and pick another line.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.bar}>
        <span className={styles.mark} aria-hidden="true" />
        <Link href="/" className={styles.brand}>
          VERTICAL MOMENT
        </Link>
      </div>

      <div className={styles.main}>
        <div>
          <p className={styles.eyebrow}>404 · Nothing on this line</p>
          <h1 className={styles.title}>Off route.</h1>
          <p className={styles.sub}>
            The page you were heading for isn&rsquo;t bolted yet &mdash; or it moved. Downclimb and
            pick another line.
          </p>

          <div className={styles.links}>
            <Link href="/" className={styles.linkPrimary}>
              Back to the wall
            </Link>
            <Link href="/#work" className={styles.link}>
              Selected work
            </Link>
            <Link href="/explore" className={styles.link}>
              Explore crags
            </Link>
            <Link href="/#contact" className={styles.link}>
              Book a session
            </Link>
          </div>
        </div>

        <svg
          className={styles.art}
          viewBox="0 0 260 300"
          role="img"
          aria-label="Topo sketch of a route line that stops short of the top"
        >
          <path
            d="M20 292 L34 236 L26 190 L48 150 L40 104 L66 66 L58 30"
            fill="none"
            stroke="rgba(232,230,223,0.22)"
            strokeWidth="2"
          />
          <path
            d="M104 292 L120 240 L112 196 L136 158 L128 118"
            fill="none"
            stroke="#c9a227"
            strokeWidth="2.5"
          />
          <path
            d="M128 118 L146 92"
            fill="none"
            stroke="#c9a227"
            strokeWidth="2.5"
            strokeDasharray="5 7"
            opacity="0.55"
          />
          <circle cx="146" cy="92" r="7" fill="none" stroke="#c9a227" strokeWidth="2" />
          <path d="M141 87 L151 97 M151 87 L141 97" stroke="#c9a227" strokeWidth="1.8" />
          <g fill="rgba(232,230,223,0.55)">
            <circle cx="120" cy="240" r="3" />
            <circle cx="112" cy="196" r="3" />
            <circle cx="136" cy="158" r="3" />
          </g>
          <path
            d="M200 292 L214 234 L206 188 L228 148 L220 100 L244 58"
            fill="none"
            stroke="rgba(232,230,223,0.22)"
            strokeWidth="2"
          />
          <path d="M8 292 L252 292" stroke="rgba(232,230,223,0.3)" strokeWidth="1.5" />
        </svg>
      </div>

      <div className={styles.foot}>
        Lost something that used to be here?{' '}
        <a href="mailto:f.stawiarski@gmail.com">Write to me</a> and I&rsquo;ll find it.
      </div>
    </main>
  );
}
