import type { Address } from 'viem'
import { fetchJsonCached, fetchJsonCachedWithRetry, fetchGhPagesVersion, type CacheOpts, type RetryOpts } from './caching'

export type FlatDeployments = Record<string, Address>
export type PerChainDeployments = Record<number, FlatDeployments>
export type Deployments = FlatDeployments | PerChainDeployments
export interface FetchOpts<T = unknown> { baseUrl?: string; fallback?: () => Promise<{ default?: T } | T>; fetchFn?: typeof fetch; signal?: AbortSignal }

export async function loadDeployments(opts: FetchOpts<Deployments>, cache: CacheOpts = {}, retry?: RetryOpts): Promise<Deployments> {
  const { baseUrl } = opts; if (!baseUrl && !opts.fallback) throw new Error('baseUrl or fallback required')
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/deploy.output.json` : undefined
  const version = baseUrl ? await fetchGhPagesVersion(baseUrl, opts.fetchFn ?? fetch) : undefined
  try { return await (retry ? fetchJsonCachedWithRetry<Deployments>(url!, opts.fetchFn ?? fetch, { ...cache, version }, retry) : fetchJsonCached<Deployments>(url!, opts.fetchFn ?? fetch, { ...cache, version })) }
  catch (e) { if (opts.fallback) { const mod = await opts.fallback(); return (mod as any).default ?? (mod as any) } throw e }
}
export function isPerChain(d: Deployments): d is PerChainDeployments { return Object.keys(d).some(k => /^\d+$/.test(k)) }
export function getAddress(d: Deployments, name: string, chainId?: number): Address {
  if (isPerChain(d)) { if (chainId == null) throw new Error('chainId required'); const book = d[chainId]; if (!book) throw new Error(`No addresses for chainId=${chainId}`); const addr = book[name]; if (!addr) throw new Error(`No address for ${name} on chainId=${chainId}`); return addr }
  const addr = (d as FlatDeployments)[name]; if (!addr) throw new Error(`No address for ${name}`); return addr
}
export function getAllAddresses(d: Deployments, chainId?: number): FlatDeployments { if (isPerChain(d)) { if (chainId == null) throw new Error('chainId required'); return d[chainId] || {} as FlatDeployments } return d as FlatDeployments }
