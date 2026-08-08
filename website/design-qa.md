# Nasenwand design QA

- Date: 2026-08-08
- Source visual truth: `../docs/nasenwand-concepts/qa/source-approved-viewport-split.png`
- Source mobile truth: `../docs/nasenwand-concepts/qa/source-approved-mobile-split.png`
- Implementation capture: `../docs/nasenwand-concepts/qa/implementation-production-viewport-split.png`
- Implementation mobile capture: `../docs/nasenwand-concepts/qa/implementation-production-mobile-390x844-split-top.png`
- Full-view comparison: `../docs/nasenwand-concepts/qa/comparison-approved-left-production-right.png` (approved source left, production implementation right)
- Focused implementation stage: `../docs/nasenwand-concepts/qa/implementation-production-stage-split.png`
- Route: `/nasenwand-concepts`
- State: 01 Split Reveal, Wide, interaction 48%, route draw 62%

## Capture normalization

- Desktop CSS viewport: 1440 × 1100, device scale factor 1.
- Desktop source and implementation captures: 1425 × 1089 pixels after the in-app browser scrollbar/chrome crop.
- Focused stage: 1377 × 774 pixels.
- Mobile CSS viewport: 390 × 844, device scale factor 1.
- Mobile source and implementation output: 375 × 812 pixels after the same browser crop.
- Source and implementation were captured with the same route, concept, framing, progress, theme, assets, and density.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: the serif display/body treatment, sans-serif control labels, weights, wrapping, and hierarchy match the approved prototype. At 390 CSS pixels, the title remains within the 362-pixel content rail.
- Spacing and layout rhythm: desktop header, intro, three-choice rail, slider, stage, and control deck align with the approved target. Mobile controls stack without horizontal overflow; document width equals the 390-pixel viewport.
- Colors and tokens: deep green, warm white, muted copy, amber accent, borders, active states, and disabled states use the approved photography-theme tokens.
- Image quality and asset fidelity: the approved Nasenwand photo, spatial derivative, topo reference, and transparent route overlay are unchanged. Responsive 1280/2400 candidates remain aligned and sharp.
- Copy and content: only 01 Split Reveal, 02 Geological Wipe, and 06 Cinematic are present. The provisional route warning remains visible.
- Icons: the existing Vertical Moment monogram is reused; no placeholder or replacement icon was introduced.
- Accessibility: semantic buttons, `aria-pressed`, named range inputs, visible focus treatment, 44-pixel targets, reduced-motion handling, and ordinary-text status warnings remain intact.

## Interaction verification

- Homepage 3D Lab call-to-action navigates to `/nasenwand-concepts`.
- Concept buttons select Split, Geological, and Cinematic states.
- The concept slider and concept state share the same index.
- Pointer dragging moved interaction progress from 48% to 75%.
- Detail crop and Monochrome buttons update `aria-pressed` correctly.
- Route draw is disabled in 01/02 and enabled in 06.
- Route draw input updated from 62% to 20%, and its visible output updated to `20%`.
- Mobile Cinematic selection enables route draw without horizontal overflow.
- Production and normal `127.0.0.1` development previews reported no console errors.

## Comparison history

### Pass 1

- Earlier P0/P1/P2 findings: none.
- Fixes made from visual comparison: none required; the implementation uses the approved component, scoped styles, and visual assets directly.
- Post-fix evidence: not applicable. The 1:1 desktop comparison and mobile geometry checks passed on the first normalized production capture.

## Residual manual gates

- Photo and topo publication rights still require owner confirmation.
- Route names, grades, lengths, geometry, and camera registration remain prototype/unverified.
- Search indexing should remain disabled until those content gates are approved.

## Follow-up polish

No P3 visual changes are required for this review branch.

final result: passed
