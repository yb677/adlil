const CACHE_NAME = 'mon-app-vFINAL'; // Changez encore le nom ici
const ASSETS = ['./', './index.html', './style.css', './script.js', './manifest.json'];
const CACHE_FILES = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/qrcode.min.js',   // ← ajoute cette ligne
    '/manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', (event) => {
    // Si la requête est pour une image externe (QR), on utilise le réseau en priorité
    if (event.request.url.includes('://qrserver.com') || event.request.url.includes('googleapis')) {
        event.respondWith(fetch(event.request));
    } else {
        // Pour nos fichiers locaux, on utilise le cache
        event.respondWith(
            caches.match(event.request).then(response => response || fetch(event.request))
        );
    }
});
