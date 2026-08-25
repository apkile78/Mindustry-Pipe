/*
 * Cross-origin isolation service worker for static hosts such as GitHub Pages.
 * It adds the COOP/COEP headers required by browsers before SharedArrayBuffer,
 * WebAssembly threads, or pthread-backed TeaVM/libGDX builds can run.
 */
(() => {
  const COOP = 'same-origin';
  const COEP = 'require-corp';

  if (typeof window !== 'undefined') {
    const swUrl = new URL(document.currentScript?.getAttribute('src') || 'coi-serviceworker.js', window.location.href);

    if (!window.isSecureContext) {
      console.warn('[coi-serviceworker] Cross-origin isolation requires HTTPS or localhost.');
      return;
    }

    if (window.crossOriginIsolated) return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(swUrl, { scope: './' }).then((registration) => {
        if (registration.active && !navigator.serviceWorker.controller) {
          window.location.reload();
        }
      }).catch((error) => {
        console.error('[coi-serviceworker] Registration failed:', error);
      });
    }
    return;
  }

  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener('fetch', (event) => {
    if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;

    event.respondWith((async () => {
      const response = await fetch(event.request);
      const headers = new Headers(response.headers);
      headers.set('Cross-Origin-Opener-Policy', COOP);
      headers.set('Cross-Origin-Embedder-Policy', COEP);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    })());
  });
})();
