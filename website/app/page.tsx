import type { Metadata } from 'next';
import './public-site-v5.css';

export const metadata: Metadata = {
  title: 'Vertical Moment — Climbing photography, Vienna',
  description:
    'Climbing and outdoor photography from Vienna: documentary crag sessions, team days and commercial work.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Vertical Moment — Climbing photography, Vienna',
    description: 'Climbing and outdoor photography from Vienna.',
    url: '/',
    type: 'website',
    siteName: 'Vertical Moment',
    images: ['/brand/official-v2/social/forest-og-1200x630.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vertical Moment — Climbing photography, Vienna',
    description: 'Climbing and outdoor photography from Vienna.',
    images: ['/brand/official-v2/social/forest-og-1200x630.png'],
  },
};

const publicSiteMarkup = String.raw`
  <a class="skip-link" href="#main">Skip to content</a>

  <header class="site-header" id="site-header">
    <a class="brand" href="#top" aria-label="Vertical Moment home">
      <span class="brand-mark" aria-hidden="true">VM</span>
      <span class="brand-copy">
        <strong>Vertical Moment</strong>
        <small>Climbing photography · Vienna</small>
      </span>
    </a>

    <nav class="desktop-nav" aria-label="Primary">
      <a href="#work">Work</a>
      <a href="#approach">Approach</a>
      <a href="#services">Services</a>
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
      <a class="nav-collective" href="/climbers-lounge">Climbers Lounge</a>
    </nav>

    <div class="header-actions">
      <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Switch to light mode" aria-pressed="false">
        <span class="theme-toggle-track" aria-hidden="true"><span class="theme-toggle-dot"></span></span>
        <span class="theme-label">Stone</span>
      </button>

      <button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu">
        <span class="sr-only">Open menu</span>
        <span></span><span></span>
      </button>
    </div>
  </header>

  <div class="mobile-menu" id="mobile-menu" aria-hidden="true">
    <nav aria-label="Mobile primary">
      <a href="#work"><span>01</span>Work</a>
      <a href="#approach"><span>02</span>Approach</a>
      <a href="#services"><span>03</span>Services</a>
      <a href="#about"><span>04</span>About</a>
      <a href="#contact"><span>05</span>Contact</a>
      <a href="/climbers-lounge"><span>→</span>Climbers Lounge</a>
    </nav>
  </div>

  <main id="main">
    <section class="hero" id="top" aria-labelledby="hero-title">
      <div class="hero-media parallax-layer" data-parallax="0.12">
        <img src="/photography/gallery/vm-6890-peilstein-main-face.webp"
             alt="Climber on a limestone wall at Peilstein">
      </div>
      <div class="hero-shade" aria-hidden="true"></div>

      <div class="hero-grid shell">
        <div class="hero-copy">
          <p class="eyebrow hero-kicker">Vertical Moment · climbing &amp; outdoor photography · Vienna</p>
          <h1 id="hero-title">The second <em>before</em> the move.</h1>
          <p class="hero-lead">Limestone, low light, and the people who read it. Shot on the crags around Vienna, in the Wachau and across the Eastern Alps.</p>
          <div class="hero-actions">
            <a class="button button-primary" href="#work">See selected work <span aria-hidden="true">↘</span></a>
            <a class="text-link" href="#contact">Book a session <span aria-hidden="true">→</span></a>
          </div>
        </div>

        <aside class="hero-index" aria-label="Photography profile">
          <div><span>Est.</span><strong>2020</strong></div>
          <div><span>Mode</span><strong>Documentary</strong></div>
          <div><span>Access</span><strong>On rope</strong></div>
          <div><span>Booking</span><strong>2026</strong></div>
        </aside>
      </div>

      <a class="scroll-cue" href="#approach" aria-label="Scroll to approach">
        <span>Scroll</span><i aria-hidden="true"></i>
      </a>
    </section>

    <div class="location-ticker" aria-label="Areas photographed">
      <div class="ticker-track">
        <span>Peilstein</span><span>Helenental</span><span>Glocknergrat</span><span>Hohe Wand</span><span>Wachau</span><span>Türkenloch</span>
        <span aria-hidden="true">Peilstein</span><span aria-hidden="true">Helenental</span><span aria-hidden="true">Glocknergrat</span><span aria-hidden="true">Hohe Wand</span><span aria-hidden="true">Wachau</span><span aria-hidden="true">Türkenloch</span>
      </div>
    </div>

    <section class="manifesto section" id="approach">
      <div class="shell manifesto-grid">
        <div class="section-heading reveal">
          <p class="eyebrow">What I shoot</p>
          <h2>Climbing photography that keeps the effort in the frame — not just the summit.</h2>
        </div>

        <div class="manifesto-copy reveal">
          <p>Most climbing images arrive after the fact: the grin on the ledge, the rope coiled, the story already told. I work in the minutes before that — the reading of a sequence, the breath held on a bad foot, the hand that finds chalk in the dark.</p>
          <p>Documentary on the wall, editorial in the edit. Sessions run at your pace, on your project, with no staging and no re-climbs unless you want them. Everything here was shot on real attempts, at real grades, in the light the day gave us.</p>
        </div>

        <figure class="manifesto-image reveal">
          <img src="/photography/gallery/vm-6965-topping-out.webp"
               alt="Climber topping out on limestone">
          <figcaption>Real attempts. Real light. No staging.</figcaption>
        </figure>
      </div>
    </section>

    <section class="stats-strip" aria-label="Vertical Moment statistics">
      <div class="shell stats-grid">
        <div class="stat reveal"><strong data-count="40" data-suffix="+">40+</strong><span>Crags photographed</span></div>
        <div class="stat reveal"><strong data-count="6">6</strong><span>Years on rope</span></div>
        <div class="stat reveal"><strong data-count="48" data-suffix="h">48h</strong><span>First edit turnaround</span></div>
        <div class="stat reveal"><strong data-count="2026">2026</strong><span>Booking open</span></div>
      </div>
    </section>

    <section class="portfolio section" id="work">
      <div class="shell">
        <div class="section-intro reveal">
          <div>
            <p class="eyebrow">Portfolio</p>
            <h2>Selected work</h2>
          </div>
          <p>Every frame is filed against the crag it was shot at — the same crag, wall and route records that sit in the Collective database.</p>
        </div>

        <div class="portfolio-grid" id="portfolio-grid">
          <button class="work-item work-item-a reveal" type="button"
                  data-src="/photography/gallery/vm-6890-peilstein-main-face.webp"
                  data-title="Peilstein · main face" data-meta="6b+ · Peilstein">
            <img src="/photography/gallery/vm-6890-peilstein-main-face.webp" alt="Climber on Peilstein main face">
            <span class="work-caption"><strong>Peilstein · main face</strong><small>6b+</small></span>
            <span class="work-number">01</span>
          </button>

          <button class="work-item work-item-b reveal" type="button"
                  data-src="/photography/gallery/vm-6242-portrait-after-the-send.webp"
                  data-title="Portrait after the send" data-meta="Portrait · Vienna limestone">
            <img src="/photography/gallery/vm-6242-portrait-after-the-send.webp" alt="Portrait after a climbing attempt">
            <span class="work-caption"><strong>Portrait after the send</strong><small>Portrait</small></span>
            <span class="work-number">02</span>
          </button>

          <button class="work-item work-item-c reveal" type="button"
                  data-src="/photography/gallery/vm-6965-topping-out.webp"
                  data-title="Topping out" data-meta="7a · limestone">
            <img src="/photography/gallery/vm-6965-topping-out.webp" alt="Climber topping out">
            <span class="work-caption"><strong>Topping out</strong><small>7a</small></span>
            <span class="work-number">03</span>
          </button>

          <button class="work-item work-item-d reveal" type="button"
                  data-src="/photography/gallery/vm-6913-traverse-morning-light.webp"
                  data-title="Traverse · morning light" data-meta="Glocknergrat">
            <img src="/photography/gallery/vm-6913-traverse-morning-light.webp" alt="Climber traversing in morning light">
            <span class="work-caption"><strong>Traverse · morning light</strong><small>Glocknergrat</small></span>
            <span class="work-number">04</span>
          </button>

          <button class="work-item work-item-e reveal" type="button"
                  data-src="/photography/gallery/vm-6437-the-hold-that-matters.webp"
                  data-title="The hold that matters" data-meta="Detail study">
            <img src="/photography/gallery/vm-6437-the-hold-that-matters.webp" alt="Climbing detail on limestone">
            <span class="work-caption"><strong>The hold that matters</strong><small>Detail</small></span>
            <span class="work-number">05</span>
          </button>
        </div>

        <div class="portfolio-footer reveal">
          <p>Documentary climbing photography · portraits · crag atmosphere · technical detail</p>
          <a class="button button-outline" href="#contact">Book a session <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>


    <section class="quote-section">
      <div class="quote-media parallax-layer" data-parallax="0.08">
        <img src="/photography/gallery/vm-6242-portrait-after-the-send.webp" alt="">
      </div>
      <div class="quote-overlay" aria-hidden="true"></div>
      <div class="quote-lockup reveal">
        <p class="eyebrow">The hour matters</p>
        <blockquote>“Every crag has one hour when the rock gives the light back. I plan the day around it.”</blockquote>
        <p class="quote-handoff">Keep scrolling — the page now moves sideways through the practical details.</p>
      </div>
    </section>

    <section class="story-section" id="story" aria-labelledby="story-title">
      <div class="story-sticky">

        <div class="panorama-ribbon" aria-label="Wachau panorama scroll-scrub">
          <div class="panorama-layer is-active" data-panorama="0" data-name="Wachau · long ridge">
            <img src="/photography/panoramas/wachau/wachau-09-preview.webp" alt="Wide Wachau panorama">
          </div>
          <div class="panorama-layer" data-panorama="1" data-name="Wachau · limestone horizon">
            <img src="/photography/panoramas/wachau/wachau-10-preview.webp" alt="Wide Wachau limestone panorama">
          </div>
          <div class="panorama-layer" data-panorama="2" data-name="Wachau · evening line">
            <img src="/photography/panoramas/wachau/wachau-12-preview.webp" alt="Wide Wachau evening panorama">
          </div>
          <div class="panorama-layer" data-panorama="3" data-name="Wachau · valley study">
            <img src="/photography/panoramas/wachau/wachau-14-preview.webp" alt="Wide Wachau valley panorama">
          </div>
          <div class="panorama-layer" data-panorama="4" data-name="Wachau · final horizon">
            <img src="/photography/panoramas/wachau/wachau-16-preview.webp" alt="Wide Wachau horizon panorama">
          </div>
          <div class="panorama-shade" aria-hidden="true"></div>
          <div class="panorama-caption shell">
            <div>
              <span class="panorama-kicker">Vertical Moment · Panorama Editions</span>
              <strong id="panorama-name">Wachau · long ridge</strong>
            </div>
            <a href="/prints/panoramas">View panorama editions ↗</a>
          </div>
          <div class="panorama-progress" aria-hidden="true"><span id="panorama-progress"></span></div>
        </div>

        <div class="story-body">
          <div class="story-bar shell">
            <div>
              <p class="eyebrow">Behind the photographs</p>
              <h2 id="story-title">Everything useful, without another five screens down.</h2>
            </div>
          </div>

          <div class="story-viewport" id="story-viewport" tabindex="0" aria-label="Photography information chapters. Use left and right arrow keys to navigate.">
            <div class="story-track" id="story-track">

              <article class="story-panel story-process" data-chapter="0" aria-labelledby="chapter-process">
                <div class="story-panel-inner shell">
                  <header class="chapter-heading">
                    <span class="chapter-number">01</span>
                    <div>
                      <p class="eyebrow">How a session runs</p>
                      <h3 id="chapter-process">Three steps, no production circus.</h3>
                    </div>
                  </header>
                  <div class="process-editorial">
                    <div>
                      <span>01</span>
                      <h4>Pick the route and the hour</h4>
                      <p>You tell me the project; I check the aspect, the season and where the sun leaves the face. Light decides the call time.</p>
                    </div>
                    <div>
                      <span>02</span>
                      <h4>You climb, I move</h4>
                      <p>Ground frames, a second line and detail work between burns. I stay out of your sequence — you never wait for the camera.</p>
                    </div>
                    <div>
                      <span>03</span>
                      <h4>Edit and deliver</h4>
                      <p>A first selection within 48 hours, then web-ready, print-ready and social crops sized for actual use.</p>
                    </div>
                  </div>
                  <p class="chapter-footnote">Half day · Full day · Multi-day</p>
                </div>
              </article>

              <article id="services" class="story-panel story-services" data-chapter="1" aria-labelledby="chapter-services">
                <div class="story-panel-inner shell">
                  <header class="chapter-heading">
                    <span class="chapter-number">02</span>
                    <div>
                      <p class="eyebrow">Work with me</p>
                      <h3 id="chapter-services">Services</h3>
                    </div>
                  </header>
                  <div class="services-editorial">
                    <div class="service-mini">
                      <figure><img src="/photography/gallery/vm-6965-topping-out.webp" alt="Climber topping out"></figure>
                      <span>Half day</span>
                      <h4>Project session</h4>
                      <p>Your route, your pace, ground and on-rope angles.</p>
                    </div>
                    <div class="service-mini">
                      <figure><img src="/photography/gallery/vm-6242-portrait-after-the-send.webp" alt="Climber portrait"></figure>
                      <span>Full day</span>
                      <h4>Crag &amp; team day</h4>
                      <p>Groups, clubs and courses with portraits and a shared gallery.</p>
                    </div>
                    <div class="service-mini">
                      <figure><img src="/photography/gallery/vm-6437-the-hold-that-matters.webp" alt="Climbing detail"></figure>
                      <span>Commercial</span>
                      <h4>Brand &amp; campaign</h4>
                      <p>Gear, apparel and tourism work with licensing defined before the shoot.</p>
                    </div>
                  </div>
                  <div class="chapter-cta-row">
                    <span>Package details remain provisional in this design preview.</span>
                    <a href="#contact">Ask for a quote →</a>
                  </div>
                </div>
              </article>

              <article id="about" class="story-panel story-about" data-chapter="2" aria-labelledby="chapter-about">
                <div class="story-panel-inner shell about-editorial">
                  <figure>
                    <img src="/photography/gallery/vm-6242-portrait-after-the-send.webp" alt="Climbing portrait">
                  </figure>
                  <div>
                    <header class="chapter-heading">
                      <span class="chapter-number">03</span>
                      <div>
                        <p class="eyebrow">About</p>
                        <h3 id="chapter-about">I climb the routes I photograph.</h3>
                      </div>
                    </header>
                    <p class="about-lead">That is the whole method.</p>
                    <p>Vertical Moment is the photography side of a longer project: mapping, documenting and photographing the climbing around Vienna. Being on the rock means I know where the light lands, where the crux is, and where to hang so the camera sees what the climber feels.</p>
                    <p>Nothing is staged for the camera — if a move looks hard in a frame, it was hard.</p>
                    <div class="about-inline-tags"><span>Available light</span><span>On-rope</span><span>Fixed lines</span><span>Photogrammetry</span></div>
                    <div class="founder-inline">
                      <span>Founder · Vienna</span>
                      <strong>Filip Stawiarski</strong>
                      <a href="mailto:f.stawiarski@gmail.com">Email ↗</a>
                    </div>
                  </div>
                </div>
              </article>

              <article class="story-panel story-notes" data-chapter="3" aria-labelledby="chapter-notes">
                <div class="story-panel-inner shell">
                  <header class="chapter-heading">
                    <span class="chapter-number">04</span>
                    <div>
                      <p class="eyebrow">Archive + field notes</p>
                      <h3 id="chapter-notes">Six years, one limestone belt.</h3>
                    </div>
                  </header>
                  <div class="notes-editorial">
                    <article><span>June · Peilstein</span><h4>Shooting a face that never gets sun</h4><p>Holding detail in cold north-facing limestone without lifting the shadows into mush.</p></article>
                    <article><span>July · Helenental</span><h4>Why the hands tell the story</h4><p>The face shows effort, but the hands show the grade. More detail frames, fewer generic summit shots.</p></article>
                    <article><span>September · Glocknergrat</span><h4>From photographs to a 3D wall</h4><p>Photogrammetry turns one face into a topo you can rotate — the bridge into the 3D Lab.</p></article>
                  </div>
                  <div class="archive-ribbon" aria-label="Archive frames">
                    <img src="/photography/gallery/vm-6913-traverse-morning-light.webp" alt="Morning traverse">
                    <img src="/photography/gallery/vm-6437-the-hold-that-matters.webp" alt="Limestone detail">
                    <img src="/photography/gallery/vm-6965-topping-out.webp" alt="Climber topping out">
                    <img src="/photography/gallery/vm-6890-peilstein-main-face.webp" alt="Peilstein main face">
                  </div>
                </div>
              </article>

              <article class="story-panel story-faq" data-chapter="4" aria-labelledby="chapter-faq">
                <div class="story-panel-inner shell faq-editorial">
                  <div>
                    <header class="chapter-heading">
                      <span class="chapter-number">05</span>
                      <div>
                        <p class="eyebrow">Practical</p>
                        <h3 id="chapter-faq">Before you book</h3>
                      </div>
                    </header>
                    <p class="faq-sidecopy">The useful questions live here instead of stretching the homepage downward.</p>
                    <a class="button button-outline" href="#contact">Tell me about your route →</a>
                  </div>
                  <div class="story-faq-list">
                    <details>
                      <summary>Do I need to climb hard to be worth photographing?</summary>
                      <p>No. Grade is not the subject — commitment is. A 4+ climbed with full attention can photograph better than a 7a climbed casually.</p>
                    </details>
                    <details>
                      <summary>What happens if the weather turns?</summary>
                      <p>We move the date, no fee. I watch the forecast from 72 hours out and we decide together the evening before.</p>
                    </details>
                    <details>
                      <summary>How do I get the files?</summary>
                      <p>A private gallery with full-resolution downloads plus web-sized and social crops. Commercial licensing is agreed separately.</p>
                    </details>
                    <details>
                      <summary>Can you shoot indoors or at a competition?</summary>
                      <p>Yes. Gyms and competitions need a different setup and permission from the organiser, so ask early.</p>
                    </details>
                    <details>
                      <summary>First ascents and rebolting work?</summary>
                      <p>Gladly, especially where the resulting frames can contribute to the open topo record.</p>
                    </details>
                  </div>
                </div>
              </article>

            </div>
          </div>


          <div class="story-controls shell" aria-label="Story navigation">
            <button class="story-arrow" id="story-prev" type="button" aria-label="Previous chapter">←</button>
            <div class="story-nav-cluster">
              <div class="story-tabs" role="tablist" aria-label="Information chapters">
                <button class="is-active" type="button" data-story-tab="0"><span>01</span>Process</button>
                <button type="button" data-story-tab="1"><span>02</span>Services</button>
                <button type="button" data-story-tab="2"><span>03</span>About</button>
                <button type="button" data-story-tab="3"><span>04</span>Notes</button>
                <button type="button" data-story-tab="4"><span>05</span>FAQ</button>
              </div>
              <div class="story-progress-readout">
                <span class="story-progress-track" id="story-progress-track" role="progressbar" aria-label="Story progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="story-progress-fill"></i></span>
                <span id="story-progress-label">01 / 05 · Process · 0%</span>
              </div>
            </div>
            <button class="story-arrow" id="story-next" type="button" aria-label="Next chapter">→</button>
            <a class="story-exit story-exit-down" href="#contact" aria-label="Continue to contact">Contact ↓</a>
          </div>

          <div class="story-side-scroll" id="story-side-scroll" aria-hidden="true">
            <span id="story-side-thumb"></span>
            <small>Scroll</small>
          </div>
          <div class="story-mobile-hint" aria-hidden="true">Swipe chapters ↔ · keep scrolling ↓</div>
          <div class="sr-only" id="story-live" aria-live="polite">Chapter 1 of 5: Process</div>
        </div>
      </div>
    </section>

    <section class="contact" id="contact">
      <div class="contact-media parallax-layer" data-parallax="0.07">
        <img src="/photography/gallery/vm-6913-traverse-morning-light.webp" alt="">
      </div>
      <div class="contact-overlay" aria-hidden="true"></div>
      <div class="shell contact-copy reveal">
        <p class="eyebrow">Contact</p>
        <h2>Tell me about the route.</h2>
        <a class="contact-email" href="mailto:f.stawiarski@gmail.com">f.stawiarski@gmail.com</a>
        <div class="contact-links">
          <a href="https://www.youtube.com/@RoadToSomewhereWithYou">YouTube</a>
          <a href="https://www.twitch.tv/ineedbooz">Twitch</a>
          <a href="/climbers-lounge">Climbers Lounge</a>
          <span>Vienna, AT</span>
        </div>
      </div>

      <footer class="site-footer" aria-label="Site footer">
        <div class="shell footer-grid">
          <div class="footer-brand">
            <strong>Vertical Moment</strong>
            <p>Climbing and outdoor photography from Vienna. The Collective builds the topo data underneath.</p>
          </div>
          <div>
            <p class="footer-label">Site</p>
            <a href="#work">Work</a><a href="#services">Services</a><a href="#about">About</a><a href="/prints/panoramas">Panorama editions</a><a href="#contact">Contact</a>
          </div>
          <div>
            <p class="footer-label">Elsewhere</p>
            <a href="https://www.youtube.com/@RoadToSomewhereWithYou">YouTube</a><a href="https://www.twitch.tv/ineedbooz">Twitch</a><a href="mailto:f.stawiarski@gmail.com">Email</a>
          </div>
          <div>
            <p class="footer-label">Collective</p>
            <a href="/climbers-lounge">Climbers Lounge</a>
          </div>
        </div>
        <div class="shell footer-bottom">
          <span>© 2026 Vertical Moment · Vienna, AT</span>
          <span>Photography · Collective · 3D Lab</span>
        </div>
      </footer>
    </section>
  </main>
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Selected photograph" aria-hidden="true">
    <button class="lightbox-close" id="lightbox-close" type="button" aria-label="Close image">×</button>
    <button class="lightbox-nav lightbox-prev" id="lightbox-prev" type="button" aria-label="Previous image">←</button>
    <figure>
      <img id="lightbox-image" alt="">
      <figcaption><strong id="lightbox-title"></strong><span id="lightbox-meta"></span></figcaption>
    </figure>
    <button class="lightbox-nav lightbox-next" id="lightbox-next" type="button" aria-label="Next image">→</button>
  </div>`;

const publicSiteThemeInit =
  "(function(){try{var saved=localStorage.getItem('vm-theme');document.documentElement.dataset.theme=saved==='light'?'light':'dark';}catch(e){document.documentElement.dataset.theme='dark';}})();";

export default function Page() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      <script dangerouslySetInnerHTML={{ __html: publicSiteThemeInit }} />
      <div className="public-site-v5-root" dangerouslySetInnerHTML={{ __html: publicSiteMarkup }} />
      <script src="/public-site-v5.js" defer />
    </>
  );
}
