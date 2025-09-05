import type { Address, PublicClient } from 'viem'
import { getContract, decodeAbiParameters } from 'viem'
import { createRitualContract } from './ritualContracts'

export interface CosmeticsReader {
  getEquippedPacked(raccoonId: bigint): Promise<{ bounds: bigint[]; bases: bigint[]; idx: bigint[] }>
  getWardrobePage(raccoonId: bigint, slot: number, start: number, count: number): Promise<{
    boundIds: bigint[]; baseTypeIds: bigint[]; boundAts: bigint[]; eqIdxPlus1: bigint; total: bigint
  }>
}
export interface AggregatorReader {
  batchEverythingPacked(user: Address, raccoonIds: bigint[], relicIds: bigint[]): Promise<{ equipPacks: `0x${string}`[]; balances: bigint[]; owners: Address[] }>
}
export async function createCosmeticsReader(params: { client: PublicClient; chainId?: number; baseUrl: string }): Promise<CosmeticsReader> {
  const c = await createRitualContract({ name: 'CosmeticsV2', client: params.client, chainId: params.chainId, baseUrl: params.baseUrl })
  return {
    async getEquippedPacked(raccoonId) {
      const packed = await c.read.getEquippedPacked([raccoonId])
      const [bounds, bases, idx] = decodeAbiParameters([{ type: 'uint256[5]' }, { type: 'uint256[5]' }, { type: 'uint256[5]' }], packed as `0x${string}`) as unknown as [bigint[], bigint[], bigint[]]
      return { bounds, bases, idx }
    },
    async getWardrobePage(raccoonId, slot, start, count) {
      const [packed, eqIdxPlus1, total] = await c.read.getWardrobePagePacked([raccoonId, BigInt(slot), BigInt(start), BigInt(count)])
      const [boundIds, baseTypeIds, boundAts] = decodeAbiParameters([{ type: 'uint256[]' }, { type: 'uint256[]' }, { type: 'uint256[]' }], packed as `0x${string}`) as unknown as [bigint[], bigint[], bigint[]]
      return { boundIds, baseTypeIds, boundAts, eqIdxPlus1, total }
    },
  }
}
export async function createAggregatorReader(params: { client: PublicClient; chainId?: number; baseUrl: string }): Promise<AggregatorReader> {
  const a = await createRitualContract({ name: 'RitualReadAggregator', client: params.client, chainId: params.chainId, baseUrl: params.baseUrl })
  return {
    async batchEverythingPacked(user, raccoonIds, relicIds) {
      const blob = await a.read.batchEverythingPacked([user, raccoonIds, relicIds])
      const [equipPacks, balances, owners] = decodeAbiParameters([{ type: 'bytes[]' }, { type: 'uint256[]' }, { type: 'address[]' }], blob as `0x${string}`) as unknown as [`0x${string}`[], bigint[], Address[]]
      return { equipPacks, balances, owners }
    }
  }
}
