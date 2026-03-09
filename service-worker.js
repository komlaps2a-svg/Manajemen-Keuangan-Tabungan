const CACHE_NAME = 'finance-Pay-v28.2'; // Nama cache di-update biar mesin langsung ngereset

// 1. Masukkan SEMUA link luar (CDN) ke sini biar langsung di-download saat pertama buka web
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
  'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// Tahap Install: Simpan semua file dan CDN ke Cache HP
self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Menyimpan inti aplikasi & CDN ke Cache...');
        // Pakai trik ini supaya kalau ada 1 CDN lemot, proses cache yang lain gak batal
        return Promise.allSettled(
          urlsToCache.map(url => cache.add(url).catch(err => console.log('Gagal cache:', url, err)))
        );
      })
  );
});

// Tahap Activate: Sapu bersih cache versi lama
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
    }).then(() => self.clients.claim()) 
  );
});

// Tahap Fetch: Network First, Fallback to Cache
self.addEventListener('fetch', event => {
  // Abaikan request aneh dari browser extension, cuma fokus ke http/https
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // FIX: Syarat 'response.type !== basic' DIGUGURKAN. 
        // Sekarang CDN dari luar (CORS) bisa masuk ke cache dinamis.
        if (!response || response.status !== 200) {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // Mode pesawat / Sinyal putus? Mesin langsung nyomot dari Cache lokal!
        return caches.match(event.request);
      })
  );
});
