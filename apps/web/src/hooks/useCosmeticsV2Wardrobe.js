import { useState, useCallback, useEffect, useRef } from 'react'
import { usePublicClient, useWalletClient } from 'wagmi'
import { toast } from 'react-hot-toast'
import { createCosmeticsReader, createRitualContract } from '../lib/typedClient'

// Frontend types and constants
export const SLOT_NAMES = ['Head', 'Face', 'Body', 'Color', 'Background']
export const SLOT_INDICES = { HEAD: 0, FACE: 1, BODY: 2, COLOR: 3, BACKGROUND: 4 }

const PAGE_SIZE = 20

export function useCosmeticsV2Wardrobe({ baseUrl, chainId }) {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  
  // State
  const [selectedRaccoonId, setSelectedRaccoonId] = useState(null)
  const [equipped, setEquipped] = useState(null) // [bigint, bigint, bigint, bigint, bigint]
  const [wardrobes, setWardrobes] = useState({}) // Record<SlotIndex, WardrobePage>
  const [walletCosmetics, setWalletCosmetics] = useState({}) // Record<string, bigint>
  const [relicBalances, setRelicBalances] = useState({}) // Record<number, bigint>
  const [loading, setLoading] = useState(false)
  
  // Contract refs
  const cosmeticsReaderRef = useRef(null)
  const cosmeticsContractRef = useRef(null)
  
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
  
  // Load wardrobe page for a specific slot
  const loadWardrobeSlot = useCallback(async (raccoonId, slotIndex, start = 0, count = PAGE_SIZE) => {
    if (!raccoonId || !cosmeticsReaderRef.current) return
    
    try {
      const wardrobePage = await cosmeticsReaderRef.current.getWardrobePage(
        raccoonId, 
        slotIndex, 
        start, 
        count
      )
      
      setWardrobes(prev => ({
        ...prev,
        [slotIndex]: wardrobePage
      }))
    } catch (error) {
      console.error(`Error loading wardrobe slot ${slotIndex}:`, error)
      setWardrobes(prev => ({
        ...prev,
        [slotIndex]: { items: [], equippedIndex: 0n, total: 0n }
      }))
    }
  }, [])
  
  // Load all wardrobe slots for a raccoon
  const loadAllWardrobeSlots = useCallback(async (raccoonId) => {
    if (!raccoonId) return
    
    setLoading(true)
    try {
      await ensureContracts()
      
      // Load equipped cosmetics
      await loadEquipped(raccoonId)
      
      // Load all wardrobe slots in parallel
      await Promise.all([
        loadWardrobeSlot(raccoonId, SLOT_INDICES.HEAD),
        loadWardrobeSlot(raccoonId, SLOT_INDICES.FACE),
        loadWardrobeSlot(raccoonId, SLOT_INDICES.BODY),
        loadWardrobeSlot(raccoonId, SLOT_INDICES.COLOR),
        loadWardrobeSlot(raccoonId, SLOT_INDICES.BACKGROUND),
      ])
    } catch (error) {
      console.error('Error loading wardrobe data:', error)
      toast.error('Failed to load wardrobe data')
    } finally {
      setLoading(false)
    }
  }, [ensureContracts, loadEquipped, loadWardrobeSlot])
  
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
      
      // Refresh equipped state after transaction
      setTimeout(() => {
        loadEquipped(selectedRaccoonId)
      }, 2000)
      
    } catch (error) {
      console.error('Error equipping cosmetic:', error)
      toast.error('Failed to equip cosmetic')
      
      // Rollback optimistic update
      await loadWardrobeSlot(selectedRaccoonId, slotIndex)
    }
  }, [selectedRaccoonId, ready, loadEquipped, loadWardrobeSlot])
  
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
      
      // Refresh equipped state after transaction
      setTimeout(() => {
        loadEquipped(selectedRaccoonId)
      }, 2000)
      
    } catch (error) {
      console.error('Error unequipping cosmetic:', error)
      toast.error('Failed to unequip cosmetic')
      
      // Rollback optimistic update
      await loadWardrobeSlot(selectedRaccoonId, slotIndex)
    }
  }, [selectedRaccoonId, ready, loadEquipped, loadWardrobeSlot])
  
  // Bind a cosmetic to the selected raccoon (with optimistic updates)
  const bindCosmetic = useCallback(async (typeId, slotIndex) => {
    if (!selectedRaccoonId || !cosmeticsContractRef.current || !ready) {
      toast.error('Unable to bind cosmetic')
      return
    }
    
    try {
      // Optimistic update - reduce wallet balance
      setWalletCosmetics(prev => ({
        ...prev,
        [String(typeId)]: (prev[String(typeId)] ?? 1n) - 1n
      }))
      
      // Contract call
      const tx = await cosmeticsContractRef.current.write.bindToRaccoon([
        BigInt(selectedRaccoonId),
        BigInt(typeId)
      ])
      
      toast.success('Cosmetic bound to raccoon!')
      
      // Refresh wardrobe slot after transaction
      setTimeout(() => {
        loadWardrobeSlot(selectedRaccoonId, slotIndex)
      }, 2000)
      
    } catch (error) {
      console.error('Error binding cosmetic:', error)
      toast.error('Failed to bind cosmetic')
      
      // Rollback optimistic update
      setWalletCosmetics(prev => ({
        ...prev,
        [String(typeId)]: (prev[String(typeId)] ?? 0n) + 1n
      }))
    }
  }, [selectedRaccoonId, ready, loadWardrobeSlot])
  
  // Load wallet cosmetics
  const loadWalletCosmetics = useCallback(async (userAddress) => {
    if (!userAddress || !cosmeticsReaderRef.current) return
    
    try {
      await ensureContracts()
      
      // This is a placeholder - you'll need to implement based on your cosmetic enumeration
      // For now, we'll assume you have a way to get all cosmetic type IDs
      const cosmeticTypeIds = [] // TODO: get from contract or indexer
      
      if (cosmeticTypeIds.length > 0) {
        const addresses = Array(cosmeticTypeIds.length).fill(userAddress)
        const balances = await cosmeticsReaderRef.current.balanceOfBatch?.(addresses, cosmeticTypeIds)
        
        const walletData = {}
        cosmeticTypeIds.forEach((typeId, index) => {
          if (balances?.[index] > 0n) {
            walletData[String(typeId)] = balances[index]
          }
        })
        
        setWalletCosmetics(walletData)
      }
    } catch (error) {
      console.error('Error loading wallet cosmetics:', error)
    }
  }, [ensureContracts])
  
  return {
    // State
    selectedRaccoonId,
    equipped,
    wardrobes,
    walletCosmetics,
    relicBalances,
    loading,
    ready,
    
    // Actions
    selectRaccoon,
    equipCosmetic,
    unequipSlot,
    bindCosmetic,
    loadWalletCosmetics,
    loadWardrobeSlot,
    
    // Utils
    SLOT_NAMES,
    SLOT_INDICES,
  }
}