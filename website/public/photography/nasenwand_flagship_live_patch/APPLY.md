# Nasenwand live patch

Copy the `website/` tree over the repository root, then run:

```bash
npm --prefix website install
npm --prefix website run build
git add website/app/components/nasenwand/nasenwand-flagship-explorer.tsx website/app/components/nasenwand/nasenwand-flagship.module.css website/app/components/nasenwand/nasenwand-flagship-frames.ts website/app/nasenwand-concepts/page.tsx
git commit -m "Launch Nasenwand flagship explorer"
git push origin main
```

This replaces `/nasenwand-concepts` with the production flagship experience using embedded deterministic frame sequences for both drone passes, persistent panorama, sector flow, topo route belt, and route actions.
