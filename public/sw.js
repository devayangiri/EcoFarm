// EcoFarm Production Service Worker (PWA)
const CACHE_NAME = "ecofarm-shell-v1";

const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

// Install Event: Pre-cache core app shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Intelligent routing
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  // 2. STRICT NETWORK-ONLY: Never cache commerce, API, dynamic auth, checkout, cart, messages, or SSE
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/checkout") ||
    url.pathname.startsWith("/cart") ||
    url.pathname.startsWith("/buyer/cart") ||
    url.pathname.startsWith("/messages") ||
    url.pathname.startsWith("/notifications") ||
    url.pathname.startsWith("/buyer/orders") ||
    url.pathname.startsWith("/farmer/orders") ||
    url.pathname.startsWith("/admin/orders") ||
    url.pathname.includes("/events")
  ) {
    return; // Passthrough directly to network
  }

  // 3. Cache-First for Immutable Static Assets (_next/static, icons, images)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. Network-First for Navigation / HTML Pages
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match("/");
          if (fallback) return fallback;
          return new Response("Offline — Please reconnect to the internet to access EcoFarm.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        })
    );
  }
});
