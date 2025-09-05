import { getContract } from 'viem'
import { createRitualContract } from './ritualContracts'

// Re-export createRitualContract
export { createRitualContract }

// Option A: Use current ABI with tuple arrays
export async function createCosmeticsReader(params) {
  const { client, chainId, baseUrl } = params
  const c = await createRitualContract({ 
    name: 'CosmeticsV2', 
    client: client, 
    chainId: chainId, 
    baseUrl: baseUrl 
  })
  
  return {
    async getEquippedCosmetics(raccoonId) {
      // Returns [head, face, body, color, background] as tuple
      return await c.read.getEquippedCosmetics([raccoonId])
    },
    
    async getWardrobePage(raccoonId, slot, start, count) {
      // Returns { items: WardrobeItem[], equippedIndex: bigint, total: bigint }
      return await c.read.getWardrobePage([raccoonId, BigInt(slot), BigInt(start), BigInt(count)])
    },
  }
}

export async function createAggregatorReader(params) {
  const { client, chainId, baseUrl } = params
  const a = await createRitualContract({ 
    name: 'RitualReadAggregator', 
    client: client, 
    chainId: chainId, 
    baseUrl: baseUrl 
  })
  
  return {
    async batchEverythingPacked(user, raccoonIds, relicIds) {
      const blob = await a.read.batchEverythingPacked([user, raccoonIds, relicIds])
      const [equipPacks, balances, owners] = decodeAbiParameters([
        { type: 'bytes[]' }, 
        { type: 'uint256[]' }, 
        { type: 'address[]' }
      ], blob)
      return { equipPacks, balances, owners }
    }
  }
}

export async function createMawSacrificeContract(params) {
  const { client, chainId, baseUrl } = params
  return await createRitualContract({ 
    name: 'MawSacrificeV2', 
    client: client, 
    chainId: chainId, 
    baseUrl: baseUrl 
  })
}

export async function createRelicsContract(params) {
  const { client, chainId, baseUrl } = params  
  return await createRitualContract({ 
    name: 'Relics', 
    client: client, 
    chainId: chainId, 
    baseUrl: baseUrl 
  })
}