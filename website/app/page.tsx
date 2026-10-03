import type { Metadata } from 'next';
import './public-site-v5.css';

export const metadata: Metadata = {
  title: 'Vertical Moment — Climbing photography, Vienna',
  description:
    'A documentary climbing photography portfolio from Vienna, the Wachau and the Eastern Alps.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Vertical Moment — Climbing photography, Vienna',
    description: 'A documentary climbing photography portfolio from Vienna and the Eastern Alps.',
    url: '/',
    type: 'website',
    siteName: 'Vertical Moment',
    images: ['/brand/official-v2/social/forest-og-1200x630.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vertical Moment — Climbing photography, Vienna',
    description: 'A documentary climbing photography portfolio from Vienna and the Eastern Alps.',
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
      <a href="#photo-studies">Photo studies</a>
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
      <a href="#photo-studies"><span>03</span>Photo studies</a>
      <a href="#about"><span>04</span>About</a>
      <a href="#contact"><span>05</span>Contact</a>
      <a href="/climbers-lounge"><span>→</span>Climbers Lounge</a>
    </nav>
  </div>

  <main id="main">
    <section class="hero" id="top" aria-labelledby="hero-title">
      <div class="hero-media parallax-layer" data-parallax="0.12">
        <img src="/photography/gallery/vm-6890-peilstein-main-face.webp"
             alt="Climber on a limestone wall at Peilstein"
             loading="eager" fetchpriority="high" decoding="async">
      </div>
      <div class="hero-shade" aria-hidden="true"></div>

      <div class="hero-grid shell">
        <div class="hero-copy">
          <p class="eyebrow hero-kicker">Vertical Moment · climbing &amp; outdoor photography · Vienna</p>
          <h1 id="hero-title">The second <em>before</em> the move.</h1>
          <p class="hero-lead">Limestone, low light, and the people who read it. Shot on the crags around Vienna, in the Wachau and across the Eastern Alps.</p>
          <div class="hero-actions">
            <a class="button button-primary" href="#work">See selected work <span aria-hidden="true">↘</span></a>
          </div>
        </div>

        <aside class="hero-index" aria-label="Photography profile">
          <div><span>Est.</span><strong>2020</strong></div>
          <div><span>Mode</span><strong>Documentary</strong></div>
          <div><span>Access</span><strong>On rope</strong></div>
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
          <p>Documentary on the wall, editorial in the edit. The photographs here follow real attempts, movement and detail in the changing light of the crags.</p>
        </div>

        <figure class="manifesto-image reveal">
          <img src="/photography/gallery/vm-6965-topping-out.webp"
               alt="Climber topping out on limestone" loading="lazy" decoding="async">
          <figcaption>Real attempts. Real light. No staging.</figcaption>
        </figure>
      </div>
    </section>

    <section class="stats-strip" aria-label="Photography archive details">
      <div class="shell stats-grid">
        <div class="stat reveal"><strong data-count="40" data-suffix="+">40+</strong><span>Crags photographed</span></div>
        <div class="stat reveal"><strong data-count="6">6</strong><span>Years on rope</span></div>
        <div class="stat reveal"><strong>Field</strong><span>Documentary archive</span></div>
        <div class="stat reveal"><strong>Light</strong><span>Natural conditions</span></div>
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
            <img src="/photography/gallery/vm-6890-peilstein-main-face.webp" alt="Climber on Peilstein main face" loading="lazy" decoding="async">
            <span class="work-caption"><strong>Peilstein · main face</strong><small>6b+</small></span>
            <span class="work-number">01</span>
          </button>

          <button class="work-item work-item-b reveal" type="button"
                  data-src="/photography/gallery/vm-6683-green-corner.webp"
                  data-title="Green corner" data-meta="Helenental · limestone">
            <img src="/photography/gallery/vm-6683-green-corner.webp" alt="Helenental limestone wall" loading="lazy" decoding="async">
            <span class="work-caption"><strong>Green corner</strong><small>Helenental</small></span>
            <span class="work-number">02</span>
          </button>

          <button class="work-item work-item-c reveal" type="button"
                  data-src="/photography/gallery/vm-6965-topping-out.webp"
                  data-title="Topping out" data-meta="7a · limestone">
            <img src="/photography/gallery/vm-6965-topping-out.webp" alt="Climber topping out" loading="lazy" decoding="async">
            <span class="work-caption"><strong>Topping out</strong><small>7a</small></span>
            <span class="work-number">03</span>
          </button>

          <button class="work-item work-item-d reveal" type="button"
                  data-src="/photography/gallery/vm-6913-traverse-morning-light.webp"
                  data-title="Traverse · morning light" data-meta="Glocknergrat">
            <img src="/photography/gallery/vm-6913-traverse-morning-light.webp" alt="Climber traversing in morning light" loading="lazy" decoding="async">
            <span class="work-caption"><strong>Traverse · morning light</strong><small>Glocknergrat</small></span>
            <span class="work-number">04</span>
          </button>

          <button class="work-item work-item-e reveal" type="button"
                  data-src="/photography/stories/curated/9b3b7594-climber-portrait.webp"
                  data-title="Looking up" data-meta="Climbing portrait">
            <img src="/photography/stories/curated/9b3b7594-climber-portrait.webp" alt="Climber in a helmet looks upward, framed by trees." loading="lazy" decoding="async">
            <span class="work-caption"><strong>Looking up</strong><small>Portrait</small></span>
            <span class="work-number">05</span>
          </button>
        </div>

        <div class="portfolio-footer reveal">
          <p>Documentary climbing photography · portraits · crag atmosphere · technical detail</p>
        </div>
      </div>
    </section>


    <section class="story-formats" id="story-formats" aria-labelledby="story-formats-title">
      <div class="shell">
        <header class="story-formats-heading reveal">
          <div><p class="eyebrow">Three story formats</p><h2 id="story-formats-title">Stories with a point of view.</h2></div>
          <p>Climbing, product and event stories, each shaped around one clear sequence. These pages are live as format previews while final photographs and copy are being curated.</p>
        </header>
        <div class="story-format-grid">
          <a class="story-format-card reveal" href="/stories/climbing">
            <figure><img src="/photography/stories/curated/9b3b7824-action-lead.webp" alt="Climber in a red helmet reaches for a hold on limestone." loading="lazy" decoding="async"><figcaption>01 / Climbing</figcaption></figure>
            <div class="story-format-copy"><p class="eyebrow">CLIMBING STORY</p><h3>The Ascent</h3><p>Approach, movement and the moments between.</p><span>Explore the format <b aria-hidden="true">-&gt;</b></span></div>
          </a>
          <a class="story-format-card reveal" href="/stories/product">
            <figure><img src="/photography/stories/curated/9b3b6471-quickdraw-detail.webp" alt="Quickdraw clipped into a bolt on limestone." loading="lazy" decoding="async"><figcaption>02 / Product</figcaption></figure>
            <div class="story-format-copy"><p class="eyebrow">PRODUCT STORY</p><h3>The Kit</h3><p>Form, detail and an object in use.</p><span>Explore the format <b aria-hidden="true">-&gt;</b></span></div>
          </a>
          <a class="story-format-card reveal" href="/stories/events">
            <figure><img src="/photography/stories/curated/9b3b7872-place-scale.webp" alt="Two climbers stand on a high rock above a river valley." loading="lazy" decoding="async"><figcaption>03 / Events</figcaption></figure>
            <div class="story-format-copy"><p class="eyebrow">EVENT STORY</p><h3>The Session</h3><p>Place, preparation and a day shared outdoors.</p><span>Explore the format <b aria-hidden="true">-&gt;</b></span></div>
          </a>
        </div>
        <p class="story-formats-note">Format previews use selected photo proofs. Final photo exports and story copy will follow after curation.</p>
      </div>
    </section>

    <section class="quote-section">
      <div class="quote-media parallax-layer" data-parallax="0.08">
        <img src="/photography/gallery/vm-6683-green-corner.webp" alt="" loading="lazy" decoding="async">
      </div>
      <div class="quote-overlay" aria-hidden="true"></div>
      <div class="quote-lockup reveal">
        <p class="eyebrow">The hour matters</p>
        <blockquote>“Every crag has one hour when the rock gives the light back. I plan the day around it.”</blockquote>
        <p class="quote-handoff">Keep scrolling for notes from the field.</p>
      </div>
    </section>

    <section class="story-section" id="story" aria-labelledby="story-title">
      <div class="story-body shell">
        <header class="story-heading">
          <p class="eyebrow">Behind the photographs</p>
          <h2 id="story-title">Field notes</h2>
          <p class="story-intro">A few notes on how I read the wall, follow movement and keep each frame in context.</p>
        </header>

        <figure class="story-panorama" id="photo-studies">
          <picture>
            <source media="(max-width: 767px)" srcset="/photography/panoramas/wachau/wachau-09-thumb.webp">
            <img src="/photography/panoramas/wachau/wachau-09-preview.webp"
                 alt="Wide view across the Wachau valley and long ridge"
                 loading="lazy" decoding="async">
          </picture>
          <figcaption>
            <div>
              <p class="eyebrow">Panorama study</p>
              <strong>Wachau · long ridge</strong>
            </div>
            <a href="/prints/panoramas">Explore Panorama Studies ↗</a>
          </figcaption>
        </figure>

        <section class="story-subsection" aria-labelledby="how-i-work-title">
          <h3 id="how-i-work-title">How I work</h3>
          <div class="story-principles">
            <article>
              <span class="principle-number">01</span>
              <h4>Read the wall</h4>
              <p>Route line, aspect and changing light shape how each face is photographed.</p>
            </article>
            <article>
              <span class="principle-number">02</span>
              <h4>Follow the movement</h4>
              <p>The photographs focus on attempts, rest, detail and the moments between moves.</p>
            </article>
            <article>
              <span class="principle-number">03</span>
              <h4>Keep the context</h4>
              <p>Each image is presented with its place and enough context to situate the climb.</p>
            </article>
          </div>
        </section>

        <section class="story-subsection story-notes-section" aria-labelledby="field-notes-title">
          <h3 id="field-notes-title">From the field</h3>
          <div class="notes-editorial">
            <article>
              <span>June · Peilstein</span>
              <h4>Shooting a face that never gets sun</h4>
              <p>Holding detail in cold north-facing limestone without lifting the shadows into mush.</p>
            </article>
            <article>
              <span>July · Helenental</span>
              <h4>Why the hands tell the story</h4>
              <p>The face shows effort, but the hands show the grade. More detail frames, fewer generic summit shots.</p>
            </article>
          </div>
        </section>

        <section class="story-about" id="about" aria-labelledby="about-title">
          <header>
            <p class="eyebrow">About</p>
            <h3 id="about-title">I climb the routes I photograph.</h3>
          </header>
          <div class="story-about-copy">
            <p>Vertical Moment is the photography side of a longer project documenting climbing around Vienna. The selected frames show real attempts and moments around them; nothing is staged, and the light varies with each place and day. The portfolio includes crags around Vienna, the Wachau and the Eastern Alps. These are photographs, not route or access records; check current local guidebooks and official sources for climbing information.</p>
            <div class="founder-inline">
              <span>Founder · Vienna</span>
              <strong>Filip Stawiarski</strong>
              <a href="mailto:f.stawiarski@gmail.com">Email ↗</a>
            </div>
          </div>
        </section>
      </div>
    </section>

    <section class="contact" id="contact">
      <div class="contact-media parallax-layer" data-parallax="0.07">
        <img src="/photography/gallery/vm-6913-traverse-morning-light.webp" alt="" loading="lazy" decoding="async">
      </div>
      <div class="contact-overlay" aria-hidden="true"></div>
      <div class="shell contact-copy reveal">
        <p class="eyebrow">Portfolio preview</p>
        <h2>Documentary climbing photography from Vienna.</h2>
        <p class="eyebrow">Bookings and print orders are not open.</p>
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
            <a href="#work">Work</a><a href="#photo-studies">Photo studies</a><a href="#about">About</a><a href="/prints/panoramas">Panorama studies</a><a href="#contact">Contact</a>
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

