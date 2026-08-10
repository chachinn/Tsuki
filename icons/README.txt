HANA ICON PACK

Recommended app files:
- icon-192.png
- icon-512.png
- icon-maskable-512.png
- apple-touch-icon.png

Optional:
- favicon-32.png
- favicon-16.png
- additional Android/PWA sizes are included.

For manifest.json, you can use:
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
