# Wall Reveal website design QA

- Date: 2026-08-08
- Route: `/vision/wall-reveal`
- Source visual truth: `../../../outputs/wall-reveal-interactive/wall-reveal-final.png`
- Browser-rendered production screenshot: `../../round4-audit/15-wall-reveal-production.png`
- Normalized mobile implementation: `../../round4-audit/21-wall-reveal-mobile-final-393x852.png`
- Mobile source/implementation comparison: `../../round4-audit/22-mobile-source-vs-website-final.png`
- Focused interaction evidence: `../../round4-audit/03-wall-reveal-scrub.png`, `04-wall-reveal-topo.png`, `05-wall-reveal-3d.png`, `13-wall-reveal-gallery.png`

## Capture normalization

- Source: 393 × 852 pixels, representing a 393 × 852 CSS-pixel phone screen at density 1.
- Implementation phone viewport: an actual 393 × 852 iframe viewport, rendered at 0.82 scale inside the in-app browser's 1280 × 720 viewport, then cropped and normalized back to 393 × 852 with bicubic resampling.
- Desktop implementation viewport: 1280 × 720 CSS pixels. The in-app screenshot file is a 725 × 720 crop of that viewport, so desktop judgment used the visible content region plus DOM geometry.
- State: `Place`, default dark visual treatment. Additional captures cover `Scrub`, `Topo`, `3D`, media budget, and gallery.

## Findings

No actionable P0, P1, or P2 difference remains.

- Fonts and typography: the website intentionally replaces the prototype's condensed app label with the photography site's Georgia display treatment and system sans-serif UI. Hierarchy, wrapping, weights, and small-label tracking remain clear at phone and desktop sizes.
- Spacing and layout rhythm: the four-stage rail, primary action, status line, and story block retain the source hierarchy. The website removes phone bezel/status chrome and uses that space for real navigation and sharing controls.
- Colors and visual tokens: cyan remains the interaction/status accent while the dark rock treatment and restrained white typography connect the page to the existing photography site.
- Image quality and asset fidelity: the implementation uses the real 1280 px Nasenwand panorama, registered topo/spatial derivatives, existing gallery WebPs, the real website monogram, and the optimized Nasenwand GLB. No placeholder illustration, CSS drawing, or substitute wall is present.
- Copy and content: the four states explain what is loaded and what remains provisional. The 3D state correctly identifies the real Nasenwand model rather than the earlier Jammerwandl stand-in.
- Interaction and accessibility: stage buttons, video playback/scrub, topo blend, 3D orbit, gallery, menu, budget panel, Escape handling, focus rings, labels, and reduced-motion behavior are present. The active 3D model is not hidden from assistive technology.

## Comparison history

1. P2: mobile header and secondary controls began at 38 px, and stage controls had no guaranteed mobile target height.
   - Fix: raised header, gallery, and stage controls to at least 44 px.
   - Evidence: `20-wall-reveal-mobile-final.png` and normalized comparison `22-mobile-source-vs-website-final.png`.
2. P2: the media container initially used `aria-hidden` even when the interactive model was active.
   - Fix: `aria-hidden` now applies only to decorative photo/video/topo states.
   - Evidence: production DOM exposes the model state while decorative imagery remains silent.
3. P2: the first header mark was a text/CSS approximation.
   - Fix: replaced it with the existing `03_silver_vector.png` brand asset.
   - Evidence: `20-wall-reveal-mobile-final.png`.

## Primary interactions and technical checks

- All four stages opened from the stage rail and primary actions.
- The scrub derivative loaded with duration 40.607 seconds, remained manually controllable, and exposed play/pause plus an accessible range input.
- The topo blend range updated between spatial and registered images.
- The real Nasenwand model rendered with orbit interaction from `/models/nasenwand-bergsteiger-lod0.glb`.
- Menu, six-image gallery, and media-budget panel opened and closed correctly.
- Production Next.js build and TypeScript passed; route was statically generated.
- Production dependency audit: 0 vulnerabilities.
- Production browser console after page load: no entries.

## Residual test gap

- The operating-system share sheet was not opened during automated QA. The button uses the Web Share API where available and clipboard fallback elsewhere.

final result: passed
