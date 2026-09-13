const CACHE = "psx-watch-v3"; // bumped again to force this fix
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for OUR OWN files only. Cross-origin requests (like the JSONP
// call to your Apps Script URL) must be left completely alone — intercepting
// them here re-triggers the same CORS problem we already fixed, since a
// service worker's own fetch() is subject to CORS even when a plain <script>
// tag load wouldn't be.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) {
    return; // let the browser handle this one natively, untouched
  }
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
