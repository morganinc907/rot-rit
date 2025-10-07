import { useState, useCallback, useEffect, useRef } from 'react'
import { usePublicClient, useWalletClient } from 'wagmi'
import { toast } from 'react-hot-toast'
import { createCosmeticsReader, createRitualContract } from '../lib/typedClient'
import {
  SLOT_NAMES,
  SLOT_INDICES,
  fetchAllWardrobePages,
  COSMETICS_EVENTS_ABI,
  getCosmeticsAddress,
} from '../lib/cosmeticsInventory'

// Re-export for backwards compatibility
export { SLOT_NAMES, SLOT_INDICES }

const PAGE_SIZE = 50 // Larger batches, fewer RPCs

export function useCosmeticsV2Wardrobe({ baseUrl, chainId }) {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  // State
  const [selectedRaccoonId, setSelectedRaccoonId] = useState(null)
  const [equipped, setEquipped] = useState(null) // [bigint, bigint, bigint, bigint, bigint]
  const [wardrobes, setWardrobes] = useState({}) // Record<SlotIndex, WardrobePage>
  const [loading, setLoading] = useState(false)

  // Contract refs
  const cosmeticsReaderRef = useRef(null)
  const cosmeticsContractRef = useRef(null)

  // Race condition prevention - track latest request
  const latestRequest = useRef(null)

  const ready = !!publicClient && !!walletClient
  
  // Initialize contract instances
  const ensureContracts = useCallback(async () => {
    if (!cosmeticsReaderRef.current && publicClient) {
      cosmeticsReaderRef.current = await createCosmeticsReader({
        client: publicClient,
        chainId,
        baseUrl
      })
    }
    
    if (!cosmeticsContractRef.current && walletClient) {
      cosmeticsContractRef.current = await createRitualContract({
        name: 'CosmeticsV2',
        client: walletClient,
        chainId,
        baseUrl
      })
    }
  }, [publicClient, walletClient, chainId, baseUrl])
  
  // Load equipped cosmetics for a raccoon
  const loadEquipped = useCallback(async (raccoonId) => {
    if (!raccoonId || !cosmeticsReaderRef.current) return
    
    try {
      const equippedArray = await cosmeticsReaderRef.current.getEquippedCosmetics(raccoonId)
      setEquipped(equippedArray)
    } catch (error) {
      console.error('Error loading equipped cosmetics:', error)
      setEquipped([0n, 0n, 0n, 0n, 0n])
    }
  }, [])
  
  // Load ALL pages for a wardrobe slot (not just first 20)
  const loadWardrobeSlotAllPages = useCallback(async (raccoonId, slotIndex, abortId) => {
    if (!raccoonId || !cosmeticsReaderRef.current) return

    try {
      // Fetch first page
      const first = await cosmeticsReaderRef.current.getWardrobePage(
        raccoonId,
        slotIndex,
        0,
        PAGE_SIZE
      )

      let items = [...first.items]
      const total = Number(first.total ?? first.items?.length ?? 0)

      // Fetch remaining pages
      for (let start = PAGE_SIZE; start < total; start += PAGE_SIZE) {
        // Bail out if a newer request started (race condition guard)
        if (latestRequest.current !== abortId) return

        const page = await cosmeticsReaderRef.current.getWardrobePage(
          raccoonId,
          slotIndex,
          start,
          PAGE_SIZE
        )
        items.push(...page.items)
      }

      // Final check before committing
      if (latestRequest.current !== abortId) return

      setWardrobes(prev => ({
        ...prev,
        [slotIndex]: { ...first, items, total: BigInt(total) }
      }))
    } catch (error) {
      console.error(`Error loading wardrobe slot ${slotIndex}:`, error)
      if (latestRequest.current === abortId) {
        setWardrobes(prev => ({
          ...prev,
          [slotIndex]: { items: [], equippedIndex: 0n, total: 0n }
        }))
      }
    }
  }, [])
  
  // Load all wardrobe slots for a raccoon
  const loadAllWardrobeSlots = useCallback(async (raccoonId) => {
    if (!raccoonId) return

    setLoading(true)
    try {
      await ensureContracts()

      // Generate request ID to prevent race conditions
      const reqId = crypto.randomUUID()
      latestRequest.current = reqId

      // Load equipped cosmetics
      await loadEquipped(raccoonId)

      // Load all wardrobe slots in parallel with full pagination
      await Promise.all([
        loadWardrobeSlotAllPages(raccoonId, SLOT_INDICES.HEAD, reqId),
        loadWardrobeSlotAllPages(raccoonId, SLOT_INDICES.FACE, reqId),
        loadWardrobeSlotAllPages(raccoonId, SLOT_INDICES.BODY, reqId),
        loadWardrobeSlotAllPages(raccoonId, SLOT_INDICES.COLOR, reqId),
        loadWardrobeSlotAllPages(raccoonId, SLOT_INDICES.BACKGROUND, reqId),
      ])
    } catch (error) {
      console.error('Error loading wardrobe data:', error)
      toast.error('Failed to load wardrobe data')
    } finally {
      setLoading(false)
    }
  }, [ensureContracts, loadEquipped, loadWardrobeSlotAllPages])
  
  // Select a raccoon and load its data
  const selectRaccoon = useCallback(async (raccoonId) => {
    setSelectedRaccoonId(raccoonId)
    if (raccoonId) {
      await loadAllWardrobeSlots(raccoonId)
    } else {
      setEquipped(null)
      setWardrobes({})
    }
  }, [loadAllWardrobeSlots])
  
  // Equip a cosmetic (with optimistic updates)
  const equipCosmetic = useCallback(async (slotIndex, itemIndex) => {
    if (!selectedRaccoonId || !cosmeticsContractRef.current || !ready) {
      toast.error('Unable to equip cosmetic')
      return
    }
    
    try {
      // Optimistic update
      setWardrobes(prev => ({
        ...prev,
        [slotIndex]: prev[slotIndex] ? {
          ...prev[slotIndex],
          equippedIndex: BigInt(itemIndex + 1) // 1-indexed
        } : prev[slotIndex]
      }))
      
      // Contract call
      const tx = await cosmeticsContractRef.current.write.equipCosmetic([
        BigInt(selectedRaccoonId),
        BigInt(slotIndex),
        BigInt(itemIndex)
      ])
      
      toast.success('Cosmetic equipped!')

      // Targeted refetch of affected slot after transaction
      setTimeout(async () => {
        const reqId = crypto.randomUUID()
        latestRequest.current = reqId
        await loadEquipped(selectedRaccoonId)
        await loadWardrobeSlotAllPages(selectedRaccoonId, slotIndex, reqId)
      }, 2000)

    } catch (error) {
      console.error('Error equipping cosmetic:', error)
      toast.error('Failed to equip cosmetic')

      // Rollback optimistic update
      const reqId = crypto.randomUUID()
      latestRequest.current = reqId
      await loadWardrobeSlotAllPages(selectedRaccoonId, slotIndex, reqId)
    }
  }, [selectedRaccoonId, ready, loadEquipped, loadWardrobeSlotAllPages])
  
  // Unequip a slot (with optimistic updates)
  const unequipSlot = useCallback(async (slotIndex) => {
    if (!selectedRaccoonId || !cosmeticsContractRef.current || !ready) {
      toast.error('Unable to unequip cosmetic')
      return
    }
    
    try {
      // Optimistic update
      setWardrobes(prev => ({
        ...prev,
        [slotIndex]: prev[slotIndex] ? {
          ...prev[slotIndex],
          equippedIndex: 0n
        } : prev[slotIndex]
      }))
      
      // Contract call
      const tx = await cosmeticsContractRef.current.write.unequipSlot([
        BigInt(selectedRaccoonId),
        BigInt(slotIndex)
      ])
      
      toast.success('Cosmetic unequipped!')

      // Targeted refetch of affected slot after transaction
      setTimeout(async () => {
        const reqId = crypto.randomUUID()
        latestRequest.current = reqId
        await loadEquipped(selectedRaccoonId)
        await loadWardrobeSlotAllPages(selectedRaccoonId, slotIndex, reqId)
      }, 2000)

    } catch (error) {
      console.error('Error unequipping cosmetic:', error)
      toast.error('Failed to unequip cosmetic')

      // Rollback optimistic update
      const reqId = crypto.randomUUID()
      latestRequest.current = reqId
      await loadWardrobeSlotAllPages(selectedRaccoonId, slotIndex, reqId)
    }
  }, [selectedRaccoonId, ready, loadEquipped, loadWardrobeSlotAllPages])
  
  // Bind a cosmetic to the selected raccoon (with optimistic updates)
  const bindCosmetic = useCallback(async (typeId, slotIndex) => {
    if (!selectedRaccoonId || !cosmeticsContractRef.current || !ready) {
      toast.error('Unable to bind cosmetic')
      return
    }
    
    try {
      // Contract call (no optimistic update - wallet is handled by V2)
      const tx = await cosmeticsContractRef.current.write.bindToRaccoon([
        BigInt(selectedRaccoonId),
        BigInt(typeId)
      ])

      toast.success('Cosmetic bound to raccoon!')

      // Refresh affected slot after transaction
      setTimeout(async () => {
        const reqId = crypto.randomUUID()
        latestRequest.current = reqId
        await loadWardrobeSlotAllPages(selectedRaccoonId, slotIndex, reqId)
      }, 2000)

    } catch (error) {
      console.error('Error binding cosmetic:', error)
      toast.error('Failed to bind cosmetic')
    }
  }, [selectedRaccoonId, ready, loadWardrobeSlotAllPages])

  // NOTE: Wallet cosmetics are now handled by useCosmeticsV2 hook
  // This hook only manages raccoon-bound wardrobe items

  return {
    // State
    selectedRaccoonId,
    equipped,
    wardrobes,
    loading,
    ready,

    // Actions
    selectRaccoon,
    equipCosmetic,
    unequipSlot,
    bindCosmetic,
    loadWardrobeSlotAllPages,
    
    // Utils
    SLOT_NAMES,
    SLOT_INDICES,
  }
}