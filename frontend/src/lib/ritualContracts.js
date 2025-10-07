import { getContract } from 'viem'
import { fetchJsonCached, fetchJsonCachedWithRetry, fetchGhPagesVersion } from './caching'

export async function fetchDeployments(opts = {}, cache = {}, retry) {
  const { baseUrl } = opts
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/deploy.output.json` : undefined
  if (!url) throw new Error('baseUrl required')
  
  const version = baseUrl ? await fetchGhPagesVersion(baseUrl, opts.fetchFn ?? fetch) : undefined
  
  try {
    return await (retry ? 
      fetchJsonCachedWithRetry(url, opts.fetchFn ?? fetch, { ...cache, version }, retry) : 
      fetchJsonCached(url, opts.fetchFn ?? fetch, { ...cache, version })
    )
  } catch (e) {
    if (opts.fallback) {
      const mod = await opts.fallback()
      return mod.default ?? mod
    }
    throw e
  }
}

async function fetchAbi(name, opts = {}, cache = {}, retry) {
  const { baseUrl } = opts
  if (!baseUrl) throw new Error('baseUrl required')
  
  const url = `${baseUrl.replace(/\/$/, '')}/abis/${name}.abi.json`
  const version = baseUrl ? await fetchGhPagesVersion(baseUrl, opts.fetchFn ?? fetch) : undefined
  
  try {
    return await (retry ? 
      fetchJsonCachedWithRetry(url, opts.fetchFn ?? fetch, { ...cache, version }, retry) : 
      fetchJsonCached(url, opts.fetchFn ?? fetch, { ...cache, version })
    )
  } catch (e) {
    if (opts.fallback) {
      const mod = await opts.fallback()
      return mod.default ?? mod
    }
    throw e
  }
}

export function resolveAddress(deployments, name, chainId) {
  const entry = deployments[name] ?? (chainId != null ? deployments[chainId]?.[name] : undefined)
  if (!entry) throw new Error(`No address for ${name} (chainId=${chainId ?? 'unknown'})`)
  return entry
}

export async function createRitualContract(params) {
  const { name, client, chainId, baseUrl } = params
  
  const [deployments, abi] = await Promise.all([
    params.local?.deployments ? 
      params.local.deployments().then((m) => m.default ?? m).catch(() => fetchDeployments({ baseUrl })) : 
      fetchDeployments({ baseUrl }),
    params.local?.abi ? 
      params.local.abi().then((m) => m.default ?? m).catch(() => fetchAbi(name, { baseUrl })) : 
      fetchAbi(name, { baseUrl }),
  ])
  
  const address = params.addressOverride ?? resolveAddress(deployments, name, chainId)
  return getContract({ address, abi, client })
}