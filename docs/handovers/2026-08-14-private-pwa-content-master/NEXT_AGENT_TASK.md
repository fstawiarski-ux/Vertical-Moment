# Next agent task

## Objective

Fill the first reviewed content slice without changing the product boundary or redesigning the PWA:

```text
Wachau -> Nasenwand -> Upper
```

Connect only the facts and assets that have an owner-approved source state. Keep anything uncertain visibly `UNVERIFIED` or `PROVISIONAL`.

## Bounded work

1. Start from the current `main` after this review PR is merged, or from an owner-approved follow-up branch.
2. Read the private content master and inspect the current `website/public/explore-content.json` before editing it.
3. Select one small batch from `D:\VERTICALMOMENT\WEBSITE\private-assets\vm-content-intake\00-INBOX`.
4. Preserve originals, record checksums and rights state, and make only the required derivatives.
5. Update canonical route data only when evidence supports it; regenerate the website mirror.
6. Update one box or one detail surface with stable IDs and explicit return links.
7. Run `QA_CHECKLIST.md` at phone, tablet, and desktop sizes.
8. Open a review PR with screenshots and a clear local/PR/merged/deployed status.

## Do not do in this task

- Do not make `/explore-app` public or add it to public navigation.
- Do not merge or deploy without owner approval.
- Do not replace the public Coming Soon bridge with a teaser CTA.
- Do not guess route names, grades, locations, geometry, access, parking, rights, or business claims.
- Do not edit generated `website/public/data/v1/` independently.
- Do not commit source masters or use `git add -A`.
- Do not split Climbers Lounge and Explore Lab into separate products.

## Definition of done

The batch has one stable record, source and rights evidence, approved derivatives, a working page/box destination and return path, screenshots for the three device bands, passing tests/build/data checks, and an owner-reviewable PR. The PWA remains private-by-link throughout.
