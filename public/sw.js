// opssp-schedule Service Worker
const CACHE_NAME = 'opssp-schedule-v6';
const BASE = '/handys-schedule';

const ASSETS = [
  `${BASE}/`,
  `${BASE}/icon-192.png`,
  `${BASE}/icon-512.png`,
  `${BASE}/manifest.json`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first strategy: 항상 최신 코드 받기, 오프라인일 때만 캐시
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Supabase/API 요청은 캐시 안 함 (항상 네트워크)
  if (req.url.includes('supabase.co') || req.url.includes('api.')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        // 성공한 응답만 캐시
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || Response.error()))
  );
});
