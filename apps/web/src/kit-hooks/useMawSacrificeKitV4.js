/**
 * V4-Compatible Maw Sacrifice Kit Hook
 * Mobile-optimized version with V4 features
 */

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

export function useMawSacrificeKitV4({ baseUrl, chainId, onSacrificeComplete }) {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastTxHash, setLastTxHash] = useState(null)
  const [rewards, setRewards] = useState(null)
  const [systemStatus, setSystemStatus] = useState({
    sacrificesPaused: false,
    conversionsPaused: false,
    mythicDemonsMinted: 0,
    version: 'Unknown'
  })

  const mawRef = useRef(null)
  const cosmeticsRef = useRef(null)
  const relicsRef = useRef(null)

  const ready = !!publicClient && !!walletClient

  const ensureContracts = useCallback(async () => {
    if (!mawRef.current) {
      // V4 Contract - using same proxy address
      mawRef.current = await createRitualContract({ 
        name: 'MawSacrifice', // V4 uses same proxy address
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
  }, [publicClient, chainId, baseUrl])

  const checkApproval = useCallback(async () => {
    if (!ready) return false
    await ensureContracts()
    const address = walletClient.account.address
    const operator = mawRef.current.address
    try {
      const result = await relicsRef.current.read.isApprovedForAll([address, operator])
      return result
    } catch (err) {
      console.error('Failed to check approval', err)
      return false
    }
  }, [ready, walletClient, ensureContracts])

  const approve = useCallback(async () => {
    if (!ready) throw new Error('Not ready')
    await ensureContracts()
    const operator = mawRef.current.address
    const hash = await relicsRef.current.write.setApprovalForAll([operator, true])
    await publicClient.waitForTransactionReceipt({ hash })
    return true
  }, [ready, publicClient, ensureContracts])

  const parseRewards = useCallback((receipt) => {
    const relicsReceived = []
    const demonsReceived = []
    let shardsAwarded = 0

    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: [ERC1155_TransferSingle],
          data: log.data,
          topics: log.topics,
        })
        if (decoded.eventName === 'TransferSingle') {
          // Glass shards are ID 6
          if (Number(decoded.args.id) === 6 && decoded.args.to.toLowerCase() === walletClient.account.address.toLowerCase()) {
            shardsAwarded += Number(decoded.args.value)
          } else if (decoded.args.to.toLowerCase() === walletClient.account.address.toLowerCase()) {
            const id = Number(decoded.args.id)
            const value = Number(decoded.args.value)
            
            // Check if it's a demon mint (different contract)
            if (log.address.toLowerCase() !== relicsRef.current.address.toLowerCase()) {
              demonsReceived.push({ tier: id <= 1 ? 1 : 2, tokenId: id })
            } else {
              relicsReceived.push({ relicId: id, amount: value })
            }
          }
        }
      } catch (err) {
        // Try other event types if needed
      }
    }

    return { relicsReceived, demonsReceived, shardsAwarded }
  }, [walletClient])

  const sacrificeKeys = useCallback(async (amount = 1) => {
    if (!ready) throw new Error('Not ready')
    if (systemStatus.sacrificesPaused) throw new Error('Sacrifices are paused')
    if (amount < 1 || amount > 10) throw new Error('Amount must be between 1 and 10')
    
    setLoading(true)
    setError(null)
    
    try {
      await ensureContracts()
      
      const isApproved = await checkApproval()
      if (!isApproved) {
        await approve()
      }
      
      const hash = await mawRef.current.write.sacrificeKeys([amount])
      setLastTxHash(hash)
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const rewards = parseRewards(receipt)
      setRewards(rewards)
      
      if (onSacrificeComplete) {
        onSacrificeComplete(rewards)
      }
      
      return rewards
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [ready, systemStatus, ensureContracts, checkApproval, approve, publicClient, parseRewards, onSacrificeComplete])

  const sacrificeCosmetics = useCallback(async (daggerIds = [], vialAmounts = []) => {
    if (!ready) throw new Error('Not ready')
    if (systemStatus.sacrificesPaused) throw new Error('Sacrifices are paused')
    if (daggerIds.length > 3) throw new Error('Maximum 3 daggers per transaction')
    
    const totalVials = vialAmounts.reduce((sum, amt) => sum + amt, 0)
    if (totalVials > 100) throw new Error('Maximum 100 vials per transaction')
    
    setLoading(true)
    setError(null)
    
    try {
      await ensureContracts()
      
      const isApproved = await checkApproval()
      if (!isApproved) {
        await approve()
      }
      
      const hash = await mawRef.current.write.sacrificeCosmetics([daggerIds, vialAmounts])
      setLastTxHash(hash)
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const rewards = parseRewards(receipt)
      setRewards(rewards)
      
      if (onSacrificeComplete) {
        onSacrificeComplete(rewards)
      }
      
      return rewards
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [ready, systemStatus, ensureContracts, checkApproval, approve, publicClient, parseRewards, onSacrificeComplete])

  const sacrificeDemons = useCallback(async (amount = 1, tier = 1) => {
    if (!ready) throw new Error('Not ready')
    if (systemStatus.sacrificesPaused) throw new Error('Sacrifices are paused')
    if (amount < 1 || amount > 3) throw new Error('Amount must be between 1 and 3')
    if (tier !== 1 && tier !== 2) throw new Error('Tier must be 1 (rare) or 2 (mythic)')
    
    setLoading(true)
    setError(null)
    
    try {
      await ensureContracts()
      
      const isApproved = await checkApproval()
      if (!isApproved) {
        await approve()
      }
      
      const hash = await mawRef.current.write.sacrificeDemons([amount, tier])
      setLastTxHash(hash)
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const rewards = parseRewards(receipt)
      setRewards(rewards)
      
      if (onSacrificeComplete) {
        onSacrificeComplete(rewards)
      }
      
      return rewards
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [ready, systemStatus, ensureContracts, checkApproval, approve, publicClient, parseRewards, onSacrificeComplete])

  // V4 Feature: Convert glass shards to rusted caps
  const convertShardsToRustedCaps = useCallback(async (shardAmount) => {
    if (!ready) throw new Error('Not ready')
    if (systemStatus.conversionsPaused) throw new Error('Conversions are paused')
    if (shardAmount < 5) throw new Error('Minimum 5 shards required')
    if (shardAmount % 5 !== 0) throw new Error('Amount must be multiple of 5')
    if (shardAmount > 500) throw new Error('Maximum 500 shards per conversion')
    
    setLoading(true)
    setError(null)
    
    try {
      await ensureContracts()
      
      const isApproved = await checkApproval()
      if (!isApproved) {
        await approve()
      }
      
      const hash = await mawRef.current.write.convertShardsToRustedCaps([shardAmount])
      setLastTxHash(hash)
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const capsReceived = shardAmount / 5
      
      if (onSacrificeComplete) {
        onSacrificeComplete({ capsConverted: capsReceived })
      }
      
      return { capsConverted: capsReceived }
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [ready, systemStatus, ensureContracts, checkApproval, approve, publicClient, onSacrificeComplete])

  return {
    ready,
    loading: isLoading,
    error,
    rewards,
    lastTxHash,
    systemStatus, // V4 status
    
    // Actions
    checkApproval,
    approve,
    sacrificeKeys,
    sacrificeCosmetics,
    sacrificeDemons,
    convertShardsToRustedCaps, // V4 feature
  }
}