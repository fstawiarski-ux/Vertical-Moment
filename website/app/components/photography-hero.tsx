'use client';

import styles from '../photography-home.module.css';
import PhotographyLayered from './photography-layered';
import { heroScene } from '../data/layered-photos';

export default function PhotographyHero() {
  return (
    <section className={styles.hero} id="top">
      <div className={styles.heroLayer}>
        <PhotographyLayered scene={heroScene} variant="background" priority />
      </div>
      <div className={styles.heroVeil} />
      <div className={styles.heroTint} />
      <div className={styles.heroMark} aria-hidden="true" />
      <div className={styles.heroGrain} aria-hidden="true" />

      <div className={`${styles.heroIn} ${styles.wrap}`}>
        <div className={styles.heroCopy}>
          <p className={`${styles.eyebrow} ${styles.onDeep}`}>
            Vertical Moment — climbing &amp; outdoor photography · Vienna
          </p>
          <h1>
            The second <em>before</em> the move.
          </h1>
          <p className={styles.heroSub}>
            Limestone, low light, and the people who read it. Shot on the crags around Vienna, in the Wachau and across
            the Eastern Alps.
          </p>
          <div className={styles.heroFoot}>
            <a className={styles.cta} href="#work">
              See selected work <span aria-hidden="true">&rarr;</span>
            </a>
            <div className={styles.heroMeta}>
              <span>Est. 2020</span>
              <span>Crag · Expedition · Commercial</span>
              <span>Booking 2026</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
