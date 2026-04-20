const CACHE_NAME = 'mon-app-v3'; // CHANGEZ LE NOM ICI (v3) pour forcer le navigateur à oublier l'ancien bug
const ASSETS = ['./', './index.html', './style.css', './script.js', './manifest.json'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))));
});

// CETTE PARTIE EST LA PLUS IMPORTANTE
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Si c'est dans le cache (fichiers locaux), on le rend.
            // Si c'est une URL externe (Google QR), on utilise obligatoirement le réseau (fetch).
            return response || fetch(event.request).catch(() => {
                // Option de secours si vraiment hors-ligne
                return null;
            });
        })
    );
});
