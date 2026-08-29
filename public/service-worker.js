/* eslint-disable */
// TREXIO PWA Service Worker — Versioned Cache Management & Auto-Purge Engine
const APP_VERSION = "v3.3.0-20260801";
const CACHE_PREFIX = "trexio-pwa";

// Versioned Cache Buckets
const CURRENT_CACHES = {
  static: `${CACHE_PREFIX}-static-${APP_VERSION}`,
  dynamic: `${CACHE_PREFIX}-dynamic-${APP_VERSION}`,
  images: `${CACHE_PREFIX}-images-${APP_VERSION}`,
};

const EXPECTED_CACHE_NAMES = Object.values(CURRENT_CACHES);
const OFFLINE_URL = "/offline.html";

// Essential shell assets to pre-cache
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/logo-icon.svg",
  "/logo-icon-maskable.svg",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png"
];

// 1. Install Event — Precache essential static assets into versioned static bucket
self.addEventListener("install", (event) => {
  console.log(`[ServiceWorker] Installing version: ${APP_VERSION}`);
  event.waitUntil(
    caches.open(CURRENT_CACHES.static).then(async (cache) => {
      // Add essential assets with graceful individual error handling
      await Promise.all(
        PRECACHE_ASSETS.map(async (asset) => {
          try {
            await cache.add(asset);
          } catch (err) {
            console.warn(`[ServiceWorker] Could not precache asset ${asset}:`, err);
          }
        })
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. Activate Event — Purge all outdated cache buckets
self.addEventListener("activate", (event) => {
  console.log(`[ServiceWorker] Activating version: ${APP_VERSION}`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!EXPECTED_CACHE_NAMES.includes(cacheName)) {
            console.log(`[ServiceWorker] Purging outdated cache bucket: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "SW_VERSION_UPDATED",
            version: APP_VERSION,
            timestamp: Date.now(),
          });
        });
      });
    })
  );
});

// 3. Message Handling — Support on-demand skipWaiting, version queries & manual cache resets
self.addEventListener("message", (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "GET_VERSION":
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ version: APP_VERSION });
      } else if (event.source) {
        event.source.postMessage({ type: "SW_VERSION", version: APP_VERSION });
      }
      break;

    case "PURGE_OUTDATED_CACHES":
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => !EXPECTED_CACHE_NAMES.includes(key)).map((key) => caches.delete(key))
        );
      });
      break;

    default:
      break;
  }
});

// 4. Fetch Strategy Handler with Smart Versioning Guards
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // SECURITY RULE: Never cache API requests, sensitive endpoints, uploads, or payment flows
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/uploads/") ||
    url.pathname.includes("login") ||
    url.pathname.includes("register") ||
    url.pathname.includes("checkout") ||
    url.pathname.includes("payment") ||
    url.pathname.includes("admin") ||
    url.pathname.includes("super")
  ) {
    return;
  }

  // Navigation Requests (HTML Pages) -> Network First with Dynamic Cache & Offline Fallback Page
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseCopy = networkResponse.clone();
            caches.open(CURRENT_CACHES.dynamic).then((cache) => cache.put(req, responseCopy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(req).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match(OFFLINE_URL).then((offlinePage) => {
              if (offlinePage) return offlinePage;
              return caches.match("/index.html");
            });
          });
        })
    );
    return;
  }

  // UI Components & Core Code Bundles (JS, CSS, Web Fonts) -> Network First with Stale Cache Fallback
  if (
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".ttf") ||
    url.host.includes("fonts.googleapis.com") ||
    url.host.includes("fonts.gstatic.com") ||
    url.host.includes("fontshare.com")
  ) {
    event.respondWith(
      fetch(req)
        .then((networkResp) => {
          if (networkResp && networkResp.status === 200) {
            const respCopy = networkResp.clone();
            caches.open(CURRENT_CACHES.static).then((cache) => cache.put(req, respCopy));
          }
          return networkResp;
        })
        .catch(() => {
          return caches.match(req);
        })
    );
    return;
  }

  // Image Assets -> Stale-While-Revalidate Strategy in Versioned Image Cache
  if (
    url.pathname.startsWith("/images/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".gif") ||
    url.pathname.endsWith(".ico") ||
    url.host.includes("images.unsplash.com")
  ) {
    event.respondWith(
      caches.open(CURRENT_CACHES.images).then((cache) => {
        return cache.match(req).then((cached) => {
          const fetchPromise = fetch(req)
            .then((networkResp) => {
              if (networkResp && networkResp.status === 200) {
                cache.put(req, networkResp.clone());
              }
              return networkResp;
            })
            .catch(() => cached);

          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // Default fallback -> Network First with Dynamic Cache
  event.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp && resp.status === 200) {
          const respCopy = resp.clone();
          caches.open(CURRENT_CACHES.dynamic).then((c) => c.put(req, respCopy));
        }
        return resp;
      })
      .catch(() => caches.match(req))
  );
});

// 5. Push Notification Handler
self.addEventListener("push", (event) => {
  let data = { title: "Trexio — Adventure Marketplace", body: "Ada petualangan baru menunggumu!", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo-icon.svg",
      badge: "/logo-icon.svg",
      data: { url: data.url || "/" },
      vibrate: [100, 50, 100],
    })
  );
});

// 6. Notification Click Handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
