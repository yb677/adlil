self.addEventListener('install', (e) => {
  console.log('Service Worker installé');
});

self.addEventListener('fetch', (e) => {
  // Permet à l'application de se charger
  e.respondWith(fetch(e.request));
});
