// Frontend contract hooks using new address system
import { useChainId } from 'wagmi'
import { getMawAddress, getRelicsAddress, getAllAddresses, getCosmeticsAddress, getRaccoonsAddress, getDemonsAddress, getCultistsAddress, getKeyShopAddress, getRaccoonRendererAddress, getRitualReadAggregatorAddress } from './sdk/addresses'
import { CHAIN } from '@rot-ritual/addresses'
import { mawAbi, relicsAbi, cosmeticsAbi, canonicalAbis } from './abi'

function validateChainId(chainId: number) {
  if (chainId !== CHAIN.BASE_SEPOLIA) {
    throw new Error(`Unsupported chainId ${chainId}. Please switch to Base Sepolia.`)
  }
}

export function useMaw() {
  const chainId = useChainId()
  validateChainId(chainId)
  const address = getMawAddress(chainId) as `0x${string}` // This will log and guard against old address
  return { address, abi: mawAbi }
}

export function useRelics() {
  const chainId = useChainId()
  validateChainId(chainId)
  const address = getRelicsAddress(chainId) as `0x${string}`
  return { address, abi: relicsAbi }
}

export function useCosmetics() {
  const chainId = useChainId()
  validateChainId(chainId)
  const address = getCosmeticsAddress(chainId) as `0x${string}`
  return { address, abi: cosmeticsAbi }
}

export function useRaccoons() {
  const chainId = useChainId()
  validateChainId(chainId)
  const address = getRaccoonsAddress(chainId) as `0x${string}`
  return { address, abi: canonicalAbis.Raccoons }
}

export function useDemons() {
  const chainId = useChainId()
  validateChainId(chainId)
  const address = getDemonsAddress(chainId) as `0x${string}`
  return { address, abi: canonicalAbis.Demons }
}

export function useCultists() {
  const chainId = useChainId()
  validateChainId(chainId)
  const address = getCultistsAddress(chainId) as `0x${string}`
  return { address, abi: canonicalAbis.Cultists }
}

export function useKeyShop() {
  const chainId = useChainId()
  validateChainId(chainId)
  const address = getKeyShopAddress(chainId) as `0x${string}`
  return { address, abi: canonicalAbis.KeyShop }
}

export function useRaccoonRenderer() {
  const chainId = useChainId()
  validateChainId(chainId)
  const address = getRaccoonRendererAddress(chainId) as `0x${string}`
  return { address, abi: canonicalAbis.RaccoonRenderer }
}

export function useRitualReadAggregator() {
  const chainId = useChainId()
  validateChainId(chainId)
  const address = getRitualReadAggregatorAddress(chainId) as `0x${string}`
  return { address, abi: canonicalAbis.RitualReadAggregator }
}

export function useAllContracts() {
  const chainId = useChainId()
  validateChainId(chainId)
  const addresses = getAllAddresses(chainId)
  return addresses
}