/* ============================================================
   TSUKI SERVICE WORKER — VERSION 1.0 PRE-RELEASE
   Public app version remains v1.0 pre-release.
   ============================================================ */

const CACHE_NAME = "tsuki-cache-v1-pre-smart-reminders-11";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./body-signals.css",
  "./body-signals.js",
  "./adaptive-intelligence.js",
  "./life-mode-intelligence.js",
  "./meta-intelligence.js",
  "./reproductive-intelligence.js",
  "./care-health-intelligence.js",
  "./postpartum-feeding-intelligence.js",
  "./maternal-intelligence.js",
  "./anticipatory-care-intelligence.js",
  "./personal-health-intelligence.js",
  "./personal-health-inputs.js",
  "./release-readiness.js",
  "./smart-reminders.js",
  "./app.js",
  "./firebase-tsuki.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./assets/tsuki-companion.png"
];

const UPDATE_FIRST = new Set([
  "./",
  "./index.html",
  "./style.css",
  "./body-signals.css",
  "./body-signals.js",
  "./adaptive-intelligence.js",
  "./life-mode-intelligence.js",
  "./meta-intelligence.js",
  "./reproductive-intelligence.js",
  "./care-health-intelligence.js",
  "./postpartum-feeding-intelligence.js",
  "./maternal-intelligence.js",
  "./anticipatory-care-intelligence.js",
  "./personal-health-intelligence.js",
  "./personal-health-inputs.js",
  "./release-readiness.js",
  "./smart-reminders.js",
  "./app.js",
  "./manifest.json"
]);


/* ============================================================
   INSTALL
   ============================================================ */

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
  );

});




/* ============================================================
   UPDATE CONTROL
   ============================================================ */

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/* ============================================================
   ACTIVATE
   ============================================================ */

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
  );

  self.clients.claim();
});


/* ============================================================
   HELPERS
   ============================================================ */

function relativePath(url) {
  const parsed = new URL(url);
  const scope = new URL(self.registration.scope);
  const relative = parsed.pathname.slice(scope.pathname.length);

  return relative ? `./${relative}` : "./";
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request, { cache: "no-store" });

    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  }
  catch (error) {
    const cached = await cache.match(request);

    if (cached) return cached;

    if (request.mode === "navigate") {
      return cache.match("./index.html");
    }

    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);

  if (cached) return cached;

  const response = await fetch(request);

  if (
    response &&
    response.status === 200 &&
    response.type !== "opaque"
  ) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }

  return response;
}


/* ============================================================
   FETCH
   ============================================================ */

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const scopeUrl = new URL(self.registration.scope);

  if (requestUrl.origin !== scopeUrl.origin) return;

  const path = relativePath(event.request.url);

  if (
    event.request.mode === "navigate" ||
    UPDATE_FIRST.has(path)
  ) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});