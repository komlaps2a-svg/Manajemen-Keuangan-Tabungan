const CACHE_NAME = 'finance-Pay-v28.6';

// 1A. FILE INTI (HARGA MATI): Jika 1 saja gagal, Service Worker Batal Instal!
const coreUrls = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png' // Wajib untuk Splash Screen PWA di HP
];

// 1B. FILE EKSTERNAL (TOLERANSI): Boleh gagal saat instalasi, akan disusul nanti.
const cdnUrls = [
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
  'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// Tahap Install: Pemisahan Logika Penyimpanan
self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Menyimpan inti aplikasi ke Cache...');
      
      // Gunakan cache.addAll (Promise.all) agar instalasi GAGAL jika file HTML tidak terunduh
      const cacheCore = cache.addAll(coreUrls);
      
      // Gunakan Promise.allSettled HANYA untuk CDN. Gagal? Abaikan.
      const cacheCdns = Promise.allSettled(
        cdnUrls.map(url => fetch(url, { mode: 'no-cors' }) // Cegah blokir CORS saat pre-cache
          .then(res => cache.put(url, res))
          .catch(err => console.warn('CDN ditunda:', url))
        )
      );

      return Promise.all([cacheCore, cacheCdns]);
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

// Tahap Fetch: Network First, Fallback to Cache (Tahan Banting)
self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Simpan ke cache jika server mengembalikan respons sukses absolut
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          return response;
        }
        // Jika jaringan terhubung tapi timeout atau server error (504/500), 
        // paksa mesin turun ke Cache Lokal alih-alih menampilkan layar rusak.
        // Penambahan 'ignoreSearch: true' adalah harga mati untuk PWA.
        return caches.match(event.request, { ignoreSearch: true }).then(cached => {
            return cached || response;
        });
      })
      .catch(() => {
        // Mode pesawat murni. Wajib menggunakan 'ignoreSearch: true' untuk menghindari 
        // kegagalan pencocokan URL akibat parameter ekstra dari sistem operasi.
        return caches.match(event.request, { ignoreSearch: true });
      })
  );
});
