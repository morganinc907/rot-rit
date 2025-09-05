import { safeLocalStorage } from './ssr'
type CacheEntry<T> = { ts: number; ttl: number; data: T; version?: string }
const mem = new Map<string, CacheEntry<any>>()
export interface CacheOpts { ttlMs?: number; version?: string; memoryOnly?: boolean; ns?: string }
function lsKey(url: string, ns?: string) { return `${ns || 'rr'}::cache::${url}` }
export function getCached<T>(url: string, opts: CacheOpts = {}): T | null {
  const now = Date.now()
  const entry = mem.get(url) as CacheEntry<T> | undefined
  if (entry && (!opts.version || entry.version === opts.version) && (now - entry.ts) < (entry.ttl || 0)) return entry.data
  if (opts.memoryOnly) return null
  try {
    const ls = safeLocalStorage(); if (!ls) return null
    const raw = ls.getItem(lsKey(url, opts.ns)); if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry<T>
    if (opts.version && parsed.version !== opts.version) return null
    if ((now - parsed.ts) > (parsed.ttl || 0)) return null
    mem.set(url, parsed); return parsed.data
  } catch { return null }
}
export function setCached<T>(url: string, data: T, opts: CacheOpts = {}) {
  const ttl = opts.ttlMs ?? 5 * 60 * 1000; const entry: CacheEntry<T> = { ts: Date.now(), ttl, data, version: opts.version }
  mem.set(url, entry); if (!opts.memoryOnly) { try { const ls = safeLocalStorage(); if (ls) ls.setItem(lsKey(url, opts.ns), JSON.stringify(entry)) } catch {} }
}
export interface RetryOpts { retries?: number; minDelayMs?: number; maxDelayMs?: number; factor?: number }
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms)); const rand = (a:number,b:number)=>Math.floor(Math.random()*(b-a+1))+a
export async function fetchJsonCached<T>(url: string, fetchFn: typeof fetch, opts: CacheOpts = {}): Promise<T> {
  const cached = getCached<T>(url, opts); if (cached) return cached
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort('timeout'), 10_000)
  const res = await fetchFn(url, { signal: ctrl.signal, cache: 'no-store' } as any); clearTimeout(timer)
  if (!res.ok) throw new Error(`HTTP ${res.status}`); const data = await res.json() as T; setCached(url, data, opts); return data
}
export async function fetchJsonCachedWithRetry<T>(url: string, fetchFn: typeof fetch, cache: CacheOpts = {}, retry: RetryOpts = {}): Promise<T> {
  const cached = getCached<T>(url, cache); if (cached) return cached
  const retries = retry.retries ?? 2, minDelay = retry.minDelayMs ?? 300, maxDelay = retry.maxDelayMs ?? 2000, factor = retry.factor ?? 2
  let attempt = 0, lastErr: any = null
  while (attempt <= retries) {
    try { const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort('timeout'), 10_000)
      const res = await fetchFn(url, { signal: ctrl.signal, cache: 'no-store' } as any); clearTimeout(timer)
      if (!res.ok) throw new Error(`HTTP ${res.status}`); const data = await res.json() as T; setCached(url, data, cache); return data
    } catch (e) { lastErr = e; if (attempt == retries) break; const base = Math.min(maxDelay, minDelay * (factor**attempt)); const wait = rand(base, base+200); await sleep(wait) }
    attempt++
  }
  const stale = getCached<T>(url, { ...cache, ttlMs: Number.MAX_SAFE_INTEGER }); if (stale) return stale; throw lastErr
}
export async function fetchGhPagesVersion(baseUrl: string, fetchFn: typeof fetch): Promise<string | undefined> {
  const url = `${baseUrl.replace(/\/$/, '')}/index.json`
  try { const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort('timeout'), 5000)
    const res = await fetchFn(url, { signal: ctrl.signal, cache: 'no-store' } as any); clearTimeout(timer)
    if (!res.ok) return undefined; const data = await res.json(); return (data && (data.ts || data.version)) || undefined
  } catch { return undefined }
}
export function invalidateCache(ns?: string, urlPrefix?: string) {
  if (urlPrefix) { for (const k of Array.from((mem as any).keys())) { if (String(k).startsWith(urlPrefix)) (mem as any).delete(k) } } else { (mem as any).clear() }
  try { const ls = safeLocalStorage(); if (!ls) return; const prefix = `${ns || 'rr'}::cache::`
    for (let i = ls.length - 1; i >= 0; i--) { const k = ls.key(i); if (!k) continue; if (k.startsWith(prefix) && (!urlPrefix || k.endsWith(urlPrefix) || k.includes(urlPrefix))) ls.removeItem(k) }
  } catch {}
}
