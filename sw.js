// ─── VERSION ────────────────────────────────────────────────────────────────
// Changez uniquement ce numéro à chaque déploiement.
// Le navigateur détectera la différence et déclenchera la mise à jour.
const CACHE_VERSION = 12;
const CACHE_NAME = `mon-app-v${CACHE_VERSION}`;

// ─── FICHIERS À METTRE EN CACHE ─────────────────────────────────────────────
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './qrcode.min.js'
];

// ─── INSTALL : mise en cache de la nouvelle version ─────────────────────────
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(c => c.addAll(ASSETS))
            .then(() => self.skipWaiting()) // prend la main sans attendre
    );
});

// ─── ACTIVATE : suppression des anciens caches + prise de contrôle ──────────
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(k => k !== CACHE_NAME)
                        .map(k => caches.delete(k))
                )
            )
            .then(() => self.clients.claim()) // contrôle tous les onglets ouverts
            .then(() => {
                // Force le rechargement de tous les onglets ouverts
                // pour qu'ils basculent sur la nouvelle version immédiatement
                return self.clients.matchAll({ type: 'window' }).then(clients => {
                    clients.forEach(client => client.navigate(client.url));
                });
            })
    );
});

// ─── FETCH : stratégie hybride ───────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Requêtes externes (Firebase, CDN, googleapis…) → NE PAS intercepter
    // Laisser le navigateur les gérer nativement pour éviter les erreurs
    if (url.origin !== self.location.origin) {
        return; // pas de e.respondWith() → le navigateur prend la main
    }

    // Fichiers HTML → réseau d'abord, cache en fallback
    if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
        e.respondWith(
            fetch(e.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                    return response;
                })
                .catch(() => caches.match(e.request))
        );
        return;
    }

    // Autres fichiers locaux (CSS, JS, images…) → cache d'abord, réseau en fallback
    e.respondWith(
        caches.match(e.request)
            .then(cached => cached || fetch(e.request))
    );
});
