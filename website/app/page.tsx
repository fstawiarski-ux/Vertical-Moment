/* eslint-disable @next/next/no-img-element */

import type { Metadata } from 'next';
import './photography-theme.css';
import styles from './photography-home.module.css';
import PhotographyNav from './components/photography-nav';
import PhotographyHero from './components/photography-hero';
import PhotographyGallery from './components/photography-gallery';
import PhotographyRail from './components/photography-rail';
import PhotographyReveal from './components/photography-reveal';
import PhotographyLayered from './components/photography-layered';
import PhotographyBackgroundCollage from './components/photography-background-collage';
import { spareScene } from './data/layered-photos';

export const metadata: Metadata = {
  title: 'Vertical Moment — Climbing photography, Vienna',
  description:
    'Climbing and outdoor photography from Vienna. Crag sessions, team days and commercial work, with the Vertical Moment Collective topo data underneath.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Vertical Moment — Climbing photography, Vienna',
    description: 'Climbing and outdoor photography from Vienna.',
    url: '/',
    type: 'website',
    siteName: 'Vertical Moment',
    images: ['/photography/banners/og-1200x630-sample.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vertical Moment — Climbing photography, Vienna',
    description: 'Climbing and outdoor photography from Vienna.',
    images: ['/photography/banners/og-1200x630-sample.webp'],
  },
};

const TICKER = [
  'Peilstein',
  'Helenental',
  'Glocknergrat',
  'Hohe Wand',
  'Mödlinger Klause',
  'Türkenloch',
  'Dürre Wand',
  'Wachau',
];

