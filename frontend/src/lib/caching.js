import { safeLocalStorage } from './ssr'

const mem = new Map()

function lsKey(url, ns) {
  return `${ns || 'rr'}::cache::${url}`
}

export function getCached(url, opts = {}) {
  const now = Date.now()
  const entry = mem.get(url)
  
  if (entry && (!opts.version || entry.version === opts.version) && (now - entry.ts) < (entry.ttl || 0)) {
    return entry.data
  }
  
  if (opts.memoryOnly) return null
  
  try {
    const ls = safeLocalStorage()
    if (!ls) return null
    
    const raw = ls.getItem(lsKey(url, opts.ns))
    if (!raw) return null
    
    const parsed = JSON.parse(raw)
    if (opts.version && parsed.version !== opts.version) return null
    if ((now - parsed.ts) > (parsed.ttl || 0)) return null
    
    mem.set(url, parsed)
    return parsed.data
  } catch {
    return null
  }
}

export function setCached(url, data, opts = {}) {
  const ttl = opts.ttlMs ?? 5 * 60 * 1000
  const entry = { ts: Date.now(), ttl, data, version: opts.version }
  
  mem.set(url, entry)
  
  if (!opts.memoryOnly) {
    try {
      const ls = safeLocalStorage()
      if (ls) ls.setItem(lsKey(url, opts.ns), JSON.stringify(entry))
    } catch {}
  }
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms))
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a

export async function fetchJsonCached(url, fetchFn, opts = {}) {
  const cached = getCached(url, opts)
  if (cached) return cached
  
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort('timeout'), 10_000)
  
  const res = await fetchFn(url, { signal: ctrl.signal, cache: 'no-store' })
  clearTimeout(timer)
  
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  
  const data = await res.json()
  setCached(url, data, opts)
  return data
}

export async function fetchJsonCachedWithRetry(url, fetchFn, opts = {}, retry = {}) {
  const { retries = 3, minDelayMs = 100, maxDelayMs = 2000, factor = 2 } = retry
  
  let lastError
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchJsonCached(url, fetchFn, opts)
    } catch (e) {
      lastError = e
      if (i < retries) {
        const delay = Math.min(minDelayMs * Math.pow(factor, i), maxDelayMs)
        await sleep(rand(delay / 2, delay))
      }
    }
  }
  throw lastError
}

export async function fetchGhPagesVersion(baseUrl, fetchFn = fetch) {
  try {
    const versionUrl = `${baseUrl.replace(/\/$/, '')}/index.json`
    const res = await fetchFn(versionUrl, { cache: 'no-store' })
    if (!res.ok) return undefined
    const data = await res.json()
    return data.ts?.toString()
  } catch {
    return undefined
  }
}

export function invalidateCache(ns, urlPattern) {
  const prefix = `${ns || 'rr'}::cache::`
  
  // Clear memory cache
  for (const [key] of mem.entries()) {
    if (!urlPattern || key.includes(urlPattern)) {
      mem.delete(key)
    }
  }
  
  // Clear localStorage cache
  try {
    const ls = safeLocalStorage()
    if (!ls) return
    
    const keysToRemove = []
    for (let i = 0; i < ls.length; i++) {
      const key = ls.key(i)
      if (key && key.startsWith(prefix)) {
        if (!urlPattern || key.includes(urlPattern)) {
          keysToRemove.push(key)
        }
      }
    }
    
    keysToRemove.forEach(key => ls.removeItem(key))
  } catch {}
}