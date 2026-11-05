
// Invoice X Pro Technology — PWA + Firebase Push Service Worker

const CACHE_VERSION = "23";
const CACHE_NAME = `ixp-cache-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html"
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline — Invoice X Pro</title>
<style>
body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  padding: 24px;
  background: #F7F4EC;
  color: #0F1A2E;
  font-family: sans-serif;
}
h1 { font-size: 22px; }
p {
  color: rgba(15,26,46,.6);
  max-width: 34ch;
  font-size: 14px;
  line-height: 1.5;
}
button {
  margin-top: 20px;
  background: #0F1A2E;
  color: #FDFCF8;
  border: 0;
  padding: 12px 24px;
  border-radius: 999px;
  font-weight: 600;
}
</style>
</head>
<body>
<h1>You're offline</h1>
<p>Invoice X Pro needs a connection to sign in and sync client records. Reconnect and try again.</p>
<button onclick="location.reload()">Retry</button>
</body>
</html>`;

const NEVER_CACHE_HOSTS = [
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "firestore.googleapis.com",
  "www.googleapis.com",
  "fcm.googleapis.com"
];

// INSTALL
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

// ACTIVATE
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key =>
              key.startsWith("ixp-cache-") &&
              key !== CACHE_NAME
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// UPDATE MESSAGE
self.addEventListener("message", event => {
  if (
    event.data === "SKIP_WAITING" ||
    event.data?.type === "SKIP_WAITING"
  ) {
    self.skipWaiting();
  }
});

// FETCH / OFFLINE SUPPORT
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (
    NEVER_CACHE_HOSTS.some(host =>
      url.hostname.includes(host)
    )
  ) {
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) return cached;

          return fetch(request)
            .then(response => {
              if (response.ok) {
                const copy = response.clone();

                event.waitUntil(
                  caches.open(CACHE_NAME)
                    .then(cache => cache.put(request, copy))
                );
              }

              return response;
            })
            .catch(() => {
              if (request.mode === "navigate") {
                return new Response(OFFLINE_HTML, {
                  headers: {
                    "Content-Type": "text/html"
                  }
                });
              }

              return Response.error();
            });
        })
    );

    return;
  }

  // Other external GET resources
  event.respondWith(
    caches.open(CACHE_NAME)
      .then(cache =>
        cache.match(request).then(cached => {
          const network = fetch(request)
            .then(response => {
              if (response.ok) {
                event.waitUntil(
                  cache.put(request, response.clone())
                );
              }

              return response;
            })
            .catch(() => cached);

          return cached || network;
        })
      )
  );
});

// BACKGROUND PUSH NOTIFICATIONS
self.addEventListener("push", event => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = {
      notification: {
        body: event.data ? event.data.text() : ""
      }
    };
  }

  const notificationData =
    payload.notification || payload.data || {};

  const title =
    notificationData.title || "Invoice X Pro";

  const options = {
    body:
      notificationData.body ||
      "You have a new notification.",

    icon: "./icon-192.png",
    badge: "./icon-192.png",

    data: {
      url:
        payload.fcmOptions?.link ||
        payload.webpush?.fcmOptions?.link ||
        "./index.html"
    },

    tag: "ixp-push-" + Date.now(),
    renotify: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// NOTIFICATION CLICK
self.addEventListener("notificationclick", event => {
  event.notification.close();

  const target =
    event.notification.data?.url || "./index.html";

  event.waitUntil(
    self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(clients => {

      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(target);
      }
    })
  );
});
  
