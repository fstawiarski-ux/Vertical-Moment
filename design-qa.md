# Nasenwand panorama experience design QA

## Source and implementation

- Approved visual source: `C:\Users\ineedbooze\.codex\state\plugins\product-design\assets\vertical-moment-guided-passage-desktop-approved.png`
- Final desktop Region capture: `work/panorama-qa/nasenwand-region-desktop-final.png`
- Final mobile Region capture: `work/panorama-qa/nasenwand-region-mobile-final.png`
- Final mobile Sector capture: `work/panorama-qa/nasenwand-sector-mobile-final.png`
- Desktop 360 capture: `work/panorama-qa/nasenwand-360-desktop-pass1.png`
- Desktop 3D capture: `work/panorama-qa/nasenwand-sector-3d-desktop-pass1.png`
- Desktop and mobile test viewports: 1148 x 720 and 390 x 720 CSS px at DPR 1
- Tested route: Wachau / Nasenwand / Panorama

## Full-view comparison evidence

The approved source and both final Region captures were inspected together in one comparison input. The implementation keeps the established Vertical Moment language: forest-black framing, cream editorial serif typography, gold emphasis, cyan interaction cues, fine outlines, a cinematic photographic stage, and the numbered Region -> Crag -> Sector journey. The requested 360 and Videos chapters extend that same system instead of creating a separate visual style.

The left desktop rail, compact mobile header, focus frame, chapter controls, panorama overview, and full-range controls preserve the approved hierarchy while using real Nasenwand and Wachau media. The mobile composition reduces chrome without changing the brand or navigation model.

## Fidelity surfaces

1. Brand and navigation retain the Vertical Moment wordmark treatment, cream text, gold active states, cyan feedback, and dark forest background.
2. Hero typography keeps the approved editorial scale and gold italic emphasis while protecting the wall focus area.
3. The photographic stage uses the supplied Wachau panorama and Nasenwand derivatives rather than fabricated assets.
4. Region, Crag, Sector, 360, and Videos share one numbered chapter system on desktop and mobile.
5. External references, media tabs, 3D controls, and video choices reuse the existing outlined-button and fine-line vocabulary.

## Responsive and interaction checks

- No horizontal page overflow at 1148 x 720 or 390 x 720.
- Mobile chapter targets measure 72 x 62 px. Sector media controls now measure 64 x 44 px.
- Region overview is 358 x 43 px on mobile, matching the uploaded ultra-wide panorama ratio.
- Crag and Sector overview is 69 x 52 px on mobile, matching the supplied 4:3 media ratio and remaining aligned 16 px from the right edge.
- The overview uses intrinsic media dimensions and `object-fit: cover`; switching chapters changes the box ratio without stretching the source.
- Region supports the full-range slider, finger or mouse drag, mouse wheel, Arrow Left / Right, Home, End, click-to-jump, and a live cyan viewport marker.
- Sector switches between Photo, Spatial, Topo, Routes, and the real `nasenwand-bergsteiger-lod0.glb` model.
- The Bergsteigen topo, theCrag map, and Google 360 reference links are available from the Nasenwand experience.
- Chapter 4 opens the supplied public Google Maps 360 sphere inside the page and retains an external-open action.
- Chapter 5 defaults to a 290 KB still; Film, Scroll scrub, Ping-pong loop, and Portrait story load only after selection.
- Scroll scrub selection loads `scrub-540-allkey.mp4`, exposes a time slider, follows wheel input, and aligns the supplied contour overlay.
- Initial Region load contains no `video`, `iframe`, or `model-viewer` elements. Its resource timing list contains no scrub movie, hero movie, GLB, or Google Maps embed.
- Browser inspection returned no application warnings or errors during the final interaction pass.

## Performance and storage check

- The 88,065,748-byte source RAR was inventoried without extracting another duplicate copy.
- The original archive includes a 58,205,699-byte all-keyframe scrub file plus source plates, layer PNGs, masks, and standalone HTML.
- The website uses prepared derivatives and does not ship those masks or source plates in the initial page.
- Initial Nasenwand card media is `nasenwand-photo-1280.webp` at 182,900 bytes.
- Sector previews are selected on demand: spatial 297,216 bytes, topo 547,172 bytes, and route overlay 144,746 bytes at 1280 resolution.
- The real GLB is 17,577,952 bytes and is requested only after selecting 3D wall.
- The default video chapter still is 289,658 bytes. Larger film, scrub, loop, and portrait files are absent from the initial document and requested only after explicit selection.
- No source archive or print master was copied into a second public bundle.
- Chrome performance-trace tooling was unavailable in this session, so this pass records verified DOM/resource timing behavior and file delivery sizes rather than estimated Core Web Vitals.

## Findings and fixes

1. Crag and Sector overview boxes forced the Region panorama shape. Replaced the fixed shape with each selected asset's natural aspect ratio and top-right alignment.
2. The 360 chapter was only a placeholder. Added the supplied Google Maps sphere as a lazy iframe with a separate external link.
3. Topo references had no dedicated destination. Added Bergsteigen and theCrag actions to the desktop rail and compact Sector resource dock.
4. Sector media was flattened into one image. Added Photo, Spatial, Topo, Routes, and a lazy-loaded real 3D wall.
5. Video was a generic future state. Added a poster-first desk with film, scroll scrub, loop, and portrait options that load only when chosen.
6. The source RAR risked duplicated storage. Kept it as the master bundle, inventoried it in place, and reused the already optimized public derivatives.
7. Mobile Sector controls were 42 px high. Raised the minimum to 44 px and rechecked all five controls.

## Final result

passed
