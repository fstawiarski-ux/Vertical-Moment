# Nasenwand flagship media design QA

- Date: 2026-08-08
- Route: `/nasenwand-concepts`
- Source capture: `../docs/nasenwand-concepts/qa/media-refresh/source-before-media-refresh.png`
- Desktop implementation: `../docs/nasenwand-concepts/qa/media-refresh/implementation-desktop-viewport-film.png`
- Mobile implementation: `../docs/nasenwand-concepts/qa/media-refresh/implementation-mobile-390x844-top.png`
- Source/implementation comparison: `../docs/nasenwand-concepts/qa/media-refresh/comparison-before-left-after-right.png`
- Preserved concept comparison: `../docs/nasenwand-concepts/qa/media-refresh/comparison-concept-before-left-after-right.png`

## Visual result

The route now matches the photography site’s default day treatment: `#fbfaf7` paper, near-black ink, muted gray-green copy, amber accent, Times-based display/body typography, Arial control labels, restrained line borders, and the existing forest/gold monogram. The former full-page deep-green treatment is removed. Dark treatment remains only inside media and photographic stages where it protects image contrast.

The new media desk is an editorial control rail rather than a grid of disconnected cards. Seven text buttons share one 16:9 stage, so the user can choose film, scroll scrub, landscape loop, portrait story loop, animated WebP, GIF, or depth stack without loading every asset at first paint.

## Desktop checks

- CSS viewport: 1440 × 1100; browser content width: 1425 px.
- Document width equals browser content width; no page-level horizontal overflow.
- Hero title, section title, seven-mode rail, 16:9 media stage, and three-column control deck retain a clear hierarchy.
- Hero film loads its 1920 × 1080 WebM and plays muted inline.
- Ping-pong loads at 1920 × 1080; Story loads at 1080 × 1920 and uses contained portrait framing.
- Animated WebP reports 720 × 405; GIF reports 480 × 270.
- All five 1280 × 720 depth layers load successfully.
- Scroll scrub remains paused and maps page movement from 26.8% to 58.6%, seeking from the corresponding source frame.
- Direct stage dragging reached 67.2% and 27.3 seconds on the 40.6-second scrub derivative.
- Film timeline clicking seeks the video and updates both numeric outputs.

## Mobile checks

- CSS viewport: 390 × 844; browser content width: 375 px.
- Document width equals browser content width; no page-level horizontal overflow.
- The media rail intentionally scrolls inside its own 347 px container and does not widen the page.
- The media and concept stages resolve to 347 × 433.75 px in the 4:5 phone treatment.
- The Nasenwand title fits the content rail without clipping.
- Cinematic and Monochrome states remain selectable; Route draw becomes enabled only for Cinematic.
- Control groups stack, maintain readable labels, and retain practical tap targets.

## Accessibility and resilience

- Media and concept choices use buttons with `aria-pressed`.
- Play, First frame, Scroll link, media progress, concept progress, interaction progress, and route draw expose ordinary controls and labels.
- Reduced-motion emulation returns a matching media query, pauses the hero video, changes the transport label to Play, and disables page-linked scrub motion.
- Focus outlines use the shared amber token.
- The route warning states route-reference status in text, not only color.
- Browser console check after media and concept interaction reported no warnings or errors.

## Asset and build checks

- Production Next.js build and TypeScript: passed.
- Static route generation for `/` and `/nasenwand-concepts`: passed.
- Production dependency audit: 0 vulnerabilities.
- Public media payload: 87.49 MiB across selectable derivatives; largest file: 16.99 MiB; files above 25 MiB: 0.
- MP4, WebM, GIF, WebP, PNG, and JPG media use Git LFS rules.
- Source and derivative hashes are recorded in `public/photography/nasenwand/media/asset-manifest.json`.
- The RAR, 56.43 MiB hero MP4, 44.84 MiB scrub master, and 31.76 MiB animated WebP master are not in the public bundle.
- The archive’s synthetic example route-grade SVG is intentionally excluded.

## Residual owner gates

- Confirm photo, video, topo, and archive publication rights before removing `robots.index: false`.
- Keep route labels, grades, lengths, geometry, and camera registration provisional until reviewed.
- Review the pushed branch before creating or merging a pull request.
- Deploy and attach `verticalmoment.com` only after the merged Cloudflare preview passes the same media and phone checks.

final result: passed
