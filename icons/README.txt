TSUKI ICON PACK

Production icon files:
- icon-192.png
- icon-512.png
- icon-maskable-512.png
- apple-touch-icon.png

Optional browser/Android sizes:
- favicon-32.png
- favicon-16.png
- icon-48.png
- icon-72.png
- icon-96.png
- icon-128.png
- icon-144.png
- icon-256.png
- icon-384.png

manifest.json uses:
{
  "icons": [
    {
      "src": "./icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "./icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "./icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}

For iPhone in index.html:
<link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">

Legacy source/master files from other app repositories should not be kept in Tsuki unless they are intentionally used by the production icon pipeline.
