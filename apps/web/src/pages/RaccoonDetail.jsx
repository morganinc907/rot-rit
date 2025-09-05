import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount, useChainId } from 'wagmi'
import { toast } from 'react-hot-toast'
import useRaccoons from '../hooks/useRaccoons'
import { useCosmeticsV2Wardrobe, SLOT_NAMES, SLOT_INDICES } from '../hooks/useCosmeticsV2Wardrobe'

const SLOT_ICONS = {
  [SLOT_INDICES.HEAD]: '👑',
  [SLOT_INDICES.FACE]: '👀', 
  [SLOT_INDICES.BODY]: '👕',
  [SLOT_INDICES.COLOR]: '🎨',
  [SLOT_INDICES.BACKGROUND]: '🌟'
}

const SLOT_COLORS = {
  [SLOT_INDICES.HEAD]: 'text-blue-400 border-blue-400/50',
  [SLOT_INDICES.FACE]: 'text-green-400 border-green-400/50',
  [SLOT_INDICES.BODY]: 'text-purple-400 border-purple-400/50', 
  [SLOT_INDICES.COLOR]: 'text-yellow-400 border-yellow-400/50',
  [SLOT_INDICES.BACKGROUND]: 'text-pink-400 border-pink-400/50'
}

function SlotCard({ slotIndex, equipped, wardrobe, onEquip, onUnequip }) {
  const slotName = SLOT_NAMES[slotIndex]
  const icon = SLOT_ICONS[slotIndex]
  const colors = SLOT_COLORS[slotIndex]
  
  const equippedItem = wardrobe?.items?.[Number(wardrobe.equippedIndex) - 1]
  const hasEquipped = wardrobe?.equippedIndex > 0n
  
  return (
    <motion.div
      className={`bg-black/30 border rounded-xl p-4 ${colors}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <h3 className="font-medium">{slotName}</h3>
      </div>
      
      <div className="space-y-2">
        {hasEquipped ? (
          <div className="bg-green-600/20 border border-green-600/50 rounded p-2">
            <div className="text-sm text-green-300 mb-1">Currently Equipped</div>
            <div className="text-xs text-gray-300">
              Type ID: {equippedItem?.baseTypeId?.toString()}
            </div>
            <div className="text-xs text-gray-400">
              Bound ID: {equippedItem?.boundId?.toString()}
            </div>
            <button
              onClick={() => onUnequip(slotIndex)}
              className="mt-2 w-full px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white text-xs rounded transition-all"
            >
              Unequip
            </button>
          </div>
        ) : (
          <div className="bg-gray-600/20 border border-gray-600/50 rounded p-2 text-center">
            <div className="text-xs text-gray-400 mb-2">No item equipped</div>
          </div>
        )}
        
        <button
          className="w-full px-3 py-2 bg-purple-600/80 hover:bg-purple-600 text-white text-sm rounded transition-all"
        >
          Manage Wardrobe
        </button>
      </div>
    </motion.div>
  )
}

function WardrobePanel({ selectedSlot, wardrobe, onEquip, onClose }) {
  if (!wardrobe || selectedSlot === null) return null
  
  const slotName = SLOT_NAMES[selectedSlot]
  const items = wardrobe.items || []
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-white/10 z-50 overflow-y-auto"
    >
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-purple-300">
            {SLOT_ICONS[selectedSlot]} {slotName} Wardrobe
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          {items.length} item{items.length !== 1 ? 's' : ''} available
        </p>
      </div>
      
      <div className="p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">👗</div>
            <p>No items in this wardrobe slot</p>
            <p className="text-sm mt-1">Bind cosmetics to add them here</p>
          </div>
        ) : (
          items.map((item, index) => {
            const isEquipped = wardrobe.equippedIndex === BigInt(index + 1)
            
            return (
              <motion.div
                key={`${item.boundId}-${index}`}
                className={`p-3 rounded-lg border ${
                  isEquipped 
                    ? 'border-green-400/50 bg-green-400/10' 
                    : 'border-white/10 bg-black/30'
                }`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-white">
                      Type #{item.baseTypeId?.toString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      Bound ID: {item.boundId?.toString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Bound: {new Date(Number(item.boundAt) * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="ml-3">
                    {isEquipped ? (
                      <div className="px-2 py-1 bg-green-600/20 text-green-300 text-xs rounded">
                        Equipped
                      </div>
                    ) : (
                      <button
                        onClick={() => onEquip(selectedSlot, index)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition-all"
                      >
                        Equip
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}

function WalletCosmeticsTab({ raccoonId, onBind }) {
  // Placeholder for wallet cosmetics
  // In a real implementation, you'd load the user's transferable cosmetics
  
  return (
    <div className="p-6 text-center text-gray-400">
      <div className="text-4xl mb-3">💎</div>
      <h3 className="text-lg font-medium mb-2">Wallet Cosmetics</h3>
      <p className="text-sm">
        Your transferable cosmetics would appear here.
      </p>
      <p className="text-xs mt-2">
        Implementation pending: requires cosmetic enumeration or indexing
      </p>
    </div>
  )
}

export default function RaccoonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [activeTab, setActiveTab] = useState('wardrobe') // 'wardrobe' | 'wallet' | 'guide'
  
  const { raccoons, loading: raccoonsLoading } = useRaccoons({
    baseUrl: '/abis',
    chainId
  })
  
  const {
    selectedRaccoonId,
    equipped,
    wardrobes,
    loading,
    ready,
    selectRaccoon,
    equipCosmetic,
    unequipSlot,
    bindCosmetic,
    SLOT_INDICES
  } = useCosmeticsV2Wardrobe({
    baseUrl: '/abis',
    chainId
  })
  
  const raccoon = raccoons.find(r => r.id.toString() === id)
  
  // Auto-select raccoon when found
  useEffect(() => {
    if (raccoon && selectedRaccoonId?.toString() !== id) {
      selectRaccoon(BigInt(id))
    }
  }, [raccoon, selectedRaccoonId, id, selectRaccoon])
  
  const handleEquip = async (slotIndex, itemIndex) => {
    await equipCosmetic(slotIndex, itemIndex)
    setSelectedSlot(null) // Close panel
  }
  
  const handleUnequip = async (slotIndex) => {
    await unequipSlot(slotIndex)
  }
  
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-purple-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-purple-300 mb-4">Connect Wallet</h1>
          <p className="text-gray-300">Please connect your wallet to view raccoon details</p>
        </div>
      </div>
    )
  }
  
  if (raccoonsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-purple-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading raccoon...</p>
        </div>
      </div>
    )
  }
  
  if (!raccoon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-purple-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Raccoon Not Found</h1>
          <p className="text-gray-300 mb-6">
            Raccoon #{id} was not found in your collection
          </p>
          <button
            onClick={() => navigate('/raccoons')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all"
          >
            Back to Gallery
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-purple-950 text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/raccoons')}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-purple-300">
              {raccoon.name}
            </h1>
            <p className="text-gray-400">Raccoon #{raccoon.id.toString()}</p>
          </div>
        </div>
        
        {loading && (
          <div className="flex items-center gap-2 text-purple-300 mb-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
            <span className="text-sm">Loading wardrobe...</span>
          </div>
        )}
      </div>
      
      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left Panel - Slots */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-purple-300 mb-4">Cosmetic Slots</h2>
            {Object.entries(SLOT_INDICES).map(([name, index]) => (
              <div key={name}>
                <SlotCard
                  slotIndex={index}
                  equipped={equipped?.[index]}
                  wardrobe={wardrobes[index]}
                  onEquip={handleEquip}
                  onUnequip={handleUnequip}
                />
                <button
                  onClick={() => setSelectedSlot(index)}
                  className="mt-2 w-full px-3 py-1 text-sm text-purple-300 hover:text-purple-200 transition-all"
                >
                  Manage {SLOT_NAMES[index]} →
                </button>
              </div>
            ))}
          </div>
          
          {/* Center Panel - Preview */}
          <div className="bg-black/30 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-purple-300 mb-6 text-center">
              Raccoon Preview
            </h2>
            
            <div className="flex flex-col items-center">
              <div className="relative w-64 h-64 mb-6">
                <img
                  src={raccoon.image}
                  alt={raccoon.name}
                  className="w-full h-full object-cover rounded-xl border-2 border-purple-400/50"
                />
                
                {/* Equipped Items Overlay */}
                {equipped && equipped.some(id => id > 0n) && (
                  <div className="absolute -top-2 -right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                    {equipped.filter(id => id > 0n).length} equipped
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-white mb-2">
                  {raccoon.name}
                </h3>
                <div className="text-sm text-gray-400">
                  {raccoon.description || 'A unique raccoon in the Rot & Ritual universe'}
                </div>
              </div>
              
              {/* Current Equipment Status */}
              {equipped && (
                <div className="mt-6 w-full">
                  <h4 className="text-sm font-medium text-purple-300 mb-3">Current Equipment</h4>
                  <div className="space-y-2">
                    {Object.entries(SLOT_INDICES).map(([name, index]) => {
                      const equippedId = equipped[index]
                      return (
                        <div key={name} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">
                            {SLOT_ICONS[index]} {SLOT_NAMES[index]}:
                          </span>
                          <span className={equippedId > 0n ? 'text-green-400' : 'text-gray-500'}>
                            {equippedId > 0n ? `Type #${equippedId.toString()}` : 'None'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Panel - Tabs */}
          <div className="bg-black/30 border border-white/10 rounded-xl">
            {/* Tab Headers */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('wardrobe')}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  activeTab === 'wardrobe'
                    ? 'text-purple-300 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                👗 Wardrobe
              </button>
              <button
                onClick={() => setActiveTab('wallet')}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  activeTab === 'wallet'
                    ? 'text-purple-300 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                💎 Wallet
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  activeTab === 'guide'
                    ? 'text-purple-300 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                📖 Guide
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="h-96 overflow-y-auto">
              {activeTab === 'wardrobe' && (
                <div className="p-4 text-center text-gray-400">
                  <div className="text-3xl mb-3">👗</div>
                  <h3 className="text-lg font-medium mb-2">Wardrobe Overview</h3>
                  <p className="text-sm">
                    Click "Manage" next to a slot to view and equip items.
                  </p>
                </div>
              )}
              
              {activeTab === 'wallet' && (
                <WalletCosmeticsTab 
                  raccoonId={raccoon.id}
                  onBind={bindCosmetic}
                />
              )}
              
              {activeTab === 'guide' && (
                <div className="p-4 space-y-4 text-sm">
                  <div>
                    <h4 className="font-medium text-purple-300 mb-2">How It Works</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li>• <strong>Bind:</strong> Convert transferable cosmetics to raccoon-bound items</li>
                      <li>• <strong>Equip:</strong> Apply bound cosmetics to specific slots</li>
                      <li>• <strong>Switch:</strong> Change which cosmetic is equipped per slot</li>
                      <li>• <strong>Unequip:</strong> Remove cosmetics (they stay in wardrobe)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-purple-300 mb-2">Slots</h4>
                    <ul className="space-y-1 text-gray-300">
                      {Object.entries(SLOT_INDICES).map(([name, index]) => (
                        <li key={name}>
                          • {SLOT_ICONS[index]} <strong>{SLOT_NAMES[index]}:</strong> {name.toLowerCase()} cosmetics
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Wardrobe Panel */}
      <AnimatePresence>
        {selectedSlot !== null && (
          <WardrobePanel
            selectedSlot={selectedSlot}
            wardrobe={wardrobes[selectedSlot]}
            onEquip={handleEquip}
            onClose={() => setSelectedSlot(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}