import Image from "next/image";

import { PhotographyGallery } from "./components/photography-gallery";
import { PhotographyNav } from "./components/photography-nav";
import styles from "./photography-home.module.css";

const selectedWork = [
  {
    src: "/retusz/bw-climber.jpg",
    alt: "Climber photographed on the wall in a high-contrast black and white frame",
    label: "Movement",
    title: "On the wall",
  },
  {
    src: "/retusz/bw-portrait.jpg",
    alt: "Black and white outdoor climbing portrait",
    label: "Portrait",
    title: "Between attempts",
  },
  {
    src: "/retusz/color-wall.jpg",
    alt: "Colour climbing photograph showing the wall and surrounding environment",
    label: "Environment",
    title: "The place matters",
  },
];

export default function Home() {
  return (
    <>
      <PhotographyNav />
      <main className={styles.home}>
        <section className={styles.hero} id="top" aria-labelledby="home-title">
          <Image
            src="/retusz/bw-climber.jpg"
            alt="Climbing photography by Vertical Moment"
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
          />
          <div className={styles.heroShade} />
          <div className={styles.heroGrain} aria-hidden="true" />
          <div className={styles.heroInner}>
            <p className={styles.kicker}>Climbing photography · Vienna / Alps</p>
            <h1 id="home-title">Photography from where the movement happens.</h1>
            <p className={styles.heroCopy}>
              Vertical Moment documents climbing from the wall, the rope and the landscape around it — with a visual language built for athletes, outdoor brands and climbing culture.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryButton} href="#work">View selected work</a>
              <a className={styles.secondaryButton} href="#contact">Start a project</a>
            </div>
          </div>
          <a className={styles.scrollCue} href="#work" aria-label="Scroll to selected work">
            <span>Selected work</span><i aria-hidden="true" />
          </a>
        </section>

        <section className={styles.intro} aria-labelledby="intro-title">
          <div className={styles.shell}>
            <div className={styles.introGrid}>
              <p className={styles.sectionIndex}>01 / Photography</p>
              <div>
                <h2 id="intro-title">Climbing is more than the crux.</h2>
                <p>
                  The approach, preparation, texture of the rock, concentration before a move and the scale of the place all belong to the same story. The portfolio is built around those moments rather than generic outdoor imagery.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.work} id="work" aria-labelledby="work-title">
          <div className={styles.shell}>
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.sectionIndex}>02 / Selected work</p>
                <h2 id="work-title">A first edit.</h2>
              </div>
              <p className={styles.sectionNote}>Launch selection — expandable without changing the page architecture.</p>
            </div>
            <PhotographyGallery items={selectedWork} />
          </div>
        </section>

        <section className={styles.services} id="services" aria-labelledby="services-title">
          <div className={styles.shell}>
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.sectionIndex}>03 / Work together</p>
                <h2 id="services-title">Built around climbing.</h2>
              </div>
            </div>
            <div className={styles.serviceGrid}>
              <article>
                <span>01</span>
                <h3>Climbers</h3>
                <p>Outdoor sessions, movement, portraits and personal climbing stories captured without turning the day into a studio production.</p>
              </article>
              <article>
                <span>02</span>
                <h3>Brands & events</h3>
                <p>Campaign-ready action, product context and event coverage with a visual system that can continue into web and social assets.</p>
              </article>
              <article>
                <span>03</span>
                <h3>Visual technology</h3>
                <p>Drone imagery, photogrammetry and interactive 3D experiments that connect photography with the wider Vertical Moment platform.</p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.about} id="about" aria-labelledby="about-title">
          <div className={styles.aboutImageWrap}>
            <Image
              src="/retusz/bw-portrait.jpg"
              alt="Vertical Moment climbing portrait"
              fill
              sizes="(max-width: 840px) 100vw, 48vw"
              className={styles.aboutImage}
            />
          </div>
          <div className={styles.aboutCopy}>
            <p className={styles.sectionIndex}>04 / Vertical Moment</p>
            <h2 id="about-title">Close enough to understand the move.</h2>
            <p>
              Vertical Moment is a climbing photography and visual-technology project. The camera work and the digital climbing project share the same principle: understand the wall first, then decide how to show it.
            </p>
            <p>
              The public site starts with photography. The mapping, 3D walls and contributor tools remain available as a developing lab behind it.
            </p>
          </div>
        </section>

        <section className={styles.lab} id="lab" aria-labelledby="lab-title">
          <div className={styles.labBackdrop} aria-hidden="true">
            <span className={styles.labMark} />
          </div>
          <div className={styles.shell}>
            <div className={styles.labContent}>
              <p className={styles.sectionIndex}>05 / 3D Lab</p>
              <h2 id="lab-title">The wall becomes an interface.</h2>
              <p>
                Behind the portfolio is an experimental climbing platform using 3D scans, route data and field documentation. It stays a distinct product layer so the photography experience remains clear and focused.
              </p>
          
            </div>
          </div>
        </section>

        <section className={styles.contact} id="contact" aria-labelledby="contact-title">
          <div className={styles.shell}>
            <p className={styles.sectionIndex}>06 / Contact</p>
            <div className={styles.contactGrid}>
              <h2 id="contact-title">Have a climbing day, campaign or visual project in mind?</h2>
              <div>
                <p>Photography sessions · outdoor brands · events · collaborations · 3D visual projects.</p>
                <p className={styles.contactGate}>
                  Contact email and social links are the final launch gate. They should be connected only after you confirm the exact public addresses.
                </p>
                <a className={styles.primaryButton} href="#top">Back to top</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.shell}>
          <div className={styles.footerRow}>
            <div className={styles.footerBrand}><span className={styles.footerMark} aria-hidden="true" />VERTICAL MOMENT</div>
            <p>Climbing photography · visual technology</p>
            <p>© {new Date().getFullYear()} Vertical Moment</p>
          </div>
        </div>
      </footer>
    </>
  );
}
