const CACHE_NAME = 'karatuai-model-cache-v4'
const LEGACY_CACHE_NAMES = [
  'karatuai-model-cache-v1',
  'karatuai-model-cache-v2',
  'karatuai-model-cache-v3',
]
const MODEL_URL = 'https://models.karatuai.com/gemma-4-E2B-it-web.task'
const EXPECTED_SIZE = 2_003_697_664

async function evictLegacyCaches(): Promise<void> {
  if (!('caches' in window)) return
  await Promise.all(
    LEGACY_CACHE_NAMES.map((name) => caches.delete(name).catch(() => undefined)),
  )
}

async function ensurePersistentStorage(): Promise<void> {
  if (!navigator.storage?.persist) return
  try {
    const already = await navigator.storage.persisted?.()
    if (already) return
    const granted = await navigator.storage.persist()
    if (!granted) {
      console.warn(
        'Persistent storage was not granted — the cached model may be evicted between sessions.',
      )
    }
  } catch (err) {
    console.warn('Could not request persistent storage:', err)
  }
}

function isValidSize(size: number): boolean {
  return size === EXPECTED_SIZE
}

// Validates a cached entry by reading just the Content-Length header. We
// deliberately never call .blob() on the cached Response — that would try to
// materialize the full ~1.87 GB into JS heap and silently OOM on iOS Safari
// (tab cap ~1.5 GB) and low-RAM Android. The streaming downloader always sets
// Content-Length when it stores the entry, so the header check is sufficient.
async function isCachedAndValid(cache: Cache): Promise<boolean> {
  const cached = await cache.match(MODEL_URL)
  if (!cached) return false
  const len = parseInt(cached.headers.get('content-length') ?? '0', 10)
  if (len > 0 && isValidSize(len)) return true
  // Pre-streaming entries lacked Content-Length; treat them as invalid rather
  // than fall back to a heap-busting blob read.
  await cache.delete(MODEL_URL).catch(() => undefined)
  return false
}

async function downloadModel(
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const response = await fetch(MODEL_URL)
  if (!response.ok) {
    throw new Error(`Model download failed: HTTP ${response.status}`)
  }
  if (!response.body) {
    throw new Error('Model download has no response body')
  }

  const total = parseInt(response.headers.get('content-length') ?? '0', 10)
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0

  onProgress?.(2)

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.byteLength
    if (total > 0) {
      onProgress?.(Math.min(98, Math.round((received / total) * 95) + 2))
    }
  }

  if (total > 0 && received !== total) {
    throw new Error(`Truncated download: ${received} of ${total} bytes`)
  }

  const blob = new Blob(chunks as BlobPart[], { type: 'application/octet-stream' })
  if (!isValidSize(blob.size)) {
    throw new Error(`Downloaded model size mismatch (${blob.size} bytes, expected ${EXPECTED_SIZE}) — likely truncated`)
  }
  return blob
}

async function tryCacheBlob(cache: Cache, blob: Blob): Promise<void> {
  try {
    const headers = new Headers({
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(blob.size),
    })
    await cache.put(MODEL_URL, new Response(blob, { headers }))
  } catch (err) {
    console.warn('Failed to cache model (will re-download next session):', err)
  }
}

// Streams the model body straight from the network into Cache Storage without
// ever holding all 1.87 GB in the JS heap. A TransformStream sits between the
// network and the cache so we can count bytes for progress without tee-ing the
// stream — tee leaves chunks queued in memory whenever one branch reads ahead
// of the other, which on a 1.87 GB file was enough to OOM phones (notably iOS
// Safari and 3 GB Android devices). pipeThrough applies natural backpressure
// so memory stays flat for the whole transfer.
async function streamDownloadIntoCache(
  cache: Cache,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const response = await fetch(MODEL_URL)
  if (!response.ok) {
    throw new Error(`Model download failed: HTTP ${response.status}`)
  }
  if (!response.body) {
    throw new Error('Model download has no response body')
  }

  const total = parseInt(response.headers.get('content-length') ?? '0', 10)

  onProgress?.(2)

  let received = 0
  const progressTransform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      received += chunk.byteLength
      if (total > 0) {
        onProgress?.(Math.min(98, Math.round((received / total) * 95) + 2))
      }
      controller.enqueue(chunk)
    },
  })

  const trackedBody = response.body.pipeThrough(progressTransform)

  // Cache stores Content-Type / Content-Length only. CORS headers are added
  // back by the SW when it serves the cached response to MediaPipe, so the
  // cached entry doesn't need to preserve them itself.
  const cacheHeaders = new Headers()
  cacheHeaders.set(
    'Content-Type',
    response.headers.get('content-type') || 'application/octet-stream',
  )
  if (total > 0) cacheHeaders.set('Content-Length', String(total))

  try {
    await cache.put(
      MODEL_URL,
      new Response(trackedBody, {
        status: 200,
        statusText: 'OK',
        headers: cacheHeaders,
      }),
    )
  } catch (err) {
    await cache.delete(MODEL_URL).catch(() => undefined)
    throw err
  }

  if (total > 0 && received !== total) {
    await cache.delete(MODEL_URL).catch(() => undefined)
    throw new Error(`Truncated download: ${received} of ${total} bytes`)
  }

  if (!(await isCachedAndValid(cache))) {
    throw new Error(`Cached model failed validation after download (expected ${EXPECTED_SIZE} bytes)`)
  }
}

export async function getCachedModelUrl(
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (!('caches' in window)) {
    // Browsers without Cache API are rare on the platforms we target; the
    // blob path costs ~2 GB of JS heap and only desktops realistically survive.
    const blob = await downloadModel(onProgress)
    return URL.createObjectURL(blob)
  }

  await ensurePersistentStorage()
  await evictLegacyCaches()
  const cache = await caches.open(CACHE_NAME)

  if (await isCachedAndValid(cache)) {
    onProgress?.(100)
    // Returning the network URL (not a blob: URL) keeps the model out of JS
    // heap entirely. The service worker intercepts MediaPipe's fetch for this
    // URL and serves it from the cache we just populated.
    return MODEL_URL
  }

  try {
    await streamDownloadIntoCache(cache, onProgress)
    onProgress?.(100)
    return MODEL_URL
  } catch (streamErr) {
    console.warn('Streaming download failed, retrying with in-memory path:', streamErr)
    const blob = await downloadModel(onProgress)
    await tryCacheBlob(cache, blob)
    onProgress?.(100)
    return URL.createObjectURL(blob)
  }
}

export async function isModelCached(): Promise<boolean> {
  if (!('caches' in window)) return false
  try {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(MODEL_URL)
    if (!cached) return false
    const len = parseInt(cached.headers.get('content-length') ?? '0', 10)
    if (len > 0) return isValidSize(len)
    const blob = await cached.blob()
    return isValidSize(blob.size)
  } catch {
    return false
  }
}

export async function clearModelCache(): Promise<void> {
  if ('caches' in window) {
    await caches.delete(CACHE_NAME)
  }
}

export { MODEL_URL }
