const CACHE_NAME = 'mon-app-v5';

const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './qrcode.min.js'   // ← ajouté ici, dans la bonne liste
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(c => c.addAll(ASSETS))
            .then(() => self.skipWaiting()) // ← force l'activation immédiate
    );
});

self.addEventListener('activate', (e) => {
    // Supprime les anciens caches
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim()) // ← prend le contrôle immédiatement
    );
});

self.addEventListener('fetch', (e) => {
    // Fichiers locaux : cache en priorité
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});