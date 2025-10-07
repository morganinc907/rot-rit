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
}

export function useMawSacrificeKit({ baseUrl, chainId, onSacrificeComplete }) {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastTxHash, setLastTxHash] = useState(null)
  const [rewards, setRewards] = useState(null)

  const mawRef = useRef(null)
  const cosmeticsRef = useRef(null)
  const relicsRef = useRef(null)

  const ready = !!publicClient && !!walletClient

  const ensureContracts = useCallback(async () => {
    if (!mawRef.current) {
      mawRef.current = await createRitualContract({ 
        name: 'MawSacrificeV2', 
        client: publicClient, 
        chainId, 
        baseUrl 
      })
    }
    if (!cosmeticsRef.current) {
      cosmeticsRef.current = await createRitualContract({ 
        name: 'CosmeticsV2', 
        client: publicClient, 
        chainId, 
        baseUrl 
      })
    }
    if (!relicsRef.current) {
      relicsRef.current = await createRitualContract({ 
        name: 'Relics', 
        client: publicClient, 
        chainId, 
        baseUrl 
      })
    }
  }, [baseUrl, chainId, publicClient])

  const parseReceipt = useCallback(async (receipt, userAddress) => {
    await ensureContracts()
    
    const outcomes = []
    const cosmeticsAddr = cosmeticsRef.current?.address?.toLowerCase()
    const relicsAddr = relicsRef.current?.address?.toLowerCase()
    
    for (const log of receipt.logs || []) {
      try {
        const addr = String(log.address).toLowerCase()
        const ev = decodeEventLog({ 
          abi: [ERC1155_TransferSingle], 
          data: log.data, 
          topics: log.topics 
        })
        
        if (ev.eventName === 'TransferSingle' && ev.args.to.toLowerCase() === userAddress.toLowerCase()) {
          if (addr === cosmeticsAddr) {
            outcomes.push({ kind: 'COSMETIC', typeId: ev.args.id })
          } else if (addr === relicsAddr) {
            outcomes.push({ kind: 'RELIC', tokenId: ev.args.id, amount: ev.args.value })
          }
        }
      } catch {
        // Ignore non-matching logs
      }
    }
    
    return outcomes
  }, [ensureContracts])

  const sacrificeForCosmetic = useCallback(async (rarity, count) => {
    if (!ready) throw new Error('Wallet not connected')
    
    try {
      setLoading(true)
      setError(null)
      await ensureContracts()
      
      const hash = await walletClient.writeContract({
        ...mawRef.current,
        functionName: 'sacrificeForCosmetic',
        args: [BigInt(rarity), BigInt(count)],
      })
      
      setLastTxHash(hash)
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const outcomes = await parseReceipt(receipt, walletClient.account.address)
      
      setRewards(outcomes)
      setLoading(false)
      
      // Call the callback if provided
      if (onSacrificeComplete) {
        onSacrificeComplete({ success: true, rewards: outcomes, burned: [], hash })
      }
      
      return { success: true, hash, rewards: outcomes }
    } catch (err) {
      setError(err.message)
      setLoading(false)
      return { success: false, error: err.message }
    }
  }, [ready, ensureContracts, walletClient, publicClient, parseReceipt])

  const sacrificeKeys = useCallback(async (amount) => {
    if (!ready) throw new Error('Wallet not connected')
    
    try {
      setLoading(true)
      setError(null)
      await ensureContracts()
      
      const hash = await walletClient.writeContract({
        ...mawRef.current,
        functionName: 'sacrificeKeys',
        args: [BigInt(amount)],
      })
      
      setLastTxHash(hash)
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const outcomes = await parseReceipt(receipt, walletClient.account.address)
      
      setRewards(outcomes)
      setLoading(false)
      
      // Call the callback if provided
      if (onSacrificeComplete) {
        onSacrificeComplete({ success: true, rewards: outcomes, burned: [], hash })
      }
      
      return { success: true, hash, rewards: outcomes }
    } catch (err) {
      setError(err.message)
      setLoading(false)
      return { success: false, error: err.message }
    }
  }, [ready, ensureContracts, walletClient, publicClient, parseReceipt])

  return {
    sacrificeForCosmetic,
    sacrificeKeys,
    isLoading,
    error,
    lastTxHash,
    rewards,
    ready,
  }
}