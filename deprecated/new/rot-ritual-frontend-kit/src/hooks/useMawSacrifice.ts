import { useCallback, useRef, useState } from 'react'
import { decodeEventLog } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'
import { createRitualContract } from '../lib/ritualContracts'

const ERC1155_TransferSingle = {
  type: 'event',
  name: 'TransferSingle',
  inputs: [
    { indexed: true, name: 'operator', type: 'address' },
    { indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: false, name: 'id', type: 'uint256' },
    { indexed: false, name: 'value', type: 'uint256' },
  ],
} as const

export type SacrificeOutcome =
  | { kind: 'COSMETIC'; typeId: bigint }
  | { kind: 'RELIC'; tokenId: bigint; amount: bigint }
  | { kind: 'UNKNOWN'; details?: any }

export function useMawSacrifice({ baseUrl, chainId }: { baseUrl: string; chainId?: number }) {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | null>(null)
  const [rewards, setRewards] = useState<SacrificeOutcome[] | null>(null)

  const mawRef = useRef<any>(null)
  const cosmeticsRef = useRef<any>(null)
  const relicsRef = useRef<any>(null)

  const ready = !!publicClient && !!walletClient

  const ensureContracts = useCallback(async () => {
    if (!mawRef.current) mawRef.current = await createRitualContract({ name: 'MawSacrificeV2', client: publicClient!, chainId, baseUrl })
    if (!cosmeticsRef.current) cosmeticsRef.current = await createRitualContract({ name: 'CosmeticsV2', client: publicClient!, chainId, baseUrl })
    if (!relicsRef.current) relicsRef.current = await createRitualContract({ name: 'Relics', client: publicClient!, chainId, baseUrl })
  }, [baseUrl, chainId, publicClient])

  const parseReceipt = useCallback(async (receipt: any, userAddress: `0x${string}`) => {
    const outcomes: SacrificeOutcome[] = []
    const cosmeticsAddr = cosmeticsRef.current?.address?.toLowerCase()
    const relicsAddr = relicsRef.current?.address?.toLowerCase()
    for (const log of receipt.logs || []) {
      try {
        const addr = String(log.address).toLowerCase()
        const ev = decodeEventLog({ abi: [ERC1155_TransferSingle], data: log.data, topics: log.topics as any })
        if (ev.eventName === 'TransferSingle') {
          const { to, id, value } = ev.args as any
          if (String(to).toLowerCase() === userAddress.toLowerCase()) {
            if (addr === cosmeticsAddr) outcomes.push({ kind: 'COSMETIC', typeId: id as bigint })
            else if (addr === relicsAddr) outcomes.push({ kind: 'RELIC', tokenId: id as bigint, amount: value as bigint })
            else outcomes.push({ kind: 'UNKNOWN', details: { address: log.address, id, value } })
          }
        }
      } catch {}
    }
    return outcomes
  }, [])

  const sacrificeForCosmetic = useCallback(async (rarity: bigint, count: bigint = 1n) => {
    if (!publicClient || !walletClient) throw new Error('Wallet not connected')
    setLoading(true); setError(null); setRewards(null); setLastTxHash(null)
    try {
      await ensureContracts()
      const hash = await walletClient.writeContract({
        address: mawRef.current.address,
        abi: mawRef.current.abi,
        functionName: 'sacrificeForCosmetic',
        args: [rarity, count],
        chain: publicClient.chain,
        account: walletClient.account,
      })
      setLastTxHash(hash)
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const parsed = await parseReceipt(receipt, walletClient.account!.address as `0x${string}`)
      setRewards(parsed)
    } catch (e: any) { setError(e?.message || String(e)); throw e }
    finally { setLoading(false) }
  }, [publicClient, walletClient, ensureContracts, parseReceipt])

  return { ready, isLoading, error, lastTxHash, rewards, sacrificeForCosmetic, reset: () => { setRewards(null); setError(null); setLastTxHash(null) } }
}
