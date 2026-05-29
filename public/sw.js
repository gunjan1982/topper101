const CACHE_NAME = 'topper101-cache-v1';
const PAGES_CACHE = 'topper101-pages-v1';
const STATIC_CACHE = 'topper101-static-v1';
const PDF_CACHE = 'topper101-pdf-v1';

// Pre-cache public assets and core pages
const PRECACHE_ASSETS = [
  '/',
  '/guide',
  '/favicon.ico',
  '/icon.svg',
  '/favicon-32.png'
];

// Install Service Worker and pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![STATIC_CACHE, PAGES_CACHE, PDF_CACHE].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch helper to download and cache the full PDF (stripping Range header)
async function fetchAndCacheFullPdf(request, cacheKey) {
  const headers = new Headers(request.headers);
  headers.delete('range');

  const isCrossOrigin = !request.url.startsWith(self.location.origin);

  const cleanRequest = new Request(request.url, {
    method: 'GET',
    headers: headers,
    mode: isCrossOrigin ? 'cors' : 'same-origin',
    credentials: isCrossOrigin ? 'same-origin' : 'include',
    redirect: 'follow'
  });

  const response = await fetch(cleanRequest);
  if (response.ok) {
    const cache = await caches.open(PDF_CACHE);
    await cache.put(cacheKey, response.clone());
    return response;
  }
  return response;
}

// Handle PDF caching and slice responses for range requests
async function handlePdfRequest(event) {
  const request = event.request;
  const cacheKey = request.url.split('#')[0]; // Strip URL hash
  const cache = await caches.open(PDF_CACHE);

  let response = await cache.match(cacheKey);
  if (!response) {
    try {
      response = await fetchAndCacheFullPdf(request, cacheKey);
    } catch (err) {
      console.error('Failed to fetch and cache PDF:', err);
      return new Response('Offline: PDF not cached', { status: 503 });
    }
  }

  // Intercept and handle Range header for custom iframe rendering
  const rangeHeader = request.headers.get('range');
  if (rangeHeader && response.ok) {
    try {
      const blob = await response.blob();
      const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? parseInt(match[2], 10) : blob.size - 1;
        const slicedBlob = blob.slice(start, end + 1);

        return new Response(slicedBlob, {
          status: 206,
          statusText: 'Partial Content',
          headers: {
            'Content-Type': response.headers.get('Content-Type') || 'application/pdf',
            'Content-Range': `bytes ${start}-${end}/${blob.size}`,
            'Content-Length': slicedBlob.size,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=31536000'
          }
        });
      }
    } catch (e) {
      console.error('Error slicing PDF blob for range request:', e);
    }
  }

  return response;
}

// Network-first with fallback to cache for Next.js routes/dashboards
async function handlePageRequest(event) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(event.request);
    if (response.ok) {
      await cache.put(event.request.url, response.clone());
      return response;
    }
    const cachedResponse = await cache.match(event.request.url);
    if (cachedResponse) return cachedResponse;
    return response;
  } catch (err) {
    const cachedResponse = await cache.match(event.request.url);
    if (cachedResponse) return cachedResponse;
    // Fallback to pre-cached /guide page if requested page is not in cache
    return caches.match('/guide') || new Response('Offline: Page not cached', { status: 503 });
  }
}

// Cache-First (Next.js versioned static) / Stale-While-Revalidate (other assets)
async function handleStaticRequest(event) {
  const url = new URL(event.request.url);
  const cache = await caches.open(STATIC_CACHE);

  if (url.pathname.startsWith('/_next/static/')) {
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) return cachedResponse;

    const response = await fetch(event.request);
    if (response.ok) {
      await cache.put(event.request, response.clone());
    }
    return response;
  }

  const cachedResponse = await cache.match(event.request);
  const fetchPromise = fetch(event.request).then(async (response) => {
    if (response.ok) {
      await cache.put(event.request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cachedResponse || fetchPromise;
}

// Fetch event listener to route requests through appropriate caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip APIs that require network, HMR web sockets, telemetry, and analytics
  if (
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/api/payments') ||
    url.pathname.startsWith('/api/analytics') ||
    url.pathname.includes('/_next/webpack-hmr') ||
    url.hostname.includes('posthog') ||
    url.hostname.includes('google-analytics') ||
    url.hostname.includes('razorpay')
  ) {
    return;
  }

  // 1. PDF requests (past papers, textbooks, local/cross-origin)
  const isPdf =
    url.pathname.includes('/api/pdf/') ||
    url.pathname.endsWith('.pdf') ||
    url.pathname.includes('past-papers') ||
    (url.hostname.includes('supabase') && url.pathname.includes('/storage/v1/object/'));

  if (isPdf) {
    event.respondWith(handlePdfRequest(event));
    return;
  }

  // 2. Navigation / Page layout HTML requests
  const isNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));

  if (isNavigation) {
    event.respondWith(handlePageRequest(event));
    return;
  }

  // 3. Static assets
  const isStatic =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.match(/\.(css|js|woff2?|png|svg|jpg|jpeg|gif|ico|json)$/);

  if (isStatic) {
    event.respondWith(handleStaticRequest(event));
    return;
  }
});
