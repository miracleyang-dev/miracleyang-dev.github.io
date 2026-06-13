/* Chronicle Service Worker
 * Bump CACHE_VERSION manually on each release so old clients flush their caches.
 */
const CACHE_VERSION = '20260613-1';
const STATIC_CACHE = CACHE_VERSION + '-static';
const DATA_CACHE = CACHE_VERSION + '-data';
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style/chronicle.css',
  '/style/chronicle.js',
  '/favicon.svg',
  '/manifest.json'
];

const CROSS_ORIGIN_HOSTS = [
  'fonts.googleapis.cn',
  'fonts.gstatic.cn',
  'cdn.bootcdn.net'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== STATIC_CACHE && key !== DATA_CACHE && key !== RUNTIME_CACHE) {
          return caches.delete(key);
        }
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isDataRequest(url) {
  return url.pathname.indexOf('/database/') !== -1 && url.pathname.endsWith('.json');
}

function isCrossOriginCacheable(url) {
  return CROSS_ORIGIN_HOSTS.indexOf(url.hostname) !== -1;
}

function networkFirst(request, cacheName) {
  return caches.open(cacheName).then(function (cache) {
    return fetch(request).then(function (response) {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(function () {
      return cache.match(request);
    });
  });
}

function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
        return response;
      });
    });
  });
}

function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(request).then(function (cached) {
      var networkPromise = fetch(request).then(function (response) {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
        return response;
      }).catch(function () { return cached; });
      return cached || networkPromise;
    });
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (isDataRequest(url)) {
      event.respondWith(networkFirst(request, DATA_CACHE));
      return;
    }
    event.respondWith(
      cacheFirst(request, STATIC_CACHE).catch(function () {
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
      })
    );
    return;
  }

  if (isCrossOriginCacheable(url)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});
