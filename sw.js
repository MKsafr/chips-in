self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const p = new URL(e.request.url).pathname;
  // Biarkan browser menangani langsung (jangan dibungkus SW) untuk SSE & API
  if (p === '/events' || p === '/api' || e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request));
});
