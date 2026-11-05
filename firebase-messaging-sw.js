/* =========================================================
   INVOICE X PRO TECHNOLOGY
   Firebase Cloud Messaging Service Worker
   Project: Invoice X Pro Technology RRM
   ========================================================= */

// Firebase SDK
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js"
);

// Firebase configuration
firebase.initializeApp({
  apiKey: "AIzaSyB_wmCZ7i8ls7AIaqklmXYdpWgbSOMdfvw",
  authDomain: "invoice-x-pro-technology-rrm.firebaseapp.com",
  projectId: "invoice-x-pro-technology-rrm",
  storageBucket: "invoice-x-pro-technology-rrm.firebasestorage.app",
  messagingSenderId: "1076554149675",
  appId: "1:1076554149675:web:7f118ee7a42e4910cedf6e",
  measurementId: "G-BXETKX480W"
});

// Initialize Firebase Messaging
const messaging = firebase.messaging();

/* =========================================================
   BACKGROUND PUSH NOTIFICATIONS
   ========================================================= */

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[Invoice X Pro] Background message received:",
    payload
  );

  const title =
    payload.notification?.title ||
    payload.data?.title ||
    "Invoice X Pro Technology";

  const options = {
    body:
      payload.notification?.body ||
      payload.data?.body ||
      "You have a new notification.",

    icon: "./favicon.png",
    badge: "./favicon.png",

    tag:
      payload.data?.notificationId ||
      "invoice-x-pro-notification",

    renotify: true,

    data: {
      url: payload.data?.url || "./",
      notificationId: payload.data?.notificationId || null
    }
  };

  return self.registration.showNotification(title, options);
});

/* =========================================================
   NOTIFICATION CLICK HANDLING
   ========================================================= */

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "./",
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((windowClients) => {

      for (const client of windowClients) {
        if (
          client.url.startsWith(self.location.origin) &&
          "focus" in client
        ) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});

console.log(
  "[Invoice X Pro] Firebase Messaging Service Worker loaded."
);
    
