import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi';
import { readContract } from '@wagmi/core';
import { toast } from 'react-hot-toast';
import { generateMockRaccoons, generateMockCosmetics } from "../utils/mockAssets";
import useContracts from './useContracts.tsx';
import useCultists from './useCultists';
import useDemons from './useDemons';
import useDeadRaccoons from './useDeadRaccoons';

const DEV_MODE = false; // <--- back to live contracts

// CosmeticsV2 ABI - updated for new contract
const COSMETICS_V2_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' },
      { name: 'id', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
  },
  {
    name: 'getCosmeticInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'typeId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'imageURI', type: 'string', internalType: 'string' },
      { name: 'previewLayerURI', type: 'string', internalType: 'string' },
      { name: 'rarity', type: 'uint8', internalType: 'uint8' },
      { name: 'slot', type: 'uint8', internalType: 'enum CosmeticsV2.Slot' },
      { name: 'active', type: 'bool', internalType: 'bool' },
      { name: 'currentSupply', type: 'uint256', internalType: 'uint256' },
      { name: 'maxSupply', type: 'uint256', internalType: 'uint256' }
    ],
  },
  {
    name: 'getEquippedCosmetics',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'raccoonId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'headTypeId', type: 'uint256', internalType: 'uint256' },
      { name: 'faceTypeId', type: 'uint256', internalType: 'uint256' },
      { name: 'bodyTypeId', type: 'uint256', internalType: 'uint256' },
      { name: 'colorTypeId', type: 'uint256', internalType: 'uint256' },
      { name: 'backgroundTypeId', type: 'uint256', internalType: 'uint256' }
    ],
  },
  {
    name: 'getWardrobeSlot',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'raccoonId', type: 'uint256', internalType: 'uint256' },
      { name: 'slot', type: 'uint8', internalType: 'enum CosmeticsV2.Slot' }
    ],
    outputs: [
      {
        name: 'items',
        type: 'tuple[]',
        components: [
          { name: 'baseTypeId', type: 'uint256', internalType: 'uint256' },
          { name: 'boundId', type: 'uint256', internalType: 'uint256' },
          { name: 'boundAt', type: 'uint256', internalType: 'uint256' }
        ]
      }
    ],
  },
  {
    name: 'bindToRaccoon',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'raccoonId', type: 'uint256', internalType: 'uint256' },
      { name: 'typeId', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
  },
  {
    name: 'equipCosmetic',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'raccoonId', type: 'uint256', internalType: 'uint256' },
      { name: 'slot', type: 'uint8', internalType: 'enum CosmeticsV2.Slot' },
      { name: 'itemIndex', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
  },
  {
    name: 'unequipSlot',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'raccoonId', type: 'uint256', internalType: 'uint256' },
      { name: 'slot', type: 'uint8', internalType: 'enum CosmeticsV2.Slot' }
    ],
    outputs: [],
  }
];

// CosmeticsV2 address now comes from useContracts hook

// Simple Raccoons ABI for fetching metadata
const RACCOONS_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'totalMinted',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

// Slot configuration for cosmetics
const SLOT_CONFIG = {
  0: { name: "HEAD", icon: "👑", color: "text-blue-400" },
  1: { name: "FACE", icon: "👀", color: "text-green-400" },
  2: { name: "BODY", icon: "👕", color: "text-purple-400" },
  3: { name: "COLOR", icon: "🎨", color: "text-yellow-400" },
  4: { name: "BACKGROUND", icon: "🌟", color: "text-pink-400" },
};

