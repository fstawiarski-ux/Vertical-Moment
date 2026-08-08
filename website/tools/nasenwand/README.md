# Nasenwand web asset preparation

Run this from `website/` after installing dependencies:

```powershell
node tools/nasenwand/prepare-assets.mjs `
  --photo "D:\path\to\DJI_0026.JPG" `
  --topo "D:\path\to\nasentopomask.png" `
  --prefix "nasenwand" `
  --out "public\photography\nasenwand"
```

The command creates 1280 px and 2400 px WebP derivatives, a stylised spatial-relief derivative, transparent route-reference overlays, and a source checksum manifest. The prefix defaults to `nasenwand`. Use a lowercase, hyphenated prefix for future crags. The script never changes the source files.

The spatial derivative is an art-direction fallback, not a 3D render. Replace it only after a web-ready model and reviewed camera match are available.
