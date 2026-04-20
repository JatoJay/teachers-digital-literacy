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

async function readCachedBlob(cache: Cache): Promise<Blob | null> {
  const cached = await cache.match(MODEL_URL)
  if (!cached) return null

  try {
    const blob = await cached.blob()
    if (!isValidSize(blob.size)) {
      console.warn(`Cached model invalid (${blob.size} bytes, expected ${EXPECTED_SIZE}), evicting`)
      await cache.delete(MODEL_URL)
      return null
    }
    return blob
  } catch (err) {
    console.warn('Failed to read cached model, evicting:', err)
    await cache.delete(MODEL_URL)
    return null
  }
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
// ever holding all 1.87 GB in the JS heap. The body is tee'd: one branch is
// drained just for byte counting (so we can report progress) while the other
// is handed to cache.put as the body of a streaming Response. On phones with
// limited per-tab memory (notably iOS Safari and 3 GB Android devices) this
// is the difference between a successful install and a silently killed tab.
async function streamDownloadIntoCache(
  cache: Cache,
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
  const [counterStream, cacheStream] = response.body.tee()

  onProgress?.(2)

  let received = 0
  const counterPromise = (async () => {
    const reader = counterStream.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.byteLength
      if (total > 0) {
        onProgress?.(Math.min(98, Math.round((received / total) * 95) + 2))
      }
    }
  })()

  const cacheHeaders = new Headers({ 'Content-Type': 'application/octet-stream' })
  if (total > 0) cacheHeaders.set('Content-Length', String(total))

  const cachePromise = cache.put(
    MODEL_URL,
    new Response(cacheStream, { headers: cacheHeaders }),
  )

  try {
    await Promise.all([counterPromise, cachePromise])
  } catch (err) {
    // A network drop or quota error mid-stream can leave a partial entry that
    // isModelCached() would later report as valid by Content-Length alone.
    await cache.delete(MODEL_URL).catch(() => undefined)
    throw err
  }

  if (total > 0 && received !== total) {
    await cache.delete(MODEL_URL).catch(() => undefined)
    throw new Error(`Truncated download: ${received} of ${total} bytes`)
  }

  const cached = await readCachedBlob(cache)
  if (!cached) {
    throw new Error('Model downloaded but could not be read back from cache')
  }
  return cached
}

export async function getCachedModelUrl(
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (!('caches' in window)) {
    const blob = await downloadModel(onProgress)
    return URL.createObjectURL(blob)
  }

  await ensurePersistentStorage()
  await evictLegacyCaches()
  const cache = await caches.open(CACHE_NAME)

  const cached = await readCachedBlob(cache)
  if (cached) {
    onProgress?.(100)
    return URL.createObjectURL(cached)
  }

  let blob: Blob
  try {
    blob = await streamDownloadIntoCache(cache, onProgress)
  } catch (streamErr) {
    // Browsers that mishandle streaming Response bodies inside cache.put fall
    // back to the in-heap path. Costs a fresh fetch but keeps the worst-case
    // behavior no worse than before this change.
    console.warn('Streaming download failed, retrying with in-memory path:', streamErr)
    blob = await downloadModel(onProgress)
    await tryCacheBlob(cache, blob)
  }

  onProgress?.(100)
  return URL.createObjectURL(blob)
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