export function useCosmeticsV2() {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const { contracts, isSupported } = useContracts();
  const { cultists: realCultists } = useCultists();
  const { demons: realDemons } = useDemons();
  const { deadRaccoons: realDeadRaccoons } = useDeadRaccoons();
  
  const [cosmetics, setCosmetics] = useState([]);
  const [raccoons, setRaccoons] = useState([]);
  const [equipped, setEquipped] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { writeContract, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  // Helper function to convert IPFS URLs to HTTP URLs
  const resolveIPFS = (uri) => {
    if (!uri) return '';
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    return uri;
  };

  // Get cosmetic info from contract
  const getCosmeticInfo = useCallback(async (typeId) => {
    try {
      const result = await readContract(config, {
        address: contracts.Cosmetics,
        abi: COSMETICS_V2_ABI,
        functionName: 'getCosmeticInfo',
        args: [BigInt(typeId)]
      });
      
      const [name, description, imageURI, slot, rarity, supply, unlimited] = result;
      
      return {
        name,
        description,
        imageURI,
        slot: Number(slot),
        rarity: Number(rarity),
        supply: Number(supply),
        unlimited
      };
    } catch (error) {
      console.error('Error fetching cosmetic info:', error);
      return null;
    }
  }, [config, contracts]);

  // Fetch real raccoon data from contracts
  const fetchRealRaccoons = useCallback(async () => {
    console.log("🦝 fetchRealRaccoons called with:", {
      isConnected,
      address,
      racconsContract: contracts?.Raccoons,
      isSupported
    });
    
    if (!isConnected || !address || !contracts?.Raccoons || !isSupported) {
      console.log("🦝 Early return - missing requirements");
      setRaccoons([]);
      return;
    }

    try {
      console.log("🦝 Fetching real raccoons from contract:", contracts.Raccoons);
      
      // Get user's raccoon balance
      const balance = await readContract(config, {
        address: contracts.Raccoons,
        abi: RACCOONS_ABI,
        functionName: 'balanceOf',
        args: [address]
      });

      console.log("User raccoon balance:", Number(balance));
      
      if (balance === 0n) {
        setRaccoons([]);
        return;
      }

      const userRaccoons = [];
      
      // Get total minted to know range to check
      const totalMinted = await readContract(config, {
        address: contracts.Raccoons,
        abi: RACCOONS_ABI,
        functionName: 'totalMinted',
      });

      console.log(`Total minted tokens: ${totalMinted}`);
      
      // Check each token from 1 to totalMinted to see if user owns it
      for (let tokenId = 1; tokenId <= Number(totalMinted) && userRaccoons.length < Number(balance); tokenId++) {
        try {
          // Check if user owns this token
          const owner = await readContract(config, {
            address: contracts.Raccoons,
            abi: [...RACCOONS_ABI, {
              name: 'ownerOf',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'tokenId', type: 'uint256' }],
              outputs: [{ name: '', type: 'address' }],
            }],
            functionName: 'ownerOf',
            args: [BigInt(tokenId)]
          });
          
          if (owner.toLowerCase() !== address.toLowerCase()) {
            continue; // User doesn't own this token
          }
          
          console.log(`✅ User owns token #${tokenId}`);

          // Get token URI (metadata)
          const tokenURI = await readContract(config, {
            address: contracts.Raccoons,
            abi: RACCOONS_ABI,
            functionName: 'tokenURI',
            args: [tokenId]
          });

          console.log(`Token #${tokenId} URI:`, tokenURI);

          // Fetch metadata using tokenURI from contract (supports dynamic states!)
          try {
            // Use the tokenURI from the contract - this will return correct metadata for cult/dead states
            console.log(`🦝 Fetching metadata for token ${tokenId} from tokenURI: ${tokenURI}`);
            
            // Convert IPFS URL to HTTPS if needed
            let httpTokenURI = tokenURI;
            if (tokenURI.startsWith('ipfs://')) {
              httpTokenURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
              console.log(`🔄 Converted IPFS URL to: ${httpTokenURI}`);
            }
            
            // Add cache busting to force fresh metadata
            const cacheBuster = `?t=${Date.now()}&refresh=true`;
            const fetchURL = httpTokenURI.includes('?') ? `${httpTokenURI}&t=${Date.now()}` : `${httpTokenURI}${cacheBuster}`;
            
            const response = await fetch(fetchURL, {
              cache: 'no-cache'
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const metadata = await response.json();
            console.log(`✅ Metadata loaded for token ${tokenId}:`, metadata);
            
            // Handle image URL - convert to proper HTTPS URL
            let imageUrl = metadata.image || "";
            if (imageUrl.startsWith('ipfs://')) {
              // Convert ipfs:// to https://
              imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
            } else if (imageUrl.startsWith('../images/')) {
              // Handle relative paths like "../images/4.png" - resolve to correct images IPFS
              const filename = imageUrl.replace('../images/', '');
              imageUrl = `https://ipfs.io/ipfs/bafybeiaxmevcthi76k45i6buodpefmoavhdxdnsxrmliedytkzk4n2zt24/${filename}`;
              console.log(`🔧 Resolved relative path to: ${imageUrl}`);
            } else if (imageUrl && !imageUrl.startsWith('http')) {
              // For other relative paths, assume they're in the images IPFS
              const filename = imageUrl.split('/').pop();
              imageUrl = `https://ipfs.io/ipfs/bafybeiaxmevcthi76k45i6buodpefmoavhdxdnsxrmliedytkzk4n2zt24/${filename}`;
              console.log(`🖼️ Resolved image path to: ${imageUrl}`);
            }
            console.log(`🖼️ Image URL for token ${tokenId}: ${imageUrl}`);
            
            userRaccoons.push({
              id: Number(tokenId),
              name: metadata.name || `Raccoon #${tokenId}`,
              description: metadata.description || "",
              image: imageUrl,
              thumbnail: imageUrl,
              traits: metadata.attributes?.reduce((acc, attr) => {
                acc[attr.trait_type.toLowerCase()] = attr.value;
                return acc;
              }, {}) || {}
            });
          } catch (metadataError) {
            console.warn(`Failed to fetch metadata for token ${tokenId}:`, metadataError);
            // Add raccoon with minimal data
            userRaccoons.push({
              id: Number(tokenId),
              name: `Raccoon #${tokenId}`,
              description: "",
              image: "",
              thumbnail: "",
              traits: {}
            });
          }
        } catch (tokenError) {
          console.warn(`Failed to fetch token #${tokenId}:`, tokenError);
          // Continue to next token - this one might not exist or be inaccessible
        }
      }

      console.log("Fetched raccoons:", userRaccoons);
      setRaccoons(userRaccoons);
    } catch (error) {
      console.error('Error fetching real raccoons:', error);
      setRaccoons([]);
    }
  }, [isConnected, address, contracts, isSupported, config]);

  // Get user's cosmetic balances
  const fetchUserCosmetics = useCallback(async () => {
    if (!isConnected || !address || !contracts?.Cosmetics || !isSupported) {
      setCosmetics([]);
      return;
    }

    setLoading(true);
    try {
      const userCosmetics = [];
      
      // This would ideally be fetched from an indexer or API that tracks all cosmetic types
      // For now, we'll check against known cosmetic type IDs (1-100 range)
      const typeIdRange = Array.from({ length: 100 }, (_, i) => i + 1);
      
      for (const typeId of typeIdRange) {
        try {
          // Check user balance for this cosmetic type
          const balance = await readContract(config, {
            address: contracts?.Cosmetics,
            abi: COSMETICS_V2_ABI,
            functionName: 'balanceOf',
            args: [address, BigInt(typeId)],
          });
          
          if (balance > 0n) {
            // Get cosmetic info
            const info = await getCosmeticInfo(typeId);
            if (info) {
              const cosmetic = {
                id: typeId,
                name: info.name,
                image: resolveIPFS(info.imageURI),
                previewLayer: resolveIPFS(info.previewLayerURI),
                rarity: info.rarity,
                slot: info.slot,
                quantity: Number(balance),
                bound: false, // This would need to be determined by checking if it's in any wardrobe
                active: info.active,
              };
              userCosmetics.push(cosmetic);
            }
          }
        } catch (error) {
          // Skip this type if there's an error (likely doesn't exist)
          continue;
        }
      }

      console.log(`🎨 Found ${userCosmetics.length} cosmetics for user`);
      setCosmetics(userCosmetics);
    } catch (error) {
      console.error('Error fetching cosmetics:', error);
      // Fallback to mock data if API fails
      const mockCosmetics = [
        {
          id: 1,
          name: 'Cool Cap',
          image: '/cosmetics/cool-cap.png',
          rarity: 1,
          slot: 0,
          quantity: 1,
          bound: false
        },
        {
          id: 2,
          name: 'Sunglasses',
          image: '/cosmetics/sunglasses.png',
          rarity: 2,
          slot: 1,
          quantity: 1,
          bound: false
        },
      ];
      setCosmetics(mockCosmetics);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, getCosmeticInfo, contracts?.Cosmetics, isSupported, config]);

  useEffect(() => {
    
    if (DEV_MODE) {
      console.log("🧪 [DEV MODE] Loading mock data…");

      const mockRaccoons = generateMockRaccoons(50);
      const mockCosmetics = generateMockCosmetics(150);

      setRaccoons(mockRaccoons);
      setCosmetics(mockCosmetics);
      // Demons, cultists, and deadRaccoons now come from their respective hooks
      return;
    }

    // In production: fetch real data from contracts here
    fetchRealRaccoons();
    fetchUserCosmetics();
    // For now, clear the other collections since we don't have real contracts for them yet
    // Demons and deadRaccoons now come from their respective hooks
  }, [fetchRealRaccoons, fetchUserCosmetics]);

  // Additional useEffect to trigger when contracts become available
  useEffect(() => {
    if (isConnected && address && contracts?.Cosmetics && isSupported && !DEV_MODE) {
      fetchUserCosmetics();
    }
  }, [contracts?.Cosmetics, isSupported, fetchUserCosmetics, isConnected, address]);

  // Real-time blockchain event synchronization
  useEffect(() => {
    if (!isConnected || !address) return;

    // Create contract instance for event listening (this would need proper setup)
    // const contract = new ethers.Contract(contracts?.Cosmetics, COSMETICS_V2_ABI, provider);
    
    const handleCosmeticEquipped = (owner, raccoonId, slot, cosmeticId, event) => {
      if (owner.toLowerCase() === address.toLowerCase()) {
        console.log('Cosmetic equipped event:', { owner, raccoonId, slot, cosmeticId });
        // Refresh cosmetics state
        setTimeout(() => {
          fetchUserCosmetics();
        }, 1000); // Small delay to ensure blockchain state is updated
      }
    };

    const handleCosmeticUnequipped = (owner, raccoonId, slot, event) => {
      if (owner.toLowerCase() === address.toLowerCase()) {
        console.log('Cosmetic unequipped event:', { owner, raccoonId, slot });
        // Refresh cosmetics state
        setTimeout(() => {
          fetchUserCosmetics();
        }, 1000);
      }
    };

    const handleCosmeticBound = (owner, raccoonId, cosmeticId, event) => {
      if (owner.toLowerCase() === address.toLowerCase()) {
        console.log('Cosmetic bound event:', { owner, raccoonId, cosmeticId });
        // Refresh cosmetics state
        setTimeout(() => {
          fetchUserCosmetics();
        }, 1000);
      }
    };

    // TODO: Set up actual event listeners when contract instance is available
    // contract.on("CosmeticEquipped", handleCosmeticEquipped);
    // contract.on("CosmeticUnequipped", handleCosmeticUnequipped);  
    // contract.on("CosmeticBound", handleCosmeticBound);

    // Cleanup function
    return () => {
      // contract.off("CosmeticEquipped", handleCosmeticEquipped);
      // contract.off("CosmeticUnequipped", handleCosmeticUnequipped);
      // contract.off("CosmeticBound", handleCosmeticBound);
    };
  }, [isConnected, address, fetchUserCosmetics]);

  // Get equipped cosmetics for a raccoon
  const { data: equippedData, refetch: refetchEquipped } = useReadContract({
    address: contracts?.Cosmetics,
    abi: COSMETICS_V2_ABI,
    functionName: 'getEquippedCosmetics',
    args: [],
    enabled: false,
  });

  const getEquippedCosmetics = useCallback(async (raccoonId) => {
    if (!raccoonId) return null;
    
    try {
      const result = await refetchEquipped({ args: [BigInt(raccoonId)] });
      const [head, face, body, color, background] = result.data || [0n, 0n, 0n, 0n, 0n];
      
      return {
        HEAD: head === 0n ? null : Number(head),
        FACE: face === 0n ? null : Number(face),
        BODY: body === 0n ? null : Number(body),
        COLOR: color === 0n ? null : Number(color),
        BACKGROUND: background === 0n ? null : Number(background),
      };
    } catch (error) {
      console.error('Error fetching equipped cosmetics:', error);
      return null;
    }
  }, [refetchEquipped]);

  // Get wardrobe cosmetics for a raccoon slot
  const { data: wardrobeData, refetch: refetchWardrobe } = useReadContract({
    address: contracts?.Cosmetics,
    abi: COSMETICS_V2_ABI,
    functionName: 'getWardrobeSlot',
    args: [],
    enabled: false,
  });

  const getWardrobeCosmetics = useCallback(async (raccoonId, slot) => {
    if (!raccoonId || slot === undefined) return [];
    
    try {
      const result = await refetchWardrobe({ args: [BigInt(raccoonId), slot] });
      const items = result.data?.items || [];
      
      return items.map(item => ({
        baseTypeId: Number(item.baseTypeId),
        boundId: Number(item.boundId),
        boundAt: Number(item.boundAt),
      }));
    } catch (error) {
      console.error('Error fetching wardrobe cosmetics:', error);
      return [];
    }
  }, [refetchWardrobe]);

  // Bind cosmetic to raccoon
  const bindCosmetic = useCallback(async (raccoonId, cosmeticId) => {
    if (!writeContract) throw new Error('Wallet not connected');
    
    try {
      await writeContract({
        address: contracts?.Cosmetics,
        abi: COSMETICS_V2_ABI,
        functionName: 'bindToRaccoon',
        args: [BigInt(raccoonId), BigInt(cosmeticId)],
      });
      
      toast.success('Binding cosmetic to raccoon...');
      return true;
    } catch (error) {
      console.error('Error binding cosmetic:', error);
      toast.error('Failed to bind cosmetic');
      throw error;
    }
  }, [writeContract]);

  // Equip cosmetic in slot
  const equipCosmetic = useCallback(async (raccoonId, slot, itemIndex) => {
    if (!writeContract) throw new Error('Wallet not connected');
    
    try {
      await writeContract({
        address: contracts?.Cosmetics,
        abi: COSMETICS_V2_ABI,
        functionName: 'equipCosmetic',
        args: [BigInt(raccoonId), slot, BigInt(itemIndex)],
      });
      
      toast.success('Equipping cosmetic...');
      return true;
    } catch (error) {
      console.error('Error equipping cosmetic:', error);
      toast.error('Failed to equip cosmetic');
      throw error;
    }
  }, [writeContract]);

  // Unequip slot
  const unequipCosmetic = useCallback(async (raccoonId, slot) => {
    if (!writeContract) throw new Error('Wallet not connected');
    
    try {
      await writeContract({
        address: contracts?.Cosmetics,
        abi: COSMETICS_V2_ABI,
        functionName: 'unequipSlot',
        args: [BigInt(raccoonId), slot],
      });
      
      toast.success('Unequipping cosmetic...');
      return true;
    } catch (error) {
      console.error('Error unequipping cosmetic:', error);
      toast.error('Failed to unequip cosmetic');
      throw error;
    }
  }, [writeContract]);

  // Equip multiple cosmetics in batch (optimized for outfit changes)
  const equipMultipleCosmetics = useCallback(async (raccoonId, cosmeticSlotMap) => {
    if (!writeContract) throw new Error('Wallet not connected');
    
    try {
      // For now, we'll handle them sequentially
      // TODO: Implement batch contract call for better gas efficiency
      const results = [];
      
      for (const [slot, itemIndex] of Object.entries(cosmeticSlotMap)) {
        if (itemIndex !== null && itemIndex !== undefined) {
          const result = await writeContract({
            address: contracts?.Cosmetics,
            abi: COSMETICS_V2_ABI,
            functionName: 'equipCosmetic',
            args: [BigInt(raccoonId), parseInt(slot), BigInt(itemIndex)],
          });
          results.push(result);
        }
      }
      
      toast.success('Equipping outfit...');
      return results;
    } catch (error) {
      console.error('Error equipping multiple cosmetics:', error);
      toast.error('Failed to equip outfit');
      throw error;
    }
  }, [writeContract]);

  // Batch equip entire outfit (alternative approach using cosmetic objects)
  const equipOutfitCosmetics = useCallback(async (raccoonId, cosmeticsMap) => {
    if (!writeContract) throw new Error('Wallet not connected');
    
    try {
      const equipPromises = [];
      
      // Convert cosmetics map to slot-based equip calls
      Object.entries(cosmeticsMap).forEach(([slotName, cosmetic]) => {
        if (cosmetic) {
          // Find slot index by slot name
          const slotIndex = Object.keys(SLOT_CONFIG).find(key => SLOT_CONFIG[key].name === slotName);
          if (slotIndex !== undefined) {
            // For now, assume first item in wardrobe (index 0)
            // In a real implementation, you'd need to find the actual item index in the wardrobe
            const promise = writeContract({
              address: contracts?.Cosmetics,
              abi: COSMETICS_V2_ABI,
              functionName: 'equipCosmetic',
              args: [BigInt(raccoonId), parseInt(slotIndex), BigInt(0)],
            });
            equipPromises.push(promise);
          }
        }
      });

      if (equipPromises.length === 0) {
        toast.error('No cosmetics to equip');
        return;
      }

      // Execute all equip calls
      await Promise.all(equipPromises);
      
      toast.success(`Equipped outfit with ${equipPromises.length} cosmetics!`);
      return true;
    } catch (error) {
      console.error('Error equipping outfit cosmetics:', error);
      toast.error('Failed to equip outfit');
      throw error;
    }
  }, [writeContract]);

  return {
    raccoons,
    cosmetics,
    demons: realDemons,
    cultists: realCultists,
    deadRaccoons: realDeadRaccoons,
    equipped,
    setEquipped,
    loading: loading || isPending || isConfirming,
    bindCosmetic,
    equipCosmetic,
    unequipCosmetic,
    equipMultipleCosmetics,
    equipOutfitCosmetics,
    getEquippedCosmetics,
    getWardrobeCosmetics,
    refetch: fetchUserCosmetics,
  };
}