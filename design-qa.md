# Panorama product design QA

## Comparison target and evidence

- Source visual truth:
  - `D:\VERTICALMOMENT\Panoramas\Wachau\7.png`, `9.png` through `16.png`
  - `C:\Users\ineedbooze\Documents\Codex\2026-08-08\referenced-chatgpt-conversation-this-is-an-2\work\panorama-audit\before-gallery.png`
  - `C:\Users\ineedbooze\Documents\Codex\2026-08-08\referenced-chatgpt-conversation-this-is-an-2\work\panorama-audit\before-topo.png`
- Rendered implementation:
  - `http://localhost:3017/prints/panoramas`
  - `http://localhost:3017/#work` with the `Panoramas` filter active
  - `http://localhost:3017/vision/wall-reveal` with Topo and panorama-panel states
- Implementation screenshots:
  - `C:\Users\ineedbooze\Documents\Codex\2026-08-08\referenced-chatgpt-conversation-this-is-an-2\work\panorama-audit\after-panorama-page.png`
  - `C:\Users\ineedbooze\Documents\Codex\2026-08-08\referenced-chatgpt-conversation-this-is-an-2\work\panorama-audit\after-gallery.png`
  - `C:\Users\ineedbooze\Documents\Codex\2026-08-08\referenced-chatgpt-conversation-this-is-an-2\work\panorama-audit\after-topo.png`
  - `C:\Users\ineedbooze\Documents\Codex\2026-08-08\referenced-chatgpt-conversation-this-is-an-2\work\panorama-audit\after-wall-panel.png`
- Side-by-side comparison inputs:
  - `C:\Users\ineedbooze\Documents\Codex\2026-08-08\referenced-chatgpt-conversation-this-is-an-2\work\panorama-audit\compare-gallery.png`
  - `C:\Users\ineedbooze\Documents\Codex\2026-08-08\referenced-chatgpt-conversation-this-is-an-2\work\panorama-audit\compare-topo.png`
  - `C:\Users\ineedbooze\Documents\Codex\2026-08-08\referenced-chatgpt-conversation-this-is-an-2\work\panorama-audit\compare-brand-to-panorama.png`
- Browser CSS viewport: 1280 × 720, device pixel ratio 1.
- In-app Browser focused capture: 717 × 712 for homepage/panorama comparisons and 725 × 720 for Wall Reveal. The browser panel clips the right side of the 1280 px CSS viewport; comparisons were normalized to equal focused-capture dimensions before judging.
- State: production-like local development build, light homepage theme, Wall Reveal Topo state, and panorama collection default state.

## Full-view comparison evidence

The panorama collection retains the current site's editorial serif hierarchy, uppercase utility copy, warm paper, deep forest surfaces, restrained gold accent and real brand mark. The gallery filter changes the data and copy without changing the existing section hierarchy. Wall Reveal keeps its established cyan spatial-data language while adding a single secondary action rather than altering the four-stage flow.

The panorama hero uses the supplied `9.png` derivative without fake or generated imagery. Its dark overlay preserves readable white type while retaining terrain detail. The page clearly separates photography, provisional regional-reference status and print enquiry.

## Focused comparison evidence

- Gallery: `compare-gallery.png` confirms identical header, section title, filter-chip design, crag row and gallery rhythm. The panorama state adds a factual archive note and wide photographic cards with a persistent print label.
- Wall Reveal: `compare-topo.png` confirms the same background, copy hierarchy, blend control, four-stage timeline and primary action. The only material addition is `Open regional panoramas`, positioned between the blend control and stage timeline.
- Brand transfer: `compare-brand-to-panorama.png` confirms the dedicated page uses the same real mark, serif display voice, restrained gold accent and editorial photography-led composition.

## Required fidelity surfaces

- Fonts and typography: Georgia and the existing system-sans stack are retained. Display/body contrast, uppercase tracking and line-height match the current website and Wall Reveal. No actionable wrapping or truncation was found in the captured states.
- Spacing and layout rhythm: the homepage and Wall Reveal base layouts remain intact. New controls keep 44 px or larger targets; panorama grids collapse to one column under 860 px. No document-level horizontal overflow was found at the 1280 px browser viewport.
- Colors and visual tokens: the page reuses the existing warm paper, deep forest, gold and Wall Reveal cyan roles. Provisional status uses cyan consistently with the data-layer experience.
- Image quality and asset fidelity: all nine supplied panoramas are represented. Visible stitch-canvas borders were trimmed only in web derivatives for files 9, 10, 12, 13, 15 and 16; the original PNGs remain untouched. Previews are 2,400–3,200 px wide and thumbnails are 1,000 px wide.
- Copy and content: print dimensions are derived from native pixels at explicit 300 ppi and 240 ppi reference densities. The product avoids unverified price, edition and route claims. Route/reference copy is consistently provisional.
- Icons/assets: the real Vertical Moment brand asset is used. No custom SVG, CSS illustration, emoji or placeholder product art was introduced.
- States and interactions: filter selection, previous/next, fit/detail, full-screen open/close, panorama lightbox, deep links and Wall Reveal panorama panel were exercised in the in-app Browser.
- Accessibility: semantic buttons/links, pressed states, labelled groups, dialog roles, alt text, visible focus styles, Escape support, arrow-key navigation and reduced-motion rules are present.

## Findings

No actionable P0, P1 or P2 visual findings remain.

## Comparison history

### Iteration 1

- [P2] Locale-dependent pixel formatting caused a server/client hydration mismatch on the panorama detail record and surfaced the development issues overlay.
  - Fix: replaced implicit `toLocaleString()` calls with an explicit `Intl.NumberFormat('en-US')` formatter.
- [P2] An obsolete root-layout inline theme script produced a React development warning and targeted a theme attribute that the active theme component does not use.
  - Fix: removed the unused script; the active `PhotographyTheme` component remains the canonical theme controller.

### Iteration 2

- Post-fix browser DOM opened without the issues overlay.
- Production build completed successfully.
- Re-captured `after-panorama-page.png` and regenerated `compare-brand-to-panorama.png` without the development-error badge.
- No new P0/P1/P2 findings were found.

## Open questions

- Exact crag/sector association for each panorama still needs owner or field confirmation before any image is promoted from regional reference to registered wall reference.
- Paper, printer profile, pricing and edition model are intentionally not defined in this build.
- A native narrow-device capture remains a useful follow-up; responsive behavior is implemented and code-inspected, while the available in-app Browser supplied a fixed 1280 × 720 CSS viewport.

## Implementation checklist

- [x] Preserve all supplied master PNGs outside the public website.
- [x] Generate deterministic thumbnail and proof derivatives with a checksum manifest.
- [x] Add a reusable panorama catalogue with print and verification metadata.
- [x] Add the main-gallery panorama filter and print-detail lightbox action.
- [x] Add the dedicated panorama viewer and enquiry path.
- [x] Add the Wall Reveal regional-reference panel.
- [x] Verify build, browser interactions and clean client rendering.

## Follow-up polish

- [P3] After a print supplier is chosen, add paper swatches and a photographed framed-print scale reference.
- [P3] After field registration, selected wall studies can receive optional verified sector hotspots without changing the panorama source record.

final result: passed