export default function Page() {
  return (
    <main className={styles.page}>
      <PhotographyBackgroundCollage />
      <PhotographyNav />
      <PhotographyRail />
      <PhotographyHero />

      <div className={styles.ticker} aria-hidden="true">
        <div className={styles.tickerRun}>
          {[...TICKER, ...TICKER].map((crag, i) => (
            <span key={`${crag}-${i}`}>
              <i>&#9670;</i>
              {crag}
            </span>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------ statement */}
      <section className={styles.statement}>
        <div className={`${styles.wrap} ${styles.statementGrid}`}>
          <PhotographyReveal>
            <p className={styles.eyebrow}>What I shoot</p>
            <h2>Climbing photography that keeps the effort in the frame — not just the summit.</h2>
            <p className={styles.lead}>
              Most climbing images arrive after the fact: the grin on the ledge, the rope coiled, the story already told.
              I work in the minutes before that — the reading of a sequence, the breath held on a bad foot, the hand that
              finds chalk in the dark.
            </p>
            <p>
              Documentary on the wall, editorial in the edit. Sessions run at your pace, on your project, with no staging
              and no re-climbs unless you want them. Everything here was shot on real attempts, at real grades, in the
              light the day gave us.
            </p>
          </PhotographyReveal>

          <PhotographyReveal>
            <figure className={styles.stack}>
              <div className={styles.stackTall}>
                <PhotographyLayered scene={spareScene} variant="background" />
              </div>
              <div className={styles.stackInset}>
                <img
                  src="/photography/statement/statement-tall.webp"
                  alt="Black and white frame of a climber on a steep limestone line"
                  width={900}
                  height={1350}
                  loading="lazy"
                />
              </div>
              <figcaption>Helenental · Ost face · 2025 — three depth planes, move the pointer</figcaption>
            </figure>
          </PhotographyReveal>
        </div>
      </section>

      {/* ---------------------------------------------------------- stats */}
      <div className={styles.nums}>
        <div className={`${styles.wrap} ${styles.numsGrid}`}>
          <div>
            <b>40+</b>
            <span>Crags photographed</span>
          </div>
          <div>
            <b>6</b>
            <span>Years on rope</span>
          </div>
          <div>
            <b>48h</b>
            <span>First edit turnaround</span>
          </div>
          <div>
            <b>2026</b>
            <span>Booking open</span>
          </div>
        </div>
      </div>

      <PhotographyGallery />

      {/* ----------------------------------------------------------- band */}
      <section className={styles.band}>
        <img
          src="/photography/banners/band-crag-1920x400.webp"
          alt=""
          width={1568}
          height={392}
          loading="lazy"
          aria-hidden="true"
        />
        <div className={styles.bandVeil} />
        <div className={styles.bandText}>
          <p className={styles.bandQuote}>
            Every crag has one hour when the rock gives the light back. I plan the day around it.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------- approach */}
      <section className={styles.approach} id="approach">
        <div className={styles.wrap}>
          <div className={styles.sechead}>
            <div>
              <p className={styles.eyebrow}>How a session runs</p>
              <h2>Three steps, no production circus</h2>
            </div>
            <div className={styles.side}>Half day · Full day · Multi-day</div>
          </div>
          <div className={styles.steps}>
            <PhotographyReveal className={styles.step}>
              <div className={styles.stepNum}>01</div>
              <h3>We pick the route and the hour</h3>
              <p>
                You tell me the project; I check the aspect, the season and where the sun leaves the face. Light decides
                the call time, not the calendar.
              </p>
            </PhotographyReveal>
            <PhotographyReveal className={styles.step}>
              <div className={styles.stepNum}>02</div>
              <h3>You climb, I move around you</h3>
              <p>
                Ground frames, top rope on a second line, detail work between burns. I stay out of your sequence — you
                never wait for the camera.
              </p>
            </PhotographyReveal>
            <PhotographyReveal className={styles.step}>
              <div className={styles.stepNum}>03</div>
              <h3>Edit, deliver, size for use</h3>
              <p>
                A first selection within 48 hours, full edit inside a week. Every frame web-ready, print-ready, and
                cropped for the formats you actually post.
              </p>
            </PhotographyReveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- services */}
      <section className={styles.services} id="services">
        <div className={styles.wrap}>
          <div className={styles.sechead}>
            <div>
              <p className={styles.eyebrow}>Work with me</p>
              <h2>Services</h2>
            </div>
            <div className={styles.side}>Vienna &amp; Lower Austria · travel on request</div>
          </div>
          <div className={styles.svc}>
            <PhotographyReveal className={styles.card}>
              <div className={styles.cardPhoto}>
                <img
                  src="/photography/services/session-half-day.webp"
                  alt="Climber topping out on a slab during a half-day session"
                  width={760}
                  height={760}
                  loading="lazy"
                />
              </div>
              <div className={styles.cardBody}>
                <p className={styles.eyebrow}>01 · Half day</p>
                <h3>Project session</h3>
                <p>Two to four hours on your route, at your pace, on the day the light works.</p>
                <ul>
                  <li>25 edited frames</li>
                  <li>Ground and on-rope angles</li>
                  <li>Web and print exports</li>
                  <li>Personal usage included</li>
                </ul>
                <p className={`${styles.price} ${styles.priceSoon}`}>Coming soon</p>
              </div>
            </PhotographyReveal>

            <PhotographyReveal className={styles.card}>
              <div className={styles.cardPhoto}>
                <img
                  src="/photography/services/session-full-day.webp"
                  alt="Climber clipping mid-route on a full crag day"
                  width={760}
                  height={760}
                  loading="lazy"
                />
              </div>
              <div className={styles.cardBody}>
                <p className={styles.eyebrow}>02 · Full day</p>
                <h3>Crag &amp; team day</h3>
                <p>A full day with a group, club or course. Everyone climbs, everyone gets frames.</p>
                <ul>
                  <li>60+ edited frames</li>
                  <li>Portraits of every climber</li>
                  <li>Sector overviews for topos</li>
                  <li>Shared gallery for the group</li>
                </ul>
                <p className={`${styles.price} ${styles.priceSoon}`}>Coming soon</p>
              </div>
            </PhotographyReveal>

            <PhotographyReveal className={styles.card}>
              <div className={styles.cardPhoto}>
                <img
                  src="/photography/services/session-commercial.webp"
                  alt="Climber looking up at a line, used for commercial and campaign work"
                  width={760}
                  height={760}
                  loading="lazy"
                />
              </div>
              <div className={styles.cardBody}>
                <p className={styles.eyebrow}>03 · Commercial</p>
                <h3>Brand &amp; campaign</h3>
                <p>Gear, apparel and tourism work, planned from a shot list agreed before we walk in.</p>
                <ul>
                  <li>Licensed usage, defined term</li>
                  <li>Art direction and casting</li>
                  <li>Banner, social and OG crops</li>
                  <li>Optional 3D topo assets</li>
                </ul>
                <p className={`${styles.price} ${styles.priceSoon}`}>Coming soon</p>
              </div>
            </PhotographyReveal>
          </div>
          <p className={styles.priceNote}>
            Full price list and package details go live shortly — write to me in the meantime and I&rsquo;ll quote your
            session directly. <a href="#contact">Send an enquiry →</a>
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- about */}
      <section className={styles.about} id="about">
        <div className={`${styles.wrap} ${styles.aboutGrid}`}>
          <PhotographyReveal>
            <figure className={styles.aboutPhoto}>
              <img
                src="/photography/about/portrait.webp"
                alt="Portrait of the photographer at the base of a route"
                width={900}
                height={1350}
                loading="lazy"
              />
            </figure>
          </PhotographyReveal>
          <PhotographyReveal>
            <p className={styles.eyebrow}>About</p>
            <h2>I climb the routes I photograph. That is the whole method.</h2>
            <p className={styles.lead}>
              Vertical Moment is the photography side of a longer project: mapping, documenting and photographing the
              climbing around Vienna. Being on the rock means I know where the light lands, where the crux is, and where
              to hang so the camera sees what the climber feels.
            </p>
            <p>
              I shoot handheld and on rope, mostly available light, sometimes a single strobe when the face goes flat.
              Nothing is staged for the camera — if a move looks hard in a frame, it was hard.
            </p>
            <div className={styles.kit}>
              <span>Available light</span>
              <span>On-rope work</span>
              <span>Fixed lines</span>
              <span>Full frame</span>
              <span>24 / 35 / 85</span>
              <span>Photogrammetry</span>
            </div>

            <div className={styles.founder}>
              <img
                src="/photography/about/founder-portrait.webp"
                alt="Filip Stawiarski, founder of Vertical Moment"
                width={720}
                height={720}
                loading="lazy"
              />
              <div>
                <p className={styles.eyebrow}>Founder · Vienna</p>
                <h3>Filip Stawiarski</h3>
                <p>
                  Alpinist and photographer, and the person behind the Collective database. Every crag in this archive
                  has been walked, climbed and mapped in person.
                </p>
                <p className={styles.founderNote}>
                  Before the camera: ten years of precision work — CNC machining for surgical instruments, then leading
                  an eight-person aerospace assembly team at Bombardier, then five years running customer care teams in
                  Vienna. It shows up in the way a shoot runs: rigging done properly, tolerances respected, safety not
                  improvised, and clients who always know what happens next. Sessions in Polish, English or German.
                </p>
                <div className={styles.founderLinks}>
                  <a href="mailto:f.stawiarski@gmail.com">f.stawiarski@gmail.com</a>
                  <a href="https://www.youtube.com/@RoadToSomewhereWithYou" target="_blank" rel="noreferrer noopener">
                    YouTube
                  </a>
                  <a href="https://www.twitch.tv/ineedbooz" target="_blank" rel="noreferrer noopener">
                    Twitch
                  </a>
                </div>
              </div>
            </div>
          </PhotographyReveal>
        </div>
      </section>

      <section className={styles.notes} style={{ paddingTop: 0 }}>
        <div className={styles.wrap}>
          <div className={styles.sechead}>
            <div>
              <p className={styles.eyebrow}>From the archive</p>
              <h2>Six years, one limestone belt</h2>
            </div>
            <div className={styles.side}>Earlier frames · 2020 — 2023</div>
          </div>
          <div className={styles.archive}>
            <figure>
              <img
                src="/photography/gallery/vm-6537-two-on-the-wall.webp"
                alt="Two climbers on a wall, early archive frame"
                width={1100}
                height={734}
                loading="lazy"
              />
              <figcaption>First season on rope</figcaption>
            </figure>
            <figure>
              <img
                src="/photography/gallery/vm-6424-face-from-the-approach.webp"
                alt="A crag seen from the approach path"
                width={1500}
                height={643}
                loading="lazy"
              />
              <figcaption>Mapping the approach</figcaption>
            </figure>
            <figure>
              <img
                src="/photography/gallery/vm-6768-gear-on-the-ledge.webp"
                alt="Climbing gear laid out on a ledge"
                width={1100}
                height={635}
                loading="lazy"
              />
              <figcaption>The kit, back then</figcaption>
            </figure>
            <figure>
              <img
                src="/photography/gallery/vm-6522-the-crack.webp"
                alt="A crack line in black and white"
                width={800}
                height={1198}
                loading="lazy"
              />
              <figcaption>The line that started it</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- field notes */}
      <section className={styles.notes}>
        <div className={styles.wrap}>
          <div className={styles.sechead}>
            <div>
              <p className={styles.eyebrow}>Field notes</p>
              <h2>From the last season</h2>
            </div>
            <div className={styles.side}>From the field</div>
          </div>
          <div className={styles.ngrid}>
            <PhotographyReveal className={styles.note}>
              <div className={styles.notePhoto}>
                <img
                  src="/photography/notes/note-north-face.webp"
                  alt="Climbers on a shaded north-facing wall"
                  width={820}
                  height={473}
                  loading="lazy"
                />
              </div>
              <div className={styles.noteBody}>
                <p className={styles.eyebrow}>June · Peilstein</p>
                <h3>Shooting a face that never gets sun</h3>
                <p>
                  North-facing limestone stays green and cold until midday. How to hold detail in the rock without
                  lifting the shadows into mush.
                </p>
              </div>
            </PhotographyReveal>

            <PhotographyReveal className={styles.note}>
              <div className={styles.notePhoto}>
                <img
                  src="/photography/notes/note-hands.webp"
                  alt="Close detail of hands on a wet limestone hold"
                  width={820}
                  height={473}
                  loading="lazy"
                />
              </div>
              <div className={styles.noteBody}>
                <p className={styles.eyebrow}>July · Helenental</p>
                <h3>Why the hands tell the story</h3>
                <p>
                  The face shows effort, but the hands show the grade. A short argument for more detail frames and fewer
                  wide summit shots.
                </p>
              </div>
            </PhotographyReveal>

            <PhotographyReveal className={styles.note}>
              <div className={styles.notePhoto}>
                <img
                  src="/photography/notes/note-photogrammetry.webp"
                  alt="Limestone texture used as a photogrammetry test surface"
                  width={820}
                  height={820}
                  loading="lazy"
                />
              </div>
              <div className={styles.noteBody}>
                <p className={styles.eyebrow}>September · Glocknergrat</p>
                <h3>From photographs to a 3D wall</h3>
                <p>
                  Forty frames of one face, run through photogrammetry, become a topo you can rotate. The first test from
                  the 3D Lab.
                </p>
              </div>
            </PhotographyReveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ faq */}
      <section className={styles.faq}>
        <div className={styles.wrap}>
          <div className={styles.sechead}>
            <div>
              <p className={styles.eyebrow}>Practical</p>
              <h2>Before you book</h2>
            </div>
            <div className={styles.side}>Ask anything else by mail</div>
          </div>
          <details open>
            <summary>Do I need to climb hard to be worth photographing?</summary>
            <p>
              No. Grade is not the subject — commitment is. A 4+ climbed with full attention photographs better than a 7a
              climbed casually.
            </p>
          </details>
          <details>
            <summary>What happens if the weather turns?</summary>
            <p>
              We move the date, no fee. Wet limestone is unsafe and photographs badly. I watch the forecast from 72 hours
              out and we decide together the evening before.
            </p>
          </details>
          <details>
            <summary>How do I get the files, and what can I do with them?</summary>
            <p>
              A private gallery link with full-resolution downloads plus web-sized and square crops. Personal and social
              use is included; commercial licensing is agreed separately.
            </p>
          </details>
          <details>
            <summary>Can you shoot indoors or at a competition?</summary>
            <p>
              Yes. Gyms and comps need a different setup — faster glass, higher ISO, and permission from the organiser.
              Ask early so I can clear access.
            </p>
          </details>
          <details>
            <summary>Do you photograph first ascents and rebolting work?</summary>
            <p>Gladly, and at a reduced rate if the frames can go into the open topo database with the route record.</p>
          </details>
        </div>
      </section>

      {/* -------------------------------------------------------- contact */}
      <section className={styles.contact} id="contact">
        <img
          className={styles.contactBg}
          src="/photography/contact/contact-bg.webp"
          alt=""
          width={1800}
          height={1038}
          loading="lazy"
          aria-hidden="true"
        />
        <div className={styles.contactVeil} />
        <div className={styles.contactIn}>
          <p className={`${styles.eyebrow} ${styles.onDeep}`}>Contact</p>
          <h2>Tell me about the route.</h2>
          <a className={styles.mail} href="mailto:f.stawiarski@gmail.com">
            f.stawiarski@gmail.com
          </a>
          <div className={styles.socials}>
            <a href="https://www.youtube.com/@RoadToSomewhereWithYou" rel="noreferrer noopener" target="_blank">
              YouTube
            </a>
            <a href="https://www.twitch.tv/ineedbooz" rel="noreferrer noopener" target="_blank">
              Twitch
            </a>
            <a href="/explore">Climbers Lounge</a>
            <span>Vienna, AT</span>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- footer */}
      <footer className={styles.foot}>
        <div className={styles.wrap}>
          <div className={styles.footGrid}>
            <div>
              <span className={styles.footMark} aria-hidden="true" />
              <p style={{ marginTop: 16, maxWidth: '34ch' }}>
                Climbing and outdoor photography from Vienna. The Collective builds the topo data underneath.
              </p>
            </div>
            <div>
              <h4>Site</h4>
              <ul>
                <li>
                  <a href="#work">Work</a>
                </li>
                <li>
                  <a href="#services">Services</a>
                </li>
                <li>
                  <a href="#about">About</a>
                </li>
                <li>
                  <a href="/prints/panoramas">Panorama editions</a>
                </li>
                <li>
                  <a href="#contact">Contact</a>
                </li>
              </ul>
            </div>
            <div>
              <h4>Elsewhere</h4>
              <ul>
                <li>
                  <a href="https://www.youtube.com/@RoadToSomewhereWithYou" rel="noreferrer noopener" target="_blank">
                    YouTube — Road To Somewhere With You
                  </a>
                </li>
                <li>
                  <a href="https://www.twitch.tv/ineedbooz" rel="noreferrer noopener" target="_blank">
                    Twitch
                  </a>
                </li>
                <li>
                  <a href="mailto:f.stawiarski@gmail.com">f.stawiarski@gmail.com</a>
                </li>
              </ul>
            </div>
            <div>
              <h4>Collective</h4>
              <ul>
                <li>
                  <a href="/explore">Climbers Lounge</a>
                </li>
              </ul>
            </div>
          </div>
          <div className={styles.footBar}>
            <span>© 2026 Vertical Moment · Vienna, AT</span>
            <span>Filip Stawiarski · Photography · Collective · 3D Lab</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
