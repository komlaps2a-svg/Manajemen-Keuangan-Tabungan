const CACHE_NAME = 'finance-pos-cache-v26';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png'
];

// Install Service Worker & Simpan Cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Membuka cache...');
        return cache.addAll(urlsToCache);
      })
  );
});

// Bersihkan Cache Lama jika ada Update
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Cegat Request Jaringan & Berikan Cache saat Offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika ada di cache, berikan cache. Jika tidak, ambil dari internet.
        return response || fetch(event.request).catch(() => {
            // Logika fallback jika benar-benar tidak ada internet dan file belum di-cache
            console.warn('Akses ditolak: File belum masuk cache dan Anda sedang offline.');
        });
      })
  );
});
