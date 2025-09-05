import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useChainId } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import useRaccoons from '../hooks/useRaccoons'

export default function RaccoonGallery() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  
  const { raccoons, loading, error } = useRaccoons({
    baseUrl: '/abis',
    chainId
  })
  
  // Filter raccoons based on search
  const filteredRaccoons = raccoons.filter(raccoon => 
    raccoon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    raccoon.id.toString().includes(searchTerm)
  )
  
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-purple-950">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-purple-300 mb-4">🦝 Raccoon Gallery</h1>
          <p className="text-gray-300 text-lg">Connect your wallet to view your raccoons</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-purple-950 text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-purple-300 mb-2">
              🦝 Your Raccoons
            </h1>
            <p className="text-gray-300">
              {loading ? 'Loading...' : `${raccoons.length} raccoon${raccoons.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          
          {/* Search */}
          <div className="relative max-w-md w-full md:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search raccoons..."
              className="w-full px-4 py-2 pl-10 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            />
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <span className="text-lg text-gray-300">Loading your raccoons...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="text-center py-12">
            <div className="text-red-400 text-lg mb-2">Failed to load raccoons</div>
            <div className="text-gray-400">{error}</div>
          </div>
        )}
        
        {!loading && !error && raccoons.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🦝</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No raccoons yet</h2>
            <p className="text-gray-400 mb-6">You don't own any raccoons on this network</p>
            <button
              onClick={() => navigate('/store')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all"
            >
              Visit Store
            </button>
          </div>
        )}
        
        {!loading && filteredRaccoons.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">
              No raccoons found matching "{searchTerm}"
            </div>
          </div>
        )}
        
        {/* Raccoons Grid */}
        {!loading && filteredRaccoons.length > 0 && (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {filteredRaccoons.map((raccoon, index) => (
              <motion.div
                key={raccoon.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="group cursor-pointer"
                onClick={() => navigate(`/raccoons/${raccoon.id}`)}
              >
                <div className="bg-black/30 border border-white/10 rounded-xl overflow-hidden hover:border-purple-400/50 transition-all duration-200 hover:transform hover:scale-105">
                  <div className="relative aspect-square">
                    <img
                      src={raccoon.image}
                      alt={raccoon.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/placeholder-raccoon.png'
                      }}
                    />
                    
                    {/* ID Badge */}
                    <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
                      #{raccoon.id.toString()}
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="text-white font-medium">View Details</div>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h3 className="font-medium text-white truncate mb-1">
                      {raccoon.name}
                    </h3>
                    
                    {raccoon.attributes && raccoon.attributes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {raccoon.attributes.slice(0, 2).map((attr, i) => (
                          <span
                            key={i}
                            className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded"
                          >
                            {attr.trait_type}: {attr.value}
                          </span>
                        ))}
                        {raccoon.attributes.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{raccoon.attributes.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    {(!raccoon.attributes || raccoon.attributes.length === 0) && (
                      <div className="text-xs text-gray-400">
                        Classic Raccoon
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}