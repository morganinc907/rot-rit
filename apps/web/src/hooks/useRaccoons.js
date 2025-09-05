import { useState, useEffect, useCallback } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { createRitualContract } from '../lib/ritualContracts'
import useContracts from './useContracts.tsx'

export default function useRaccoons({ baseUrl = '/abis', chainId }) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { contracts } = useContracts()
  
  const [raccoons, setRaccoons] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const loadRaccoons = useCallback(async () => {
    console.log('🦝 useRaccoons loadRaccoons called with:', { 
      address, 
      chainId, 
      raccoons: contracts?.Raccoons,
      hasPublicClient: !!publicClient,
      hasContracts: !!contracts
    })
    
    if (!address) {
      console.log('🦝 No address, setting empty raccoons')
      setRaccoons([])
      return
    }
    
    if (!publicClient) {
      console.log('🦝 No publicClient, setting empty raccoons') 
      setRaccoons([])
      return
    }
    
    if (!contracts?.Raccoons) {
      console.log('🦝 No raccoons contract address, setting empty raccoons')
      setRaccoons([])
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🦝 Creating raccoons contract with address:', contracts.Raccoons)
      
      // Create raccoons contract with correct address override
      const raccoonsContract = await createRitualContract({
        name: 'Raccoons',
        client: publicClient,
        chainId,
        baseUrl,
        addressOverride: contracts.Raccoons
      })
      
      console.log('🦝 Contract created, calling balanceOf for address:', address)
      
      // Get balance
      const balance = await raccoonsContract.read.balanceOf([address])
      const balanceNumber = Number(balance)
      
      console.log('🦝 Balance result:', balance, 'as number:', balanceNumber)
      
      if (balanceNumber === 0) {
        console.log('🦝 Balance is 0, setting empty raccoons')
        setRaccoons([])
        setLoading(false)
        return
      }
      
      console.log('🦝 Found', balanceNumber, 'raccoons, getting token IDs...')
      
      // Get all token IDs
      const tokenIds = []
      for (let i = 0; i < balanceNumber; i++) {
        const tokenId = await raccoonsContract.read.tokenOfOwnerByIndex([address, BigInt(i)])
        tokenIds.push(tokenId)
      }
      
      // Get metadata for each token
      const raccoonData = await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            const tokenURI = await raccoonsContract.read.tokenURI([tokenId])
            
            // Fetch metadata with cache-busting
            let metadata = {}
            if (tokenURI) {
              try {
                // Add timestamp to prevent caching issues
                const cacheBuster = `?t=${Date.now()}&refresh=true`
                const fetchURL = tokenURI.includes('?') ? `${tokenURI}&t=${Date.now()}` : `${tokenURI}${cacheBuster}`
                
                console.log(`🔄 Fetching fresh metadata for token ${tokenId}: ${fetchURL}`)
                const response = await fetch(fetchURL, {
                  cache: 'no-cache',
                  headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                  }
                })
                if (response.ok) {
                  metadata = await response.json()
                  console.log(`✅ Got metadata for token ${tokenId}:`, metadata.name)
                }
              } catch (metadataError) {
                console.warn(`Failed to fetch metadata for token ${tokenId}:`, metadataError)
              }
            }
            
            return {
              id: tokenId,
              name: metadata.name || `Raccoon #${tokenId}`,
              image: metadata.image || '/placeholder-raccoon.png',
              description: metadata.description || '',
              attributes: metadata.attributes || [],
              tokenURI
            }
          } catch (tokenError) {
            console.error(`Error processing token ${tokenId}:`, tokenError)
            return {
              id: tokenId,
              name: `Raccoon #${tokenId}`,
              image: '/placeholder-raccoon.png',
              description: '',
              attributes: [],
              tokenURI: null
            }
          }
        })
      )
      
      setRaccoons(raccoonData.sort((a, b) => Number(a.id) - Number(b.id)))
      
    } catch (err) {
      console.error('🦝 Error loading raccoons:', err)
      setError(err.message || 'Failed to load raccoons')
      setRaccoons([])
    } finally {
      setLoading(false)
    }
  }, [address, publicClient, chainId, baseUrl, contracts?.Raccoons])
  
  // Load raccoons when dependencies change
  useEffect(() => {
    loadRaccoons()
  }, [loadRaccoons])
  
  const refetch = useCallback(() => {
    return loadRaccoons()
  }, [loadRaccoons])
  
  return {
    raccoons,
    loading,
    error,
    refetch
  }
}