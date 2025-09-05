import { Address, PublicClient, getContract } from 'viem'
import { fetchJsonCached, fetchJsonCachedWithRetry, fetchGhPagesVersion, type CacheOpts, type RetryOpts } from './caching'

export type DeployMap = Record<string, any>
export interface FetchOpts<T = unknown> { baseUrl?: string; fallback?: () => Promise<{ default?: T } | T>; fetchFn?: typeof fetch; signal?: AbortSignal }

export async function fetchDeployments(opts: FetchOpts<Record<string, any>> = {}, cache: CacheOpts = {}, retry?: RetryOpts) {
  const { baseUrl } = opts; const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/deploy.output.json` : undefined; if (!url) throw new Error('baseUrl required')
  const version = baseUrl ? await fetchGhPagesVersion(baseUrl, opts.fetchFn ?? fetch) : undefined
  try { return await (retry ? fetchJsonCachedWithRetry<Record<string, any>>(url, opts.fetchFn ?? fetch, { ...cache, version }, retry) : fetchJsonCached<Record<string, any>>(url, opts.fetchFn ?? fetch, { ...cache, version })) }
  catch (e) { if (opts.fallback) { const mod = await opts.fallback(); return (mod as any).default ?? (mod as any) } throw e }
}
async function fetchAbi(name: string, opts: FetchOpts = {}, cache: CacheOpts = {}, retry?: RetryOpts) {
  const { baseUrl } = opts; if (!baseUrl) throw new Error('baseUrl required')
  const url = `${baseUrl.replace(/\/$/, '')}/abis/${name}.abi.json`; const version = baseUrl ? await fetchGhPagesVersion(baseUrl, opts.fetchFn ?? fetch) : undefined
  try { return await (retry ? fetchJsonCachedWithRetry(url, opts.fetchFn ?? fetch, { ...cache, version }, retry) : fetchJsonCached(url, opts.fetchFn ?? fetch, { ...cache, version })) }
  catch (e) { if (opts.fallback) { const mod = await opts.fallback(); return (mod as any).default ?? (mod as any) } throw e }
}
export function resolveAddress(deployments: DeployMap, name: string, chainId?: number): Address {
  const entry = (deployments as any)[name] ?? (chainId != null ? (deployments as any)[chainId]?.[name] : undefined); if (!entry) throw new Error(`No address for ${name} (chainId=${chainId ?? 'unknown'})`)
  return entry as Address
}
export async function createRitualContract(params: { name: string; client: PublicClient; chainId?: number; baseUrl: string; local?: { deployments?: () => Promise<any>; abi?: () => Promise<any> }; addressOverride?: Address }) {
  const { name, client, chainId, baseUrl } = params
  const [deployments, abi] = await Promise.all([
    params.local?.deployments ? params.local.deployments().then((m)=> (m as any).default ?? m).catch(()=> fetchDeployments({ baseUrl })) : fetchDeployments({ baseUrl }),
    params.local?.abi ? params.local.abi().then((m)=> (m as any).default ?? m).catch(()=> fetchAbi(name, { baseUrl })) : fetchAbi(name, { baseUrl }),
  ])
  const address = params.addressOverride ?? resolveAddress(deployments, name, chainId)
  return getContract({ address, abi, client })
}
