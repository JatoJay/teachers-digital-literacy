const STATIC_CACHE = 'karatuai-static-v4'
const MODEL_CACHE = 'karatuai-model-cache-v4'
const MODEL_HOST = 'models.karatuai.com'
const PRECACHE = ['/', '/manifest.json', '/favicon.svg']

// Caches that earlier SW versions left behind. They are deleted on activate.
// v2 held entries that resolved to the internal Cloud Run port (:8080) on the
// custom domain — bumping the version forces a clean rebuild of the cache.
const LEGACY_CACHES = [
  'teachassist-v1',
  'karatuai-static-v1',
  'karatuai-static-v2',
  'karatuai-static-v3',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE).catch(() => undefined),
    ),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names
          .filter(
            (name) =>
              LEGACY_CACHES.includes(name) ||
              (name.startsWith('karatuai-static-') && name !== STATIC_CACHE),
          )
          .map((name) => caches.delete(name).catch(() => undefined)),
      )
      await self.clients.claim()
    })(),
  )
})

function isModelRequest(url) {
  return url.host === MODEL_HOST
}

function shouldHandle(request) {
  if (request.method !== 'GET') return false
  if (request.headers.has('range')) return false
  let url
  try {
    url = new URL(request.url)
  } catch {
    return false
  }
  // The AI model URL gets a dedicated path because it lives on a separate host
  // and is populated by the page's streaming download — not by the SW itself.
  if (isModelRequest(url)) return true
  if (url.origin !== self.location.origin) return false
  return true
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (!shouldHandle(request)) return

  let requestUrl
  try {
    requestUrl = new URL(request.url)
  } catch {
    return
  }

  // Model: serve from the cache the page populated via streaming download.
  // We re-add CORS headers explicitly because (a) the cached entry may have
  // been stored without them and (b) MediaPipe issues this fetch with cors
  // mode, so the response we hand back must satisfy the cross-origin check.
  if (isModelRequest(requestUrl)) {
    event.respondWith(
      (async () => {
        try {
          const cache = await caches.open(MODEL_CACHE)
          const cached = await cache.match(request.url)
          if (!cached) return fetch(request)

          const headers = new Headers(cached.headers)
          headers.set('Access-Control-Allow-Origin', '*')
          headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
          return new Response(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers,
          })
        } catch {
          return fetch(request)
        }
      })(),
    )
    return
  }

  // SPA navigations: network-first, fall back to the cached app shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request)
        } catch {
          const shell = await caches.match('/index.html')
          if (shell) return shell
          const root = await caches.match('/')
          if (root) return root
          return new Response('Offline', { status: 503, statusText: 'Offline' })
        }
      })(),
    )
    return
  }

  // Static assets: cache-first, populate cache on first successful network hit.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request)
      if (cached) return cached
      try {
        const response = await fetch(request)
        if (response.ok && response.type === 'basic' && response.status === 200) {
          const clone = response.clone()
          caches
            .open(STATIC_CACHE)
            .then((cache) => cache.put(request, clone).catch(() => undefined))
        }
        return response
      } catch (err) {
        const fallback = await caches.match(request)
        if (fallback) return fallback
        throw err
      }
    })(),
  )
})
